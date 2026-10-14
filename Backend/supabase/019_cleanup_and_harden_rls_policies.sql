-- Migration 019: Clean and Harden Database Security Policies (Row-Level Security)
-- 1. Sets fixed search_path on app_private functions to eliminate mutable search_path warnings.
-- 2. Drops obsolete dead policies that were set to false (eliminating duplicate permissive policies).
-- 3. Drops unneeded legacy SECURITY DEFINER functions in public schema (get_user_areas, get_user_chapters, is_superadmin).
-- 4. Optimizes auth.uid() lookups with (SELECT auth.uid()) for initplan subquery caching.
-- 5. Harmonizes 4-tier RBAC across all tables: National Coordinator, Area Leadership, Domain Moderators (Campus, Lit, Kids, High), Chapter Servants, and Members.
-- 6. Adds missing delete policies (e.g. events_delete_policy, member_services_update_policy).
-- 7. Silences RLS without policy warnings on internal telemetry tables (auth_rate_limits, login_failures).

-- 1. Harden app_private functions with immutable search_path
CREATE OR REPLACE FUNCTION app_private.current_role() RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = (SELECT auth.uid());
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, app_private, pg_temp;

CREATE OR REPLACE FUNCTION app_private.current_area_id() RETURNS uuid AS $$
  SELECT area_id FROM public.profiles WHERE id = (SELECT auth.uid());
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, app_private, pg_temp;

CREATE OR REPLACE FUNCTION app_private.current_chapter_id() RETURNS uuid AS $$
  SELECT chapter_id FROM public.profiles WHERE id = (SELECT auth.uid());
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, app_private, pg_temp;

CREATE OR REPLACE FUNCTION app_private.current_member_id() RETURNS uuid AS $$
  SELECT member_id FROM public.profiles WHERE id = (SELECT auth.uid());
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, app_private, pg_temp;

CREATE OR REPLACE FUNCTION app_private.current_user_is_active() RETURNS boolean AS $$
  SELECT COALESCE(is_active, false) FROM public.profiles WHERE id = (SELECT auth.uid());
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, app_private, pg_temp;

-- 2. Drop obsolete legacy functions that exposed SECURITY DEFINER to anon/authenticated
DROP FUNCTION IF EXISTS public.get_user_areas();
DROP FUNCTION IF EXISTS public.get_user_chapters();
DROP FUNCTION IF EXISTS public.is_superadmin();

-- 3. Drop all dead / redundant permissive policies
DROP POLICY IF EXISTS "Activity Reports Insert Access" ON public.activity_reports;
DROP POLICY IF EXISTS "Activity Reports Read Access" ON public.activity_reports;
DROP POLICY IF EXISTS "GIG Contributions Read Access" ON public.gig_contributions;
DROP POLICY IF EXISTS "GIG Contributions Write Access" ON public.gig_contributions;
DROP POLICY IF EXISTS "Members Read Access" ON public.members;
DROP POLICY IF EXISTS "Members Update Access" ON public.members;

-- 4. Clean & Harden Profiles Policies
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT TO authenticated
USING (
  (id = (SELECT auth.uid())) OR
  (
    app_private.current_user_is_active() AND
    (
      (app_private.current_role() = 'national_coordinator'::text) OR
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
      (
        (app_private.current_role() = 'chapter_servant'::text) AND
        (chapter_id = app_private.current_chapter_id())
      )
    )
  )
);

-- 5. Clean & Harden System Developers
DROP POLICY IF EXISTS "system_developers_read_authenticated" ON public.system_developers;
CREATE POLICY "system_developers_read_authenticated" ON public.system_developers
FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- 6. Clean & Harden Chapters Policies
DROP POLICY IF EXISTS "chapters_select_policy" ON public.chapters;
CREATE POLICY "chapters_select_policy" ON public.chapters
FOR SELECT TO authenticated
USING (app_private.current_user_is_active());

DROP POLICY IF EXISTS "chapters_insert_policy" ON public.chapters;
CREATE POLICY "chapters_insert_policy" ON public.chapters
FOR INSERT TO authenticated
WITH CHECK (
  app_private.current_user_is_active() AND
  (
    (app_private.current_role() = 'national_coordinator'::text) OR
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
    )
  )
);

DROP POLICY IF EXISTS "chapters_update_policy" ON public.chapters;
CREATE POLICY "chapters_update_policy" ON public.chapters
FOR UPDATE TO authenticated
USING (
  app_private.current_user_is_active() AND
  (
    (app_private.current_role() = 'national_coordinator'::text) OR
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
    )
  )
);

