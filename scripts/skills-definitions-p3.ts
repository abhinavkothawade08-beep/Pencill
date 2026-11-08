import type { SkillDefinition } from "./skills-definitions-p1.ts";

export const SKILLS_51_TO_75: SkillDefinition[] = [
  {
    id: 51,
    name: "accidental-data-loss-prevention",
    category: "Database, Supabase & Data Integrity",
    title: "Accidental Data Loss Prevention & Soft Deletion",
    description: "Guard against catastrophic data loss using soft-delete patterns, tombstone registries, confirmation barriers, and undo buffers. Use when implementing deletion endpoints, UI delete actions, or batch removals.",
    objectives: [
      "Prevent irreversible data loss from accidental user clicks or buggy batch deletion scripts.",
      "Implement soft-delete patterns (deleted_at IS NOT NULL) with deletion registries.",
      "Maintain offline-first tombstone registries to prevent resurrection during sync operations."
    ],
    procedures: [
      "Implement soft-deletion in schemas by adding nullable deleted_at TIMESTAMPTZ column.",
      "Record deleted item IDs in persistent deletionRegistry.ts on client and server.",
      "Ensure query services filter out soft-deleted records by default (WHERE deleted_at IS NULL).",
      "Implement UI confirmation barriers requiring explicit user confirmation before destructive actions.",
      "Provide short undo grace windows (toast with 'Undo') before finalizing deletion state."
    ],
    commands: [
      "npm test -- tests/batch-delete-*.test.ts",
      "npx tsx tests/verify_learning_and_quiz.js"
    ],
    safeguards: [
      "Never execute raw unconstrained 'DELETE FROM table' SQL queries.",
      "Ensure background synchronization jobs never resurrect soft-deleted items stored in registries.",
      "Never hard-delete user data immediately without administrative safety checks."
    ],
    verification: [
      "Verify deleted entities disappear from UI while persisting safely in soft-delete state.",
      "Verify offline synchronization does not restore previously deleted items.",
      "Verify batch delete tests pass 100% with authorization checks verified."
    ],
    subagent: "database-eng"
  },
  {
    id: 52,
    name: "backup-recovery",
    category: "Database, Supabase & Data Integrity",
    title: "Disaster Recovery, Point-in-Time Restore & Backup Management",
    description: "Design and verify database backup strategies, point-in-time recovery (PITR) procedures, and disaster recovery playbooks. Use when establishing operational runbooks, backup routines, or disaster drills.",
    objectives: [
      "Ensure continuous automated backups with Point-in-Time Recovery (PITR) capabilities.",
      "Define and document Recovery Time Objectives (RTO < 1h) and Recovery Point Objectives (RPO < 15m).",
      "Validate backup restoration integrity through automated periodic recovery drills."
    ],
    procedures: [
      "Verify automated daily backup snapshots and continuous WAL archiving are enabled in Supabase/PostgreSQL.",
      "Document step-by-step restoration runbook in docs/architecture/disaster-recovery.md.",
      "Automate periodic export of core configuration and schema definitions to secure cloud storage.",
      "Execute dry-run restore into an isolated staging environment to verify backup validity.",
      "Test data consistency and application boot against restored database snapshot."
    ],
    commands: [
      "pg_dump -h localhost -U postgres -d postgres --schema-only -f schema-backup.sql",
      "npx supabase db dump -f supabase-backup.sql"
    ],
    safeguards: [
      "Never store unencrypted database backups in publicly accessible locations.",
      "Never rely on un-tested backups; an untested backup is not a backup.",
      "Ensure backup credentials and encryption keys are rotated and isolated."
    ],
    verification: [
      "Verify database dumps restore successfully into an empty PostgreSQL database.",
      "Verify restored database contains 100% of tables, views, functions, and RLS policies.",
      "Verify application connects to restored database and passes health checks."
    ],
    subagent: "database-eng"
  },
  {
    id: 53,
    name: "multi-tenant-data-isolation",
    category: "Database, Supabase & Data Integrity",
    title: "Multi-Tenant Data Partitioning & Isolation Enforcement",
    description: "Enforce strict tenant data boundaries, prevent cross-tenant data leaks, and audit multi-tenant query security. Use when designing user data schemas, querying multi-tenant tables, or auditing isolation.",
    objectives: [
      "Guarantee zero data leakage between distinct users or organizational tenants.",
      "Enforce tenant identification column (user_id / tenant_id) across all shared tables.",
      "Audit every API endpoint and query for proper tenant scoping."
    ],
    procedures: [
      "Include user_id UUID REFERENCES auth.users(id) NOT NULL on all user-owned domain tables.",
      "Enforce PostgreSQL Row Level Security (RLS) policies requiring auth.uid() = user_id.",
      "In service layers, always pass authenticated user context and filter by user_id explicitly.",
      "Write multi-tenant penetration tests: verify User A cannot read or mutate User B's records.",
      "Audit API route parameters: never accept user_id blindly from client request payloads."
    ],
    commands: [
      "npm test -- tests/batch-delete-scope.test.ts",
      "npx tsx scripts/verify_rls_policies.ts"
    ],
    safeguards: [
      "Never trust client-supplied user_id in request bodies; derive user_id from verified auth token.",
      "Never disable RLS on tables containing user-specific or sensitive information.",
      "Avoid cross-tenant JOINs or queries without explicit tenant filtering."
    ],
    verification: [
      "Verify tests prove User A attempting to access User B's data receives 403 Forbidden or empty set.",
      "Verify RLS policies exist and are enabled on 100% of user-owned tables.",
      "Verify zero cross-tenant data leakage detected in automated security test suites."
    ],
    subagent: "security-eng"
  },
  {
    id: 54,
    name: "authentication-security",
    category: "Database, Supabase & Data Integrity",
    title: "Authentication Security, JWT Verification & Session Lifecycle",
    description: "Implement secure authentication workflows, PKCE flows, JWT validation, refresh token rotation, and session management. Use when configuring Supabase Auth, middleware session checks, or protecting routes.",
    objectives: [
      "Implement robust, tamper-proof user authentication using modern PKCE workflows.",
      "Enforce cryptographically secure JWT verification and automatic refresh token rotation.",
      "Protect against session hijacking, fixation, and replay attacks via secure HttpOnly cookies."
    ],
    procedures: [
      "Configure Supabase Auth with PKCE flow for secure browser authentication.",
      "Implement Next.js middleware (middleware.ts) checking session validity on protected routes.",
      "Store session tokens in secure, HttpOnly, SameSite=Lax, Secure cookies.",
      "Handle token expiration gracefully by rotating refresh tokens seamlessly in background.",
      "Invalidate local cache and session state immediately upon user logout or account switch."
    ],
    commands: [
      "npm test -- tests/auth-*.test.ts",
      "npx tsx scripts/verify_auth_live.js"
    ],
    safeguards: [
      "Never store access tokens or JWTs in plain localStorage where they are vulnerable to XSS.",
      "Never skip JWT signature and expiration verification on incoming API requests.",
      "Ensure password reset and verification links use time-limited, single-use cryptographic tokens."
    ],
    verification: [
      "Verify protected API routes return 401 Unauthorized when unauthenticated.",
      "Verify expired tokens trigger refresh rotation or redirect to login.",
      "Verify logging out completely purges cached user state and invalidates session."
    ],
    subagent: "security-eng"
  },
  {
    id: 55,
    name: "rls-security-auditor",
    category: "Database, Supabase & Data Integrity",
    title: "PostgreSQL Row Level Security (RLS) Auditing",
    description: "Audit PostgreSQL Row Level Security policies, identify policy bypasses, test anon vs authenticated access, and enforce least-privilege security. Use when authoring migrations or auditing database security.",
    objectives: [
      "Verify that 100% of public database tables have RLS enabled (ALTER TABLE ... ENABLE ROW LEVEL SECURITY).",
      "Audit every RLS policy (SELECT, INSERT, UPDATE, DELETE) for proper auth.uid() predicate checks.",
      "Ensure anonymous users cannot perform unauthorized reads or any mutations on sensitive data."
    ],
    procedures: [
      "Query pg_tables and pg_policies to list all tables and verify rowsecurity = true.",
      "Inspect policy expressions (qual and with_check) for auth.uid() = user_id or public read rules.",
      "Execute automated RLS audit script (scripts/verify_rls_policies.ts) using anonymous client credentials.",
      "Assert that anon client INSERT, UPDATE, and DELETE queries are rejected with permission denied.",
      "Verify that authenticated client queries only return rows matching their own auth.uid()."
    ],
    commands: [
      "npx tsx scripts/verify_rls_policies.ts",
      "npx supabase db lint"
    ],
    safeguards: [
      "Never create RLS policies using 'USING (true)' on tables storing user-specific data.",
      "Ensure WITH CHECK expressions are defined on INSERT and UPDATE policies.",
      "Never grant public role write access to tables."
    ],
    verification: [
      "Verify scripts/verify_rls_policies.ts passes with 0 RLS policy vulnerabilities.",
      "Verify every table in public schema has rowsecurity = true.",
      "Verify anonymous write attempts fail with PostgreSQL permission denied errors."
    ],
    subagent: "security-eng"
  },
  {
    id: 56,
    name: "google-developer-knowledge",
    category: "Google Ecosystem, APIs & Mobile",
    title: "Google Developer Ecosystem & Documentation Synthesis",
    description: "Search, synthesize, and apply official Google developer documentation across Google Cloud, Gemini API, Android, Firebase, and Web APIs. Use when integrating Google platforms, APIs, or developer services.",
    objectives: [
      "Navigate official Google developer documentation and API specifications accurately.",
      "Select correct Google Cloud / Gemini / Firebase SDK methods, parameters, and quotas.",
      "Ensure compliance with Google API deprecation timelines and recommended best practices."
    ],
    procedures: [
      "Query official Google Developer documentation resources (or Google Developer Knowledge tools).",
      "Cross-reference SDK method signatures against official reference specifications.",
      "Identify required Google Cloud IAM roles, scopes, and API enablement prerequisites.",
      "Implement proper error handling for Google API error payloads and quota exhaustion (429).",
      "Document architectural decisions referencing official Google documentation."
    ],
    commands: [
      "gcloud services list --enabled",
      "curl -s https://www.googleapis.com/discovery/v1/apis"
    ],
    safeguards: [
      "Never use deprecated v1 / beta endpoints when stable v1beta / v2 APIs are recommended.",
      "Never hardcode Google API keys in source files; always read from validated environment variables.",
      "Adhere to Google API Terms of Service and rate limits."
    ],
    verification: [
      "Verify Google API requests succeed with valid authenticated responses.",
      "Verify method calls adhere strictly to official current SDK documentation.",
      "Verify zero deprecated API usage warnings in logs."
    ],
    subagent: "research"
  },
  {
    id: 57,
    name: "android-development",
    category: "Google Ecosystem, APIs & Mobile",
    title: "Android Mobile Engineering & Cross-Platform Architecture",
    description: "Develop, package, and optimize Android mobile applications using Capacitor, React Native, or native Android toolchains. Use when configuring mobile wrappers, Android manifests, or mobile builds.",
    objectives: [
      "Configure and build Android applications with clean manifest permissions and security.",
      "Optimize web-to-mobile bridge performance (Capacitor / React Native / PWA).",
      "Ensure smooth mobile UX: responsive layouts, gesture handling, and offline capabilities."
    ],
    procedures: [
      "Configure AndroidManifest.xml: declare required permissions, intent filters, and hardware features.",
      "Set up app icons, splash screens, and adaptive icon assets in android/app/src/main/res/.",
      "Configure Gradle build scripts (build.gradle) with proper targetSdkVersion and compileSdkVersion.",
      "Optimize WebView settings: enable hardware acceleration, safe browsing, and secure origin policies.",
      "Test mobile viewports and touch interactions across simulated Android device profiles."
    ],
    commands: [
      "npx cap sync android",
      "./gradlew assembleDebug"
    ],
    safeguards: [
      "Never request unnecessary dangerous permissions in AndroidManifest.xml.",
      "Never disable cleartext traffic or SSL validation in network security config.",
      "Ensure web app resources bundled in APK are optimized and minified."
    ],
    verification: [
      "Verify Gradle build compiles APK / AAB successfully with 0 errors.",
      "Verify Android app boots cleanly in emulator without native crashes.",
      "Verify web assets load properly within native Android WebView container."
    ],
    subagent: "frontend-eng"
  },
  {
    id: 58,
    name: "android-cli",
    category: "Google Ecosystem, APIs & Mobile",
    title: "Android CLI, ADB Diagnostics & Emulator Automation",
    description: "Operate Android CLI developer tools: adb, avdmanager, logcat, and gradle command lines for mobile testing and device diagnostics. Use when interacting with Android devices, emulators, or build pipelines.",
    objectives: [
      "Manage Android virtual devices (AVD) and physical devices via adb CLI.",
      "Capture and filter real-time device system logs via adb logcat.",
      "Automate APK installation, launching, and UI interaction on Android targets."
    ],
    procedures: [
      "List connected devices and running emulators using 'adb devices'.",
      "Install and launch target APK on device using 'adb install' and 'adb shell am start'.",
      "Stream filtered system logs using 'adb logcat *:E' to capture fatal crashes and ANRs.",
      "Capture device screenshots and screen recordings via 'adb exec-out screencap -p'.",
      "Automate device inputs using 'adb shell input' for end-to-end mobile testing."
    ],
    commands: [
      "adb devices",
      "adb logcat -d *:E",
      "adb shell am start -n <package>/<activity>"
    ],
    safeguards: [
      "Never leave adb server running with open public network ports.",
      "Ensure test commands target the specific emulator instance (-s emulator-5554).",
      "Do not execute destructive adb shell commands on production or physical devices."
    ],
    verification: [
      "Verify target application launches cleanly on connected Android device.",
      "Verify adb logcat confirms zero unhandled exceptions or ANRs.",
      "Verify automated CLI script exits cleanly with code 0."
    ],
    subagent: "qa-eng"
  },
  {
    id: 59,
    name: "firebase-expert",
    category: "Google Ecosystem, APIs & Mobile",
    title: "Firebase Cloud Services & Realtime Infrastructure",
    description: "Configure and manage Firebase Authentication, Firestore databases, Cloud Storage, and Firebase Cloud Functions. Use when integrating Firebase services or authoring Firestore security rules.",
    objectives: [
      "Integrate Firebase SDKs with type-safe data access and security rules.",
      "Author declarative Firestore and Storage security rules protecting user data.",
      "Implement serverless Cloud Functions with idempotent execution and error recovery."
    ],
    procedures: [
      "Initialize Firebase app with validated project credentials and environment variables.",
      "Configure Firestore data models with atomic batch writes and transaction support.",
      "Author firestore.rules defining granular read/write conditions matching request.auth.uid.",
      "Test Firestore rules locally using the Firebase Local Emulator Suite.",
      "Deploy Firebase resources and functions using Firebase CLI."
    ],
    commands: [
      "firebase emulators:start",
      "firebase deploy --only firestore:rules"
    ],
    safeguards: [
      "Never publish open Firestore rules ('allow read, write: if true;') to production.",
      "Never check Firebase admin service account JSON keys into source control.",
      "Avoid unbounded Firestore collection queries that consume excessive read quotas."
    ],
    verification: [
      "Verify Firebase emulator tests pass all security rule assertions.",
      "Verify unauthorized clients are blocked from reading or writing Firestore collections.",
      "Verify Firebase Cloud Functions execute and respond within latency budgets."
    ],
    subagent: "backend-eng"
  },
  {
    id: 60,
    name: "google-cloud-expert",
    category: "Google Ecosystem, APIs & Mobile",
    title: "Google Cloud Platform (GCP) Architecture & Services",
    description: "Architect, deploy, and secure cloud workloads on Google Cloud Platform: Cloud Run, Artifact Registry, IAM roles, and Secret Manager. Use when configuring cloud deployments, secrets, or GCP infrastructure.",
    objectives: [
      "Deploy scalable, containerized microservices and web applications to Google Cloud Run.",
      "Enforce least-privilege Identity and Access Management (IAM) role assignments.",
      "Manage sensitive application secrets securely using GCP Secret Manager."
    ],
    procedures: [
      "Configure gcloud CLI with target project and authenticated service account.",
      "Build and push container images to Google Artifact Registry.",
      "Deploy services to Cloud Run with explicit memory, CPU, and auto-scaling limits.",
      "Bind IAM service accounts with minimal required roles (e.g. roles/run.invoker).",
      "Mount application secrets into Cloud Run containers directly from Secret Manager."
    ],
    commands: [
      "gcloud config get-value project",
      "gcloud run services list",
      "gcloud secrets list"
    ],
    safeguards: [
      "Never grant broad Owner or Editor roles to service accounts used in automated pipelines.",
      "Never commit GCP service account keys (.json) into git repositories.",
      "Ensure Cloud Run services are configured with concurrency and max instance caps to prevent cost spikes."
    ],
    verification: [
      "Verify Cloud Run service responds to health check probes with HTTP 200.",
      "Verify application secrets are injected securely into the runtime environment.",
      "Verify IAM role bindings strictly conform to least-privilege principles."
    ],
    subagent: "backend-eng"
  },
  {
    id: 61,
    name: "youtube-api-expert",
    category: "Google Ecosystem, APIs & Mobile",
    title: "YouTube Data API v3 & Educational Video Integration",
    description: "Integrate YouTube Data API v3 to search educational playlists, retrieve verified video metadata, and validate academic channels from MASTER_YOUTUBE_EDUCATOR_DIRECTORY.md. Use when recommending educational videos.",
    objectives: [
      "Integrate YouTube Data API v3 with quota-aware caching and retry logic.",
      "Ground video recommendations exclusively in verified academic educators and channels.",
      "Validate video URLs, channel IDs, titles, and thumbnails for real educational content."
    ],
    procedures: [
      "Reference docs/MASTER_YOUTUBE_EDUCATOR_DIRECTORY.md for canonical academic channel IDs.",
      "Query YouTube Data API v3 (search, playlists, videos endpoints) with strict topic parameters.",
      "Cache API responses locally in data/ or database to preserve daily API quota limits.",
      "Filter returned videos to guarantee high educational value, high resolution, and valid embeddability.",
      "Format video recommendations with verified URLs (https://www.youtube.com/watch?v=...), duration, and channel."
    ],
    commands: [
      "npm test -- tests/resource-engine-*.test.ts",
      "npx tsx scripts/compile-taxonomy.js"
    ],
    safeguards: [
      "Never fabricate fake channel names, invalid video URLs, or generic homepage links (youtube.com).",
      "Never recommend clickbait, entertainment, or unverified commercial courses.",
      "Ensure API calls handle quota exhaustion (quotaExceeded 403) gracefully with cached fallback."
    ],
    verification: [
      "Verify all recommended video URLs resolve to real, active YouTube videos.",
      "Verify channel names match verified educators in MASTER_YOUTUBE_EDUCATOR_DIRECTORY.md.",
      "Verify automated test suites for educational resource discovery pass 100%."
    ],
    subagent: "backend-eng"
  },
  {
    id: 62,
    name: "gemini-api-expert",
    category: "Google Ecosystem, APIs & Mobile",
    title: "Google Gemini AI SDK Engineering & Structured Generation",
    description: "Integrate Google Gen AI SDK (@google/genai) to generate structured curricula, study monographs, quizzes, and multimodal insights with strict schema enforcement. Use when engineering AI features or prompt pipelines.",
    objectives: [
      "Engineer robust AI workflows using the official Google Gen AI SDK (@google/genai).",
      "Enforce deterministic JSON outputs using responseSchema or constrained JSON prompt contracts.",
      "Implement resilient deterministic fallbacks ensuring 0 user crashes on API limits (429) or outages."
    ],
    procedures: [
      "Initialize GoogleGenAI client with GEMINI_API_KEY from validated server environment.",
      "Define strict Zod response schemas and compile to JSON Schema for model output constraints.",
      "Execute ai.models.generateContent with temperature, systemInstructions, and responseSchema.",
      "Sanitize output by stripping markdown code fences (```json ... ```) before JSON.parse().",
      "Implement curriculum-adaptive deterministic fallback engine for graceful offline operation.",
      "Redact quiz correct answers on client payloads to preserve server-side scoring authority."
    ],
    commands: [
      "npx tsx scripts/test-gemini.mjs",
      "npm test -- tests/gemini-*.test.ts"
    ],
    safeguards: [
      "NEVER expose GEMINI_API_KEY to browser clients; all AI calls must execute in server route handlers.",
      "Always wrap AI calls in try/catch with automatic fallback to deterministic engines on failure.",
      "Never allow un-sanitized model outputs to be rendered directly into DOM without HTML escaping."
    ],
    verification: [
      "Verify AI integration tests pass with and without GEMINI_API_KEY configured.",
      "Verify model outputs parse cleanly into validated Zod schemas with 0 errors.",
      "Verify offline fallback generates complete, high-quality educational curricula seamlessly."
    ],
    subagent: "ai-engineer"
  },
  {
    id: 63,
    name: "oauth-integration",
    category: "Google Ecosystem, APIs & Mobile",
    title: "OAuth 2.0 / OIDC Authentication Flow Architecture",
    description: "Implement secure OAuth 2.0 and OpenID Connect (OIDC) identity flows, state parameter CSRF mitigation, PKCE validation, and scope management. Use when configuring Google, GitHub, or social sign-in providers.",
    objectives: [
      "Implement secure OAuth 2.0 / OIDC authentication workflows across identity providers.",
      "Protect against CSRF and authorization code interception attacks using state and PKCE.",
      "Enforce least-privilege OAuth scopes requesting only strictly necessary user permissions."
    ],
    procedures: [
      "Generate cryptographically secure state and code_verifier parameters before auth redirect.",
      "Store PKCE verifier in secure HttpOnly cookie during authorization flow.",
      "Handle OAuth callback route: validate state parameter match to prevent CSRF.",
      "Exchange authorization code for access and ID tokens via secure server-to-server POST.",
      "Validate ID token signature and claims (iss, aud, exp) using provider public JWKS keys.",
      "Create or link user account in database within an atomic transaction."
    ],
    commands: [
      "npm test -- tests/auth-oauth.test.ts",
      "npx tsx scripts/verify_auth_live.js"
    ],
    safeguards: [
      "Never pass client_secret in client-side URLs or frontend code.",
      "Never accept redirect_uri parameters from untrusted query strings without strict whitelist validation.",
      "Always verify state parameter match before processing authorization codes."
    ],
    verification: [
      "Verify OAuth flow successfully authenticates user and establishes session.",
      "Verify mismatched or missing state parameters return 400 Bad Request.",
      "Verify user profile and email claims are correctly extracted and persisted."
    ],
    subagent: "security-eng"
  },
  {
    id: 64,
    name: "git-expert",
    category: "DevOps, Infrastructure, Git & Observability",
    title: "Advanced Git Workflows & Repository Mastery",
    description: "Execute advanced Git operations: interactive rebase, cherry-pick, bisect regression isolation, worktrees, and reflog disaster recovery. Use when managing branches, isolating regressions, or resolving merge conflicts.",
    objectives: [
      "Maintain a clean, linear, atomic Git commit history with conventional commit messages.",
      "Isolate historical regressions efficiently using git bisect automated runners.",
      "Recover lost commits or recover from accidental branch deletions using git reflog."
    ],
    procedures: [
      "Inspect repository status, staging state, and diffs using 'git status' and 'git diff'.",
      "Stage surgical changes atomically using 'git add -p' or targeted file paths.",
      "Author conventional commit messages: <type>(<scope>): <concise description>.",
      "Rebase feature branches onto main cleanly, resolving conflicts without dropping changes.",
      "Use git worktree to work on parallel branches without switching directories or re-running installs."
    ],
    commands: [
      "git status",
      "git log --oneline -n 10",
      "git diff --stat"
    ],
    safeguards: [
      "Never execute 'git push --force' on shared main or release branches.",
      "Never commit untracked secrets, .env files, or build directories (.next/, dist/).",
      "Avoid giant catch-all commits that combine multiple unrelated features or bug fixes."
    ],
    verification: [
      "Verify 'git status' is clean and working tree is synchronized.",
      "Verify git commit log conveys clear, readable history of all changes.",
      "Verify all commits pass pre-commit verification gates."
    ],
    subagent: "backend-eng"
  },
  {
    id: 65,
    name: "github-expert",
    category: "DevOps, Infrastructure, Git & Observability",
    title: "GitHub Platform Operations & Automation",
    description: "Manage GitHub repositories, configure GitHub Actions CI/CD workflows, enforce branch protections, and automate issue/PR triage. Use when setting up repository governance, CI pipelines, or release workflows.",
    objectives: [
      "Configure branch protection rules requiring status checks and reviews before merge.",
      "Author automated GitHub Actions workflows for testing, linting, and continuous delivery.",
      "Standardize issue and pull request templates to streamline engineering contributions."
    ],
    procedures: [
      "Define GitHub Actions workflow files in .github/workflows/ (test.yml, deploy.yml).",
      "Configure automated triggers on pull_request and push to main branch.",
      "Enforce mandatory check runs: TypeScript check, ESLint, and automated test suite.",
      "Create .github/PULL_REQUEST_TEMPLATE.md guiding contributors through verification checklists.",
      "Manage repository secrets and environment variables securely in GitHub repository settings."
    ],
    commands: [
      "git status",
      "gh workflow list",
      "gh pr status"
    ],
    safeguards: [
      "Never allow merge to main when CI checks are failing or skipped.",
      "Never print unredacted GitHub secrets in CI runner logs.",
      "Avoid running unreviewed GitHub Actions workflows from third-party forks."
    ],
    verification: [
      "Verify GitHub Actions workflow syntax validates cleanly against schema.",
      "Verify CI workflows trigger and complete successfully on PR creation.",
      "Verify branch protection rules prevent direct unverified pushes to main."
    ],
    subagent: "backend-eng"
  },
  {
    id: 66,
    name: "ci-cd-engineer",
    category: "DevOps, Infrastructure, Git & Observability",
    title: "CI/CD Pipeline Engineering & Automated Build Systems",
    description: "Design and optimize Continuous Integration and Continuous Deployment pipelines with dependency caching, parallel test matrices, and automated staging previews. Use when setting up or accelerating deployment pipelines.",
    objectives: [
      "Build fast, resilient CI/CD pipelines with sub-5-minute execution times.",
      "Implement smart dependency caching (node_modules, Next.js build cache) across CI runs.",
      "Automate preview deployments for pull requests and zero-downtime production releases."
    ],
    procedures: [
      "Structure CI pipeline into distinct stages: Install -> Lint -> TypeCheck -> Test -> Build.",
      "Configure cache actions for npm / pnpm packages and Next.js compilation cache (.next/cache).",
      "Run unit tests and integration tests in parallel jobs to minimize overall pipeline latency.",
      "Generate deployable build artifacts or Docker images upon successful pipeline completion.",
      "Trigger automated smoke tests against deployed preview environments before promotion."
    ],
    commands: [
      "npm run build",
      "npm test"
    ],
    safeguards: [
      "Never allow build pipeline to deploy if any preceding test or typecheck stage fails.",
      "Ensure CI environment variables match required production shapes without containing prod secrets.",
      "Avoid unbounded cache sizes that slow down cache restoration."
    ],
    verification: [
      "Verify pipeline runs end-to-end and outputs green build status.",
      "Verify build cache significantly accelerates repeat CI execution times.",
      "Verify deploy artifact is hermetic and ready for production deployment."
    ],
    subagent: "backend-eng"
  },
  {
    id: 67,
    name: "deployment-engineer",
    category: "DevOps, Infrastructure, Git & Observability",
    title: "Production Deployment Engineering & Zero-Downtime Rollouts",
    description: "Execute safe production deployments to Vercel, Cloud Run, or container environments using blue-green rollouts, canary deployments, and automated health checks. Use when deploying releases or verifying deployments.",
    objectives: [
      "Execute zero-downtime production deployments with immediate rollback capabilities.",
      "Verify post-deployment application health via automated smoke tests and health checks.",
      "Manage release tags, changelogs, and environment configuration across staging and prod."
    ],
    procedures: [
      "Verify all pre-deployment verification gates pass: tests, lint, TypeScript checks.",
      "Deploy new release to staging or preview environment; execute automated smoke test suite.",
      "Perform blue-green or rolling deployment to production traffic.",
      "Monitor application health checks (/api/health) and error rates for 5 minutes post-rollout.",
      "If error rate exceeds threshold (> 0.1%), trigger automated rollback to previous stable commit."
    ],
    commands: [
      "npx vercel --prod",
      "curl -f http://localhost:3000/api/health"
    ],
    safeguards: [
      "Never deploy directly to production without verifying on staging/preview first.",
      "Never perform deployments during peak traffic hours or without an on-call engineer.",
      "Ensure database schema migrations are deployed and verified before deploying dependent code."
    ],
    verification: [
      "Verify deployment endpoint returns HTTP 200 on health check probes.",
      "Verify all critical user paths function properly in the live production environment.",
      "Verify error tracking dashboards report baseline error rates post-deployment."
    ],
    subagent: "backend-eng"
  },
  {
    id: 68,
    name: "environment-variable-security",
    category: "DevOps, Infrastructure, Git & Observability",
    title: "Environment Variable Security & Secrets Management",
    description: "Secure application environment variables, prevent secret leakage to client bundles, validate configurations with Zod, and manage .env files. Use when adding secrets, configuring environments, or auditing keys.",
    objectives: [
      "Ensure 100% of runtime environment variables are strictly validated on application startup.",
      "Prevent server-only secrets (API keys, service keys, DB credentials) from leaking to client.",
      "Maintain synchronized .env.example templates documenting all required configuration keys."
    ],
    procedures: [
      "Define runtime environment schema in src/lib/env.ts using Zod (z.string().min(1)).",
      "Parse process.env on startup; fail fast with descriptive error if mandatory keys are missing.",
      "Prefix client-accessible variables strictly with NEXT_PUBLIC_; keep all other variables private.",
      "Update .env.example whenever new configuration variables are introduced.",
      "Add .env and .env.local to .gitignore to prevent accidental credential commits."
    ],
    commands: [
      "git status",
      "git diff | grep -iE \"(NEXT_PUBLIC_.*(SECRET|KEY|PASSWORD|TOKEN))\""
    ],
    safeguards: [
      "NEVER prefix secret keys or database connection strings with NEXT_PUBLIC_.",
      "Never commit actual secret values into .env.example or repository files.",
      "Ensure automated CI pipelines fail if secrets are detected in staged git diffs."
    ],
    verification: [
      "Verify application fails fast with clear message when mandatory env variables are missing.",
      "Verify client bundle analysis confirms 0 server secrets present in browser JavaScript.",
      "Verify .env and .env.local remain untracked in git status."
    ],
    subagent: "security-eng"
  },
  {
    id: 69,
    name: "docker-expert",
    category: "DevOps, Infrastructure, Git & Observability",
    title: "Docker Containerization & Image Optimization",
    description: "Build secure, lightweight, multi-stage Docker container images, optimize layer caching, and configure container runtimes. Use when containerizing applications, writing Dockerfiles, or configuring Docker Compose.",
    objectives: [
      "Build secure, minimal, multi-stage Docker images (< 150MB) for Next.js applications.",
      "Optimize Docker layer caching to accelerate build times in CI/CD pipelines.",
      "Run containers as non-root users with minimal attack surfaces and secure defaults."
    ],
    procedures: [
      "Author multi-stage Dockerfile: deps stage -> builder stage -> runner stage.",
      "Leverage Next.js standalone output mode (output: 'standalone' in next.config.mjs).",
      "Copy only necessary standalone files, public assets, and static assets into runner stage.",
      "Create non-root user (USER nextjs) to execute the Node.js application process.",
      "Define explicit HEALTHCHECK instruction verifying application response on /api/health."
    ],
    commands: [
      "docker build -t app:latest .",
      "docker run -p 3000:3000 app:latest"
    ],
    safeguards: [
      "Never run Docker containers as root user in production environments.",
      "Never copy .env files or secrets into Docker image build layers.",
      "Always include .dockerignore excluding node_modules, .git, and build artifacts."
    ],
    verification: [
      "Verify Docker image builds successfully and image size is within budget (< 200MB).",
      "Verify container boots cleanly and passes Docker HEALTHCHECK probe.",
      "Verify container vulnerability scan reports 0 critical security vulnerabilities."
    ],
    subagent: "backend-eng"
  },
  {
    id: 70,
    name: "production-readiness-audit",
    category: "DevOps, Infrastructure, Git & Observability",
    title: "Production Readiness Review & Launch Gatekeeper",
    description: "Conduct comprehensive pre-launch production readiness reviews across security, reliability, scalability, observability, and compliance. Use before public releases, major version updates, or going live.",
    objectives: [
      "Verify the application satisfies all operational criteria required for production deployment.",
      "Assess system posture across 5 pillars: Security, Reliability, Performance, Observability, and Recovery.",
      "Produce a formal Production Readiness Review (PRR) report with sign-off criteria."
    ],
    procedures: [
      "Audit Security: RLS policies, zero client secrets, rate-limiting, CORS, HTTPS enforcement.",
      "Audit Reliability: graceful degradation, automated database backups, health check endpoints.",
      "Audit Performance: Core Web Vitals, API response latency, query execution plans, bundle sizes.",
      "Audit Observability: structured logging, error tracking, metric dashboards, uptime alerts.",
      "Audit Recovery: disaster recovery runbook, rollback procedure, data loss prevention.",
      "Issue formal Go / No-Go recommendation with remediation checklist for any gaps."
    ],
    commands: [
      "npx tsc --noEmit",
      "npm run lint",
      "npm test"
    ],
    safeguards: [
      "Never authorize a production release if any security or data integrity check fails.",
      "Do not launch without verified rollback and database restore procedures.",
      "Ensure all third-party API quotas and billing budgets are verified before launch."
    ],
    verification: [
      "Verify all 5 production readiness pillars receive green passing scores.",
      "Verify full verification gate (TypeScript, lint, tests) passes with 100% success.",
      "Verify production readiness audit document is completed and signed off."
    ],
    subagent: "architect"
  },
  {
    id: 71,
    name: "monitoring-observability",
    category: "DevOps, Infrastructure, Git & Observability",
    title: "Application Monitoring, Metrics & Observability",
    description: "Implement application performance monitoring, OpenTelemetry instrumentation, structured metrics, synthetic probes, and alerting thresholds. Use when setting up observability, tracing, or uptime monitoring.",
    objectives: [
      "Achieve full-stack observability across frontend and backend services.",
      "Collect structured metrics: request count, error rates, p95/p99 latency, and saturation.",
      "Configure automated alerting on SLO breaches, 5xx error spikes, and crash loops."
    ],
    procedures: [
      "Implement /api/health endpoint returning database connectivity, memory usage, and uptime.",
      "Instrument server route handlers with correlation IDs (x-request-id) across request lifecycles.",
      "Track custom business metrics (paths generated, quizzes completed, search latency).",
      "Configure synthetic health check probes pinging public endpoints every 60 seconds.",
      "Define alerting rules: notify on 5xx error rate > 1% or latency > 1000ms for 3 consecutive minutes."
    ],
    commands: [
      "curl -s http://localhost:3000/api/health",
      "npm test -- tests/health-*.test.ts"
    ],
    safeguards: [
      "Ensure monitoring payloads do not leak customer PII or sensitive request bodies.",
      "Avoid high-cardinality metric labels (e.g. user_id as metric tag) that crash metric databases.",
      "Tune alert thresholds to prevent alert fatigue from transient network hiccups."
    ],
    verification: [
      "Verify /api/health returns HTTP 200 with accurate status metrics.",
      "Verify synthetic probes report 100% availability during normal operation.",
      "Verify simulated server errors trigger alert notifications promptly."
    ],
    subagent: "backend-eng"
  },
  {
    id: 72,
    name: "ai-engineering",
    category: "AI Systems, LLMs & Agentic Engineering",
    title: "AI Systems Engineering & Model Architecture",
    description: "Architect end-to-end AI applications, optimize token budgets, implement model routing, and balance latency versus reasoning accuracy. Use when designing LLM features, AI pipelines, or multi-model systems.",
    objectives: [
      "Design reliable, cost-effective AI systems delivering deterministic, high-value outcomes.",
      "Select optimal models based on task complexity (Flash for speed, Pro for deep reasoning).",
      "Enforce strict token budgeting, caching strategies, and latency minimization."
    ],
    procedures: [
      "Classify incoming AI tasks by cognitive depth: extraction, generation, reasoning, or synthesis.",
      "Route tasks dynamically: use lightweight models (Gemini Flash) for extraction; high-reasoning for curriculum.",
      "Define token budgets per request; enforce maximum output token caps to control cost.",
      "Implement prompt caching for static instructions, schemas, and syllabus reference matrices.",
      "Design fallback hierarchies: primary model -> fast model -> deterministic rule-based engine."
    ],
    commands: [
      "npx tsx scripts/test-gemini.mjs",
      "npm test -- tests/curriculum-*.test.ts"
    ],
    safeguards: [
      "Never deploy LLM features without a deterministic fallback engine for offline resilience.",
      "Avoid sending giant context windows when compact, focused context yields higher accuracy.",
      "Never allow unbounded AI generation loops without hard iteration and token limits."
    ],
    verification: [
      "Verify AI system operates reliably under rate-limited or disconnected conditions.",
      "Verify token usage remains within budgeted cost constraints.",
      "Verify generation latency meets target UX benchmarks (< 3s perceived time)."
    ],
    subagent: "ai-engineer"
  },
  {
    id: 73,
    name: "llm-integration",
    category: "AI Systems, LLMs & Agentic Engineering",
    title: "LLM API Integration, Streaming & Resilient Retries",
    description: "Integrate LLM APIs with streaming responses, exponential backoff retries, rate-limit queueing, and structured output parsing. Use when connecting LLM providers or handling streaming AI responses.",
    objectives: [
      "Implement robust LLM API client connections with automatic retry and backoff logic.",
      "Support real-time streaming text delivery using Server-Sent Events (SSE) or WebSockets.",
      "Handle HTTP 429 rate limits, 503 service overloads, and network timeouts gracefully."
    ],
    procedures: [
      "Implement retry wrapper with exponential backoff and jitter for transient API errors (429, 500, 503).",
      "Implement streaming API route handlers returning ReadableStream for interactive UI text rendering.",
      "Handle stream interruptions and connection closures cleanly on client and server.",
      "Accumulate streamed chunks and validate full output against expected schema upon completion.",
      "Log token usage, response latency, and finish reasons for every LLM interaction."
    ],
    commands: [
      "npm test -- tests/gemini-*.test.ts",
      "npx tsx scripts/test-gemini.mjs"
    ],
    safeguards: [
      "Never retry indefinitely; cap retries at 3 attempts before falling back to alternative engine.",
      "Always set strict HTTP request timeouts (30s) to prevent hanging server connections.",
      "Never buffer entire streaming responses in memory when streaming directly to clients."
    ],
    verification: [
      "Verify streaming responses stream smoothly to client UI without buffering lags.",
      "Verify exponential backoff successfully recovers from simulated 429 rate limits.",
      "Verify final assembled response passes schema validation."
    ],
    subagent: "ai-engineer"
  },
  {
    id: 74,
    name: "prompt-engineering",
    category: "AI Systems, LLMs & Agentic Engineering",
    title: "Production Prompt Engineering & Grounding",
    description: "Author precise, grounded system instructions, few-shot examples, chain-of-thought prompts, and output constraints. Use when crafting prompts for curriculum generation, tutors, quizzes, or monographs.",
    objectives: [
      "Design high-fidelity, deterministic prompts yielding consistent structured outputs.",
      "Ground prompts in academic standards, authoritative syllabi, and strict role boundaries.",
      "Eliminate hallucinations, preamble conversational filler, and formatting errors."
    ],
    procedures: [
      "Structure prompts using clear XML tags: <context>, <instructions>, <constraints>, <output_format>.",
      "Provide high-quality few-shot examples demonstrating desired tone, depth, and schema adherence.",
      "Instruct model to output raw JSON strictly without conversational preamble or markdown fences.",
      "Ground generation in verified academic syllabi (JEE, NEET, CBSE, MIT OCW, NPTEL).",
      "Test prompts against adversarial inputs and edge cases to ensure constraint enforcement."
    ],
    commands: [
      "npm test -- tests/prompts-*.test.ts",
      "npx tsx scripts/test-quiz.ts"
    ],
    safeguards: [
      "Never use ambiguous, vague instructions ('make it good'); always define exact criteria.",
      "Never allow the model to invent fake academic faculty, courses, or citations.",
      "Ensure prompt tokens are budgeted efficiently without redundant or verbose instructions."
    ],
    verification: [
      "Verify model outputs parse as valid JSON matching schema 100% of the time.",
      "Verify generated content strictly adheres to academic syllabus constraints.",
      "Verify prompt produces consistent high-quality outputs across repeated runs."
    ],
    subagent: "ai-engineer"
  },
  {
    id: 75,
    name: "rag-engineering",
    category: "AI Systems, LLMs & Agentic Engineering",
    title: "Retrieval-Augmented Generation (RAG) & Vector Search",
    description: "Design and implement Retrieval-Augmented Generation pipelines: document chunking, embeddings, vector indexing, hybrid search, and context assembly. Use when building search engines, document QA, or syllabus retrievers.",
    objectives: [
      "Build high-precision RAG pipelines retrieving verified context for LLM generation.",
      "Optimize text chunking strategies (semantic chunking, sentence-window) with metadata tagging.",
      "Implement hybrid search combining dense vector embeddings with BM25 lexical keyword search."
    ],
    procedures: [
      "Ingest documents and segment text into cohesive chunks (500-1000 tokens) with 10% overlap.",
      "Generate text embeddings using text-embedding-004 or modern embedding models.",
      "Store and index vectors in PostgreSQL using pgvector (HNSW / IVFFlat indexes).",
      "Execute hybrid queries combining vector similarity (<=> cosine distance) with full-text search.",
      "Rerank retrieved chunks and assemble compact, relevant context windows for generation."
    ],
    commands: [
      "npx tsx scripts/compile-taxonomy.js",
      "npm test -- tests/rag-*.test.ts"
    ],
    safeguards: [
      "Avoid stuffing excessive retrieved context that causes 'lost in the middle' model degradation.",
      "Never store un-sanitized source documents containing sensitive PII in public vector stores.",
      "Ensure all retrieved chunks carry source attribution metadata (title, URL, page, author)."
    ],
    verification: [
      "Verify retrieval recall and precision on benchmark question-answering evaluation datasets.",
      "Verify generated answers cite specific source chunks accurately without hallucination.",
      "Verify vector similarity search executes in < 20ms using pgvector HNSW indexes."
    ],
    subagent: "ai-engineer"
  }
];
