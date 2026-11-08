---
name: workflow-creator
description: >-
  Design and implement background automations, cron-scheduled workflows, event-driven runbooks, and one-shot timers. Use when creating automated maintenance, data syncs, or recurring tasks.
---

# Automated Workflow Creation & Background Schedulers

> **Category**: AI Systems, LLMs & Agentic Engineering  
> **Specialist Subagent**: `backend-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Design reliable, scheduled background tasks and event-triggered automated workflows.**: Design reliable, scheduled background tasks and event-triggered automated workflows.
2. **Leverage the Antigravity schedule tool with 5-field cron expressions or duration timers.**: Leverage the Antigravity schedule tool with 5-field cron expressions or duration timers.
3. **Implement idempotent runbooks that handle interruption and resumption gracefully.**: Implement idempotent runbooks that handle interruption and resumption gracefully.

---

## 2. Standard Operating Procedures (SOP)

1. Define automation requirements: frequency (cron), execution trigger, inputs, and desired outputs.
2. Author standalone automation runbook script in scripts/ or background service.
3. Configure schedule tool with Prompt and CronExpression (or DurationSeconds for one-shot).
4. Implement structured logging and alert notification for workflow failures or SLA breaches.
5. Verify workflow terminates cleanly, cleans up locks, and records completion state.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npm test -- tests/workflow-*.test.ts
npx tsx scripts/verify-builder-flow.js
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never use shell sleep commands as timers; always use the native schedule tool.
- **Guard**: Set IsDaemon=true only for independent standing jobs meant to survive current session.
- **Guard**: Ensure workflows are idempotent: re-running a failed job must not corrupt data.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify scheduled job triggers at expected time interval.
- [ ] Verify workflow executes to completion and records success in log.
- [ ] Verify system resources (memory, connections) are cleanly released after execution.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `backend-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
