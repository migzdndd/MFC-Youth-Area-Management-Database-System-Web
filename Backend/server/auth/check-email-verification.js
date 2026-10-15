import { createSupabaseAdmin } from '../_lib/supabase.js';
import { sendJson, methodNotAllowed, normalizeEmail, isValidEmail, apiError } from '../_lib/http.js';
import { checkRateLimit } from '../_lib/rate-limit.js';

/**
 * Check Email Verification Status
 *
 * What it Does:
 * Validates directly against Supabase Auth and PostgreSQL whether a given email address
 * has officially confirmed their email (i.e. email_confirmed_at is not null).
 */
export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return methodNotAllowed(res, ['POST', 'GET']);
  }

  try {
    const rawEmail = req.method === 'POST' ? req.body?.email : req.query?.email;
    const email = normalizeEmail(rawEmail);

    if (!isValidEmail(email)) {
      return sendJson(res, 400, { ok: false, error: 'Enter a valid email address.' });
    }

    if (!await checkRateLimit(req, res, 'check-email-verification')) return;

    const admin = createSupabaseAdmin();
    const { data: usersList, error: listError } = await admin.auth.admin.listUsers();
    if (listError) throw listError;

    const user = (usersList?.users || []).find((u) => u.email?.toLowerCase() === email);

    if (!user) {
      return sendJson(res, 200, {
        ok: true,
        verified: false,
        email,
        message: 'No verification record found for this email.'
      });
    }

    const isVerified = Boolean(user.email_confirmed_at);

    return sendJson(res, 200, {
      ok: true,
      verified: isVerified,
      email: user.email,
      confirmedAt: user.email_confirmed_at || null,
      message: isVerified ? 'Email is verified.' : 'Email is not yet verified.'
    });
  } catch (error) {
    return apiError(res, error);
  }
}
