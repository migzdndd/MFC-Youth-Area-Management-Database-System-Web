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
 * Check If Leadership Role Has Area-Wide Authority
 *
 * What it does:
 * Tests whether a leader's role belongs to the high-level Area leadership team (such as National, Area, or Ministry servants).
 *
 * Backup plan if it breaks:
 * If a role name has irregular spacing or uppercase letters, it cleans and trims it first. If the role is missing or not in the authorized list, it safely returns false.
 */
export function isAreaAdminRole(role) {
  return AREA_ADMIN_ROLES.has(String(role || '').trim().toLowerCase());
}

/**
 * Check If User is a Chapter Servant
 *
 * What it does:
 * Determines if the current user is a local chapter leader rather than an area-wide administrator.
 *
 * Backup plan if it breaks:
 * Cleans the input text and safely returns false if the role is missing or invalid.
 */
export function isChapterServantRole(role) {
  return String(role || '').trim().toLowerCase() === 'chapter_servant';
}

/**
 * Read Encoded Login Token Data
 *
 * What it does:
 * Unpacks the digital security token sent by the browser so the server can inspect the user's login level and security session details.
 *
 * Backup plan if it breaks:
 * If the security token is malformed, corrupted, or tampered with, it catches the error and safely returns null rather than throwing an unhandled exception.
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
 * Verify Logged-In User and Multi-Factor Security
 *
 * What it does:
 * Validates the user's digital login pass with the database and confirms whether their two-factor verification code has been entered if two-factor is enabled.
 *
 * Backup plan if it breaks:
 * If the login token is missing or expired, it halts with an "Authentication required" 401 alert. If two-factor is active but the user has not completed their code check, it stops with a 403 "Two-factor authentication required" message.
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
 * Verify User Profile and Active Account Status
 *
 * What it does:
 * Confirms that the user is logged in and verifies that their account profile has not been deactivated or banned.
 *
 * Backup plan if it breaks:
 * If the profile does not exist or has been disabled, it stops the request and returns an "Account is not active" error.
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
