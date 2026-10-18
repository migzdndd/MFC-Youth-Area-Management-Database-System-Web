-- Member Emergency and Profile Extension Fields
-- Adds nickname, gender, guardian_name, and guardian_contact to public.members.

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS nickname text,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS guardian_name text,
  ADD COLUMN IF NOT EXISTS guardian_contact text;
