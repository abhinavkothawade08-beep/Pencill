---
name: gemini-api-expert
description: >-
  Integrate Google Gen AI SDK (@google/genai) to generate structured curricula, study monographs, quizzes, and multimodal insights with strict schema enforcement. Use when engineering AI features or prompt pipelines.
---

# Google Gemini AI SDK Engineering & Structured Generation

> **Category**: Google Ecosystem, APIs & Mobile  
> **Specialist Subagent**: `ai-engineer`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Engineer robust AI workflows using the official Google Gen AI SDK (@google/genai).**: Engineer robust AI workflows using the official Google Gen AI SDK (@google/genai).
2. **Enforce deterministic JSON outputs using responseSchema or constrained JSON prompt contracts.**: Enforce deterministic JSON outputs using responseSchema or constrained JSON prompt contracts.
3. **Implement resilient deterministic fallbacks ensuring 0 user crashes on API limits (429) or outages.**: Implement resilient deterministic fallbacks ensuring 0 user crashes on API limits (429) or outages.

---

## 2. Standard Operating Procedures (SOP)

1. Initialize GoogleGenAI client with GEMINI_API_KEY from validated server environment.
2. Define strict Zod response schemas and compile to JSON Schema for model output constraints.
3. Execute ai.models.generateContent with temperature, systemInstructions, and responseSchema.
4. Sanitize output by stripping markdown code fences (```json ... ```) before JSON.parse().
5. Implement curriculum-adaptive deterministic fallback engine for graceful offline operation.
6. Redact quiz correct answers on client payloads to preserve server-side scoring authority.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npx tsx scripts/test-gemini.mjs
npm test -- tests/gemini-*.test.ts
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: NEVER expose GEMINI_API_KEY to browser clients; all AI calls must execute in server route handlers.
- **Guard**: Always wrap AI calls in try/catch with automatic fallback to deterministic engines on failure.
- **Guard**: Never allow un-sanitized model outputs to be rendered directly into DOM without HTML escaping.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify AI integration tests pass with and without GEMINI_API_KEY configured.
- [ ] Verify model outputs parse cleanly into validated Zod schemas with 0 errors.
- [ ] Verify offline fallback generates complete, high-quality educational curricula seamlessly.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `ai-engineer`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
