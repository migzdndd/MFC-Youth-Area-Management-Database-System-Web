import { createSupabaseAdmin } from './supabase.js';
import { readBearerToken } from './http.js';

export const AREA_ADMIN_ROLES = new Set([
  'national_coordinator',
  'couple_coordinator',
  'area_servant',
  'lit_servant',
  'campus_servant',
  'mfc_high_servant',
  'area_kids_servant'
]);

/**
 * Checks if the given role is considered an Area Admin role.
 *
 * @param {string} role - The user's role string.
 * @returns {boolean} True if the role has Area Admin privileges.
 */
export function isAreaAdminRole(role) {
  return AREA_ADMIN_ROLES.has(String(role || '').trim().toLowerCase());
}

/**
 * Checks if the given role is a Chapter Servant.
 *
 * @param {string} role - The user's role string.
 * @returns {boolean} True if the role is a chapter servant.
 */
export function isChapterServantRole(role) {
  return String(role || '').trim().toLowerCase() === 'chapter_servant';
}

/**
 * Safely decodes base64url JSON payload from a JWT token.
 *
 * @param {string} jwtToken
 * @returns {Object|null}
 */
export function parseJwtPayload(jwtToken) {
  try {
    const parts = String(jwtToken || '').split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Authenticates a user based on the request's Bearer token or auth cookie.
 * Enforces native Supabase AAL (Authentication Assurance Level):
 * Rejects aal1 sessions on non-MFA endpoints if TOTP is enrolled on the account.
 *
 * @param {import('http').IncomingMessage} req - The request object.
 * @param {Object} [options={}] - Authentication options.
 * @param {boolean} [options.allowAal1=false] - Whether to allow aal1 sessions on MFA enrollment/verification routes.
 * @returns {Promise<{ supabase: import('@supabase/supabase-js').SupabaseClient, user: import('@supabase/supabase-js').User, token: string }>} 
 * @throws {Error} 401 Unauthorized if token missing/invalid, 403 Forbidden if MFA required.
 */
export async function requireAuthenticatedUser(req, options = {}) {
  const token = readBearerToken(req);
  if (!token) {
    const error = new Error('Authentication required.');
    error.statusCode = 401;
    error.code = 'AUTH_REQUIRED';
    throw error;
  }

  const supabase = createSupabaseAdmin();
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    const error = new Error('Session is invalid or expired.');
    error.statusCode = 401;
    error.code = 'INVALID_SESSION';
    throw error;
  }

  // Native Supabase AAL (Authentication Assurance Level) Check:
  // If the user has active verified TOTP factors enrolled, reject aal1 sessions on all
  // non-MFA endpoints until the TOTP security challenge is completed and elevated to aal2.
  if (!options.allowAal1) {
    const payload = parseJwtPayload(token);
    const currentAal = payload?.aal || 'aal1';
    const hasVerifiedMfa = (userData.user.factors || []).some(
      f => f.factor_type === 'totp' && f.status === 'verified'
    );

    if (hasVerifiedMfa && currentAal !== 'aal2') {
      const error = new Error('Two-factor authentication required. Please verify your security code.');
      error.statusCode = 403;
      error.code = 'MFA_REQUIRED';
      error.aal = currentAal;
      throw error;
    }
  }

  return { supabase, user: userData.user, token };
}

/**
 * Authenticates a user and retrieves their active profile.
 *
 * @param {import('http').IncomingMessage} req - The request object.
 * @returns {Promise<{ supabase: import('@supabase/supabase-js').SupabaseClient, user: import('@supabase/supabase-js').User, profile: Object, token: string }>}
 * @throws {Error} 403 Forbidden if the profile is inactive.
 */
export async function requireAuthenticatedProfile(req) {
  const { supabase, user, token } = await requireAuthenticatedUser(req);
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile || profile.is_active === false) {
    const error = new Error('This account is not active.');
    error.statusCode = 403;
    error.code = 'ACCOUNT_INACTIVE';
    throw error;
  }

  return { supabase, user, profile, token };
}
