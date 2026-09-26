import { requireAuthenticatedProfile } from '../_lib/access.js';
import { sendJson, methodNotAllowed, apiError, isValidEmail, normalizeEmail } from '../_lib/http.js';
import { assertBackendConfigured } from '../_lib/env.js';

/**
 * Request Account Email Address Change
 *
 * What it does:
 * Allows a signed-in user to change their account login email, initiating a verification email to the new address to confirm ownership.
 *
 * Backup plan if it breaks:
 * Validates that the new email is valid and different from the current email. If the cloud auth provider rejects the change, it extracts the error explanation and returns a clear status message.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  try {
    const { token, user } = await requireAuthenticatedProfile(req);
    const newEmail = normalizeEmail(req.body?.newEmail);

    if (!isValidEmail(newEmail)) {
      return sendJson(res, 400, { ok: false, error: 'A valid email is required.' });
    }
    if (newEmail === normalizeEmail(user.email || '')) {
      return sendJson(res, 400, { ok: false, error: 'Enter an email address different from your current email.' });
    }

    const { supabaseUrl, supabaseAnonKey } = assertBackendConfigured();
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: 'PUT',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: newEmail })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.msg || errorData.message || 'Unable to request the email change.');
      error.statusCode = response.status >= 400 && response.status < 500 ? response.status : 500;
      throw error;
    }

    return sendJson(res, 200, {
      ok: true,
      message: 'Email change requested. Complete the confirmation email process before the new address becomes active.'
    });
  } catch (error) {
    return apiError(res, error);
  }
}
