---
name: subagent-task-delegation
description: >-
  Craft clear, actionable task prompts for specialist subagents, establish execution boundaries, and aggregate results. Use when delegating parallel tasks to architect, research, or engineering subagents.
---

# Subagent Task Prompting & Boundary Delegation

> **Category**: Technical Documentation, Product & Repository Ops  
> **Specialist Subagent**: `architect`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Delegate subtasks with precision**: clear context, explicit objectives, boundaries, and expected output.
2. **Assign tasks strictly aligned with subagent specialist expertise.**: Assign tasks strictly aligned with subagent specialist expertise.
3. **Aggregate and validate subagent deliverables before integrating into the main branch.**: Aggregate and validate subagent deliverables before integrating into the main branch.

---

## 2. Standard Operating Procedures (SOP)

1. Select appropriate subagent role (architect, research, frontend-eng, backend-eng, database-eng, etc.).
2. Draft delegation prompt: Context, Exact Task, Permitted Files, Constraints, and Verification Gate.
3. Invoke subagent using invoke_subagent tool; do not poll; wait for reactive notification.
4. Review subagent output upon completion: inspect modified files and test verification evidence.
5. Integrate approved changes and execute full repository verification gate.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
git diff --stat
npm test
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never delegate open-ended, ambiguous tasks ('fix everything'); provide bounded scopes.
- **Guard**: Never allow two subagents to edit the same file simultaneously.
- **Guard**: Never accept subagent results without independent verification.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify subagent returns clear, structured completion report with line citations.
- [ ] Verify subagent modifications pass all automated tests and type checks.
- [ ] Verify main branch integrity is preserved across all delegated contributions.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `architect`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
