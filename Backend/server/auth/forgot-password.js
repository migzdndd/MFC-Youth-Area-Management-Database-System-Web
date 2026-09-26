import { sendJson, methodNotAllowed, isValidEmail, normalizeEmail } from '../_lib/http.js';
import { createSupabaseAuthClient } from '../_lib/supabase.js';
import { checkRateLimit } from '../_lib/rate-limit.js';

/**
 * Send Password Recovery Link to Email
 *
 * What it does:
 * Generates and emails a secure, single-use password reset link to the user so they can regain access to their account.
 *
 * Backup plan if it breaks:
 * Always returns a generic "If an account exists, a reset link was sent" message even if the email doesn't exist or fails upstream, protecting user privacy against email enumeration attacks.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  if (!await checkRateLimit(req, res, 'forgot-password')) return;

  const genericResponse = () => sendJson(res, 200, { ok: true, message: 'If an account exists, a reset link was sent.' });

  try {
    const email = normalizeEmail(req.body?.email);
    if (!isValidEmail(email)) return genericResponse();

    const supabase = createSupabaseAuthClient();

    // Attempt to infer base URL from origin or host for the RedirectTo param
    let baseUrl = '';
    if (req.headers.origin) {
      baseUrl = req.headers.origin;
    } else if (req.headers.host) {
      const protocol = req.headers['x-forwarded-proto'] || (req.headers.host.includes('localhost') ? 'http' : 'https');
      baseUrl = `${protocol}://${req.headers.host}`;
    }

    const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: baseUrl ? `${baseUrl}/reset-password` : undefined
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
