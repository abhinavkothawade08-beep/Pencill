---
name: dependency-management
description: >-
  Manage package dependencies, resolve peer conflicts, maintain lockfile integrity, and audit security vulnerabilities. Use when adding packages, upgrading libraries, or fixing npm audit warnings.
---

# Dependency Management & Vulnerability Auditing

> **Category**: Core Full-Stack & Software Architecture  
> **Specialist Subagent**: `backend-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Maintain lockfile integrity (package-lock.json / pnpm-lock.yaml) with deterministic resolution.**: Maintain lockfile integrity (package-lock.json / pnpm-lock.yaml) with deterministic resolution.
2. **Audit and remediate security vulnerabilities reported by package managers.**: Audit and remediate security vulnerabilities reported by package managers.
3. **Prevent dependency bloat, duplicate packages, and incompatible peer dependencies.**: Prevent dependency bloat, duplicate packages, and incompatible peer dependencies.

---

## 2. Standard Operating Procedures (SOP)

1. Audit existing dependencies using 'npm audit' to identify high/critical security advisories.
2. Evaluate package candidates for bundle size, maintenance activity, and security posture.
3. Install required dependencies with strict semver constraints matching project standards.
4. Verify lockfile cleanliness and resolve any peer dependency collisions cleanly.
5. Execute full test suite to guarantee zero regression after dependency updates.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npm audit
npm ls --depth=1
npm outdated
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never install unverified, obscure, or malicious third-party packages.
- **Guard**: On Windows, follow sandbox rules for package manager commands (e.g. pnpm changes outside sandbox).
- **Guard**: Never use '--force' or '--legacy-peer-deps' blindly without resolving the root conflict.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify 'npm audit' reports 0 high/critical vulnerabilities.
- [ ] Verify lockfile is committed and clean in git status.
- [ ] Verify full application build and test suite pass without resolution errors.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `backend-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
