---
name: feature-acceptance-testing
description: >-
  Execute Behavior-Driven Development (BDD) feature acceptance tests using Given-When-Then specifications, validating user expectations. Use when verifying new feature releases and user story sign-offs.
---

# Behavior-Driven Feature Acceptance Testing (BDD)

> **Category**: Deep System Verification, Safety & Acceptance  
> **Specialist Subagent**: `qa-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Validate complete feature implementations against business acceptance criteria using BDD.**: Validate complete feature implementations against business acceptance criteria using BDD.
2. **Ensure all user stories and edge cases have corresponding automated acceptance tests.**: Ensure all user stories and edge cases have corresponding automated acceptance tests.
3. **Provide formal sign-off reports demonstrating 100% criteria fulfillment.**: Provide formal sign-off reports demonstrating 100% criteria fulfillment.

---

## 2. Standard Operating Procedures (SOP)

1. Translate user story acceptance criteria into Gherkin Given-When-Then scenarios.
2. Implement executable acceptance test specs in tests/ feature suites.
3. Given: set up initial authentic precondition state (authenticated user, seeded curriculum).
4. When: execute user action (click 'Start Quiz', submit answer, generate custom path).
5. Then: assert observable outcomes (score computed, streak updated, progress persisted).
6. Execute acceptance test suite and capture passing test evidence for release documentation.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npm test -- tests/*-acceptance.test.ts
npx tsx scripts/verify-builder-flow.js
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never mark an acceptance test as passed without executing real application code.
- **Guard**: Avoid testing trivial UI styling; focus on business rules, data persistence, and user workflows.
- **Guard**: Ensure acceptance tests run hermetically without depending on external un-mocked networks.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify 100% of Given-When-Then acceptance test scenarios pass.
- [ ] Verify user journeys reflect authentic pedagogical behavior without mock data.
- [ ] Verify formal acceptance sign-off is included in final mission deliverable.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `qa-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
