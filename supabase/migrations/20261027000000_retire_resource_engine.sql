-- Migration: Retire Resource Engine & Mark Directory Tables Deprecated
-- Date: 2026-10-27
-- Description: Records the permanent retirement of the Resource Engine and Master Educator Directory.
-- Safely preserves existing learning paths, modules, lessons, study notes, and user data.

-- 1. Document table deprecations in schema comments without dropping historical data
COMMENT ON TABLE public.master_educators IS 'DEPRECATED: Master Educator Directory retired with Resource Engine removal. Retained for historical reference.';
COMMENT ON TABLE public.discovery_jobs IS 'DEPRECATED: Discovery jobs pipeline retired with Resource Engine removal.';

-- 2. Ensure lessons and resources tables maintain existing columns with safe fallbacks
-- so that previously saved courses and lessons continue to render seamlessly.
COMMENT ON COLUMN public.lessons.educator_id IS 'Historical reference to educator who authored or provided the lesson.';
COMMENT ON COLUMN public.lessons.discovery_source IS 'Historical provenance tracking for lesson content.';
COMMENT ON COLUMN public.lessons.source_url IS 'Canonical URL for lesson media or monograph.';
COMMENT ON COLUMN public.lessons.studyNotes IS 'Persisted lesson study notes and reference materials.';
