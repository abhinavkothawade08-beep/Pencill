---
name: security-code-review
description: >-
  Audit codebases for OWASP Top 10 vulnerabilities, authentication bypasses, injection attacks, cross-tenant leaks, and credential exposure. Use when modifying auth flows, database queries, or external APIs.
---

# Security Code Review & Vulnerability Audit

> **Category**: Code Review, Audit & Quality Assurance  
> **Specialist Subagent**: `security-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Identify and eradicate security vulnerabilities prior to deployment.**: Identify and eradicate security vulnerabilities prior to deployment.
2. **Enforce multi-tenant data isolation and strict Row Level Security (RLS) enforcement.**: Enforce multi-tenant data isolation and strict Row Level Security (RLS) enforcement.
3. **Prevent injection attacks (SQL, XSS, SSRF, Command Injection) via strict sanitization.**: Prevent injection attacks (SQL, XSS, SSRF, Command Injection) via strict sanitization.

---

## 2. Standard Operating Procedures (SOP)

1. Inspect all database queries: verify parameterized queries; ensure zero string concatenation in SQL.
2. Audit API route handlers: verify authentication checks and authorization policies (auth.uid() = user_id).
3. Check input validation: verify 100% of incoming payloads pass Zod schemas before consumption.
4. Inspect frontend components: verify user-supplied content is escaped to prevent XSS.
5. Audit environment variables: ensure service-role keys and secrets never reach client bundles.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npm audit
git diff | grep -iE "(secret|token|password|apikey|service_role)"
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never allow client-side components to import or reference server secrets.
- **Guard**: Never disable CORS or CSRF protections to 'fix' a cross-origin error.
- **Guard**: Ensure error responses never leak internal table names, column structures, or stack traces.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify zero security vulnerabilities detected across OWASP Top 10 categories.
- [ ] Verify RLS policies enforce tenant isolation on every table.
- [ ] Verify automated security tests pass with 100% success rate.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `security-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
