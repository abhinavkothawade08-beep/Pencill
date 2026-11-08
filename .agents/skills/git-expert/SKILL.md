---
name: git-expert
description: >-
  Execute advanced Git operations: interactive rebase, cherry-pick, bisect regression isolation, worktrees, and reflog disaster recovery. Use when managing branches, isolating regressions, or resolving merge conflicts.
---

# Advanced Git Workflows & Repository Mastery

> **Category**: DevOps, Infrastructure, Git & Observability  
> **Specialist Subagent**: `backend-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Maintain a clean, linear, atomic Git commit history with conventional commit messages.**: Maintain a clean, linear, atomic Git commit history with conventional commit messages.
2. **Isolate historical regressions efficiently using git bisect automated runners.**: Isolate historical regressions efficiently using git bisect automated runners.
3. **Recover lost commits or recover from accidental branch deletions using git reflog.**: Recover lost commits or recover from accidental branch deletions using git reflog.

---

## 2. Standard Operating Procedures (SOP)

1. Inspect repository status, staging state, and diffs using 'git status' and 'git diff'.
2. Stage surgical changes atomically using 'git add -p' or targeted file paths.
3. Author conventional commit messages: <type>(<scope>): <concise description>.
4. Rebase feature branches onto main cleanly, resolving conflicts without dropping changes.
5. Use git worktree to work on parallel branches without switching directories or re-running installs.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
git status
git log --oneline -n 10
git diff --stat
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never execute 'git push --force' on shared main or release branches.
- **Guard**: Never commit untracked secrets, .env files, or build directories (.next/, dist/).
- **Guard**: Avoid giant catch-all commits that combine multiple unrelated features or bug fixes.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify 'git status' is clean and working tree is synchronized.
- [ ] Verify git commit log conveys clear, readable history of all changes.
- [ ] Verify all commits pass pre-commit verification gates.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `backend-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
