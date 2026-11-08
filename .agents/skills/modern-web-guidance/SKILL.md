---
name: modern-web-guidance
description: >-
  Architect and build modern web applications leveraging modern standards, progressive enhancement, HTTP/3, streaming SSR, and edge compute. Use when evaluating web capabilities, designing client-server boundaries, or upgrading legacy web architectures.
---

# Modern Web Engineering Guidance

> **Category**: Core Full-Stack & Software Architecture  
> **Specialist Subagent**: `frontend-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Enforce modern standards-compliant web architectures (WHATWG, W3C, RFC 9114).**: Enforce modern standards-compliant web architectures (WHATWG, W3C, RFC 9114).
2. **Optimize data-fetching topologies, streaming SSR boundaries, and hydration contracts.**: Optimize data-fetching topologies, streaming SSR boundaries, and hydration contracts.
3. **Maximize Core Web Vitals via modern layout, asset delivery, and caching strategies.**: Maximize Core Web Vitals via modern layout, asset delivery, and caching strategies.

---

## 2. Standard Operating Procedures (SOP)

1. Audit target application architecture against modern web standards and baseline browser compatibility.
2. Partition client vs server responsibilities using React Server Components (RSC) and HTTP streaming.
3. Implement edge-ready middleware for localized authentication, routing, and geo-distributed caching.
4. Enforce zero-blocking scripts, responsive responsive media delivery, and resource hints (preconnect, dns-prefetch).

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npx lighthouse --chrome-flags="--headless" http://localhost:3000 --output=json
npx @next/bundle-analyzer
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never ship unminified, blocking vendor scripts in document head.
- **Guard**: Avoid hydration mismatches by synchronizing server and client rendering baselines.
- **Guard**: Prevent client-side bundling of server-only secrets or database clients.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify zero hydration errors in browser console.
- [ ] Verify 90+ Lighthouse Performance and Best Practices score.
- [ ] Verify all interactive elements function with progressive enhancement where applicable.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `frontend-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
