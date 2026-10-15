/**
 * Servant Leader and Admin Registration Handler
 *
 * What it Does: Simple non IT Terms
 * Allows approved youth leaders and administrators to create their official management portal
 * accounts using an authorized secret registration code provided by the youth coordinators.
 */

import { timingSafeEqual } from 'node:crypto';
import { createSupabaseAdmin, createSupabaseAuthClient } from '../_lib/supabase.js';
import { assertAdminRegistrationConfigured } from '../_lib/env.js';
import { sendJson, methodNotAllowed, normalizeEmail, isValidEmail, apiError, passwordError, setAuthCookies } from '../_lib/http.js';
import { checkRateLimit } from '../_lib/rate-limit.js';
import { ensureLeadershipMemberRecord } from '../_lib/member-link.js';
import { resolveOrCreateArea } from '../_lib/area-setup.js';

const ALLOWED_ADMIN_ROLES = new Set([
  'couple_coordinator',
  'area_servant',
  'lit_servant',
  'campus_servant',
  'mfc_high_servant',
  'area_kids_servant',
  'chapter_servant'
]);

/**
 * Clean User Input Text
 *
 * What it does:
 * Strips whitespace and caps string length to prevent oversized database entries.
 *
 * Backup plan if it breaks:
 * Returns an empty string if given null or undefined.
 */
function cleanText(value, max = 160) {
  return String(value || '').trim().slice(0, max);
}


/**
 * Securely Verify Admin Registration Passcode
 *
 * What it does:
 * Compares the entered administrative secret code against the system's expected code using constant-time comparison to prevent timing attacks.
 *
 * Backup plan if it breaks:
 * If lengths differ or input is empty, safely returns false immediately.
 */
function registrationCodeMatches(input, expected) {
  const supplied = Buffer.from(String(input || ''), 'utf8');
  const target = Buffer.from(String(expected || ''), 'utf8');
  if (!supplied.length || supplied.length !== target.length) return false;
  return timingSafeEqual(supplied, target);
}

/**
 * Tag Registration Error with Specific Phase
 *
 * What it does:
 * Labels an error with the exact phase of registration where it occurred (e.g. user creation vs. profile creation) to help diagnose issues.
 *
 * Backup plan if it breaks:
 * Ensures the error is wrapped in a standard Error object so properties can be added safely.
 */
function stageError(error, stage, code) {
  const wrapped = error instanceof Error ? error : new Error(String(error || 'Unknown backend error.'));
  wrapped.stage = stage;
  wrapped.code = wrapped.code || code;
  return wrapped;
}

