export interface SkillDefinition {
  id: number;
  name: string;
  category: string;
  title: string;
  description: string;
  objectives: string[];
  procedures: string[];
  commands: string[];
  safeguards: string[];
  verification: string[];
  subagent: string;
}

export const SKILL_CATEGORIES = [
  "Core Full-Stack & Software Architecture",
  "Automated Debugging & Root Cause Analysis",
  "Automated Testing & Verification QA",
  "Code Review, Audit & Quality Assurance",
  "Frontend, UI/UX, DevTools & Performance",
  "Database, Supabase & Data Integrity",
  "Google Ecosystem, APIs & Mobile",
  "DevOps, Infrastructure, Git & Observability",
  "AI Systems, LLMs & Agentic Engineering",
  "Technical Documentation, Product & Repository Ops",
  "Deep System Verification, Safety & Acceptance",
  "Metacognitive Engineering Orchestration"
] as const;

export const SKILLS_1_TO_25: SkillDefinition[] = [
  {
    id: 1,
    name: "modern-web-guidance",
    category: "Core Full-Stack & Software Architecture",
    title: "Modern Web Engineering Guidance",
    description: "Architect and build modern web applications leveraging modern standards, progressive enhancement, HTTP/3, streaming SSR, and edge compute. Use when evaluating web capabilities, designing client-server boundaries, or upgrading legacy web architectures.",
    objectives: [
      "Enforce modern standards-compliant web architectures (WHATWG, W3C, RFC 9114).",
      "Optimize data-fetching topologies, streaming SSR boundaries, and hydration contracts.",
      "Maximize Core Web Vitals via modern layout, asset delivery, and caching strategies."
    ],
    procedures: [
      "Audit target application architecture against modern web standards and baseline browser compatibility.",
      "Partition client vs server responsibilities using React Server Components (RSC) and HTTP streaming.",
      "Implement edge-ready middleware for localized authentication, routing, and geo-distributed caching.",
      "Enforce zero-blocking scripts, responsive responsive media delivery, and resource hints (preconnect, dns-prefetch)."
    ],
    commands: [
      "npx lighthouse --chrome-flags=\"--headless\" http://localhost:3000 --output=json",
      "npx @next/bundle-analyzer"
    ],
    safeguards: [
      "Never ship unminified, blocking vendor scripts in document head.",
      "Avoid hydration mismatches by synchronizing server and client rendering baselines.",
      "Prevent client-side bundling of server-only secrets or database clients."
    ],
    verification: [
      "Verify zero hydration errors in browser console.",
      "Verify 90+ Lighthouse Performance and Best Practices score.",
      "Verify all interactive elements function with progressive enhancement where applicable."
    ],
    subagent: "frontend-eng"
  },
  {
    id: 2,
    name: "senior-fullstack-engineer",
    category: "Core Full-Stack & Software Architecture",
    title: "Senior Full-Stack Systems Engineering",
    description: "Lead end-to-end full-stack software development with strict architectural separation of concerns, resilient backend services, and high-fidelity frontends. Use when delivering comprehensive features spanning database, API, and UI layers.",
    objectives: [
      "Design and deliver vertically integrated full-stack features from schema to UI.",
      "Guarantee strict type-safety across client-server-database boundaries.",
      "Ensure resilient error propagation and intuitive user recovery workflows."
    ],
    procedures: [
      "Model domain entities in database schemas with foreign keys, indexes, and RLS policies.",
      "Construct type-safe backend services encapsulating domain business logic in src/services/.",
      "Expose thin REST API route handlers with Zod validation and structured error envelopes.",
      "Build high-fidelity UI components implementing 4 discrete states: loading, empty, error, populated.",
      "Write integration tests covering the end-to-end user lifecycle across all layers."
    ],
    commands: [
      "npx tsc --noEmit",
      "npm run lint",
      "npm test"
    ],
    safeguards: [
      "Never fabricate mock data in production pathways.",
      "Never expose database credentials or service-role keys to client components.",
      "Never allow unhandled promise rejections or unvalidated query parameters."
    ],
    verification: [
      "Verify end-to-end data flow passes integration tests with real persistence.",
      "Verify UI correctly transitions between loading, populated, and error states.",
      "Verify zero TypeScript or ESLint warnings."
    ],
    subagent: "backend-eng"
  },
  {
    id: 3,
    name: "software-architecture",
    category: "Core Full-Stack & Software Architecture",
    title: "Software Architecture & System Design",
    description: "Formulate resilient, scalable software architectures, domain-driven design models, and modular system boundaries. Use when designing new systems, refactoring architectural boundaries, or writing Architecture Decision Records (ADRs).",
    objectives: [
      "Define clean bounded contexts, domain models, and service interfaces.",
      "Evaluate architectural trade-offs between monolithic modularity and microservices.",
      "Enforce unidirectional data flows and clear dependency inversion principles."
    ],
    procedures: [
      "Analyze business requirements and map core domain models, aggregates, and value objects.",
      "Document system architecture, component contracts, and data topology in docs/architecture/.",
      "Produce Architecture Decision Records (ADRs) detailing context, trade-offs, and consequences.",
      "Enforce dependency boundaries: domain logic must never depend on external transport layers."
    ],
    commands: [
      "npx dependency-cruiser --validate src",
      "git log --oneline --graph"
    ],
    safeguards: [
      "Avoid cyclic dependencies between service packages and UI modules.",
      "Avoid premature microservice distribution when modular monolith boundaries suffice.",
      "Never introduce architectural changes without verifying backward compatibility."
    ],
    verification: [
      "Verify system architecture passes dependency-cruiser cycle audits.",
      "Verify all domain invariants are encapsulated within validated service boundaries.",
      "Verify ADR is reviewed and signed off against business requirements."
    ],
    subagent: "architect"
  },
  {
    id: 4,
    name: "code-generation",
    category: "Core Full-Stack & Software Architecture",
    title: "Production-Grade Code Generation",
    description: "Synthesize clean, robust, zero-mock, fully typed TypeScript code following established repository design patterns. Use when creating new modules, implementing feature requests, or generating boilerplate services.",
    objectives: [
      "Generate hermetic, production-ready code with complete functional implementations.",
      "Adhere strictly to project conventions, naming rules, and directory structures.",
      "Guarantee zero stubbed methods, placeholder comments, or unhandled branches."
    ],
    procedures: [
      "Inspect surrounding files and architectural guidelines to mirror project idiomatic patterns.",
      "Define explicit TypeScript types and Zod schemas before authoring implementation logic.",
      "Implement the complete logic without omitting edge cases, error conditions, or cleanup.",
      "Add comprehensive unit and integration tests covering positive, negative, and edge scenarios."
    ],
    commands: [
      "npx tsc --noEmit",
      "npm test"
    ],
    safeguards: [
      "Never generate TODO, FIXME, or mock return values in production code.",
      "Never use loose 'as any' casting to bypass TypeScript type-safety.",
      "Preserve existing comments and docstrings in edited files."
    ],
    verification: [
      "Verify newly generated files compile cleanly with zero TypeScript errors.",
      "Verify 100% test pass rate for all newly generated modules.",
      "Verify code adheres to ESLint rules without disabling warnings."
    ],
    subagent: "backend-eng"
  },
  {
    id: 5,
    name: "refactoring-expert",
    category: "Core Full-Stack & Software Architecture",
    title: "Behavior-Preserving Code Refactoring",
    description: "Refactor legacy or high-complexity codebases to improve readability, maintainability, and testability while preserving 100% behavioral equivalence. Use when addressing code smells, decomposing God objects, or extracting reusable services.",
    objectives: [
      "Decompose monolithic functions and bloated components into modular, single-purpose units.",
      "Eliminate code duplication (DRY) and unnecessary cognitive complexity.",
      "Guarantee behavioral equivalence with pre-existing automated test suites."
    ],
    procedures: [
      "Run existing test suite to establish an airtight baseline of system behavior.",
      "Identify code smells: high cyclomatic complexity, long methods, duplicate logic, feature envy.",
      "Apply Martin Fowler refactoring patterns (Extract Method, Move Function, Replace Conditional with Polymorphism).",
      "Verify test suite continuously after every atomic refactoring step."
    ],
    commands: [
      "npm test",
      "npx tsc --noEmit"
    ],
    safeguards: [
      "Never mix functional feature additions with pure refactoring commits.",
      "Never remove or alter existing tests to match unintentional behavioral shifts.",
      "Ensure rollback capability by keeping git refactoring commits atomic."
    ],
    verification: [
      "Verify all 341+ unit and integration tests remain 100% green without modification.",
      "Verify cyclomatic complexity and file size are meaningfully reduced.",
      "Verify zero runtime regressions in dependent modules."
    ],
    subagent: "code-reviewer"
  },
  {
    id: 6,
    name: "typescript-expert",
    category: "Core Full-Stack & Software Architecture",
    title: "Advanced TypeScript Engineering & Type Safety",
    description: "Enforce strict TypeScript type systems, branded nominal typing, discriminated unions, and generic constraints. Use when fixing complex type errors, designing type-safe APIs, or eliminating unsafe type assertions.",
    objectives: [
      "Enforce strict mode TypeScript with zero 'any' or loose type assertions.",
      "Design expressive type contracts using discriminated unions, generics, and template literals.",
      "Implement runtime-to-static type synchronization using Zod type inference (z.infer<T>)."
    ],
    procedures: [
      "Audit codebase with 'npx tsc --noEmit' to detect implicit any, loose casts, or unsound types.",
      "Replace 'any' with explicit discriminated unions, generics, or unknown with type guards.",
      "Model domain IDs and primitives with branded types (e.g. type UserId = string & { readonly __brand: unique symbol }).",
      "Leverage utility types (Pick, Omit, Readonly, Partial, Record) for robust API modeling."
    ],
    commands: [
      "npx tsc --noEmit",
      "npx tsc --build --force"
    ],
    safeguards: [
      "Never disable tsconfig strict settings (noImplicitAny, strictNullChecks, etc.).",
      "Never cast through 'as unknown as T' unless operating at a verified boundary adapter.",
      "Avoid circular type definitions that slow down TypeScript compilation."
    ],
    verification: [
      "Verify 'npx tsc --noEmit' returns exit code 0 with 0 errors.",
      "Verify exported interfaces and types are exported cleanly without type truncation.",
      "Verify autocomplete and intellisense operate accurately across consumer modules."
    ],
    subagent: "architect"
  },
  {
    id: 7,
    name: "react-nextjs-expert",
    category: "Core Full-Stack & Software Architecture",
    title: "React 18 & Next.js App Router Mastery",
    description: "Develop high-performance React 18 applications using Next.js App Router, Server Components, Client Components, Suspense boundaries, and Server Actions. Use when building UI routes, optimizing client bundles, or debugging hydration.",
    objectives: [
      "Master Next.js 14 App Router patterns (layout.tsx, page.tsx, loading.tsx, error.tsx).",
      "Enforce proper client-server boundaries ('use client' only when state or DOM hooks are required).",
      "Implement streaming SSR with React Suspense for instant perceived loading."
    ],
    procedures: [
      "Default all components to React Server Components (RSC) to minimize client bundle footprint.",
      "Isolate interactive leaves into focused Client Components marked with 'use client'.",
      "Wrap asynchronous server components and dynamic data-fetching in <Suspense fallback={<Skeleton />}>.",
      "Leverage Next.js route handlers (app/api/**/route.ts) for secure server-side logic.",
      "Implement route error boundaries (error.tsx) with user-friendly recovery buttons."
    ],
    commands: [
      "npx next build",
      "npx next lint"
    ],
    safeguards: [
      "Never mark root or layout components with 'use client' unnecessarily.",
      "Never import server-only modules (fs, database clients) into client components.",
      "Avoid cascading useEffect waterfalls on the client when data can be fetched on the server."
    ],
    verification: [
      "Verify Next.js build succeeds with static/dynamic route categorization intact.",
      "Verify zero client-side hydration mismatch warnings.",
      "Verify page load performance meets Core Web Vitals thresholds."
    ],
    subagent: "frontend-eng"
  },
  {
    id: 8,
    name: "api-development",
    category: "Core Full-Stack & Software Architecture",
    title: "RESTful API Architecture & Contract Design",
    description: "Design and implement production-ready REST route handlers with Zod schema validation, deterministic HTTP status codes, structured error envelopes, and idempotency. Use when creating or updating API endpoints in src/app/api/.",
    objectives: [
      "Build consistent, predictable RESTful APIs following standard HTTP verb semantics.",
      "Validate 100% of incoming request payloads (body, query params, route params) with Zod.",
      "Enforce standardized JSON error response envelopes and correct HTTP status codes."
    ],
    procedures: [
      "Define request and response validation schemas in src/lib/api-schemas.ts using Zod.",
      "Implement explicit route handlers in src/app/api/<route>/route.ts (GET, POST, PUT, DELETE).",
      "Parse and validate incoming inputs with schema.safeParse(); return 400 on failure with details.",
      "Delegate all domain logic to backend services in src/services/; keep routes thin controllers.",
      "Wrap handler logic in structured try/catch returning standard error envelopes: { error, code, details }."
    ],
    commands: [
      "npm test -- tests/api-*.test.ts",
      "npx tsc --noEmit"
    ],
    safeguards: [
      "Never return unformatted raw exceptions or stack traces to API clients in production.",
      "Never trust unvalidated client input or skip authentication checks.",
      "Ensure mutating endpoints (POST, DELETE) are protected against CSRF and cross-tenant leakage."
    ],
    verification: [
      "Verify API routes return 200/201 on valid payloads, 400 on malformed input, 401 when unauthorized.",
      "Verify error response matches schema: { error: string, code: string, details?: any }.",
      "Verify automated API integration tests pass with 100% assertion coverage."
    ],
    subagent: "backend-eng"
  },
  {
    id: 9,
    name: "documentation-research",
    category: "Core Full-Stack & Software Architecture",
    title: "Technical Documentation Research & Synthesis",
    description: "Perform authoritative documentation lookups across upstream SDKs, RFC standards, library change logs, and API specifications. Use when investigating new libraries, verifying API contracts, or researching breaking changes.",
    objectives: [
      "Retrieve and verify ground-truth documentation from official SDKs and vendor docs.",
      "Identify version-specific breaking changes, deprecation notices, and migration paths.",
      "Synthesize complex technical specifications into concise, actionable implementation guidance."
    ],
    procedures: [
      "Identify the exact package, version, and official documentation source.",
      "Use targeted searches across official documentation (or documentation MCP servers when available).",
      "Inspect upstream type definitions (d.ts) directly in node_modules to verify exact method signatures.",
      "Extract code examples, configuration keys, and error contracts into actionable notes."
    ],
    commands: [
      "npm info <package-name> versions --json",
      "npm view <package-name> dist-tags"
    ],
    safeguards: [
      "Never rely on outdated tutorials or unverified forum snippets for critical API contracts.",
      "Never assume API signatures without checking installed type definitions.",
      "Always check the repository's package.json to match the exact installed semver range."
    ],
    verification: [
      "Verify API calls and signatures match the exact installed package version in package.json.",
      "Verify zero deprecated method warnings during build or execution.",
      "Verify research findings are documented with authoritative source links."
    ],
    subagent: "research"
  },
  {
    id: 10,
    name: "dependency-management",
    category: "Core Full-Stack & Software Architecture",
    title: "Dependency Management & Vulnerability Auditing",
    description: "Manage package dependencies, resolve peer conflicts, maintain lockfile integrity, and audit security vulnerabilities. Use when adding packages, upgrading libraries, or fixing npm audit warnings.",
    objectives: [
      "Maintain lockfile integrity (package-lock.json / pnpm-lock.yaml) with deterministic resolution.",
      "Audit and remediate security vulnerabilities reported by package managers.",
      "Prevent dependency bloat, duplicate packages, and incompatible peer dependencies."
    ],
    procedures: [
      "Audit existing dependencies using 'npm audit' to identify high/critical security advisories.",
      "Evaluate package candidates for bundle size, maintenance activity, and security posture.",
      "Install required dependencies with strict semver constraints matching project standards.",
      "Verify lockfile cleanliness and resolve any peer dependency collisions cleanly.",
      "Execute full test suite to guarantee zero regression after dependency updates."
    ],
    commands: [
      "npm audit",
      "npm ls --depth=1",
      "npm outdated"
    ],
    safeguards: [
      "Never install unverified, obscure, or malicious third-party packages.",
      "On Windows, follow sandbox rules for package manager commands (e.g. pnpm changes outside sandbox).",
      "Never use '--force' or '--legacy-peer-deps' blindly without resolving the root conflict."
    ],
    verification: [
      "Verify 'npm audit' reports 0 high/critical vulnerabilities.",
      "Verify lockfile is committed and clean in git status.",
      "Verify full application build and test suite pass without resolution errors."
    ],
    subagent: "backend-eng"
  },
  {
    id: 11,
    name: "auto-debugging",
    category: "Automated Debugging & Root Cause Analysis",
    title: "Autonomous Systematic Debugging",
    description: "Systematically isolate, reproduce, and resolve software bugs using hypothesis-driven debugging, binary search isolation, and runtime inspection. Use when investigating unexpected behavior, failed tests, or defect reports.",
    objectives: [
      "Isolate bug reproduction steps with minimal reproducible test cases.",
      "Formulate and test falsifiable hypotheses regarding failure mechanisms.",
      "Identify the exact line, contract violation, or state corruption causing the failure."
    ],
    procedures: [
      "Replicate the defect locally using a targeted unit or integration test case.",
      "Inspect stack traces, error payloads, and surrounding execution flow.",
      "Formulate hypotheses and verify with targeted assertions or focused debugger logging.",
      "Trace state mutations backwards to identify the origin of corruption.",
      "Implement the fix and verify that the reproduction test transitions from red to green."
    ],
    commands: [
      "npx tsx --test <path-to-test>",
      "git bisect start"
    ],
    safeguards: [
      "Never guess or make speculative code changes without understanding root cause.",
      "Never mask errors by swallowing exceptions in empty catch blocks.",
      "Never alter test expectations to make a broken implementation pass."
    ],
    verification: [
      "Verify reproduction test passes consistently across multiple executions.",
      "Verify no other tests in the regression suite broke as a side-effect.",
      "Verify root cause analysis is documented clearly."
    ],
    subagent: "qa-eng"
  },
  {
    id: 12,
    name: "auto-fix-engine",
    category: "Automated Debugging & Root Cause Analysis",
    title: "Autonomous Self-Correcting Fix Engine",
    description: "Execute closed-loop, surgical error remediation that automatically analyzes failures, formulates patches, applies fixes, and verifies resolution. Use when resolving compilation, linting, or automated test errors.",
    objectives: [
      "Provide an automated, iterative loop: Observe -> Hypothesize -> Patch -> Verify.",
      "Apply surgical, minimal code edits that resolve failures without introducing side-effects.",
      "Terminate loop cleanly upon green verification or rollback safely on persistent failure."
    ],
    procedures: [
      "Capture the exact error output, exit code, and failing assertions from the build or test runner.",
      "Parse stack traces to locate the exact source files and line ranges requiring correction.",
      "Draft a targeted patch addressing the root cause while preserving surrounding contracts.",
      "Apply the patch using surgical file editing tools.",
      "Re-run the exact failing command; iterate up to 3 times if errors mutate; verify clean exit."
    ],
    commands: [
      "npx tsc --noEmit",
      "npm test"
    ],
    safeguards: [
      "Abort and rollback edits if 3 successive fix attempts fail to resolve the defect.",
      "Never delete functional code or tests to force a green test result.",
      "Keep diffs minimal and focused exclusively on the error."
    ],
    verification: [
      "Verify targeted test transitions to passing state.",
      "Verify complete test suite and TypeScript checks pass 100%.",
      "Verify git diff is tight, clean, and free of extraneous modifications."
    ],
    subagent: "qa-eng"
  },
  {
    id: 13,
    name: "root-cause-analysis",
    category: "Automated Debugging & Root Cause Analysis",
    title: "Root Cause Analysis (RCA) & Failure Decomposition",
    description: "Conduct rigorous Root Cause Analysis using 5 Whys, failure mode effect analysis, and execution trace timeline reconstruction. Use when investigating recurring defects, data corruption incidents, or complex distributed bugs.",
    objectives: [
      "Uncover the foundational root cause behind superficial symptoms and error manifestations.",
      "Map out the causal chain of events from initial trigger to terminal failure.",
      "Produce actionable structural recommendations preventing class-wide failure recurrence."
    ],
    procedures: [
      "Collect all available artifacts: logs, timestamps, error payloads, inputs, environment state.",
      "Reconstruct the timeline of events preceding the failure.",
      "Apply the 5 Whys methodology: drill down into each contributing factor until the systemic defect is isolated.",
      "Categorize failure: schema mismatch, concurrency race, boundary validation gap, or state leak.",
      "Document RCA findings with Root Cause, Impact, Resolution, and Prevention Checklist."
    ],
    commands: [
      "git log -p -S <symbol>",
      "git blame <file>"
    ],
    safeguards: [
      "Do not stop at superficial causes (e.g. 'null pointer') without identifying why it was null.",
      "Ensure findings distinguish between direct triggers and systemic vulnerabilities.",
      "Avoid assigning blame to tooling; focus on code contracts and architectural boundaries."
    ],
    verification: [
      "Verify root cause explanation accounts for 100% of observed failure symptoms.",
      "Verify the proposed fix eliminates the systemic root cause, not just the symptom.",
      "Verify regression tests prevent recurrence under identical trigger conditions."
    ],
    subagent: "architect"
  },
  {
    id: 14,
    name: "runtime-error-detection",
    category: "Automated Debugging & Root Cause Analysis",
    title: "Runtime Error Detection & Exception Handling",
    description: "Detect, catch, and handle unhandled promise rejections, null/undefined dereferences, React hydration mismatches, and async exceptions. Use when debugging crashed processes, browser console errors, or unstable background workers.",
    objectives: [
      "Intercept all uncaught exceptions, unhandled rejections, and fatal runtime crashes.",
      "Enforce defensive optional chaining (?.) and nullish coalescing (??) at untrusted boundaries.",
      "Implement robust error boundaries and graceful fallback mechanisms."
    ],
    procedures: [
      "Audit call sites interacting with dynamic data or external APIs for unhandled null/undefined.",
      "Introduce global unhandledRejection and uncaughtException handlers in server runtimes.",
      "Implement React ErrorBoundary components wrapping route segments and interactive widgets.",
      "Sanitize error payloads to prevent sensitive credential or internal schema leakage.",
      "Verify runtime recovers gracefully without leaving user in a broken or frozen state."
    ],
    commands: [
      "node -e \"process.on('unhandledRejection', (r) => { console.error(r); process.exit(1); });\"",
      "npm test"
    ],
    safeguards: [
      "Never allow an unhandled promise rejection to terminate the Node.js server process.",
      "Never expose database connection strings, auth tokens, or internal stack traces to users.",
      "Avoid catch blocks that swallow errors silently without logging or notifying the user."
    ],
    verification: [
      "Verify test suite contains test cases simulating null/undefined API responses.",
      "Verify error boundaries render actionable recovery UI with retry capabilities.",
      "Verify zero unhandled rejections during test suite execution."
    ],
    subagent: "backend-eng"
  },
  {
    id: 15,
    name: "typescript-error-fixer",
    category: "Automated Debugging & Root Cause Analysis",
    title: "Automated TypeScript Error Resolution",
    description: "Parse, diagnose, and resolve TypeScript compiler errors (TS2322, TS2345, TS2769, etc.) by repairing type definitions, generics, and nullability contracts. Use when 'npx tsc --noEmit' fails.",
    objectives: [
      "Rapidly resolve TypeScript compilation errors without disabling strict compiler checks.",
      "Align property types, nullability modifiers, and generic constraints between caller and callee.",
      "Preserve intended business semantics while satisfying the TypeScript type checker."
    ],
    procedures: [
      "Run 'npx tsc --noEmit' and capture the compiler diagnostics with line numbers and TS error codes.",
      "Analyze the compiler message: identify expected type vs provided type.",
      "Inspect the declaration of the target type and the expression supplying the value.",
      "Adjust the source code to provide the required structural shape, or refine the type signature.",
      "Re-run 'npx tsc --noEmit' to ensure zero remaining errors."
    ],
    commands: [
      "npx tsc --noEmit",
      "npx tsc --noEmit --pretty"
    ],
    safeguards: [
      "Never suppress type errors with '// @ts-ignore' or '// @ts-nocheck'.",
      "Never cast away type errors using 'as any' or loose type assertions.",
      "Never make mandatory schema fields optional just to bypass compiler errors."
    ],
    verification: [
      "Verify 'npx tsc --noEmit' exits with code 0.",
      "Verify all function signatures accurately reflect input and output types.",
      "Verify existing tests continue to pass after type adjustments."
    ],
    subagent: "architect"
  },
  {
    id: 16,
    name: "build-error-recovery",
    category: "Automated Debugging & Root Cause Analysis",
    title: "Build Graph Recovery & Compilation Repair",
    description: "Diagnose and repair build failures across Next.js, Webpack, Turbopack, Babel, and TypeScript toolchains. Use when 'npm run build' or Next.js compilation fails.",
    objectives: [
      "Identify and resolve bundling errors, module resolution failures, and circular build cycles.",
      "Fix Next.js App Router route segment export conflicts and server/client boundary collisions.",
      "Ensure fast, reproducible, clean production builds."
    ],
    procedures: [
      "Execute the build command and capture the full compilation trace.",
      "Inspect the failure stage: module resolution, syntax parsing, tree-shaking, or static page generation.",
      "Resolve broken file paths, missing aliases, or incorrect package exports in tsconfig.json.",
      "Separate server-only dependencies from client bundles using 'server-only' package.",
      "Execute a clean build after removing transient cache directories (.next, dist, etc.)."
    ],
    commands: [
      "npm run build",
      "npx next build"
    ],
    safeguards: [
      "Do not commit build artifacts (.next/, dist/) into version control.",
      "Do not disable webpack or Next.js optimizations to work around bundle errors.",
      "Avoid dynamic require() statements that break static module analysis."
    ],
    verification: [
      "Verify 'npm run build' completes with exit code 0.",
      "Verify static and dynamic routes generate without errors during pre-rendering.",
      "Verify total bundle size is within acceptable performance budgets."
    ],
    subagent: "backend-eng"
  },
  {
    id: 17,
    name: "dependency-conflict-resolver",
    category: "Automated Debugging & Root Cause Analysis",
    title: "Dependency Collision & Peer Conflict Resolution",
    description: "Diagnose and resolve conflicting transitive dependencies, duplicate package versions, and peer dependency mismatches. Use when package installation fails or runtime symbol collisions occur.",
    objectives: [
      "Diagnose hoisting conflicts, duplicate singleton packages (React, Next), and peer mismatches.",
      "Align semver ranges in package.json to establish a cohesive dependency graph.",
      "Guarantee deterministic installations across development and CI/CD pipelines."
    ],
    procedures: [
      "Inspect the dependency tree using 'npm ls <package-name>' to trace conflicting versions.",
      "Identify peer dependency requirements declared by conflicting libraries.",
      "Use npm overrides or resolution blocks in package.json to force a compatible version where safe.",
      "Re-generate package-lock.json cleanly and verify resolution integrity.",
      "Run tests to ensure no runtime breakages resulted from version alignment."
    ],
    commands: [
      "npm ls <package-name>",
      "npm ls --depth=2",
      "npm explain <package-name>"
    ],
    safeguards: [
      "Never use '--legacy-peer-deps' as a permanent fix in package scripts.",
      "Never allow multiple conflicting versions of React or React DOM to be bundled.",
      "Always check release notes for breaking changes before overriding transitive versions."
    ],
    verification: [
      "Verify 'npm ls' reports no invalid or extraneous packages.",
      "Verify 'npm test' and 'npm run build' succeed without resolution warnings.",
      "Verify only one instance of core libraries exists in the active bundle."
    ],
    subagent: "backend-eng"
  },
  {
    id: 18,
    name: "regression-prevention",
    category: "Automated Debugging & Root Cause Analysis",
    title: "Regression Blast Radius Mapping & Prevention",
    description: "Calculate change blast radius, evaluate dependency ripple effects, and prevent functional regressions before merging changes. Use during the 9-step cycle before and after code modifications.",
    objectives: [
      "Map all direct and indirect dependencies affected by proposed code modifications.",
      "Enforce backward compatibility across API contracts, database schemas, and UI components.",
      "Verify that all pre-existing capabilities remain functional after code changes."
    ],
    procedures: [
      "Perform static dependency analysis on modified files to identify all importing consumers.",
      "Trace database schema dependencies: verify queries, views, and migrations won't break existing data.",
      "Formulate a regression test matrix encompassing all identified consumer components.",
      "Execute the entire test suite (all 341+ tests) to guarantee zero side-effects.",
      "Conduct manual or automated sanity checks on critical user journeys."
    ],
    commands: [
      "git diff --name-only origin/main",
      "npm test"
    ],
    safeguards: [
      "Never assume a localized helper modification has zero blast radius.",
      "Never delete or mutate public function signatures without updating all call sites.",
      "Ensure items in deletion registries or cache layers are not resurrected or broken."
    ],
    verification: [
      "Verify 100% test pass rate across the full repository test suite.",
      "Verify all dependent components compile cleanly without signature mismatches.",
      "Verify no unhandled breaking changes exist in API request/response contracts."
    ],
    subagent: "qa-eng"
  },
  {
    id: 19,
    name: "self-verification",
    category: "Automated Debugging & Root Cause Analysis",
    title: "Hermetic Automated Self-Verification",
    description: "Execute the complete three-tier verification gate (TypeScript type safety, ESLint linting, and automated test suites) before committing any change. Use as the mandatory final step for every task.",
    objectives: [
      "Enforce the 3-step verification protocol: TypeScript -> ESLint -> Automated Tests.",
      "Guarantee zero unverified code changes reach the user or production branch.",
      "Provide transparent verification evidence in every mission report."
    ],
    procedures: [
      "Step 1: Run 'npx tsc --noEmit' and assert 0 errors.",
      "Step 2: Run 'npm run lint' and assert 0 warnings and 0 errors.",
      "Step 3: Run 'npm test' and assert 100% pass rate across all suites.",
      "If any step fails, invoke auto-fix-engine and repeat verification until green.",
      "Summarize verification outcomes with exact command outputs and metrics."
    ],
    commands: [
      "npx tsc --noEmit",
      "npm run lint",
      "npm test"
    ],
    safeguards: [
      "Never skip verification because 'the change is simple'.",
      "Never disable failing tests or comment out assertions to pass verification.",
      "Never report a task as complete without actual terminal execution evidence."
    ],
    verification: [
      "Verify exit code 0 on 'npx tsc --noEmit'.",
      "Verify exit code 0 on 'npm run lint'.",
      "Verify 341+ passing tests with 0 failures on 'npm test'."
    ],
    subagent: "qa-eng"
  },
  {
    id: 20,
    name: "log-analysis",
    category: "Automated Debugging & Root Cause Analysis",
    title: "Structured Log Analysis & Stack Symbolication",
    description: "Parse, filter, and correlate structured server and client application logs to diagnose runtime anomalies and trace user sessions. Use when analyzing server error logs, network traces, or crash dumps.",
    objectives: [
      "Extract actionable signals, error codes, and correlation IDs from high-volume logs.",
      "Symbolicate minified production stack traces back to original TypeScript source lines.",
      "Reconstruct end-to-end request lifecycle across distributed service boundaries."
    ],
    procedures: [
      "Ingest application logs from console, file output, or monitoring endpoints.",
      "Filter logs by severity level (ERROR, WARN, FATAL) and correlation/request ID.",
      "Parse structured JSON metadata (timestamp, user_id, route, duration, status).",
      "Map stack trace source positions using source maps if minified.",
      "Identify the initiating event and trace the propagation chain leading to the error log."
    ],
    commands: [
      "Get-Content app.log -Tail 100",
      "npx source-map-cli resolve <map-file> <line> <column>"
    ],
    safeguards: [
      "Ensure logs are sanitized to prevent exposing PII, passwords, or bearer tokens.",
      "Avoid parsing massive log files into memory at once; use streaming or tail filters.",
      "Verify log levels are configured appropriately to avoid log spam in production."
    ],
    verification: [
      "Verify identified log event correlates directly with the reported defect.",
      "Verify stack trace points to exact source file and line number.",
      "Verify fix eliminates the recurring error log in subsequent test runs."
    ],
    subagent: "backend-eng"
  },
  {
    id: 21,
    name: "automated-testing",
    category: "Automated Testing & Verification QA",
    title: "Automated Testing Strategy & Test Pyramid Calibration",
    description: "Design and orchestrate balanced automated test strategies combining unit, integration, and end-to-end tests across the entire test pyramid. Use when establishing testing frameworks or expanding test coverage.",
    objectives: [
      "Implement a balanced test pyramid (heavy unit foundation, focused integration, targeted E2E).",
      "Maximize regression detection while maintaining fast developer feedback loops.",
      "Establish automated CI test execution gates with zero tolerance for flaky tests."
    ],
    procedures: [
      "Audit current test coverage and identify critical untested paths across services and routes.",
      "Design unit tests for pure domain functions and algorithmic logic in tests/.",
      "Design integration tests for API routes and database service boundaries in tests/.",
      "Design browser E2E tests for core user conversion and auth journeys.",
      "Organize test runners to execute fast unit suites first, followed by heavier suites."
    ],
    commands: [
      "npm test",
      "npx tsx --test tests/**/*.test.ts"
    ],
    safeguards: [
      "Never write flaky tests dependent on unseeded random data or uncontrolled timers.",
      "Avoid heavy E2E tests for simple business logic better tested in unit tests.",
      "Never mock what you don't own without verifying the real contract."
    ],
    verification: [
      "Verify test suite completes within target duration budget.",
      "Verify 100% of test suites pass deterministically across consecutive runs.",
      "Verify all critical user paths have corresponding test assertions."
    ],
    subagent: "qa-eng"
  },
  {
    id: 22,
    name: "playwright-browser-testing",
    category: "Automated Testing & Verification QA",
    title: "Playwright Headless Browser Testing & Automation",
    description: "Develop robust, resilient headless browser tests using Playwright with locator best practices, Page Object Models, and network request interception. Use when testing user journeys, cross-browser behavior, or UI workflows.",
    objectives: [
      "Author reliable browser automation tests resistant to DOM structure changes.",
      "Test complete user workflows (registration, login, path creation, quiz completion).",
      "Capture screenshots, DOM snapshots, and network traces on test failure."
    ],
    procedures: [
      "Initialize Playwright test configuration with target viewports (desktop, mobile).",
      "Implement Page Object Models (POM) encapsulating page locators and user actions.",
      "Use user-facing accessibility locators (getByRole, getByLabel, getByText) over CSS selectors.",
      "Intercept and mock external third-party network APIs to isolate internal application logic.",
      "Execute tests in headless mode and inspect HTML report artifacts."
    ],
    commands: [
      "npx playwright test",
      "npx playwright test --ui",
      "npx playwright show-report"
    ],
    safeguards: [
      "Never use hardcoded arbitrary sleep (waitForTimeout); use web assertions with auto-wait.",
      "Avoid fragile XPath or deep CSS selectors that break on layout changes.",
      "Clean up browser contexts and test state between test specs."
    ],
    verification: [
      "Verify all Playwright test specs pass cleanly across Chromium, Firefox, and WebKit.",
      "Verify test traces and screenshots are recorded on any unexpected assertion failure.",
      "Verify tests run deterministically in CI environments."
    ],
    subagent: "qa-eng"
  },
  {
    id: 23,
    name: "unit-testing",
    category: "Automated Testing & Verification QA",
    title: "Isolated Unit Testing & Boundary Analysis",
    description: "Write hermetic, isolated unit tests for pure functions, data transformers, mathematical calculations, and business rules. Use when implementing service functions, algorithmic engines, or utility modules.",
    objectives: [
      "Achieve comprehensive test coverage for pure logic and utility functions.",
      "Test boundary conditions: zero, negative, maximum, empty arrays, null, undefined.",
      "Guarantee deterministic, microsecond execution speeds for fast developer feedback."
    ],
    procedures: [
      "Identify the target function's input domain, output codomain, and invariants.",
      "Write unit tests structuring test cases with Arrange-Act-Assert (AAA) pattern.",
      "Cover nominal happy paths, boundary edges, and deliberate error scenarios.",
      "Assert on exact return values, immutability of inputs, and thrown exception types.",
      "Execute using Node native test runner (node:test) or Jest/Vitest."
    ],
    commands: [
      "npx tsx --test tests/unit/*.test.ts",
      "npm test"
    ],
    safeguards: [
      "Never introduce external network or database calls in unit tests.",
      "Avoid testing trivial implementation details; assert on observable public behavior.",
      "Never share mutable state between parallel unit test specs."
    ],
    verification: [
      "Verify 100% of unit test assertions pass.",
      "Verify execution speed is sub-second for the entire unit test suite.",
      "Verify boundary condition coverage includes null, empty, and maximum bounds."
    ],
    subagent: "qa-eng"
  },
  {
    id: 24,
    name: "integration-testing",
    category: "Automated Testing & Verification QA",
    title: "Multi-Module Integration Testing & Boundary Contracts",
    description: "Validate data flow, state synchronization, and contract compliance across multiple interacting modules, databases, and services. Use when testing service-to-database, route-to-service, or cache-to-persistence boundaries.",
    objectives: [
      "Verify seamless collaboration between multiple architectural layers.",
      "Validate persistence and retrieval flows with real database transactions or test databases.",
      "Ensure rollback mechanisms clean up test data after execution."
    ],
    procedures: [
      "Configure test harness with test database connection and initial seed state.",
      "Invoke service methods that orchestrate multiple internal components.",
      "Assert that database state, cache layers, and return objects match expected contracts.",
      "Test transaction rollback on simulated intermediate failure.",
      "Tear down and clean up created test records in afterEach / after hooks."
    ],
    commands: [
      "npm test -- tests/integration/*.test.ts",
      "npx tsx --test tests/verify_learning_and_quiz.js"
    ],
    safeguards: [
      "Never run destructive integration tests against production databases.",
      "Ensure all test data is tagged with unique test run IDs to prevent cross-test contamination.",
      "Handle async cleanup properly to prevent leaked open database connections."
    ],
    verification: [
      "Verify integration suites run to completion with zero leaked connections.",
      "Verify database state is verified before and after operations.",
      "Verify all assertions pass across positive and negative interaction flows."
    ],
    subagent: "qa-eng"
  },
  {
    id: 25,
    name: "e2e-testing",
    category: "Automated Testing & Verification QA",
    title: "End-to-End User Journey Verification",
    description: "Validate full customer workflows and critical user paths from initial page visit to final goal completion. Use when verifying release readiness, critical user journeys, or major feature integration.",
    objectives: [
      "Simulate authentic user interactions across complete multi-step journeys.",
      "Validate cross-page navigation, session preservation, and local storage caching.",
      "Ensure zero blockers on revenue-critical or mission-critical user workflows."
    ],
    procedures: [
      "Map out the end-to-end user path: Home -> Search -> Path Builder -> Module View -> Quiz -> Profile.",
      "Automate browser actions filling forms, clicking CTA buttons, and navigating routes.",
      "Verify that visual feedback, loading indicators, and success states appear promptly.",
      "Assert that final user data persists accurately and reflects in dashboard metrics.",
      "Record execution video and screenshots for auditing."
    ],
    commands: [
      "npx playwright test tests/e2e/",
      "npm test"
    ],
    safeguards: [
      "Avoid brittle selectors that fail when copy or styling changes slightly.",
      "Ensure test users are cleaned up or isolated to prevent account collisions.",
      "Set sensible timeouts (30s) to detect hanging API calls or infinite loaders."
    ],
    verification: [
      "Verify end-to-end journey completes successfully from initial click to terminal state.",
      "Verify local storage cache and database state remain in sync.",
      "Verify zero unexpected console errors during browser execution."
    ],
    subagent: "qa-eng"
  }
];
