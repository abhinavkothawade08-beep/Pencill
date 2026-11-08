---
name: project-documentation
description: >-
  Author and maintain comprehensive system documentation, API references, Architecture Decision Records (ADRs), and onboarding guides. Use when documenting new modules, API changes, or system designs.
---

# Project Documentation & Architecture Decision Records

> **Category**: Technical Documentation, Product & Repository Ops  
> **Specialist Subagent**: `architect`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Maintain clear, accurate, and up-to-date documentation across docs/ and README.md.**: Maintain clear, accurate, and up-to-date documentation across docs/ and README.md.
2. **Document architectural decisions using standard ADR templates (Context, Decision, Consequences).**: Document architectural decisions using standard ADR templates (Context, Decision, Consequences).
3. **Ensure code docstrings and README instructions match implemented software behavior.**: Ensure code docstrings and README instructions match implemented software behavior.

---

## 2. Standard Operating Procedures (SOP)

1. Identify undocumented components, changed API contracts, or new architectural patterns.
2. Create ADR in docs/architecture/adr/ (e.g. 0001-universal-builder-architecture.md).
3. Update API documentation in docs/api/ with request/response schemas and example cURL calls.
4. Keep README.md updated with setup commands, environment requirements, and test instructions.
5. Add JSDoc/TSDoc comments on exported functions, types, and interfaces.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
git status
npm test
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never commit out-of-date or contradictory documentation that misleads developers.
- **Guard**: Avoid documenting obvious implementation trivialities; focus on rationale, constraints, and contracts.
- **Guard**: Preserve all existing unrelated documentation when updating docs.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify all documentation links, commands, and code samples are valid and functional.
- [ ] Verify ADR clearly explains trade-offs and alternative designs considered.
- [ ] Verify documentation compiles cleanly in markdown linters.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `architect`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
