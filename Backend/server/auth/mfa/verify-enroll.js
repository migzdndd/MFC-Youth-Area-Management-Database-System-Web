/**
 * Multi-Factor Authentication Enrollment Confirmation Handler
 *
 * What it Does: Simple non IT Terms
 * Confirms that the user's authenticator app is working by testing the 6-digit code they enter;
 * once verified, two-factor authentication is officially locked in and turned on for the account.
 */

import { createClient } from '@supabase/supabase-js';
import { assertBackendConfigured } from '../../_lib/env.js';
import { requireAuthenticatedUser } from '../../_lib/access.js';
import { sendJson, methodNotAllowed, apiError } from '../../_lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  try {
    const { token } = await requireAuthenticatedUser(req, { allowAal1: true });
    const factorId = String(req.body?.factorId || '').trim();
    const code = String(req.body?.code || '').trim().replace(/\s+/g, '');

    if (!factorId || !code) {
      return sendJson(res, 400, { ok: false, error: 'Factor ID and 6-digit verification code are required.' });
    }

    const { supabaseUrl, supabaseAnonKey } = assertBackendConfigured();
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: challengeData, error: challengeError } = await userClient.auth.mfa.challenge({ factorId });
    if (challengeError) throw challengeError;

    const { data: verifyData, error: verifyError } = await userClient.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code
    });

    if (verifyError) {
      return sendJson(res, 400, {
        ok: false,
        error: 'Invalid verification code. Please check your authenticator app and try again.'
      });
    }

    return sendJson(res, 200, {
      ok: true,
      message: 'Two-factor authentication enabled successfully.',
      session: {
        accessToken: verifyData?.access_token || token,
        refreshToken: verifyData?.refresh_token || '',
        expiresAt: verifyData?.expires_at
      }
    });
  } catch (error) {
    return apiError(res, error);
  }
}
