---
name: cost-optimization
description: >-
  Optimize cloud computing resources, minimize LLM token consumption, eliminate redundant API calls, and tune caching. Use when auditing operational expenses, API quotas, or cloud billing.
---

# Cloud Infrastructure & AI Cost Optimization

> **Category**: Deep System Verification, Safety & Acceptance  
> **Specialist Subagent**: `performance-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Minimize operational costs across cloud infrastructure, databases, and third-party APIs.**: Minimize operational costs across cloud infrastructure, databases, and third-party APIs.
2. **Reduce LLM token expenditure through prompt compression, response caching, and model routing.**: Reduce LLM token expenditure through prompt compression, response caching, and model routing.
3. **Eliminate redundant database reads and network calls via effective edge and local caching.**: Eliminate redundant database reads and network calls via effective edge and local caching.

---

## 2. Standard Operating Procedures (SOP)

1. Audit LLM token usage: identify high-cost prompts and compress instructions without losing precision.
2. Implement prompt caching and response caching for frequently requested syllabi and topics.
3. Optimize database queries: add covering indexes to reduce compute and memory instance requirements.
4. Configure cloud resource scaling: set auto-scaling minimums to 0 on non-production environments.
5. Track and report cost-per-active-user metrics across all services.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npx tsx scripts/compile-taxonomy.js
npm test
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never sacrifice data integrity, user security, or software correctness for minor cost savings.
- **Guard**: Avoid aggressive caching that serves stale or incorrect user-specific data.
- **Guard**: Never disable critical monitoring or backup infrastructure to save costs.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify token consumption per curriculum generation is reduced by > 30%.
- [ ] Verify cache hit ratio for common topics exceeds 75%.
- [ ] Verify system performance and response latency remain within target SLAs.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `performance-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
