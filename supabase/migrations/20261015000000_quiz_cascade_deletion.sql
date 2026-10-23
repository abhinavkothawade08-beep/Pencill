-- =============================================================================
-- PENCILL: QUIZ CASCADE DELETION SPECIFICATION
-- Database: Supabase PostgreSQL
-- Migration: 20261015000000_quiz_cascade_deletion.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION public.delete_quiz_cascade(target_quiz_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quiz_title TEXT;
  v_author_id UUID;
  v_current_user_id UUID := auth.uid();
  v_is_admin BOOLEAN := FALSE;
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

  -- Verify quiz existence and ownership
  SELECT title, user_id INTO v_quiz_title, v_author_id
  FROM public.quizzes
  WHERE id = target_quiz_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'NOT_FOUND',
      'message', format('Quiz %s not found', target_quiz_id)
    );
  END IF;

  -- Authorization check: system standard quizzes require admin; personal quizzes require author or admin
  IF v_author_id IS NULL AND NOT v_is_admin THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'FORBIDDEN',
      'message', 'Only administrators can delete system catalog quizzes'
    );
  END IF;

  IF v_author_id IS NOT NULL AND v_author_id <> v_current_user_id AND NOT v_is_admin THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'FORBIDDEN',
      'message', 'You do not have permission to delete this quiz'
    );
  END IF;

  -- 1. Delete itemized Quiz Responses for quiz attempts belonging to this quiz
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quiz_responses') THEN
    DELETE FROM public.quiz_responses
    WHERE attempt_id IN (
      SELECT id FROM public.quiz_attempts WHERE quiz_id = target_quiz_id
    );
  END IF;

  -- 2. Delete Quiz Attempts for this quiz
  DELETE FROM public.quiz_attempts
  WHERE quiz_id = target_quiz_id;

  -- 3. Delete Quiz Questions for this quiz
  DELETE FROM public.quiz_questions
  WHERE quiz_id = target_quiz_id;

  -- 4. Delete Bookmarks pointing to this quiz
  DELETE FROM public.bookmarks
  WHERE resource_id = target_quiz_id;

  -- 5. Delete the Quiz itself
  DELETE FROM public.quizzes
  WHERE id = target_quiz_id;

  RETURN jsonb_build_object(
    'success', true,
    'quiz_id', target_quiz_id,
    'message', format('Quiz "%s" and all dependent attempts and questions deleted successfully', v_quiz_title)
  );
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_quiz_cascade(TEXT) TO authenticated;

-- Ensure RLS policies on public.quizzes allow author and admin deletion
DROP POLICY IF EXISTS "Users and admins can delete quizzes" ON public.quizzes;
CREATE POLICY "Users and admins can delete quizzes"
  ON public.quizzes FOR DELETE
  USING (
    auth.uid() = user_id 
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
