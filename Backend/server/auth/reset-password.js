import { sendJson, methodNotAllowed, apiError, passwordError } from '../_lib/http.js';
import { createSupabaseAuthClient } from '../_lib/supabase.js';
import { checkRateLimit } from '../_lib/rate-limit.js';

/**
 * Password Recovery Verification and Password Reset Endpoint
 *
 * What it Does: Simple non IT Terms
 * Takes the secret recovery code from the password reset email, verifies that it is valid,
 * checks that the user's new password is strong, and safely saves the new password.
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  if (!await checkRateLimit(req, res, 'reset-password')) return;

  const authClient = createSupabaseAuthClient();
  let recoverySessionEstablished = false;

  try {
    const { token_hash, access_token, refresh_token, newPassword } = req.body || {};
    if (!token_hash && !access_token) {
      return sendJson(res, 400, { ok: false, error: 'Recovery token is missing.' });
    }

    const validationError = passwordError(newPassword);
    if (validationError) return sendJson(res, 400, { ok: false, error: validationError });

    let activeSession = null;
    if (token_hash) {
      const { data: verifyData, error: verifyError } = await authClient.auth.verifyOtp({
        token_hash: String(token_hash),
        type: 'recovery'
      });

      if (verifyError || !verifyData?.session) {
        return sendJson(res, 401, { ok: false, error: 'The recovery link is invalid or has expired.' });
      }
      activeSession = verifyData.session;
    } else {
      activeSession = {
        access_token: String(access_token),
        refresh_token: refresh_token ? String(refresh_token) : ''
      };
    }

    const { error: setSessionError } = await authClient.auth.setSession({
      access_token: activeSession.access_token,
      refresh_token: activeSession.refresh_token || ''
    });
    if (setSessionError) {
      return sendJson(res, 401, { ok: false, error: 'The recovery session is invalid or has expired.' });
    }
    recoverySessionEstablished = true;

    const { error: updateError } = await authClient.auth.updateUser({ password: newPassword });
    if (updateError) throw updateError;

    return sendJson(res, 200, {
      ok: true,
      message: 'Password has been successfully reset. Please sign in with your new password.'
    });
  } catch (error) {
    return apiError(res, error);
  } finally {
    if (recoverySessionEstablished) {
      try {
        await authClient.auth.signOut({ scope: 'local' });
      } catch {
        // The recovery client is non-persistent and discarded after this request.
      }
    }
  }
}
