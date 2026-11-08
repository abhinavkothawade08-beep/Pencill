---
name: multi-tenant-data-isolation
description: >-
  Enforce strict tenant data boundaries, prevent cross-tenant data leaks, and audit multi-tenant query security. Use when designing user data schemas, querying multi-tenant tables, or auditing isolation.
---

# Multi-Tenant Data Partitioning & Isolation Enforcement

> **Category**: Database, Supabase & Data Integrity  
> **Specialist Subagent**: `security-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Guarantee zero data leakage between distinct users or organizational tenants.**: Guarantee zero data leakage between distinct users or organizational tenants.
2. **Enforce tenant identification column (user_id / tenant_id) across all shared tables.**: Enforce tenant identification column (user_id / tenant_id) across all shared tables.
3. **Audit every API endpoint and query for proper tenant scoping.**: Audit every API endpoint and query for proper tenant scoping.

---

## 2. Standard Operating Procedures (SOP)

1. Include user_id UUID REFERENCES auth.users(id) NOT NULL on all user-owned domain tables.
2. Enforce PostgreSQL Row Level Security (RLS) policies requiring auth.uid() = user_id.
3. In service layers, always pass authenticated user context and filter by user_id explicitly.
4. Write multi-tenant penetration tests: verify User A cannot read or mutate User B's records.
5. Audit API route parameters: never accept user_id blindly from client request payloads.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npm test -- tests/batch-delete-scope.test.ts
npx tsx scripts/verify_rls_policies.ts
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never trust client-supplied user_id in request bodies; derive user_id from verified auth token.
- **Guard**: Never disable RLS on tables containing user-specific or sensitive information.
- **Guard**: Avoid cross-tenant JOINs or queries without explicit tenant filtering.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify tests prove User A attempting to access User B's data receives 403 Forbidden or empty set.
- [ ] Verify RLS policies exist and are enabled on 100% of user-owned tables.
- [ ] Verify zero cross-tenant data leakage detected in automated security test suites.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `security-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
