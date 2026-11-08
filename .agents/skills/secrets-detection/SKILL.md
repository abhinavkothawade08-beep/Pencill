---
name: secrets-detection
description: >-
  Scan codebases and Git history for committed API keys, private tokens, passwords, and service role secrets. Use before committing changes, creating releases, or auditing repositories.
---

# Automated Secret Scanning & Credential Exposure Prevention

> **Category**: Deep System Verification, Safety & Acceptance  
> **Specialist Subagent**: `security-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Prevent accidental leakage of secrets, API keys, private certificates, or database credentials.**: Prevent accidental leakage of secrets, API keys, private certificates, or database credentials.
2. **Scan staged diffs and historical commits for high-entropy secret patterns.**: Scan staged diffs and historical commits for high-entropy secret patterns.
3. **Enforce immediate revocation and rotation protocols if any credential is compromised.**: Enforce immediate revocation and rotation protocols if any credential is compromised.

---

## 2. Standard Operating Procedures (SOP)

1. Run automated secret scanning across all repository files using regex pattern matching.
2. Check staged changes for API key formats (Google AI keys, Supabase service keys, Stripe secrets).
3. Verify .gitignore includes .env, .env.local, .pem, .key, and credential files.
4. Scan git commit history using git log -p -S to ensure no past commits contain exposed secrets.
5. If a secret is detected: immediately notify, rotate the credential, and remove from git history.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
git diff | grep -iE "(AIza[0-9A-Za-z-_]{35}|eyJh[A-Za-z0-9_-]{20,})"
git status
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never commit live secrets, test credentials, or private keys to source control under any circumstance.
- **Guard**: Never display full unredacted secrets in logs, chat messages, or task outputs.
- **Guard**: Ensure pre-commit hooks block git commits containing detected secret patterns.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify secret scanner reports 0 exposed secrets in working tree.
- [ ] Verify git status confirms all .env files remain untracked.
- [ ] Verify all environment variable secrets are loaded securely from runtime configuration.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `security-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
