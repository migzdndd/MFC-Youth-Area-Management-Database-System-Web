/**
 * Administrative Member Password Override Deprecation Boundary
 *
 * What it Does: Simple non IT Terms
 * Politely informs administrators that they cannot manually set or see member passwords;
 * youth members must securely claim their own accounts or reset passwords themselves.
 */

import { requireAuthenticatedProfile, isAreaAdminRole } from '../_lib/access.js';
import { sendJson, methodNotAllowed, apiError } from '../_lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  try {
    const { profile } = await requireAuthenticatedProfile(req);
    if (!isAreaAdminRole(profile.role)) {
      return sendJson(res, 403, { ok: false, error: 'Only Area-level servant accounts can reset member logins.' });
    }

    return sendJson(res, 410, {
      ok: false,
      error: 'Member portal accounts are created by Members using their own email and password. Administrators cannot provision or reset Member passwords.'
    });
  } catch (error) {
    return apiError(res, error);
  }
}
