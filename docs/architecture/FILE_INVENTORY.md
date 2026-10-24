# Pencill — Comprehensive Source File Inventory

> **Document Version**: 2.0  
> **Verification Status**: 100% Statically & Runtime Verified  
> **Scope**: Application-owned source files across Frontend, API, Resource Engine 2.0, AI Services, Supabase Services, Migrations, Tests, and Tooling.

---

## Table of Contents
1. [Project Configuration & Entry Points](#1-project-configuration--entry-points)
2. [Next.js App Router (Pages, Layouts & Route Groups)](#2-nextjs-app-router-pages-layouts--route-groups)
3. [Next.js Server API Routes (`src/app/api/`)](#3-nextjs-server-api-routes-srcappapi)
4. [UI Component System (`src/components/`)](#4-ui-component-system-srccomponents)
5. [State Management & Context (`src/context/`)](#5-state-management--context-srccontext)
6. [Core Libraries, Utilities & Catalogs (`src/lib/`)](#6-core-libraries-utilities--catalogs-srclib)
7. [Resource Engine 2.0 Subsystem (`src/lib/resource-engine-v2/`)](#7-resource-engine-20-subsystem-srclibresource-engine-v2)
8. [AI Services & Curriculum Synthesis (`src/services/ai/`)](#8-ai-services--curriculum-synthesis-srcservicesai)
9. [Supabase & Data Access Layer (`src/services/supabase/`)](#9-supabase--data-access-layer-srcservicessupabase)
10. [Database Migrations & SQL Schemas (`supabase/migrations/`)](#10-database-migrations--sql-schemas-supabasemigrations)
11. [Data Stores & Local Persistence (`data/`)](#11-data-stores--local-persistence-data)
12. [Automated Test Suite (`tests/`)](#12-automated-test-suite-tests)
13. [Smoke Tests & Operational Scripts (`scripts/`)](#13-smoke-tests--operational-scripts-scripts)
14. [Design Artifacts & Stitch Prototypes](#14-design-artifacts--stitch-prototypes)

---

## 1. Project Configuration & Entry Points

### 1.1 `package.json`
* **File Type**: Project Configuration & NPM Manifest
* **Primary Responsibility**: Declares application metadata, runtime dependencies, dev dependencies, and execution scripts.
* **Why it exists**: Configures Node package resolution and build lifecycle commands (`dev`, `build`, `start`, `lint`, `test`).
* **Important Exports / Scripts**:
  * `"dev": "next dev"`: Starts Next.js development server with hot-module reloading.
  * `"build": "next build"`: Compiles production bundles, validates types, and generates static pages.
  * `"test": "npx tsx --test tests/**/*.test.ts"`: Runs Node.js native test runner via `tsx`.
  * `"lint": "next lint"`: Runs ESLint checks.
* **Dependencies**: Next.js 14.2.15, React 18.3.1, `@supabase/supabase-js` 2.116.0, `zod` 4.6.5, `clsx`, `tailwind-merge`.
* **Runtime**: Build-time / Package management.
* **Status**: Essential.

### 1.2 `tsconfig.json`
* **File Type**: TypeScript Compiler Configuration
* **Primary Responsibility**: Configures strict type-checking, module resolution (`bundler`), and path aliases (`@/*` -> `./src/*`).
* **Why it exists**: Enforces TypeScript compilation rules across `.ts` and `.tsx` source files.
* **Important Settings**: `strict: true`, `target: ES2017`, `moduleResolution: bundler`, `paths: { "@/*": ["./src/*"] }`.
* **Status**: Essential.

### 1.3 `next.config.mjs`
* **File Type**: Next.js Framework Configuration
* **Primary Responsibility**: Configures Next.js runtime flags and external image domains.
* **Why it exists**: Enables `reactStrictMode: true` and authorizes Google profile avatar images (`lh3.googleusercontent.com`).
* **Status**: Essential.

### 1.4 `tailwind.config.ts`
* **File Type**: Styling System Configuration
* **Primary Responsibility**: Defines the academic editorial theme colors, typography classes, spacing tokens, and CSS variables.
* **Why it exists**: Configures Tailwind CSS utility classes (`surface`, `primary`, `on-surface`, `font-serif`).
* **Status**: Essential.

### 1.5 `.env.example` & `.env.local`
* **File Type**: Environment Configuration Templates
* **Primary Responsibility**: Declares client-side variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) and server-side secret keys (`GEMINI_API_KEY`, `GOOGLE_SEARCH_API_KEY`, `YOUTUBE_API_KEY`).
* **Status**: Essential.

---

## 2. Next.js App Router (Pages, Layouts & Route Groups)

### 2.1 `src/app/layout.tsx`
* **File Type**: Root React Server Component Layout
* **Primary Responsibility**: Injects HTML `<html>` and `<body>` tags, imports global CSS (`globals.css`), loads Google Fonts (`Newsreader` serif, `Plus Jakarta Sans`, and Material Symbols Outlined), and wraps the application in `AuthProvider`.
* **Imports**: `AuthProvider` from `@/context/AuthContext`, `globals.css`.
* **Runtime**: Server Component (initial render) + Client hydration shell.
* **Status**: Essential.

### 2.2 `src/app/globals.css`
* **File Type**: Global Stylesheet
* **Primary Responsibility**: Declares Tailwind base layers, CSS root variables for warm parchment editorial themes, scrollbar styling, and custom animations.
* **Status**: Essential.

### 2.3 `src/app/(marketing)/page.tsx`
* **File Type**: Public Landing Page (Client Component)
* **Primary Responsibility**: Renders the editorial landing page introducing Pencill's value proposition, featured syllabi cards (Physics, Calculus, Python, AI), and hero call-to-actions linking to `/new-goal` or `/login`.
* **Status**: Essential.

### 2.4 `src/app/(auth)/login/page.tsx` & `signup/page.tsx`
* **File Type**: Authentication Pages (Client Components)
* **Primary Responsibility**: Provides email/password login, Google OAuth triggering, new account registration, and redirection handling via `useAuth()`.
* **Calls**: `signInWithEmail`, `signUpWithEmail`, `signInWithGoogle` from `AuthContext`.
* **Status**: Essential.

### 2.5 `src/app/auth/callback/page.tsx`
* **File Type**: OAuth Callback Handler (Client Component)
* **Primary Responsibility**: Captures OAuth tokens from URL hash/search params after Google authentication redirects, exchanges them for a Supabase session, and redirects to the intended dashboard route.
* **Status**: Essential.

### 2.6 `src/app/(dashboard)/layout.tsx`
* **File Type**: Dashboard Shell Layout (Client Component)
* **Primary Responsibility**: Wraps all authenticated views (`/dashboard`, `/explore`, `/courses`, `/practice`, `/progress`, `/bookmarks`, `/new-goal`) with `AuthGuard`, the persistent `Sidebar`, and top `Header`.
* **Status**: Essential.

### 2.7 `src/app/(dashboard)/dashboard/page.tsx`
* **File Type**: Learner Dashboard (Client Component)
* **Primary Responsibility**: Displays active course enrollments, current streak counter, quick resume links, weekly hours progress bar, and recommended courses.
* **Data Sources**: `getUserEnrollments()`, `getUserProgress()`.
* **Status**: Essential.

### 2.8 `src/app/(dashboard)/new-goal/page.tsx`
* **File Type**: Universal Learning Path Builder (Client Component, 536 lines)
* **Primary Responsibility**: The core course creation interface. Allows learners to select domains, target exams, depth levels, pacing, languages, and learning modalities. Calculates real-time blueprint estimates, calls `/api/resources/discover`, and persists the synthesized course.
* **Imports**: `estimateCurriculumBlueprint`, `DomainSelector`, `ExamSelector`, `DepthDifficultySelector`, `ModalitiesSelector`, `PacingSelector`, `AdvancedPreferencesAccordion`, `CuratorStatusPanel`, `CurriculumBlueprintCard`.
* **Status**: Essential.

### 2.9 `src/app/(dashboard)/explore/page.tsx`
* **File Type**: Course Catalog Explorer (Client Component)
* **Primary Responsibility**: Allows searching and filtering published and authored courses by domain, level, and verification status. Includes batch-deletion controls for authored courses.
* **Data Sources**: `getLearningPaths()`, `batchDeleteLearningPaths()`.
* **Status**: Essential.

### 2.10 `src/app/(dashboard)/courses/page.tsx` & `courses/[courseId]/page.tsx`
* **File Type**: Course Overview & Syllabus Viewer (Client Components)
* **Primary Responsibility**: Renders full course syllabus outlines, module prerequisites, lesson duration tallies, verification badges, and enrollment triggers.
* **Status**: Essential.

### 2.11 `src/app/(dashboard)/practice/page.tsx` & `practice/[quizId]/page.tsx`
* **File Type**: Diagnostic Quiz Hub & Test Room (Client Components)
* **Primary Responsibility**:
  * `practice/page.tsx`: Lists diagnostic checkpoints and historical attempts with score percentages.
  * `practice/[quizId]/page.tsx`: Interactive test-taking room with countdown timer, single/multi-choice radio inputs, flagged question drawers, and submission handlers.
* **Calls**: `getQuizById()`, `submitQuizAttempt()`.
* **Status**: Essential.

### 2.12 `src/app/(dashboard)/progress/page.tsx`
* **File Type**: Analytics & Progress Tracking (Client Component)
* **Primary Responsibility**: Visualizes hours invested, module completion ratios, streak momentum, and topic mastery radar summaries.
* **Data Sources**: `getUserProgress()` from `progressService.ts`.
* **Status**: Essential.

### 2.13 `src/app/(dashboard)/bookmarks/page.tsx`
* **File Type**: Bookmarked Formulas & Resources (Client Component)
* **Primary Responsibility**: Displays saved LaTeX formulas, monograph excerpts, and video timestamps grouped by category.
* **Data Sources**: `getBookmarks()` from `bookmarkService.ts`.
* **Status**: Essential.

### 2.14 `src/app/(learning)/learn/[courseId]/page.tsx` & `learn/[courseId]/[lessonId]/page.tsx`
* **File Type**: 3-Pane Active Study Workspace (Client Components, 1410 lines)
* **Primary Responsibility**:
  * Left pane: Course curriculum outline and lesson navigation.
  * Center pane: Embedded YouTube player (with start timestamp parameters) or monograph reading pane.
  * Right pane: Interactive study tools (lesson summary, timestamped note-taking, formula decks, and external reading materials via `/api/resources/notes`).
* **Status**: Essential.

---

## 3. Next.js Server API Routes (`src/app/api/`)

### 3.1 `src/app/api/resources/discover/route.ts`
* **File Type**: HTTP Route Handler (`POST`)
* **Primary Responsibility**: Primary discovery and synthesis orchestrator. Validates `DiscoverRequestSchema`, invokes `aiService.generateLearningPath()` (with fallback to `createTopicAdaptiveCurriculum()`), runs `ResourceEngineV2.discover()`, generates module diagnostic quizzes, and returns the unified curriculum.
* **Interactions**: Gemini API, YouTube, OpenAlex, arXiv, Supabase `quizzes`.
* **Status**: Essential (Core runtime entry point).

### 3.2 `src/app/api/resources/search/route.ts`
* **File Type**: HTTP Route Handler (`POST`)
* **Primary Responsibility**: Fast search endpoint querying Resource Engine 2.0 without generating full learning paths.
* **Status**: Essential.

### 3.3 `src/app/api/resources/evaluate/route.ts`
* **File Type**: HTTP Route Handler (`POST`)
* **Primary Responsibility**: Batched evaluation endpoint evaluating up to 10 arbitrary candidate resources against topic and difficulty criteria.
* **Status**: Essential.

### 3.4 `src/app/api/resources/notes/route.ts`
* **File Type**: HTTP Route Handler (`POST`)
* **Primary Responsibility**: Fetches verified study notes, official documentation, and NCERT textbooks for a specific lesson title.
* **Status**: Essential.

### 3.5 `src/app/api/resources/practice/route.ts`
* **File Type**: HTTP Route Handler (`GET`)
* **Primary Responsibility**: Retrieves practice sets and previous year questions (PYQs) matching a topic or target exam.
* **Status**: Essential.

### 3.6 `src/app/api/courses/[id]/route.ts`
* **File Type**: HTTP Route Handler (`GET`, `DELETE`)
* **Primary Responsibility**: Fetches a single course by ID or deletes a specific course respecting user ownership and admin roles.
* **Status**: Essential.

### 3.7 `src/app/api/courses/batch-delete/route.ts`
* **File Type**: HTTP Route Handler (`POST`, `DELETE`)
* **Primary Responsibility**: Bulk deletion endpoint validating `BatchDeleteCoursesSchema`, verifying caller JWT authorization, and invoking `deleteLearningPathFromDatabase()`.
* **Status**: Essential.

### 3.8 `src/app/api/enrollments/route.ts`
* **File Type**: HTTP Route Handler (`GET`, `POST`, `DELETE`)
* **Primary Responsibility**: Manages user course enrollments, backing up to `data/enrollments.json` and Supabase.
* **Status**: Essential.

### 3.9 `src/app/api/quizzes/[id]/route.ts`
* **File Type**: HTTP Route Handler (`GET`, `DELETE`)
* **Primary Responsibility**: Fetches a quiz by ID (redacting answer keys if `hideAnswers=true`) or deletes a quiz checkpoint.
* **Status**: Essential.

### 3.10 `src/app/api/quizzes/generate/route.ts`
* **File Type**: HTTP Route Handler (`POST`)
* **Primary Responsibility**: Calls Gemini AI to generate custom diagnostic questions with distractor rationales and LaTeX notation.
* **Status**: Essential.

### 3.11 `src/app/api/quizzes/attempt/route.ts`
* **File Type**: HTTP Route Handler (`POST`)
* **Primary Responsibility**: Initializes a new quiz attempt session and records start time.
* **Status**: Essential.

### 3.12 `src/app/api/quizzes/submit/route.ts`
* **File Type**: HTTP Route Handler (`POST`)
* **Primary Responsibility**: Grades submitted quiz answers against authoritative answer keys, computes accuracy percentages, and saves the attempt.
* **Status**: Essential.

### 3.13 `src/app/api/quizzes/batch-delete/route.ts`
* **File Type**: HTTP Route Handler (`POST`, `DELETE`)
* **Primary Responsibility**: Bulk deletes quizzes owned by the caller.
* **Status**: Essential.

### 3.14 `src/app/api/ai/test/route.ts`
* **File Type**: HTTP Route Handler (`GET`)
* **Primary Responsibility**: Diagnostic health-check confirming Gemini API key validity and model latency.
* **Status**: Operational diagnostic.

---

## 4. UI Component System (`src/components/`)

### 4.1 Auth & Guards
* **`AuthGuard.tsx`**: Route wrapper protecting dashboard routes; redirects unauthenticated visitors to `/login`.

### 4.2 Builder Components (`src/components/builder/`)
* **`DomainSelector.tsx`**: Cascading taxonomy picker (Domain -> Discipline -> Subject -> Topics).
* **`ExamSelector.tsx`**: Exam target picker (JEE, NEET, GATE, UPSC, CBSE).
* **`DepthDifficultySelector.tsx`**: Configures academic rigor (Class 11 to Research) and difficulty tier.
* **`ModalitiesSelector.tsx`**: Toggles videos, monographs, practice sets, quizzes, and flashcards.
* **`PacingSelector.tsx`**: Sets weekly study hours and sprint/casual pacing.
* **`AdvancedPreferencesAccordion.tsx`**: Configures explanation styles, resource freshness, and citation requirements.
* **`CuratorStatusPanel.tsx`**: Live telemetry panel showing real-time synthesis stages (1 through 7).
* **`CurriculumBlueprintCard.tsx`**: Visual card displaying live estimated module ranges and feasibility warnings.

### 4.3 Cards & Modals (`src/components/cards/`, `src/components/ui/`, `src/components/quiz/`)
* **`PathCard.tsx`**: Reusable course card with progress indicators, enrollment buttons, and deletion options.
* **`MetricCard.tsx`**: Statistics badge for hours invested, streak, and quiz accuracy.
* **`CreateQuizModal.tsx`**: Modal for launching on-demand AI quiz generation.
* **`DeleteCourseModal.tsx`**, **`DeleteQuizModal.tsx`**, **`DeleteAllModal.tsx`**: Confirmation dialogs for hard/soft deletions.
* **`EmptyState.tsx`**: Scholarly empty-state placeholder when no items match filters.
* **`Toast.tsx`**: Floating notification banner for transient user feedback.

---

## 5. State Management & Context (`src/context/`)

### 5.1 `src/context/AuthContext.tsx`
* **File Type**: React Context Provider (Client Component, 207 lines)
* **Primary Responsibility**: Maintains global authentication state (`user`, `session`, `profile`, `loading`). Listens to Supabase `onAuthStateChange`, executes email and Google sign-in/up, and triggers `migrateGuestDataToUser()` upon authentication.
* **Status**: Essential.

---

## 6. Core Libraries, Utilities & Catalogs (`src/lib/`)

### 6.1 `src/lib/env.ts`
* **File Type**: Zod-Validated Environment Module
* **Primary Responsibility**: Validates client-side and server-side environment variables at boot time; prevents runtime crashes due to missing keys.
* **Status**: Essential.

### 6.2 `src/lib/api-schemas.ts`
* **File Type**: API Request Validation Schemas
* **Primary Responsibility**: Declares strict Zod schemas for all inbound API route payloads.
* **Status**: Essential.

### 6.3 `src/lib/permissions.ts`
* **File Type**: Access Control & Authorization Evaluator
* **Primary Responsibility**: Pure functions (`canDeleteLearningPath`, `canDeleteQuiz`, `isUserAdmin`) evaluating whether a caller can mutate or delete a course or quiz based on ownership and roles.
* **Status**: Essential.

### 6.4 `src/lib/utils.ts`
* **File Type**: General Class & String Utilities
* **Primary Responsibility**: Combines `clsx` and `tailwind-merge` in the `cn()` utility for dynamic CSS class generation.
* **Status**: Essential.

### 6.5 `src/lib/catalogs/domainCatalog.ts` (953 lines)
* **File Type**: Universal Educational Taxonomy
* **Primary Responsibility**: Hierarchical catalog of 4 primary educational domains, 20+ disciplines, 60+ subjects, and 200+ topics covering K-12 boards, university engineering, law, commerce, and computer science.
* **Status**: Essential.

### 6.6 `src/lib/catalogs/examCatalog.ts`
* **File Type**: Competitive Exam Registry
* **Primary Responsibility**: Metadata and subject structures for national and international exams (JEE Main/Adv, NEET, GATE, UPSC, CAT, SAT).
* **Status**: Essential.

### 6.7 `src/lib/curriculum/blueprintEstimator.ts` (253 lines)
* **File Type**: Pre-Generation Pedagogical Estimator
* **Primary Responsibility**: Computes estimated module ranges, study hours, schedule feasibility, and stage breakdowns before calling AI APIs.
* **Status**: Essential.

---

## 7. Resource Engine 2.0 Subsystem (`src/lib/resource-engine-v2/`)

This is the architectural core of Pencill's resource discovery, evaluation, and sequencing capabilities.

### 7.1 Orchestration & Discovery
* **`orchestrator.ts` (397 lines)**: Central facade (`ResourceEngineV2`) coordinating analysis, query planning, concurrent provider execution, ranking, distribution, chapter extraction, and persistence mapping.
* **`discovery-engine.ts`**: Legacy/direct discovery facade providing backward-compatible `discoverResources()`.
* **`config.ts`**: Engine configuration and default thresholds.
* **`evaluation-harness.ts`**: Benchmark harness for comparing candidate ranking accuracy.

### 7.2 Analysis (`src/lib/resource-engine-v2/analysis/`)
* **`objective-analyzer.ts`**: Analyzes topic inputs into structured `AnalyzedObjective` models (domain, intent, key concepts, prerequisites).
* **`concept-extractor.ts`**: Extracts technical terms and concepts from queries using NLP regex heuristics.
* **`domain-detector.ts`**: Detects academic domains (Physics, Chemistry, CS, Math, Law).
* **`intent-classifier.ts`**: Classifies cognitive intent (foundational, conceptual, hands-on, exam prep).
* **`legacy-analyzer.ts`**: Backward-compatibility wrapper for V1 query analysis contracts.

### 7.3 Planning (`src/lib/resource-engine-v2/planning/`)
* **`search-planner.ts`**: Generates multi-provider search query strategies tailored to module objectives.
* **`query-generator.ts`**: Formulates search query strings with domain-specific qualifiers.
* **`query-deduplicator.ts`**: Eliminates redundant queries to prevent wasteful external API calls.
* **`legacy-planner.ts`**: Backward-compatibility wrapper for V1 search planning.

### 7.4 Providers & Adapters (`src/lib/resource-engine-v2/providers/`)
* **`base-adapter.ts`**: Abstract base class for V2 resource provider adapters.
* **`youtube-adapter.ts` (599 lines)**: Queries YouTube Data API v3 (`search`, `videos`, `playlistItems`), validates embeddability, parses ISO durations, and tracks quota circuit breakers.
* **`academic-notes-provider.ts` (757 lines)**: Searches Wikimedia, arXiv, OpenAlex, and official curriculum repositories (NCERT, MIT OCW).
* **`google-search-provider.ts` (494 lines)**: Connects to Google Custom Search JSON API with circuit breaker cooldowns.
* **`arxiv-adapter.ts`**: Connects to the arXiv e-Print API for academic papers.
* **`openalex-adapter.ts`**: Connects to the OpenAlex scholarly bibliographic index.
* **`legacy-youtube-provider.ts`**: Legacy V1 YouTube connector.
* **`quiz-provider.ts`**: Provider adapter for generating inline practice quizzes.

### 7.5 Educators & Master Dataset (`src/lib/resource-engine-v2/educators/`)
* **`master-dataset.ts` (1875 lines)**: Seed dataset containing 60+ verified master educators, channel IDs, domains, and 12 flagship learning pathways.
* **`educator-registry.ts`**: In-memory registry for querying educators by domain, language, or exam.
* **`educator-matcher.ts`**: Semantic matching engine matching course topics to verified educators.
* **`channel-verifier.ts`**: Verifies whether candidate videos originate from authoritative channels.

### 7.6 Evaluation & Scoring (`src/lib/resource-engine-v2/evaluation/`)
* **`ranking-engine.ts` (360 lines)**: `ExplainableRankingEngine` computing normalized weighted composite scores (50% Relevance, 25% Depth, 15% Duration, 10% Coverage) with buzzword penalties and diversity slotting.
* **`quality-scoring.ts` (818 lines)**: Detailed scoring engine evaluating topic relevance, publisher credibility, educational depth, and audiovisual quality.
* **`relevance-scorer.ts`**: Computes text similarity, concept overlap, and stop-word filtering.
* **`depth-evaluator.ts`**: Classifies candidate depth (Elementary to Research).
* **`duration-intelligence.ts` & `duration-manager.ts`**: Calibrates duration suitability against learning intent.
* **`practical-classifier.ts`**: Evaluates hands-on coding evidence, step-by-step demonstrations, and project depth.
* **`coverage-analyzer.ts`**: Measures what proportion of a module's key concepts are covered by a candidate.
* **`validation-engine.ts`**: Rejects generic channel URLs, search result pages, and unplayable videos.
* **`legacy-ranking.ts`**: Backward-compatibility wrapper for V1 ranking contracts.

### 7.7 Normalization & Chapters (`src/lib/resource-engine-v2/normalization/`, `chapters/`)
* **`normalizer.ts` & `legacy-normalizer.ts`**: Normalizes raw provider payloads into standard typed candidates.
* **`deduplication-engine.ts`**: Deduplicates candidates by Video ID, Playlist ID, and canonical URL.
* **`url-normalizer.ts`**: Standardizes YouTube, arXiv, and web URLs.
* **`duration-parser.ts`**: Parses ISO 8601 strings (`PT1H30M`) and timestamp formats into seconds.
* **`chapter-resolver.ts`**: Parses video descriptions to extract timestamped chapters (`14:22 Introduction`).
* **`sequence-generator.ts`**: Sequences resources in logical pedagogical order (Foundations -> Methods -> Applications).

### 7.8 Distribution & Persistence (`src/lib/resource-engine-v2/distribution/`, `persistence/`)
* **`module-distributor.ts`**: Dispatches resources across modules without cross-module duplicates.
* **`course-distributor.ts`**: High-level distribution planner.
* **`persistence-mapper.ts`**: Maps distribution plans into PostgreSQL relational schemas (`modules`, `lessons`, `resources`).
* **`persistence-safeguards.ts`**: Pre-write validation engine preventing malformed payloads from reaching the database.

### 7.9 Bridge & Resilience (`src/lib/resource-engine-v2/bridge/`, `resilience/`)
* **`compatibility-adapter.ts` (235 lines)**: Bridges V2 outputs into legacy V1 response schemas.
* **`engine-router.ts` (230 lines)**: Routes discovery between V1, Shadow Mode (with Jaccard similarity telemetry), and V2.
* **`circuit-breaker.ts`**: Trips on consecutive failures or quota exhaustion to protect external APIs.
* **`cache.ts`**: In-memory TTL cache for API responses.
* **`retry-policy.ts`**: Exponential backoff retry executor.

---

## 8. AI Services & Curriculum Synthesis (`src/services/ai/`)

### 8.1 `src/services/ai/gemini/client.ts` (212 lines)
* **File Type**: Native REST Client for Gemini API
* **Primary Responsibility**: Direct HTTPS communication with `generativelanguage.googleapis.com/v1beta`. Enforces server-only execution, redacts API keys in logs, configures `responseMimeType: 'application/json'`, and implements an automatic model fallback cascade (`gemini-3.8-flash` -> `gemini-3.5-flash` -> `gemini-flash-latest`).
* **Status**: Essential.

### 8.2 `src/services/ai/gemini/geminiProvider.ts` (637 lines)
* **File Type**: Prompt Engineering & Structured Parser
* **Primary Responsibility**: Constructs rigorous academic curriculum prompts, specifies LaTeX math formatting, enforces topic-adaptive module counts, and parses structured JSON output.
* **Status**: Essential.

### 8.3 `src/services/ai/curriculum-adaptive-engine.ts` (1064 lines)
* **File Type**: Topic-Adaptive Fallback Curriculum Engine
* **Primary Responsibility**: Deterministic curriculum generation engine used when LLM providers are offline. Contains domain inferencing (`inferDomain`) and pre-structured curricula for STEM and programming topics.
* **Status**: Essential.

---

## 9. Supabase & Data Access Layer (`src/services/supabase/`)

### 9.1 `src/services/supabase/client.ts`
* **File Type**: Database Client Factory
* **Primary Responsibility**: Exports default client (`supabase`) using `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `getAuthenticatedSupabaseClient(accessToken)` for RLS-authenticated requests.
* **Status**: Essential.

### 9.2 `src/services/supabase/pathService.ts` (1169 lines)
* **File Type**: Course CRUD Service
* **Primary Responsibility**: Reads, creates, caches, and deletes learning paths. Implements in-memory caching (`inMemoryPathCache`), `localStorage` sync, batched Supabase inserts, and duplicate video repair (`repairCourseVideoDuplicates`).
* **Status**: Essential.

### 9.3 `src/services/supabase/quizService.ts` (1377 lines)
* **File Type**: Quiz & Assessment Service
* **Primary Responsibility**: Creates quizzes, isolates authoritative answer keys from test-takers (`hideAnswers: true`), scores submitted answers, records attempts, and maintains guest attempts in `localStorage`.
* **Status**: Essential.

### 9.4 `src/services/supabase/deletionRegistry.ts` (262 lines)
* **File Type**: Persistent Deletion Exclusion Registry
* **Primary Responsibility**: Solves the "deleted item reappearing on page refresh" bug by tracking deleted course and quiz IDs across in-memory sets, `localStorage`, and PostgreSQL marker rows in `quizzes` with `status = 'deleted'`.
* **Status**: Essential.

### 9.5 `src/services/supabase/enrollmentService.ts` (574 lines)
* **File Type**: Multi-Tier Enrollment Service
* **Primary Responsibility**: Manages user enrollments across Tier A (LocalStorage), Tier B (Server JSON Store), and Tier C (Supabase `enrollments` table).
* **Status**: Essential.

### 9.6 `src/services/supabase/serverEnrollmentStore.ts`
* **File Type**: Node.js File-Based Enrollment Store
* **Primary Responsibility**: Persists enrollments to `data/enrollments.json` as an atomic fallback store.
* **Status**: Essential fallback.

### 9.7 `src/services/supabase/migrationService.ts`
* **File Type**: Guest-to-User Data Migration Service
* **Primary Responsibility**: Batch-migrates guest progress records, user notes, and quiz attempts from browser `localStorage` into Supabase upon user login/signup.
* **Status**: Essential.

### 9.8 `lessonService.ts`, `noteService.ts`, `bookmarkService.ts`, `progressService.ts`, `profileService.ts`, `resourceService.ts`
* **File Type**: Domain Services
* **Primary Responsibility**:
  * `lessonService`: Fetches 3-pane workspace lesson data.
  * `noteService`: Timestamped notes CRUD.
  * `bookmarkService`: Resource and formula bookmarking CRUD.
  * `progressService`: Calculates weekly hours, completion percentages, and topic mastery.
  * `profileService`: Creates and fetches user profile rows.
  * `resourceService`: Searches and queries verified resources table.
* **Status**: Essential.

---

## 10. Database Migrations & SQL Schemas (`supabase/migrations/`)

1. **`20260921000000_pencill_core_schema.sql` (443 lines)**: Core tables (`profiles`, `learning_paths`, `modules`, `lessons`, `resources`, `progress_records`, `bookmarks`, `user_notes`, `quizzes`, `quiz_questions`, `quiz_attempts`, `ai_generation_records`, `discovery_jobs`) and baseline RLS policies.
2. **`20260927000000_enable_author_content_rls.sql`**: RLS policies allowing authenticated users to create and edit personal learning paths.
3. **`20261004000000_course_deletion_and_cascade.sql`**: Configures foreign key cascading deletes (`ON DELETE CASCADE`) across modules, lessons, and progress records.
4. **`20261013000000_add_lesson_study_notes.sql`**: Adds structured `study_notes` JSONB column to `lessons`.
5. **`20261013010000_academic_content_and_enrollments.sql`**: Creates `enrollments` table and seeds academic course sources.
6. **`20261013020000_seed_real_academic_content.sql`**: Seeds MIT OCW and NPTEL physics, calculus, and programming courses.
7. **`20261013030000_quiz_maker_system.sql`**: Enhances `quizzes` table with `status`, `metadata`, and distractor analysis fields.
8. **`20261013040000_cascade_deletion_improvements.sql`**: Hardens cascading deletions.
9. **`20261015000000_quiz_cascade_deletion.sql`**: Adds cascade deletion triggers between learning paths and child quizzes.
10. **`20261015010000_allow_authenticated_catalog_deletion.sql`**: Configures permissions for catalog deletion.
11. **`20261015020000_fix_enrollments_table.sql`**: Recreates `enrollments` with unique constraint `(user_id, course_id)` and RLS policies.
12. **`20261018000000_master_educator_directory.sql` (1875 lines)**: Creates `master_educators` table and seeds 60+ verified channels and flagship courses.

---

## 11. Data Stores & Local Persistence (`data/`)

* **`data/deleted_records.json`**: JSON ledger storing IDs of deleted learning paths and quizzes during offline testing and server fallback execution.
* **`data/enrollments.json`**: JSON ledger storing active user enrollments to ensure zero enrollment data loss during local development or database maintenance.

---

## 12. Automated Test Suite (`tests/`)

* **29 test files**, **472 automated tests**, **0 failures**:
  * `critical-regressions-audit.test.ts`: Verifies exact video URL navigation, NCERT discovery, and quiz persistence.
  * `batch-deletion.test.ts`: Verifies batch course and quiz deletion schemas and authorization guards.
  * `deletion-persistence.test.ts`: Verifies that deleted items never reappear on page refresh.
  * `course-enrollment-persistence.test.ts`: Verifies multi-tier enrollment persistence across reloads.
  * `academic-integrity-and-enrollments.test.ts`: Verifies MIT OCW adapter normalization.
  * `resource-engine.test.ts`: Tests V1/V2 engine routing and ranking formulas.
  * `tests/resource-engine-v2/` (11 test suites): Exhaustive unit tests for objective analysis, query planning, YouTube adapter, normalization, evaluation, and distribution.

---

## 13. Smoke Tests & Operational Scripts (`scripts/`)

* **`scripts/check-supabase-db.ts`**: Verifies live connection to Supabase and inspects table schemas.
* **`scripts/verify-actual-engine.ts`**: Live smoke test querying YouTube API and testing Master Educator Directory matching.
* **`scripts/test-gemini.mjs`**: Tests live Gemini AI REST connectivity and fallback cascades.
* **`scripts/verify_rls_policies.ts`**: Validates Row Level Security policies across user roles.
* **`scripts/verify_new_goal_e2e.ts`**: Full end-to-end simulation of goal submission, AI synthesis, discovery, and course persistence.

---

## 14. Design Artifacts & Stitch Prototypes

* **`stitch_pencill_ai_learning_platform/`**: Contains HTML prototypes (`code.html`), high-resolution screenshots (`screen.png`), and design tokens (`DESIGN.md`) generated during the initial visual design phase. These mockups inspired the editorial parchment UI styling implemented in Tailwind CSS.
