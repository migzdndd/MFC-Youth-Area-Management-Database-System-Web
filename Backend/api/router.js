import health from '../server/health.js';
import areas from '../server/areas/index.js';
import areaSelect from '../server/areas/select.js';
import authAccount from '../server/auth/account.js';
import authAdminRegister from '../server/auth/admin-register.js';
import authChangePassword from '../server/auth/change-password.js';
import authLogin from '../server/auth/login.js';
import authLogout from '../server/auth/logout.js';
import authChangeEmail from '../server/auth/change-email.js';
import authForgotPassword from '../server/auth/forgot-password.js';
import authResetPassword from '../server/auth/reset-password.js';
import adminChangeEmail from '../server/admin/members/change-email.js';
import authMe from '../server/auth/me.js';
import authMemberClaim from '../server/auth/member-claim.js';
import chapters from '../server/chapters/index.js';
import chapterAssignMembers from '../server/chapters/assign-members.js';
import events from '../server/events/index.js';
import gig from '../server/gig/index.js';
import members from '../server/members/index.js';
import memberLogin from '../server/members/login.js';
import participants from '../server/participants/index.js';
import reports from '../server/reports/index.js';
import services from '../server/services/index.js';
import sync from '../server/sync/index.js';
import dailyReadings from '../server/daily-readings/index.js';
import changelogs from '../server/changelogs/index.js';
import mfaEnroll from '../server/auth/mfa/enroll.js';
import mfaVerifyEnroll from '../server/auth/mfa/verify-enroll.js';
import mfaChallenge from '../server/auth/mfa/challenge.js';
import mfaVerify from '../server/auth/mfa/verify.js';
import mfaFactors from '../server/auth/mfa/factors.js';
import mfaUnenroll from '../server/auth/mfa/unenroll.js';
import { applySecurityHeaders } from '../server/_lib/http.js';

const ROUTES = new Map([
  ['health', health],
  ['areas', areas],
  ['areas/select', areaSelect],
  ['auth/account', authAccount],
  ['auth/admin-register', authAdminRegister],
  ['auth/change-password', authChangePassword],
  ['auth/login', authLogin],
  ['auth/logout', authLogout],
  ['auth/change-email', authChangeEmail],
  ['auth/forgot-password', authForgotPassword],
  ['auth/reset-password', authResetPassword],
  ['admin/members/change-email', adminChangeEmail],
  ['auth/me', authMe],
  ['auth/member-claim', authMemberClaim],
  ['mfa/enroll', mfaEnroll],
  ['auth/mfa/enroll', mfaEnroll],
  ['mfa/verify-enroll', mfaVerifyEnroll],
  ['auth/mfa/verify-enroll', mfaVerifyEnroll],
  ['mfa/challenge', mfaChallenge],
  ['auth/mfa/challenge', mfaChallenge],
  ['mfa/verify', mfaVerify],
  ['auth/mfa/verify', mfaVerify],
  ['mfa/factors', mfaFactors],
  ['auth/mfa/factors', mfaFactors],
  ['mfa/unenroll', mfaUnenroll],
  ['auth/mfa/unenroll', mfaUnenroll],
  ['chapters', chapters],
  ['chapters/assign-members', chapterAssignMembers],
  ['events', events],
  ['gig', gig],
  ['members', members],
  ['members/login', memberLogin],
  ['participants', participants],
  ['reports', reports],
  ['services', services],
  ['sync', sync],
  ['daily-readings', dailyReadings],
  ['changelogs', changelogs]
]);

/**
 * Clean and Standardize Requested URL Route
 *
 * What it does:
 * Strips away accidental leading or trailing slashes and handles array inputs so the server can match the requested action to its handler.
 *
 * Backup plan if it breaks:
 * If an unexpected or blank route format is passed, it converts it safely to an empty string to avoid crashes.
 */
function normalizeRoute(value) {
  const route = Array.isArray(value) ? value[0] : value;
  return String(route || '').replace(/^\/+|\/+$/g, '');
}

/**
 * Main Central Server Route Dispatcher
 *
 * What it does:
 * Applies web security shields to every incoming request, matches the web address path to the correct handler, and runs it.
 *
 * Backup plan if it breaks:
 * If an unknown address is requested, it replies with a clear 404 "API route not found" message. If an unexpected server error occurs, it catches it and responds with a 500 error code instead of crashing the server.
 */
export default async function handler(req, res) {
  applySecurityHeaders(res);
  try {
    const route = normalizeRoute(req.query?.route);
    const routeHandler = ROUTES.get(route);

    if (!routeHandler) {
      return res.status(404).json({
        ok: false,
        error: 'API route not found.'
      });
    }

    return await routeHandler(req, res);
  } catch (error) {
    console.error('API router error:', error);
    if (res.headersSent) return;
    return res.status(500).json({
      ok: false,
      error: 'The server could not complete the request.'
    });
  }
}
