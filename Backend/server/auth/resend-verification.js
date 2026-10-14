import { createSupabaseAuthClient } from '../_lib/supabase.js';
import { sendJson, methodNotAllowed, normalizeEmail, isValidEmail, apiError } from '../_lib/http.js';
import { checkRateLimit } from '../_lib/rate-limit.js';

/**
 * Registration Verification Email Resender
 *
 * What it Does: Simple non IT Terms
 * Resends the 6-digit confirmation code and verification link to a user's email address
 * if their original code expired or they did not receive it.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  try {
    const email = normalizeEmail(req.body?.email);

    if (!isValidEmail(email)) {
      return sendJson(res, 400, { ok: false, error: 'A valid email address is required.' });
    }

    if (!await checkRateLimit(req, res, 'resend-verification')) return;

    const authClient = createSupabaseAuthClient();
    const { error: resendError } = await authClient.auth.resend({
      type: 'signup',
      email
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
      message: `A fresh verification code was sent to ${email}. Please check your inbox and spam folder.`
    });
  } catch (error) {
    return apiError(res, error);
  }
}
