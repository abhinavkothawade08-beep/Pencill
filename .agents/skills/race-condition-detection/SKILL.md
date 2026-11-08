---
name: race-condition-detection
description: >-
  Detect and eliminate asynchronous race conditions, out-of-order promise resolutions, and database concurrent write hazards. Use when debugging rapid user clicks, search debouncing, or concurrent mutations.
---

# Async Concurrency & Race Condition Detection

> **Category**: Deep System Verification, Safety & Acceptance  
> **Specialist Subagent**: `backend-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Eliminate race conditions where asynchronous responses resolve in arbitrary order.**: Eliminate race conditions where asynchronous responses resolve in arbitrary order.
2. **Implement AbortController request cancellation for search inputs and typeaheads.**: Implement AbortController request cancellation for search inputs and typeaheads.
3. **Ensure database transactions use optimistic locking or atomic updates to prevent lost updates.**: Ensure database transactions use optimistic locking or atomic updates to prevent lost updates.

---

## 2. Standard Operating Procedures (SOP)

1. Inspect asynchronous event handlers for missing cancellation logic (AbortController / signal).
2. Add debounce wrappers (300ms) on high-frequency search and auto-save inputs.
3. In database services, use atomic increment / conditional WHERE clauses (version = previous_version).
4. Simulate high-concurrency race condition test cases: fire 10 simultaneous mutations.
5. Verify that system state converges to correct final value without lost writes or corruptions.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npm test -- tests/concurrency-*.test.ts
npx tsx scripts/verify-builder-flow.js
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never ignore outdated responses from previous search queries; always check AbortSignal.aborted.
- **Guard**: Avoid read-modify-write patterns without database transaction locks or atomic SQL operations.
- **Guard**: Never disable debouncing on auto-saving inputs.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify out-of-order API responses are cleanly discarded without overwriting newer state.
- [ ] Verify concurrent database writes maintain strict serializability and data integrity.
- [ ] Verify automated concurrency test suites pass 100% across multiple iterations.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `backend-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
