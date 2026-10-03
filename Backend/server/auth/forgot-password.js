import { sendJson, methodNotAllowed, isValidEmail, normalizeEmail } from '../_lib/http.js';
import { createSupabaseAuthClient } from '../_lib/supabase.js';
import { checkRateLimit } from '../_lib/rate-limit.js';

/**
 * Forgotten Password Reset Email Dispatcher
 *
 * What it Does: Simple non IT Terms
 * Sends an email containing a secure link to help a user who forgot their password
 * safely reset it and log back into their account.
 */
function getSafeRedirectUrl(req) {
  if (process.env.APP_URL) {
    const appUrl = String(process.env.APP_URL).trim().replace(/\/+$/, '');
    return `${appUrl}/reset-password`;
  }

  const rawOrigin = req.headers?.origin;
  const rawHost = req.headers?.host;

  let candidateUrl = '';
  if (rawOrigin) {
    try {
      const parsed = new URL(rawOrigin);
      candidateUrl = parsed.origin;
    } catch {}
  } else if (rawHost) {
    const protocol = req.headers?.['x-forwarded-proto'] || (rawHost.includes('localhost') ? 'http' : 'https');
    try {
      const parsed = new URL(`${protocol}://${rawHost}`);
      candidateUrl = parsed.origin;
    } catch {}
  }

  if (candidateUrl) {
    try {
      const url = new URL(candidateUrl);
      const hostname = url.hostname.toLowerCase();
      const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
      const isAllowedDomain = isLocalhost || hostname.endsWith('.vercel.app') || hostname.endsWith('.github.io');
      if (isAllowedDomain) {
        return `${url.origin}/reset-password`;
      }
    } catch {}
  }

  return undefined;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  if (!await checkRateLimit(req, res, 'forgot-password')) return;

  const genericResponse = () => sendJson(res, 200, { ok: true, message: 'If an account exists, a reset link was sent.' });

  try {
    const email = normalizeEmail(req.body?.email);
    if (!isValidEmail(email)) return genericResponse();

    const supabase = createSupabaseAuthClient();
    const redirectTo = getSafeRedirectUrl(req);

    const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo
    });
    if (recoveryError) throw recoveryError;

    return genericResponse();
  } catch (error) {
    console.warn(JSON.stringify({
      event: 'PASSWORD_RECOVERY_REQUEST',
      timestamp: new Date().toISOString(),
      status: 'UPSTREAM_FAILURE',
      error_code: 'RECOVERY_REQUEST_FAILED'
    }));
    // Keep the client response identical so account existence is never exposed.
    return genericResponse();
  }
}
