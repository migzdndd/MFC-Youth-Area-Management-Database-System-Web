-- Migration 017: Allow non-member / guest participants and explicit payment status in event attendance

ALTER TABLE public.event_participants ALTER COLUMN member_id DROP NOT NULL;
ALTER TABLE public.event_participants ADD COLUMN IF NOT EXISTS non_member_name text;

ALTER TABLE public.event_participants DROP CONSTRAINT IF EXISTS event_participants_identity_check;
ALTER TABLE public.event_participants ADD CONSTRAINT event_participants_identity_check 
  CHECK ((member_id IS NOT NULL) OR (non_member_name IS NOT NULL AND btrim(non_member_name) <> ''));

CREATE UNIQUE INDEX IF NOT EXISTS event_participants_event_non_member_idx 
  ON public.event_participants (event_id, lower(trim(non_member_name))) 
  WHERE member_id IS NULL;
