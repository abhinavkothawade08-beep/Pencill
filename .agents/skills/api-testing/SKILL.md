---
name: api-testing
description: >-
  Write comprehensive automated API tests validating request schemas, response envelopes, status codes, and error conditions. Use when creating or testing REST routes in src/app/api/.
---

# Automated REST API & Contract Testing

> **Category**: Automated Testing & Verification QA  
> **Specialist Subagent**: `qa-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Validate API contracts against defined Zod schemas for all HTTP verbs.**: Validate API contracts against defined Zod schemas for all HTTP verbs.
2. **Verify deterministic HTTP status codes (200, 201, 400, 401, 403, 404, 429, 500).**: Verify deterministic HTTP status codes (200, 201, 400, 401, 403, 404, 429, 500).
3. **Ensure edge cases, boundary parameters, and malformed bodies produce clear error envelopes.**: Ensure edge cases, boundary parameters, and malformed bodies produce clear error envelopes.

---

## 2. Standard Operating Procedures (SOP)

1. Author API test suites targeting route handlers directly or via HTTP request simulation.
2. Test nominal payloads: verify 200/201 status and correct JSON response schema structure.
3. Test validation failures: send missing, unexpected, or malformed fields; verify 400 Bad Request.
4. Test authentication guards: send unauthenticated or forged requests; verify 401/403.
5. Assert on response header types (Content-Type: application/json) and cache headers.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npm test -- tests/api-*.test.ts
npx tsx --test tests/verify_learning_and_quiz.js
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never allow API tests to modify persistent production data.
- **Guard**: Ensure test suites verify that sensitive fields (passwords, tokens) are never returned in responses.
- **Guard**: Validate that rate-limiting headers and 429 status codes trigger under simulated abuse.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify 100% of API test assertions pass.
- [ ] Verify all error responses conform to { error: string, code: string, details?: any }.
- [ ] Verify API routes correctly reject unauthorized or malformed requests.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `qa-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
