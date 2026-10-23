-- Migration: Add study_notes to lessons table for robust lesson-level notes & handout integration
-- Pencill Native Resource Engine

ALTER TABLE IF EXISTS public.lessons
ADD COLUMN IF NOT EXISTS study_notes JSONB DEFAULT '[]'::jsonb;

-- Create GIN index for fast JSON queries if querying structured notes
CREATE INDEX IF NOT EXISTS idx_lessons_study_notes ON public.lessons USING gin (study_notes);

-- Document column purpose
COMMENT ON COLUMN public.lessons.study_notes IS 'Discovered academic study notes, lecture handouts, official documentation, and educational PDFs associated with this lesson.';
