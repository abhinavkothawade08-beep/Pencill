# Restoration Audit: Pencill Google Stitch Frontend Restoration

> **Document Status**: Complete Baseline Audit  
> **Date**: October 27, 2026  
> **Objective**: Restore the original Google Stitch-generated frontend design across all application pages without breaking existing backend architecture, Supabase integration, authentication, or Resource Engine pipelines.

---

## 1. Original Frontend Source Files Discovered

The original frontend design assets generated using Google Stitch were located in the repository under:
`stitch_pencill_ai_learning_platform/stitch_pencill_ai_learning_platform/`

The discovered source files and their corresponding application targets include:

| Stitch Source Directory | Design Assets Found | Target Application Route / Feature |
| :--- | :--- | :--- |
| `academic_editorial/` | `DESIGN.md` | Primary Design System Specification (Colors, Typography, Elevation, Grids, Components) |
| `pencill_brand_wordmark/` | `code.html`, `screen.png` | Brand Wordmark SVG & Logo (`/brand/wordmark.svg`, Header, Sidebar) |
| `student_dashboard_pencill/` | `code.html`, `screen.png` | Student Dashboard (`/dashboard`) |
| `create_learning_goal_synthesis_pencill/` | `code.html`, `screen.png` | Learning Path Builder (`/new-goal`) |
| `explore_learn_pencill_1/` & `_2/` | `code.html`, `screen.png` | Academic Discovery Hub (`/explore`) |
| `generated_course_jee_physics_class_11_pencill/` | `code.html`, `screen.png` | Course Overview & Syllabus Breakdown (`/courses/[courseId]`) & Enrolled (`/courses`) |
| `resource_view_projectile_motion_pencill/` | `code.html`, `screen.png` | 3-Pane Learning Workspace (`/learn/[courseId]/[lessonId]`) |
| `practice_diagnostic_quiz_pencill/` | `code.html`, `screen.png` | Diagnostic Quizzes & Assessments (`/practice`) |
| `learning_progress_analytics_pencill/` | `code.html`, `screen.png` | Learning Progress & Syllabus Analytics (`/progress`) |
| `saved_bookmarks_pencill_1/` & `_2/` | `code.html`, `screen.png` | Saved Bookmarks & Repository (`/bookmarks`) |
| `pencill_learn_smarter.../` & `pencill_ai_powered.../` | `code.html`, `screen.png` | Public Marketing & Landing Experience (`/` in `src/app/(marketing)/page.tsx`) |

---

## 2. Current Frontend Files That Differ from the Original Design

A comprehensive inspection of the current frontend revealed deviations where generic Tailwind utility classes (such as `bg-slate-50`, `text-indigo-600`, `border-slate-200`) and altered component structures displaced the original Academic Editorial design system.

### Key Deviations Identified:

1. **`src/components/layout/AppLayout.tsx`**:
   - Currently uses `bg-slate-50 text-slate-900` instead of `bg-background text-on-surface`.
   - Mobile navigation uses `text-indigo-600` instead of Stitch's `text-primary` (`#162839`) and `text-secondary` accents.
   - Missing the exact fixed sidebar offset (`pl-64` on desktop) and fixed header container styling.

2. **`src/components/layout/Header.tsx`**:
   - Uses `bg-white/80 border-slate-200`, `text-slate-400`, `group-hover:text-indigo-600`, `focus:ring-indigo-500/20`.
   - Needs restoration to `bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.03)]`, borderless search with `bg-surface-container-lowest shadow-[0_1px_3px_rgba(0,0,0,0.04)]`, `bg-primary-container text-on-primary` for the "New Goal" action button, and `bg-secondary` notification indicator.

3. **`src/app/(dashboard)/dashboard/page.tsx`**:
   - Replaced Stitch's top greeting section (`Good morning, [Name]`, term badge `Academic Term 2024–25`, and action buttons `Create New Learning Path` & `Download Weekly Summary`) with a plain layout.
   - Hero card lacks Stitch's ambient radial blur accents (`bg-primary-fixed/30`, `bg-secondary-fixed/20`), active pathway pill, module indicator, and "Up next on syllabus" prompt box.
   - Generator bar ("What do you want to learn today?") with suggested chips ("Class 11", "Class 12", "College Undergrad", "GATE / JEE Target") was omitted or degraded.
   - 4-metric stat tiles grid lacks the streak flame pill (`🔥 6-Day Study Streak`), exact icon choices (`route`, `fact_check`, `schedule`, `military_tech`), and typography scale.

4. **`src/app/(dashboard)/new-goal/page.tsx`**:
   - Severely diverged from Stitch's 2-column split workspace (`create_learning_goal_synthesis_pencill/code.html`).
   - Current implementation used generic slate cards, blue progress indicators, and missing the live 5-stage curator pipeline tracker with vertical connecting lines and the real-time Curriculum Blueprint preview.
   - Needs restoration to the 5-step form (Goal, Target Depth/Level, Language pills, Modalities checkboxes, Weekly Commitment slider) with the live Curator Engine on the right.