DROP POLICY IF EXISTS "chapters_delete_policy" ON public.chapters;
CREATE POLICY "chapters_delete_policy" ON public.chapters
FOR DELETE TO authenticated
USING (
  app_private.current_user_is_active() AND
  (
    (app_private.current_role() = 'national_coordinator'::text) OR
    (
      (app_private.current_role() = ANY (ARRAY['couple_coordinator'::text, 'area_servant'::text])) AND
      (area_id = app_private.current_area_id())
    )
  )
);

-- 7. Clean & Harden Events Policies
DROP POLICY IF EXISTS "events_select_policy" ON public.events;
CREATE POLICY "events_select_policy" ON public.events
FOR SELECT TO authenticated
USING (
  app_private.current_user_is_active() AND
  (
    (app_private.current_role() = 'national_coordinator'::text) OR
    (area_id = app_private.current_area_id())
  )
);

DROP POLICY IF EXISTS "events_insert_policy" ON public.events;
CREATE POLICY "events_insert_policy" ON public.events
FOR INSERT TO authenticated
WITH CHECK (
  app_private.current_user_is_active() AND
  (
    (app_private.current_role() = 'national_coordinator'::text) OR
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
    )
  )
);

DROP POLICY IF EXISTS "events_update_policy" ON public.events;
CREATE POLICY "events_update_policy" ON public.events
FOR UPDATE TO authenticated
USING (
  app_private.current_user_is_active() AND
  (
    (app_private.current_role() = 'national_coordinator'::text) OR
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
    )
  )
);

DROP POLICY IF EXISTS "events_delete_policy" ON public.events;
CREATE POLICY "events_delete_policy" ON public.events
FOR DELETE TO authenticated
USING (
  app_private.current_user_is_active() AND
  (
    (app_private.current_role() = 'national_coordinator'::text) OR
    (
      (app_private.current_role() = ANY (ARRAY['couple_coordinator'::text, 'area_servant'::text])) AND
      (area_id = app_private.current_area_id())
    )
  )
);

-- 8. Clean & Harden Event Participants Policies
DROP POLICY IF EXISTS "event_participants_select_policy" ON public.event_participants;
CREATE POLICY "event_participants_select_policy" ON public.event_participants
FOR SELECT TO authenticated
USING (
  app_private.current_user_is_active() AND
  (
    (member_id = app_private.current_member_id()) OR
    (
      EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = event_participants.event_id
          AND ((app_private.current_role() = 'national_coordinator'::text) OR (e.area_id = app_private.current_area_id()))
      ) AND
      (
        (app_private.current_role() = ANY (ARRAY[
          'national_coordinator'::text,
          'couple_coordinator'::text,
          'area_servant'::text,
          'campus_servant'::text,
          'lit_servant'::text,
          'area_kids_servant'::text,
          'mfc_high_servant'::text
        ])) OR
        (
          (app_private.current_role() = 'chapter_servant'::text) AND
          (
            (event_participants.member_id IS NULL) OR
            EXISTS (
              SELECT 1 FROM public.members m
              WHERE m.id = event_participants.member_id
                AND m.chapter_id = app_private.current_chapter_id()
            )
          )
        )
      )
    )
  )
);

DROP POLICY IF EXISTS "event_participants_insert_policy" ON public.event_participants;
CREATE POLICY "event_participants_insert_policy" ON public.event_participants
FOR INSERT TO authenticated
WITH CHECK (
  app_private.current_user_is_active() AND
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_participants.event_id
      AND ((app_private.current_role() = 'national_coordinator'::text) OR (e.area_id = app_private.current_area_id()))
  ) AND
  (
    (app_private.current_role() = ANY (ARRAY[
      'national_coordinator'::text,
      'couple_coordinator'::text,
      'area_servant'::text,
      'campus_servant'::text,
      'lit_servant'::text,
      'area_kids_servant'::text,
      'mfc_high_servant'::text
    ])) OR
    (
      (app_private.current_role() = 'chapter_servant'::text) AND
      (
        (event_participants.member_id IS NULL) OR
        EXISTS (
          SELECT 1 FROM public.members m
          WHERE m.id = event_participants.member_id
            AND m.chapter_id = app_private.current_chapter_id()
        )
      )
    )
  )
);

