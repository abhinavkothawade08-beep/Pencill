---
name: dependency-conflict-resolver
description: >-
  Diagnose and resolve conflicting transitive dependencies, duplicate package versions, and peer dependency mismatches. Use when package installation fails or runtime symbol collisions occur.
---

# Dependency Collision & Peer Conflict Resolution

> **Category**: Automated Debugging & Root Cause Analysis  
> **Specialist Subagent**: `backend-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Diagnose hoisting conflicts, duplicate singleton packages (React, Next), and peer mismatches.**: Diagnose hoisting conflicts, duplicate singleton packages (React, Next), and peer mismatches.
2. **Align semver ranges in package.json to establish a cohesive dependency graph.**: Align semver ranges in package.json to establish a cohesive dependency graph.
3. **Guarantee deterministic installations across development and CI/CD pipelines.**: Guarantee deterministic installations across development and CI/CD pipelines.

---

## 2. Standard Operating Procedures (SOP)

1. Inspect the dependency tree using 'npm ls <package-name>' to trace conflicting versions.
2. Identify peer dependency requirements declared by conflicting libraries.
3. Use npm overrides or resolution blocks in package.json to force a compatible version where safe.
4. Re-generate package-lock.json cleanly and verify resolution integrity.
5. Run tests to ensure no runtime breakages resulted from version alignment.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npm ls <package-name>
npm ls --depth=2
npm explain <package-name>
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never use '--legacy-peer-deps' as a permanent fix in package scripts.
- **Guard**: Never allow multiple conflicting versions of React or React DOM to be bundled.
- **Guard**: Always check release notes for breaking changes before overriding transitive versions.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify 'npm ls' reports no invalid or extraneous packages.
- [ ] Verify 'npm test' and 'npm run build' succeed without resolution warnings.
- [ ] Verify only one instance of core libraries exists in the active bundle.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `backend-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
