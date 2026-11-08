---
name: monitoring-observability
description: >-
  Implement application performance monitoring, OpenTelemetry instrumentation, structured metrics, synthetic probes, and alerting thresholds. Use when setting up observability, tracing, or uptime monitoring.
---

# Application Monitoring, Metrics & Observability

> **Category**: DevOps, Infrastructure, Git & Observability  
> **Specialist Subagent**: `backend-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Achieve full-stack observability across frontend and backend services.**: Achieve full-stack observability across frontend and backend services.
2. **Collect structured metrics**: request count, error rates, p95/p99 latency, and saturation.
3. **Configure automated alerting on SLO breaches, 5xx error spikes, and crash loops.**: Configure automated alerting on SLO breaches, 5xx error spikes, and crash loops.

---

## 2. Standard Operating Procedures (SOP)

1. Implement /api/health endpoint returning database connectivity, memory usage, and uptime.
2. Instrument server route handlers with correlation IDs (x-request-id) across request lifecycles.
3. Track custom business metrics (paths generated, quizzes completed, search latency).
4. Configure synthetic health check probes pinging public endpoints every 60 seconds.
5. Define alerting rules: notify on 5xx error rate > 1% or latency > 1000ms for 3 consecutive minutes.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
curl -s http://localhost:3000/api/health
npm test -- tests/health-*.test.ts
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Ensure monitoring payloads do not leak customer PII or sensitive request bodies.
- **Guard**: Avoid high-cardinality metric labels (e.g. user_id as metric tag) that crash metric databases.
- **Guard**: Tune alert thresholds to prevent alert fatigue from transient network hiccups.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify /api/health returns HTTP 200 with accurate status metrics.
- [ ] Verify synthetic probes report 100% availability during normal operation.
- [ ] Verify simulated server errors trigger alert notifications promptly.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `backend-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