DROP POLICY IF EXISTS "event_participants_update_policy" ON public.event_participants;
CREATE POLICY "event_participants_update_policy" ON public.event_participants
FOR UPDATE TO authenticated
USING (
  app_private.current_user_is_active() AND
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_participants.event_id
      AND ((app_private.current_role() = 'national_coordinator'::text) OR (e.area_id = app_private.current_area_id()))
  ) AND
  (
    (app_private.current_role() = ANY (ARRAY[
      'national_coordinator'::text,
      'couple_coordinator'::text,
      'area_servant'::text,
      'campus_servant'::text,
      'lit_servant'::text,
      'area_kids_servant'::text,
      'mfc_high_servant'::text
    ])) OR
    (
      (app_private.current_role() = 'chapter_servant'::text) AND
      (
        (event_participants.member_id IS NULL) OR
        EXISTS (
          SELECT 1 FROM public.members m
          WHERE m.id = event_participants.member_id
            AND m.chapter_id = app_private.current_chapter_id()
        )
      )
    )
  )
);

DROP POLICY IF EXISTS "event_participants_delete_policy" ON public.event_participants;
CREATE POLICY "event_participants_delete_policy" ON public.event_participants
FOR DELETE TO authenticated
USING (
  app_private.current_user_is_active() AND
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_participants.event_id
      AND ((app_private.current_role() = 'national_coordinator'::text) OR (e.area_id = app_private.current_area_id()))
  ) AND
  (
    (app_private.current_role() = ANY (ARRAY[
      'national_coordinator'::text,
      'couple_coordinator'::text,
      'area_servant'::text,
      'campus_servant'::text,
      'lit_servant'::text,
      'area_kids_servant'::text,
      'mfc_high_servant'::text
    ])) OR
    (
      (app_private.current_role() = 'chapter_servant'::text) AND
      (
        (event_participants.member_id IS NULL) OR
        EXISTS (
          SELECT 1 FROM public.members m
          WHERE m.id = event_participants.member_id
            AND m.chapter_id = app_private.current_chapter_id()
        )
      )
    )
  )
);

-- 9. Clean & Harden Members Policies
DROP POLICY IF EXISTS "members_insert_policy" ON public.members;
CREATE POLICY "members_insert_policy" ON public.members
FOR INSERT TO authenticated
WITH CHECK (
  app_private.current_user_is_active() AND
  (
    (app_private.current_role() = 'national_coordinator'::text) OR
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
    (
      (app_private.current_role() = 'chapter_servant'::text) AND
      (chapter_id = app_private.current_chapter_id()) AND
      (area_id = app_private.current_area_id())
    )
  )
);

DROP POLICY IF EXISTS "members_update_policy" ON public.members;
CREATE POLICY "members_update_policy" ON public.members
FOR UPDATE TO authenticated
USING (
  app_private.current_user_is_active() AND
  (
    (id = app_private.current_member_id()) OR
    (app_private.current_role() = 'national_coordinator'::text) OR
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
    (
      (app_private.current_role() = 'chapter_servant'::text) AND
      (chapter_id = app_private.current_chapter_id())
    )
  )
);

-- 10. Clean & Harden Activity Reports Policies
DROP POLICY IF EXISTS "activity_reports_select_policy" ON public.activity_reports;
CREATE POLICY "activity_reports_select_policy" ON public.activity_reports
FOR SELECT TO authenticated
USING (
  app_private.current_user_is_active() AND
  (
    (app_private.current_role() = 'national_coordinator'::text) OR
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
    (
      (app_private.current_role() = 'chapter_servant'::text) AND
      (chapter_id = app_private.current_chapter_id())
    )
  )
);

DROP POLICY IF EXISTS "activity_reports_insert_policy" ON public.activity_reports;
CREATE POLICY "activity_reports_insert_policy" ON public.activity_reports
FOR INSERT TO authenticated
WITH CHECK (
  app_private.current_user_is_active() AND
  (
    (app_private.current_role() = 'national_coordinator'::text) OR
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
    (
      (app_private.current_role() = 'chapter_servant'::text) AND
      (chapter_id = app_private.current_chapter_id())
    )
  )
);

DROP POLICY IF EXISTS "activity_reports_update_policy" ON public.activity_reports;
CREATE POLICY "activity_reports_update_policy" ON public.activity_reports
FOR UPDATE TO authenticated
USING (
  app_private.current_user_is_active() AND
  (
    (app_private.current_role() = 'national_coordinator'::text) OR
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
    (
      (app_private.current_role() = 'chapter_servant'::text) AND
      (chapter_id = app_private.current_chapter_id())
    )
  )
);

