/**
 * Youth Member Account Claim and Registration Handler
 *
 * What it Does: Simple non IT Terms
 * Allows a member who is already listed in the community roster to claim their online account,
 * set a secure password, and connect their login directly to their member profile.
 */

import { createSupabaseAdmin, createSupabaseAuthClient } from '../_lib/supabase.js';
import { requireAuthenticatedUser } from '../_lib/access.js';
import { claimMemberRecord } from '../_lib/member-claim.js';
import { sendJson, methodNotAllowed, normalizeEmail, isValidEmail, apiError, passwordError } from '../_lib/http.js';
import { checkRateLimit } from '../_lib/rate-limit.js';

function escapeLikePattern(value) {
  return String(value).replace(/[\\%_]/g, character => `\\${character}`);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  if (!await checkRateLimit(req, res, 'member-claim')) return;

  try {
    const token = String(req.headers?.authorization || '').replace(/^Bearer\s+/i, '').trim();
    const admin = createSupabaseAdmin();

    if (token) {
      const { user } = await requireAuthenticatedUser(req);
      if (!user.email_confirmed_at) return sendJson(res, 403, { ok: false, error: 'Verify your email address before claiming a Member record.' });
      const result = await claimMemberRecord({ supabase: admin, user });
      return sendJson(res, 200, { ok: true, memberId: result.memberId, alreadyLinked: result.alreadyLinked });
    }

    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');
    if (!isValidEmail(email)) return sendJson(res, 400, { ok: false, error: 'Enter the email address stored in your Member record.' });
    const pError = passwordError(password);
    if (pError) return sendJson(res, 400, { ok: false, error: pError });

    const { data: matchingMember, error: memberLookupError } = await admin
      .from('members')
      .select('id')
      .ilike('email', escapeLikePattern(email))
      .maybeSingle();
    if (memberLookupError) throw memberLookupError;
    if (!matchingMember) {
      return sendJson(res, 404, { ok: false, error: 'No Member record is associated with this email.' });
    }

    const authClient = createSupabaseAuthClient();
    const { data, error } = await authClient.auth.signUp({ email, password });
    if (error || !data?.user) return sendJson(res, 400, { ok: false, error: 'Unable to claim your Member Portal account. Please try again.' });

    if (!data.session) {
      return sendJson(res, 202, {
        ok: true,
        verificationRequired: true,
        message: 'Check your email to verify your Member Portal account, then sign in.'
      });
    }
    if (!data.user.email_confirmed_at) {
      return sendJson(res, 403, { ok: false, error: 'Verify your email address before claiming a Member record.' });
    }

    const result = await claimMemberRecord({ supabase: admin, user: data.user });
    return sendJson(res, 201, {
      ok: true,
      memberId: result.memberId,
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at
      },
      user: {
        id: data.user.id,
        email: data.user.email,
        memberId: result.memberId,
        role: result.profile.role,
        areaId: result.profile.area_id,
        chapterId: result.profile.chapter_id,
        mustChangePassword: false
      }
    });
  } catch (error) {
    return apiError(res, error);
  }
}