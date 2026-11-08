---
name: repository-auditor
description: >-
  Perform holistic audits across repository health: file structures, dependency vulnerabilities, test suites, documentation, and security hygiene. Use when assessing repository quality or conducting reviews.
---

# Comprehensive Repository Health & Compliance Audit

> **Category**: Technical Documentation, Product & Repository Ops  
> **Specialist Subagent**: `code-reviewer`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Evaluate entire repository against industry and project engineering standards.**: Evaluate entire repository against industry and project engineering standards.
2. **Audit 5 core dimensions**: Code Health, Security, Test Coverage, Architecture, and Docs.
3. **Produce actionable Repository Audit Reports with prioritized remediation recommendations.**: Produce actionable Repository Audit Reports with prioritized remediation recommendations.

---

## 2. Standard Operating Procedures (SOP)

1. Inspect directory structure for adherence to project standards (src/, tests/, docs/, supabase/).
2. Audit dependencies: check for outdated packages, security vulnerabilities, and license compliance.
3. Audit test suite: measure total test count, suite duration, pass rate, and coverage.
4. Audit security: scan for hardcoded secrets, open endpoints, and missing RLS policies.
5. Compile findings into structured AUDIT/REPOSITORY_AUDIT.md report.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npm audit
npx tsc --noEmit
npm test
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Do not modify application code during an audit phase; audit first, plan second, execute third.
- **Guard**: Ensure findings cite exact file paths and line numbers.
- **Guard**: Prioritize findings objectively by severity (Critical, High, Medium, Low).

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify audit report provides complete, evidence-based assessment of repository health.
- [ ] Verify all automated check outputs (tsc, lint, audit, tests) are included.
- [ ] Verify actionable remediation roadmap is provided for all identified defects.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `code-reviewer`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
