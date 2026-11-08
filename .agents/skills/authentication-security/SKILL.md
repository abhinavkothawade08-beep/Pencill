---
name: authentication-security
description: >-
  Implement secure authentication workflows, PKCE flows, JWT validation, refresh token rotation, and session management. Use when configuring Supabase Auth, middleware session checks, or protecting routes.
---

# Authentication Security, JWT Verification & Session Lifecycle

> **Category**: Database, Supabase & Data Integrity  
> **Specialist Subagent**: `security-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Implement robust, tamper-proof user authentication using modern PKCE workflows.**: Implement robust, tamper-proof user authentication using modern PKCE workflows.
2. **Enforce cryptographically secure JWT verification and automatic refresh token rotation.**: Enforce cryptographically secure JWT verification and automatic refresh token rotation.
3. **Protect against session hijacking, fixation, and replay attacks via secure HttpOnly cookies.**: Protect against session hijacking, fixation, and replay attacks via secure HttpOnly cookies.

---

## 2. Standard Operating Procedures (SOP)

1. Configure Supabase Auth with PKCE flow for secure browser authentication.
2. Implement Next.js middleware (middleware.ts) checking session validity on protected routes.
3. Store session tokens in secure, HttpOnly, SameSite=Lax, Secure cookies.
4. Handle token expiration gracefully by rotating refresh tokens seamlessly in background.
5. Invalidate local cache and session state immediately upon user logout or account switch.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npm test -- tests/auth-*.test.ts
npx tsx scripts/verify_auth_live.js
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never store access tokens or JWTs in plain localStorage where they are vulnerable to XSS.
- **Guard**: Never skip JWT signature and expiration verification on incoming API requests.
- **Guard**: Ensure password reset and verification links use time-limited, single-use cryptographic tokens.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify protected API routes return 401 Unauthorized when unauthenticated.
- [ ] Verify expired tokens trigger refresh rotation or redirect to login.
- [ ] Verify logging out completely purges cached user state and invalidates session.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `security-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
