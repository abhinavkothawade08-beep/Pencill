# Pencill — Implementation Accuracy & Architecture Gaps Audit

> **Document Version**: 2.0  
> **Auditing Standard**: Empirical verification against source code, live database inspection, test outputs, and execution logs.  
> **Rule**: Distinguish verified facts from assumptions; do NOT disguise bugs as intended features.

---

## 1. Verified End-to-End Capabilities

The following features have been verified through automated tests (`npm test`), production builds (`npm run build`), and live runtime scripts (`scripts/verify_new_goal_e2e.ts`):

1. **Universal Learning Path Builder**:
   * Pre-generation blueprint scope estimation (`estimateCurriculumBlueprint`).
   * Multi-preference configuration (depth, difficulty, pacing, modalities, languages, target exams).
   * Local draft preservation and restoration (`localStorage.setItem('pencill_builder_draft')`).
2. **AI Curriculum Synthesis & Model Cascade**:
   * Direct HTTPS communication with Gemini REST API.
   * Model fallback cascade (`gemini-3.8-flash` -> `gemini-3.5-flash` -> `gemini-flash-latest`).
   * Fallback to local deterministic curriculum engine (`createTopicAdaptiveCurriculum`) on cloud outages.
3. **Resource Engine 2.0 Pipeline**:
   * Objective analysis, cognitive intent classification, and query formulation.
   * Bounded concurrency provider execution (4 workers).
   * Exact composite scoring (50% Relevance, 25% Depth, 15% Duration, 10% Coverage).
   * Modality gating (blocking research papers for beginner high school topics).
   * Module distribution without cross-module duplicates.
   * YouTube description timestamp extraction (`extractChaptersFromDescription`).
4. **Three-Pane Study Workspace**:
   * Syllabus navigation, embedded YouTube player with timestamp parameterization (`youtube-nocookie.com/embed/...&start=...`).
   * Reading monograph viewer and official NCERT textbook PDF discovery.
   * Timestamped in-context note taking (`addNote`, `updateNote`, `deleteNote`).
   * LaTeX formula deck rendering with KaTeX and bookmarking.
   * Lesson completion tracking and progress calculation.
5. **Diagnostic Checkpoints & Quizzes**:
   * Answer key isolation (`hideAnswers: true` redacting correct options).
   * Timed quiz-taking room with radio inputs and flagged question drawers.
   * Instant scoring, accuracy percentages, and distractor conceptual explanations.
6. **Authorization & Persistent Deletion**:
   * Ownership checks protecting catalog courses from unauthorized student deletion.
   * Authoritative deletion registry (`deletionRegistry.ts`) permanently excluding deleted courses and quizzes across page refreshes (`F5`).

---

## 2. Identified Implementation Gaps & Architectural Discrepancies

### Gap 1: Missing Re-Export of `QuizProvider` in Resource Engine Index
* **File Path**: [`src/lib/resource-engine-v2/providers/index.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/lib/resource-engine-v2/providers/index.ts#L7-L15)
* **Actual Behavior**:
  Running `scripts/test-quiz.ts` threw:
  `TypeError: import_resource_engine_v2.QuizProvider is not a constructor`.
  While [`quiz-provider.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/lib/resource-engine-v2/providers/quiz-provider.ts) defines `export class QuizProvider`, `providers/index.ts` re-exports all other adapters (`youtube`, `arxiv`, `openalex`, `academic-notes`, `google-search`), but omits `export * from './quiz-provider'`.
* **Expected Behavior**: `QuizProvider` should be re-exported from `src/lib/resource-engine-v2/providers/index.ts` and root index.
* **Severity**: Low (Does not impact UI runtime because quiz generation uses `quizService.ts` and `aiService.generateQuizQuestions()`).
* **Confidence Level**: 100% (Verified by compiler error in script).
* **Recommended Next Step**: Add `export * from './quiz-provider';` to `src/lib/resource-engine-v2/providers/index.ts`.

---

