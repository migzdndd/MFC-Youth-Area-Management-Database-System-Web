import { createClient } from '@supabase/supabase-js';
import { assertBackendConfigured } from '../../_lib/env.js';
import { requireAuthenticatedUser } from '../../_lib/access.js';
import { sendJson, methodNotAllowed, apiError } from '../../_lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  try {
    const { user, token } = await requireAuthenticatedUser(req);
    const { supabaseUrl, supabaseAnonKey } = assertBackendConfigured();

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const issuer = 'MFC Youth';
    const friendlyName = user.email || 'MFC Youth Account';

    const { data, error } = await userClient.auth.mfa.enroll({
      factorType: 'totp',
      issuer,
      friendlyName
    });

    if (error) throw error;

    return sendJson(res, 200, {
      ok: true,
      factorId: data.id,
      type: data.type,
      qrCode: data.totp?.qr_code,
      secret: data.totp?.secret,
      uri: data.totp?.uri
    });
  } catch (error) {
    return apiError(res, error);
  }
}
