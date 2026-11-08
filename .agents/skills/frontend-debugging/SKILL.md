---
name: frontend-debugging
description: >-
  Diagnose and fix complex frontend bugs including React hydration mismatches, state synchronization drifts, stale closures, and CSS layout glitches. Use when frontend components misbehave or crash in the browser.
---

# Frontend State, DOM & Hydration Debugging

> **Category**: Frontend, UI/UX, DevTools & Performance  
> **Specialist Subagent**: `frontend-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Isolate and resolve React hydration mismatches between SSR HTML and client DOM.**: Isolate and resolve React hydration mismatches between SSR HTML and client DOM.
2. **Debug component state management, hook dependency arrays, and stale closures.**: Debug component state management, hook dependency arrays, and stale closures.
3. **Fix CSS rendering bugs**: flexbox/grid overflows, z-index stacking collisions, and responsive breaks.

---

## 2. Standard Operating Procedures (SOP)

1. Reproduce the frontend defect in a browser session and capture console warning traces.
2. For hydration bugs: identify discrepancies in window-dependent data, dates, or random IDs between server and client.
3. For state bugs: trace state updates through React components and custom hooks to identify race conditions.
4. For layout bugs: inspect computed box model metrics (margin, padding, border, overflow) in DevTools.
5. Implement the fix and verify that both SSR and client rendering produce identical DOM trees.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npm run dev
npx tsc --noEmit
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never suppress hydration errors with 'suppressHydrationWarning' unless intentionally rendering client-only timestamps.
- **Guard**: Never modify state directly (mutate state in place); always use immutable updater patterns.
- **Guard**: Avoid broad CSS overrides (!important) that break design system cascade rules.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify zero hydration warnings in browser console during page reload.
- [ ] Verify component state correctly reflects user interactions and API responses.
- [ ] Verify layout renders flawlessly across mobile, tablet, and desktop viewports.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `frontend-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
