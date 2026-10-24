# Pencill — Database Architecture & Data Flow Mastery

> **Database System**: Supabase PostgreSQL 15+  
> **Security Model**: Table-Level Row Level Security (RLS) with JWT Bearer Authentication  
> **Schema Migrations**: 12 Sequential SQL Migrations (`supabase/migrations/`)

---

## 1. Table-by-Table Schema Specification

### 1.1 `public.profiles`
* **Purpose**: Extends Supabase `auth.users` with student academic attributes, streak tracking, and study goals.
* **Columns**:
  * `id UUID PRIMARY KEY`: Foreign key referencing `auth.users(id) ON DELETE CASCADE`.
  * `name TEXT NOT NULL`: Student's display name.
  * `grade TEXT`: Academic level (e.g. "Class 11", "Undergraduate").
  * `avatar_url TEXT`: Path to avatar asset (defaults to `/avatars/aanya-patel.png`).
  * `target_exam TEXT`: Target competitive exam (e.g. "JEE Advanced", "NEET").
  * `tier TEXT DEFAULT 'Pro Path'`: Account tier ("Pro Path", "Admin", "Instructor").
  * `streak_days INTEGER DEFAULT 0`: Consecutive active study days.
  * `longest_streak_days INTEGER DEFAULT 0`: Record consecutive streak.
  * `weekly_goal_hours NUMERIC(4, 1) DEFAULT 18.0`: Weekly target study commitment.
  * `created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL`
  * `updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL`
* **Triggers**:
  * `set_profiles_updated_at`: Automatically refreshes `updated_at` before update.
  * `on_auth_user_created`: Automatically creates a matching `profiles` record whenever a new user signs up in `auth.users`.
* **Row Level Security (RLS)**:
  * `SELECT`: `USING (auth.uid() = id)` (Owner only).
  * `INSERT`: `WITH CHECK (auth.uid() = id)`.
  * `UPDATE`: `USING (auth.uid() = id)`.

---

### 1.2 `public.learning_paths`
* **Purpose**: The central entity representing a structured course (both system-curated and AI-synthesized personal paths).
* **Columns**:
  * `id TEXT PRIMARY KEY`: URL-safe slug ID (e.g. `jee-physics-mvlv7maf`).
  * `title TEXT NOT NULL`: Course title.
  * `description TEXT NOT NULL`: Course overview and pedagogical intent.
  * `domain TEXT NOT NULL`: Primary domain (e.g. 'Physics', 'Computer Science').
  * `level TEXT NOT NULL`: Level tier (e.g. 'Foundation', 'Class 11', 'Undergraduate').
  * `duration_hours INTEGER NOT NULL DEFAULT 0`: Total estimated hours.
  * `module_count INTEGER NOT NULL DEFAULT 0`: Number of syllabus modules.
  * `verified BOOLEAN DEFAULT TRUE`: Flag indicating editorial verification.
  * `enrolled_count INTEGER DEFAULT 0`: Total learners enrolled.
  * `average_completion TEXT DEFAULT '75.0%'`
  * `syllabus_note TEXT`: Citation notes and institutional references.
  * `tags TEXT[] DEFAULT '{}'`: Categorization tags.
  * `weekly_checkpoint JSONB DEFAULT '{}'::jsonb`: Milestone checkpoint specifications.
  * `is_published BOOLEAN DEFAULT TRUE`: Visibility flag.
  * `author_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL`: Author ID. **CRITICAL INVARIANT**: `NULL` indicates an official system-curated catalog course; non-null indicates an AI-synthesized personal path.
  * `status TEXT DEFAULT 'active'`: Lifecycle status (`active`, `deleted`).
  * `deleted_at TIMESTAMPTZ`: Soft-delete timestamp.
  * `created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL`
  * `updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL`
* **Indexes**: `idx_learning_paths_domain`, `idx_learning_paths_level`, `idx_learning_paths_author`, `idx_learning_paths_published`.
* **Row Level Security (RLS)**:
  * `SELECT`: `USING (is_published = TRUE OR author_user_id = auth.uid())`.
  * `INSERT`: `WITH CHECK (auth.uid() = author_user_id)`.
  * `UPDATE`: `USING (auth.uid() = author_user_id)`.
  * `DELETE`: `USING (auth.uid() = author_user_id OR is_admin())`.