DROP POLICY IF EXISTS "activity_reports_delete_policy" ON public.activity_reports;
CREATE POLICY "activity_reports_delete_policy" ON public.activity_reports
FOR DELETE TO authenticated
USING (
  app_private.current_user_is_active() AND
  (
    (app_private.current_role() = 'national_coordinator'::text) OR
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
    (
      (app_private.current_role() = 'chapter_servant'::text) AND
      (chapter_id = app_private.current_chapter_id())
    )
  )
);

-- 11. Clean & Harden GIG Contributions Policies
DROP POLICY IF EXISTS "gig_contributions_select_policy" ON public.gig_contributions;
CREATE POLICY "gig_contributions_select_policy" ON public.gig_contributions
FOR SELECT TO authenticated
USING (
  app_private.current_user_is_active() AND
  (
    (member_id = app_private.current_member_id()) OR
    (app_private.current_role() = 'national_coordinator'::text) OR
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
    (
      (app_private.current_role() = 'chapter_servant'::text) AND
      (chapter_id = app_private.current_chapter_id())
    )
  )
);

DROP POLICY IF EXISTS "gig_contributions_insert_policy" ON public.gig_contributions;
CREATE POLICY "gig_contributions_insert_policy" ON public.gig_contributions
FOR INSERT TO authenticated
WITH CHECK (
  app_private.current_user_is_active() AND
  (
    (app_private.current_role() = 'national_coordinator'::text) OR
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
    (
      (app_private.current_role() = 'chapter_servant'::text) AND
      (chapter_id = app_private.current_chapter_id())
    )
  )
);

DROP POLICY IF EXISTS "gig_contributions_update_policy" ON public.gig_contributions;
CREATE POLICY "gig_contributions_update_policy" ON public.gig_contributions
FOR UPDATE TO authenticated
USING (
  app_private.current_user_is_active() AND
  (
    (app_private.current_role() = 'national_coordinator'::text) OR
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
    (
      (app_private.current_role() = 'chapter_servant'::text) AND
      (chapter_id = app_private.current_chapter_id())
    )
  )
);

DROP POLICY IF EXISTS "gig_contributions_delete_policy" ON public.gig_contributions;
CREATE POLICY "gig_contributions_delete_policy" ON public.gig_contributions
FOR DELETE TO authenticated
USING (
  app_private.current_user_is_active() AND
  (
    (app_private.current_role() = 'national_coordinator'::text) OR
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
    (
      (app_private.current_role() = 'chapter_servant'::text) AND
      (chapter_id = app_private.current_chapter_id())
    )
  )
);

-- 12. Clean & Harden Services & Member Services Policies
DROP POLICY IF EXISTS "services_select_policy" ON public.services;
CREATE POLICY "services_select_policy" ON public.services
FOR SELECT TO authenticated
USING (
  app_private.current_user_is_active() AND
  (
    (app_private.current_role() = 'national_coordinator'::text) OR
    (area_id = app_private.current_area_id())
  )
);

DROP POLICY IF EXISTS "services_insert_policy" ON public.services;
CREATE POLICY "services_insert_policy" ON public.services
FOR INSERT TO authenticated
WITH CHECK (
  app_private.current_user_is_active() AND
  (
    (app_private.current_role() = 'national_coordinator'::text) OR
    (
      (app_private.current_role() = ANY (ARRAY['couple_coordinator'::text, 'area_servant'::text])) AND
      (area_id = app_private.current_area_id())
    )
  )
);

DROP POLICY IF EXISTS "services_update_policy" ON public.services;
CREATE POLICY "services_update_policy" ON public.services
FOR UPDATE TO authenticated
USING (
  app_private.current_user_is_active() AND
  (
    (app_private.current_role() = 'national_coordinator'::text) OR
    (
      (app_private.current_role() = ANY (ARRAY['couple_coordinator'::text, 'area_servant'::text])) AND
      (area_id = app_private.current_area_id())
    )
  )
);

DROP POLICY IF EXISTS "services_delete_policy" ON public.services;
CREATE POLICY "services_delete_policy" ON public.services
FOR DELETE TO authenticated
USING (
  app_private.current_user_is_active() AND
  (
    (app_private.current_role() = 'national_coordinator'::text) OR
    (
      (app_private.current_role() = ANY (ARRAY['couple_coordinator'::text, 'area_servant'::text])) AND
      (area_id = app_private.current_area_id())
    )
  )
);

