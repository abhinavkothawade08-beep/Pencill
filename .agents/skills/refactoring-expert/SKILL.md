---
name: refactoring-expert
description: >-
  Refactor legacy or high-complexity codebases to improve readability, maintainability, and testability while preserving 100% behavioral equivalence. Use when addressing code smells, decomposing God objects, or extracting reusable services.
---

# Behavior-Preserving Code Refactoring

> **Category**: Core Full-Stack & Software Architecture  
> **Specialist Subagent**: `code-reviewer`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Decompose monolithic functions and bloated components into modular, single-purpose units.**: Decompose monolithic functions and bloated components into modular, single-purpose units.
2. **Eliminate code duplication (DRY) and unnecessary cognitive complexity.**: Eliminate code duplication (DRY) and unnecessary cognitive complexity.
3. **Guarantee behavioral equivalence with pre-existing automated test suites.**: Guarantee behavioral equivalence with pre-existing automated test suites.

---

## 2. Standard Operating Procedures (SOP)

1. Run existing test suite to establish an airtight baseline of system behavior.
2. Identify code smells: high cyclomatic complexity, long methods, duplicate logic, feature envy.
3. Apply Martin Fowler refactoring patterns (Extract Method, Move Function, Replace Conditional with Polymorphism).
4. Verify test suite continuously after every atomic refactoring step.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npm test
npx tsc --noEmit
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never mix functional feature additions with pure refactoring commits.
- **Guard**: Never remove or alter existing tests to match unintentional behavioral shifts.
- **Guard**: Ensure rollback capability by keeping git refactoring commits atomic.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify all 341+ unit and integration tests remain 100% green without modification.
- [ ] Verify cyclomatic complexity and file size are meaningfully reduced.
- [ ] Verify zero runtime regressions in dependent modules.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `code-reviewer`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
