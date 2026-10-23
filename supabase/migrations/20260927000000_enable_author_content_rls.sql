-- =============================================================================
-- PENCILL: AUTHOR CONTENT RLS POLICIES
-- Enables authenticated learners to create, update, and manage modules and lessons
-- belonging to personal learning paths they author, plus manage discovered resources.
-- =============================================================================

-- 1. Modules: Authors can create, update, and delete modules for their learning paths
DROP POLICY IF EXISTS "Authors can insert modules for their learning paths" ON public.modules;
CREATE POLICY "Authors can insert modules for their learning paths"
  ON public.modules FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.learning_paths
      WHERE public.learning_paths.id = public.modules.path_id
        AND public.learning_paths.author_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authors can update modules for their learning paths" ON public.modules;
CREATE POLICY "Authors can update modules for their learning paths"
  ON public.modules FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.learning_paths
      WHERE public.learning_paths.id = public.modules.path_id
        AND public.learning_paths.author_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authors can delete modules for their learning paths" ON public.modules;
CREATE POLICY "Authors can delete modules for their learning paths"
  ON public.modules FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.learning_paths
      WHERE public.learning_paths.id = public.modules.path_id
        AND public.learning_paths.author_user_id = auth.uid()
    )
  );

-- 2. Lessons: Authors can create, update, and delete lessons for their modules
DROP POLICY IF EXISTS "Authors can insert lessons for their modules" ON public.lessons;
CREATE POLICY "Authors can insert lessons for their modules"
  ON public.lessons FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.modules
      JOIN public.learning_paths ON public.learning_paths.id = public.modules.path_id
      WHERE public.modules.id = public.lessons.module_id
        AND public.learning_paths.author_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authors can update lessons for their modules" ON public.lessons;
CREATE POLICY "Authors can update lessons for their modules"
  ON public.lessons FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.modules
      JOIN public.learning_paths ON public.learning_paths.id = public.modules.path_id
      WHERE public.modules.id = public.lessons.module_id
        AND public.learning_paths.author_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authors can delete lessons for their modules" ON public.lessons;
CREATE POLICY "Authors can delete lessons for their modules"
  ON public.lessons FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.modules
      JOIN public.learning_paths ON public.learning_paths.id = public.modules.path_id
      WHERE public.modules.id = public.lessons.module_id
        AND public.learning_paths.author_user_id = auth.uid()
    )
  );

-- 3. Resources: Authenticated learners can insert and update verified discovered resources (enables upsert)
DROP POLICY IF EXISTS "Authenticated users can insert resources" ON public.resources;
CREATE POLICY "Authenticated users can insert resources"
  ON public.resources FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update resources" ON public.resources;
CREATE POLICY "Authenticated users can update resources"
  ON public.resources FOR UPDATE
  USING (auth.role() = 'authenticated');
