---
name: auto-fix-engine
description: >-
  Execute closed-loop, surgical error remediation that automatically analyzes failures, formulates patches, applies fixes, and verifies resolution. Use when resolving compilation, linting, or automated test errors.
---

# Autonomous Self-Correcting Fix Engine

> **Category**: Automated Debugging & Root Cause Analysis  
> **Specialist Subagent**: `qa-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Provide an automated, iterative loop**: Observe -> Hypothesize -> Patch -> Verify.
2. **Apply surgical, minimal code edits that resolve failures without introducing side-effects.**: Apply surgical, minimal code edits that resolve failures without introducing side-effects.
3. **Terminate loop cleanly upon green verification or rollback safely on persistent failure.**: Terminate loop cleanly upon green verification or rollback safely on persistent failure.

---

## 2. Standard Operating Procedures (SOP)

1. Capture the exact error output, exit code, and failing assertions from the build or test runner.
2. Parse stack traces to locate the exact source files and line ranges requiring correction.
3. Draft a targeted patch addressing the root cause while preserving surrounding contracts.
4. Apply the patch using surgical file editing tools.
5. Re-run the exact failing command; iterate up to 3 times if errors mutate; verify clean exit.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npx tsc --noEmit
npm test
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Abort and rollback edits if 3 successive fix attempts fail to resolve the defect.
- **Guard**: Never delete functional code or tests to force a green test result.
- **Guard**: Keep diffs minimal and focused exclusively on the error.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify targeted test transitions to passing state.
- [ ] Verify complete test suite and TypeScript checks pass 100%.
- [ ] Verify git diff is tight, clean, and free of extraneous modifications.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `qa-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
