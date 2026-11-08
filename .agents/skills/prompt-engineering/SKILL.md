---
name: prompt-engineering
description: >-
  Author precise, grounded system instructions, few-shot examples, chain-of-thought prompts, and output constraints. Use when crafting prompts for curriculum generation, tutors, quizzes, or monographs.
---

# Production Prompt Engineering & Grounding

> **Category**: AI Systems, LLMs & Agentic Engineering  
> **Specialist Subagent**: `ai-engineer`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Design high-fidelity, deterministic prompts yielding consistent structured outputs.**: Design high-fidelity, deterministic prompts yielding consistent structured outputs.
2. **Ground prompts in academic standards, authoritative syllabi, and strict role boundaries.**: Ground prompts in academic standards, authoritative syllabi, and strict role boundaries.
3. **Eliminate hallucinations, preamble conversational filler, and formatting errors.**: Eliminate hallucinations, preamble conversational filler, and formatting errors.

---

## 2. Standard Operating Procedures (SOP)

1. Structure prompts using clear XML tags: <context>, <instructions>, <constraints>, <output_format>.
2. Provide high-quality few-shot examples demonstrating desired tone, depth, and schema adherence.
3. Instruct model to output raw JSON strictly without conversational preamble or markdown fences.
4. Ground generation in verified academic syllabi (JEE, NEET, CBSE, MIT OCW, NPTEL).
5. Test prompts against adversarial inputs and edge cases to ensure constraint enforcement.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npm test -- tests/prompts-*.test.ts
npx tsx scripts/test-quiz.ts
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never use ambiguous, vague instructions ('make it good'); always define exact criteria.
- **Guard**: Never allow the model to invent fake academic faculty, courses, or citations.
- **Guard**: Ensure prompt tokens are budgeted efficiently without redundant or verbose instructions.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify model outputs parse as valid JSON matching schema 100% of the time.
- [ ] Verify generated content strictly adheres to academic syllabus constraints.
- [ ] Verify prompt produces consistent high-quality outputs across repeated runs.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `ai-engineer`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
