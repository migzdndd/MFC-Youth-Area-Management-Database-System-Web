-- Migration 013: Member profile avatar support
alter table public.members add column if not exists avatar_url text;
