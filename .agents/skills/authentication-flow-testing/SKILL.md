---
name: authentication-flow-testing
description: >-
  Test authentication workflows: user registration, email verification, session renewal, password reset, and cross-tenant authorization boundaries. Use when modifying auth routes, middleware, or user permissions.
---

# End-to-End Authentication & Authorization Flow Testing

> **Category**: Deep System Verification, Safety & Acceptance  
> **Specialist Subagent**: `security-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Verify complete authentication and authorization lifecycles under positive and hostile conditions.**: Verify complete authentication and authorization lifecycles under positive and hostile conditions.
2. **Ensure unauthenticated requests are blocked with 401 Unauthorized across all protected routes.**: Ensure unauthenticated requests are blocked with 401 Unauthorized across all protected routes.
3. **Verify role-based access control (RBAC)**: ensure standard users cannot access admin endpoints.

---

## 2. Standard Operating Procedures (SOP)

1. Author automated tests for user login, token refresh, and logout lifecycle.
2. Test token expiration: simulate expired JWT and verify automatic refresh or redirect to login.
3. Test authorization boundaries: simulate User A requesting User B's resource; verify 403 Forbidden.
4. Test session cookie security: verify HttpOnly, Secure, and SameSite attributes on set-cookie headers.
5. Test account switching: verify immediate cache invalidation and clean state re-initialization.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npm test -- tests/auth-*.test.ts
npx tsx scripts/verify_auth_live.js
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never hardcode live user passwords or real authentication credentials in test files.
- **Guard**: Ensure test users are cleaned up after test execution to prevent cluttering databases.
- **Guard**: Never bypass middleware authentication checks in test environments without explicit mocking.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify all authentication and authorization test suites pass 100%.
- [ ] Verify unauthenticated access to protected routes is completely blocked.
- [ ] Verify session logout cleanly purges all stored tokens and cached profile data.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `security-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
