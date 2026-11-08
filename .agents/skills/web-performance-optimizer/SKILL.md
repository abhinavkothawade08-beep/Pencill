---
name: web-performance-optimizer
description: >-
  Optimize Largest Contentful Paint (LCP), Interaction to Next Paint (INP), and Cumulative Layout Shift (CLS) through asset optimization, code splitting, and caching. Use when auditing site speed or optimizing page load times.
---

# Core Web Vitals & Web Performance Optimization

> **Category**: Frontend, UI/UX, DevTools & Performance  
> **Specialist Subagent**: `performance-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Achieve green Core Web Vitals thresholds**: LCP < 2.5s, INP < 200ms, CLS < 0.1.
2. **Optimize JavaScript bundle sizes via dynamic imports, code splitting, and tree shaking.**: Optimize JavaScript bundle sizes via dynamic imports, code splitting, and tree shaking.
3. **Accelerate media delivery via next/image, modern formats (WebP/AVIF), and CDN caching.**: Accelerate media delivery via next/image, modern formats (WebP/AVIF), and CDN caching.

---

## 2. Standard Operating Procedures (SOP)

1. Audit page performance using Lighthouse and Web Vitals profiling tools.
2. Optimize LCP: prioritize hero image preloading (priority attribute), preload critical fonts, eliminate render-blocking CSS.
3. Optimize INP: break long JavaScript tasks (> 50ms) using requestIdleCallback or web workers.
4. Optimize CLS: reserve layout dimensions (width/height or aspect-ratio) for images, ads, and embeds.
5. Analyze bundle composition with @next/bundle-analyzer to eliminate bloated dependencies.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npx lighthouse http://localhost:3000 --view
npx @next/bundle-analyzer
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never lazy-load the LCP hero image; hero media must be preloaded with high priority.
- **Guard**: Avoid loading giant third-party tracking scripts that degrade main thread responsiveness.
- **Guard**: Ensure web font display is configured with font-display: swap to prevent FOIT.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify Lighthouse Performance score achieves 90+.
- [ ] Verify LCP < 2.5s and CLS < 0.1 on simulated mobile 4G network throttling.
- [ ] Verify bundle analyzer confirms elimination of redundant vendor chunks.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `performance-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
