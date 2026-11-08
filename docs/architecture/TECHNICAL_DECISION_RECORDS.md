# Pencill — Technical Decision Records (TDRs)

This document formalizes the key architectural, engineering, and security decisions made in the Pencill codebase.

---

## TDR-001: Adoption of Next.js 14 App Router and React 18

### Context
Pencill requires both fast initial page loads for educational content (SEO, server-rendered curricula) and rich interactive client states (quiz engine, dynamic builders, interactive code runners).

### Decision
We adopted Next.js 14 App Router with React 18:
- Layout and page wrappers default to Server Components to minimize client bundle footprints.
- Interactive widgets (quiz engine, path builder, markdown viewer) use `"use client"` at component boundaries.
- API endpoints are structured as Web-standard Route Handlers (`src/app/api/**/route.ts`).

### Consequences
- **Positive**: Zero initial hydration penalty for static syllabus views; cohesive full-stack TypeScript codebase.
- **Trade-off**: Requires strict discipline regarding server/client boundaries and preventing server-only utilities from leaking into client bundles.

---

## TDR-002: Dual-Persistence Architecture with Synchronized Deletion Registry

### Context
Learners expect instant UI interactions without waiting for database round-trips, including the ability to study offline or across intermittent network connections. However, simple caching frequently causes "zombie records" where deleted items resurrect when querying the remote database.

### Decision
We implemented a Dual-Persistence architecture:
1. **Cloud Source of Truth**: Supabase PostgreSQL tables storing all user records.
2. **Client-Side Cache**: Local/session storage providing immediate UI rendering.
3. **Persistent Deletion Registry**: A dedicated client-side tombstone registry (`src/services/supabase/deletionRegistry.ts`) that records deleted course and quiz IDs.

### Consequences
- **Positive**: Instant UI responsiveness, offline tolerance, and complete elimination of resurrected zombie items.
- **Trade-off**: Requires careful cache invalidation logic across service methods.

---

## TDR-003: Zero Service-Role Key Rule & Strict Row Level Security

### Context
Multi-tenant security in educational applications is critical. Learners must never be able to read or mutate another student's notes, progress, or quiz attempts.

### Decision
- The Supabase Service Role Key (`SUPABASE_SERVICE_ROLE_KEY`) is strictly forbidden in client-side code and is omitted from public environment variables.
- All client queries use `NEXT_PUBLIC_SUPABASE_ANON_KEY` accompanied by the user's JWT session.
- PostgreSQL Row Level Security (RLS) is enabled and enforced across all 22 database tables with `auth.uid() = user_id` policies.

### Consequences
- **Positive**: Defense-in-depth security. Even if client-side code were tampered with, the PostgreSQL database blocks unauthorized cross-tenant queries.
- **Trade-off**: Server-side tasks requiring administrative privileges must run strictly in authenticated server contexts.

---

## TDR-004: Resource Engine v2 with Heuristic Scoring and Master Educator Directory

### Context
Unfiltered searches against YouTube or search engines frequently return clickbait, low-quality, or hallucinated video recommendations that lack pedagogical rigor.

### Decision
We engineered **Resource Engine v2**:
1. Grounded against `docs/MASTER_YOUTUBE_EDUCATOR_DIRECTORY.md` containing 60+ verified academic channels (MIT OCW, Khan Academy, 3Blue1Brown, Physics Wallah, CS Dojo).
2. Uses mathematical composite scoring:
   $$S = 0.35 \cdot R + 0.25 \cdot E + 0.20 \cdot D + 0.20 \cdot C$$
   combining relevance ($R$), educator authority ($E$), duration suitability ($D$), and chapter availability ($C$).
3. Strictly validates video IDs and destination URLs to prevent broken link generation.

### Consequences
- **Positive**: High-quality, reliable, academically verified video curricula.
- **Trade-off**: Requires maintaining the verified educator directory when new reputable academic creators emerge.

---

## TDR-005: Authoritative Server-Side Quiz Scoring and Answer Key Redaction

### Context
Delivering complete quiz objects (including the correct option index and explanations) directly to the browser allows learners to inspect DOM state or network payloads to cheat on assessments.

### Decision
1. When generating or retrieving a quiz for a student, the server redacts `correctAnswerIndex` and `explanation` from the returned payload.
2. When the student submits answers via `POST /api/quizzes/[id]/submit`, scoring is performed authoritatively on the server.
3. The server computes the score, records the `quiz_attempts` row, and returns the graded evaluation and explanations.

### Consequences
- **Positive**: Tamper-proof academic integrity and trustworthy progress milestones.
- **Trade-off**: Submissions require an active API request to receive a final score.

---

## TDR-006: Gemini Structured Output with Resilient Deterministic Fallback

### Context
LLMs can occasionally suffer from rate-limits (HTTP 429), temporary outages, or schema invalidity when outputting large curriculum JSON payloads.

### Decision
1. We use Google Gemini API with constrained JSON generation contracts validated against Zod schemas (`api-schemas.ts`).
2. We pair the AI generator with `curriculum-adaptive-engine.ts`, a deterministic curriculum generator that synthesizes cohesive, topic-adaptive modules if the Gemini API fails or is unconfigured.

### Consequences
- **Positive**: Zero application crashes during AI downtime; guaranteed user path synthesis.
- **Trade-off**: Fallback curricula lack bespoke LLM customization, but retain full topic accuracy and module progression.

---

## TDR-007: Native Node.js Test Runner with `tsx` over Jest / Vitest

### Context
Modern Next.js and TypeScript setups often experience friction with Jest (Babel/SWC transpilation inconsistencies, ESM/CJS module conflicts) or Vitest version churn.

### Decision
We adopted the native Node.js test runner (`node:test`, `node:assert/strict`) executed directly through `tsx`:
```bash
npx tsx --test --test-concurrency=1 tests/**/*.test.ts
```

### Consequences
- **Positive**: Ultra-fast test execution (~26s for 319+ tests), zero third-party configuration files, native TypeScript execution, and zero dependency rot.
- **Trade-off**: Relies on standard Node.js assertions rather than matchers from Chai/Jest.
