---
name: technical-research-agent
description: >-
  Conduct thorough technical research, library evaluations, architecture spikes, and ecosystem benchmarks to resolve technical unknowns. Use when investigating unfamiliar technologies, complex bugs, or architectural trade-offs.
---

# Deep Technical Research & Architecture Spikes

> **Category**: AI Systems, LLMs & Agentic Engineering  
> **Specialist Subagent**: `research`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Investigate and resolve complex technical unknowns through structured research.**: Investigate and resolve complex technical unknowns through structured research.
2. **Evaluate competing libraries, frameworks, and patterns across criteria matrices.**: Evaluate competing libraries, frameworks, and patterns across criteria matrices.
3. **Produce concise, evidence-backed Technical Spike Reports guiding architectural decisions.**: Produce concise, evidence-backed Technical Spike Reports guiding architectural decisions.

---

## 2. Standard Operating Procedures (SOP)

1. Define research question and clear evaluation criteria (performance, bundle size, maintenance, typing).
2. Survey official documentation, RFCs, GitHub issues, and reputable technical resources.
3. Build minimal proof-of-concept (PoC) code in a scratch script to verify real-world behavior.
4. Benchmark alternatives and record concrete metrics (latency, memory, API ergonomic).
5. Synthesize findings into an Architecture Spike Report with a definitive recommendation.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npx tsx scripts/compile-taxonomy.js
npm test
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never base architectural recommendations on hearsay or unverified forum posts.
- **Guard**: Ensure proof-of-concept code runs in standard sandbox mode without bypassing security.
- **Guard**: Distinguish clearly between established standards and experimental beta features.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify research findings are verified by working executable proof-of-concept code.
- [ ] Verify trade-off matrix evaluates at least two viable alternatives.
- [ ] Verify final recommendation aligns with project constraints and standards.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `research`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
