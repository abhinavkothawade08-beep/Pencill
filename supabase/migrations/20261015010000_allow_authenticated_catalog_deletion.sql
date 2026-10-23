-- =============================================================================
-- PENCILL: ALLOW AUTHENTICATED CATALOG CURATION & DELETION
-- Migration: 20261015010000_allow_authenticated_catalog_deletion.sql
-- =============================================================================

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
  v_is_student BOOLEAN := FALSE;
BEGIN
  -- Check if caller is admin
  IF (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
     OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
     OR EXISTS (
       SELECT 1 FROM public.profiles 
       WHERE id = v_current_user_id AND (LOWER(tier) = 'admin' OR LOWER(tier) LIKE '%instructor%')
     ) THEN
    v_is_admin := TRUE;
  END IF;

  -- Check if caller has explicit restricted student role
  IF (auth.jwt() -> 'app_metadata' ->> 'role') = 'student'
     OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'student' THEN
    v_is_student := TRUE;
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

  -- Unauthenticated callers cannot delete
  IF v_current_user_id IS NULL AND NOT v_is_admin THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'UNAUTHORIZED',
      'message', 'Authentication required to delete learning paths'
    );
  END IF;

  -- System curated catalog tracks: allowed for authenticated users, except restricted student role without admin
  IF v_author_id IS NULL AND v_is_student AND NOT v_is_admin THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'FORBIDDEN',
      'message', 'Only administrators can delete system-curated catalog tracks'
    );
  END IF;

  -- Personal authored paths require author or admin
  IF v_author_id IS NOT NULL AND v_author_id <> v_current_user_id AND NOT v_is_admin THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'FORBIDDEN',
      'message', 'You do not have permission to delete this learning path'
    );
  END IF;

  -- 1. Delete itemized Quiz Responses for quiz attempts belonging to this path
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quiz_responses') THEN
    DELETE FROM public.quiz_responses
    WHERE attempt_id IN (
      SELECT a.id FROM public.quiz_attempts a
      JOIN public.quizzes q ON q.id = a.quiz_id
      WHERE q.path_id = target_path_id
    );
  END IF;

  -- 2. Delete Quiz Attempts for quizzes belonging to this path
  DELETE FROM public.quiz_attempts
  WHERE quiz_id IN (SELECT id FROM public.quizzes WHERE path_id = target_path_id);

  -- 3. Delete Quiz Questions for quizzes belonging to this path
  DELETE FROM public.quiz_questions
  WHERE quiz_id IN (SELECT id FROM public.quizzes WHERE path_id = target_path_id);

  -- 4. Delete Quizzes belonging to this path
  DELETE FROM public.quizzes
  WHERE path_id = target_path_id;

  -- 5. Delete User Notes linked to this path or its lessons
  DELETE FROM public.user_notes
  WHERE path_id = target_path_id
     OR lesson_id IN (
       SELECT l.id FROM public.lessons l
       JOIN public.modules m ON m.id = l.module_id
       WHERE m.path_id = target_path_id
     );

  -- 6. Delete Bookmarks linked to this path or its lessons
  DELETE FROM public.bookmarks
  WHERE path_id = target_path_id
     OR resource_id IN (
       SELECT l.id FROM public.lessons l
       JOIN public.modules m ON m.id = l.module_id
       WHERE m.path_id = target_path_id
     );

  -- 7. Delete Progress Records linked to this path or its lessons
  DELETE FROM public.progress_records
  WHERE path_id = target_path_id
     OR lesson_id IN (
       SELECT l.id FROM public.lessons l
       JOIN public.modules m ON m.id = l.module_id
       WHERE m.path_id = target_path_id
     );

  -- 8. Delete Enrollments for this course (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'enrollments') THEN
    DELETE FROM public.enrollments
    WHERE course_id = target_path_id;
  END IF;

  -- 9. Delete Course Sources linked to this path or its lessons (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'course_sources') THEN
    DELETE FROM public.course_sources
    WHERE course_id = target_path_id
       OR lesson_id IN (
         SELECT l.id FROM public.lessons l
         JOIN public.modules m ON m.id = l.module_id
         WHERE m.path_id = target_path_id
       );
  END IF;

  -- 10. Delete Lessons belonging to modules of this path
  DELETE FROM public.lessons
  WHERE module_id IN (SELECT id FROM public.modules WHERE path_id = target_path_id);

  -- 11. Delete Modules belonging to this path
  DELETE FROM public.modules
  WHERE path_id = target_path_id;

  -- 12. Finally delete the learning path itself
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
