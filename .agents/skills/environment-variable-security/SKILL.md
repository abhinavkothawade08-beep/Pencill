---
name: environment-variable-security
description: >-
  Secure application environment variables, prevent secret leakage to client bundles, validate configurations with Zod, and manage .env files. Use when adding secrets, configuring environments, or auditing keys.
---

# Environment Variable Security & Secrets Management

> **Category**: DevOps, Infrastructure, Git & Observability  
> **Specialist Subagent**: `security-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Ensure 100% of runtime environment variables are strictly validated on application startup.**: Ensure 100% of runtime environment variables are strictly validated on application startup.
2. **Prevent server-only secrets (API keys, service keys, DB credentials) from leaking to client.**: Prevent server-only secrets (API keys, service keys, DB credentials) from leaking to client.
3. **Maintain synchronized .env.example templates documenting all required configuration keys.**: Maintain synchronized .env.example templates documenting all required configuration keys.

---

## 2. Standard Operating Procedures (SOP)

1. Define runtime environment schema in src/lib/env.ts using Zod (z.string().min(1)).
2. Parse process.env on startup; fail fast with descriptive error if mandatory keys are missing.
3. Prefix client-accessible variables strictly with NEXT_PUBLIC_; keep all other variables private.
4. Update .env.example whenever new configuration variables are introduced.
5. Add .env and .env.local to .gitignore to prevent accidental credential commits.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
git status
git diff | grep -iE "(NEXT_PUBLIC_.*(SECRET|KEY|PASSWORD|TOKEN))"
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: NEVER prefix secret keys or database connection strings with NEXT_PUBLIC_.
- **Guard**: Never commit actual secret values into .env.example or repository files.
- **Guard**: Ensure automated CI pipelines fail if secrets are detected in staged git diffs.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify application fails fast with clear message when mandatory env variables are missing.
- [ ] Verify client bundle analysis confirms 0 server secrets present in browser JavaScript.
- [ ] Verify .env and .env.local remain untracked in git status.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `security-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
