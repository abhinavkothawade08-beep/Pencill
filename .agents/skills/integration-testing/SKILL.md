---
name: integration-testing
description: >-
  Validate data flow, state synchronization, and contract compliance across multiple interacting modules, databases, and services. Use when testing service-to-database, route-to-service, or cache-to-persistence boundaries.
---

# Multi-Module Integration Testing & Boundary Contracts

> **Category**: Automated Testing & Verification QA  
> **Specialist Subagent**: `qa-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Verify seamless collaboration between multiple architectural layers.**: Verify seamless collaboration between multiple architectural layers.
2. **Validate persistence and retrieval flows with real database transactions or test databases.**: Validate persistence and retrieval flows with real database transactions or test databases.
3. **Ensure rollback mechanisms clean up test data after execution.**: Ensure rollback mechanisms clean up test data after execution.

---

## 2. Standard Operating Procedures (SOP)

1. Configure test harness with test database connection and initial seed state.
2. Invoke service methods that orchestrate multiple internal components.
3. Assert that database state, cache layers, and return objects match expected contracts.
4. Test transaction rollback on simulated intermediate failure.
5. Tear down and clean up created test records in afterEach / after hooks.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npm test -- tests/integration/*.test.ts
npx tsx --test tests/verify_learning_and_quiz.js
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never run destructive integration tests against production databases.
- **Guard**: Ensure all test data is tagged with unique test run IDs to prevent cross-test contamination.
- **Guard**: Handle async cleanup properly to prevent leaked open database connections.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify integration suites run to completion with zero leaked connections.
- [ ] Verify database state is verified before and after operations.
- [ ] Verify all assertions pass across positive and negative interaction flows.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `qa-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
