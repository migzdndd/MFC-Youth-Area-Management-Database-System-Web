import { randomUUID } from 'node:crypto';
import { createSupabaseAdmin, createSupabaseAuthClient } from '../_lib/supabase.js';
import { sendJson, methodNotAllowed, normalizeEmail, isValidEmail, apiError } from '../_lib/http.js';
import { checkRateLimit } from '../_lib/rate-limit.js';

/**
 * Pre-Registration Email Verification Dispatcher
 *
 * What it Does:
 * Sends an email verification link and 6-digit OTP code to the user before they submit
 * their full registration form. Allows leaders to confirm their email address first.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  try {
    const email = normalizeEmail(req.body?.email);

    if (!isValidEmail(email)) {
      return sendJson(res, 400, { ok: false, error: 'Enter a valid email address.' });
    }

    if (!await checkRateLimit(req, res, 'send-verification')) return;

    const admin = createSupabaseAdmin();
    const { data: usersList, error: listError } = await admin.auth.admin.listUsers();
    if (listError) throw listError;

    const existingUser = (usersList?.users || []).find((u) => u.email?.toLowerCase() === email);

    if (existingUser) {
      // Check if user already has an active profile
      const { data: existingProfile } = await admin
        .from('profiles')
        .select('id, is_active')
        .eq('id', existingUser.id)
        .maybeSingle();

      if (existingProfile && existingUser.email_confirmed_at) {
        return sendJson(res, 409, {
          ok: false,
          error: 'An account with this email is already registered. Please sign in instead.'
        });
      }
    } else {
      // Create pending unconfirmed user in Supabase Auth
      const tempPassword = `Temp-${randomUUID()}!Aa1`;
      const { error: createError } = await admin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: false,
        user_metadata: {
          registration_pending: true,
          verification_initiated_at: new Date().toISOString()
        }
      });
      if (createError) throw createError;
    }

    // Dispatch verification email with redirect pointing to registration page
    const authClient = createSupabaseAuthClient();
    const originHeader = req.headers?.origin || req.headers?.referer;
    let emailRedirectTo = null;
    if (originHeader) {
      try {
        const parsed = new URL(originHeader);
        emailRedirectTo = `${parsed.protocol}//${parsed.host}/register`;
      } catch {
        // Ignore malformed origin header
      }
    }

    const { error: resendError } = await authClient.auth.resend({
      type: 'signup',
      email,
      ...(emailRedirectTo ? { options: { emailRedirectTo } } : {})
    });

    if (resendError) {
      const msg = String(resendError.message || '').toLowerCase();
      if (resendError.status === 429 || msg.includes('rate') || msg.includes('security') || msg.includes('seconds')) {
        return sendJson(res, 429, {
          ok: false,
          error: 'Please wait a moment before requesting another verification code.'
        });
      }
      throw resendError;
    }

    return sendJson(res, 200, {
      ok: true,
      email,
      message: `Verification email sent to ${email}. Check your inbox and spam folder.`
    });
  } catch (error) {
    return apiError(res, error);
  }
}
