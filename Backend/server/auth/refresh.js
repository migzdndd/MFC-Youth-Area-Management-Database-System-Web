/**
 * User Session Token Refresh Handler
 *
 * What it Does: Simple non IT Terms
 * Automatically renews an expiring user login session using a secure refresh token
 * so users stay signed in smoothly without interruption.
 */

import { createSupabaseAuthClient } from '../_lib/supabase.js';
import { sendJson, methodNotAllowed, apiError, parseCookies, setAuthCookies, clearAuthCookies } from '../_lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  try {
    const cookies = parseCookies(req.headers?.cookie);
    const refreshToken = String(
      req.body?.refreshToken ||
      cookies.sb_refresh_token ||
      cookies['sb-refresh-token'] ||
      ''
    ).trim();

    if (!refreshToken) {
      return sendJson(res, 401, {
        ok: false,
        error: 'Refresh token is required.',
        code: 'REFRESH_TOKEN_REQUIRED'
      });
    }

    const authClient = createSupabaseAuthClient();
    const { data, error } = await authClient.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error || !data?.session) {
      clearAuthCookies(res);
      return sendJson(res, 401, {
        ok: false,
        error: 'Session could not be refreshed. Please sign in again.',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    setAuthCookies(res, {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token
    }, true);

    return sendJson(res, 200, {
      ok: true,
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at
      }
    });
  } catch (error) {
    return apiError(res, error);
  }
}
