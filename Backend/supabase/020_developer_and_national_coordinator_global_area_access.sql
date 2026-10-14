-- Migration 020: Developer and National Coordinator Global Area Access & Harmonized RLS
-- 1. Creates app_private.is_developer() to verify system_developers membership and profiles.is_developer.
-- 2. Creates app_private.is_global_admin() to unify National Coordinator and Developer oversight.
-- 3. Adds areas_insert_policy and areas_update_policy to allow area database creation and administration.
-- 4. Harmonizes all table RLS policies using is_global_admin() for seamless multi-area operations.

-- 1. Helper functions
CREATE OR REPLACE FUNCTION app_private.is_developer() RETURNS boolean AS $$
  SELECT COALESCE(
    EXISTS (
      SELECT 1 FROM public.system_developers WHERE user_id = (SELECT auth.uid())
    ) OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND is_developer = true
    ),
    false
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, app_private, pg_temp;

CREATE OR REPLACE FUNCTION app_private.is_global_admin() RETURNS boolean AS $$
  SELECT (app_private.current_role() = 'national_coordinator'::text) OR app_private.is_developer();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, app_private, pg_temp;

-- 2. Areas Table Policies
CREATE POLICY "areas_insert_policy" ON public.areas
FOR INSERT TO authenticated
WITH CHECK (
  app_private.current_user_is_active() AND
  (
    app_private.is_global_admin() OR
    app_private.current_area_id() IS NULL
  )
);

CREATE POLICY "areas_update_policy" ON public.areas
FOR UPDATE TO authenticated
USING (
  app_private.current_user_is_active() AND
  app_private.is_global_admin()
);

