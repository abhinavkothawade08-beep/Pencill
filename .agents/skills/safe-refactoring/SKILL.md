---
name: safe-refactoring
description: >-
  Execute safe, atomic multi-file refactorings, symbol renames, and structural reorganizations with zero regression. Use when renaming widely used functions, restructuring directories, or changing interfaces.
---

# Safe Multi-File Refactoring & Symbol Renaming

> **Category**: Deep System Verification, Safety & Acceptance  
> **Specialist Subagent**: `code-reviewer`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Perform complex multi-file refactoring operations safely and cleanly.**: Perform complex multi-file refactoring operations safely and cleanly.
2. **Ensure 100% of call sites, imports, and type references are updated atomically.**: Ensure 100% of call sites, imports, and type references are updated atomically.
3. **Guarantee zero behavioral regressions throughout the refactoring lifecycle.**: Guarantee zero behavioral regressions throughout the refactoring lifecycle.

---

## 2. Standard Operating Procedures (SOP)

1. Establish pre-refactoring test baseline: run test suite and verify 100% pass rate.
2. Apply refactoring across all affected files atomically: rename symbol, adjust imports, update types.
3. Run TypeScript compiler 'npx tsc --noEmit' to catch any missed call sites or broken references.
4. Run full test suite 'npm test' to verify behavioral preservation.
5. Commit refactoring changeset as a single atomic git commit with descriptive message.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npx tsc --noEmit
npm test
git diff --stat
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never perform multi-file search-and-replace using naive regex without compiler verification.
- **Guard**: Never combine structural refactoring with new functional feature logic in the same commit.
- **Guard**: Ensure git status is reviewed thoroughly before staging multi-file changes.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify 'npx tsc --noEmit' reports 0 errors across the entire codebase.
- [ ] Verify 100% of automated tests pass without modifying pre-existing assertions.
- [ ] Verify application runtime behaves identically to pre-refactoring state.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `code-reviewer`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
