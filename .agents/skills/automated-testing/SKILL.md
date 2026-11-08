---
name: automated-testing
description: >-
  Design and orchestrate balanced automated test strategies combining unit, integration, and end-to-end tests across the entire test pyramid. Use when establishing testing frameworks or expanding test coverage.
---

# Automated Testing Strategy & Test Pyramid Calibration

> **Category**: Automated Testing & Verification QA  
> **Specialist Subagent**: `qa-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Implement a balanced test pyramid (heavy unit foundation, focused integration, targeted E2E).**: Implement a balanced test pyramid (heavy unit foundation, focused integration, targeted E2E).
2. **Maximize regression detection while maintaining fast developer feedback loops.**: Maximize regression detection while maintaining fast developer feedback loops.
3. **Establish automated CI test execution gates with zero tolerance for flaky tests.**: Establish automated CI test execution gates with zero tolerance for flaky tests.

---

## 2. Standard Operating Procedures (SOP)

1. Audit current test coverage and identify critical untested paths across services and routes.
2. Design unit tests for pure domain functions and algorithmic logic in tests/.
3. Design integration tests for API routes and database service boundaries in tests/.
4. Design browser E2E tests for core user conversion and auth journeys.
5. Organize test runners to execute fast unit suites first, followed by heavier suites.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npm test
npx tsx --test tests/**/*.test.ts
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never write flaky tests dependent on unseeded random data or uncontrolled timers.
- **Guard**: Avoid heavy E2E tests for simple business logic better tested in unit tests.
- **Guard**: Never mock what you don't own without verifying the real contract.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify test suite completes within target duration budget.
- [ ] Verify 100% of test suites pass deterministically across consecutive runs.
- [ ] Verify all critical user paths have corresponding test assertions.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `qa-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