5. **`src/app/(dashboard)/courses/[courseId]/page.tsx`**:
   - Needs alignment with `generated_course_jee_physics_class_11_pencill/code.html`:
     - Academic Metadata Array (Resources, Core Modules, Total Hours, Prerequisites).
     - Curriculum Progression ribbon with primary progress bar.
     - Quick Launch Bar with "Resume Next" and "Syllabus" actions.
     - Pedagogical Statement card and Weekly Target sprint card.
     - Expand/collapse modules accordion with consistent typography and badges.

6. **`src/app/(learning)/learn/[courseId]/[lessonId]/page.tsx`**:
   - The 3-pane learning workspace differs in padding, border hierarchy, and header bar alignment.
   - Pane 1 (Left Course Syllabus Drawer): Needs exact module accordion, progress indicator, and active resource highlight (`border-l-4 border-primary`).
   - Pane 2 (Center Resource Canvas): YouTube embed container and reading viewer need Stitch parchment framing, time-coded chapter list, and bottom navigation bar ("Previous Resource", "Bookmark", "Mark as Complete & Next").
   - Pane 3 (Right Resource Intelligence & Notes): Tabs (`Summary`, `My Notes`, `Formulae`) need Academic Editorial tab styling and LaTeX equation cards.

7. **`src/app/(dashboard)/practice/page.tsx`**:
   - Quiz test arena needs restoration to match `practice_diagnostic_quiz_pencill/code.html`:
     - 10-node progress stepper with answered (`bg-secondary`), current (`bg-primary-container ring-2 ring-primary/20`), and unvisited states.
     - Question header with flag button and real-time countdown timer.
     - Option cards with radio styling and selected highlight (`ring-1 ring-primary-container`).
     - Question palette grid and diagnostic summary.

8. **`src/app/(dashboard)/bookmarks/page.tsx`**:
   - Needs restoration of Stitch's segmented control tabs ("All Items", "Courses & Pathways", "Video Lectures", "Articles & Readings", "Practice & Drills"), discipline filter pills, and repository cards.

9. **`src/app/(dashboard)/progress/page.tsx`**:
   - Needs atmospheric gradient container with "Academic Performance Dossier" badge, 4 high-level stat cards (Syllabus Completion, Total Study Time, Quiz Accuracy, Study Consistency), and timeframe period selector.

10. **`src/components/cards/PathCard.tsx` & `MetricCard.tsx`**:
    - Cards need exact Academic Editorial elevation: `rounded-xl bg-surface-container-lowest p-space-lg shadow-sm border border-surface-container-high/60`, font-serif titles, warm sand accents (`#d4a574`), and deep navy buttons (`#2c3e50`).

---

## 3. Existing Backend Architecture & Integration Points

The existing backend is fully functional and must remain intact:

1. **Authentication & Session Management**:
   - `src/context/AuthContext.tsx`: Manages Supabase session, profile, and guest mode.
   - `src/components/auth/AuthGuard.tsx`: Guards private routes.
   - Integration: All restored UI components must use `useAuth()` to access `user`, `profile`, and `session`.

2. **Supabase Data Services**:
   - `src/services/supabase/pathService.ts`: Learning path fetching, creation, and deletion.
   - `src/services/supabase/enrollmentService.ts`: Course enrollments CRUD and multi-tier persistence.
   - `src/services/supabase/lessonService.ts`: 3-pane workspace lesson data and module traversal.
   - `src/services/supabase/progressService.ts`: Progress recording, completion tracking, and metrics calculation.
   - `src/services/supabase/quizService.ts`: Quiz creation, fetching, attempts, and scoring.
   - `src/services/supabase/bookmarkService.ts`: Resource and course bookmarking.
   - `src/services/supabase/noteService.ts`: Timestamped user notes.

3. **Local Persistence Fallback**:
   - `src/lib/storage/storageAdapter.ts`: Manages offline local storage, drafts, guest progress, and fallback persistence. All UI operations must synchronize with both Supabase and `storageAdapter`.

4. **Resource Engine & Curriculum Generation Pipeline**:
   - `src/lib/resource-engine/`: Analyzers, planners, educators, scorers, normalizers, quiz generators, and study notes generators.
   - `src/app/api/courses/generate/route.ts`: Server endpoint for course generation.
   - `src/curator/`: Stage 1–7 synthesis pipeline.

---

## 4. Potential Breaking Changes & Safeguards

