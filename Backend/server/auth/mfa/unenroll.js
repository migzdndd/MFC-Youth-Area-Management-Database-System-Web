import { createClient } from '@supabase/supabase-js';
import { assertBackendConfigured } from '../../_lib/env.js';
import { requireAuthenticatedUser } from '../../_lib/access.js';
import { sendJson, methodNotAllowed, apiError } from '../../_lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  try {
    const { token } = await requireAuthenticatedUser(req);
    const factorId = String(req.body?.factorId || '').trim();

    if (!factorId) {
      return sendJson(res, 400, { ok: false, error: 'Factor ID is required.' });
    }

    const { supabaseUrl, supabaseAnonKey } = assertBackendConfigured();
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data, error } = await userClient.auth.mfa.unenroll({ factorId });
    if (error) throw error;

    return sendJson(res, 200, {
      ok: true,
      message: 'MFA factor successfully removed.',
      data
    });
  } catch (error) {
    return apiError(res, error);
  }
}
