---
name: deployment-engineer
description: >-
  Execute safe production deployments to Vercel, Cloud Run, or container environments using blue-green rollouts, canary deployments, and automated health checks. Use when deploying releases or verifying deployments.
---

# Production Deployment Engineering & Zero-Downtime Rollouts

> **Category**: DevOps, Infrastructure, Git & Observability  
> **Specialist Subagent**: `backend-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Execute zero-downtime production deployments with immediate rollback capabilities.**: Execute zero-downtime production deployments with immediate rollback capabilities.
2. **Verify post-deployment application health via automated smoke tests and health checks.**: Verify post-deployment application health via automated smoke tests and health checks.
3. **Manage release tags, changelogs, and environment configuration across staging and prod.**: Manage release tags, changelogs, and environment configuration across staging and prod.

---

## 2. Standard Operating Procedures (SOP)

1. Verify all pre-deployment verification gates pass: tests, lint, TypeScript checks.
2. Deploy new release to staging or preview environment; execute automated smoke test suite.
3. Perform blue-green or rolling deployment to production traffic.
4. Monitor application health checks (/api/health) and error rates for 5 minutes post-rollout.
5. If error rate exceeds threshold (> 0.1%), trigger automated rollback to previous stable commit.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npx vercel --prod
curl -f http://localhost:3000/api/health
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never deploy directly to production without verifying on staging/preview first.
- **Guard**: Never perform deployments during peak traffic hours or without an on-call engineer.
- **Guard**: Ensure database schema migrations are deployed and verified before deploying dependent code.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify deployment endpoint returns HTTP 200 on health check probes.
- [ ] Verify all critical user paths function properly in the live production environment.
- [ ] Verify error tracking dashboards report baseline error rates post-deployment.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `backend-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
