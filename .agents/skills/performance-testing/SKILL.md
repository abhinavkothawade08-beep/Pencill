---
name: performance-testing
description: >-
  Benchmark system latency, measure server response times (p95, p99), profile memory usage, and detect bottlenecks under load. Use when assessing high-traffic endpoints, database query speeds, or heavy algorithmic pipelines.
---

# Performance Testing & Latency Profiling

> **Category**: Automated Testing & Verification QA  
> **Specialist Subagent**: `performance-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Measure throughput and latency distributions (p50, p95, p99) under simulated load.**: Measure throughput and latency distributions (p50, p95, p99) under simulated load.
2. **Identify CPU bottlenecks, memory leaks, and unbounded event loops.**: Identify CPU bottlenecks, memory leaks, and unbounded event loops.
3. **Ensure server response times remain within strict latency budgets (< 200ms p95).**: Ensure server response times remain within strict latency budgets (< 200ms p95).

---

## 2. Standard Operating Procedures (SOP)

1. Author performance benchmark scripts measuring execution time across varying payload sizes.
2. Run automated load testing using autocannon or k6 against API route handlers.
3. Profile Node.js process heap memory to detect lingering references or memory growth.
4. Measure database query latency under concurrent simulated connections.
5. Generate performance summary reports detailing throughput (req/sec) and latency percentiles.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npx autocannon -c 10 -d 10 http://localhost:3000/api/health
node --prof app.js
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never run aggressive load tests against live production databases without authorization.
- **Guard**: Ensure test environments mirror production hardware constraints when benchmarking.
- **Guard**: Reset database and cache state between benchmark runs to ensure reproducible results.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify p95 latency remains within defined SLA (< 200ms for APIs).
- [ ] Verify zero memory leak slope across 10,000 synthetic requests.
- [ ] Verify CPU utilization stabilizes cleanly under baseline traffic.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `performance-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
