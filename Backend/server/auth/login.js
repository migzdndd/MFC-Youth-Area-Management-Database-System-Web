import { createSupabaseAuthClient, createSupabaseAdmin } from '../_lib/supabase.js';
import { sendJson, methodNotAllowed, normalizeEmail, isValidEmail, apiError, setAuthCookies } from '../_lib/http.js';
import { claimMemberRecord } from '../_lib/member-claim.js';
import { checkRateLimit } from '../_lib/rate-limit.js';
import { checkBruteForce, recordLoginFailure, clearLoginFailures } from '../_lib/brute-force.js';

/**
 * User Sign-In and Session Initialization Handler
 *
 * What it Does: Simple non IT Terms
 * Checks the user's email and password, guards against password guessing attacks, checks
 * if two-factor authentication is required, links their member profile, and logs them in.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');

    if (!isValidEmail(email) || !password) {
      return sendJson(res, 400, { ok: false, error: 'A valid email and password are required.' });
    }

    // Parallel pre-auth validation: rate limiting and brute force checks execute concurrently
    const [rateLimitPassed, bruteForcePassed] = await Promise.all([
      checkRateLimit(req, res, 'login'),
      checkBruteForce(req, res, email)
    ]);
    if (!rateLimitPassed || !bruteForcePassed) return;

    const authClient = createSupabaseAuthClient();
    const { data, error } = await authClient.auth.signInWithPassword({ email, password });

    if (error || !data?.session || !data?.user) {
      if (error?.message && error.message.toLowerCase().includes('email not confirmed')) {
        return sendJson(res, 403, {
          ok: false,
          error: 'Your email address is not verified yet. Please check your inbox for the verification code or link.',
          needsEmailVerification: true,
          email
        });
      }

      const lockout = await recordLoginFailure(email);
      if (lockout?.locked) {
        const remainingMinutes = Math.max(1, Math.ceil((new Date(lockout.lockedUntil).getTime() - Date.now()) / 60000));
        return sendJson(res, 423, {
          ok: false,
          error: `Account temporarily locked due to multiple failed login attempts. Please try again in ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}.`,
          lockedUntil: lockout.lockedUntil
        });
      }
      return sendJson(res, 401, { ok: false, error: 'Invalid email or password.' });
    }

    // Clear failed login history asynchronously in the background (non-blocking)
    clearLoginFailures(email).catch(err => console.warn('Failed to clear login failures:', err?.message || err));

    const admin = createSupabaseAdmin();

    // Concurrently resolve MFA factors (if not included in user payload) and user profile joined record
    const mfaPromise = (data.user?.factors === undefined)
      ? admin.auth.admin.mfa.listFactors({ userId: data.user.id }).catch(err => {
          console.warn('MFA factor listing skipped:', err?.message || err);
          return { data: { factors: [] } };
        })
      : Promise.resolve({ data: { factors: data.user.factors || [] } });

    const profilePromise = admin
      .from('profiles')
      .select('id, member_id, role, area_id, chapter_id, must_change_password, is_active, is_developer, areas(name), members(id, email, first_name, middle_name, last_name)')
      .eq('id', data.user.id)
      .maybeSingle();

    const [factorResult, { data: profile, error: profileError }] = await Promise.all([
      mfaPromise,
      profilePromise
    ]);

    if (profileError) throw profileError;

    const verifiedFactors = (factorResult?.data?.factors || []).filter(f => f.factor_type === 'totp' && f.status === 'verified');
    if (verifiedFactors.length > 0) {
      const factor = verifiedFactors[0];
      return sendJson(res, 200, {
        ok: true,
        mfaRequired: true,
        factorId: factor.id,
        tempSession: {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresAt: data.session.expires_at
        },
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.display_name || data.user.email
        }
      });
    }
    let linkedProfile = profile;
    if (!linkedProfile) {
      if (!data.user.email_confirmed_at) {
        return sendJson(res, 403, { ok: false, error: 'Verify your email address before accessing the Member Portal.' });
      }
      linkedProfile = (await claimMemberRecord({ supabase: admin, user: data.user })).profile;
    }
    if (linkedProfile.is_active === false) {
      return sendJson(res, 403, { ok: false, error: 'This account is not active.' });
    }

    // Resolve area name and linked member from joined row or parallel fallback query
    let areaName = linkedProfile.areas?.name || null;
    let linkedMember = linkedProfile.members || null;

    if ((!areaName && linkedProfile.area_id && !linkedProfile.areas) || (!linkedMember && linkedProfile.member_id)) {
      const areaFallbackPromise = (!areaName && linkedProfile.area_id && !linkedProfile.areas)
        ? admin.from('areas').select('name').eq('id', linkedProfile.area_id).maybeSingle()
        : Promise.resolve({ data: null });

      const memberFallbackPromise = (!linkedMember && linkedProfile.member_id)
        ? admin.from('members').select('id, email, first_name, middle_name, last_name').eq('id', linkedProfile.member_id).maybeSingle()
        : Promise.resolve({ data: null });

      const [areaFallbackRes, memberFallbackRes] = await Promise.all([areaFallbackPromise, memberFallbackPromise]);
      if (areaFallbackRes?.data?.name) areaName = areaFallbackRes.data.name;
      if (memberFallbackRes?.data) linkedMember = memberFallbackRes.data;
    }

    // Non-blocking background email sync if member record email has drifted
    const authEmail = String(data.user.email || '').trim().toLowerCase();
    const currentMemberEmail = String(linkedMember?.email || '').trim().toLowerCase();
    if (linkedMember?.id && authEmail && currentMemberEmail && currentMemberEmail !== authEmail) {
      Promise.resolve(
        admin
          .from('members')
          .update({ email: authEmail, updated_at: new Date().toISOString() })
          .eq('id', linkedMember.id)
      )
        .then(({ error: emailSyncError } = {}) => {
          if (emailSyncError) {
            console.error(JSON.stringify({
              event: 'AUTH_EMAIL_MEMBER_SYNC',
              auth_user_id: data.user.id,
              target_member_id: linkedMember.id,
              timestamp: new Date().toISOString(),
              status: 'FAILURE',
              error_code: 'MEMBER_EMAIL_SYNC_FAILED'
            }));
          }
        })
        .catch(err => console.warn('Member email sync failed:', err?.message || err));
    }

    setAuthCookies(res, {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token
    }, Boolean(req.body?.remember));

    const requiresAreaSelection = !linkedProfile.area_id && linkedProfile.role !== 'member';

    return sendJson(res, 200, {
      ok: true,
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      requiresAreaSelection,
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expiresAt: data.session.expires_at
      },
      user: {
        id: data.user.id,
        email: data.user.email,
        memberId: linkedProfile.member_id,
        member_id: linkedProfile.member_id,
        first_name: linkedMember?.first_name || data.user.user_metadata?.first_name || '',
        middle_name: linkedMember?.middle_name ?? data.user.user_metadata?.middle_name ?? null,
        last_name: linkedMember?.last_name || data.user.user_metadata?.last_name || '',
        name: linkedMember
          ? [linkedMember.first_name, linkedMember.middle_name, linkedMember.last_name].filter(Boolean).join(' ')
          : (data.user.user_metadata?.display_name || data.user.email),
        role: linkedProfile.role,
        areaId: linkedProfile.area_id,
        area_id: linkedProfile.area_id,
        areaName,
        area_name: areaName,
        chapterId: linkedProfile.chapter_id,
        chapter_id: linkedProfile.chapter_id,
        mustChangePassword: linkedProfile.must_change_password,
        is_developer: Boolean(linkedProfile.is_developer),
        requiresAreaSelection
      }
    });
  } catch (error) {
    return apiError(res, error);
  }
}
