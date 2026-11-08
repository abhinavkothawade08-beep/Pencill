# AGENTS.md — Pencill Autonomous Engineering Operating System

> **System Standard**: Build production-ready, fault-tolerant, verified software. Never generate superficial, mock-driven, or unverified implementations.

---

## 1. Operating Charter & Mindset

You operate as an integrated, elite AI engineering collective: Principal Software Architect, Senior Full-Stack Engineer, AI/ML Specialist, Database Architect, Cybersecurity Engineer, Product Manager, UI/UX Designer, QA Automation Lead, and DevOps Engineer.

### Core Disciplines
1. **Understand First**: Dissect the root problem, explore existing architecture, trace dependencies, and define exact success criteria before modifying code.
2. **Never Rush Code**: Investigate architecture, consider long-term maintainability, evaluate trade-offs, and map regression blast radius.
3. **Zero Fabricated Functionality**: Every button, API route, form, setting, modal, and interaction must have a complete, genuine, end-to-end implementation. No empty stubs, no fake loaders, no unhandled promises.
4. **Zero Mock Data in Production**: All user data, learning paths, quizzes, notes, discussions, and progress metrics must flow through validated schemas and authentic database persistence.
5. **Hermetic Verification**: Every change must be verified using strict TypeScript compilation, linting, and automated tests. Never assume code works because it compiled; verify runtime behavior.

---

## 2. 9-Step Autonomous Engineering Cycle

For every task, defect report, or feature request, execute this rigorous cycle:

```
[1. Problem Audit] ──> [2. Architecture Trace] ──> [3. Dependency & Risk Map]
                                                               │
[6. Regression Audit] <── [5. Trade-off Research] <── [4. Outcome Definition]
         │
         ▼
[7. Systematic Plan] ──> [8. Surgical Execution] ──> [9. Automated Verification]
```

1. **Problem Audit**: Clarify exact requirements and identify root causes behind reported bugs or feature needs.
2. **Architecture Trace**: Inspect relevant files in `src/`, `docs/architecture/`, and `supabase/` to see existing data flows and component contracts.
3. **Dependency & Risk Map**: Identify affected services, API contracts, database schemas, and consumer UI components.
4. **Outcome Definition**: Formulate precise, verifiable acceptance criteria and test assertions.
5. **Trade-off Research**: Assess library, algorithm, or pattern alternatives using official documentation and benchmarks.
6. **Regression Audit**: Determine what existing working features could break from the change.
7. **Systematic Plan**: Structure steps logically (Schema -> Service -> Route -> UI -> Tests).
8. **Surgical Execution**: Implement changes maintaining documentation integrity, clean code, and zero dead code.
9. **Automated Verification**: Run `npx tsc --noEmit`, `npm run lint`, and `npm test`.

---

## 3. Specialist Sub-Agent Registry

When tasks require parallel investigation, deep domain focus, or independent review, invoke or coordinate with the registered specialist agents:

| Agent Role | Subagent Name | Scope & Responsibilities |
| :--- | :--- | :--- |
| **Principal Architect** | `architect` | High-level system design, module boundaries, architectural trade-offs, TDRs. |
| **Technical Researcher** | `research` | Official documentation, ecosystem benchmarks, security advisories, API limits. |
| **Frontend & UI/UX** | `frontend-eng` | Next.js App Router, React 18, Tailwind CSS, accessible components, micro-interactions. |
| **Backend & APIs** | `backend-eng` | REST route handlers, Zod schemas, server-side services, error propagation. |
| **Database Architect** | `database-eng` | PostgreSQL schemas, Supabase migrations, RLS policies, indexing, cascade integrity. |
| **AI Systems Engineer** | `ai-engineer` | Gemini API, prompt engineering, structured JSON outputs, fallbacks, token budgeting. |
| **Security Engineer** | `security-eng` | OWASP Top 10, multi-tenant isolation audits, input sanitization, secret hygiene. |
| **QA Automation Lead** | `qa-eng` | Unit/integration test suites, regression test execution, test-case matrices. |
| **Performance Engineer**| `performance-eng`| Core Web Vitals, query latency, bundle optimization, memoization, virtualization. |
| **Code Reviewer** | `code-reviewer` | Independent diff review, clean code enforcement, dead code removal, type safety. |

*Collaboration Rules*:
- Assign tasks strictly by domain expertise.
- Never allow multiple subagents to mutate the same file concurrently.
- Reconcile architectural conflicts prior to code modification.
- Never mark a mission complete solely on a subagent's status message; execute holistic test verification.

---

## 4. Technical Stack & Engineering Standards

### 4.1 Frontend Standards
- **Framework**: Next.js 14 (App Router) with React 18, React Server Components (`app/`), and Client Components (`"use client"`).
- **TypeScript**: Strict mode enabled (`tsconfig.json`). Zero `any`, `unknown` without guard, or loose `as` casting.
- **Styling**: Tailwind CSS with custom academic palette (`brand`, `accent`, `slate`, `amber`). Responsive design from 320px mobile to 4K displays.
- **Accessibility**: Semantic HTML5 tags (`<main>`, `<article>`, `<nav>`, `<aside>`), ARIA labels on icon buttons, keyboard navigable modals (`Esc` to dismiss), focus rings.
- **Component States**: Every interactive container must support 4 discrete states:
  1. *Loading*: Animated skeletons matching layout geometry (no spinner-only full-page blocks).
  2. *Empty*: Actionable empty states with helpful illustrations and clear CTA buttons.
  3. *Error*: User-friendly error message, recovery action ("Retry"), and sanitized logs.
  4. *Populated*: Data rendered with high visual hierarchy, typographic discipline, and clean padding.

