-- Migration 015: Disable Legacy Recursive RLS Policies
-- Disables old policies that queried public.members via get_user_chapters(),
-- causing "infinite recursion detected in policy for relation 'members'".
-- The active policies are the hardened app_private.* policies (e.g. members_select_policy).

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'members' AND policyname = 'Members Read Access') THEN
    ALTER POLICY "Members Read Access" ON public.members USING (false);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'members' AND policyname = 'Members Update Access') THEN
    ALTER POLICY "Members Update Access" ON public.members USING (false);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'activity_reports' AND policyname = 'Activity Reports Insert Access') THEN
    ALTER POLICY "Activity Reports Insert Access" ON public.activity_reports WITH CHECK (false);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'activity_reports' AND policyname = 'Activity Reports Read Access') THEN
    ALTER POLICY "Activity Reports Read Access" ON public.activity_reports USING (false);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'gig_contributions' AND policyname = 'GIG Contributions Read Access') THEN
    ALTER POLICY "GIG Contributions Read Access" ON public.gig_contributions USING (false);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'gig_contributions' AND policyname = 'GIG Contributions Write Access') THEN
    ALTER POLICY "GIG Contributions Write Access" ON public.gig_contributions USING (false);
  END IF;
END $$;
