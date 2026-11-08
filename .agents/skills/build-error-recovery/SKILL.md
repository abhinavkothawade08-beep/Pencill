---
name: build-error-recovery
description: >-
  Diagnose and repair build failures across Next.js, Webpack, Turbopack, Babel, and TypeScript toolchains. Use when 'npm run build' or Next.js compilation fails.
---

# Build Graph Recovery & Compilation Repair

> **Category**: Automated Debugging & Root Cause Analysis  
> **Specialist Subagent**: `backend-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Identify and resolve bundling errors, module resolution failures, and circular build cycles.**: Identify and resolve bundling errors, module resolution failures, and circular build cycles.
2. **Fix Next.js App Router route segment export conflicts and server/client boundary collisions.**: Fix Next.js App Router route segment export conflicts and server/client boundary collisions.
3. **Ensure fast, reproducible, clean production builds.**: Ensure fast, reproducible, clean production builds.

---

## 2. Standard Operating Procedures (SOP)

1. Execute the build command and capture the full compilation trace.
2. Inspect the failure stage: module resolution, syntax parsing, tree-shaking, or static page generation.
3. Resolve broken file paths, missing aliases, or incorrect package exports in tsconfig.json.
4. Separate server-only dependencies from client bundles using 'server-only' package.
5. Execute a clean build after removing transient cache directories (.next, dist, etc.).

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npm run build
npx next build
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Do not commit build artifacts (.next/, dist/) into version control.
- **Guard**: Do not disable webpack or Next.js optimizations to work around bundle errors.
- **Guard**: Avoid dynamic require() statements that break static module analysis.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify 'npm run build' completes with exit code 0.
- [ ] Verify static and dynamic routes generate without errors during pre-rendering.
- [ ] Verify total bundle size is within acceptable performance budgets.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `backend-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
