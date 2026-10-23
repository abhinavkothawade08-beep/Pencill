-- =============================================================================
-- PENCILL: AI QUIZ MAKER & ASSESSMENT PERSISTENCE MIGRATION
-- Migration: 20261013030000_quiz_maker_system.sql
-- =============================================================================

-- 1. Extend public.quizzes with dynamic generation and metadata attributes
ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS topic TEXT,
  ADD COLUMN IF NOT EXISTS subject TEXT,
  ADD COLUMN IF NOT EXISTS grade_level TEXT,
  ADD COLUMN IF NOT EXISTS curriculum TEXT,
  ADD COLUMN IF NOT EXISTS exam_target TEXT,
  ADD COLUMN IF NOT EXISTS knowledge_level TEXT DEFAULT 'intermediate',
  ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS question_count INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS question_format TEXT DEFAULT 'single_choice',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ready',
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON public.quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_topic ON public.quizzes(topic);
CREATE INDEX IF NOT EXISTS idx_quizzes_subject ON public.quizzes(subject);

-- 2. Extend public.quiz_questions with rich pedagogical metadata
ALTER TABLE public.quiz_questions
  ADD COLUMN IF NOT EXISTS question_type TEXT DEFAULT 'single_choice',
  ADD COLUMN IF NOT EXISTS difficulty TEXT,
  ADD COLUMN IF NOT EXISTS topic TEXT,
  ADD COLUMN IF NOT EXISTS subtopic TEXT,
  ADD COLUMN IF NOT EXISTS hint TEXT,
  ADD COLUMN IF NOT EXISTS estimated_seconds INTEGER DEFAULT 120,
  ADD COLUMN IF NOT EXISTS correct_options JSONB DEFAULT '[]'::jsonb;

-- 3. Extend public.quiz_attempts with lifecycle states and deadlines
ALTER TABLE public.quiz_attempts
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'submitted' CHECK (status IN ('in_progress', 'submitted', 'expired', 'abandoned')),
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS submission_timestamp TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS scoring_metadata JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_status ON public.quiz_attempts(user_id, status);

-- 4. Create public.quiz_responses for itemized response tracking
CREATE TABLE IF NOT EXISTS public.quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  selected_option TEXT,
  selected_options JSONB DEFAULT '[]'::jsonb,
  is_flagged BOOLEAN DEFAULT FALSE,
  is_correct BOOLEAN,
  answered_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  CONSTRAINT unique_attempt_question UNIQUE(attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_quiz_responses_attempt ON public.quiz_responses(attempt_id);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_question ON public.quiz_responses(question_id);

-- 5. RLS Policies
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;

-- Quizzes RLS
DROP POLICY IF EXISTS "Public can view quizzes" ON public.quizzes;
CREATE POLICY "Public can view quizzes"
  ON public.quizzes FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Users can insert their own quizzes" ON public.quizzes;
CREATE POLICY "Users can insert their own quizzes"
  ON public.quizzes FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own quizzes" ON public.quizzes;
CREATE POLICY "Users can update their own quizzes"
  ON public.quizzes FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own quizzes" ON public.quizzes;
CREATE POLICY "Users can delete their own quizzes"
  ON public.quizzes FOR DELETE
  USING (auth.uid() = user_id);

-- Quiz Questions RLS
DROP POLICY IF EXISTS "Public can view quiz questions" ON public.quiz_questions;
CREATE POLICY "Public can view quiz questions"
  ON public.quiz_questions FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Users can insert questions for their quizzes" ON public.quiz_questions;
CREATE POLICY "Users can insert questions for their quizzes"
  ON public.quiz_questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quizzes
      WHERE public.quizzes.id = public.quiz_questions.quiz_id
        AND (public.quizzes.user_id = auth.uid() OR public.quizzes.user_id IS NULL OR auth.role() = 'authenticated')
    )
  );

-- Quiz Attempts RLS
DROP POLICY IF EXISTS "Users can view only their own quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Users can view only their own quiz attempts"
  ON public.quiz_attempts FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert their own quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Users can insert their own quiz attempts"
  ON public.quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can update their own quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Users can update their own quiz attempts"
  ON public.quiz_attempts FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Quiz Responses RLS
DROP POLICY IF EXISTS "Users can manage responses to their own attempts" ON public.quiz_responses;
CREATE POLICY "Users can manage responses to their own attempts"
  ON public.quiz_responses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.quiz_attempts
      WHERE public.quiz_attempts.id = public.quiz_responses.attempt_id
        AND (public.quiz_attempts.user_id = auth.uid() OR public.quiz_attempts.user_id IS NULL)
    )
  );
