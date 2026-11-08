---
name: project-cleanup
description: >-
  Safely remove dead code, unused files, obsolete dependencies, orphan assets, and temporary artifacts while preserving Git history. Use when decluttering repositories or performing spring cleaning.
---

# Repository Hygiene, Dead Code Elimination & Cleanup

> **Category**: Technical Documentation, Product & Repository Ops  
> **Specialist Subagent**: `code-reviewer`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Eliminate dead code, unreferenced components, and obsolete test files safely.**: Eliminate dead code, unreferenced components, and obsolete test files safely.
2. **Purge dangling assets, unused packages, and temporary scratch scripts.**: Purge dangling assets, unused packages, and temporary scratch scripts.
3. **Maintain pristine repository cleanliness and minimal disk footprint.**: Maintain pristine repository cleanliness and minimal disk footprint.

---

## 2. Standard Operating Procedures (SOP)

1. Scan for unused exports and orphaned files using static analysis (knip, ts-prune).
2. Verify zero internal or external references before deleting any file.
3. Remove obsolete dependency packages from package.json and run 'npm install' to clean lockfile.
4. Delete obsolete temporary test scripts or scratch files from repo root.
5. Execute full test suite and TypeScript checks to confirm zero unintended breakage.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npx tsc --noEmit
npm test
git status
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never delete files without checking git history and confirming zero active references.
- **Guard**: Never delete configuration files (.env.example, tsconfig.json) without explicit approval.
- **Guard**: Keep cleanup commits separate from functional feature or bug fix commits.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify repository compiles cleanly with 0 TypeScript errors after deletion.
- [ ] Verify 100% of test suites pass after dead code removal.
- [ ] Verify git status shows clean, intended file deletions.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `code-reviewer`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
