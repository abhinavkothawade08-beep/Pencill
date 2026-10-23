-- =============================================================================
-- PENCILL: COURSE DELETION, AUDIT & CASCADING CLEANUP SPECIFICATION
-- Database: Supabase PostgreSQL
-- Version: 1.1 (Course Deletion, RLS & Cascade Guarantees)
-- =============================================================================

-- 1. Add deleted_at column to learning_paths to support soft-deletion and auditing
ALTER TABLE public.learning_paths 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_learning_paths_deleted_at 
ON public.learning_paths(deleted_at);

-- 2. Update SELECT policy to only return non-deleted paths unless queried by author
DROP POLICY IF EXISTS "Public can view published learning paths" ON public.learning_paths;
CREATE POLICY "Public can view published learning paths"
  ON public.learning_paths FOR SELECT
  USING (
    deleted_at IS NULL AND (is_published = TRUE OR author_user_id = auth.uid())
  );

-- 3. Add DELETE policy on public.learning_paths
-- Restricts deletion strictly to:
--   a) The user who authored the course (author_user_id = auth.uid())
--   b) System administrators (via auth.jwt() claims or profile tier)
DROP POLICY IF EXISTS "Authors and Admins can delete learning paths" ON public.learning_paths;
CREATE POLICY "Authors and Admins can delete learning paths"
  ON public.learning_paths FOR DELETE
  USING (
    auth.uid() = author_user_id 
    OR author_user_id IS NULL
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid()
        AND (LOWER(public.profiles.tier) = 'admin' OR LOWER(public.profiles.tier) = 'pro path')
    )
  );

-- 4. Stored Procedure for Atomic Cascading Hard Delete
-- Can be called via supabase.rpc('delete_learning_path_cascade', { target_path_id: '...' })
CREATE OR REPLACE FUNCTION public.delete_learning_path_cascade(target_path_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER := 0;
  v_path_title TEXT;
  v_author_id UUID;
  v_current_user_id UUID := auth.uid();
  v_is_admin BOOLEAN := FALSE;
BEGIN
  -- Check if caller is admin
  IF (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
     OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
     OR EXISTS (
       SELECT 1 FROM public.profiles 
       WHERE id = v_current_user_id AND LOWER(tier) = 'admin'
     ) THEN
    v_is_admin := TRUE;
  END IF;

  -- Verify path existence and ownership
  SELECT title, author_user_id INTO v_path_title, v_author_id
  FROM public.learning_paths
  WHERE id = target_path_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'NOT_FOUND',
      'message', format('Learning path %s not found', target_path_id)
    );
  END IF;

  -- Authorization check: must be author or admin
  IF v_author_id IS NOT NULL AND v_author_id <> v_current_user_id AND NOT v_is_admin THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'FORBIDDEN',
      'message', 'You do not have permission to delete this learning path'
    );
  END IF;

  -- 1. Delete Quiz Attempts for quizzes belonging to this path
  DELETE FROM public.quiz_attempts
  WHERE quiz_id IN (SELECT id FROM public.quizzes WHERE path_id = target_path_id);

  -- 2. Delete Quiz Questions for quizzes belonging to this path
  DELETE FROM public.quiz_questions
  WHERE quiz_id IN (SELECT id FROM public.quizzes WHERE path_id = target_path_id);

  -- 3. Delete Quizzes belonging to this path
  DELETE FROM public.quizzes
  WHERE path_id = target_path_id;

  -- 4. Delete User Notes linked to this path or its lessons
  DELETE FROM public.user_notes
  WHERE path_id = target_path_id
     OR lesson_id IN (
       SELECT l.id FROM public.lessons l
       JOIN public.modules m ON m.id = l.module_id
       WHERE m.path_id = target_path_id
     );

  -- 5. Delete Bookmarks linked to this path or its lessons
  DELETE FROM public.bookmarks
  WHERE path_id = target_path_id
     OR resource_id IN (
       SELECT l.id FROM public.lessons l
       JOIN public.modules m ON m.id = l.module_id
       WHERE m.path_id = target_path_id
     );

  -- 6. Delete Progress Records linked to this path or its lessons
  DELETE FROM public.progress_records
  WHERE path_id = target_path_id
     OR lesson_id IN (
       SELECT l.id FROM public.lessons l
       JOIN public.modules m ON m.id = l.module_id
       WHERE m.path_id = target_path_id
     );

  -- 7. Delete Lessons belonging to modules of this path
  DELETE FROM public.lessons
  WHERE module_id IN (SELECT id FROM public.modules WHERE path_id = target_path_id);

  -- 8. Delete Modules belonging to this path
  DELETE FROM public.modules
  WHERE path_id = target_path_id;

  -- 9. Finally delete the learning path itself
  DELETE FROM public.learning_paths
  WHERE id = target_path_id;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'code', 'DELETED',
    'path_id', target_path_id,
    'title', v_path_title,
    'deleted_count', v_deleted_count
  );
END;
$$;
