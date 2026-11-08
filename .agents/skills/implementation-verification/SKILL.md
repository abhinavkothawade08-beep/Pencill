---
name: implementation-verification
description: >-
  Validate implemented code against initial PRD specifications, acceptance criteria, and user stories. Use before declaring feature implementation complete or handing over to stakeholders.
---

# Implementation-to-Spec Verification & Acceptance Sign-Off

> **Category**: Technical Documentation, Product & Repository Ops  
> **Specialist Subagent**: `qa-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Verify 100% of requirements and acceptance criteria in the PRD are fully implemented.**: Verify 100% of requirements and acceptance criteria in the PRD are fully implemented.
2. **Ensure zero gaps between planned specifications and actual software behavior.**: Ensure zero gaps between planned specifications and actual software behavior.
3. **Deliver transparent, verifiable evidence for every acceptance criterion.**: Deliver transparent, verifiable evidence for every acceptance criterion.

---

## 2. Standard Operating Procedures (SOP)

1. Review the original PRD / task plan and extract all acceptance criteria checklist items.
2. Map each criterion to concrete implementation files and corresponding automated tests.
3. Execute automated tests proving each criterion passes with green assertion results.
4. Manually verify UI flows, interactive states, and edge case behaviors.
5. Document Verification Matrix linking Requirement -> Implementation -> Test -> Status.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npm test
npx tsc --noEmit
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never mark an acceptance criterion as complete without corresponding test evidence.
- **Guard**: Do not redefine or water down acceptance criteria to match incomplete implementations.
- **Guard**: Ensure all negative edge cases and error states are verified alongside happy paths.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify 100% of acceptance criteria items are marked as Verified.
- [ ] Verify all automated verification test suites pass cleanly.
- [ ] Verify implementation verification matrix is documented in final report.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `qa-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
