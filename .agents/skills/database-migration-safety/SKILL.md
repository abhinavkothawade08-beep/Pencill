---
name: database-migration-safety
description: >-
  Author and execute non-destructive, backward-compatible PostgreSQL database migrations with rollback plans and zero downtime. Use when altering schemas, adding columns, or migrating data.
---

# Zero-Downtime Database Migration Safety

> **Category**: Database, Supabase & Data Integrity  
> **Specialist Subagent**: `database-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Author backward-compatible database migrations enabling zero-downtime deployments.**: Author backward-compatible database migrations enabling zero-downtime deployments.
2. **Enforce non-destructive operations**: expand-contract pattern for schema evolution.
3. **Guarantee every migration includes a verified, tested rollback script.**: Guarantee every migration includes a verified, tested rollback script.

---

## 2. Standard Operating Procedures (SOP)

1. Create timestamped migration file in supabase/migrations/ (e.g. YYYYMMDDHHMMSS_name.sql).
2. Follow Expand-Contract pattern: add new nullable/default columns first; migrate data; drop old columns later.
3. Set sensible statement timeouts (SET statement_timeout = '10s') to prevent table lock pileups.
4. Author corresponding rollback SQL script reversing all schema mutations cleanly.
5. Test migration and rollback sequentially against a local or staging database instance.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npx supabase db push
npx supabase migration list
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never execute destructive migrations (DROP TABLE, DROP COLUMN) without prior data archiving and user confirmation.
- **Guard**: Never add NOT NULL columns without a DEFAULT value on tables with existing rows.
- **Guard**: Avoid running long data migrations in the same transaction as DDL schema changes.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify migration executes cleanly without lock timeouts.
- [ ] Verify application continues operating normally during and after migration.
- [ ] Verify rollback script successfully restores previous database schema state.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `database-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