-- 3. Chapters Table Policies
ALTER POLICY "chapters_insert_policy" ON public.chapters
WITH CHECK (
  app_private.current_user_is_active() AND
  (
    app_private.is_global_admin() OR
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

ALTER POLICY "chapters_update_policy" ON public.chapters
USING (
  app_private.current_user_is_active() AND
  (
    app_private.is_global_admin() OR
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

ALTER POLICY "chapters_delete_policy" ON public.chapters
USING (
  app_private.current_user_is_active() AND
  (
    app_private.is_global_admin() OR
    (
      (app_private.current_role() = ANY (ARRAY['couple_coordinator'::text, 'area_servant'::text])) AND
      (area_id = app_private.current_area_id())
    )
  )
);

-- 4. Events Table Policies
ALTER POLICY "events_select_policy" ON public.events
USING (
  app_private.current_user_is_active() AND
  (
    app_private.is_global_admin() OR
    (area_id = app_private.current_area_id())
  )
);

ALTER POLICY "events_insert_policy" ON public.events
WITH CHECK (
  app_private.current_user_is_active() AND
  (
    app_private.is_global_admin() OR
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

ALTER POLICY "events_update_policy" ON public.events
USING (
  app_private.current_user_is_active() AND
  (
    app_private.is_global_admin() OR
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

ALTER POLICY "events_delete_policy" ON public.events
USING (
  app_private.current_user_is_active() AND
  (
    app_private.is_global_admin() OR
    (
      (app_private.current_role() = ANY (ARRAY['couple_coordinator'::text, 'area_servant'::text])) AND
      (area_id = app_private.current_area_id())
    )
  )
);

-- 5. Event Participants Table Policies
ALTER POLICY "event_participants_select_policy" ON public.event_participants
USING (
  app_private.current_user_is_active() AND
  (
    (member_id = app_private.current_member_id()) OR
    (
      EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = event_participants.event_id
          AND (app_private.is_global_admin() OR (e.area_id = app_private.current_area_id()))
      ) AND
      (
        app_private.is_global_admin() OR
        (app_private.current_role() = ANY (ARRAY[
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

ALTER POLICY "event_participants_insert_policy" ON public.event_participants
WITH CHECK (
  app_private.current_user_is_active() AND
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_participants.event_id
      AND (app_private.is_global_admin() OR (e.area_id = app_private.current_area_id()))
  ) AND
  (
    app_private.is_global_admin() OR
    (app_private.current_role() = ANY (ARRAY[
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

ALTER POLICY "event_participants_update_policy" ON public.event_participants
USING (
  app_private.current_user_is_active() AND
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_participants.event_id
      AND (app_private.is_global_admin() OR (e.area_id = app_private.current_area_id()))
  ) AND
  (
    app_private.is_global_admin() OR
    (app_private.current_role() = ANY (ARRAY[
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

ALTER POLICY "event_participants_delete_policy" ON public.event_participants
USING (
  app_private.current_user_is_active() AND
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_participants.event_id
      AND (app_private.is_global_admin() OR (e.area_id = app_private.current_area_id()))
  ) AND
  (
    app_private.is_global_admin() OR
    (app_private.current_role() = ANY (ARRAY[
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

-- 6. Members Table Policies
ALTER POLICY "members_select_policy" ON public.members
USING (
  (id = app_private.current_member_id()) OR
  (
    app_private.current_user_is_active() AND
    (
      app_private.is_global_admin() OR
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

ALTER POLICY "members_insert_policy" ON public.members
WITH CHECK (
  app_private.current_user_is_active() AND
  (
    app_private.is_global_admin() OR
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

ALTER POLICY "members_update_policy" ON public.members
USING (
  app_private.current_user_is_active() AND
  (
    (id = app_private.current_member_id()) OR
    app_private.is_global_admin() OR
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

ALTER POLICY "members_delete_policy" ON public.members
USING (
  app_private.current_user_is_active() AND
  (
    app_private.is_global_admin() OR
    (
      (app_private.current_role() = ANY (ARRAY['couple_coordinator'::text, 'area_servant'::text])) AND
      (area_id = app_private.current_area_id())
    )
  )
);

-- 7. Activity Reports Table Policies
ALTER POLICY "activity_reports_select_policy" ON public.activity_reports
USING (
  app_private.current_user_is_active() AND
  (
    app_private.is_global_admin() OR
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

ALTER POLICY "activity_reports_insert_policy" ON public.activity_reports
WITH CHECK (
  app_private.current_user_is_active() AND
  (
    app_private.is_global_admin() OR
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

ALTER POLICY "activity_reports_update_policy" ON public.activity_reports
USING (
  app_private.current_user_is_active() AND
  (
    app_private.is_global_admin() OR
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

ALTER POLICY "activity_reports_delete_policy" ON public.activity_reports
USING (
  app_private.current_user_is_active() AND
  (
    app_private.is_global_admin() OR
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

-- 8. GIG Contributions Table Policies
ALTER POLICY "gig_contributions_select_policy" ON public.gig_contributions
USING (
  app_private.current_user_is_active() AND
  (
    (member_id = app_private.current_member_id()) OR
    app_private.is_global_admin() OR
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

ALTER POLICY "gig_contributions_insert_policy" ON public.gig_contributions
WITH CHECK (
  app_private.current_user_is_active() AND
  (
    app_private.is_global_admin() OR
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

ALTER POLICY "gig_contributions_update_policy" ON public.gig_contributions
USING (
  app_private.current_user_is_active() AND
  (
    app_private.is_global_admin() OR
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

ALTER POLICY "gig_contributions_delete_policy" ON public.gig_contributions
USING (
  app_private.current_user_is_active() AND
  (
    app_private.is_global_admin() OR
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

-- 9. Services Table Policies
ALTER POLICY "services_select_policy" ON public.services
USING (
  app_private.current_user_is_active() AND
  (
    app_private.is_global_admin() OR
    (area_id = app_private.current_area_id())
  )
);

ALTER POLICY "services_insert_policy" ON public.services
WITH CHECK (
  app_private.current_user_is_active() AND
  (
    app_private.is_global_admin() OR
    (
      (app_private.current_role() = ANY (ARRAY['couple_coordinator'::text, 'area_servant'::text])) AND
      (area_id = app_private.current_area_id())
    )
  )
);

ALTER POLICY "services_update_policy" ON public.services
USING (
  app_private.current_user_is_active() AND
  (
    app_private.is_global_admin() OR
    (
      (app_private.current_role() = ANY (ARRAY['couple_coordinator'::text, 'area_servant'::text])) AND
      (area_id = app_private.current_area_id())
    )
  )
);

ALTER POLICY "services_delete_policy" ON public.services
USING (
  app_private.current_user_is_active() AND
  (
    app_private.is_global_admin() OR
    (
      (app_private.current_role() = ANY (ARRAY['couple_coordinator'::text, 'area_servant'::text])) AND
      (area_id = app_private.current_area_id())
    )
  )
);

-- 10. Member Services Table Policies
ALTER POLICY "member_services_select_policy" ON public.member_services
USING (
  app_private.current_user_is_active() AND
  (
    (member_id = app_private.current_member_id()) OR
    EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.id = member_services.member_id
        AND (
          app_private.is_global_admin() OR
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

ALTER POLICY "member_services_insert_policy" ON public.member_services
WITH CHECK (
  app_private.current_user_is_active() AND
  EXISTS (
    SELECT 1 FROM public.members m
    WHERE m.id = member_services.member_id
      AND (
        app_private.is_global_admin() OR
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

ALTER POLICY "member_services_update_policy" ON public.member_services
USING (
  app_private.current_user_is_active() AND
  EXISTS (
    SELECT 1 FROM public.members m
    WHERE m.id = member_services.member_id
      AND (
        app_private.is_global_admin() OR
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

ALTER POLICY "member_services_delete_policy" ON public.member_services
USING (
  app_private.current_user_is_active() AND
  EXISTS (
    SELECT 1 FROM public.members m
    WHERE m.id = member_services.member_id
      AND (
        app_private.is_global_admin() OR
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

-- 11. Profiles Table Policies
ALTER POLICY "profiles_select_policy" ON public.profiles
USING (
  (id = (SELECT auth.uid())) OR
  (
    app_private.current_user_is_active() AND
    (
      app_private.is_global_admin() OR
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
