---
name: rls-security-auditor
description: >-
  Audit PostgreSQL Row Level Security policies, identify policy bypasses, test anon vs authenticated access, and enforce least-privilege security. Use when authoring migrations or auditing database security.
---

# PostgreSQL Row Level Security (RLS) Auditing

> **Category**: Database, Supabase & Data Integrity  
> **Specialist Subagent**: `security-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Verify that 100% of public database tables have RLS enabled (ALTER TABLE ... ENABLE ROW LEVEL SECURITY).**: Verify that 100% of public database tables have RLS enabled (ALTER TABLE ... ENABLE ROW LEVEL SECURITY).
2. **Audit every RLS policy (SELECT, INSERT, UPDATE, DELETE) for proper auth.uid() predicate checks.**: Audit every RLS policy (SELECT, INSERT, UPDATE, DELETE) for proper auth.uid() predicate checks.
3. **Ensure anonymous users cannot perform unauthorized reads or any mutations on sensitive data.**: Ensure anonymous users cannot perform unauthorized reads or any mutations on sensitive data.

---

## 2. Standard Operating Procedures (SOP)

1. Query pg_tables and pg_policies to list all tables and verify rowsecurity = true.
2. Inspect policy expressions (qual and with_check) for auth.uid() = user_id or public read rules.
3. Execute automated RLS audit script (scripts/verify_rls_policies.ts) using anonymous client credentials.
4. Assert that anon client INSERT, UPDATE, and DELETE queries are rejected with permission denied.
5. Verify that authenticated client queries only return rows matching their own auth.uid().

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npx tsx scripts/verify_rls_policies.ts
npx supabase db lint
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never create RLS policies using 'USING (true)' on tables storing user-specific data.
- **Guard**: Ensure WITH CHECK expressions are defined on INSERT and UPDATE policies.
- **Guard**: Never grant public role write access to tables.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify scripts/verify_rls_policies.ts passes with 0 RLS policy vulnerabilities.
- [ ] Verify every table in public schema has rowsecurity = true.
- [ ] Verify anonymous write attempts fail with PostgreSQL permission denied errors.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `security-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
