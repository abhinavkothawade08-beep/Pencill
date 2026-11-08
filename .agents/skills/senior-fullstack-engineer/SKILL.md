---
name: senior-fullstack-engineer
description: >-
  Lead end-to-end full-stack software development with strict architectural separation of concerns, resilient backend services, and high-fidelity frontends. Use when delivering comprehensive features spanning database, API, and UI layers.
---

# Senior Full-Stack Systems Engineering

> **Category**: Core Full-Stack & Software Architecture  
> **Specialist Subagent**: `backend-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Design and deliver vertically integrated full-stack features from schema to UI.**: Design and deliver vertically integrated full-stack features from schema to UI.
2. **Guarantee strict type-safety across client-server-database boundaries.**: Guarantee strict type-safety across client-server-database boundaries.
3. **Ensure resilient error propagation and intuitive user recovery workflows.**: Ensure resilient error propagation and intuitive user recovery workflows.

---

## 2. Standard Operating Procedures (SOP)

1. Model domain entities in database schemas with foreign keys, indexes, and RLS policies.
2. Construct type-safe backend services encapsulating domain business logic in src/services/.
3. Expose thin REST API route handlers with Zod validation and structured error envelopes.
4. Build high-fidelity UI components implementing 4 discrete states: loading, empty, error, populated.
5. Write integration tests covering the end-to-end user lifecycle across all layers.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npx tsc --noEmit
npm run lint
npm test
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never fabricate mock data in production pathways.
- **Guard**: Never expose database credentials or service-role keys to client components.
- **Guard**: Never allow unhandled promise rejections or unvalidated query parameters.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify end-to-end data flow passes integration tests with real persistence.
- [ ] Verify UI correctly transitions between loading, populated, and error states.
- [ ] Verify zero TypeScript or ESLint warnings.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `backend-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
