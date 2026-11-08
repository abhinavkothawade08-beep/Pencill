---
name: supabase-expert
description: >-
  Master Supabase client integration, PostgreSQL query builders, Realtime subscriptions, Auth hooks, and Storage buckets. Use when building data queries, managing Supabase clients, or configuring storage.
---

# Supabase Platform Engineering & Realtime Integration

> **Category**: Database, Supabase & Data Integrity  
> **Specialist Subagent**: `database-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Implement type-safe Supabase database queries using @supabase/supabase-js.**: Implement type-safe Supabase database queries using @supabase/supabase-js.
2. **Configure and manage client-side vs server-side Supabase client instances securely.**: Configure and manage client-side vs server-side Supabase client instances securely.
3. **Leverage Supabase Storage for media uploads and Realtime subscriptions for live updates.**: Leverage Supabase Storage for media uploads and Realtime subscriptions for live updates.

---

## 2. Standard Operating Procedures (SOP)

1. Initialize public client with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
2. Use createServerClient in server components/route handlers to read auth cookies securely.
3. Execute structured CRUD queries with error handling checking for error objects from Supabase.
4. Manage storage buckets with secure upload policies and signed URL generation.
5. Implement Realtime Postgres Change channels for live collaborative features.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npx supabase status
npx tsx scripts/verify_live_supabase.js
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: NEVER expose SUPABASE_SERVICE_ROLE_KEY to client-side code or public repositories.
- **Guard**: Always verify that returned error objects from Supabase queries are checked and handled.
- **Guard**: Avoid unbounded queries without .limit() or range pagination.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify Supabase connection succeeds and queries return expected typed records.
- [ ] Verify anon client cannot perform actions prohibited by RLS policies.
- [ ] Verify live tests in scripts/verify_live_supabase.js pass 100%.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `database-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
