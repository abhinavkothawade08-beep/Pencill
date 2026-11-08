---
name: software-architecture
description: >-
  Formulate resilient, scalable software architectures, domain-driven design models, and modular system boundaries. Use when designing new systems, refactoring architectural boundaries, or writing Architecture Decision Records (ADRs).
---

# Software Architecture & System Design

> **Category**: Core Full-Stack & Software Architecture  
> **Specialist Subagent**: `architect`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Define clean bounded contexts, domain models, and service interfaces.**: Define clean bounded contexts, domain models, and service interfaces.
2. **Evaluate architectural trade-offs between monolithic modularity and microservices.**: Evaluate architectural trade-offs between monolithic modularity and microservices.
3. **Enforce unidirectional data flows and clear dependency inversion principles.**: Enforce unidirectional data flows and clear dependency inversion principles.

---

## 2. Standard Operating Procedures (SOP)

1. Analyze business requirements and map core domain models, aggregates, and value objects.
2. Document system architecture, component contracts, and data topology in docs/architecture/.
3. Produce Architecture Decision Records (ADRs) detailing context, trade-offs, and consequences.
4. Enforce dependency boundaries: domain logic must never depend on external transport layers.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npx dependency-cruiser --validate src
git log --oneline --graph
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Avoid cyclic dependencies between service packages and UI modules.
- **Guard**: Avoid premature microservice distribution when modular monolith boundaries suffice.
- **Guard**: Never introduce architectural changes without verifying backward compatibility.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify system architecture passes dependency-cruiser cycle audits.
- [ ] Verify all domain invariants are encapsulated within validated service boundaries.
- [ ] Verify ADR is reviewed and signed off against business requirements.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `architect`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