---

### 1.3 `public.modules`
* **Purpose**: Represents syllabus pillars / chapters within a course.
* **Columns**:
  * `id TEXT PRIMARY KEY`: e.g. `mod-jee-physics-1`.
  * `path_id TEXT NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE`.
  * `title TEXT NOT NULL`: Module chapter title.
  * `module_number INTEGER NOT NULL`: 1-based sequential number.
  * `order_index INTEGER NOT NULL`: 0-based ordering index.
  * `status TEXT DEFAULT 'locked' CHECK (status IN ('completed', 'in_progress', 'locked'))`.
  * `total_resources INTEGER NOT NULL DEFAULT 0`: Count of constituent lessons.
  * `created_at TIMESTAMPTZ NOT NULL`, `updated_at TIMESTAMPTZ NOT NULL`.
* **Cascade Behavior**: Deleting a parent `learning_paths` record automatically deletes all child `modules`.
* **Indexes**: `idx_modules_path_id`, `idx_modules_order (path_id, order_index)`.

---

### 1.4 `public.lessons`
* **Purpose**: Atomic unit of structured learning (video, monograph, problem set, formula deck).
* **Columns**:
  * `id TEXT PRIMARY KEY`: e.g. `les-mod-jee-physics-1-1`.
  * `module_id TEXT NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE`.
  * `title TEXT NOT NULL`: Specific lesson title.
  * `type TEXT NOT NULL CHECK (type IN ('video', 'monograph', 'practice', 'quiz', 'paper', 'formulae'))`.
  * `duration_minutes INTEGER NOT NULL DEFAULT 0`.
  * `source_name TEXT NOT NULL`: e.g. "MIT OpenCourseWare", "Abdul Bari".
  * `source_url TEXT`: Canonical destination link.
  * `order_index INTEGER NOT NULL`.
  * `concept_id TEXT`: Canonical identifier for prerequisite graph analysis.
  * `prerequisites_note TEXT`: Textual prerequisite guidance.
  * `chapters JSONB DEFAULT '[]'::jsonb`: Array of `{ title: string, timestampSeconds: number }`.
  * `formulae JSONB DEFAULT '[]'::jsonb`: Array of `{ name: string, latex: string, notes?: string }`.
  * `summaryPoints TEXT[] DEFAULT '{}'`: Bullet points of key takeaways.
  * `study_notes JSONB DEFAULT '[]'::jsonb`: Array of structured reading resources / direct PDF links.
  * `educator_id TEXT REFERENCES public.master_educators(educator_id)`: Provenance reference.
  * `discovery_source TEXT`: e.g. "curated_directory", "open_discovery".
  * `created_at TIMESTAMPTZ NOT NULL`, `updated_at TIMESTAMPTZ NOT NULL`.
* **Indexes**: `idx_lessons_module_id`, `idx_lessons_order (module_id, order_index)`, `idx_lessons_type`.

---

### 1.5 `public.master_educators`
* **Purpose**: Seeded authority directory containing 60+ verified institutional channels and educators.
* **Columns**:
  * `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  * `educator_id TEXT UNIQUE NOT NULL`: e.g. `EDU-001`, `EDU-010`.
  * `educator_name TEXT NOT NULL`: e.g. "MIT OpenCourseWare", "Abdul Bari".
  * `educator_type TEXT NOT NULL`: "University Institution", "Individual Educator", "Consortium".
  * `youtube_channel_name TEXT NOT NULL`
  * `youtube_channel_id TEXT`: Canonical YouTube channel ID (e.g. `UCEBb1b_L6zDS3xTUrIALZOw`).
  * `official_channel_url TEXT NOT NULL`
  * `official_website TEXT`
  * `primary_domain TEXT NOT NULL`: "University and Higher Education", "School Education", "Programming".
  * `subjects TEXT[] NOT NULL DEFAULT '{}'`
  * `relevant_examinations TEXT[] NOT NULL DEFAULT '{}'`
  * `country TEXT NOT NULL DEFAULT 'India'`
  * `primary_language TEXT NOT NULL DEFAULT 'English'`
  * `complete_course_available BOOLEAN NOT NULL DEFAULT false`
  * `verification_status TEXT NOT NULL DEFAULT 'VERIFIED'`
  * `last_verified_date DATE NOT NULL`
* **Indexes**: `idx_master_educators_educator_id`, `idx_master_educators_domain`, GIN indexes on `subjects` and `relevant_examinations`.
* **Row Level Security**: Public readable (`USING (true)`).

---

### 1.6 `public.enrollments`
* **Purpose**: Tracks authenticated learner course registrations and progress percentages.
* **Columns**:
  * `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  * `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`.
  * `course_id TEXT NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE`.
  * `enrolled_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL`.
  * `completion_status TEXT DEFAULT 'in_progress' CHECK (completion_status IN ('enrolled', 'in_progress', 'completed', 'archived'))`.
  * `progress_percent NUMERIC(5, 2) DEFAULT 0.00`.
  * `last_accessed_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL`.
