---
name: pull-request-review
description: >-
  Evaluate pull requests for atomic changesets, conventional commit messages, test coverage, and release readiness. Use when reviewing PRs or preparing release branches.
---

# Pull Request Verification & Merge Gatekeeper

> **Category**: Code Review, Audit & Quality Assurance  
> **Specialist Subagent**: `code-reviewer`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Ensure pull requests are focused, cohesive, and follow conventional commit standards.**: Ensure pull requests are focused, cohesive, and follow conventional commit standards.
2. **Verify that every PR includes comprehensive automated tests covering the changes.**: Verify that every PR includes comprehensive automated tests covering the changes.
3. **Enforce mandatory merge criteria before approving pull requests.**: Enforce mandatory merge criteria before approving pull requests.

---

## 2. Standard Operating Procedures (SOP)

1. Verify PR title and description adhere to Conventional Commits (feat, fix, refactor, test, docs).
2. Inspect commit history: ensure commits are logical, atomic, and free of temporary commits.
3. Review the automated CI check results: verify build, lint, and test suites are all green.
4. Check documentation updates: verify that API docs, README, and ADRs are updated if needed.
5. Provide a clear approval or request for changes with detailed, reproducible points.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
git log -n 5 --oneline
git diff --stat origin/main
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never approve a pull request with failing or skipped automated tests.
- **Guard**: Avoid merging large, unfocused mega-PRs that combine unrelated changes.
- **Guard**: Never approve PRs containing secrets, sensitive tokens, or temporary hacks.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify all automated CI checks pass without errors.
- [ ] Verify PR checklist is completely fulfilled.
- [ ] Verify git branch is rebased cleanly onto target branch.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `code-reviewer`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
