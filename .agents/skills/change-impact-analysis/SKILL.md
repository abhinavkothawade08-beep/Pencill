---
name: change-impact-analysis
description: >-
  Analyze the ripple effects of proposed code changes across dependency trees, exported symbols, database contracts, and consumer routes. Use prior to refactoring core utilities, schemas, or shared types.
---

# Static Dependency Tracing & Change Impact Analysis

> **Category**: Deep System Verification, Safety & Acceptance  
> **Specialist Subagent**: `architect`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Identify 100% of upstream and downstream components affected by a proposed modification.**: Identify 100% of upstream and downstream components affected by a proposed modification.
2. **Detect breaking interface contract changes before code modification begins.**: Detect breaking interface contract changes before code modification begins.
3. **Formulate a comprehensive regression testing scope tailored to the change blast radius.**: Formulate a comprehensive regression testing scope tailored to the change blast radius.

---

## 2. Standard Operating Procedures (SOP)

1. Use static analysis or grep to find all import sites referencing the targeted symbol or module.
2. Trace transitive dependencies: identify secondary consumers that could be affected by behavior changes.
3. Check database contract dependencies: verify queries, views, and migrations relying on modified columns.
4. Document the complete Blast Radius Map listing affected files, routes, and services.
5. Define mandatory verification test list covering all identified dependents.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
git grep -l "<symbol-or-module>" src/
npx dependency-cruiser --include-only src
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never assume a change to a shared utility or type is 'safe' without checking all import call sites.
- **Guard**: Ensure exported API contracts maintain backward compatibility unless explicitly breaking version.
- **Guard**: Do not forget to audit test files that import and test the modified symbols.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify all consumer call sites compile cleanly against modified symbol signatures.
- [ ] Verify tests for all components in the blast radius are executed and pass 100%.
- [ ] Verify no unexpected runtime breaks occur across dependent routes.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `architect`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
