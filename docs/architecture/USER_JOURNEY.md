# Pencill — The Complete User Journey Execution Trace

> **Document Version**: 2.0  
> **Trace Method**: Verified source call-chains from user click events in the browser through server-side route handlers, validation schemas, business services, database queries, and UI re-renders.

---

## Complete Execution Journey Table of Contents
1. [Step 1: Opens the Application](#step-1-opens-the-application)
2. [Step 2: Signs Up or Logs In](#step-2-signs-up-or-logs-in)
3. [Step 3: Visits the Dashboard](#step-3-visits-the-dashboard)
4. [Step 4: Starts Creating a Learning Goal](#step-4-starts-creating-a-learning-goal)
5. [Step 5: Selects Preferences & Configures Builder](#step-5-selects-preferences--configures-builder)
6. [Step 6: Submits the Goal & Triggers Telemetry](#step-6-submits-the-goal--triggers-telemetry)
7. [Step 7: Server Triggers Discovery & Synthesis Pipeline](#step-7-server-triggers-discovery--synthesis-pipeline)
8. [Step 8: Receives Generated Modules & Verified Resources](#step-8-receives-generated-modules--verified-resources)
9. [Step 9: Opens Course Overview](#step-9-opens-course-overview)
10. [Step 10: Enrolls in the Course](#step-10-enrolls-in-the-course)
11. [Step 11: Opens a Lesson in 3-Pane Workspace](#step-11-opens-a-lesson-in-3-pane-workspace)
12. [Step 12: Watches Video & Reads Monograph](#step-12-watches-video--reads-monograph)
13. [Step 13: Takes a Diagnostic Checkpoint Quiz](#step-13-takes-a-diagnostic-checkpoint-quiz)
14. [Step 14: Saves Notes & Bookmarks Formulas](#step-14-saves-notes--bookmarks-formulas)
15. [Step 15: Tracks Learning Progress & Weekly Momentum](#step-15-tracks-learning-progress--weekly-momentum)
16. [Step 16: Deletes a Course or Quiz Checkpoint](#step-16-deletes-a-course-or-quiz-checkpoint)
17. [Step 17: Refreshes Application & Verifies Data Persistence](#step-17-refreshes-application--verifies-data-persistence)

---

### Step 1: Opens the Application
* **User Action**: Learner navigates to `https://pencill.app` (or `http://localhost:3000`).
* **UI Component**: [`src/app/(marketing)/page.tsx`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/app/(marketing)/page.tsx) wrapped by [`src/components/layout/PublicNavbar.tsx`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/components/layout/PublicNavbar.tsx).
* **Execution Environment**: Client Component hydration after Next.js static HTML pre-rendering.
* **Call Chain**:
  `Browser Navigation → Next.js App Router → layout.tsx → (marketing)/page.tsx → AuthProvider initialization`
* **Under the Hood**:
  1. [`src/context/AuthContext.tsx`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/context/AuthContext.tsx#L57-L88) executes `supabase.auth.getSession()` on initial mount.
  2. If unauthenticated, `user` state remains `null`, `loading` becomes `false`.
  3. The landing page renders editorial hero cards displaying flagship syllabi (Physics, Calculus, Python, AI).
* **Data Persisted**: None (visitor is in guest state).

---

### Step 2: Signs Up or Logs In
* **User Action**: Learner clicks "Sign In", enters email (`scholar@example.com`) and password (`Password123!`), and submits.
* **UI Component**: [`src/app/(auth)/login/page.tsx`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/app/(auth)/login/page.tsx).
* **Execution Environment**: Browser client calling Supabase Auth service.
* **Call Chain**:
  `LoginForm (onSubmit) → handleEmailSignIn() → AuthContext.signInWithEmail() → supabase.auth.signInWithPassword()`
* **Validation**:
  Email format checked (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`), password length checked (>= 8 chars).
* **Database Operation**:
  * Supabase GoTrue Auth verifies credentials against `auth.users`.
  * Emits `SIGNED_IN` event on `onAuthStateChange`.
  * Injects JWT access token into browser session cookies and `localStorage`.
* **Side Effect (Guest Migration)**:
  [`src/context/AuthContext.tsx`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/context/AuthContext.tsx#L51) invokes:
  ```typescript
  await migrateGuestDataToUser(u.id);
  ```
  [`src/services/supabase/migrationService.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/services/supabase/migrationService.ts#L10) reads `pencill_guest_progress`, `pencill_notes_*`, and `pencill_guest_quiz_attempts` from `localStorage`, performs batched `upsert` queries to `public.progress_records` and `public.user_notes`, and purges local guest keys.
* **UI Update**: Router redirects to `/dashboard` or query parameter `?redirectTo=...`.

---

### Step 3: Visits the Dashboard
* **User Action**: Learner lands on `/dashboard`.
* **UI Component**: [`src/app/(dashboard)/dashboard/page.tsx`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/app/(dashboard)/dashboard/page.tsx).
* **Execution Environment**: Client Component inside `AuthGuard`.
* **Call Chain**:
  `DashboardPage (useEffect) → Promise.all([getUserEnrollments(userId), getUserProgress(userId)])`
* **Database Queries**:
  1. [`getUserEnrollments()`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/services/supabase/enrollmentService.ts#L74) executes:
     ```sql
     SELECT id, user_id, course_id, enrolled_at, completion_status, progress_percent, last_accessed_at
     FROM public.enrollments
     WHERE user_id = $userId
     ORDER BY last_accessed_at DESC;
     ```
  2. [`getUserProgress()`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/services/supabase/progressService.ts#L52) executes:
     ```sql
     SELECT *, lessons(title, type), learning_paths(title, domain)
     FROM public.progress_records
     WHERE user_id = $userId;
     ```
* **UI Update**: Renders enrolled courses carousel, streak day counter, weekly goal progress bar (`18.0h` target), and recent activity feed.

---

### Step 4: Starts Creating a Learning Goal
* **User Action**: Learner clicks "Create Goal" in the sidebar or "Synthesize Learning Path" banner.
* **UI Component**: [`src/app/(dashboard)/new-goal/page.tsx`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/app/(dashboard)/new-goal/page.tsx).
* **Execution Environment**: Client Component.
* **Under the Hood**:
  1. Component reads search parameters `searchParams.get("goal")` or `searchParams.get("topic")`.
  2. Reads `pencill_builder_draft` from `localStorage`. If an unfinished draft exists, shows "Restore Draft" button.
  3. Renders the top breadcrumb and 6 modular customization panels.

---

### Step 5: Selects Preferences & Configures Builder
* **User Action**:
  * Picks Domain: *"School Education"* -> Discipline: *"Boards & Curricula"* -> Subject: *"CBSE"* -> Topic: *"CBSE Class 11 Senior Secondary"*.
  * Adds custom topic: *"Haloalkanes and Haloarenes"*.
  * Selects Target Exam: *"JEE Main & Advanced"*.
  * Selects Rigor: *"Class 11 / Intermediate"*, Difficulty: *"Advanced"*.
  * Sets Weekly Hours: `8` hours/week, Pacing: *"Balanced"*.
  * Toggles Modalities: Videos (active), Reading monographs (active), Diagnostic quizzes (active), Practice sets (active).
* **UI Components**:
  * [`DomainSelector.tsx`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/components/builder/DomainSelector.tsx) consumes [`src/lib/catalogs/domainCatalog.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/lib/catalogs/domainCatalog.ts).
  * [`ExamSelector.tsx`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/components/builder/ExamSelector.tsx) consumes [`src/lib/catalogs/examCatalog.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/lib/catalogs/examCatalog.ts).
  * [`CurriculumBlueprintCard.tsx`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/components/builder/CurriculumBlueprintCard.tsx).
* **Real-Time Client Calculation**:
  As `config` state changes, `useMemo` triggers:
  [`estimateCurriculumBlueprint(config)`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/lib/curriculum/blueprintEstimator.ts#L43)
  * Analyzes topic scope and exam context.
  * Dynamically computes estimated module range: `[3, 5]` modules.
  * Estimates total study investment: `32` hours across `4` weeks.
  * Verifies schedule feasibility: Returns `isFeasible: true`.
* **UI Update**: `CurriculumBlueprintCard` re-renders in real-time showing the estimated syllabus scope.

---

### Step 6: Submits the Goal & Triggers Telemetry
* **User Action**: Learner clicks the prominent primary button: **"Synthesize Learning Path"**.
* **UI Component**: [`new-goal/page.tsx`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/app/(dashboard)/new-goal/page.tsx#L182-L250) (`triggerSynthesis`).
* **Client Guards**:
  1. Checks if `synthesisActive` is true (guards against concurrent clicks).
  2. Validates that at least one topic or subject is non-empty.
  3. Validates that at least one modality is selected.
  4. Checks authentication: If unauthenticated, saves draft to `localStorage` and redirects to `/login`.
* **State Updates**:
  * Sets `synthesisActive = true`.
  * Sets `synthesisStage = 1` ("Validating prerequisites & querying curriculum intelligence engine...").
  * Renders [`CuratorStatusPanel.tsx`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/components/builder/CuratorStatusPanel.tsx) with animated stage progress rings.
* **Outbound HTTP Request**:
  Client fires `fetch("/api/resources/discover", { method: "POST", body: JSON.stringify({...}) })`.

---

### Step 7: Server Triggers Discovery & Synthesis Pipeline
* **Server Entry Point**: [`src/app/api/resources/discover/route.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/app/api/resources/discover/route.ts#L106).
* **Execution Environment**: Next.js Serverless Node.js Route Handler.
* **Validation**:
  `DiscoverRequestSchema.safeParse(rawBody)` executes. Rejects malformed bodies with HTTP 400.
* **Call Chain**:
  ```
  discover/route.ts
    ├── aiService.generateLearningPath()
    │     ├── geminiProvider.ts
    │     └── gemini/client.ts (callGemini HTTPS)
    │           └── [Fallback if 503]: curriculum-adaptive-engine.ts
    └── ResourceEngineV2.discover()
          ├── objective-analyzer.ts
          ├── search-planner.ts
          ├── provider-registry (youtube, master-dataset, academic-notes)
          ├── ranking-engine.ts (relevance, depth, duration, coverage)
          ├── module-distributor.ts (deduplication & role slotting)
          └── chapter-resolver.ts (description timestamp parser)
  ```
* **Step-by-Step Server Execution**:
  1. **Phase 1: Gemini Curriculum Synthesis**:
     * Prompt sent to Gemini with instructions to output strict JSON.
     * If Gemini returns HTTP 503 high demand or times out, the client automatically catches the error, retries fallback models (`gemini-3.5-flash`), and if unavailable, invokes `createTopicAdaptiveCurriculum()` to synthesize structured modules deterministically.
  2. **Phase 2: Resource Engine 2.0 Discovery**:
     * Breaks learning path into module objectives.
     * Formulates search queries with provider qualifiers.
     * Executes queries via `runWithConcurrencyLimit(tasks, 4)`.
     * Evaluates candidates with `ExplainableRankingEngine`:
       $$\text{Overall Score} = \text{Relevance} \times 0.50 + \text{Depth} \times 0.25 + \text{Duration} \times 0.15 + \text{Coverage} \times 0.10 + \text{Bonus} - \text{BuzzwordPenalty}$$
     * Distributes top resources to module lessons without cross-module duplication.
     * Extracts chapter timestamps for video lectures >= 15 minutes.
  3. **Phase 3: Diagnostic Checkpoint Generation**:
     * For each generated module, calls `aiService.generateQuizQuestions()` (or `createFallbackModuleQuestions()`).
     * Saves generated questions to `public.quizzes` and `public.quiz_questions` via `createQuiz()`.

---

### Step 8: Receives Generated Modules & Verified Resources
* **Server Response**: Returns HTTP 200 JSON to the browser:
  ```json
  {
    "success": true,
    "learningPath": {
      "title": "Haloalkanes and Haloarenes: Reaction Mechanisms & JEE Mastery",
      "domain": "Chemistry",
      "level": "Class 11",
      "durationHours": 32,
      "moduleCount": 3,
      "modules": [ ... ]
    },
    "discoveredResources": [ ... ],
    "diagnosticsGenerated": 3
  }
  ```
* **Client UI Telemetry Updates**:
  * Updates `synthesisStage = 4` ("Auditing verified resources from NPTEL, NCERT & MIT OCW...").
  * Updates `synthesisStage = 5` ("Auditing resource quality, difficulty alignment...").
  * Updates `synthesisStage = 6` ("Compiling diagnostic checkpoints, practice sets...").
  * Updates `synthesisStage = 7` ("Persisting verified learning path & enrolling learner...").

---

### Step 9: Opens Course Overview
* **Persistence & Redirect**:
  [`new-goal/page.tsx`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/app/(dashboard)/new-goal/page.tsx#L291) calls:
  ```typescript
  const createdPathId = await createFullLearningPath(pathData, user.id, discovered);
  ```
  1. Writes course into `inMemoryPathCache` and `localStorage.setItem('pencill_path_${pathId}', ...)`.
  2. Inserts into Supabase `public.learning_paths`, `public.modules`, and `public.lessons`.
  3. Clears `pencill_builder_draft` from `localStorage`.
  4. Executes `router.push('/courses/${createdPathId}')`.
* **UI Component**: [`src/app/(dashboard)/courses/[courseId]/page.tsx`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/app/(dashboard)/courses/[courseId]/page.tsx).
* **UI Display**: Shows the synthesized course title, domain badge, estimated hours, syllabus note, and list of modules with their nested lessons.

---

### Step 10: Enrolls in the Course
* **User Action**: Learner clicks "Enroll in Track" (or was auto-enrolled on synthesis).
* **Function Executed**: [`enrollInCourse(userId, courseId)`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/services/supabase/enrollmentService.ts#L225).
* **Multi-Tier Execution**:
  1. **Tier A**: Saves enrollment to `localStorage.setItem('pencill_enrollments_${userId}', ...)`.
  2. **Tier B**: Sends `POST /api/enrollments` which updates `data/enrollments.json`.
  3. **Tier C**: Executes database query:
     ```sql
     INSERT INTO public.enrollments (user_id, course_id, enrolled_at, completion_status, progress_percent)
     VALUES ($userId, $courseId, NOW(), 'in_progress', 0.00)
     ON CONFLICT (user_id, course_id) DO UPDATE SET last_accessed_at = NOW();
     ```
* **Event Dispatch**: Fires window custom event `pencill:enrollment-changed` to synchronize sidebar badges.
* **UI Update**: Primary action button changes from "Enroll in Track" to "Start Learning" linking to `/learn/[courseId]/[firstLessonId]`.

---

### Step 11: Opens a Lesson in 3-Pane Workspace
* **User Action**: Learner clicks on Lesson 1: *"Nucleophilic Substitution Mechanisms ($S_N1$ vs $S_N2$)"*.
* **UI Component**: [`src/app/(learning)/learn/[courseId]/[lessonId]/page.tsx`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/app/(learning)/learn/[courseId]/[lessonId]/page.tsx).
* **Data Retrieval**:
  Executes [`getLessonWorkspaceData(courseId, lessonId)`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/services/supabase/lessonService.ts#L10).
  Fetches lesson record, parent module title, full course syllabus tree, and completed lesson IDs.
* **Workspace Rendering**:
  * **Left Sidebar**: Syllabus navigation showing completed/active/locked states.
  * **Center Stage**: Main content viewer (video embed or monograph reader).
  * **Right Toolpane**: Active study panel with 4 tabs: Summary, Notes, Formulae, Materials.

---

### Step 12: Watches Video & Reads Monograph
* **User Action**: Learner clicks "Play" on the embedded video lecture.
* **Video Normalization**:
  The component passes `lesson.sourceUrl` to `extractYouTubeEmbedUrl(url)`.
  * Converts `https://www.youtube.com/watch?v=0IAPZzGSbME&t=14m22s` into:
    `https://www.youtube-nocookie.com/embed/0IAPZzGSbME?rel=0&modestbranding=1&start=862`
  * Employs `youtube-nocookie.com` to preserve student privacy and prevent third-party tracking.
* **Chapter Navigation**:
  If the video has description timestamps, clicking Chapter 2 *"Kinetics of SN2 Reactions (08:45)"* updates the iframe player directly to timestamp `525s`.
* **Reading Materials Tab**:
  When clicking the "Materials" tab, the workspace calls `/api/resources/notes`. Renders direct PDF links to NCERT Chapter 10 and official chemistry monograph handouts.

---

### Step 13: Takes a Diagnostic Checkpoint Quiz
* **User Action**: Learner finishes Module 1 and clicks **"Take Module Diagnostic Checkpoint"**.
* **Navigation**: Navigates to `/practice/[quizId]`.
* **UI Component**: [`src/app/(dashboard)/practice/[quizId]/page.tsx`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/app/(dashboard)/practice/[quizId]/page.tsx).
* **Test Initialization**:
  1. Fetches quiz with `hideAnswers: true`:
     `GET /api/quizzes/[quizId]?hideAnswers=true`
     The server redacts `correctOptionId` and `explanation`.
  2. Calls `POST /api/quizzes/attempt` to initialize attempt timer.
* **Taking the Quiz**:
  * Interactive radio options render LaTeX math formulas using KaTeX.
  * Countdown timer displays time remaining (e.g. 15 minutes).
  * Learner flags Question 3 for review.
* **Submission & Grading**:
  Learner clicks **"Submit Diagnostic Checkpoint"**.
  * Calls `POST /api/quizzes/submit` transmitting `{ attemptId, quizId, answers: { "1": "A", "2": "C" } }`.
  * The server retrieves authoritative answer keys from `public.quiz_questions`, scores accuracy (e.g., 85%), evaluates distractor rationales, and writes to `public.quiz_attempts`.
* **UI Score Screen**:
  Reveals correct answers, detailed pedagogical explanations, and score breakdown.

---

### Step 14: Saves Notes & Bookmarks Formulas
* **User Action**: During the lecture, learner types a note at `14:22`: *"In SN1, carbocation intermediate determines racemization"* and clicks "Save Note".
* **Function Executed**: [`addNote()`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/services/supabase/noteService.ts#L40).
* **Database Write**:
  ```sql
  INSERT INTO public.user_notes (user_id, lesson_id, path_id, timestamp_marker, seconds_marker, content)
  VALUES ($userId, $lessonId, $courseId, '14:22', 862, 'In SN1, carbocation intermediate...');
  ```
* **Bookmarking**:
  Learner clicks the bookmark icon beside the rate law formula:
  $$\text{Rate} = k[R\text{-}X][\text{Nu}^-]$$
  [`addBookmark()`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/services/supabase/bookmarkService.ts#L35) inserts into `public.bookmarks`. The formula now appears in `/bookmarks`.

---

### Step 15: Tracks Learning Progress & Weekly Momentum
* **User Action**: Learner clicks "Mark Complete & Next Lesson".
* **Function Executed**: [`markLessonComplete(userId, lessonId, moduleId, pathId)`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/services/supabase/progressService.ts#L180).
* **Database Write**:
  ```sql
  INSERT INTO public.progress_records (user_id, lesson_id, module_id, path_id, is_completed, completed_at, last_accessed_at)
  VALUES ($userId, $lessonId, $moduleId, $pathId, true, NOW(), NOW())
  ON CONFLICT (user_id, lesson_id) DO UPDATE SET is_completed = true, completed_at = NOW();
  ```
* **Progress Recalculation**:
  Computes total course progress percentage:
  $$\text{Progress} = \frac{\text{Completed Lessons}}{\text{Total Course Lessons}} \times 100$$
  Updates `public.enrollments.progress_percent`.
* **Analytics Screen (`/progress`)**:
  Re-renders weekly momentum chart showing today's accumulated study time and streak tally (+1 day).

---

### Step 16: Deletes a Course or Quiz Checkpoint
* **User Action**: On the Explore page, learner opens the action menu on a course they created and clicks **"Delete Course"**.
* **UI Component**: [`src/components/ui/DeleteCourseModal.tsx`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/components/ui/DeleteCourseModal.tsx).
* **Authorization Guard**:
  [`canDeleteLearningPath()`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/lib/permissions.ts#L58) checks:
  * If `path.authorUserId === user.id` -> Allowed.
  * If `path.authorUserId === null` (System Catalog) and user is not admin -> Denied.
* **API Call**:
  Sends `POST /api/courses/batch-delete` with body `{ courseIds: [pathId] }`.
* **Cascading Database Execution**:
  [`deleteLearningPathFromDatabase()`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/services/supabase/pathService.ts#L1000):
  1. Calls `recordDeletedItem('learning_path', pathId)`.
     Writes marker row to `public.quizzes` (`status = 'deleted'`, `id = '__deleted__path__<id>'`) and updates `inMemoryDeletedPaths`.
  2. Executes `DELETE FROM public.learning_paths WHERE id = pathId`.
  3. PostgreSQL foreign key triggers `ON DELETE CASCADE` across child `modules`, `lessons`, and `enrollments`.
* **UI Update**: The course card disappears from the UI immediately.

---

### Step 17: Refreshes Application & Verifies Data Persistence
* **User Action**: Learner presses `F5` / Refresh in the browser.
* **Verification Across Rerender**:
  1. **Course List Hydration**:
     [`getLearningPaths()`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/services/supabase/pathService.ts#L105) runs:
     * Fetches courses from Supabase.
     * Calls `getDeletedItemIds('learning_path')`.
     * Filters out all deleted IDs and legacy mocks:
       ```typescript
       data.filter(row => !deletedPathIds.has(row.id) && !LEGACY_MOCK_COURSE_IDS.has(row.id))
       ```
     * **Result**: The deleted course does NOT reappear.
  2. **Active Enrollments Hydration**:
     `getUserEnrollments()` retrieves active enrolled courses from `public.enrollments` and `localStorage`.
  3. **Progress & Notes Hydration**:
     Completed green checkmarks and in-context notes reload from `public.progress_records` and `public.user_notes`.
* **Outcome**: State is 100% consistent across page reloads.

---

## Call-Chain Summary Reference

```
Action: Synthesize Learning Path
UI Component:  UniversalLearningPathBuilder (new-goal/page.tsx)
Event Handler: triggerSynthesis(e)
API Endpoint:  POST /api/resources/discover
Validation:    DiscoverRequestSchema.safeParse()
Services:      aiService.generateLearningPath() + ResourceEngineV2.discover()
Database:      createFullLearningPath() -> public.learning_paths, modules, lessons
Response:      HTTP 200 { success: true, learningPath: {...} }
UI Update:     router.push('/courses/' + createdPathId)
```
