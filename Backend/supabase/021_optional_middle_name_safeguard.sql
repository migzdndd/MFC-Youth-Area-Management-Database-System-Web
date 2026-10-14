-- Migration 021: Ensure middle_name column is present on members table as optional (nullable text)
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS middle_name text;
