import { createClient } from '@supabase/supabase-js';
import { assertBackendConfigured } from '../../_lib/env.js';
import { requireAuthenticatedUser } from '../../_lib/access.js';
import { sendJson, methodNotAllowed, apiError } from '../../_lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  try {
    const { token } = await requireAuthenticatedUser(req);
    const { supabaseUrl, supabaseAnonKey } = assertBackendConfigured();

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data, error } = await userClient.auth.mfa.listFactors();
    if (error) throw error;

    const factors = (data?.totp || data?.all || []).map(f => ({
      id: f.id,
      friendlyName: f.friendly_name,
      factorType: f.factor_type,
      status: f.status,
      createdAt: f.created_at
    }));

    return sendJson(res, 200, { ok: true, factors });
  } catch (error) {
    return apiError(res, error);
  }
}
