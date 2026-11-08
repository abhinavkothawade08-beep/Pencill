---
name: performance-code-review
description: >-
  Audit code changes for algorithmic inefficiency, React re-render loops, N+1 query patterns, and bundle bloat. Use when reviewing data-heavy components, search engines, or database queries.
---

# Performance Code Review & Complexity Audit

> **Category**: Code Review, Audit & Quality Assurance  
> **Specialist Subagent**: `performance-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Eliminate algorithmic inefficiencies**: O(n^2) operations, redundant loops, and expensive re-computations.
2. **Detect and fix React performance pitfalls**: excessive re-renders, missing memoization, un-virtualized lists.
3. **Prevent N+1 database queries via bulk fetching and proper index utilization.**: Prevent N+1 database queries via bulk fetching and proper index utilization.

---

## 2. Standard Operating Procedures (SOP)

1. Inspect algorithms for time and space complexity; replace nested loops with Map / Set lookups (O(1)).
2. Review React component hooks: verify dependency arrays for useMemo and useCallback.
3. Audit database query patterns: ensure related records are fetched in single JOINs or batch IN queries.
4. Inspect imported packages: verify tree-shaking support and avoid heavy dependencies for simple tasks.
5. Review image and asset usage: ensure responsive sizing, modern formats (WebP/AVIF), and lazy loading.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npx @next/bundle-analyzer
npm test
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Avoid premature optimization that severely impairs code readability without measured benefit.
- **Guard**: Never introduce un-memoized heavy calculations inside render loops.
- **Guard**: Avoid unbounded database queries without pagination or LIMIT clauses.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify algorithmic time complexity is optimized to optimal bounds (O(n) or O(1)).
- [ ] Verify database queries avoid N+1 anti-patterns.
- [ ] Verify client bundle size does not increase beyond budget thresholds.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `performance-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
