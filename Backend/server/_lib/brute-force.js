import { createSupabaseAdmin } from './supabase.js';
import { sendJson, normalizeEmail } from './http.js';

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_MINUTES = 15;
const LOCKOUT_DURATION_MS = LOCKOUT_MINUTES * 60 * 1000;
const FAILURE_WINDOW_MS = LOCKOUT_DURATION_MS;

/**
 * Checks if the given email account is currently locked out due to brute-force attempts.
 * Returns true if allowed, or sends a 423 response and returns false if locked.
 *
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {string} email
 * @returns {Promise<boolean>}
 */
export async function checkBruteForce(req, res, email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return true;

  try {
    const admin = createSupabaseAdmin();
    const { data: record, error } = await admin
      .from('login_failures')
      .select('email, attempt_count, locked_until, last_failed_at')
      .eq('email', normalized)
      .maybeSingle();

    if (error || !record) return true;

    const now = new Date();
    if (record.locked_until) {
      const lockedUntil = new Date(record.locked_until);
      if (lockedUntil > now) {
        const remainingMinutes = Math.max(1, Math.ceil((lockedUntil.getTime() - now.getTime()) / 60000));
        sendJson(res, 423, {
          ok: false,
          error: `Account temporarily locked due to multiple failed login attempts. Please try again in ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}.`,
          lockedUntil: lockedUntil.toISOString()
        });
        return false;
      }
    }

    return true;
  } catch (err) {
    console.warn('Brute-force check skipped due to database lookup error:', err?.message || err);
    return true;
  }
}

/**
 * Records a failed login attempt for the given email address.
 * Increments attempt count, locks account if threshold reached, and returns status.
 *
 * @param {string} email
 * @returns {Promise<{ locked: boolean, attempts: number, lockedUntil: string|null }>}
 */
export async function recordLoginFailure(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return { locked: false, attempts: 0, lockedUntil: null };

  const now = new Date();

  try {
    const admin = createSupabaseAdmin();
    const { data: record } = await admin
      .from('login_failures')
      .select('email, attempt_count, locked_until, last_failed_at')
      .eq('email', normalized)
      .maybeSingle();

    if (!record) {
      await admin.from('login_failures').insert({
        email: normalized,
        attempt_count: 1,
        locked_until: null,
        first_failed_at: now.toISOString(),
        last_failed_at: now.toISOString(),
        updated_at: now.toISOString()
      });
      return { locked: false, attempts: 1, lockedUntil: null };
    }

    const lastFailedAt = new Date(record.last_failed_at);
    const windowExpired = (now.getTime() - lastFailedAt.getTime()) > FAILURE_WINDOW_MS;
    const isCurrentlyLocked = record.locked_until && new Date(record.locked_until) > now;

    const newCount = windowExpired && !isCurrentlyLocked ? 1 : (record.attempt_count || 0) + 1;
    let lockedUntil = null;

    if (newCount >= LOCKOUT_THRESHOLD) {
      lockedUntil = new Date(now.getTime() + LOCKOUT_DURATION_MS).toISOString();
    }

    await admin
      .from('login_failures')
      .update({
        attempt_count: newCount,
        locked_until: lockedUntil,
        last_failed_at: now.toISOString(),
        updated_at: now.toISOString()
      })
      .eq('email', normalized);

    return {
      locked: !!lockedUntil,
      attempts: newCount,
      lockedUntil
    };
  } catch (err) {
    console.warn('Failed to record login failure:', err?.message || err);
    return { locked: false, attempts: 1, lockedUntil: null };
  }
}

/**
 * Clears consecutive login failures for the given email upon successful authentication.
 *
 * @param {string} email
 * @returns {Promise<void>}
 */
export async function clearLoginFailures(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return;

  try {
    const admin = createSupabaseAdmin();
    await admin
      .from('login_failures')
      .delete()
      .eq('email', normalized);
  } catch (err) {
    console.warn('Failed to clear login failures:', err?.message || err);
  }
}
