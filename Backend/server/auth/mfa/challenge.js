import { createClient } from '@supabase/supabase-js';
import { assertBackendConfigured } from '../../_lib/env.js';
import { readBearerToken, sendJson, methodNotAllowed, apiError } from '../../_lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  try {
    const token = readBearerToken(req);
    if (!token) {
      return sendJson(res, 401, { ok: false, error: 'Authentication required.' });
    }

    const factorId = String(req.body?.factorId || '').trim();
    if (!factorId) {
      return sendJson(res, 400, { ok: false, error: 'Factor ID is required.' });
    }

    const { supabaseUrl, supabaseAnonKey } = assertBackendConfigured();
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data, error } = await userClient.auth.mfa.challenge({ factorId });
    if (error) throw error;

    return sendJson(res, 200, {
      ok: true,
      challengeId: data.id,
      expiresAt: data.expires_at
    });
  } catch (error) {
    return apiError(res, error);
  }
}
