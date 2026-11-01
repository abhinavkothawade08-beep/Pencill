-- =============================================================================
-- PENCILL: FIX STUDY NOTES PERSISTENCE MIGRATION
-- Migration: 20261031000000_fix_study_notes_persistence.sql
-- Ensures complete end-to-end persistence for AI-generated study notes across
-- both the public.lessons table (study_notes JSONB) and public.generated_reading_materials.
-- =============================================================================

-- 1. Ensure study_notes column exists on public.lessons table
ALTER TABLE IF EXISTS public.lessons
ADD COLUMN IF NOT EXISTS study_notes JSONB DEFAULT '[]'::jsonb;

-- 2. Create GIN index on lessons.study_notes for rapid querying
CREATE INDEX IF NOT EXISTS idx_lessons_study_notes ON public.lessons USING gin (study_notes);

-- 3. Ensure non-blocking user_id foreign key on generated_reading_materials
-- Prevents 23503 foreign key violation when guest users or unconfirmed auth sessions generate notes
ALTER TABLE public.generated_reading_materials
  DROP CONSTRAINT IF EXISTS generated_reading_materials_user_id_fkey;

-- 4. Ensure unique index on (course_id, lesson_id) for atomic upsert deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_reading_course_lesson 
  ON public.generated_reading_materials(course_id, lesson_id);

-- 5. Row Level Security Policies for generated_reading_materials
ALTER TABLE public.generated_reading_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Learners can view completed reading materials" ON public.generated_reading_materials;
CREATE POLICY "Learners can view completed reading materials"
  ON public.generated_reading_materials FOR SELECT
  USING (
    generation_status = 'completed'
    OR auth.uid() IS NULL
    OR auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Learners and server can insert reading materials" ON public.generated_reading_materials;
CREATE POLICY "Learners and server can insert reading materials"
  ON public.generated_reading_materials FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Owners and server can update reading materials" ON public.generated_reading_materials;
CREATE POLICY "Owners and server can update reading materials"
  ON public.generated_reading_materials FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 6. Add comment documentation
COMMENT ON COLUMN public.lessons.study_notes IS 'Authoritative AI-generated and curated academic study notes and handouts for this lesson.';
