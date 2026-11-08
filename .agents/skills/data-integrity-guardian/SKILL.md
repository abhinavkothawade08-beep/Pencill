---
name: data-integrity-guardian
description: >-
  Guarantee ACID transaction properties, enforce check constraints, prevent orphan records, and maintain cross-service data consistency. Use when designing critical financial, academic, or user progress data flows.
---

# Data Integrity & Transactional ACID Guardianship

> **Category**: Database, Supabase & Data Integrity  
> **Specialist Subagent**: `database-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Enforce strong data integrity invariants at the database engine level.**: Enforce strong data integrity invariants at the database engine level.
2. **Wrap multi-step state mutations in atomic database transactions (BEGIN ... COMMIT).**: Wrap multi-step state mutations in atomic database transactions (BEGIN ... COMMIT).
3. **Implement CHECK constraints, ENUM validations, and foreign key cascades.**: Implement CHECK constraints, ENUM validations, and foreign key cascades.

---

## 2. Standard Operating Procedures (SOP)

1. Define PostgreSQL CHECK constraints for range and format validations (e.g. score >= 0 AND score <= 100).
2. Enforce foreign key integrity preventing orphaned children when parent entities update or delete.
3. Wrap multi-table mutations in Supabase RPC functions executing within a single atomic transaction.
4. Implement optimistic concurrency control with version / updated_at timestamps.
5. Audit existing data periodically to detect and report any latent integrity anomalies.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npx tsx scripts/check-supabase-db.ts
npm test -- tests/data-integrity-*.test.ts
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never rely exclusively on client-side validation for critical data integrity rules.
- **Guard**: Avoid partial writes: if step 2 of a multi-step mutation fails, step 1 must roll back cleanly.
- **Guard**: Never bypass database constraints to patch bad incoming data.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify simulated transaction failures roll back completely without partial state commits.
- [ ] Verify database rejects invalid data violating CHECK or FOREIGN KEY constraints.
- [ ] Verify zero orphaned records exist in database audit scripts.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `database-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
