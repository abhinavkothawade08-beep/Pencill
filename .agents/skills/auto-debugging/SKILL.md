---
name: auto-debugging
description: >-
  Systematically isolate, reproduce, and resolve software bugs using hypothesis-driven debugging, binary search isolation, and runtime inspection. Use when investigating unexpected behavior, failed tests, or defect reports.
---

# Autonomous Systematic Debugging

> **Category**: Automated Debugging & Root Cause Analysis  
> **Specialist Subagent**: `qa-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Isolate bug reproduction steps with minimal reproducible test cases.**: Isolate bug reproduction steps with minimal reproducible test cases.
2. **Formulate and test falsifiable hypotheses regarding failure mechanisms.**: Formulate and test falsifiable hypotheses regarding failure mechanisms.
3. **Identify the exact line, contract violation, or state corruption causing the failure.**: Identify the exact line, contract violation, or state corruption causing the failure.

---

## 2. Standard Operating Procedures (SOP)

1. Replicate the defect locally using a targeted unit or integration test case.
2. Inspect stack traces, error payloads, and surrounding execution flow.
3. Formulate hypotheses and verify with targeted assertions or focused debugger logging.
4. Trace state mutations backwards to identify the origin of corruption.
5. Implement the fix and verify that the reproduction test transitions from red to green.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npx tsx --test <path-to-test>
git bisect start
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never guess or make speculative code changes without understanding root cause.
- **Guard**: Never mask errors by swallowing exceptions in empty catch blocks.
- **Guard**: Never alter test expectations to make a broken implementation pass.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify reproduction test passes consistently across multiple executions.
- [ ] Verify no other tests in the regression suite broke as a side-effect.
- [ ] Verify root cause analysis is documented clearly.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `qa-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