DROP POLICY IF EXISTS "member_services_select_policy" ON public.member_services;
CREATE POLICY "member_services_select_policy" ON public.member_services
FOR SELECT TO authenticated
USING (
  app_private.current_user_is_active() AND
  (
    (member_id = app_private.current_member_id()) OR
    EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.id = member_services.member_id
        AND (
          (app_private.current_role() = 'national_coordinator'::text) OR
          (
            (app_private.current_role() = ANY (ARRAY[
              'couple_coordinator'::text,
              'area_servant'::text,
              'campus_servant'::text,
              'lit_servant'::text,
              'area_kids_servant'::text,
              'mfc_high_servant'::text
            ])) AND
            (m.area_id = app_private.current_area_id())
          ) OR
          (
            (app_private.current_role() = 'chapter_servant'::text) AND
            (m.chapter_id = app_private.current_chapter_id())
          )
        )
    )
  )
);

DROP POLICY IF EXISTS "member_services_insert_policy" ON public.member_services;
CREATE POLICY "member_services_insert_policy" ON public.member_services
FOR INSERT TO authenticated
WITH CHECK (
  app_private.current_user_is_active() AND
  EXISTS (
    SELECT 1 FROM public.members m
    WHERE m.id = member_services.member_id
      AND (
        (app_private.current_role() = 'national_coordinator'::text) OR
        (
          (app_private.current_role() = ANY (ARRAY[
            'couple_coordinator'::text,
            'area_servant'::text,
            'campus_servant'::text,
            'lit_servant'::text,
            'area_kids_servant'::text,
            'mfc_high_servant'::text
          ])) AND
          (m.area_id = app_private.current_area_id())
        ) OR
        (
          (app_private.current_role() = 'chapter_servant'::text) AND
          (m.chapter_id = app_private.current_chapter_id())
        )
      )
  )
);

DROP POLICY IF EXISTS "member_services_update_policy" ON public.member_services;
CREATE POLICY "member_services_update_policy" ON public.member_services
FOR UPDATE TO authenticated
USING (
  app_private.current_user_is_active() AND
  EXISTS (
    SELECT 1 FROM public.members m
    WHERE m.id = member_services.member_id
      AND (
        (app_private.current_role() = 'national_coordinator'::text) OR
        (
          (app_private.current_role() = ANY (ARRAY[
            'couple_coordinator'::text,
            'area_servant'::text,
            'campus_servant'::text,
            'lit_servant'::text,
            'area_kids_servant'::text,
            'mfc_high_servant'::text
          ])) AND
          (m.area_id = app_private.current_area_id())
        ) OR
        (
          (app_private.current_role() = 'chapter_servant'::text) AND
          (m.chapter_id = app_private.current_chapter_id())
        )
      )
  )
);

DROP POLICY IF EXISTS "member_services_delete_policy" ON public.member_services;
CREATE POLICY "member_services_delete_policy" ON public.member_services
FOR DELETE TO authenticated
USING (
  app_private.current_user_is_active() AND
  EXISTS (
    SELECT 1 FROM public.members m
    WHERE m.id = member_services.member_id
      AND (
        (app_private.current_role() = 'national_coordinator'::text) OR
        (
          (app_private.current_role() = ANY (ARRAY[
            'couple_coordinator'::text,
            'area_servant'::text,
            'campus_servant'::text,
            'lit_servant'::text,
            'area_kids_servant'::text,
            'mfc_high_servant'::text
          ])) AND
          (m.area_id = app_private.current_area_id())
        ) OR
        (
          (app_private.current_role() = 'chapter_servant'::text) AND
          (m.chapter_id = app_private.current_chapter_id())
        )
      )
  )
);

-- 13. Explicit Internal Telemetry Protection (Silences RLS without policy linter)
DROP POLICY IF EXISTS "internal_telemetry_deny_all" ON public.auth_rate_limits;
CREATE POLICY "internal_telemetry_deny_all" ON public.auth_rate_limits
FOR ALL TO anon, authenticated
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "internal_telemetry_deny_all" ON public.login_failures;
CREATE POLICY "internal_telemetry_deny_all" ON public.login_failures
FOR ALL TO anon, authenticated
USING (false)
WITH CHECK (false);
