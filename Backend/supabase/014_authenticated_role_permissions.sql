-- Migration 014: Authenticated Role Permissions & Member Policies
-- Ensures the Postgres `authenticated` role possesses table-level CRUD privileges
-- on tables protected by Row Level Security (RLS), allowing user JWT queries to evaluate RLS.

-- Grant table privileges to authenticated role so RLS policies can evaluate
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.activity_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.gig_contributions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.areas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chapters TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.services TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.member_services TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.event_participants TO authenticated;

-- Ensure profiles is read-only for authenticated role (creation/updates managed via service role)
GRANT SELECT ON TABLE public.profiles TO authenticated;

-- Ensure members has a delete policy for area servant admin roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'members' AND policyname = 'members_delete_policy'
  ) THEN
    CREATE POLICY "members_delete_policy" ON public.members
    FOR DELETE TO authenticated
    USING (
      app_private.current_user_is_active() AND
      (app_private.current_role() = ANY (ARRAY['couple_coordinator'::text, 'area_servant'::text, 'campus_servant'::text, 'lit_servant'::text, 'area_kids_servant'::text])) AND
      (area_id = app_private.current_area_id())
    );
  END IF;
END $$;
