---
name: github-expert
description: >-
  Manage GitHub repositories, configure GitHub Actions CI/CD workflows, enforce branch protections, and automate issue/PR triage. Use when setting up repository governance, CI pipelines, or release workflows.
---

# GitHub Platform Operations & Automation

> **Category**: DevOps, Infrastructure, Git & Observability  
> **Specialist Subagent**: `backend-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Configure branch protection rules requiring status checks and reviews before merge.**: Configure branch protection rules requiring status checks and reviews before merge.
2. **Author automated GitHub Actions workflows for testing, linting, and continuous delivery.**: Author automated GitHub Actions workflows for testing, linting, and continuous delivery.
3. **Standardize issue and pull request templates to streamline engineering contributions.**: Standardize issue and pull request templates to streamline engineering contributions.

---

## 2. Standard Operating Procedures (SOP)

1. Define GitHub Actions workflow files in .github/workflows/ (test.yml, deploy.yml).
2. Configure automated triggers on pull_request and push to main branch.
3. Enforce mandatory check runs: TypeScript check, ESLint, and automated test suite.
4. Create .github/PULL_REQUEST_TEMPLATE.md guiding contributors through verification checklists.
5. Manage repository secrets and environment variables securely in GitHub repository settings.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
git status
gh workflow list
gh pr status
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never allow merge to main when CI checks are failing or skipped.
- **Guard**: Never print unredacted GitHub secrets in CI runner logs.
- **Guard**: Avoid running unreviewed GitHub Actions workflows from third-party forks.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify GitHub Actions workflow syntax validates cleanly against schema.
- [ ] Verify CI workflows trigger and complete successfully on PR creation.
- [ ] Verify branch protection rules prevent direct unverified pushes to main.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `backend-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
