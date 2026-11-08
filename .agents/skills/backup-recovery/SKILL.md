---
name: backup-recovery
description: >-
  Design and verify database backup strategies, point-in-time recovery (PITR) procedures, and disaster recovery playbooks. Use when establishing operational runbooks, backup routines, or disaster drills.
---

# Disaster Recovery, Point-in-Time Restore & Backup Management

> **Category**: Database, Supabase & Data Integrity  
> **Specialist Subagent**: `database-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Ensure continuous automated backups with Point-in-Time Recovery (PITR) capabilities.**: Ensure continuous automated backups with Point-in-Time Recovery (PITR) capabilities.
2. **Define and document Recovery Time Objectives (RTO < 1h) and Recovery Point Objectives (RPO < 15m).**: Define and document Recovery Time Objectives (RTO < 1h) and Recovery Point Objectives (RPO < 15m).
3. **Validate backup restoration integrity through automated periodic recovery drills.**: Validate backup restoration integrity through automated periodic recovery drills.

---

## 2. Standard Operating Procedures (SOP)

1. Verify automated daily backup snapshots and continuous WAL archiving are enabled in Supabase/PostgreSQL.
2. Document step-by-step restoration runbook in docs/architecture/disaster-recovery.md.
3. Automate periodic export of core configuration and schema definitions to secure cloud storage.
4. Execute dry-run restore into an isolated staging environment to verify backup validity.
5. Test data consistency and application boot against restored database snapshot.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
pg_dump -h localhost -U postgres -d postgres --schema-only -f schema-backup.sql
npx supabase db dump -f supabase-backup.sql
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never store unencrypted database backups in publicly accessible locations.
- **Guard**: Never rely on un-tested backups; an untested backup is not a backup.
- **Guard**: Ensure backup credentials and encryption keys are rotated and isolated.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify database dumps restore successfully into an empty PostgreSQL database.
- [ ] Verify restored database contains 100% of tables, views, functions, and RLS policies.
- [ ] Verify application connects to restored database and passes health checks.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `database-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
