---
name: prd-architecture-generator
description: >-
  Transform high-level feature requirements into detailed Product Requirements Documents (PRDs), user stories, acceptance criteria, and system specifications. Use when planning major features or releases.
---

# PRD & Technical Architecture Synthesis

> **Category**: Technical Documentation, Product & Repository Ops  
> **Specialist Subagent**: `architect`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Translate ambiguous feature requests into rigorous, unambiguous Product Requirements Documents.**: Translate ambiguous feature requests into rigorous, unambiguous Product Requirements Documents.
2. **Define comprehensive user personas, user stories, and Gherkin-style acceptance criteria.**: Define comprehensive user personas, user stories, and Gherkin-style acceptance criteria.
3. **Formulate technical architecture blueprints mapping required schemas, APIs, and UI views.**: Formulate technical architecture blueprints mapping required schemas, APIs, and UI views.

---

## 2. Standard Operating Procedures (SOP)

1. Analyze stakeholder goals, target audience, and business context.
2. Structure PRD: Problem Statement, Target Personas, User Stories, Functional Requirements, Non-Functional Requirements.
3. Formulate verifiable acceptance criteria for every feature using Given-When-Then syntax.
4. Produce Technical Architecture Blueprint: Schema Changes, API Contracts, Component Hierarchy, and Security Plan.
5. Review PRD with stakeholders and secure architectural sign-off before implementation.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
git status
npx tsc --noEmit
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never proceed to implementation on complex features without an approved PRD / plan.
- **Guard**: Avoid vague acceptance criteria ('system must be fast'); use measurable metrics (< 200ms p95).
- **Guard**: Ensure out-of-scope items are explicitly documented to prevent scope creep.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify PRD covers 100% of functional requirements and edge cases.
- [ ] Verify acceptance criteria are testable via automated test assertions.
- [ ] Verify technical architecture aligns with existing codebase patterns.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `architect`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
