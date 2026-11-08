---
name: api-development
description: >-
  Design and implement production-ready REST route handlers with Zod schema validation, deterministic HTTP status codes, structured error envelopes, and idempotency. Use when creating or updating API endpoints in src/app/api/.
---

# RESTful API Architecture & Contract Design

> **Category**: Core Full-Stack & Software Architecture  
> **Specialist Subagent**: `backend-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Build consistent, predictable RESTful APIs following standard HTTP verb semantics.**: Build consistent, predictable RESTful APIs following standard HTTP verb semantics.
2. **Validate 100% of incoming request payloads (body, query params, route params) with Zod.**: Validate 100% of incoming request payloads (body, query params, route params) with Zod.
3. **Enforce standardized JSON error response envelopes and correct HTTP status codes.**: Enforce standardized JSON error response envelopes and correct HTTP status codes.

---

## 2. Standard Operating Procedures (SOP)

1. Define request and response validation schemas in src/lib/api-schemas.ts using Zod.
2. Implement explicit route handlers in src/app/api/<route>/route.ts (GET, POST, PUT, DELETE).
3. Parse and validate incoming inputs with schema.safeParse(); return 400 on failure with details.
4. Delegate all domain logic to backend services in src/services/; keep routes thin controllers.
5. Wrap handler logic in structured try/catch returning standard error envelopes: { error, code, details }.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npm test -- tests/api-*.test.ts
npx tsc --noEmit
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never return unformatted raw exceptions or stack traces to API clients in production.
- **Guard**: Never trust unvalidated client input or skip authentication checks.
- **Guard**: Ensure mutating endpoints (POST, DELETE) are protected against CSRF and cross-tenant leakage.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify API routes return 200/201 on valid payloads, 400 on malformed input, 401 when unauthorized.
- [ ] Verify error response matches schema: { error: string, code: string, details?: any }.
- [ ] Verify automated API integration tests pass with 100% assertion coverage.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `backend-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
