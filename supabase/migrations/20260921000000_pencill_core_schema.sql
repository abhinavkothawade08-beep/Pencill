-- =============================================================================
-- PENCILL CORE SCHEMA & ROW LEVEL SECURITY (RLS) SPECIFICATION
-- Database: Supabase PostgreSQL
-- Version: 1.0 (Phase 1 & 2 Supabase Foundation)
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. USERS & PROFILES
-- Extends Supabase auth.users with learner academic metadata
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  grade TEXT,
  avatar_url TEXT,
  target_exam TEXT,
  tier TEXT DEFAULT 'Pro Path',
  streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  weekly_goal_hours NUMERIC(4, 1) DEFAULT 18.0,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();

-- Auto-create profile upon Supabase auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', 'Scholar'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '/avatars/aanya-patel.png')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 2. LEARNING PATHS (Curated catalog & AI-generated personal paths)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.learning_paths (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  domain TEXT NOT NULL, -- e.g. 'Physics', 'Computer Science', 'Mathematics'
  level TEXT NOT NULL,  -- e.g. 'Foundation', 'Class 11', 'Class 12', 'Competitive', 'Undergraduate'
  duration_hours INTEGER NOT NULL DEFAULT 0,
  module_count INTEGER NOT NULL DEFAULT 0,
  verified BOOLEAN DEFAULT TRUE,
  enrolled_count INTEGER DEFAULT 0,
  average_completion TEXT DEFAULT '75.0%',
  syllabus_note TEXT,
  tags TEXT[] DEFAULT '{}',
  weekly_checkpoint JSONB DEFAULT '{}'::jsonb,
  is_published BOOLEAN DEFAULT TRUE,
  author_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL = System Curated; non-null = personal generated path
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TRIGGER set_learning_paths_updated_at
BEFORE UPDATE ON public.learning_paths
FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();

CREATE INDEX IF NOT EXISTS idx_learning_paths_domain ON public.learning_paths(domain);
CREATE INDEX IF NOT EXISTS idx_learning_paths_level ON public.learning_paths(level);
CREATE INDEX IF NOT EXISTS idx_learning_paths_published ON public.learning_paths(is_published);
CREATE INDEX IF NOT EXISTS idx_learning_paths_author ON public.learning_paths(author_user_id);

