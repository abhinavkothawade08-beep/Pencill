# Pencill — Production Deployment & Operations Guide

> **Target Platform**: Vercel (Frontend & Serverless API Handlers) + Supabase (PostgreSQL, Auth & Storage)  
> **Build Command**: `next build`  
> **Runtime**: Node.js 18.x / 20.x

---

## 1. Environment Configuration

The application requires specific environment variables for development and production environments.

### 1.1 Environment Variable Matrix

| Variable | Scope | Required | Purpose | Example Value |
| :--- | :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public / Client & Server | Yes | Supabase Project URL | `https://amysczpyewtolfqyqvdj.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public / Client & Server | Yes | Supabase Anonymous Client Key (RLS-enforced) | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Private / Server Only | Optional | Administrative database maintenance bypass | `eyJhbGciOi...` *(Never prefix with NEXT_PUBLIC)* |
| `GEMINI_API_KEY` | Private / Server Only | Yes | Google Gemini API key for curriculum/quiz synthesis | `AIzaSy...` |
| `YOUTUBE_API_KEY` | Private / Server Only | Optional | YouTube Data API v3 key for real-time video validation | `AIzaSy...` |
| `NEXT_PUBLIC_APP_URL` | Public / Client & Server | Yes | Canonical deployment domain for CORS and callbacks | `https://pencill.vercel.app` |

> ⚠️ **CRITICAL SECURITY NOTE**: Never commit `.env.local` to Git. Keep `SUPABASE_SERVICE_ROLE_KEY` strictly in Vercel project settings or server environment variables.

---

## 2. Supabase Database Deployment & Migrations

### 2.1 Applying Database Migrations
All schema updates are versioned in `supabase/migrations/`:
```bash
# 1. Login to Supabase CLI
npx supabase login

# 2. Link your local environment to the remote Supabase project
npx supabase link --project-ref <your-project-id>

# 3. Push pending SQL migrations
npx supabase db push
```

### 2.2 Verifying Row Level Security (RLS)
Execute the verification query in the Supabase SQL Editor to ensure all tables enforce RLS:
```sql
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```
*Required result*: Every table (`learning_paths`, `quizzes`, `quiz_attempts`, `user_progress`, `user_notes`, `discussions`, `user_achievements`, `enrollments`) must report `rowsecurity = true`.

---

## 3. Vercel Production Deployment Workflow

### 3.1 Initial Setup
1. Import repository into Vercel via the Vercel Dashboard or CLI (`vercel`).
2. Set Framework Preset: **Next.js**.
3. Set Root Directory: `./`.
4. Configure Build and Output Settings:
   - **Build Command**: `next build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### 3.2 Add Environment Variables in Vercel Dashboard
Navigate to **Project Settings > Environment Variables** and add:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`
- `YOUTUBE_API_KEY` (if available)
- `NEXT_PUBLIC_APP_URL`

---

## 4. Pre-Deployment Verification Checklist

Run these commands locally prior to triggering production builds:

```bash
# 1. Type Safety Check (Zero compilation errors)
npx tsc --noEmit

# 2. Code Quality & Linting (Zero warnings or errors)
npm run lint

# 3. Full Test Suite (100% pass rate across 319+ tests)
npm test

# 4. Production Build Emulation
npm run build
```

---

## 5. Post-Deployment Verification & Smoke Testing

After deployment to production, perform the following verification runbook:

1. **Health & Routing**:
   - Access `https://<domain>/` (Landing Page).
   - Access `https://<domain>/explore` (Curriculum Catalog).
   - Access `https://<domain>/community` (Discussions Feed).
2. **Authentication Flow**:
   - Register a test account or log in via Supabase Auth.
   - Verify that session cookies/tokens persist across page reloads.
3. **Curriculum Synthesis**:
   - Navigate to `/new-goal`.
   - Submit a test curriculum synthesis (e.g. topic "Differential Calculus", duration "4 weeks").
   - Confirm modules, lessons, reading materials, and quizzes generate without error.
4. **Data Isolation Audit**:
   - Log in with Account A, create a private note or quiz attempt.
   - Log in with Account B, confirm Account B cannot see or query Account A's records.

---

## 6. Rollback & Disaster Recovery

### 6.1 Fast Rollback in Vercel
If a regression is identified in production:
1. Open **Vercel Dashboard > Deployments**.
2. Locate the previous healthy deployment.
3. Click the three dots menu `...` and select **Instant Rollback**.
4. Traffic is rerouted to the previous immutable build in < 5 seconds.

### 6.2 Database Rollback
If a faulty migration was applied:
1. Identify the offending migration file in `supabase/migrations/`.
2. Apply the corresponding down-migration script in the Supabase SQL editor.
3. Verify table constraints and foreign keys remain healthy.
