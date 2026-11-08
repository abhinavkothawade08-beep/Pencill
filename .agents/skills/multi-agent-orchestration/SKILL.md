---
name: multi-agent-orchestration
description: >-
  Coordinate teams of specialized autonomous subagents with domain boundaries, inter-agent messaging, shared workspaces, and conflict resolution. Use when coordinating complex multi-domain projects.
---

# Multi-Agent System Orchestration & Consensus Protocols

> **Category**: AI Systems, LLMs & Agentic Engineering  
> **Specialist Subagent**: `architect`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Coordinate specialized subagents (architect, backend, frontend, qa, security, database) harmoniously.**: Coordinate specialized subagents (architect, backend, frontend, qa, security, database) harmoniously.
2. **Prevent file collision**: enforce single-writer locks across agent workspaces.
3. **Implement consensus protocols and architectural sign-offs before code modification.**: Implement consensus protocols and architectural sign-offs before code modification.

---

## 2. Standard Operating Procedures (SOP)

1. Decompose high-level mission into domain-specific subtasks assigned strictly by role expertise.
2. Invoke specialized subagents using invoke_subagent tool with explicit prompts and constraints.
3. Enforce workspace isolation: use branched workspaces or file locking to prevent write collisions.
4. Facilitate structured communication: pass outputs and artifacts cleanly between agents.
5. Aggregate specialist deliverables and verify holistic system behavior with full test suite.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npm test
git status
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never allow multiple subagents to mutate the same source file concurrently.
- **Guard**: Reconcile architectural disagreements between agents prior to code authoring.
- **Guard**: Never declare mission success solely on a subagent's self-reported message without verification.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify all subagents complete assigned tasks without deadlock or conflict.
- [ ] Verify final integrated system compiles cleanly and passes all test suites.
- [ ] Verify git status shows clean, coherent changes across all affected files.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `architect`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