/**
 * Register New Servant Leader Account
 *
 * What it does:
 * Verifies the invitation passcode, validates password strength, creates the login credentials, initializes a leader profile, and signs the user in.
 *
 * Backup plan if it breaks:
 * If an account with the email already exists, it stops with a 409 conflict message. If profile setup fails after creating the user, it immediately deletes the created user account to avoid half-finished records.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  if (!await checkRateLimit(req, res, 'admin-register')) return;

  try {
    const { adminRegistrationCode } = assertAdminRegistrationConfigured();
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');
    const confirmation = String(req.body?.confirmPassword || req.body?.confirm_password || req.body?.password || '');
    const verificationCode = String(
      req.body?.verificationCode ||
      req.body?.area_passcode ||
      req.body?.passcode ||
      req.body?.code ||
      ''
    );
    const firstName = cleanText(req.body?.first_name, 80);
    const middleName = cleanText(req.body?.middle_name || req.body?.middleName, 80) || null;
    const lastName = cleanText(req.body?.last_name, 80);
    const displayName = cleanText(
      req.body?.displayName || (firstName || lastName ? [firstName, middleName, lastName].filter(Boolean).join(' ') : ''),
      160
    );
    const role = String(req.body?.role || '').trim().toLowerCase();

    if (!displayName) {
      return sendJson(res, 400, { ok: false, error: 'Enter your full name.' });
    }
    if (!isValidEmail(email)) {
      return sendJson(res, 400, { ok: false, error: 'Enter a valid email address.' });
    }

    if (role === 'national_coordinator') {
      const nationalCode = String(process.env.NATIONAL_COORDINATOR_REGISTRATION_CODE || '').trim();
      if (!nationalCode || !registrationCodeMatches(verificationCode, nationalCode)) {
        return sendJson(res, 403, {
          ok: false,
          error: 'Registration for National Coordinator requires dedicated secondary authorization.'
        });
      }
    } else {
      if (!ALLOWED_ADMIN_ROLES.has(role)) {
        return sendJson(res, 400, { ok: false, error: 'Select a valid Servant Leader access level.' });
      }
      const validCodes = [
        adminRegistrationCode,
        process.env.AREA_PASSCODE,
        process.env.ADMIN_PASSCODE,
        process.env.VITE_AREA_PASSCODE,
      ].filter(Boolean);
      const isAuthorized = validCodes.some((code) => registrationCodeMatches(verificationCode, code));
      if (!isAuthorized) {
        return sendJson(res, 403, { ok: false, error: 'Invalid Area Passcode. Please check with your Area Servant or Coordinator.' });
      }
    }

    const pError = passwordError(password);
    if (pError) return sendJson(res, 400, { ok: false, error: pError });
    if (password !== confirmation) {
      return sendJson(res, 400, { ok: false, error: 'Passwords do not match.' });
    }

    const areaId = cleanText(req.body?.area_id || req.body?.areaId, 64);
    const newAreaName = cleanText(
      req.body?.new_area_name || req.body?.newAreaName || req.body?.area_name || req.body?.areaName,
      120
    );

    const admin = createSupabaseAdmin();
    let createdUserId = null;
    let createdAreaId = null;
    let targetArea = null;

    try {
      const { targetArea: resolvedArea, createdAreaId: newCreatedAreaId } = await resolveOrCreateArea({
        admin,
        areaId,
        newAreaName
      });
      targetArea = resolvedArea;
      createdAreaId = newCreatedAreaId;

      let authUser = null;
      const { data: authData, error: authError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
        user_metadata: {
          display_name: displayName,
          first_name: firstName || displayName.split(' ')[0] || '',
          middle_name: middleName,
          last_name: lastName || displayName.split(' ').slice(1).join(' ') || '',
          registration_type: 'servant_leader',
          password_origin: 'self_chosen'
        }
      });

      if (authError || !authData?.user) {
        const message = String(authError?.message || '');
        if (message.toLowerCase().includes('already') || message.toLowerCase().includes('registered')) {
          // Check if existing user is unconfirmed to allow re-verifying
          const { data: usersList } = await admin.auth.admin.listUsers();
          const existing = (usersList?.users || []).find(u => u.email?.toLowerCase() === email.toLowerCase());

          if (existing) {
            // Check if user already has an established leader profile
            const { data: existingProfile } = await admin
              .from('profiles')
              .select('id, is_active')
              .eq('id', existing.id)
              .maybeSingle();

            if (existingProfile) {
              return sendJson(res, 409, { ok: false, error: 'An account with this email already exists. Please sign in.' });
            }

            // User exists from pre-verification: update chosen password and user metadata
            const { data: updatedUserData, error: updateError } = await admin.auth.admin.updateUserById(existing.id, {
              password,
              user_metadata: {
                display_name: displayName,
                first_name: firstName || displayName.split(' ')[0] || '',
                middle_name: middleName,
                last_name: lastName || displayName.split(' ').slice(1).join(' ') || '',
                registration_type: 'servant_leader',
                password_origin: 'self_chosen'
              }
            });
            if (updateError) throw updateError;
            authUser = updatedUserData?.user || existing;
            createdUserId = existing.id;
          } else {
            return sendJson(res, 409, { ok: false, error: 'An account with this email already exists.' });
          }
        } else {
          throw stageError(authError || new Error('Unable to create the account.'), 'auth_user_creation', 'AUTH_USER_CREATION_FAILED');
        }
      } else {
        authUser = authData.user;
        createdUserId = authData.user.id;
      }

      const { data: createdProfile, error: profileError } = await admin
        .from('profiles')
        .upsert({
          id: createdUserId,
          member_id: null,
          role,
          area_id: targetArea?.id || null,
          chapter_id: null,
          must_change_password: false,
          is_active: true
        })
        .select('*')
        .single();

      if (profileError) {
        throw stageError(profileError, 'profile_creation', 'PROFILE_CREATION_FAILED');
      }

      if (authUser?.email_confirmed_at) {
        // Pre-verified user: establish session immediately
        const authClient = createSupabaseAuthClient();
        try {
          const { data: signInData, error: signInError } = await authClient.auth.signInWithPassword({
            email,
            password
          });

          if (!signInError && signInData?.session) {
            setAuthCookies(res, {
              accessToken: signInData.session.access_token,
              refreshToken: signInData.session.refresh_token
            });

            return sendJson(res, 201, {
              ok: true,
              requiresEmailVerification: false,
              email,
              session: {
                accessToken: signInData.session.access_token,
                refreshToken: signInData.session.refresh_token,
                access_token: signInData.session.access_token,
                refresh_token: signInData.session.refresh_token,
              },
              user: {
                id: createdUserId,
                email,
                name: displayName,
                role: createdProfile.role,
                area_id: targetArea?.id || null,
                areaName: targetArea?.name || null,
              },
              area: targetArea,
              message: `Account created successfully! Welcome, ${displayName}.`
            });
          }
        } catch (signInErr) {
          console.warn('Pre-verified user initial sign-in warning:', signInErr?.message || signInErr);
        }
      }

      // Dispatch real verification email with confirmation code / link via Supabase Auth
      const authClient = createSupabaseAuthClient();
      const originHeader = req.headers?.origin || req.headers?.referer;
      let emailRedirectTo = null;
      if (originHeader) {
        try {
          const parsed = new URL(originHeader);
          emailRedirectTo = `${parsed.protocol}//${parsed.host}/register`;
        } catch {
          // Ignore invalid URL
        }
      }
      try {
        const { error: resendError } = await authClient.auth.resend({
          type: 'signup',
          email,
          ...(emailRedirectTo ? { options: { emailRedirectTo } } : {})
        });
        if (resendError) {
          console.warn('Initial signup verification email dispatch warning:', resendError?.message || resendError);
        }
      } catch (emailErr) {
        console.warn('Initial signup email trigger error:', emailErr?.message || emailErr);
      }

      return sendJson(res, 201, {
        ok: true,
        requiresEmailVerification: true,
        email,
        areaId: targetArea?.id || null,
        areaName: targetArea?.name || null,
        message: `A 6-digit verification code has been sent to ${email}. Please check your email to complete registration.`
      });
    } catch (error) {
      if (createdUserId) {
        try {
          await admin.auth.admin.deleteUser(createdUserId);
        } catch {
          // Cleanup failure must not replace the original registration error.
        }
      }
      if (createdAreaId) {
        try {
          await admin.from('areas').delete().eq('id', createdAreaId);
        } catch {
          // Cleanup failure must not replace the original registration error.
        }
      }
      throw error;
    }
  } catch (error) {
    return apiError(res, error);
  }
}
