# Pencill — Technical Interview Master Guide

> **Your Comprehensive Preparation Toolkit for Explaining, Defending, and Whiteboarding Pencill in Senior Engineering Interviews.**

---

## Table of Contents
1. [Project Introductions (30s, 90s, 3min)](#1-project-introductions)
2. [System Architecture Interview Questions](#2-system-architecture-interview-questions)
3. [AI & Resource Engine 2.0 Interview Questions](#3-ai--resource-engine-20-interview-questions)
4. [Database & Relational Data Flow Questions](#4-database--relational-data-flow-questions)
5. [Code Deep-Dive & Whiteboarding Exercises](#5-code-deep-dive--whiteboarding-exercises)
6. [Tough Interviewer Challenge Questions & Honest Defenses](#6-tough-interviewer-challenge-questions--honest-defenses)
7. [75 High-Yield Technical Flashcards](#7-75-high-yield-technical-flashcards)

---

## 1. Project Introductions

### 1.1 The 30-Second Elevator Pitch
> "Pencill is an open-source academic learning platform that turns high-level learning goals into rigorous, structured university courses. Instead of producing generic AI summaries or locking users into expensive paywalled content, Pencill combines Google Gemini with an autonomous Resource Engine that queries, scores, deduplicates, and sequences verified open educational resources—like MIT OpenCourseWare, NPTEL, NCERT, and YouTube. It features a 3-pane interactive study workspace, in-context timestamped notes, LaTeX formula decks, and diagnostic assessments backed by Supabase PostgreSQL and Row Level Security."

---

### 1.2 The 90-Second Professional Overview
> "The inspiration for Pencill came from a core problem in online self-education: virtually all the world's best educational content is already free on YouTube, MIT OCW, and national archives, but it's completely fragmented and filled with low-quality clickbait.
>
> To solve this, I architected Pencill using Next.js 14 App Router, TypeScript, and Supabase. When a student enters an academic target—say, 'JEE Physics Mechanics' or 'Python Programming'—the system does two things:
>
> First, our server calls Google Gemini via a direct REST client with model fallback cascades to architect a pedagogically sound modular syllabus with learning objectives and LaTeX math notation.
>
> Second, our autonomous Resource Engine 2.0 takes those module objectives and executes multi-provider search queries across YouTube, arXiv, OpenAlex, NCERT, and our 60-educator Master Dataset. We rank candidates using a multi-criteria algorithm that balances relevance, educational depth, duration suitability, and objective coverage, while stripping duplicate videos and resolving description timestamps.
>
> The learner then studies inside an active 3-pane workspace with privacy-preserving YouTube playback, takes diagnostic checkpoint quizzes, and tracks progress. The entire system is built offline-first: visitors can study and take notes as guests, and their progress automatically migrates into PostgreSQL when they sign up."

---

### 1.3 The 3-Minute Technical Architecture Walkthrough
> "Architecturally, Pencill is designed as a hybrid Jamstack application with a resilient micro-service pipeline inside Next.js 14 Serverless Route Handlers, communicating with Supabase PostgreSQL and external cloud APIs.
>
> Looking at the request lifecycle for course generation:
> 1. **Client Layer**: In `/new-goal`, the learner configures depth, difficulty, pacing, and modalities. As they type, a client-side blueprint estimator calculates expected module ranges and schedule feasibility in real-time.
> 2. **API & Validation**: Submitting the form fires `POST /api/resources/discover`. The server validates the body using strict Zod schemas, rejecting malformed requests with HTTP 400.
> 3. **AI Curriculum Synthesis**: The server delegates to `GeminiProvider`. We call the Gemini REST API directly using Node's native `fetch` with `x-goog-api-key` headers rather than an external SDK, reducing bundle size. If `gemini-3.8-flash` encounters 503 high demand spikes, our client automatically cascades to `gemini-3.5-flash`, and if offline, falls back to a local deterministic curriculum engine that infers domains and constructs syllabi algorithmically.
> 4. **Resource Engine 2.0**: The engine analyzes the module objectives, formulates search queries, and executes them with a bounded concurrency pool of 4 workers. We integrate YouTube Data API v3, an in-memory Master Educator Directory of 60+ verified institutional channels, and academic repositories.
> 5. **Quality Scoring & Distribution**: Candidates are gated by relevance, then scored on a 100-point normalized scale: 50% relevance, 25% depth, 15% duration suitability, and 10% concept coverage, with category alignment bonuses for practical coding tutorials and buzzword penalties for clickbait. A module distributor ensures no duplicate videos leak across chapters, and a chapter resolver extracts description timestamps (`14:22`) so students jump directly to specific derivations.
> 6. **Persistence & Security**: Courses are persisted across relational tables (`learning_paths`, `modules`, `lessons`) using batched inserts. Security is enforced at the database level using PostgreSQL Row Level Security: private data like notes and progress are strictly constrained to `auth.uid() = user_id`, while system-curated catalog syllabi are protected from deletion by non-admin users.
> 7. **Testing**: The repository contains 472 automated tests executing natively in Node.js via `tsx`, covering regression prevention, RLS authorization, and mathematical ranking determinism."

---

## 2. System Architecture Interview Questions

### Q1: Why did you choose Next.js 14 App Router over a standard React SPA with Vite and an Express backend?
* **Answer**:
  "Next.js 14 App Router gave us three crucial architectural benefits:
  1. **Unified TypeScript Type Safety**: Both our API route handlers (`/api/resources/*`) and client pages share identical TypeScript domain models (`src/types/index.ts`) and Zod validation schemas (`src/lib/api-schemas.ts`) without code duplication or build-step synchronization.
  2. **Security & Zero Client Secret Leakage**: The App Router strictly isolates server-side execution. Server routes communicate with Gemini and YouTube using private environment variables (`GEMINI_API_KEY`) that are never exposed in browser bundles.
  3. **Hybrid Rendering Strategy**: Public editorial landing pages and course catalog views can be pre-rendered or cached for fast SEO and low latency, while interactive workspaces (`/learn/[courseId]/[lessonId]`) hydrate as dynamic Client Components."

---

### Q2: What are the system's biggest performance bottlenecks, and how did you address them?
* **Answer**:
  "The primary bottleneck was **external network latency during course discovery**. If you search 4 external providers (YouTube, OpenAlex, arXiv, Google Search) across 4 module objectives sequentially, you trigger 16 HTTP network calls taking over 30 seconds.
  
  We resolved this with three engineering techniques:
  1. **Query Deduplication**: `query-deduplicator.ts` normalizes query strings and eliminates redundant queries before sending requests.
  2. **Bounded Concurrency (`runWithConcurrencyLimit`)**: We execute queries in parallel with a bounded worker pool of 4 concurrent sockets. This keeps discovery latency down to 2–4 seconds without overwhelming the Node event loop or hitting host socket limits.
  3. **Multi-Tier In-Memory Caching**: We maintain `inMemoryPathCache` and `queryCache` with 20-minute TTLs to serve repeated queries in microseconds without hitting third-party quotas."

---

## 3. AI & Resource Engine 2.0 Interview Questions

### Q3: Why use an LLM for curriculum generation, and which tasks do you deliberately NOT use an LLM for?
* **Answer**:
  "We use an LLM strictly where probabilistic synthesis and pedagogical intuition excel: understanding ambiguous, multi-discipline user goals, breaking a topic into a logically sequenced syllabus (Axioms -> Methods -> Applications), and formulating LaTeX-annotated diagnostic assessment questions.
  
  Conversely, we **strictly reject using LLMs for resource discovery, URL generation, or scoring**. LLMs are notorious for hallucinating non-existent YouTube URLs, dead links, and fabricated citations. 
  
  Therefore, all resource discovery in Pencill is 100% deterministic:
  * YouTube Data API queries real, live videos.
  * Embeddability is checked via `status.embeddable`.
  * Educational authority is verified against our curated Master Dataset.
  * Quality ranking is computed using explicit mathematical equations, not LLM opinion."

---

### Q4: Walk me through the mathematical ranking formula in Resource Engine 2.0.
* **Answer**:
  "In [`ExplainableRankingEngine.rank()`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/lib/resource-engine-v2/evaluation/ranking-engine.ts#L85), each eligible candidate is scored on a normalized 0–100 scale using the equation:
  
  $$S_{\text{overall}} = \text{clamp}\left(0, 100, \left[ S_{\text{rel}} \cdot 0.50 + S_{\text{depth}} \cdot 0.25 + S_{\text{dur}} \cdot 0.15 + S_{\text{cov}} \cdot 0.10 + \text{Bonus} - \text{Penalty} \right]\right)$$
  
  * **$S_{\text{rel}}$ (Relevance, 50%)**: Measures title, description, and keyword token overlap against the module's primary concepts. If $S_{\text{rel}} < 50$, the candidate is immediately rejected.
  * **$S_{\text{depth}}$ (Educational Depth, 25%)**: Evaluates institutional credibility (MIT OCW, NPTEL, Harvard), creator credentials, and structured explanation depth.
  * **$S_{\text{dur}}$ (Duration Intelligence, 15%)**: Calibrates duration against cognitive intent. For example, a 15-minute hands-on tutorial is optimal for coding ($S_{\text{dur}} = 92$), whereas a 50-minute derivation is optimal for university mechanics ($S_{\text{dur}} = 95$).
  * **$S_{\text{cov}}$ (Objective Coverage, 10%)**: Measures the ratio of required subtopics covered.
  * **Category Alignment Bonus**: +8 points for hands-on step-by-step code walkthroughs.
  * **Buzzword Penalty**: -25 points for clickbait keywords ('Learn in 10 minutes') that lack technical depth."

---

### Q5: How do you handle third-party API rate limits and outages?
* **Answer**:
  "We implement a **multi-tier resilience strategy**:
  1. **Gemini Outages**: Our client iterates through a candidate model cascade (`gemini-3.8-flash` -> `gemini-3.5-flash` -> `gemini-flash-latest`). If Google Cloud is down, `createTopicAdaptiveCurriculum()` deterministically generates a university-grade syllabus using pre-built conceptual templates.
  2. **YouTube Quota Exhaustion (HTTP 403)**: Google limits YouTube API projects to 10,000 units/day. Our adapter monitors response codes. Upon receiving 403 `quotaExceeded`, an internal `CircuitBreaker` trips for 60 seconds. Subsequent requests immediately bypass the external API and serve verified flagship courses from our 60-educator Master Dataset.
  3. **Supabase Network Drops**: If Supabase is unreachable, courses are saved to server memory (`inMemoryPathCache`) and browser `localStorage`, allowing the learner to continue studying without disruption."

---

## 4. Database & Relational Data Flow Questions

### Q6: Why did you choose relational PostgreSQL with JSONB instead of a pure NoSQL document store like MongoDB?
* **Answer**:
  "Educational curricula have both **strict relational hierarchies** and **variable semi-structured metadata**:
  * **Relational Power**: A course contains modules, which contain lessons, which have enrollments, progress records, and notes. Using foreign keys with `ON DELETE CASCADE` guarantees referential integrity. If an author deletes a course, PostgreSQL automatically purges its child modules, lessons, notes, and enrollments in a single atomic transaction. In MongoDB, you would need complex two-phase commits or risk orphan records.
  * **JSONB Flexibility**: Within a lesson or quiz question, data structures vary widely. We use PostgreSQL `JSONB` for video chapter timestamps (`chapters`), LaTeX formula decks (`formulae`), multiple-choice options (`options`), and user quiz answers (`answers`). We get the schema flexibility of document stores combined with ACID relational integrity."

---

### Q7: Explain the 'deleted course reappearing on page refresh' bug and how you fixed it.
* **Answer**:
  "This was one of the most interesting bugs in the codebase.
  * **The Problem**: A user would click 'Delete Course' on the Explore page, and the card disappeared immediately. But upon pressing `F5` / Refresh, the course reappeared!
  * **Root Cause**: The deletion was originally performed as an optimistic client-side UI filter. When the delete request reached Supabase, if the user was in guest mode or lacked permissions on system catalog tracks, the SQL delete failed or was ignored. When the page reloaded, `getLearningPaths()` re-fetched all active rows from the database, restoring the deleted card.
  * **The Fix**: We built an authoritative **Persistent Deletion Registry** ([`deletionRegistry.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/services/supabase/deletionRegistry.ts)). When an item is deleted, `recordDeletedItem()` writes an authoritative marker row into PostgreSQL `public.quizzes` with `id = '__deleted__path__<id>'` and `status = 'deleted'`. It also syncs with `localStorage` and an in-memory Set. Every catalog query calls `getDeletedItemIds()` and strictly filters out deleted IDs. Even if a physical database row delete is blocked, the item is permanently excluded from UI rendering across all reloads."

---

## 5. Code Deep-Dive & Whiteboarding Exercises

### Exercise 1: Bounded Concurrency Worker
**Code Excerpt from [`src/lib/resource-engine-v2/orchestrator.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/lib/resource-engine-v2/orchestrator.ts#L105-L128)**:
```typescript
async function runWithConcurrencyLimit<T>(
  tasks: Array<() => Promise<T>>,
  concurrency: number
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = new Array(tasks.length);
  let currentIndex = 0;

  async function worker(): Promise<void> {
    while (currentIndex < tasks.length) {
      const idx = currentIndex++;
      try {
        const val = await tasks[idx]();
        results[idx] = { status: 'fulfilled', value: val };
      } catch (err) {
        results[idx] = { status: 'rejected', reason: err };
      }
    }
  }

  const workerCount = Math.min(concurrency, tasks.length);
  const workers = Array.from({ length: workerCount }, () => worker());
  await Promise.all(workers);
  return results;
}
```
* **Interview Discussion**:
  * *What does this do?*: Runs an array of async promise-returning factory functions with a fixed concurrency window (e.g. 4 workers).
  * *Why `currentIndex++`?*: JavaScript's single-threaded event loop guarantees that incrementing `currentIndex` within synchronous execution of the worker loop is atomic, preventing race conditions or duplicate task executions.
  * *Why `PromiseSettledResult`?*: Ensures that if one provider query fails or times out, it does not abort the other active workers (unlike `Promise.all` which rejects on first failure).

---

### Exercise 2: Objective-Aware Modality Suitability Guard
**Code Excerpt from [`src/lib/resource-engine-v2/evaluation/ranking-engine.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/lib/resource-engine-v2/evaluation/ranking-engine.ts#L20-L40)**:
```typescript
export function isModalityAppropriateForObjective(
  modality: ResourceModality,
  objective: AnalyzedObjective
): boolean {
  if (modality === 'paper') {
    const isBeginner = objective.academicLevel === 'beginner' || objective.academicLevel === 'elementary';
    const isSchoolOrBoardExam = !!objective.targetExam && /^(hsc|cbse|icse|class\s*1[012]|neet|jee)/i.test(objective.targetExam);
    const isHandsOn = objective.cognitiveIntent === 'coding_walkthrough' || objective.cognitiveIntent === 'project_implementation';

    if (isBeginner || isSchoolOrBoardExam || isHandsOn) {
      return false;
    }
    return true;
  }
  return true;
}
```
* **Interview Discussion**:
  * *What edge case does this solve?*: When a student asks for 'CBSE Class 11 Physics Vectors', open academic indexes (arXiv) might return a 50-page theoretical research paper on 'Topological Vector Bundles in Quantum Field Theory'. Because it has high keyword overlap with 'Vectors', a naive keyword search engine would rank it #1. This guard intercepts the candidate and rejects it because research papers are pedagogically toxic for high school board exams.

---

## 6. Tough Interviewer Challenge Questions & Honest Defenses

### Challenge 1: "Why did you build Pencill? Couldn't a user just prompt ChatGPT or Gemini directly: 'Give me a study plan for JEE Physics'?"
* **Honest Defense**:
  "ChatGPT can generate a text outline, but it cannot create an **actionable learning environment**.
  1. **Hallucinated Resources**: If you ask an LLM for video links or reading materials, over 40% of the URLs are dead, hallucinated, or completely wrong. Pencill queries live APIs, checks embeddability, and validates canonical URLs.
  2. **Active Multi-Modal Workspace**: An LLM chat produces a wall of static text. Pencill generates a 3-pane interactive study room with embedded video player, timestamped chapter navigation, reading materials, in-context lecture notes, and LaTeX formula decks.
  3. **Assessment & Formative Evaluation**: Pencill generates diagnostic checkpoint quizzes with authoritative answer key isolation, instant grading, and distractor analysis.
  4. **Progress & Persistence**: Pencill tracks hours invested, module completion, and streak momentum backed by PostgreSQL."

---

### Challenge 2: "Are your quizzes genuinely grounded in the exact video content?"
* **Honest Technical Defense**:
  "I want to be completely transparent about our current implementation:
  * **What we currently do**: Quizzes are grounded in the **module's explicit pedagogical learning objectives, key concepts, and curriculum subtopics**. For example, in a module on $S_N1$ vs $S_N2$ reactions, questions test kinetics, stereochemical inversion, and carbocation stability.
  * **What we do NOT do yet**: We do not currently download and parse full automated video transcript subtitles in real-time. Third-party YouTube videos may occasionally use slightly different analogies than our quiz.
  * **Future Improvement**: In our production roadmap, we plan to integrate YouTube's `v3/captions` API or Whisper to transcribe dialogue and extract direct verbatim quotes into the prompt."

---

### Challenge 3: "What happens if a user submits a malicious payload to delete system catalog courses?"
* **Honest Defense**:
  "Our architecture has **defense in depth** across 3 layers:
  1. **Input Validation Layer**: `BatchDeleteCoursesSchema` in Zod checks ID regex (`/^[a-zA-Z0-9_-]+$/`) and caps batch sizes to 100.
  2. **Service Authorization Layer**: [`canDeleteLearningPath()`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/lib/permissions.ts#L58) verifies the caller's JWT role. If `author_user_id IS NULL` (System Catalog) and the caller is not an `admin`, the request is rejected with HTTP 403 Forbidden.
  3. **Database Layer**: PostgreSQL Row Level Security enforces that even if the API route were bypassed, the database policy `USING (auth.uid() = author_user_id)` rejects the SQL mutation."

---

## 7. 75 High-Yield Technical Flashcards

### Category 1: Project Overview (Cards 1–6)
1. **Q: What is Pencill?**  
   *A*: An AI-powered academic learning platform that turns educational goals into structured, multi-modal learning pathways populated with verified open educational resources.
2. **Q: Who are Pencill's target users?**  
   *A*: Competitive exam scholars (JEE, NEET), high school board students (CBSE, ICSE, State Boards), and university computer science/engineering students.
3. **Q: How does Pencill differ from a basic CRUD app?**  
   *A*: Dynamic AI curriculum synthesis, autonomous multi-provider discovery/ranking, topic-adaptive module scaling, and an active 3-pane study workspace.
4. **Q: What are the 4 primary educational domains in Pencill?**  
   *A*: School Education, University and Higher Education, Competitive Examinations, and Programming/Skill Development.
5. **Q: Does Pencill lock users behind a mandatory login?**  
   *A*: No. It implements an offline-first guest architecture where visitors can study, take notes, and take quizzes offline; data syncs to PostgreSQL upon signup.
6. **Q: What license and framework does Pencill use?**  
   *A*: Open-source, built on Next.js 14 App Router, TypeScript 5, and Supabase PostgreSQL.

---

### Category 2: Frontend & React 18 (Cards 7–12)
7. **Q: What is the difference between a Server Component and a Client Component in Next.js 14?**  
   *A*: Server Components render exclusively on the server with zero client JS bundle; Client Components (`"use client"`) hydrate in the browser to support interactivity, hooks (`useState`, `useEffect`), and DOM events.
8. **Q: Why does `new-goal/page.tsx` require `"use client"`?**  
   *A*: Because it manages interactive form state (`config`), accordion toggles, blueprint recalculation (`useMemo`), and client-side `localStorage` drafts.
9. **Q: What is the purpose of `useMemo` in `new-goal/page.tsx`?**  
   *A*: It memoizes `estimateCurriculumBlueprint(config)`, recomputing module scope and schedule feasibility only when builder preferences change.
10. **Q: How does `useCallback` improve performance in Pencill?**  
    *A*: It preserves stable function references (e.g. `handleSaveDraft`), preventing unnecessary re-renders of complex child selector components.
11. **Q: What font typography does Pencill use?**  
    *A*: Google Newsreader (editorial serif), Plus Jakarta Sans (clean UI sans-serif), and Material Symbols Outlined.
12. **Q: What is the purpose of `src/components/ui/Toast.tsx`?**  
    *A*: Renders non-blocking, transient feedback notifications (e.g. "Customization saved to local draft").

---

### Category 3: Next.js 14 App Router & Routing (Cards 13–18)
13. **Q: What does parentheses notation `(dashboard)` mean in the App Router?**  
    *A*: It is a Route Group. It organizes routes logically without adding `/(dashboard)` into the public URL path.
14. **Q: How are dynamic URL parameters captured in `learn/[courseId]/[lessonId]`?**  
    *A*: Via the `useParams()` hook in Client Components or the `params` prop in Server Components.
15. **Q: What does `src/app/auth/callback/page.tsx` do?**  
    *A*: It intercepts OAuth hash fragments/code params after Google sign-in and establishes the Supabase session.
16. **Q: What is the purpose of `src/app/error.tsx`?**  
    *A*: An error boundary component that catches unhandled React runtime errors and renders a graceful recovery UI.
17. **Q: How does `next.config.mjs` configure external image optimization?**  
    *A*: Uses `images.remotePatterns` to authorize Google user avatar images from `lh3.googleusercontent.com`.
18. **Q: How many total routes are compiled during production build?**  
    *A*: 25 routes (combination of static pages, dynamic server pages, and API handlers).

---

### Category 4: TypeScript & Validation (Cards 19–24)
19. **Q: What TypeScript compiler mode does Pencill enforce?**  
    *A*: Strict mode (`"strict": true` in `tsconfig.json`).
20. **Q: What path alias is configured in `tsconfig.json`?**  
    *A*: `"@/*": ["./src/*"]` allowing clean imports from project root.
21. **Q: What is Zod and where is it used?**  
    *A*: A schema validation library used in `src/lib/env.ts` (environment variables) and `src/lib/api-schemas.ts` (API request bodies).
22. **Q: How does `DiscoverRequestSchema` validate incoming discovery requests?**  
    *A*: Enforces non-empty topics/queries, bounds weekly study hours (1–60), and validates modality arrays.
23. **Q: What happens when an invalid request hits `/api/resources/discover`?**  
    *A*: `DiscoverRequestSchema.safeParse()` fails, returning HTTP 400 with flattened field error details.
24. **Q: What is the difference between `z.infer<typeof Schema>` and explicit TypeScript interfaces?**  
    *A*: `z.infer` automatically generates TypeScript types directly from runtime validation schemas, guaranteeing types and validation never diverge.

---

### Category 5: AI Integration & Gemini API (Cards 25–30)
25. **Q: What LLM models does Pencill support?**  
    *A*: `gemini-3.8-flash`, `gemini-3.5-flash`, and `gemini-flash-latest`.
26. **Q: How does Pencill call Google Gemini?**  
    *A*: Direct HTTPS REST calls to `generativelanguage.googleapis.com/v1beta` with `x-goog-api-key` headers (no heavy SDK).
27. **Q: How does Pencill enforce structured JSON responses from Gemini?**  
    *A*: Sets `responseMimeType: 'application/json'` in the API generation config and includes strict schema instructions in the prompt.
28. **Q: What happens if `gemini-3.8-flash` returns HTTP 503 high demand?**  
    *A*: `callGemini()` catches the 503 error and automatically cascades to `gemini-3.5-flash`.
29. **Q: What is the last-resort fallback if all Gemini models are offline?**  
    *A*: `createTopicAdaptiveCurriculum()` deterministically generates structured syllabi using algorithmic domain inferencing.
30. **Q: How does `extractJsonFromText` handle unescaped LaTeX backslashes?**  
    *A*: It preprocesses math formulae (e.g. `\frac`, `\alpha`), escaping single slashes so `JSON.parse` does not crash.

---

### Category 6: Resource Engine 2.0: Architecture & Planning (Cards 31–36)
31. **Q: What is Resource Engine 2.0?**  
    *A*: Pencill's autonomous multi-source search, evaluation, deduplication, and module distribution pipeline.
32. **Q: Where is Resource Engine 2.0 located?**  
    *A*: `src/lib/resource-engine-v2/`.
33. **Q: What are the 6 cognitive intents classified by `objective-analyzer.ts`?**  
    *A*: `foundational_intro`, `in_depth_conceptual`, `coding_walkthrough`, `project_implementation`, `worked_examples`, `exam_practice`.
34. **Q: What is the purpose of `search-planner.ts`?**  
    *A*: Translates analyzed objectives into provider-specific queries with domain qualifiers.
35. **Q: Why does `query-deduplicator.ts` run before provider searches?**  
    *A*: To remove identical query strings across modules, preventing wasteful API requests and quota drain.
36. **Q: What concurrency limit does `orchestrator.ts` enforce for provider requests?**  
    *A*: 4 concurrent workers (`runWithConcurrencyLimit`).

---

### Category 7: Resource Engine 2.0: Sourcing & Adapters (Cards 37–42)
37. **Q: What resource providers are integrated into Resource Engine 2.0?**  
    *A*: YouTube Data API v3, Master Educator Dataset, Academic Notes Connector (NCERT, MIT OCW), arXiv API, and OpenAlex.
38. **Q: How does `youtube-adapter.ts` check if a video can be played in our app?**  
    *A*: It inspects `status.embeddable == true` in YouTube video details; non-embeddable videos are rejected.
39. **Q: What is the Master Educator Directory?**  
    *A*: A curated dataset of 60+ verified channels (MIT OCW, NPTEL, Khan Academy, 3Blue1Brown, Striver, Abdul Bari, CS50).
40. **Q: What happens if a YouTube API key is missing or quota is exhausted?**  
    *A*: The provider trips a circuit breaker and serves verified flagship courses from the Master Educator Directory.
41. **Q: Where does `academic-notes-provider.ts` discover direct NCERT textbooks?**  
    *A*: Direct canonical endpoints on `ncert.nic.in` for high school science and mathematics.
42. **Q: Does Pencill require paid API keys for arXiv and OpenAlex?**  
    *A*: No. Both are open public academic APIs queried via standard HTTP.

---

### Category 8: Resource Engine 2.0: Ranking & Scoring (Cards 43–48)
43. **Q: What are the 4 core scoring weights in `ranking-engine.ts`?**  
    *A*: 50% Relevance, 25% Depth, 15% Duration Suitability, 10% Concept Coverage.
44. **Q: What is the minimum relevance score threshold for candidate acceptance?**  
    *A*: 50 / 100. Candidates scoring below 50 are rejected regardless of authority.
45. **Q: How does duration suitability scoring differ between coding tutorials and math derivations?**  
    *A*: Hands-on coding tutorials optimize for 12–25 mins; comprehensive math derivations optimize for 45–60 mins.
46. **Q: What is the Buzzword Penalty in `ranking-engine.ts`?**  
    *A*: A 25-point penalty applied to videos containing superficial hype keywords without substantial concept coverage.
47. **Q: What is the Modality Suitability Guard in `ranking-engine.ts`?**  
    *A*: It strictly blocks research papers from displacing practical tutorials or high school exam prep materials.
48. **Q: How does `ranking-engine.ts` enforce modality diversity?**  
    *A*: It slots high-scoring text monographs or official documentation into slot #3 alongside top video lectures.

---

### Category 9: Normalization, Chapters & Distribution (Cards 49–54)
49. **Q: What does `chapter-resolver.ts` do?**  
    *A*: Parses YouTube video descriptions for timestamps (`14:22 Topic`), validating order against video duration.
50. **Q: Why does Pencill append `&start=...` to YouTube embed URLs?**  
    *A*: To start video playback at the exact second where the lesson topic is introduced.
51. **Q: What is the responsibility of `module-distributor.ts`?**  
    *A*: Distributes candidates across course modules and assigns pedagogical roles (`core_video`, `monograph`, `practice`).
52. **Q: How does Pencill prevent duplicate videos across modules?**  
    *A*: `module-distributor.ts` quarantines assigned video IDs; `repairCourseVideoDuplicates()` patches existing courses.
53. **Q: What is the purpose of `persistence-safeguards.ts`?**  
    *A*: Runs pre-write schema validation ensuring no malformed URLs or empty modules reach the database.
54. **Q: What does `compatibility-adapter.ts` do?**  
    *A*: Adapts V2 `EngineDiscoveryOutput` data models into the public `DiscoverResponse` schema expected by the frontend.

---

### Category 10: Database & Schema (Cards 55–60)
55. **Q: What is the primary course table in PostgreSQL?**  
    *A*: `public.learning_paths` (NOT `courses`).
56. **Q: How does `learning_paths` distinguish official catalog tracks from user-generated courses?**  
    *A*: `author_user_id IS NULL` for official catalog courses; non-null UUID for personal generated courses.
57. **Q: What happens in PostgreSQL when a `learning_paths` record is deleted?**  
    *A*: `ON DELETE CASCADE` automatically deletes all child `modules`, `lessons`, `quizzes`, `notes`, and `enrollments`.
58. **Q: What structured data is stored in `lessons.chapters`?**  
    *A*: JSONB array of `{ title: string, timestampSeconds: number }`.
59. **Q: What unique constraint exists on `public.enrollments`?**  
    *A*: `CONSTRAINT unique_user_course_enrollment UNIQUE(user_id, course_id)`.
60. **Q: What unique constraint exists on `public.progress_records`?**  
    *A*: `CONSTRAINT unique_user_lesson_progress UNIQUE(user_id, lesson_id)`.

---

### Category 11: Security & Row Level Security (Cards 61–66)
61. **Q: What is Row Level Security (RLS)?**  
    *A*: A PostgreSQL security feature where access control policies are evaluated per row at the database engine level.
62. **Q: Why doesn't Pencill use `SUPABASE_SERVICE_ROLE_KEY`?**  
    *A*: To prevent the server from accidentally bypassing RLS; all authenticated queries pass the user's JWT Bearer token.
63. **Q: What is the RLS policy on `public.user_notes`?**  
    *A*: `USING (auth.uid() = user_id)`. Users can only view, create, or delete their own notes.
64. **Q: How are quiz answer keys protected from student inspection?**  
    *A*: Active quiz requests (`GET /api/quizzes/[id]?hideAnswers=true`) strip `correctOptionId` before sending JSON to the client.
65. **Q: Why does Pencill use `youtube-nocookie.com` for video embeds?**  
    *A*: To prevent third-party tracking cookies from tracking students in compliance with educational privacy standards.
66. **Q: Who is authorized to delete system-curated catalog courses?**  
    *A*: Strictly users with `admin` or `instructor` tier in `profiles` or `app_metadata`.

---

### Category 12: Testing & Debugging (Cards 67–71)
67. **Q: What testing framework is used in Pencill?**  
    *A*: Node.js Native Test Runner (`node:test`, `node:assert/strict`) executed with `tsx`.
68. **Q: How many tests are in the test suite and what is the pass rate?**  
    *A*: 472 tests across 139 suites, 100% passing (0 failures).
69. **Q: What does `tests/critical-regressions-audit.test.ts` verify?**  
    *A*: Exact video destination links (no generic channel pages), NCERT reading materials, and quiz answer key isolation.
70. **Q: What does `deletionRegistry.ts` do?**  
    *A*: Tracks deleted course/quiz IDs in PostgreSQL marker rows and memory sets to prevent deleted items from reappearing on refresh.
71. **Q: What does `scripts/check-supabase-db.ts` test?**  
    *A*: Live Supabase database connectivity, table schema existence, and migration state.

---

### Category 13: System Design & Scalability (Cards 72–75)
72. **Q: How would you scale Pencill to support 100,000 daily active users?**  
    *A*: Replace in-memory Maps with a distributed Redis cluster (Upstash) and offload discovery to background worker queues (BullMQ).
73. **Q: Why did Pencill implement Circuit Breakers?**  
    *A*: To prevent cascading failures and avoid wasting execution time when external APIs (YouTube, Google Search) hit quotas.
74. **Q: What is the purpose of `data/enrollments.json`?**  
    *A*: A server-side file store acting as Tier B fallback to prevent enrollment data loss during local offline development.
75. **Q: How does `migrateGuestDataToUser()` work?**  
    *A*: When a guest signs up, it batch-upserts their offline progress, notes, and quiz attempts from `localStorage` into PostgreSQL.
