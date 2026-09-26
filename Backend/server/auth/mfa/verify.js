import { createClient } from '@supabase/supabase-js';
import { assertBackendConfigured } from '../../_lib/env.js';
import { createSupabaseAdmin } from '../../_lib/supabase.js';
import { readBearerToken, sendJson, methodNotAllowed, apiError, setAuthCookies } from '../../_lib/http.js';
import { checkRateLimit } from '../../_lib/rate-limit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  if (!await checkRateLimit(req, res, 'mfa-verify')) return;

  try {
    const token = readBearerToken(req);
    if (!token) {
      return sendJson(res, 401, { ok: false, error: 'Authentication session token required.' });
    }

    const factorId = String(req.body?.factorId || '').trim();
    let challengeId = String(req.body?.challengeId || '').trim();
    const code = String(req.body?.code || '').trim().replace(/\s+/g, '');

    if (!factorId || !code) {
      return sendJson(res, 400, { ok: false, error: 'Factor ID and 6-digit authentication code are required.' });
    }

    const { supabaseUrl, supabaseAnonKey } = assertBackendConfigured();
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    if (!challengeId) {
      const { data: cData, error: cErr } = await userClient.auth.mfa.challenge({ factorId });
      if (cErr) throw cErr;
      challengeId = cData.id;
    }

    const { data: verifyData, error: verifyError } = await userClient.auth.mfa.verify({
      factorId,
      challengeId,
      code
    });

    if (verifyError || !verifyData?.access_token) {
      return sendJson(res, 400, { ok: false, error: 'Invalid authentication code. Please try again.' });
    }

    const admin = createSupabaseAdmin();
    const userId = verifyData.user?.id;
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id, member_id, role, area_id, chapter_id, must_change_password, is_active')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) throw profileError;

    if (profile && profile.is_active === false) {
      return sendJson(res, 403, { ok: false, error: 'This account is not active.' });
    }

    setAuthCookies(res, {
      accessToken: verifyData.access_token,
      refreshToken: verifyData.refresh_token
    }, Boolean(req.body?.remember));

    return sendJson(res, 200, {
      ok: true,
      session: {
        accessToken: verifyData.access_token,
        refreshToken: verifyData.refresh_token,
        expiresAt: verifyData.expires_at
      },
      user: {
        id: userId,
        email: verifyData.user?.email,
        name: verifyData.user?.user_metadata?.display_name || verifyData.user?.email,
        memberId: profile?.member_id || null,
        role: profile?.role || 'member',
        areaId: profile?.area_id || null,
        chapterId: profile?.chapter_id || null,
        mustChangePassword: profile?.must_change_password ?? false
      }
    });
  } catch (error) {
    return apiError(res, error);
  }
}
