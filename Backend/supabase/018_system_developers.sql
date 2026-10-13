-- 018_system_developers.sql
-- Migration: Add is_developer flag and system_developers table in Supabase

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_developer boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.system_developers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- RLS policy: Only service role / admin can manage system developers
ALTER TABLE public.system_developers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS system_developers_read_authenticated ON public.system_developers;
CREATE POLICY system_developers_read_authenticated ON public.system_developers
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
