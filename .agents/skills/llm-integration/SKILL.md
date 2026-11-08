---
name: llm-integration
description: >-
  Integrate LLM APIs with streaming responses, exponential backoff retries, rate-limit queueing, and structured output parsing. Use when connecting LLM providers or handling streaming AI responses.
---

# LLM API Integration, Streaming & Resilient Retries

> **Category**: AI Systems, LLMs & Agentic Engineering  
> **Specialist Subagent**: `ai-engineer`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Implement robust LLM API client connections with automatic retry and backoff logic.**: Implement robust LLM API client connections with automatic retry and backoff logic.
2. **Support real-time streaming text delivery using Server-Sent Events (SSE) or WebSockets.**: Support real-time streaming text delivery using Server-Sent Events (SSE) or WebSockets.
3. **Handle HTTP 429 rate limits, 503 service overloads, and network timeouts gracefully.**: Handle HTTP 429 rate limits, 503 service overloads, and network timeouts gracefully.

---

## 2. Standard Operating Procedures (SOP)

1. Implement retry wrapper with exponential backoff and jitter for transient API errors (429, 500, 503).
2. Implement streaming API route handlers returning ReadableStream for interactive UI text rendering.
3. Handle stream interruptions and connection closures cleanly on client and server.
4. Accumulate streamed chunks and validate full output against expected schema upon completion.
5. Log token usage, response latency, and finish reasons for every LLM interaction.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npm test -- tests/gemini-*.test.ts
npx tsx scripts/test-gemini.mjs
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never retry indefinitely; cap retries at 3 attempts before falling back to alternative engine.
- **Guard**: Always set strict HTTP request timeouts (30s) to prevent hanging server connections.
- **Guard**: Never buffer entire streaming responses in memory when streaming directly to clients.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify streaming responses stream smoothly to client UI without buffering lags.
- [ ] Verify exponential backoff successfully recovers from simulated 429 rate limits.
- [ ] Verify final assembled response passes schema validation.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `ai-engineer`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
