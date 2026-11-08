---
name: ci-cd-engineer
description: >-
  Design and optimize Continuous Integration and Continuous Deployment pipelines with dependency caching, parallel test matrices, and automated staging previews. Use when setting up or accelerating deployment pipelines.
---

# CI/CD Pipeline Engineering & Automated Build Systems

> **Category**: DevOps, Infrastructure, Git & Observability  
> **Specialist Subagent**: `backend-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Build fast, resilient CI/CD pipelines with sub-5-minute execution times.**: Build fast, resilient CI/CD pipelines with sub-5-minute execution times.
2. **Implement smart dependency caching (node_modules, Next.js build cache) across CI runs.**: Implement smart dependency caching (node_modules, Next.js build cache) across CI runs.
3. **Automate preview deployments for pull requests and zero-downtime production releases.**: Automate preview deployments for pull requests and zero-downtime production releases.

---

## 2. Standard Operating Procedures (SOP)

1. Structure CI pipeline into distinct stages: Install -> Lint -> TypeCheck -> Test -> Build.
2. Configure cache actions for npm / pnpm packages and Next.js compilation cache (.next/cache).
3. Run unit tests and integration tests in parallel jobs to minimize overall pipeline latency.
4. Generate deployable build artifacts or Docker images upon successful pipeline completion.
5. Trigger automated smoke tests against deployed preview environments before promotion.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npm run build
npm test
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never allow build pipeline to deploy if any preceding test or typecheck stage fails.
- **Guard**: Ensure CI environment variables match required production shapes without containing prod secrets.
- **Guard**: Avoid unbounded cache sizes that slow down cache restoration.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify pipeline runs end-to-end and outputs green build status.
- [ ] Verify build cache significantly accelerates repeat CI execution times.
- [ ] Verify deploy artifact is hermetic and ready for production deployment.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `backend-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
