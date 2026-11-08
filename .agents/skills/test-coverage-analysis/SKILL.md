---
name: test-coverage-analysis
description: >-
  Generate and analyze code coverage reports (line, branch, statement, function) to locate untested logic and eliminate blind spots. Use when reviewing pull requests or planning test expansion.
---

# Test Coverage Analysis & Gap Identification

> **Category**: Automated Testing & Verification QA  
> **Specialist Subagent**: `qa-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Measure statement, branch, function, and line coverage across the codebase.**: Measure statement, branch, function, and line coverage across the codebase.
2. **Identify untested conditional branches, error recovery paths, and boundary conditions.**: Identify untested conditional branches, error recovery paths, and boundary conditions.
3. **Enforce minimum coverage thresholds on critical business logic services (> 85%).**: Enforce minimum coverage thresholds on critical business logic services (> 85%).

---

## 2. Standard Operating Procedures (SOP)

1. Execute the test suite with coverage instrumentation (c8 or Node native coverage).
2. Inspect the generated lcov / text summary report to identify low-coverage modules.
3. Analyze uncovered branches: identify missing test cases for error throws or fallback logic.
4. Write targeted test cases to cover identified branch gaps.
5. Verify that coverage metrics increase without writing superficial assertions.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npx c8 --reporter=text npm test
npx c8 --reporter=html npm test
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never prioritize vanity coverage percentage over test quality and meaningful assertions.
- **Guard**: Avoid writing tests that execute code without asserting on observable behavior.
- **Guard**: Do not exclude critical domain services from coverage reporting configurations.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify critical domain services in src/services/ achieve > 85% branch coverage.
- [ ] Verify all error handling branches have corresponding negative test cases.
- [ ] Verify coverage reports are generated cleanly without instrumentation errors.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `qa-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
