---
name: state-management-debugging
description: >-
  Debug complex client-side state, React Context, localStorage cache synchronization, and stale state bugs. Use when UI state drifts from database truth or components fail to re-render.
---

# Client State Management & Cache Synchronization Debugging

> **Category**: Deep System Verification, Safety & Acceptance  
> **Specialist Subagent**: `frontend-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Ensure seamless synchronization between server database truth and client local cache.**: Ensure seamless synchronization between server database truth and client local cache.
2. **Diagnose and resolve stale closure bugs, duplicate state dispatches, and render loops.**: Diagnose and resolve stale closure bugs, duplicate state dispatches, and render loops.
3. **Maintain offline-first responsiveness without data corruption.**: Maintain offline-first responsiveness without data corruption.

---

## 2. Standard Operating Procedures (SOP)

1. Trace state updates from source action through reducers/hooks to UI component rendering.
2. Audit localStorage cache handlers in pathService.ts and deletionRegistry.ts for synchronization drifts.
3. Inspect hook dependencies: ensure all referenced variables are included in dependency arrays.
4. Implement optimistic UI updates with automated rollback on server mutation failure.
5. Verify that user account switching immediately purges previous user cache state.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npm test -- tests/cache-*.test.ts
npx tsc --noEmit
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never store unsynchronized duplicate copies of identical domain state in multiple components.
- **Guard**: Ensure optimistic UI updates always handle rejection by restoring previous state cleanly.
- **Guard**: Avoid storing sensitive credentials or oversized blobs in browser localStorage.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify client UI updates immediately upon user interaction.
- [ ] Verify server state and client local cache match 100% after network synchronization.
- [ ] Verify zero stale state bugs or infinite re-render loops in test suites.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `frontend-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