### Gap 2: Missing Denormalized Column `educator_name` in PostgreSQL
* **File Path**: Live Supabase Database / [`scripts/check-supabase-db.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/scripts/check-supabase-db.ts#L50-L60)
* **Actual Behavior**:
  Executing `scripts/check-supabase-db.ts` returned:
  `resources query result: ERROR column resources.educator_name does not exist 42703`
  `lessons query result: ERROR column lessons.educator_name does not exist 42703`
* **Evidence**:
  Migration [`20261018000000_master_educator_directory.sql`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/supabase/migrations/20261018000000_master_educator_directory.sql#L48-L60) added `educator_id TEXT` and `discovery_source TEXT`, but did not add `educator_name`.
* **Expected Behavior**:
  If queries attempt to select `educator_name` directly from `resources` or `lessons`, they will fail in PostgreSQL unless joined with `master_educators` on `educator_id`.
* **Severity**: Medium.
* **Confidence Level**: 100% (Empirically verified against live PostgreSQL schema).
* **Recommended Next Step**: Either join with `master_educators` on `educator_id` or add migration `ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS educator_name TEXT;`.

---

### Gap 3: Informal Nomenclature Conflict: `courses` vs. `learning_paths`
* **File Path**: [`scripts/check-supabase-db.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/scripts/check-supabase-db.ts#L70) & frontend routes.
* **Actual Behavior**:
  Running `check-supabase-db.ts` showed:
  `courses query result: ERROR Could not find the table 'public.courses' in the schema cache`
  The frontend uses `/courses` and `/api/courses/[id]`, but the authoritative database table is named `public.learning_paths`.
* **Expected Behavior**:
  All database queries must strictly target `public.learning_paths`. Any new developer assuming a table named `courses` exists will experience database query errors.
* **Severity**: Low (Application services correctly map between the two).
* **Confidence Level**: 100%.
* **Recommended Next Step**: Maintain clear documentation in API and database references explaining that UI "courses" are backed by PostgreSQL `learning_paths`.

---

### Gap 4: Dual Persistence via Local Files (`data/enrollments.json`)
* **File Path**: [`src/services/supabase/serverEnrollmentStore.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/services/supabase/serverEnrollmentStore.ts)
* **Actual Behavior**:
  Enrollments are stored in `data/enrollments.json` as Tier B alongside Supabase `public.enrollments` (Tier C).
* **Why it exists**:
  During early development, Supabase `enrollments` table migrations encountered foreign key locks and RLS permission mismatches. The file-based store was introduced to ensure zero enrollment data loss during local development.
* **Production Implication**:
  In a multi-tenant cloud or serverless edge deployment (e.g. Vercel), local server files in `process.cwd()/data/` are ephemeral and not shared across serverless instances.
* **Severity**: Medium for multi-instance serverless deployments; Negligible for single-server or Supabase-connected production.
* **Confidence Level**: 100%.
* **Recommended Next Step**: In enterprise production, migrate Tier B from a local JSON file to a hosted Redis instance (Upstash).

---

### Gap 5: Flashcard Modality Mockup vs. Active Generator
* **File Path**: [`src/components/builder/ModalitiesSelector.tsx`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/components/builder/ModalitiesSelector.tsx)
* **Actual Behavior**:
  Learners can toggle "Flashcard Decks" in the builder. However, the active study workspace (`learn/[courseId]/[lessonId]`) currently renders Formula Decks (`formulae`), Study Notes (`study_notes`), and Quizzes (`quizzes`), but does not have a dedicated spaced-repetition Anki-style flashcard flipper UI.
* **Expected Behavior**: Spaced repetition flashcard interface.
* **Severity**: Low (Formulas serve the immediate recall purpose).
* **Confidence Level**: 95%.
* **Recommended Next Step**: Build an interactive Flashcard modal component utilizing the structured `formulae` and `summaryPoints` JSONB fields.

---

### Gap 6: YouTube Data API Query Formatting in Legacy Script
* **File Path**: [`src/lib/resource-engine-v2/providers/legacy-youtube-provider.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/lib/resource-engine-v2/providers/legacy-youtube-provider.ts#L241) / [`scripts/verify-actual-engine.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/scripts/verify-actual-engine.ts#L50)
* **Actual Behavior**:
  `scripts/verify-actual-engine.ts` returned `[YouTubeProvider] Search HTTP 400: Request contains an invalid argument` when querying live YouTube API.
* **Root Cause**:
  Line 241 in legacy provider sets `searchUrl.searchParams.set('type', isVideoOnly ? 'video' : 'video,playlist')`. Google's YouTube Data API v3 `/search` endpoint returns HTTP 400 when certain parameter combinations (like `safeSearch=moderate` with multi-value `type`) are submitted under restricted API keys.
* **System Resilience**:
  When this happens, the engine catches the 400, skips external YouTube search, and serves verified flagship courses from the Master Educator Directory (`master-dataset.ts`).
* **Severity**: Low (Graceful directory fallback works).
* **Confidence Level**: 100% (Empirically verified in script execution).
* **Recommended Next Step**: Use `YouTubeAdapterV2` exclusively and ensure single-entity type parameters (`type=video`) are passed to YouTube search endpoints.
