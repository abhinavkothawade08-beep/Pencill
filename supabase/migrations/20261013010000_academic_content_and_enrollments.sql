-- =============================================================================
-- PENCILL: REAL ACADEMIC CONTENT, ENROLLMENTS & COURSE SOURCES SCHEMA
-- Version: 1.2
-- Provides real, verifiable course sources and secure learner enrollments.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ENROLLMENTS TABLE (Learner Active Enrolled Courses)
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 2. COURSE SOURCES TABLE (Verifiable Academic Provenance & Attribution)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.course_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  lesson_id TEXT REFERENCES public.lessons(id) ON DELETE CASCADE,
  source_title TEXT NOT NULL,
  source_url TEXT NOT NULL,
  publisher_or_institution TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'oer_curriculum', -- e.g. 'oer_curriculum', 'lecture_notes', 'monograph', 'video'
  license_or_attribution TEXT,                        -- e.g. 'CC BY-NC-SA 4.0', 'Open Access'
  verification_status TEXT DEFAULT 'verified' CHECK (verification_status IN ('verified', 'unverified', 'pending', 'rejected')),
  last_verified_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_course_sources_course ON public.course_sources(course_id);
CREATE INDEX IF NOT EXISTS idx_course_sources_lesson ON public.course_sources(lesson_id);
CREATE INDEX IF NOT EXISTS idx_course_sources_verified ON public.course_sources(verification_status);

-- -----------------------------------------------------------------------------
-- 3. BOOKMARKS INTEGRITY CONSTRAINT
-- Prevent duplicate bookmarking of the same learning path or lesson resource
-- -----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_path_bookmark 
ON public.bookmarks (user_id, path_id) 
WHERE path_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_resource_bookmark 
ON public.bookmarks (user_id, resource_id) 
WHERE resource_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_sources ENABLE ROW LEVEL SECURITY;

-- Enrollments: Strict user privacy
DROP POLICY IF EXISTS "Users can view only their own enrollments" ON public.enrollments;
CREATE POLICY "Users can view only their own enrollments"
  ON public.enrollments FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can enroll themselves in published courses" ON public.enrollments;
CREATE POLICY "Users can enroll themselves in published courses"
  ON public.enrollments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.learning_paths
      WHERE public.learning_paths.id = course_id
        AND (public.learning_paths.is_published = TRUE OR public.learning_paths.author_user_id = auth.uid())
        AND public.learning_paths.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Users can update their own enrollments" ON public.enrollments;
CREATE POLICY "Users can update their own enrollments"
  ON public.enrollments FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unenroll from courses" ON public.enrollments;
CREATE POLICY "Users can unenroll from courses"
  ON public.enrollments FOR DELETE
  USING (auth.uid() = user_id);

-- Course Sources: Public verified read, authorized mutation
DROP POLICY IF EXISTS "Public can view verified course sources" ON public.course_sources;
CREATE POLICY "Public can view verified course sources"
  ON public.course_sources FOR SELECT
  USING (
    verification_status = 'verified'
    OR EXISTS (
      SELECT 1 FROM public.learning_paths
      WHERE public.learning_paths.id = course_sources.course_id
        AND (public.learning_paths.author_user_id = auth.uid() OR public.learning_paths.is_published = TRUE)
    )
  );

DROP POLICY IF EXISTS "Authenticated users can manage course sources for authored courses" ON public.course_sources;
CREATE POLICY "Authenticated users can manage course sources for authored courses"
  ON public.course_sources FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND (
      course_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.learning_paths
        WHERE public.learning_paths.id = course_sources.course_id
          AND public.learning_paths.author_user_id = auth.uid()
      )
    )
  );
