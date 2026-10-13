-- Migration 013_b: Define app_private Schema and Context Resolvers
-- Required by migrations 014 and 016 for RLS evaluation.

CREATE SCHEMA IF NOT EXISTS app_private;

CREATE OR REPLACE FUNCTION app_private.current_role() RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION app_private.current_area_id() RETURNS uuid AS $$
  SELECT area_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION app_private.current_chapter_id() RETURNS uuid AS $$
  SELECT chapter_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION app_private.current_member_id() RETURNS uuid AS $$
  SELECT member_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION app_private.current_user_is_active() RETURNS boolean AS $$
  SELECT COALESCE(is_active, false) FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

GRANT USAGE ON SCHEMA app_private TO authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app_private TO authenticated, service_role;
