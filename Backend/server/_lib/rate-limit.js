import { createSupabaseAdmin } from './supabase.js';
import { sendJson } from './http.js';

export function getClientIp(req) {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (forwarded) {
    return String(forwarded).split(',')[0].trim();
  }
  return req.headers?.['x-real-ip'] || req.socket?.remoteAddress || '127.0.0.1';
}

const RATE_CONFIGS = {
  login: { maxAttempts: 10, windowMs: 5 * 60 * 1000, label: '5 minutes' },
  'mfa-verify': { maxAttempts: 5, windowMs: 10 * 60 * 1000, label: '10 minutes' },
  'forgot-password': { maxAttempts: 5, windowMs: 10 * 60 * 1000, label: '10 minutes' },
  'reset-password': { maxAttempts: 5, windowMs: 10 * 60 * 1000, label: '10 minutes' },
  'admin-register': { maxAttempts: 5, windowMs: 10 * 60 * 1000, label: '10 minutes' },
  'member-claim': { maxAttempts: 5, windowMs: 10 * 60 * 1000, label: '10 minutes' },
  'daily-readings': { maxAttempts: 30, windowMs: 5 * 60 * 1000, label: '5 minutes' },
  changelogs: { maxAttempts: 30, windowMs: 5 * 60 * 1000, label: '5 minutes' },
  health: { maxAttempts: 60, windowMs: 5 * 60 * 1000, label: '5 minutes' },
  default: { maxAttempts: 5, windowMs: 10 * 60 * 1000, label: '10 minutes' }
};

/**
 * Validates request rate limits using Supabase sliding window counter.
 * Returns true if allowed, or sends a 429 response and returns false if exceeded.
 *
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {string} endpoint
 * @returns {Promise<boolean>}
 */
export async function checkRateLimit(req, res, endpoint) {
  const config = RATE_CONFIGS[endpoint] || RATE_CONFIGS.default;
  const ip = getClientIp(req);
  const rateKey = `${endpoint}:${ip}`;
  const now = new Date();

  try {
    const admin = createSupabaseAdmin();

    const { data: record, error: fetchError } = await admin
      .from('auth_rate_limits')
      .select('rate_key, attempt_count, window_started_at, blocked_until')
      .eq('rate_key', rateKey)
      .maybeSingle();

    if (fetchError) {
      console.warn('Rate limit check skipped due to database lookup error:', fetchError?.message || fetchError);
      return true;
    }

    if (record) {
      if (record.blocked_until && new Date(record.blocked_until) > now) {
        const remainingSeconds = Math.max(1, Math.ceil((new Date(record.blocked_until).getTime() - now.getTime()) / 1000));
        res.setHeader('Retry-After', String(remainingSeconds));
        sendJson(res, 429, {
          ok: false,
          error: `Too many requests. Please wait ${remainingSeconds} second${remainingSeconds === 1 ? '' : 's'} before trying again.`,
          retryAfter: remainingSeconds
        });
        return false;
      }

      const windowStart = new Date(record.window_started_at);
      if (now.getTime() - windowStart.getTime() > config.windowMs) {
        await admin
          .from('auth_rate_limits')
          .update({
            attempt_count: 1,
            window_started_at: now.toISOString(),
            blocked_until: null,
            updated_at: now.toISOString()
          })
          .eq('rate_key', rateKey);

        return true;
      }

      const newCount = (record.attempt_count || 0) + 1;
      if (newCount > config.maxAttempts) {
        const blockedUntil = new Date(windowStart.getTime() + config.windowMs);
        const remainingSeconds = Math.max(1, Math.ceil((blockedUntil.getTime() - now.getTime()) / 1000));

        await admin
          .from('auth_rate_limits')
          .update({
            attempt_count: newCount,
            blocked_until: blockedUntil.toISOString(),
            updated_at: now.toISOString()
          })
          .eq('rate_key', rateKey);

        res.setHeader('Retry-After', String(remainingSeconds));
        sendJson(res, 429, {
          ok: false,
          error: `Too many attempts. Rate limit exceeded. Please try again in ${remainingSeconds} second${remainingSeconds === 1 ? '' : 's'}.`,
          retryAfter: remainingSeconds
        });
        return false;
      }

      await admin
        .from('auth_rate_limits')
        .update({
          attempt_count: newCount,
          updated_at: now.toISOString()
        })
        .eq('rate_key', rateKey);

      return true;
    }

    await admin
      .from('auth_rate_limits')
      .insert({
        rate_key: rateKey,
        attempt_count: 1,
        window_started_at: now.toISOString(),
        blocked_until: null,
        updated_at: now.toISOString()
      });

    return true;
  } catch (err) {
    console.warn('Rate limit error; failing open:', err?.message || err);
    return true;
  }
}