* **Unique Constraint**: `CONSTRAINT unique_user_course_enrollment UNIQUE(user_id, course_id)`.
* **Row Level Security**: Strictly private (`auth.uid() = user_id`).

---

### 1.7 `public.progress_records`
* **Purpose**: Atomic per-lesson completion records and time spent.
* **Columns**:
  * `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  * `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`.
  * `lesson_id TEXT NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE`.
  * `module_id TEXT REFERENCES public.modules(id) ON DELETE CASCADE`.
  * `path_id TEXT REFERENCES public.learning_paths(id) ON DELETE CASCADE`.
  * `is_completed BOOLEAN DEFAULT FALSE`.
  * `completed_at TIMESTAMPTZ`.
  * `time_spent_seconds INTEGER DEFAULT 0`.
  * `last_accessed_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL`.
* **Unique Constraint**: `CONSTRAINT unique_user_lesson_progress UNIQUE(user_id, lesson_id)`.
* **Row Level Security**: Strictly private (`auth.uid() = user_id`).

---

### 1.8 `public.quizzes`, `public.quiz_questions`, `public.quiz_attempts`
* **Purpose**: Formative diagnostic assessments and score ledgers.
* **Columns in `quizzes`**:
  * `id TEXT PRIMARY KEY`: e.g. `quiz-rotational-dynamics-checkpoint`.
  * `path_id TEXT REFERENCES public.learning_paths(id) ON DELETE CASCADE`.
  * `title TEXT NOT NULL`.
  * `time_limit_minutes INTEGER DEFAULT 30`.
  * `status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'deleted', 'enrolled'))`.
  * `metadata JSONB DEFAULT '{}'::jsonb`: Stores target domain, difficulty, and deletion marker data.
* **Columns in `quiz_questions`**:
  * `id TEXT PRIMARY KEY`.
  * `quiz_id TEXT NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE`.
  * `question_number INTEGER NOT NULL`.
  * `prompt TEXT NOT NULL`.
  * `options JSONB NOT NULL`: `[{ id: 'A', text: '...', latex: '...' }]`.
  * `correct_option_id TEXT NOT NULL`: **ISOLATED SERVER-SIDE**.
  * `explanation TEXT`: Distractor analysis and conceptual rationale.
* **Columns in `quiz_attempts`**:
  * `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`.
  * `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`.
  * `quiz_id TEXT NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE`.
  * `score NUMERIC(5, 2) DEFAULT 0.00`.
  * `accuracy_percent INTEGER DEFAULT 0`.
  * `answers JSONB DEFAULT '{}'::jsonb`: `{ "1": "A", "2": "C" }`.
  * `flagged_questions INTEGER[] DEFAULT '{}'`.
  * `completed_at TIMESTAMPTZ NOT NULL`.

---

### 1.9 `public.user_notes` & `public.bookmarks`
* **`user_notes`**: Timestamped in-context lecture annotations (`timestamp_marker TEXT`, `seconds_marker INTEGER`, `content TEXT`). Foreign keyed to `auth.users`, `lessons`, and `learning_paths` with `ON DELETE CASCADE`.
* **`bookmarks`**: Personal learning shelf storing formulas, monographs, and videos (`category CHECK IN ('video', 'monograph', 'practice', 'formulae', 'path')`).

---

## 2. Real Database Operations & Query Patterns

### 2.1 Course Creation & Batch Writing
In [`src/services/supabase/pathService.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/services/supabase/pathService.ts#L580-L640):
To prevent network waterfalls, inserting a course executes three batched operations:
```typescript
// 1. Insert parent learning path
await supabase.from("learning_paths").insert({
  id: pathId,
  title: pathData.title,
  domain: pathData.domain,
  level: pathData.level,
  author_user_id: userId,
  weekly_checkpoint: pathData.weeklyCheckpoint as unknown as Json,
});

// 2. Batch insert all modules
await supabase.from("modules").insert(moduleRows);

// 3. Batch insert all lessons with JSONB chapters and formulae
await supabase.from("lessons").insert(lessonRows);
```

