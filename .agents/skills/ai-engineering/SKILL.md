---
name: ai-engineering
description: >-
  Architect end-to-end AI applications, optimize token budgets, implement model routing, and balance latency versus reasoning accuracy. Use when designing LLM features, AI pipelines, or multi-model systems.
---

# AI Systems Engineering & Model Architecture

> **Category**: AI Systems, LLMs & Agentic Engineering  
> **Specialist Subagent**: `ai-engineer`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Design reliable, cost-effective AI systems delivering deterministic, high-value outcomes.**: Design reliable, cost-effective AI systems delivering deterministic, high-value outcomes.
2. **Select optimal models based on task complexity (Flash for speed, Pro for deep reasoning).**: Select optimal models based on task complexity (Flash for speed, Pro for deep reasoning).
3. **Enforce strict token budgeting, caching strategies, and latency minimization.**: Enforce strict token budgeting, caching strategies, and latency minimization.

---

## 2. Standard Operating Procedures (SOP)

1. Classify incoming AI tasks by cognitive depth: extraction, generation, reasoning, or synthesis.
2. Route tasks dynamically: use lightweight models (Gemini Flash) for extraction; high-reasoning for curriculum.
3. Define token budgets per request; enforce maximum output token caps to control cost.
4. Implement prompt caching for static instructions, schemas, and syllabus reference matrices.
5. Design fallback hierarchies: primary model -> fast model -> deterministic rule-based engine.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npx tsx scripts/test-gemini.mjs
npm test -- tests/curriculum-*.test.ts
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never deploy LLM features without a deterministic fallback engine for offline resilience.
- **Guard**: Avoid sending giant context windows when compact, focused context yields higher accuracy.
- **Guard**: Never allow unbounded AI generation loops without hard iteration and token limits.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify AI system operates reliably under rate-limited or disconnected conditions.
- [ ] Verify token usage remains within budgeted cost constraints.
- [ ] Verify generation latency meets target UX benchmarks (< 3s perceived time).

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `ai-engineer`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
