-- =============================================================================
-- PENCILL: EDITABLE COURSES & GRANULAR RLS SECURITY POLICIES
-- Migration: 20261103000000_editable_courses_rls.sql
-- Enables authors and administrators to safely edit, reorder, add, and remove
-- course metadata, syllabus modules, and lesson resources with strict tenant isolation.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. LEARNING PATHS: Safe Author & Admin Update Policy
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authors can update their own learning paths" ON public.learning_paths;
CREATE POLICY "Authors can update their own learning paths"
  ON public.learning_paths FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = author_user_id 
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    auth.uid() = author_user_id 
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- -----------------------------------------------------------------------------
-- 2. MODULES: Safe Author & Admin Mutation Policies
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authors can insert modules for their learning paths" ON public.modules;
CREATE POLICY "Authors can insert modules for their learning paths"
  ON public.modules FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.learning_paths
      WHERE public.learning_paths.id = public.modules.path_id
        AND (
          public.learning_paths.author_user_id = auth.uid()
          OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
          OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
        )
    )
  );

DROP POLICY IF EXISTS "Authors can update modules for their learning paths" ON public.modules;
CREATE POLICY "Authors can update modules for their learning paths"
  ON public.modules FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.learning_paths
      WHERE public.learning_paths.id = public.modules.path_id
        AND (
          public.learning_paths.author_user_id = auth.uid()
          OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
          OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.learning_paths
      WHERE public.learning_paths.id = public.modules.path_id
        AND (
          public.learning_paths.author_user_id = auth.uid()
          OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
          OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
        )
    )
  );

DROP POLICY IF EXISTS "Authors can delete modules for their learning paths" ON public.modules;
CREATE POLICY "Authors can delete modules for their learning paths"
  ON public.modules FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.learning_paths
      WHERE public.learning_paths.id = public.modules.path_id
        AND (
          public.learning_paths.author_user_id = auth.uid()
          OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
          OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
        )
    )
  );

-- -----------------------------------------------------------------------------
-- 3. LESSONS: Safe Author & Admin Mutation Policies
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authors can insert lessons for their modules" ON public.lessons;
CREATE POLICY "Authors can insert lessons for their modules"
  ON public.lessons FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.modules
      JOIN public.learning_paths ON public.learning_paths.id = public.modules.path_id
      WHERE public.modules.id = public.lessons.module_id
        AND (
          public.learning_paths.author_user_id = auth.uid()
          OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
          OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
        )
    )
  );

DROP POLICY IF EXISTS "Authors can update lessons for their modules" ON public.lessons;
CREATE POLICY "Authors can update lessons for their modules"
  ON public.lessons FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.modules
      JOIN public.learning_paths ON public.learning_paths.id = public.modules.path_id
      WHERE public.modules.id = public.lessons.module_id
        AND (
          public.learning_paths.author_user_id = auth.uid()
          OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
          OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.modules
      JOIN public.learning_paths ON public.learning_paths.id = public.modules.path_id
      WHERE public.modules.id = public.lessons.module_id
        AND (
          public.learning_paths.author_user_id = auth.uid()
          OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
          OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
        )
    )
  );

DROP POLICY IF EXISTS "Authors can delete lessons for their modules" ON public.lessons;
CREATE POLICY "Authors can delete lessons for their modules"
  ON public.lessons FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.modules
      JOIN public.learning_paths ON public.learning_paths.id = public.modules.path_id
      WHERE public.modules.id = public.lessons.module_id
        AND (
          public.learning_paths.author_user_id = auth.uid()
          OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
          OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
        )
    )
  );
