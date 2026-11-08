---
name: technical-debt-manager
description: >-
  Identify, quantify, track, and remediate technical debt, deprecated patterns, and architectural shortcuts. Use when auditing code smells, scheduling refactors, or prioritizing maintenance.
---

# Technical Debt Tracking & Refactoring Roadmaps

> **Category**: Technical Documentation, Product & Repository Ops  
> **Specialist Subagent**: `code-reviewer`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Maintain a living Technical Debt Ledger documenting known shortcuts and architectural debt.**: Maintain a living Technical Debt Ledger documenting known shortcuts and architectural debt.
2. **Quantify technical debt impact**: maintenance friction, performance drag, bug recurrence.
3. **Prioritize and execute targeted refactoring sprints alongside feature development.**: Prioritize and execute targeted refactoring sprints alongside feature development.

---

## 2. Standard Operating Procedures (SOP)

1. Scan codebase for TODO, FIXME, deprecated methods, and high-complexity files.
2. Log findings in docs/TECHNICAL_DEBT.md with Location, Category, Impact, and Remediation Plan.
3. Score debt items using an Impact vs Effort matrix (High/Medium/Low).
4. Schedule high-impact debt remediation into planned engineering cycles.
5. Verify remediation resolves the underlying technical debt without introducing regressions.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
git grep -iE "(TODO|FIXME|HACK|DEPRECATED)"
npm test
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never leave untracked temporary hacks in code; always log to the debt ledger.
- **Guard**: Do not perform massive unverified refactorings that jeopardize system stability.
- **Guard**: Ensure removed shortcuts are backed by proper permanent implementations.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify remediated debt items are closed with verified test coverage.
- [ ] Verify code complexity metrics improve following debt reduction.
- [ ] Verify full regression test suite passes after refactoring.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `code-reviewer`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
