---
name: oauth-integration
description: >-
  Implement secure OAuth 2.0 and OpenID Connect (OIDC) identity flows, state parameter CSRF mitigation, PKCE validation, and scope management. Use when configuring Google, GitHub, or social sign-in providers.
---

# OAuth 2.0 / OIDC Authentication Flow Architecture

> **Category**: Google Ecosystem, APIs & Mobile  
> **Specialist Subagent**: `security-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Implement secure OAuth 2.0 / OIDC authentication workflows across identity providers.**: Implement secure OAuth 2.0 / OIDC authentication workflows across identity providers.
2. **Protect against CSRF and authorization code interception attacks using state and PKCE.**: Protect against CSRF and authorization code interception attacks using state and PKCE.
3. **Enforce least-privilege OAuth scopes requesting only strictly necessary user permissions.**: Enforce least-privilege OAuth scopes requesting only strictly necessary user permissions.

---

## 2. Standard Operating Procedures (SOP)

1. Generate cryptographically secure state and code_verifier parameters before auth redirect.
2. Store PKCE verifier in secure HttpOnly cookie during authorization flow.
3. Handle OAuth callback route: validate state parameter match to prevent CSRF.
4. Exchange authorization code for access and ID tokens via secure server-to-server POST.
5. Validate ID token signature and claims (iss, aud, exp) using provider public JWKS keys.
6. Create or link user account in database within an atomic transaction.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npm test -- tests/auth-oauth.test.ts
npx tsx scripts/verify_auth_live.js
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never pass client_secret in client-side URLs or frontend code.
- **Guard**: Never accept redirect_uri parameters from untrusted query strings without strict whitelist validation.
- **Guard**: Always verify state parameter match before processing authorization codes.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify OAuth flow successfully authenticates user and establishes session.
- [ ] Verify mismatched or missing state parameters return 400 Bad Request.
- [ ] Verify user profile and email claims are correctly extracted and persisted.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `security-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
