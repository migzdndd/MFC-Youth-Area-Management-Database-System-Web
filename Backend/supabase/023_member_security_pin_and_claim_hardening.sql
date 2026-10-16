-- Migration 023: Member Security PIN and Profile Claim Verification Hardening
-- Adds security PIN hash, fallback verification PIN issued by Chapter Heads, and birth_date index.

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS security_pin_hash text,
  ADD COLUMN IF NOT EXISTS claim_pin text;

CREATE INDEX IF NOT EXISTS idx_members_birth_date ON public.members (birth_date);
CREATE INDEX IF NOT EXISTS idx_members_claim_pin ON public.members (claim_pin);

COMMENT ON COLUMN public.members.security_pin_hash IS 'Bcrypt or salted hash of member security verification PIN';
COMMENT ON COLUMN public.members.claim_pin IS 'Fallback 4-6 digit numeric PIN issued by Chapter Head for profile claiming';