| Potential Risk | Root Cause | Preventive Safeguard |
| :--- | :--- | :--- |
| Disconnecting live data with static Stitch mockup HTML | Copying static HTML verbatim with hardcoded values | Keep dynamic React hooks (`useState`, `useEffect`, `useAuth`) and map real database records into Stitch component structures |
| Breaking Course Generation in `/new-goal` | Replacing state management or API payload | Preserve `LearnerGoalInput` interface and ensure form submission triggers the real engine |
| Route or navigation regression | Changing route paths to match static mockup `href="#"` | Use Next.js `<Link href="...">` with verified routes (`/dashboard`, `/courses`, `/explore`, `/practice`, `/progress`, `/bookmarks`, `/new-goal`, `/learn/[courseId]/[lessonId]`) |
| Broken YouTube embeds in lesson view | Hardcoded video poster or invalid URL extraction | Keep `extractYouTubeEmbedUrl` helper and render responsive `<iframe>` within Stitch video container |
| Breaking Quiz submission & scoring | Static questions replacing database quiz items | Connect Question Stepper and Option Radio inputs to existing `quizService` and `storageAdapter` |
| Breaking uncommitted changes | Reverting git working tree | Preserve all existing uncommitted changes in git status |

---

## 5. Files to Modify vs Files to Keep Untouched

### Files to Modify (Frontend Restoration):
- `src/components/layout/AppLayout.tsx`: Restore shell layout and colors.
- `src/components/layout/Header.tsx`: Restore Stitch header, search bar, and action buttons.
- `src/components/layout/Sidebar.tsx`: Fine-tune active states and typography.
- `src/components/cards/PathCard.tsx`: Match Stitch card layout, badges, and progress bar.
- `src/components/cards/MetricCard.tsx`: Match Stitch metric tile styling.
- `src/app/(dashboard)/dashboard/page.tsx`: Restore Stitch greeting, hero banner, generator bar, and stat tiles.
- `src/app/(dashboard)/new-goal/page.tsx`: Restore 2-column split workspace, 5-step form, and live Curator Engine tracker.
- `src/app/(dashboard)/courses/page.tsx`: Align course shelf cards and headers with Stitch.
- `src/app/(dashboard)/courses/[courseId]/page.tsx`: Restore Stitch course overview, metadata array, and curriculum breakdown.
- `src/app/(learning)/learn/[courseId]/[lessonId]/page.tsx`: Restore 3-pane workspace with exact Stitch styling.
- `src/app/(dashboard)/practice/page.tsx`: Restore Stitch diagnostic quiz arena and question stepper.
- `src/app/(dashboard)/bookmarks/page.tsx`: Restore segmented tabs and repository cards.
- `src/app/(dashboard)/progress/page.tsx`: Restore dossier hero, timeframe selector, and metrics cards.

### Files to Keep Untouched:
- `src/services/supabase/*` (All data services, queries, and auth integrations)
- `src/lib/resource-engine/*` (Curriculum generation, analyzers, providers, scoring)
- `src/curator/*` (Pipeline synthesis)
- `supabase/migrations/*` (All SQL schemas and migrations)
- `tests/*` (All 232 test cases must continue passing without modification)
- `src/context/AuthContext.tsx` (Core authentication context)

---

## 6. Safe Implementation and Testing Plan

1. **Step 1: Layout & Core Theme Restoration**
   - Update `AppLayout.tsx`, `Header.tsx`, `Sidebar.tsx`, `PathCard.tsx`, and `MetricCard.tsx`.
   - Verify layout rendering across `/dashboard` and `/courses`.

2. **Step 2: Dashboard Restoration (`/dashboard`)**
   - Implement the complete greeting header, hero active pathway card, AI generator bar, 4 stat tiles with streak pill, and active courses grid.
   - Verify dynamic data binding (enrolled courses, next lesson, progress metrics).

3. **Step 3: Learning Path Builder Restoration (`/new-goal`)**
   - Restore the 2-column split workspace: 5-step interactive configuration on left, live Curator Engine & blueprint on right.
   - Connect form submission to the real generation pipeline (`POST /api/courses/generate`).

4. **Step 4: Course Details Overview Restoration (`/courses/[courseId]`)**
   - Restore academic metadata array, curriculum progression ribbon, quick launch bar, and module accordion.
   - Verify enrollment, bookmarking, and lesson navigation.

5. **Step 5: 3-Pane Learning Workspace Restoration (`/learn/[courseId]/[lessonId]`)**
   - Restore Pane 1 (syllabus drawer), Pane 2 (resource viewer & video embed), and Pane 3 (summary, notes, formulae).
   - Verify lesson completion, note taking, and formula copying.

6. **Step 6: Practice & Quizzes Restoration (`/practice`)**
   - Restore active quiz arena with 10-node progress stepper, question options, timer, and score submission.
   - Verify question palette and state persistence.

7. **Step 7: Bookmarks & Progress Analytics Restoration (`/bookmarks`, `/progress`)**
   - Restore segmented tabs, discipline pills, and repository cards in Bookmarks.
   - Restore performance dossier, metric cards, and mastery breakdown in Progress.

8. **Step 8: Quality Gates & Verification**
   - Run type checks (`npx tsc --noEmit`).
   - Run linter (`npm run lint`).
   - Run full test suite (`npm test`).
   - Run production build (`npm run build`).
   - Generate `RESTORATION_REPORT.md`.
