/**
 * Youth Member Account Claim and Registration Handler
 *
 * What it Does: Simple non IT Terms
 * Allows a member who is already listed in the community roster to claim their online account,
 * set a secure password, and connect their login directly to their member profile.
 */

import crypto from 'node:crypto';
import { createSupabaseAdmin, createSupabaseAuthClient } from '../_lib/supabase.js';
import { requireAuthenticatedUser } from '../_lib/access.js';
import { claimMemberRecord } from '../_lib/member-claim.js';
import { sendJson, methodNotAllowed, normalizeEmail, isValidEmail, apiError, passwordError } from '../_lib/http.js';
import { checkRateLimit } from '../_lib/rate-limit.js';

function escapeLikePattern(value) {
  return String(value).replace(/[\\%_]/g, character => `\\${character}`);
}

function normalizeDate(val) {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val).trim().slice(0, 10);
  return d.toISOString().slice(0, 10);
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
    const birthdate = normalizeDate(req.body?.birthdate);
    const pin = String(req.body?.pin || '').trim();

    if (!isValidEmail(email)) return sendJson(res, 400, { ok: false, error: 'Enter the email address stored in your Member record.' });
    if (!birthdate) return sendJson(res, 400, { ok: false, error: 'Birthdate (YYYY-MM-DD) is required to verify your member record.' });
    if (!pin || !/^\d{4,6}$/.test(pin)) return sendJson(res, 400, { ok: false, error: 'A 4-to-6 digit security PIN is required.' });

    const pError = passwordError(password);
    if (pError) return sendJson(res, 400, { ok: false, error: pError });

    const { data: matchingMember, error: memberLookupError } = await admin
      .from('members')
      .select('id, birthdate, claim_pin, security_pin_hash')
      .ilike('email', escapeLikePattern(email))
      .maybeSingle();
    if (memberLookupError) throw memberLookupError;

    const genericClaimResponse = () => sendJson(res, 200, {
      ok: true,
      verificationRequired: true,
      message: 'If your email is linked to an eligible Member record, check your inbox to complete verification.'
    });

    if (!matchingMember) {
      return genericClaimResponse();
    }

    // Verify birthdate match
    const rosterBirthdate = normalizeDate(matchingMember.birthdate);
    if (rosterBirthdate && rosterBirthdate !== birthdate) {
      return sendJson(res, 400, {
        ok: false,
        error: 'The provided birthdate does not match our community roster. Please check with your Chapter Head.'
      });
    }

    // Verify security PIN if assigned
    const submittedPinHash = crypto.createHash('sha256').update(pin).digest('hex');
    if (matchingMember.security_pin_hash) {
      if (matchingMember.security_pin_hash !== submittedPinHash && matchingMember.claim_pin !== pin) {
        return sendJson(res, 400, {
          ok: false,
          error: 'Invalid security PIN. Please request your verification PIN from your Chapter Head.'
        });
      }
    } else if (matchingMember.claim_pin) {
      if (matchingMember.claim_pin !== pin) {
        return sendJson(res, 400, {
          ok: false,
          error: 'Invalid security PIN. Please request your verification PIN from your Chapter Head.'
        });
      }
    }

    // Store security_pin_hash for future hardening
    await admin
      .from('members')
      .update({ security_pin_hash: submittedPinHash })
      .eq('id', matchingMember.id);

    const authClient = createSupabaseAuthClient();
    const { data, error } = await authClient.auth.signUp({ email, password });
    if (error) {
      const errMsg = String(error.message || '').toLowerCase();
      if (errMsg.includes('already') || errMsg.includes('registered')) {
        return genericClaimResponse();
      }
      return sendJson(res, 400, { ok: false, error: 'Unable to claim your Member Portal account. Please try again.' });
    }
    if (!data?.user) return sendJson(res, 400, { ok: false, error: 'Unable to claim your Member Portal account. Please try again.' });

    if (!data.session) {
      return genericClaimResponse();
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
        first_name: result.member?.first_name || '',
        middle_name: result.member?.middle_name || null,
        last_name: result.member?.last_name || '',
        name: result.member
          ? [result.member.first_name, result.member.middle_name, result.member.last_name].filter(Boolean).join(' ')
          : data.user.email,
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