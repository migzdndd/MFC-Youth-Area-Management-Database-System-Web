import { createClient } from '@supabase/supabase-js';
import { assertBackendConfigured } from './env.js';

const REQUEST_TIMEOUT_MS = 10000;

/**
 * Enforce Encrypted HTTPS Connection to Cloud Database
 *
 * What it does:
 * Ensures all database communication uses encrypted HTTPS, stops insecure redirects, and cancels requests that freeze for longer than 10 seconds.
 *
 * Backup plan if it breaks:
 * If an insecure link is detected, it blocks the connection immediately to protect data privacy. If the network hangs, the 10-second timer aborts the request so server memory is freed.
 */
function secureFetch(input, init = {}) {
  const target = typeof input === 'string' ? input : input?.url;
  if (target) {
    const parsed = new URL(target);
    if (parsed.protocol !== 'https:') {
      throw new Error('Blocked insecure database transport. Supabase requests must use HTTPS.');
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const upstreamSignal = init.signal;

  if (upstreamSignal) {
    if (upstreamSignal.aborted) controller.abort();
    else upstreamSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  return fetch(input, {
    ...init,
    signal: controller.signal,
    redirect: 'error',
    cache: 'no-store'
  }).finally(() => clearTimeout(timeout));
}

/**
 * Configure Safe Database Client Settings
 *
 * What it does:
 * Sets up the database connection without storing browser sessions on the server and applies our custom secure network connection rules.
 *
 * Backup plan if it breaks:
 * Explicitly disables automatic token refreshing on the backend to avoid secret token leaks.
 */
function clientOptions() {
  return {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      fetch: secureFetch,
      headers: {
        'X-Client-Info': 'mfc-youth-web-api'
      }
    }
  };
}

/**
 * Create Master Administrative Database Client
 *
 * What it does:
 * Initializes a high-privilege connection to the cloud database using the master secret key, allowing the server to manage areas, accounts, and member data.
 *
 * Backup plan if it breaks:
 * If secret keys or database URLs are missing or invalid, it throws a 503 error before attempting any operations.
 */
export function createSupabaseAdmin() {
  const { supabaseUrl, supabaseServiceRoleKey } = assertBackendConfigured();
  return createClient(supabaseUrl, supabaseServiceRoleKey, clientOptions());
}

/**
 * Create Public Authentication Client
 *
 * What it does:
 * Initializes a client using the public key to perform standard user login verification without master privileges.
 *
 * Backup plan if it breaks:
 * Validates environment settings first, throwing a configuration error if keys are absent.
 */
export function createSupabaseAuthClient() {
  const { supabaseUrl, supabaseAnonKey } = assertBackendConfigured();
  return createClient(supabaseUrl, supabaseAnonKey, clientOptions());
}
