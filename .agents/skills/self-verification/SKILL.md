---
name: self-verification
description: >-
  Execute the complete three-tier verification gate (TypeScript type safety, ESLint linting, and automated test suites) before committing any change. Use as the mandatory final step for every task.
---

# Hermetic Automated Self-Verification

> **Category**: Automated Debugging & Root Cause Analysis  
> **Specialist Subagent**: `qa-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Enforce the 3-step verification protocol**: TypeScript -> ESLint -> Automated Tests.
2. **Guarantee zero unverified code changes reach the user or production branch.**: Guarantee zero unverified code changes reach the user or production branch.
3. **Provide transparent verification evidence in every mission report.**: Provide transparent verification evidence in every mission report.

---

## 2. Standard Operating Procedures (SOP)

1. Step 1: Run 'npx tsc --noEmit' and assert 0 errors.
2. Step 2: Run 'npm run lint' and assert 0 warnings and 0 errors.
3. Step 3: Run 'npm test' and assert 100% pass rate across all suites.
4. If any step fails, invoke auto-fix-engine and repeat verification until green.
5. Summarize verification outcomes with exact command outputs and metrics.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npx tsc --noEmit
npm run lint
npm test
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never skip verification because 'the change is simple'.
- **Guard**: Never disable failing tests or comment out assertions to pass verification.
- **Guard**: Never report a task as complete without actual terminal execution evidence.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify exit code 0 on 'npx tsc --noEmit'.
- [ ] Verify exit code 0 on 'npm run lint'.
- [ ] Verify 341+ passing tests with 0 failures on 'npm test'.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `qa-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
