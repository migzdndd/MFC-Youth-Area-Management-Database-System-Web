import { timingSafeEqual } from 'node:crypto';
import { createSupabaseAdmin, createSupabaseAuthClient } from '../_lib/supabase.js';
import { assertAdminRegistrationConfigured } from '../_lib/env.js';
import { sendJson, methodNotAllowed, normalizeEmail, isValidEmail, apiError } from '../_lib/http.js';
import { checkRateLimit } from '../_lib/rate-limit.js';

const ADMIN_ROLES = new Set([
  'national_coordinator',
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
 * Validate Password Security Strength
 *
 * What it does:
 * Checks that the chosen password is at least 8 characters long and includes both letters and numbers.
 *
 * Backup plan if it breaks:
 * Returns a friendly explanation of the missing password requirements if too simple, or an empty string if valid.
 */
function passwordError(password) {
  if (password.length < 8) return 'Password must be at least 8 characters long.';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Password must contain at least one letter and one number.';
  }
  return '';
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
    const confirmation = String(req.body?.confirmPassword || '');
    const verificationCode = String(req.body?.verificationCode || '');
    const displayName = cleanText(req.body?.displayName, 160);
    const role = String(req.body?.role || '').trim().toLowerCase();

    if (!displayName) {
      return sendJson(res, 400, { ok: false, error: 'Enter your full name.' });
    }
    if (!isValidEmail(email)) {
      return sendJson(res, 400, { ok: false, error: 'Enter a valid email address.' });
    }
    if (!ADMIN_ROLES.has(role)) {
      return sendJson(res, 400, { ok: false, error: 'Select a valid Servant Leader access level.' });
    }
    if (!registrationCodeMatches(verificationCode, adminRegistrationCode)) {
      return sendJson(res, 403, { ok: false, error: 'Administrator registration verification failed.' });
    }

    const pError = passwordError(password);
    if (pError) return sendJson(res, 400, { ok: false, error: pError });
    if (password !== confirmation) {
      return sendJson(res, 400, { ok: false, error: 'Passwords do not match.' });
    }

    const admin = createSupabaseAdmin();
    let createdUserId = null;

    try {
      const { data: authData, error: authError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          display_name: displayName,
          registration_type: 'servant_leader',
          password_origin: 'self_chosen'
        }
      });

      if (authError || !authData?.user) {
        const message = String(authError?.message || '');
        if (message.toLowerCase().includes('already') || message.toLowerCase().includes('registered')) {
          return sendJson(res, 409, { ok: false, error: 'An account with this email already exists.' });
        }
        throw stageError(authError || new Error('Unable to create the account.'), 'auth_user_creation', 'AUTH_USER_CREATION_FAILED');
      }

      createdUserId = authData.user.id;

      const { error: profileError } = await admin
        .from('profiles')
        .insert({
          id: createdUserId,
          member_id: null,
          role,
          area_id: null,
          chapter_id: null,
          must_change_password: false,
          is_active: true
        });

      if (profileError) {
        throw stageError(profileError, 'profile_creation', 'PROFILE_CREATION_FAILED');
      }

      const authClient = createSupabaseAuthClient();
      const { data: signInData, error: signInError } = await authClient.auth.signInWithPassword({
        email,
        password
      });

      if (signInError || !signInData?.session) {
        throw stageError(signInError || new Error('Account created, but automatic sign-in failed.'), 'automatic_sign_in', 'AUTO_SIGNIN_FAILED');
      }

      return sendJson(res, 201, {
        ok: true,
        requiresAreaSelection: true,
        session: {
          accessToken: signInData.session.access_token,
          refreshToken: signInData.session.refresh_token,
          expiresAt: signInData.session.expires_at
        },
        user: {
          id: createdUserId,
          email,
          name: displayName,
          memberId: null,
          role,
          areaId: null,
          chapterId: null,
          mustChangePassword: false,
          passwordMode: 'self_chosen'
        }
      });
    } catch (error) {
      if (createdUserId) {
        try {
          await admin.auth.admin.deleteUser(createdUserId);
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
