---
name: code-quality-auditor
description: >-
  Run and enforce static analysis tools, ESLint rules, Prettier formatting, and complexity analyzers across the repository. Use when performing repo-wide quality sweeps or pre-commit checks.
---

# Automated Code Quality & Static Analysis Auditing

> **Category**: Code Review, Audit & Quality Assurance  
> **Specialist Subagent**: `code-reviewer`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Enforce repository-wide code quality, formatting, and static analysis standards.**: Enforce repository-wide code quality, formatting, and static analysis standards.
2. **Identify and eliminate dead code, unused dependencies, and duplicate logic.**: Identify and eliminate dead code, unused dependencies, and duplicate logic.
3. **Ensure zero ESLint warnings and zero formatting inconsistencies across all files.**: Ensure zero ESLint warnings and zero formatting inconsistencies across all files.

---

## 2. Standard Operating Procedures (SOP)

1. Execute repository linting using 'npm run lint' to detect syntax and style violations.
2. Run TypeScript static type checks using 'npx tsc --noEmit'.
3. Scan for dead code and unused exports using ts-prune or knip.
4. Surgically format modified files following repository Prettier configurations.
5. Enforce consistent export patterns (named vs default) and file naming conventions.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npm run lint
npx tsc --noEmit
npx knip
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never disable ESLint rules globally in .eslintrc.json to silence inconvenient warnings.
- **Guard**: Never reformat entire files unrelated to current changes (avoids dirty git diffs).
- **Guard**: Avoid committing trailing whitespace or inconsistent line endings (CRLF vs LF).

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify 'npm run lint' exits with code 0 and 0 warnings.
- [ ] Verify 'npx tsc --noEmit' exits with code 0 and 0 errors.
- [ ] Verify repository adheres to unified code formatting.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `code-reviewer`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