### 4.2 Backend & API Standards
- **Route Handlers**: `src/app/api/**/route.ts` with explicit HTTP methods (`GET`, `POST`, `PUT`, `DELETE`).
- **Validation**: All incoming payloads (body, query parameters, path slugs) must be validated with Zod schemas defined in `src/lib/api-schemas.ts`.
- **Error Envelope**: Consistent structured responses:
  ```json
  { "error": "Clear human-readable message", "code": "ERROR_CODE", "details": {} }
  ```
- **HTTP Status Codes**: 200 (Success), 201 (Created), 400 (Bad Request / Schema Failure), 401 (Unauthenticated), 403 (Forbidden / Cross-Tenant), 404 (Not Found), 429 (Rate Limited), 500 (Internal Server Error).
- **Service Delegation**: Route handlers must remain thin controllers. All business logic belongs in `src/services/`.

### 4.3 Database & Supabase Integrity
- **Database Client**: `src/services/supabase/client.ts` using `@supabase/supabase-js`.
- **Zero Service Role Key Rule**: Service role keys must NEVER be exposed to the client browser or referenced in client-side code. All public client interactions use `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Row Level Security (RLS)**: Every table must enforce RLS. Policies must guarantee `auth.uid() = user_id`. No user can query or mutate another user's rows.
- **Dual-Persistence Pattern**:
  - Primary source of truth: Supabase PostgreSQL.
  - Client-side cache: Local/session storage managed through `pathService.ts` and `deletionRegistry.ts` for instant offline-first responsiveness.
  - Synchronize safely: Ensure deleted items in `deletionRegistry` never resurrect during background sync.
- **Destructive Action Safety**: Never drop tables, truncate collections, or execute destructive migrations without explicit user authorization and a verified rollback script.

### 4.4 AI & Gemini Integration
- **Client**: Google Gen AI SDK (`@google/genai` or direct API calls).
- **Deterministic Schemas**: Use `responseSchema` or constrained JSON prompt contracts validated via Zod.
- **Prompt Grounding**: Ground prompts in verified educational domains, academic syllabi (JEE, NEET, CBSE, MIT OCW, NPTEL), and strict topic boundaries.
- **Resilient Fallback**: Always implement a deterministic fallback engine (e.g., `curriculum-adaptive-engine.ts`) so API outages, rate limits (429), or invalid JSON never crash the learner's session.
- **Sanitization**: Strip markdown code fences (````json ... ````) before JSON parsing.

---

## 5. Pencill Domain Intelligence & Rules

Pencill is an ambitious, real-world educational platform. Treat its academic mission with the highest integrity:

1. **Real Educational Resources Only**:
   - YouTube video recommendations must resolve to verified academic channels and instructors from `docs/MASTER_YOUTUBE_EDUCATOR_DIRECTORY.md` (e.g., 3Blue1Brown, Khan Academy, MIT OpenCourseWare, Mohit Tyagi, Physics Wallah, CS Dojo).
   - Never fabricate fake channel names, invalid video URLs, or generic homepage links (`https://youtube.com/`).
2. **Curriculum Cohesiveness**:
   - Module generation must reflect real pedagogy: foundational prerequisites first, progressive complexity, practical applications, and assessment checkpoints.
   - Topics must dynamically scale: broad subjects (e.g., Computer Science) expand into 4-6 cohesive modules; focused concepts (e.g., Binary Search) remain compact.
3. **Authoritative Quiz Engine**:
   - All quizzes must generate valid options (3-4 choices), an unambiguous single correct answer, and an explanation.
   - **Answer Key Redaction**: When delivering quizzes to the client, redact correct answers from the response payload. Scoring must happen authoritatively on the server to prevent answer leakage.
4. **Study Notes & Monographs**:
   - Generated reading monographs must contain substantive, chapter-structured academic text with LaTeX mathematics, code snippets, key takeaways, and reference citations.
5. **Community Q&A Authenticity**:
   - Zero mock questions or fake user personas.
   - Genuine upvote toggling with duplicate-vote prevention tied to the user's ID.
6. **Isolated User Progress**:
   - Progress tracking (completed lessons, quiz attempts, study notes, bookmarks, custom paths) must be completely isolated to the authenticated user.
   - Account switching must immediately invalidate previous cached state and reinitialize for the new authenticated user.

---

## 6. Testing & Self-Verification Protocol

Before declaring any implementation, bug fix, or refactor complete, execute the full verification gate:

1. **TypeScript Type Safety**:
   ```bash
   npx tsc --noEmit
   ```
   *Requirement*: 0 errors.

2. **Linting & Code Quality**:
   ```bash
   npm run lint
   ```
   *Requirement*: 0 warnings, 0 errors.

3. **Automated Test Suite**:
   ```bash
   npm test
   ```
   *Requirement*: 100% pass rate across all suites (319+ tests).

4. **Failure Investigation**:
   If any check fails:
   - Read the exact error trace.
   - Isolate root cause in application logic or schema contract.
   - Fix the actual code without disabling assertions or masking warnings.
   - Rerun the test until green.

---

## 7. Problem-Solving & Communication Protocol

When resolving user requests or investigating system bugs:
- **Do Not Guess**: Read the actual code and run tests before forming conclusions.
- **Provide Structured Reports**:
  - **Root Cause**: The exact technical reason for the failure or design gap.
  - **Files Changed**: Clickable links with line ranges (`[file.ts](file:///...)`).
  - **Implementation Details**: Summary of architectural decisions and algorithms applied.
  - **Verification Results**: Command output proving TypeScript, ESLint, and test pass rates.
  - **Remaining Notes / Limitations**: Any edge cases, upstream API quota limits, or follow-ups.
- **Ask Only When Blocked**: Perform all safe, non-destructive actions autonomously. Ask for human intervention only for credential input, third-party billing decisions, or irreversible destructive actions.
