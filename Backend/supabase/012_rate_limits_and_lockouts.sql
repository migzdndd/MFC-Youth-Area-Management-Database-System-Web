-- Migration 012: Auth Rate Limits & Brute-Force Account Lockout

CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  rate_key text PRIMARY KEY,
  attempt_count integer NOT NULL DEFAULT 0,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  blocked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.login_failures (
  email text PRIMARY KEY,
  attempt_count integer NOT NULL DEFAULT 1,
  locked_until timestamptz,
  first_failed_at timestamptz NOT NULL DEFAULT now(),
  last_failed_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.login_failures ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_blocked_until ON public.auth_rate_limits (blocked_until);
CREATE INDEX IF NOT EXISTS idx_login_failures_locked_until ON public.login_failures (locked_until);