-- -----------------------------------------------------------------------------
-- 3. MODULES (Syllabus Pillars)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.modules (
  id TEXT PRIMARY KEY,
  path_id TEXT NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  module_number INTEGER NOT NULL,
  order_index INTEGER NOT NULL,
  status TEXT DEFAULT 'locked' CHECK (status IN ('completed', 'in_progress', 'locked')),
  total_resources INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TRIGGER set_modules_updated_at
BEFORE UPDATE ON public.modules
FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();

CREATE INDEX IF NOT EXISTS idx_modules_path_id ON public.modules(path_id);
CREATE INDEX IF NOT EXISTS idx_modules_order ON public.modules(path_id, order_index);

-- -----------------------------------------------------------------------------
-- 4. LESSONS (Atomic Units of Structured Learning)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lessons (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('video', 'monograph', 'practice', 'quiz', 'paper', 'formulae')),
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  source_name TEXT NOT NULL,
  source_url TEXT,
  order_index INTEGER NOT NULL,
  concept_id TEXT,
  prerequisites_note TEXT,
  chapters JSONB DEFAULT '[]'::jsonb,
  formulae JSONB DEFAULT '[]'::jsonb,
  summary_points TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TRIGGER set_lessons_updated_at
BEFORE UPDATE ON public.lessons
FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();

CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON public.lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_lessons_order ON public.lessons(module_id, order_index);
CREATE INDEX IF NOT EXISTS idx_lessons_type ON public.lessons(type);

-- -----------------------------------------------------------------------------
-- 5. RESOURCES (Curator & n8n Discovery Pool)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.resources (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('video', 'monograph', 'practice', 'quiz', 'paper', 'formulae')),
  duration_minutes INTEGER DEFAULT 0,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  description TEXT,
  external_id TEXT, -- e.g. YouTube Video ID, MIT OCW Course URI, arXiv paper ID
  quality_score NUMERIC(3, 2) DEFAULT 1.00,
  is_verified BOOLEAN DEFAULT FALSE,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_resources_external_id ON public.resources(external_id);
CREATE INDEX IF NOT EXISTS idx_resources_verified ON public.resources(is_verified);

-- -----------------------------------------------------------------------------
-- 6. PROGRESS RECORDS (Private Learner Progression)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.progress_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  module_id TEXT REFERENCES public.modules(id) ON DELETE CASCADE,
  path_id TEXT REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  time_spent_seconds INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  CONSTRAINT unique_user_lesson_progress UNIQUE(user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_progress_user ON public.progress_records(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_path ON public.progress_records(user_id, path_id);
CREATE INDEX IF NOT EXISTS idx_progress_completed ON public.progress_records(user_id, is_completed);

-- -----------------------------------------------------------------------------
-- 7. BOOKMARKS (Personal Learning Shelf)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id TEXT REFERENCES public.lessons(id) ON DELETE SET NULL,
  path_id TEXT REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  source TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('video', 'monograph', 'practice', 'formulae', 'path')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_category ON public.bookmarks(user_id, category);

-- -----------------------------------------------------------------------------
-- 8. USER NOTES (Timestamped in-context lecture annotations)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  path_id TEXT REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  timestamp_marker TEXT, -- e.g. "14:22"
  seconds_marker INTEGER DEFAULT 0,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TRIGGER set_user_notes_updated_at
BEFORE UPDATE ON public.user_notes
FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();

CREATE INDEX IF NOT EXISTS idx_notes_user_lesson ON public.user_notes(user_id, lesson_id);

-- -----------------------------------------------------------------------------
-- 9. QUIZZES, QUESTIONS & ATTEMPTS (Formative Evaluation)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quizzes (
  id TEXT PRIMARY KEY,
  path_id TEXT REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  time_limit_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id TEXT PRIMARY KEY,
  quiz_id TEXT NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  prompt TEXT NOT NULL,
  stem_note TEXT,
  options JSONB NOT NULL, -- Array of { id: 'A', text: '...', latex: '...' }
  correct_option_id TEXT NOT NULL,
  explanation TEXT,
  formula_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON public.quiz_questions(quiz_id, question_number);

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id TEXT NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score NUMERIC(5, 2) DEFAULT 0.00,
  accuracy_percent INTEGER DEFAULT 0,
  answers JSONB DEFAULT '{}'::jsonb, -- Map of question_index: selected_option
  flagged_questions INTEGER[] DEFAULT '{}',
  completed_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON public.quiz_attempts(user_id, quiz_id);

-- -----------------------------------------------------------------------------
-- 10. AI GENERATION RECORDS (Gemini Provenance & Audit Ledger)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_generation_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  prompt_input TEXT NOT NULL,
  raw_output JSONB NOT NULL,
  model_version TEXT NOT NULL DEFAULT 'gemini-1.5-pro',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed', 'published')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_generation_user ON public.ai_generation_records(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generation_status ON public.ai_generation_records(status);

-- -----------------------------------------------------------------------------
-- 11. DISCOVERY JOBS (n8n Automated Ingestion & Freshness Checks)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.discovery_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  source_platform TEXT NOT NULL, -- 'YouTube', 'MIT OCW', 'NPTEL', 'arXiv'
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  found_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_discovery_status ON public.discovery_jobs(status);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict boundary isolation: Public curated content vs Private user progress
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_jobs ENABLE ROW LEVEL SECURITY;

-- 1. Profiles: Users can view and update only their own profile
CREATE POLICY "Profiles are viewable by owner"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. Learning Paths: Public can read published paths; creators can read their own drafts
CREATE POLICY "Public can view published learning paths"
  ON public.learning_paths FOR SELECT
  USING (is_published = TRUE OR author_user_id = auth.uid());

CREATE POLICY "Authenticated users can create personal learning paths"
  ON public.learning_paths FOR INSERT
  WITH CHECK (auth.uid() = author_user_id);

CREATE POLICY "Authors can update their own learning paths"
  ON public.learning_paths FOR UPDATE
  USING (auth.uid() = author_user_id);

-- 3. Modules: Viewable if parent path is accessible
CREATE POLICY "Modules viewable if path accessible"
  ON public.modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.learning_paths
      WHERE public.learning_paths.id = public.modules.path_id
        AND (public.learning_paths.is_published = TRUE OR public.learning_paths.author_user_id = auth.uid())
    )
  );

-- 4. Lessons: Viewable if module & path are accessible
CREATE POLICY "Lessons viewable if path accessible"
  ON public.lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.modules
      JOIN public.learning_paths ON public.learning_paths.id = public.modules.path_id
      WHERE public.modules.id = public.lessons.module_id
        AND (public.learning_paths.is_published = TRUE OR public.learning_paths.author_user_id = auth.uid())
    )
  );

-- 5. Resources: Verified resources are publicly readable
CREATE POLICY "Verified resources are viewable by public"
  ON public.resources FOR SELECT
  USING (is_verified = TRUE);

-- 6. Progress Records: Strictly private to the user
CREATE POLICY "Users can view only their own progress"
  ON public.progress_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON public.progress_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON public.progress_records FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress"
  ON public.progress_records FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Bookmarks: Strictly private to the user
CREATE POLICY "Users can view only their own bookmarks"
  ON public.bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookmarks"
  ON public.bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
  ON public.bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- 8. User Notes: Strictly private to the user
CREATE POLICY "Users can view only their own notes"
  ON public.user_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes"
  ON public.user_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
  ON public.user_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
  ON public.user_notes FOR DELETE
  USING (auth.uid() = user_id);

-- 9. Quizzes & Questions: Publicly viewable
CREATE POLICY "Public can view quizzes"
  ON public.quizzes FOR SELECT
  USING (TRUE);

CREATE POLICY "Public can view quiz questions"
  ON public.quiz_questions FOR SELECT
  USING (TRUE);

-- 10. Quiz Attempts: Strictly private to the user
CREATE POLICY "Users can view only their own quiz attempts"
  ON public.quiz_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz attempts"
  ON public.quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 11. AI Generation Records: Creators can view their own generation audits
CREATE POLICY "Users can view their own AI generation records"
  ON public.ai_generation_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create AI generation records"
  ON public.ai_generation_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);
