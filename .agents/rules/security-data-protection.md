# Global Rule: Security & Multi-Tenant Data Protection

> **Standard**: Guarantee multi-tenant isolation, least-privilege access, zero secret leakage, and OWASP compliance.

---

## 1. Secrets & Credentials Protection
1. **Zero Service-Role Key Rule**: `SUPABASE_SERVICE_ROLE_KEY` must NEVER be referenced in client-side code or browser bundles. All client interactions use `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. **Runtime Validation**: Validate all environment variables on startup with Zod. Never hardcode credentials in code.
3. **Secret Hygiene**: Maintain `.env` and `.env.local` in `.gitignore`. Never commit live secrets or tokens to git.

---

## 2. Row Level Security & Multi-Tenancy
1. **Mandatory RLS**: Every database table in the public schema must have Row Level Security enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
2. **Tenant Scoping**: All user data queries must enforce `auth.uid() = user_id`. Never allow cross-tenant access.
3. **Zero Anonymous Mutations**: Anonymous users must never be permitted to execute insert, update, or delete mutations on protected tables.

---

## 3. Input Sanitization & Injection Defense
1. **Parameterized Queries**: All database queries must use parameterized query builders; zero SQL string concatenation.
2. **Output Escaping**: Escape all user-supplied data to prevent Cross-Site Scripting (XSS).
3. **Safe Error Envelopes**: Never leak internal database schemas, column names, or raw stack traces in API responses.
