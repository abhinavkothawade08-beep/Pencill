---
name: coderabbit-code-review
description: >-
  Conduct high-signal, line-by-line code reviews providing actionable review comments, architecture assessment, and PR summaries. Use when reviewing code changes, pull requests, or preparing releases.
---

# AI-Augmented Code Review & PR Summary

> **Category**: Code Review, Audit & Quality Assurance  
> **Specialist Subagent**: `code-reviewer`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Provide high-signal, actionable code review feedback without nitpicking trivial formatting.**: Provide high-signal, actionable code review feedback without nitpicking trivial formatting.
2. **Identify logic bugs, race conditions, edge-case oversights, and architectural inconsistencies.**: Identify logic bugs, race conditions, edge-case oversights, and architectural inconsistencies.
3. **Generate concise pull request summaries detailing changes, impact, and verification steps.**: Generate concise pull request summaries detailing changes, impact, and verification steps.

---

## 2. Standard Operating Procedures (SOP)

1. Inspect the git diff against the target branch (git diff origin/main).
2. Analyze changes across 5 dimensions: Correctness, Architecture, Security, Performance, and Tests.
3. Draft constructive line-by-line review comments with clear explanations and suggested fixes.
4. Formulate a structured PR summary: Overview, Key Changes, Verification Evidence, and Risks.
5. Highlight potential regressions or follow-up tasks for the engineering team.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
git diff origin/main
git status
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never provide vague feedback ('looks bad'); always explain why and provide a concrete solution.
- **Guard**: Do not duplicate linter feedback; focus on semantics, architecture, and edge cases.
- **Guard**: Never approve changes that lack automated test verification.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify all review findings are backed by specific code line references.
- [ ] Verify PR summary accurately captures 100% of modified files and logical changes.
- [ ] Verify suggested fixes adhere strictly to repository style and type safety.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `code-reviewer`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
