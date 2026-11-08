---
name: agentic-workflow-engineering
description: >-
  Architect autonomous agentic workflows using ReAct loops (Reasoning + Acting), tool execution chains, state checkpointing, and termination criteria. Use when designing autonomous task-solving agents or pipelines.
---

# Agentic Workflow Engineering & ReAct Reasoning Loops

> **Category**: AI Systems, LLMs & Agentic Engineering  
> **Specialist Subagent**: `architect`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Design robust agent loops that iteratively perceive, reason, act, and verify outcomes.**: Design robust agent loops that iteratively perceive, reason, act, and verify outcomes.
2. **Integrate tool calling with strict schema definitions, error handling, and parameter coercion.**: Integrate tool calling with strict schema definitions, error handling, and parameter coercion.
3. **Implement deterministic termination guards preventing infinite agent loops and runaways.**: Implement deterministic termination guards preventing infinite agent loops and runaways.

---

## 2. Standard Operating Procedures (SOP)

1. Define agent state machine: Initialize -> Plan -> Select Tool -> Execute -> Observe -> Assess.
2. Provide typed tool definitions with clear descriptions and parameter validation schemas.
3. Implement guardrails: max loop iterations (10-25), max time limits, and budget caps.
4. Checkpoint intermediate state so failed steps can resume without re-running entire workflows.
5. Evaluate terminal condition: verify all success assertions are satisfied before declaring completion.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npm test -- tests/agentic-*.test.ts
npx tsx scripts/verify-builder-flow.js
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never create unconstrained while(true) agent loops without hard iteration ceilings.
- **Guard**: Never allow agents to execute arbitrary destructive shell commands without safety barriers.
- **Guard**: Ensure tool execution errors are fed back into agent context for self-correction rather than crashing.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify agent loop converges to valid solution within target iteration count.
- [ ] Verify error recovery mechanisms correctly handle tool invocation failures.
- [ ] Verify final state satisfies 100% of defined task success criteria.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `architect`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
