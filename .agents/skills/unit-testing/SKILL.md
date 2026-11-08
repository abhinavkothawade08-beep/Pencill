---
name: unit-testing
description: >-
  Write hermetic, isolated unit tests for pure functions, data transformers, mathematical calculations, and business rules. Use when implementing service functions, algorithmic engines, or utility modules.
---

# Isolated Unit Testing & Boundary Analysis

> **Category**: Automated Testing & Verification QA  
> **Specialist Subagent**: `qa-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Achieve comprehensive test coverage for pure logic and utility functions.**: Achieve comprehensive test coverage for pure logic and utility functions.
2. **Test boundary conditions**: zero, negative, maximum, empty arrays, null, undefined.
3. **Guarantee deterministic, microsecond execution speeds for fast developer feedback.**: Guarantee deterministic, microsecond execution speeds for fast developer feedback.

---

## 2. Standard Operating Procedures (SOP)

1. Identify the target function's input domain, output codomain, and invariants.
2. Write unit tests structuring test cases with Arrange-Act-Assert (AAA) pattern.
3. Cover nominal happy paths, boundary edges, and deliberate error scenarios.
4. Assert on exact return values, immutability of inputs, and thrown exception types.
5. Execute using Node native test runner (node:test) or Jest/Vitest.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npx tsx --test tests/unit/*.test.ts
npm test
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never introduce external network or database calls in unit tests.
- **Guard**: Avoid testing trivial implementation details; assert on observable public behavior.
- **Guard**: Never share mutable state between parallel unit test specs.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify 100% of unit test assertions pass.
- [ ] Verify execution speed is sub-second for the entire unit test suite.
- [ ] Verify boundary condition coverage includes null, empty, and maximum bounds.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `qa-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
