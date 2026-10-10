-- Migration 016: Domain Moderator RLS Scoping & Policy Alignment
-- Aligns PostgreSQL Row Level Security policies with the 4-tier RBAC architecture:
-- National Coordinator (Super Admin), Area Servant (Admin), Domain Moderators (LIT, Campus, High, Kids, Chapter), and Members.

-- 1. Update members_select_policy to include mfc_high_servant and ensure national_coordinator has full area access
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'members' AND policyname = 'members_select_policy'
  ) THEN
    DROP POLICY "members_select_policy" ON public.members;
  END IF;

  CREATE POLICY "members_select_policy" ON public.members
  FOR SELECT TO authenticated
  USING (
    (id = app_private.current_member_id()) OR
    (
      app_private.current_user_is_active() AND
      (
        -- National Coordinator can view across areas
        (app_private.current_role() = 'national_coordinator'::text) OR
        -- Area leadership & Domain Moderators within their assigned area
        (
          (app_private.current_role() = ANY (ARRAY[
            'couple_coordinator'::text,
            'area_servant'::text,
            'campus_servant'::text,
            'lit_servant'::text,
            'area_kids_servant'::text,
            'mfc_high_servant'::text
          ])) AND
          (area_id = app_private.current_area_id())
        ) OR
        -- Chapter Servant within their assigned chapter
        (
          (app_private.current_role() = 'chapter_servant'::text) AND
          (chapter_id = app_private.current_chapter_id())
        )
      )
    )
  );
END $$;

-- 2. Restrict members_delete_policy to Area Administrators only
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'members' AND policyname = 'members_delete_policy'
  ) THEN
    DROP POLICY "members_delete_policy" ON public.members;
  END IF;

  CREATE POLICY "members_delete_policy" ON public.members
  FOR DELETE TO authenticated
  USING (
    app_private.current_user_is_active() AND
    (app_private.current_role() = ANY (ARRAY['national_coordinator'::text, 'couple_coordinator'::text, 'area_servant'::text])) AND
    (
      (app_private.current_role() = 'national_coordinator'::text) OR
      (area_id = app_private.current_area_id())
    )
  );
END $$;
