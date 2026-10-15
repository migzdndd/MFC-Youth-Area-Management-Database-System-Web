import sendVerificationHandler from './send-verification.js';

/**
 * Registration Verification Email Resender
 *
 * Delegates to the unified send-verification handler to eliminate
 * duplicate rate-limiting, origin parsing, and Supabase resend workflows.
 */
export default async function handler(req, res) {
  return sendVerificationHandler(req, res);
}
