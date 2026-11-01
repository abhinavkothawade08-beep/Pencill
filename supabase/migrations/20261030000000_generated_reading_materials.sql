-- =============================================================================
-- PENCILL: ON-DEMAND AI READING MATERIAL PERSISTENCE SCHEMA
-- Table: generated_reading_materials
-- Version: 1.0
-- Persists validated educational reading monographs and study notes generated
-- on-demand by the Pencill Academic Engine via Gemini AI.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.generated_reading_materials (
  id TEXT PRIMARY KEY DEFAULT ('read_' || gen_random_uuid()::text),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  course_id TEXT NOT NULL,
  module_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  content_format TEXT NOT NULL DEFAULT 'structured_json',
  language TEXT NOT NULL DEFAULT 'en',
  academic_level TEXT NOT NULL DEFAULT 'undergraduate',
  learning_objectives JSONB DEFAULT '[]'::jsonb,
  generation_model TEXT NOT NULL,
  generation_status TEXT NOT NULL CHECK (generation_status IN ('generating', 'completed', 'failed')),
  content_hash TEXT,
  source_metadata JSONB DEFAULT '{}'::jsonb,
  token_usage JSONB DEFAULT '{}'::jsonb,
  reading_duration_minutes INTEGER DEFAULT 15,
  generated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Ensure non-blocking constraints for dynamic & offline courses
ALTER TABLE public.generated_reading_materials 
  DROP CONSTRAINT IF EXISTS generated_reading_materials_course_id_fkey,
  DROP CONSTRAINT IF EXISTS generated_reading_materials_module_id_fkey,
  DROP CONSTRAINT IF EXISTS generated_reading_materials_lesson_id_fkey;

-- Indexes for rapid lookup, deduplication, and relational joins
CREATE INDEX IF NOT EXISTS idx_reading_materials_lesson_id ON public.generated_reading_materials(lesson_id);
CREATE INDEX IF NOT EXISTS idx_reading_materials_course_id ON public.generated_reading_materials(course_id);
CREATE INDEX IF NOT EXISTS idx_reading_materials_module_id ON public.generated_reading_materials(module_id);
CREATE INDEX IF NOT EXISTS idx_reading_materials_user_id ON public.generated_reading_materials(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_materials_status ON public.generated_reading_materials(generation_status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_reading_course_lesson ON public.generated_reading_materials(course_id, lesson_id);

-- GIN index for structured content search
CREATE INDEX IF NOT EXISTS idx_reading_materials_content_gin ON public.generated_reading_materials USING gin (content);

-- Row Level Security (RLS)
ALTER TABLE public.generated_reading_materials ENABLE ROW LEVEL SECURITY;

-- Reading materials are readable by learners if completed or if created by the learner
DROP POLICY IF EXISTS "Learners can view completed reading materials" ON public.generated_reading_materials;
CREATE POLICY "Learners can view completed reading materials"
  ON public.generated_reading_materials FOR SELECT
  USING (
    generation_status = 'completed'
    OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  );

-- Authorized insertions for authenticated learners and service role
DROP POLICY IF EXISTS "Learners and server can insert reading materials" ON public.generated_reading_materials;
CREATE POLICY "Learners and server can insert reading materials"
  ON public.generated_reading_materials FOR INSERT
  WITH CHECK (
    auth.uid() IS NULL -- Allow server-side guest service calls
    OR auth.uid() = user_id
  );

-- Updates allowed for the generating user or server
DROP POLICY IF EXISTS "Owners and server can update reading materials" ON public.generated_reading_materials;
CREATE POLICY "Owners and server can update reading materials"
  ON public.generated_reading_materials FOR UPDATE
  USING (
    auth.uid() IS NULL
    OR auth.uid() = user_id
  );

-- Deletions restricted to owners or administrators
DROP POLICY IF EXISTS "Owners and admins can delete reading materials" ON public.generated_reading_materials;
CREATE POLICY "Owners and admins can delete reading materials"
  ON public.generated_reading_materials FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND tier = 'admin')
  );

COMMENT ON TABLE public.generated_reading_materials IS 'On-demand AI-generated comprehensive academic reading materials and study notes, grounded in syllabus learning objectives.';
