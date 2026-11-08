---
name: task-planning
description: >-
  Decompose complex engineering initiatives into logical, sequential, atomic tasks with dependency mapping and verification milestones. Use before executing multi-file or multi-step engineering missions.
---

# Systematic Task Planning & Work Breakdown Structure

> **Category**: Technical Documentation, Product & Repository Ops  
> **Specialist Subagent**: `architect`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Create structured, step-by-step Work Breakdown Structures (WBS) for complex tasks.**: Create structured, step-by-step Work Breakdown Structures (WBS) for complex tasks.
2. **Sequence tasks logically**: Schema -> Service -> API Route -> UI Components -> Tests.
3. **Identify dependencies, critical path bottlenecks, and regression risk checkpoints.**: Identify dependencies, critical path bottlenecks, and regression risk checkpoints.

---

## 2. Standard Operating Procedures (SOP)

1. Decompose overall goal into atomic, independent tasks (15-45 minutes execution scope).
2. Order tasks following architectural layering: foundational database models first, then services, then UI.
3. Define explicit entry and exit criteria for every task in the plan.
4. Attach automated verification commands to each milestone.
5. Track task execution status dynamically (Pending, In-Progress, Completed, Verified).

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
git status
npm test
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never write code without a structured systematic plan.
- **Guard**: Avoid large monolithic tasks that cannot be verified independently.
- **Guard**: Update task status in real time to provide complete transparency.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify plan covers 100% of requirements without skipped intermediate steps.
- [ ] Verify each task milestone is verified by an automated test or command.
- [ ] Verify all tasks conclude with passing verification gates.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `architect`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
