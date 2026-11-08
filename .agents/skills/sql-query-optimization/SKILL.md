---
name: sql-query-optimization
description: >-
  Analyze slow PostgreSQL queries using EXPLAIN ANALYZE, optimize indexing strategies, eliminate sequential scans, and tune joins. Use when optimizing database latency, search queries, or high-volume endpoints.
---

# SQL Query Optimization & Execution Plan Analysis

> **Category**: Database, Supabase & Data Integrity  
> **Specialist Subagent**: `database-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Diagnose slow queries using EXPLAIN (ANALYZE, BUFFERS, VERBOSE) execution plans.**: Diagnose slow queries using EXPLAIN (ANALYZE, BUFFERS, VERBOSE) execution plans.
2. **Replace expensive sequential scans with targeted Index Scans and Bitmap Index Scans.**: Replace expensive sequential scans with targeted Index Scans and Bitmap Index Scans.
3. **Optimize complex JOINs, CTEs, subqueries, and aggregation pipelines.**: Optimize complex JOINs, CTEs, subqueries, and aggregation pipelines.

---

## 2. Standard Operating Procedures (SOP)

1. Capture the slow SQL query and run EXPLAIN ANALYZE in PostgreSQL or Supabase SQL editor.
2. Identify high-cost operations: Sequential Scan on large tables, Nested Loop with large outer rows, Hash Join spills.
3. Create covering indexes, composite indexes, or partial indexes tailored to query WHERE and ORDER BY clauses.
4. Refactor correlated subqueries into efficient JOINs or Common Table Expressions (CTEs).
5. Re-run EXPLAIN ANALYZE to verify reduction in total execution time and buffer reads.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM courses WHERE is_published = true;
npx tsx scripts/check-supabase-db.ts
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Avoid over-indexing tables; excessive indexes degrade INSERT and UPDATE write performance.
- **Guard**: Never optimize queries based on single-row test databases; test with realistic volume datasets.
- **Guard**: Do not use SELECT * in production queries; select only explicitly required columns.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify query execution time is reduced to < 50ms for standard OLTP operations.
- [ ] Verify execution plan utilizes Index Scan instead of Sequential Scan on large tables.
- [ ] Verify query results remain identical before and after optimization.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `database-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