### 2.2 Atomic Lesson Completion Upsert
In [`src/services/supabase/progressService.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/services/supabase/progressService.ts#L180):
```typescript
await supabase.from("progress_records").upsert(
  {
    user_id: userId,
    lesson_id: lessonId,
    module_id: moduleId,
    path_id: pathId,
    is_completed: true,
    completed_at: new Date().toISOString(),
    last_accessed_at: new Date().toISOString(),
  },
  { onConflict: "user_id,lesson_id" }
);
```

---

## 3. Investigation of Real Persistence Bugs & Root Causes

### 3.1 The "Deleted Course/Quiz Reappearing on Page Refresh" Bug
* **The Symptom**: When a user deleted a course or quiz, it disappeared from the UI. But upon refreshing (`F5`), the deleted item reappeared.
* **Root Cause Discovered in Code**:
  1. The client originally performed an optimistic UI filter (`courses.filter(c => c.id !== targetId)`).
  2. If the user was in guest mode or if Supabase RLS rejected the DELETE query (because system catalog items require admin privileges), the database write failed silently or was ignored.
  3. When the page refreshed, `getLearningPaths()` re-fetched all active courses from Supabase or `localStorage`, restoring the deleted item.
* **The Implemented Solution ([`deletionRegistry.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/services/supabase/deletionRegistry.ts))**:
  Pencill introduced an authoritative deletion exclusion registry:
  * When an item is deleted, `recordDeletedItem(type, targetId)` writes an authoritative marker row into PostgreSQL `public.quizzes` with `id = '__deleted__path__<targetId>'` and `status = 'deleted'`.
  * It simultaneously records the ID in `inMemoryDeletedPaths` and `localStorage.setItem('pencill_deleted_records', ...)`.
  * Every query fetching courses (`getLearningPaths()`, `getAllQuizzes()`) runs `getDeletedItemIds()` and strictly filters out all recorded IDs:
    ```typescript
    data.filter(row => !deletedPathIds.has(row.id) && !row.id.startsWith("__deleted"));
    ```
  * Even if a hard SQL delete fails due to foreign key locks, the item is permanently excluded from UI rendering across all reloads.

### 3.2 The Schema Cache Mismatch: `public.courses` vs. `public.learning_paths`
* **Evidence from Live DB Test**:
  Running `scripts/check-supabase-db.ts` produced:
  `courses query result: ERROR Could not find the table 'public.courses' in the schema cache`
* **Root Cause**:
  In early design documents, the table was referred to informally as `courses`. However, the core migration [`20260921000000_pencill_core_schema.sql`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/supabase/migrations/20260921000000_pencill_core_schema.sql) formally established the table as `public.learning_paths`.
  Any query attempting to query `from('courses')` fails; all application code correctly queries `from('learning_paths')`.

### 3.3 The Missing Column Bug: `educator_name`
* **Evidence from Live DB Test**:
  `resources query result: ERROR column resources.educator_name does not exist 42703`
* **Root Cause**:
  Migration [`20261018000000_master_educator_directory.sql`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/supabase/migrations/20261018000000_master_educator_directory.sql#L48-L60) added `educator_id TEXT` and `discovery_source TEXT` to `resources` and `lessons`. It did NOT add `educator_name` as a redundant denormalized column.
  Instead, educator names are resolved relationally via `master_educators.educator_name` using `educator_id`. Queries attempting to select `resources.educator_name` directly fail unless joined with `master_educators`.
