---
name: react-nextjs-expert
description: >-
  Develop high-performance React 18 applications using Next.js App Router, Server Components, Client Components, Suspense boundaries, and Server Actions. Use when building UI routes, optimizing client bundles, or debugging hydration.
---

# React 18 & Next.js App Router Mastery

> **Category**: Core Full-Stack & Software Architecture  
> **Specialist Subagent**: `frontend-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Master Next.js 14 App Router patterns (layout.tsx, page.tsx, loading.tsx, error.tsx).**: Master Next.js 14 App Router patterns (layout.tsx, page.tsx, loading.tsx, error.tsx).
2. **Enforce proper client-server boundaries ('use client' only when state or DOM hooks are required).**: Enforce proper client-server boundaries ('use client' only when state or DOM hooks are required).
3. **Implement streaming SSR with React Suspense for instant perceived loading.**: Implement streaming SSR with React Suspense for instant perceived loading.

---

## 2. Standard Operating Procedures (SOP)

1. Default all components to React Server Components (RSC) to minimize client bundle footprint.
2. Isolate interactive leaves into focused Client Components marked with 'use client'.
3. Wrap asynchronous server components and dynamic data-fetching in <Suspense fallback={<Skeleton />}>.
4. Leverage Next.js route handlers (app/api/**/route.ts) for secure server-side logic.
5. Implement route error boundaries (error.tsx) with user-friendly recovery buttons.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npx next build
npx next lint
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never mark root or layout components with 'use client' unnecessarily.
- **Guard**: Never import server-only modules (fs, database clients) into client components.
- **Guard**: Avoid cascading useEffect waterfalls on the client when data can be fetched on the server.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify Next.js build succeeds with static/dynamic route categorization intact.
- [ ] Verify zero client-side hydration mismatch warnings.
- [ ] Verify page load performance meets Core Web Vitals thresholds.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `frontend-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
