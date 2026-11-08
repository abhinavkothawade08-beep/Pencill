---
name: runtime-error-detection
description: >-
  Detect, catch, and handle unhandled promise rejections, null/undefined dereferences, React hydration mismatches, and async exceptions. Use when debugging crashed processes, browser console errors, or unstable background workers.
---

# Runtime Error Detection & Exception Handling

> **Category**: Automated Debugging & Root Cause Analysis  
> **Specialist Subagent**: `backend-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Intercept all uncaught exceptions, unhandled rejections, and fatal runtime crashes.**: Intercept all uncaught exceptions, unhandled rejections, and fatal runtime crashes.
2. **Enforce defensive optional chaining (?.) and nullish coalescing (??) at untrusted boundaries.**: Enforce defensive optional chaining (?.) and nullish coalescing (??) at untrusted boundaries.
3. **Implement robust error boundaries and graceful fallback mechanisms.**: Implement robust error boundaries and graceful fallback mechanisms.

---

## 2. Standard Operating Procedures (SOP)

1. Audit call sites interacting with dynamic data or external APIs for unhandled null/undefined.
2. Introduce global unhandledRejection and uncaughtException handlers in server runtimes.
3. Implement React ErrorBoundary components wrapping route segments and interactive widgets.
4. Sanitize error payloads to prevent sensitive credential or internal schema leakage.
5. Verify runtime recovers gracefully without leaving user in a broken or frozen state.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
node -e "process.on('unhandledRejection', (r) => { console.error(r); process.exit(1); });"
npm test
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never allow an unhandled promise rejection to terminate the Node.js server process.
- **Guard**: Never expose database connection strings, auth tokens, or internal stack traces to users.
- **Guard**: Avoid catch blocks that swallow errors silently without logging or notifying the user.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify test suite contains test cases simulating null/undefined API responses.
- [ ] Verify error boundaries render actionable recovery UI with retry capabilities.
- [ ] Verify zero unhandled rejections during test suite execution.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `backend-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
