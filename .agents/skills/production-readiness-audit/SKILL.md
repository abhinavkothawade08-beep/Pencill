---
name: production-readiness-audit
description: >-
  Conduct comprehensive pre-launch production readiness reviews across security, reliability, scalability, observability, and compliance. Use before public releases, major version updates, or going live.
---

# Production Readiness Review & Launch Gatekeeper

> **Category**: DevOps, Infrastructure, Git & Observability  
> **Specialist Subagent**: `architect`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Verify the application satisfies all operational criteria required for production deployment.**: Verify the application satisfies all operational criteria required for production deployment.
2. **Assess system posture across 5 pillars**: Security, Reliability, Performance, Observability, and Recovery.
3. **Produce a formal Production Readiness Review (PRR) report with sign-off criteria.**: Produce a formal Production Readiness Review (PRR) report with sign-off criteria.

---

## 2. Standard Operating Procedures (SOP)

1. Audit Security: RLS policies, zero client secrets, rate-limiting, CORS, HTTPS enforcement.
2. Audit Reliability: graceful degradation, automated database backups, health check endpoints.
3. Audit Performance: Core Web Vitals, API response latency, query execution plans, bundle sizes.
4. Audit Observability: structured logging, error tracking, metric dashboards, uptime alerts.
5. Audit Recovery: disaster recovery runbook, rollback procedure, data loss prevention.
6. Issue formal Go / No-Go recommendation with remediation checklist for any gaps.

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

- **Guard**: Never authorize a production release if any security or data integrity check fails.
- **Guard**: Do not launch without verified rollback and database restore procedures.
- **Guard**: Ensure all third-party API quotas and billing budgets are verified before launch.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify all 5 production readiness pillars receive green passing scores.
- [ ] Verify full verification gate (TypeScript, lint, tests) passes with 100% success.
- [ ] Verify production readiness audit document is completed and signed off.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `architect`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
