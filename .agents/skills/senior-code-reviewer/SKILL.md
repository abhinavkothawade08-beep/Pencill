---
name: senior-code-reviewer
description: >-
  Perform comprehensive senior-level code reviews evaluating maintainability, design patterns, DRY/KISS/YAGNI principles, and technical debt. Use before merging complex features or refactors.
---

# Senior Architectural Code Review & Clean Code Enforcement

> **Category**: Code Review, Audit & Quality Assurance  
> **Specialist Subagent**: `code-reviewer`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Enforce high software engineering standards**: readability, maintainability, and clean architecture.
2. **Guard against over-engineering, speculative abstractions, and dead code.**: Guard against over-engineering, speculative abstractions, and dead code.
3. **Ensure proper error handling, logging, and documentation across all modified components.**: Ensure proper error handling, logging, and documentation across all modified components.

---

## 2. Standard Operating Procedures (SOP)

1. Review the full changeset in context of the existing system architecture.
2. Evaluate cohesion and coupling: ensure components maintain single responsibility.
3. Check naming conventions: verify variable, function, and file names clearly convey intent.
4. Identify over-engineered abstractions; suggest simpler native or stdlib alternatives.
5. Verify documentation integrity: ensure docstrings, comments, and READMEs reflect changes.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
git diff --stat origin/main
npm run lint
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Avoid approving code with dead functions, unused imports, or speculative future-proofing.
- **Guard**: Ensure no temporary debugging statements (console.log, debugger) remain in production files.
- **Guard**: Never permit breaking architectural changes without an accompanying ADR or plan.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify code adheres to project idioms and clean code principles.
- [ ] Verify zero dead code or unused variables remain in the diff.
- [ ] Verify reviewer checklist is fully satisfied before merge sign-off.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `code-reviewer`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
