# Pencill — Testing, Debugging & Code Quality Guide

> **Test Runner**: Node.js Native Test Runner (`node:test`, `node:assert/strict`)  
> **TypeScript Executor**: `tsx` (`npx tsx --test tests/**/*.test.ts`)  
> **Suite Status**: 472 passing tests across 139 test suites (0 failures, ~13s execution time).

---

## 1. Test Architecture & Verification Matrix

Pencill relies on Node.js 18+ native test runner rather than third-party frameworks like Jest or Vitest. This eliminates complex transpilation layers and Babel configuration while executing in strict TypeScript via `tsx`.

### 1.1 Test Suite Breakdown

| Test Suite File | Test Count | Key Areas Verified |
| :--- | :--- | :--- |
| [`tests/critical-regressions-audit.test.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/tests/critical-regressions-audit.test.ts) | 24 | Exact video destination URLs (no generic channels), NCERT reading materials, quiz answer key isolation. |
| [`tests/batch-deletion.test.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/tests/batch-deletion.test.ts) | 18 | Batch deletion Zod schemas, role-based authorization (admin vs author vs stranger), registry recording. |
| [`tests/deletion-persistence.test.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/tests/deletion-persistence.test.ts) | 8 | Permanent exclusion of deleted courses/quizzes across simulated browser reloads (`F5`). |
| [`tests/course-enrollment-persistence.test.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/tests/course-enrollment-persistence.test.ts) | 12 | Multi-tier enrollment persistence across localStorage, server JSON store, and Supabase. |
| [`tests/academic-integrity-and-enrollments.test.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/tests/academic-integrity-and-enrollments.test.ts) | 6 | MIT OCW and NPTEL course payload normalization and canonical institutional attribution. |
| [`tests/resource-engine.test.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/tests/resource-engine.test.ts) | 35 | Quality scoring weights, duration suitability calibration, duplicate pruning, and chapter extraction. |
| [`tests/resource-engine-v2/` (11 test suites)](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/tests/resource-engine-v2) | 180+ | Comprehensive tests for `orchestrator`, `objective-analyzer`, `search-planner`, `youtube-adapter`, `normalization`, `evaluation`, `distribution`, `resilience`. |

---

## 2. What Is and Is Not Verified by the Automated Tests

### What the Test Suite Genuinely Proves:
* **Algorithmic Determinism**: Mathematical ranking equations, composite scoring formulas, and duration suitability penalties execute correctly.
* **Schema Contract Integrity**: All API inputs and outputs strictly validate against Zod schemas (`api-schemas.ts`).
* **URL Normalization**: YouTube URLs, playlist parameters, and video IDs are sanitized and canonicalized.
* **Exclusion Invariants**: The `deletionRegistry` reliably filters deleted records from catalog queries.
* **Access Control**: Authorization rules in `permissions.ts` correctly block students from deleting catalog tracks.

### What the Test Suite Does NOT Prove:
* **Live Network Availability**: A passing test suite uses mocked or cached responses for third-party providers; it does not guarantee that Google Gemini is not experiencing temporary 503 spikes in production.
* **Third-Party Quota State**: Does not verify whether your local `YOUTUBE_API_KEY` has exceeded its 10,000 units/day quota.
* **Database Connection Health**: Does not verify whether your hosted Supabase instance has active network connectivity or pending migrations.

---

## 3. Running Verification & Quality Checks

### 3.1 Run Unit & Integration Tests
```bash
npm test
```
*Expected Output*:
```
ℹ tests 472
ℹ suites 139
ℹ pass 472
ℹ fail 0
ℹ duration_ms 13255.7772
```

### 3.2 Run TypeScript Type Checking
```bash
npx tsc --noEmit
```
*Expected Output*: Exit code 0 with zero errors.

### 3.3 Run ESLint Code Quality Checks
```bash
npm run lint
```
*Expected Output*: `✔ No ESLint warnings or errors`.

### 3.4 Run Production Build
```bash
npm run build
```
*Expected Output*:
```
✓ Compiled successfully
✓ Linting and checking validity of types ...
✓ Generating static pages (25/25)
✓ Finalizing page optimization ...
```

---

## 4. Practical Debugging Guide & Common Scenarios

### Scenario A: Gemini API 503 (High Demand / Spikes)
* **Symptom**: Console outputs `[GeminiClient] Model "gemini-3.8-flash" failed (503): This model is currently experiencing high demand.`
* **Diagnosis**: Google AI Studio experiences temporary demand spikes on flash models.
* **What the Code Does**:
  1. [`src/services/ai/gemini/client.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/services/ai/gemini/client.ts#L76-L84) automatically catches the 503 error.
  2. Iterates to the next candidate model (`gemini-3.5-flash`).
  3. If all cloud models fail, [`discover/route.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/app/api/resources/discover/route.ts#L217-L227) falls back to `createTopicAdaptiveCurriculum()`.
* **Debugging Verification**: Run `node scripts/test-gemini.mjs` to observe the fallback model cascade in isolation.

---

### Scenario B: YouTube Data API Quota Exhaustion (HTTP 403)
* **Symptom**: Console outputs `[YouTubeProvider] Circuit breaker tripped: YouTube API quota exhausted. Cooling down for 60s.`
* **Diagnosis**: Google Cloud limits free YouTube Data API v3 projects to 10,000 units/day. Each search costs 100 units (100 searches max per day).
* **What the Code Does**:
  1. [`src/lib/resource-engine-v2/providers/youtube-adapter.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/lib/resource-engine-v2/providers/youtube-adapter.ts) catches HTTP 403 `quotaExceeded`.
  2. Trips the internal `CircuitBreaker` for 60 seconds.
  3. Subsequent searches bypass YouTube API and immediately serve verified courses from the Master Educator Directory (`master-dataset.ts`).
* **Debugging Verification**: Inspect `youtube-circuit-breaker-and-filtering.test.ts`.

---

### Scenario C: Deleted Course Reappearing After Reload
* **Symptom**: A deleted course vanishes from UI but reappears when pressing F5.
* **Diagnosis**: The deletion only happened in client component React state, but was not registered in the persistent exclusion registry.
* **Fix**: Ensure that the deletion handler calls `recordDeletedItem('learning_path', courseId)` from [`deletionRegistry.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/services/supabase/deletionRegistry.ts).

---

### Scenario D: Missing Table in Schema Cache (`public.courses`)
* **Symptom**: Supabase query returns `Could not find the table 'public.courses' in the schema cache`.
* **Diagnosis**: The database table is officially named `public.learning_paths` in migration [`20260921000000_pencill_core_schema.sql`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/supabase/migrations/20260921000000_pencill_core_schema.sql).
* **Fix**: Update the query to `.from("learning_paths")`.
