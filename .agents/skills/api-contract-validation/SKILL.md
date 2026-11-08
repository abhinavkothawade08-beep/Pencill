---
name: api-contract-validation
description: >-
  Validate API request and response contracts, enforce backward compatibility, and prevent breaking schema changes. Use when modifying API schemas in src/lib/api-schemas.ts or route handlers.
---

# API Contract Validation & Schema Backward Compatibility

> **Category**: Deep System Verification, Safety & Acceptance  
> **Specialist Subagent**: `backend-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Ensure API schemas strictly validate all incoming and outgoing data contracts.**: Ensure API schemas strictly validate all incoming and outgoing data contracts.
2. **Prevent breaking changes that would cause legacy clients or mobile apps to fail.**: Prevent breaking changes that would cause legacy clients or mobile apps to fail.
3. **Enforce additive-only schema evolution patterns for public API routes.**: Enforce additive-only schema evolution patterns for public API routes.

---

## 2. Standard Operating Procedures (SOP)

1. Inspect API validation schemas in src/lib/api-schemas.ts.
2. Verify schema changes are backward-compatible: new fields must be optional or have default values.
3. Never remove or rename existing fields without a formal deprecation lifecycle.
4. Author schema contract tests asserting on valid, invalid, and legacy payload formats.
5. Execute automated tests in tests/api-*.test.ts to verify contract integrity.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npm test -- tests/api-*.test.ts
npx tsc --noEmit
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never change a previously optional field to required without client version coordination.
- **Guard**: Never alter field data types (e.g. string to number) in an existing API schema.
- **Guard**: Always validate outgoing API responses to ensure internal private fields are never leaked.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify API schema accepts legacy request payloads without validation errors.
- [ ] Verify API schema rejects malformed or unauthorized inputs with 400 Bad Request.
- [ ] Verify API contract tests achieve 100% pass rate.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `backend-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
