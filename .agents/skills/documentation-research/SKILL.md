---
name: documentation-research
description: >-
  Perform authoritative documentation lookups across upstream SDKs, RFC standards, library change logs, and API specifications. Use when investigating new libraries, verifying API contracts, or researching breaking changes.
---

# Technical Documentation Research & Synthesis

> **Category**: Core Full-Stack & Software Architecture  
> **Specialist Subagent**: `research`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Retrieve and verify ground-truth documentation from official SDKs and vendor docs.**: Retrieve and verify ground-truth documentation from official SDKs and vendor docs.
2. **Identify version-specific breaking changes, deprecation notices, and migration paths.**: Identify version-specific breaking changes, deprecation notices, and migration paths.
3. **Synthesize complex technical specifications into concise, actionable implementation guidance.**: Synthesize complex technical specifications into concise, actionable implementation guidance.

---

## 2. Standard Operating Procedures (SOP)

1. Identify the exact package, version, and official documentation source.
2. Use targeted searches across official documentation (or documentation MCP servers when available).
3. Inspect upstream type definitions (d.ts) directly in node_modules to verify exact method signatures.
4. Extract code examples, configuration keys, and error contracts into actionable notes.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npm info <package-name> versions --json
npm view <package-name> dist-tags
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never rely on outdated tutorials or unverified forum snippets for critical API contracts.
- **Guard**: Never assume API signatures without checking installed type definitions.
- **Guard**: Always check the repository's package.json to match the exact installed semver range.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify API calls and signatures match the exact installed package version in package.json.
- [ ] Verify zero deprecated method warnings during build or execution.
- [ ] Verify research findings are documented with authoritative source links.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `research`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
