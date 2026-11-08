---
name: database-architecture
description: >-
  Design normalized PostgreSQL database schemas, entity-relationship models, foreign key constraints, cascade rules, and indexes. Use when designing new tables, modeling domain relations, or restructuring databases.
---

# Relational Database Architecture & Schema Design

> **Category**: Database, Supabase & Data Integrity  
> **Specialist Subagent**: `database-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Model relational data structures adhering to 3rd Normal Form (3NF) principles.**: Model relational data structures adhering to 3rd Normal Form (3NF) principles.
2. **Define foreign key constraints with explicit ON DELETE / ON UPDATE cascade behaviors.**: Define foreign key constraints with explicit ON DELETE / ON UPDATE cascade behaviors.
3. **Design strategic indexes (B-tree, GIN, partial indexes) to support high-performance queries.**: Design strategic indexes (B-tree, GIN, partial indexes) to support high-performance queries.

---

## 2. Standard Operating Procedures (SOP)

1. Analyze domain entities and define relational schema definitions in supabase/migrations/.
2. Specify primary keys (UUIDv4 / gen_random_uuid()), foreign keys, and unique constraints.
3. Define explicit cascade policies: RESTRICT for critical references, CASCADE for owned child entities.
4. Add indexes on foreign key columns and frequently filtered / sorted attributes.
5. Document entity relationships and table contracts in docs/architecture/database-schema.md.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npx supabase db lint
npx tsx scripts/check-supabase-db.ts
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never create tables without primary key constraints.
- **Guard**: Avoid un-indexed foreign key columns that cause table-scan locks during deletes.
- **Guard**: Never execute destructive DROP TABLE operations without backup and user approval.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify migration scripts apply cleanly on a blank PostgreSQL instance.
- [ ] Verify referential integrity blocks orphaned record insertions.
- [ ] Verify schema documentation matches implemented database tables exactly.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `database-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
