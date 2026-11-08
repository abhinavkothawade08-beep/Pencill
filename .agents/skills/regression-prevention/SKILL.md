---
name: regression-prevention
description: >-
  Calculate change blast radius, evaluate dependency ripple effects, and prevent functional regressions before merging changes. Use during the 9-step cycle before and after code modifications.
---

# Regression Blast Radius Mapping & Prevention

> **Category**: Automated Debugging & Root Cause Analysis  
> **Specialist Subagent**: `qa-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Map all direct and indirect dependencies affected by proposed code modifications.**: Map all direct and indirect dependencies affected by proposed code modifications.
2. **Enforce backward compatibility across API contracts, database schemas, and UI components.**: Enforce backward compatibility across API contracts, database schemas, and UI components.
3. **Verify that all pre-existing capabilities remain functional after code changes.**: Verify that all pre-existing capabilities remain functional after code changes.

---

## 2. Standard Operating Procedures (SOP)

1. Perform static dependency analysis on modified files to identify all importing consumers.
2. Trace database schema dependencies: verify queries, views, and migrations won't break existing data.
3. Formulate a regression test matrix encompassing all identified consumer components.
4. Execute the entire test suite (all 341+ tests) to guarantee zero side-effects.
5. Conduct manual or automated sanity checks on critical user journeys.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
git diff --name-only origin/main
npm test
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never assume a localized helper modification has zero blast radius.
- **Guard**: Never delete or mutate public function signatures without updating all call sites.
- **Guard**: Ensure items in deletion registries or cache layers are not resurrected or broken.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify 100% test pass rate across the full repository test suite.
- [ ] Verify all dependent components compile cleanly without signature mismatches.
- [ ] Verify no unhandled breaking changes exist in API request/response contracts.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `qa-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
