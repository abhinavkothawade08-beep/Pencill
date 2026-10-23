-- =============================================================================
-- PENCILL: FIX ENROLLMENTS TABLE & RLS SPECIFICATION
-- Migration: 20261015020000_fix_enrollments_table.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  completion_status TEXT DEFAULT 'in_progress' CHECK (completion_status IN ('enrolled', 'in_progress', 'completed', 'archived')),
  progress_percent NUMERIC(5, 2) DEFAULT 0.00,
  last_accessed_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  CONSTRAINT unique_user_course_enrollment UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments(user_id, completion_status);

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- 1. Users can view only their own enrollments
DROP POLICY IF EXISTS "Users can view only their own enrollments" ON public.enrollments;
CREATE POLICY "Users can view only their own enrollments"
  ON public.enrollments FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Users can enroll themselves in published or authored courses
DROP POLICY IF EXISTS "Users can enroll themselves in published courses" ON public.enrollments;
CREATE POLICY "Users can enroll themselves in published courses"
  ON public.enrollments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.learning_paths
      WHERE public.learning_paths.id = course_id
        AND (public.learning_paths.is_published = TRUE OR public.learning_paths.author_user_id = auth.uid())
    )
  );

-- 3. Users can update only their own enrollments
DROP POLICY IF EXISTS "Users can update their own enrollments" ON public.enrollments;
CREATE POLICY "Users can update their own enrollments"
  ON public.enrollments FOR UPDATE
  USING (auth.uid() = user_id);

-- 4. Users can unenroll from courses
DROP POLICY IF EXISTS "Users can unenroll from courses" ON public.enrollments;
CREATE POLICY "Users can unenroll from courses"
  ON public.enrollments FOR DELETE
  USING (auth.uid() = user_id);
