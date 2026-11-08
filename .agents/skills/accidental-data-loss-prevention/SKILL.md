---
name: accidental-data-loss-prevention
description: >-
  Guard against catastrophic data loss using soft-delete patterns, tombstone registries, confirmation barriers, and undo buffers. Use when implementing deletion endpoints, UI delete actions, or batch removals.
---

# Accidental Data Loss Prevention & Soft Deletion

> **Category**: Database, Supabase & Data Integrity  
> **Specialist Subagent**: `database-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Prevent irreversible data loss from accidental user clicks or buggy batch deletion scripts.**: Prevent irreversible data loss from accidental user clicks or buggy batch deletion scripts.
2. **Implement soft-delete patterns (deleted_at IS NOT NULL) with deletion registries.**: Implement soft-delete patterns (deleted_at IS NOT NULL) with deletion registries.
3. **Maintain offline-first tombstone registries to prevent resurrection during sync operations.**: Maintain offline-first tombstone registries to prevent resurrection during sync operations.

---

## 2. Standard Operating Procedures (SOP)

1. Implement soft-deletion in schemas by adding nullable deleted_at TIMESTAMPTZ column.
2. Record deleted item IDs in persistent deletionRegistry.ts on client and server.
3. Ensure query services filter out soft-deleted records by default (WHERE deleted_at IS NULL).
4. Implement UI confirmation barriers requiring explicit user confirmation before destructive actions.
5. Provide short undo grace windows (toast with 'Undo') before finalizing deletion state.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npm test -- tests/batch-delete-*.test.ts
npx tsx tests/verify_learning_and_quiz.js
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never execute raw unconstrained 'DELETE FROM table' SQL queries.
- **Guard**: Ensure background synchronization jobs never resurrect soft-deleted items stored in registries.
- **Guard**: Never hard-delete user data immediately without administrative safety checks.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify deleted entities disappear from UI while persisting safely in soft-delete state.
- [ ] Verify offline synchronization does not restore previously deleted items.
- [ ] Verify batch delete tests pass 100% with authorization checks verified.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `database-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
