import type { SkillDefinition } from "./skills-definitions-p1.ts";

export const SKILLS_26_TO_50: SkillDefinition[] = [
  {
    id: 26,
    name: "visual-regression-testing",
    category: "Automated Testing & Verification QA",
    title: "Visual Regression & Layout Shift Testing",
    description: "Detect unintended pixel-level regressions, layout shifts, typography breaks, and color drifts across responsive breakpoints. Use when modifying CSS, Tailwind configurations, or global layout components.",
    objectives: [
      "Capture baseline screenshots of core views across mobile, tablet, and desktop viewports.",
      "Compare newly rendered pages against baselines with pixel-diff thresholds.",
      "Prevent Cumulative Layout Shift (CLS) and visual artifacts in production releases."
    ],
    procedures: [
      "Define visual regression test suite in Playwright with toHaveScreenshot() assertions.",
      "Configure deterministic test environment: disable CSS animations, freeze system clock, mock dynamic data.",
      "Run visual regression tests across 320px, 768px, 1024px, and 1440px viewports.",
      "Review pixel diff images when tests flag visual deviations; verify if intentional.",
      "Update baseline snapshots when visual changes represent approved design updates."
    ],
    commands: [
      "npx playwright test --update-snapshots",
      "npx playwright test tests/visual/"
    ],
    safeguards: [
      "Never commit new baseline snapshots without visual review and design confirmation.",
      "Ensure web fonts are fully loaded before capturing screenshot baselines.",
      "Avoid volatile elements (unpinned dates, avatars) in snapshot comparison areas."
    ],
    verification: [
      "Verify visual regression suite passes with 0 unexpected pixel diffs.",
      "Verify CLS score remains < 0.1 across all primary routes.",
      "Verify layout integrity holds across mobile and desktop viewport sizes."
    ],
    subagent: "frontend-eng"
  },
  {
    id: 27,
    name: "accessibility-testing",
    category: "Automated Testing & Verification QA",
    title: "Web Accessibility (a11y) & WCAG Compliance Auditing",
    description: "Audit and enforce WCAG 2.1 AA/AAA accessibility standards using axe-core, semantic HTML, keyboard navigation, and screen reader testing. Use when evaluating UI components, forms, modals, or navigation menus.",
    objectives: [
      "Ensure all user interfaces conform to WCAG 2.1 Level AA standards.",
      "Guarantee full keyboard navigability with visible focus indicators and tab sequences.",
      "Enforce semantic HTML, ARIA landmarks, roles, and accessible names for assistive technology."
    ],
    procedures: [
      "Run automated accessibility scans using @axe-core/playwright on all primary views.",
      "Audit keyboard navigation: verify Tab traverses elements in logical order; Esc closes modals.",
      "Inspect interactive elements: ensure all buttons, links, and inputs have accessible labels.",
      "Audit color contrast ratios: ensure minimum 4.5:1 for normal text and 3:1 for large text.",
      "Verify focus management: ensure focus returns to trigger element when modals dismiss."
    ],
    commands: [
      "npx axe-core-cli http://localhost:3000",
      "npm test -- tests/a11y-*.test.ts"
    ],
    safeguards: [
      "Never remove CSS focus outlines (outline: none) without providing an accessible alternative.",
      "Never use non-semantic elements (<div>, <span>) for buttons or links without full ARIA roles.",
      "Ensure icon-only buttons always include an aria-label or screen-reader text."
    ],
    verification: [
      "Verify axe-core reports 0 critical or serious accessibility violations.",
      "Verify 100% of interactive controls are reachable and operable via keyboard.",
      "Verify modal dialogs trap focus while open and release cleanly on Esc."
    ],
    subagent: "frontend-eng"
  },
  {
    id: 28,
    name: "performance-testing",
    category: "Automated Testing & Verification QA",
    title: "Performance Testing & Latency Profiling",
    description: "Benchmark system latency, measure server response times (p95, p99), profile memory usage, and detect bottlenecks under load. Use when assessing high-traffic endpoints, database query speeds, or heavy algorithmic pipelines.",
    objectives: [
      "Measure throughput and latency distributions (p50, p95, p99) under simulated load.",
      "Identify CPU bottlenecks, memory leaks, and unbounded event loops.",
      "Ensure server response times remain within strict latency budgets (< 200ms p95)."
    ],
    procedures: [
      "Author performance benchmark scripts measuring execution time across varying payload sizes.",
      "Run automated load testing using autocannon or k6 against API route handlers.",
      "Profile Node.js process heap memory to detect lingering references or memory growth.",
      "Measure database query latency under concurrent simulated connections.",
      "Generate performance summary reports detailing throughput (req/sec) and latency percentiles."
    ],
    commands: [
      "npx autocannon -c 10 -d 10 http://localhost:3000/api/health",
      "node --prof app.js"
    ],
    safeguards: [
      "Never run aggressive load tests against live production databases without authorization.",
      "Ensure test environments mirror production hardware constraints when benchmarking.",
      "Reset database and cache state between benchmark runs to ensure reproducible results."
    ],
    verification: [
      "Verify p95 latency remains within defined SLA (< 200ms for APIs).",
      "Verify zero memory leak slope across 10,000 synthetic requests.",
      "Verify CPU utilization stabilizes cleanly under baseline traffic."
    ],
    subagent: "performance-eng"
  },
  {
    id: 29,
    name: "api-testing",
    category: "Automated Testing & Verification QA",
    title: "Automated REST API & Contract Testing",
    description: "Write comprehensive automated API tests validating request schemas, response envelopes, status codes, and error conditions. Use when creating or testing REST routes in src/app/api/.",
    objectives: [
      "Validate API contracts against defined Zod schemas for all HTTP verbs.",
      "Verify deterministic HTTP status codes (200, 201, 400, 401, 403, 404, 429, 500).",
      "Ensure edge cases, boundary parameters, and malformed bodies produce clear error envelopes."
    ],
    procedures: [
      "Author API test suites targeting route handlers directly or via HTTP request simulation.",
      "Test nominal payloads: verify 200/201 status and correct JSON response schema structure.",
      "Test validation failures: send missing, unexpected, or malformed fields; verify 400 Bad Request.",
      "Test authentication guards: send unauthenticated or forged requests; verify 401/403.",
      "Assert on response header types (Content-Type: application/json) and cache headers."
    ],
    commands: [
      "npm test -- tests/api-*.test.ts",
      "npx tsx --test tests/verify_learning_and_quiz.js"
    ],
    safeguards: [
      "Never allow API tests to modify persistent production data.",
      "Ensure test suites verify that sensitive fields (passwords, tokens) are never returned in responses.",
      "Validate that rate-limiting headers and 429 status codes trigger under simulated abuse."
    ],
    verification: [
      "Verify 100% of API test assertions pass.",
      "Verify all error responses conform to { error: string, code: string, details?: any }.",
      "Verify API routes correctly reject unauthorized or malformed requests."
    ],
    subagent: "qa-eng"
  },
  {
    id: 30,
    name: "test-coverage-analysis",
    category: "Automated Testing & Verification QA",
    title: "Test Coverage Analysis & Gap Identification",
    description: "Generate and analyze code coverage reports (line, branch, statement, function) to locate untested logic and eliminate blind spots. Use when reviewing pull requests or planning test expansion.",
    objectives: [
      "Measure statement, branch, function, and line coverage across the codebase.",
      "Identify untested conditional branches, error recovery paths, and boundary conditions.",
      "Enforce minimum coverage thresholds on critical business logic services (> 85%)."
    ],
    procedures: [
      "Execute the test suite with coverage instrumentation (c8 or Node native coverage).",
      "Inspect the generated lcov / text summary report to identify low-coverage modules.",
      "Analyze uncovered branches: identify missing test cases for error throws or fallback logic.",
      "Write targeted test cases to cover identified branch gaps.",
      "Verify that coverage metrics increase without writing superficial assertions."
    ],
    commands: [
      "npx c8 --reporter=text npm test",
      "npx c8 --reporter=html npm test"
    ],
    safeguards: [
      "Never prioritize vanity coverage percentage over test quality and meaningful assertions.",
      "Avoid writing tests that execute code without asserting on observable behavior.",
      "Do not exclude critical domain services from coverage reporting configurations."
    ],
    verification: [
      "Verify critical domain services in src/services/ achieve > 85% branch coverage.",
      "Verify all error handling branches have corresponding negative test cases.",
      "Verify coverage reports are generated cleanly without instrumentation errors."
    ],
    subagent: "qa-eng"
  },
  {
    id: 31,
    name: "coderabbit-code-review",
    category: "Code Review, Audit & Quality Assurance",
    title: "AI-Augmented Code Review & PR Summary",
    description: "Conduct high-signal, line-by-line code reviews providing actionable review comments, architecture assessment, and PR summaries. Use when reviewing code changes, pull requests, or preparing releases.",
    objectives: [
      "Provide high-signal, actionable code review feedback without nitpicking trivial formatting.",
      "Identify logic bugs, race conditions, edge-case oversights, and architectural inconsistencies.",
      "Generate concise pull request summaries detailing changes, impact, and verification steps."
    ],
    procedures: [
      "Inspect the git diff against the target branch (git diff origin/main).",
      "Analyze changes across 5 dimensions: Correctness, Architecture, Security, Performance, and Tests.",
      "Draft constructive line-by-line review comments with clear explanations and suggested fixes.",
      "Formulate a structured PR summary: Overview, Key Changes, Verification Evidence, and Risks.",
      "Highlight potential regressions or follow-up tasks for the engineering team."
    ],
    commands: [
      "git diff origin/main",
      "git status"
    ],
    safeguards: [
      "Never provide vague feedback ('looks bad'); always explain why and provide a concrete solution.",
      "Do not duplicate linter feedback; focus on semantics, architecture, and edge cases.",
      "Never approve changes that lack automated test verification."
    ],
    verification: [
      "Verify all review findings are backed by specific code line references.",
      "Verify PR summary accurately captures 100% of modified files and logical changes.",
      "Verify suggested fixes adhere strictly to repository style and type safety."
    ],
    subagent: "code-reviewer"
  },
  {
    id: 32,
    name: "senior-code-reviewer",
    category: "Code Review, Audit & Quality Assurance",
    title: "Senior Architectural Code Review & Clean Code Enforcement",
    description: "Perform comprehensive senior-level code reviews evaluating maintainability, design patterns, DRY/KISS/YAGNI principles, and technical debt. Use before merging complex features or refactors.",
    objectives: [
      "Enforce high software engineering standards: readability, maintainability, and clean architecture.",
      "Guard against over-engineering, speculative abstractions, and dead code.",
      "Ensure proper error handling, logging, and documentation across all modified components."
    ],
    procedures: [
      "Review the full changeset in context of the existing system architecture.",
      "Evaluate cohesion and coupling: ensure components maintain single responsibility.",
      "Check naming conventions: verify variable, function, and file names clearly convey intent.",
      "Identify over-engineered abstractions; suggest simpler native or stdlib alternatives.",
      "Verify documentation integrity: ensure docstrings, comments, and READMEs reflect changes."
    ],
    commands: [
      "git diff --stat origin/main",
      "npm run lint"
    ],
    safeguards: [
      "Avoid approving code with dead functions, unused imports, or speculative future-proofing.",
      "Ensure no temporary debugging statements (console.log, debugger) remain in production files.",
      "Never permit breaking architectural changes without an accompanying ADR or plan."
    ],
    verification: [
      "Verify code adheres to project idioms and clean code principles.",
      "Verify zero dead code or unused variables remain in the diff.",
      "Verify reviewer checklist is fully satisfied before merge sign-off."
    ],
    subagent: "code-reviewer"
  },
  {
    id: 33,
    name: "security-code-review",
    category: "Code Review, Audit & Quality Assurance",
    title: "Security Code Review & Vulnerability Audit",
    description: "Audit codebases for OWASP Top 10 vulnerabilities, authentication bypasses, injection attacks, cross-tenant leaks, and credential exposure. Use when modifying auth flows, database queries, or external APIs.",
    objectives: [
      "Identify and eradicate security vulnerabilities prior to deployment.",
      "Enforce multi-tenant data isolation and strict Row Level Security (RLS) enforcement.",
      "Prevent injection attacks (SQL, XSS, SSRF, Command Injection) via strict sanitization."
    ],
    procedures: [
      "Inspect all database queries: verify parameterized queries; ensure zero string concatenation in SQL.",
      "Audit API route handlers: verify authentication checks and authorization policies (auth.uid() = user_id).",
      "Check input validation: verify 100% of incoming payloads pass Zod schemas before consumption.",
      "Inspect frontend components: verify user-supplied content is escaped to prevent XSS.",
      "Audit environment variables: ensure service-role keys and secrets never reach client bundles."
    ],
    commands: [
      "npm audit",
      "git diff | grep -iE \"(secret|token|password|apikey|service_role)\""
    ],
    safeguards: [
      "Never allow client-side components to import or reference server secrets.",
      "Never disable CORS or CSRF protections to 'fix' a cross-origin error.",
      "Ensure error responses never leak internal table names, column structures, or stack traces."
    ],
    verification: [
      "Verify zero security vulnerabilities detected across OWASP Top 10 categories.",
      "Verify RLS policies enforce tenant isolation on every table.",
      "Verify automated security tests pass with 100% success rate."
    ],
    subagent: "security-eng"
  },
  {
    id: 34,
    name: "performance-code-review",
    category: "Code Review, Audit & Quality Assurance",
    title: "Performance Code Review & Complexity Audit",
    description: "Audit code changes for algorithmic inefficiency, React re-render loops, N+1 query patterns, and bundle bloat. Use when reviewing data-heavy components, search engines, or database queries.",
    objectives: [
      "Eliminate algorithmic inefficiencies: O(n^2) operations, redundant loops, and expensive re-computations.",
      "Detect and fix React performance pitfalls: excessive re-renders, missing memoization, un-virtualized lists.",
      "Prevent N+1 database queries via bulk fetching and proper index utilization."
    ],
    procedures: [
      "Inspect algorithms for time and space complexity; replace nested loops with Map / Set lookups (O(1)).",
      "Review React component hooks: verify dependency arrays for useMemo and useCallback.",
      "Audit database query patterns: ensure related records are fetched in single JOINs or batch IN queries.",
      "Inspect imported packages: verify tree-shaking support and avoid heavy dependencies for simple tasks.",
      "Review image and asset usage: ensure responsive sizing, modern formats (WebP/AVIF), and lazy loading."
    ],
    commands: [
      "npx @next/bundle-analyzer",
      "npm test"
    ],
    safeguards: [
      "Avoid premature optimization that severely impairs code readability without measured benefit.",
      "Never introduce un-memoized heavy calculations inside render loops.",
      "Avoid unbounded database queries without pagination or LIMIT clauses."
    ],
    verification: [
      "Verify algorithmic time complexity is optimized to optimal bounds (O(n) or O(1)).",
      "Verify database queries avoid N+1 anti-patterns.",
      "Verify client bundle size does not increase beyond budget thresholds."
    ],
    subagent: "performance-eng"
  },
  {
    id: 35,
    name: "pull-request-review",
    category: "Code Review, Audit & Quality Assurance",
    title: "Pull Request Verification & Merge Gatekeeper",
    description: "Evaluate pull requests for atomic changesets, conventional commit messages, test coverage, and release readiness. Use when reviewing PRs or preparing release branches.",
    objectives: [
      "Ensure pull requests are focused, cohesive, and follow conventional commit standards.",
      "Verify that every PR includes comprehensive automated tests covering the changes.",
      "Enforce mandatory merge criteria before approving pull requests."
    ],
    procedures: [
      "Verify PR title and description adhere to Conventional Commits (feat, fix, refactor, test, docs).",
      "Inspect commit history: ensure commits are logical, atomic, and free of temporary commits.",
      "Review the automated CI check results: verify build, lint, and test suites are all green.",
      "Check documentation updates: verify that API docs, README, and ADRs are updated if needed.",
      "Provide a clear approval or request for changes with detailed, reproducible points."
    ],
    commands: [
      "git log -n 5 --oneline",
      "git diff --stat origin/main"
    ],
    safeguards: [
      "Never approve a pull request with failing or skipped automated tests.",
      "Avoid merging large, unfocused mega-PRs that combine unrelated changes.",
      "Never approve PRs containing secrets, sensitive tokens, or temporary hacks."
    ],
    verification: [
      "Verify all automated CI checks pass without errors.",
      "Verify PR checklist is completely fulfilled.",
      "Verify git branch is rebased cleanly onto target branch."
    ],
    subagent: "code-reviewer"
  },
  {
    id: 36,
    name: "code-quality-auditor",
    category: "Code Review, Audit & Quality Assurance",
    title: "Automated Code Quality & Static Analysis Auditing",
    description: "Run and enforce static analysis tools, ESLint rules, Prettier formatting, and complexity analyzers across the repository. Use when performing repo-wide quality sweeps or pre-commit checks.",
    objectives: [
      "Enforce repository-wide code quality, formatting, and static analysis standards.",
      "Identify and eliminate dead code, unused dependencies, and duplicate logic.",
      "Ensure zero ESLint warnings and zero formatting inconsistencies across all files."
    ],
    procedures: [
      "Execute repository linting using 'npm run lint' to detect syntax and style violations.",
      "Run TypeScript static type checks using 'npx tsc --noEmit'.",
      "Scan for dead code and unused exports using ts-prune or knip.",
      "Surgically format modified files following repository Prettier configurations.",
      "Enforce consistent export patterns (named vs default) and file naming conventions."
    ],
    commands: [
      "npm run lint",
      "npx tsc --noEmit",
      "npx knip"
    ],
    safeguards: [
      "Never disable ESLint rules globally in .eslintrc.json to silence inconvenient warnings.",
      "Never reformat entire files unrelated to current changes (avoids dirty git diffs).",
      "Avoid committing trailing whitespace or inconsistent line endings (CRLF vs LF)."
    ],
    verification: [
      "Verify 'npm run lint' exits with code 0 and 0 warnings.",
      "Verify 'npx tsc --noEmit' exits with code 0 and 0 errors.",
      "Verify repository adheres to unified code formatting."
    ],
    subagent: "code-reviewer"
  },
  {
    id: 37,
    name: "chrome-devtools",
    category: "Frontend, UI/UX, DevTools & Performance",
    title: "Chrome DevTools Protocol (CDP) & Browser Inspection",
    description: "Leverage Chrome DevTools Protocol to inspect live DOM trees, monitor network payloads, profile JavaScript execution, and evaluate CSS styling. Use when debugging live web applications or testing browser rendering.",
    objectives: [
      "Inspect and manipulate live DOM elements and CSS computed styles in real time.",
      "Analyze network request/response headers, status codes, and timing waterfalls.",
      "Capture console logs, uncaught exceptions, and performance traces directly from Chrome."
    ],
    procedures: [
      "Connect to target Chrome instance via Chrome DevTools MCP or remote debugging port.",
      "Inspect target DOM nodes to verify attributes, ARIA roles, and computed CSS properties.",
      "Monitor Network panel to inspect API payloads, status codes, and response latency.",
      "Capture console messages and stack traces for runtime JavaScript exceptions.",
      "Profile CPU and memory allocation during heavy user interactions."
    ],
    commands: [
      "npx chrome-devtools-mcp",
      "curl http://localhost:9222/json"
    ],
    safeguards: [
      "Follow sandbox rules when interacting with local browser instances on Windows.",
      "Do not leave detached headless Chrome processes consuming background system memory.",
      "Ensure sensitive authentication cookies or headers are redacted in shared logs."
    ],
    verification: [
      "Verify browser page navigates and renders target URL without console errors.",
      "Verify network inspection accurately captures API request and response data.",
      "Verify DOM tree structure matches expected React virtual DOM hierarchy."
    ],
    subagent: "frontend-eng"
  },
  {
    id: 38,
    name: "browser-automation",
    category: "Frontend, UI/UX, DevTools & Performance",
    title: "Scripted Browser Automation & Interaction Workflows",
    description: "Automate complex browser workflows including form completion, file uploads, state transitions, and screenshot capture. Use when automating manual web tasks, scraping, or running synthetic workflows.",
    objectives: [
      "Automate multi-step browser user workflows reliably and reproducibly.",
      "Interact with form inputs, dropdowns, date pickers, and drag-and-drop interfaces.",
      "Capture visual artifacts (screenshots, PDF exports, traces) during automation."
    ],
    procedures: [
      "Launch automated browser session with target viewport and user-agent settings.",
      "Navigate to target URL and wait for DOM network idle state.",
      "Perform automated actions: type into inputs, select options, click buttons with auto-wait.",
      "Validate that UI state updates correctly following each automated action.",
      "Capture screenshot proof upon task completion and terminate browser session cleanly."
    ],
    commands: [
      "npx playwright test tests/e2e/",
      "npx tsx scripts/screenshot-new-goal.ts"
    ],
    safeguards: [
      "Never hardcode static timeouts; always wait for explicit selector states or network idle.",
      "Ensure automated actions respect rate limits and terms of service of third-party domains.",
      "Always close browser contexts in finally blocks to prevent process leaks."
    ],
    verification: [
      "Verify automated sequence completes from start to finish without timing out.",
      "Verify captured screenshot demonstrates successful UI state completion.",
      "Verify browser process exits cleanly with code 0."
    ],
    subagent: "frontend-eng"
  },
  {
    id: 39,
    name: "frontend-debugging",
    category: "Frontend, UI/UX, DevTools & Performance",
    title: "Frontend State, DOM & Hydration Debugging",
    description: "Diagnose and fix complex frontend bugs including React hydration mismatches, state synchronization drifts, stale closures, and CSS layout glitches. Use when frontend components misbehave or crash in the browser.",
    objectives: [
      "Isolate and resolve React hydration mismatches between SSR HTML and client DOM.",
      "Debug component state management, hook dependency arrays, and stale closures.",
      "Fix CSS rendering bugs: flexbox/grid overflows, z-index stacking collisions, and responsive breaks."
    ],
    procedures: [
      "Reproduce the frontend defect in a browser session and capture console warning traces.",
      "For hydration bugs: identify discrepancies in window-dependent data, dates, or random IDs between server and client.",
      "For state bugs: trace state updates through React components and custom hooks to identify race conditions.",
      "For layout bugs: inspect computed box model metrics (margin, padding, border, overflow) in DevTools.",
      "Implement the fix and verify that both SSR and client rendering produce identical DOM trees."
    ],
    commands: [
      "npm run dev",
      "npx tsc --noEmit"
    ],
    safeguards: [
      "Never suppress hydration errors with 'suppressHydrationWarning' unless intentionally rendering client-only timestamps.",
      "Never modify state directly (mutate state in place); always use immutable updater patterns.",
      "Avoid broad CSS overrides (!important) that break design system cascade rules."
    ],
    verification: [
      "Verify zero hydration warnings in browser console during page reload.",
      "Verify component state correctly reflects user interactions and API responses.",
      "Verify layout renders flawlessly across mobile, tablet, and desktop viewports."
    ],
    subagent: "frontend-eng"
  },
  {
    id: 40,
    name: "ui-ux-design-expert",
    category: "Frontend, UI/UX, DevTools & Performance",
    title: "Academic UI/UX Design & Human-Interface Guidelines",
    description: "Design and implement beautiful, accessible, academic-grade user interfaces with typographic discipline, visual hierarchy, and 4 discrete container states. Use when building or styling UI components and user journeys.",
    objectives: [
      "Deliver elegant, academic-grade user interfaces with clear visual hierarchy and balanced spacing.",
      "Enforce the 4 mandatory interactive container states: Loading, Empty, Error, and Populated.",
      "Ensure typographic discipline, harmonious color palettes, and intuitive micro-interactions."
    ],
    procedures: [
      "Define component layout with strong visual hierarchy: clear headings, body text, and distinct CTAs.",
      "State 1 (Loading): Build animated skeleton screens matching the exact layout geometry.",
      "State 2 (Empty): Design actionable empty states with helpful illustrations and clear CTA buttons.",
      "State 3 (Error): Present user-friendly error messages with retry actions and sanitized error codes.",
      "State 4 (Populated): Render content with clean typography, responsive padding, and high readability.",
      "Apply subtle micro-interactions: smooth hover transitions, focus rings, and active states."
    ],
    commands: [
      "npm run lint",
      "npx tsc --noEmit"
    ],
    safeguards: [
      "Never use full-page spinner blocks that cause layout flashes; always use geometry skeletons.",
      "Never leave empty states without a helpful explanation and a clear call-to-action.",
      "Avoid cluttered UI with excessive competing colors or distracting animations."
    ],
    verification: [
      "Verify all 4 states (loading, empty, error, populated) are fully implemented and tested.",
      "Verify typography follows established scale (h1, h2, h3, body, caption).",
      "Verify interface feels responsive, modern, and aligned with academic platform aesthetics."
    ],
    subagent: "frontend-eng"
  },
  {
    id: 41,
    name: "responsive-design",
    category: "Frontend, UI/UX, DevTools & Performance",
    title: "Mobile-First Responsive Layout Engineering",
    description: "Engineer fluid, responsive layouts using modern CSS Grid, Flexbox, and Tailwind breakpoints that render flawlessly from 320px mobile to 4K displays. Use when styling pages, tables, navigation, or grids.",
    objectives: [
      "Build mobile-first responsive layouts that adapt seamlessly across all screen dimensions.",
      "Eliminate horizontal scrollbars, text overflows, and broken grid alignments on mobile devices.",
      "Ensure touch targets are appropriately sized (minimum 44x44px) for mobile usability."
    ],
    procedures: [
      "Author CSS utility classes using Tailwind's mobile-first breakpoint prefixes (sm:, md:, lg:, xl:, 2xl:).",
      "Use modern CSS Grid and Flexbox with auto-fit / auto-fill minmax() for fluid grid scaling.",
      "Test layouts at critical responsive breakpoints: 320px, 375px, 640px, 768px, 1024px, 1440px, and 2560px.",
      "Implement responsive navigation patterns: hamburger menus / bottom sheets on mobile, persistent nav on desktop.",
      "Ensure data tables gracefully collapse into card views or support smooth horizontal scroll on narrow screens."
    ],
    commands: [
      "npx playwright test tests/visual/responsive.test.ts",
      "npm run lint"
    ],
    safeguards: [
      "Never use hardcoded fixed pixel widths (width: 800px) that trigger horizontal scrolling on mobile.",
      "Never hide critical functionality or content on mobile breakpoints without an accessible alternative.",
      "Avoid tiny tap targets that lead to frustrating missed taps on touch screens."
    ],
    verification: [
      "Verify zero horizontal scroll on viewports from 320px to 4K.",
      "Verify all interactive elements meet minimum 44x44px touch target dimensions.",
      "Verify text scales legibly without clipping across all responsive breakpoints."
    ],
    subagent: "frontend-eng"
  },
  {
    id: 42,
    name: "design-system-engineer",
    category: "Frontend, UI/UX, DevTools & Performance",
    title: "Atomic Design System Engineering & Design Tokens",
    description: "Architect and maintain atomic design systems, design tokens, reusable UI primitives, and Tailwind theme configurations. Use when creating design components, establishing theme tokens, or standardizing UI patterns.",
    objectives: [
      "Build a cohesive atomic design system: Tokens -> Atoms -> Molecules -> Organisms -> Templates.",
      "Manage central design tokens (colors, typography, spacing, shadows, radii) in Tailwind configuration.",
      "Create reusable, compound component primitives with strict TypeScript props and accessibility."
    ],
    procedures: [
      "Define centralized design tokens in tailwind.config.ts (palette, spacing, fonts, animations).",
      "Implement atomic primitive components in src/components/ui/ (Button, Input, Badge, Card, Modal).",
      "Use class-variance-authority (cva) or clsx / tailwind-merge for flexible component variants.",
      "Document component props, variants, and usage guidelines in component docstrings.",
      "Ensure all design system primitives adhere to accessibility standards out of the box."
    ],
    commands: [
      "npm test -- tests/components/*.test.ts",
      "npx tsc --noEmit"
    ],
    safeguards: [
      "Never use arbitrary hardcoded color hex values (#234abc) in components; always use design tokens.",
      "Avoid duplicated component implementations; reuse design system primitives consistently.",
      "Ensure breaking prop changes on primitives are audited across all consumer call sites."
    ],
    verification: [
      "Verify all UI primitives compile cleanly and pass component unit tests.",
      "Verify design tokens correctly drive styling across light/dark themes.",
      "Verify zero duplicate styling classes or conflicting Tailwind class precedence."
    ],
    subagent: "frontend-eng"
  },
  {
    id: 43,
    name: "web-performance-optimizer",
    category: "Frontend, UI/UX, DevTools & Performance",
    title: "Core Web Vitals & Web Performance Optimization",
    description: "Optimize Largest Contentful Paint (LCP), Interaction to Next Paint (INP), and Cumulative Layout Shift (CLS) through asset optimization, code splitting, and caching. Use when auditing site speed or optimizing page load times.",
    objectives: [
      "Achieve green Core Web Vitals thresholds: LCP < 2.5s, INP < 200ms, CLS < 0.1.",
      "Optimize JavaScript bundle sizes via dynamic imports, code splitting, and tree shaking.",
      "Accelerate media delivery via next/image, modern formats (WebP/AVIF), and CDN caching."
    ],
    procedures: [
      "Audit page performance using Lighthouse and Web Vitals profiling tools.",
      "Optimize LCP: prioritize hero image preloading (priority attribute), preload critical fonts, eliminate render-blocking CSS.",
      "Optimize INP: break long JavaScript tasks (> 50ms) using requestIdleCallback or web workers.",
      "Optimize CLS: reserve layout dimensions (width/height or aspect-ratio) for images, ads, and embeds.",
      "Analyze bundle composition with @next/bundle-analyzer to eliminate bloated dependencies."
    ],
    commands: [
      "npx lighthouse http://localhost:3000 --view",
      "npx @next/bundle-analyzer"
    ],
    safeguards: [
      "Never lazy-load the LCP hero image; hero media must be preloaded with high priority.",
      "Avoid loading giant third-party tracking scripts that degrade main thread responsiveness.",
      "Ensure web font display is configured with font-display: swap to prevent FOIT."
    ],
    verification: [
      "Verify Lighthouse Performance score achieves 90+.",
      "Verify LCP < 2.5s and CLS < 0.1 on simulated mobile 4G network throttling.",
      "Verify bundle analyzer confirms elimination of redundant vendor chunks."
    ],
    subagent: "performance-eng"
  },
  {
    id: 44,
    name: "seo-auditor",
    category: "Frontend, UI/UX, DevTools & Performance",
    title: "Search Engine Optimization (SEO) & Metadata Auditing",
    description: "Implement search engine optimization best practices, OpenGraph meta tags, JSON-LD structured data, canonical URLs, and sitemap generators. Use when creating public routes, landing pages, or sharing previews.",
    objectives: [
      "Maximize search engine indexability and social sharing previews across all public routes.",
      "Implement dynamic metadata and OpenGraph / Twitter card tags using Next.js Metadata API.",
      "Embed structured JSON-LD schemas (Course, EducationalOrganization, BreadcrumbList) for rich snippets."
    ],
    procedures: [
      "Configure metadata objects in page.tsx / layout.tsx with title, description, and canonical URLs.",
      "Generate dynamic OpenGraph image previews (opengraph-image.tsx) for social media sharing.",
      "Inject validated JSON-LD schema scripts matching Google Search Central structured data specs.",
      "Configure dynamic robots.txt and sitemap.xml route generators in src/app/.",
      "Audit rendered HTML headers to verify complete meta tag coverage and tag uniqueness."
    ],
    commands: [
      "curl -s http://localhost:3000 | grep -i '<meta'",
      "npm test -- tests/seo-*.test.ts"
    ],
    safeguards: [
      "Never duplicate title or meta description tags across different public routes.",
      "Ensure private or authenticated dashboard routes are marked with noindex, nofollow.",
      "Validate that canonical URLs use absolute HTTPS URLs matching the production domain."
    ],
    verification: [
      "Verify Rich Results Test validates JSON-LD structured data without errors.",
      "Verify OpenGraph tags render valid preview cards on social sharing debuggers.",
      "Verify sitemap.xml generates valid XML listing all public indexable routes."
    ],
    subagent: "frontend-eng"
  },
  {
    id: 45,
    name: "a11y-debugging",
    category: "Frontend, UI/UX, DevTools & Performance",
    title: "Accessibility Tree Inspection & Screen Reader Debugging",
    description: "Inspect the browser Accessibility Tree, debug ARIA role attributes, verify screen reader announcements, and resolve accessibility tree discrepancies. Use when debugging complex accessible widgets, dropdowns, and comboboxes.",
    objectives: [
      "Inspect the computed accessibility tree in browser DevTools to verify accessible names and roles.",
      "Verify live region announcements (aria-live) for asynchronous content updates.",
      "Debug combobox, tabs, and menu roving tabindex patterns for assistive technology."
    ],
    procedures: [
      "Open Accessibility pane in browser DevTools and inspect target element's accessibility node.",
      "Verify accessible name computation: check aria-label, aria-labelledby, and text content cascade.",
      "Test screen reader navigation: verify announcements when interacting with tabs, dialogs, and alerts.",
      "Validate aria-expanded, aria-selected, and aria-controls state updates on dynamic interactions.",
      "Audit keyboard roving tabindex implementation to ensure single tab stop per widget."
    ],
    commands: [
      "npx axe-core-cli http://localhost:3000",
      "npm test"
    ],
    safeguards: [
      "Never use 'role=\"presentation\"' or 'role=\"none\"' on interactive elements.",
      "Avoid aria-hidden=\"true\" on elements that currently contain user focus or interactive children.",
      "Do not announce redundant information in aria-labels that matches visible text exactly."
    ],
    verification: [
      "Verify accessibility tree exposes correct role and accessible name for all controls.",
      "Verify aria-live regions announce status updates without interrupting critical alerts.",
      "Verify zero accessibility violations in DevTools accessibility audit."
    ],
    subagent: "frontend-eng"
  },
  {
    id: 46,
    name: "database-architecture",
    category: "Database, Supabase & Data Integrity",
    title: "Relational Database Architecture & Schema Design",
    description: "Design normalized PostgreSQL database schemas, entity-relationship models, foreign key constraints, cascade rules, and indexes. Use when designing new tables, modeling domain relations, or restructuring databases.",
    objectives: [
      "Model relational data structures adhering to 3rd Normal Form (3NF) principles.",
      "Define foreign key constraints with explicit ON DELETE / ON UPDATE cascade behaviors.",
      "Design strategic indexes (B-tree, GIN, partial indexes) to support high-performance queries."
    ],
    procedures: [
      "Analyze domain entities and define relational schema definitions in supabase/migrations/.",
      "Specify primary keys (UUIDv4 / gen_random_uuid()), foreign keys, and unique constraints.",
      "Define explicit cascade policies: RESTRICT for critical references, CASCADE for owned child entities.",
      "Add indexes on foreign key columns and frequently filtered / sorted attributes.",
      "Document entity relationships and table contracts in docs/architecture/database-schema.md."
    ],
    commands: [
      "npx supabase db lint",
      "npx tsx scripts/check-supabase-db.ts"
    ],
    safeguards: [
      "Never create tables without primary key constraints.",
      "Avoid un-indexed foreign key columns that cause table-scan locks during deletes.",
      "Never execute destructive DROP TABLE operations without backup and user approval."
    ],
    verification: [
      "Verify migration scripts apply cleanly on a blank PostgreSQL instance.",
      "Verify referential integrity blocks orphaned record insertions.",
      "Verify schema documentation matches implemented database tables exactly."
    ],
    subagent: "database-eng"
  },
  {
    id: 47,
    name: "supabase-expert",
    category: "Database, Supabase & Data Integrity",
    title: "Supabase Platform Engineering & Realtime Integration",
    description: "Master Supabase client integration, PostgreSQL query builders, Realtime subscriptions, Auth hooks, and Storage buckets. Use when building data queries, managing Supabase clients, or configuring storage.",
    objectives: [
      "Implement type-safe Supabase database queries using @supabase/supabase-js.",
      "Configure and manage client-side vs server-side Supabase client instances securely.",
      "Leverage Supabase Storage for media uploads and Realtime subscriptions for live updates."
    ],
    procedures: [
      "Initialize public client with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      "Use createServerClient in server components/route handlers to read auth cookies securely.",
      "Execute structured CRUD queries with error handling checking for error objects from Supabase.",
      "Manage storage buckets with secure upload policies and signed URL generation.",
      "Implement Realtime Postgres Change channels for live collaborative features."
    ],
    commands: [
      "npx supabase status",
      "npx tsx scripts/verify_live_supabase.js"
    ],
    safeguards: [
      "NEVER expose SUPABASE_SERVICE_ROLE_KEY to client-side code or public repositories.",
      "Always verify that returned error objects from Supabase queries are checked and handled.",
      "Avoid unbounded queries without .limit() or range pagination."
    ],
    verification: [
      "Verify Supabase connection succeeds and queries return expected typed records.",
      "Verify anon client cannot perform actions prohibited by RLS policies.",
      "Verify live tests in scripts/verify_live_supabase.js pass 100%."
    ],
    subagent: "database-eng"
  },
  {
    id: 48,
    name: "sql-query-optimization",
    category: "Database, Supabase & Data Integrity",
    title: "SQL Query Optimization & Execution Plan Analysis",
    description: "Analyze slow PostgreSQL queries using EXPLAIN ANALYZE, optimize indexing strategies, eliminate sequential scans, and tune joins. Use when optimizing database latency, search queries, or high-volume endpoints.",
    objectives: [
      "Diagnose slow queries using EXPLAIN (ANALYZE, BUFFERS, VERBOSE) execution plans.",
      "Replace expensive sequential scans with targeted Index Scans and Bitmap Index Scans.",
      "Optimize complex JOINs, CTEs, subqueries, and aggregation pipelines."
    ],
    procedures: [
      "Capture the slow SQL query and run EXPLAIN ANALYZE in PostgreSQL or Supabase SQL editor.",
      "Identify high-cost operations: Sequential Scan on large tables, Nested Loop with large outer rows, Hash Join spills.",
      "Create covering indexes, composite indexes, or partial indexes tailored to query WHERE and ORDER BY clauses.",
      "Refactor correlated subqueries into efficient JOINs or Common Table Expressions (CTEs).",
      "Re-run EXPLAIN ANALYZE to verify reduction in total execution time and buffer reads."
    ],
    commands: [
      "EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM courses WHERE is_published = true;",
      "npx tsx scripts/check-supabase-db.ts"
    ],
    safeguards: [
      "Avoid over-indexing tables; excessive indexes degrade INSERT and UPDATE write performance.",
      "Never optimize queries based on single-row test databases; test with realistic volume datasets.",
      "Do not use SELECT * in production queries; select only explicitly required columns."
    ],
    verification: [
      "Verify query execution time is reduced to < 50ms for standard OLTP operations.",
      "Verify execution plan utilizes Index Scan instead of Sequential Scan on large tables.",
      "Verify query results remain identical before and after optimization."
    ],
    subagent: "database-eng"
  },
  {
    id: 49,
    name: "database-migration-safety",
    category: "Database, Supabase & Data Integrity",
    title: "Zero-Downtime Database Migration Safety",
    description: "Author and execute non-destructive, backward-compatible PostgreSQL database migrations with rollback plans and zero downtime. Use when altering schemas, adding columns, or migrating data.",
    objectives: [
      "Author backward-compatible database migrations enabling zero-downtime deployments.",
      "Enforce non-destructive operations: expand-contract pattern for schema evolution.",
      "Guarantee every migration includes a verified, tested rollback script."
    ],
    procedures: [
      "Create timestamped migration file in supabase/migrations/ (e.g. YYYYMMDDHHMMSS_name.sql).",
      "Follow Expand-Contract pattern: add new nullable/default columns first; migrate data; drop old columns later.",
      "Set sensible statement timeouts (SET statement_timeout = '10s') to prevent table lock pileups.",
      "Author corresponding rollback SQL script reversing all schema mutations cleanly.",
      "Test migration and rollback sequentially against a local or staging database instance."
    ],
    commands: [
      "npx supabase db push",
      "npx supabase migration list"
    ],
    safeguards: [
      "Never execute destructive migrations (DROP TABLE, DROP COLUMN) without prior data archiving and user confirmation.",
      "Never add NOT NULL columns without a DEFAULT value on tables with existing rows.",
      "Avoid running long data migrations in the same transaction as DDL schema changes."
    ],
    verification: [
      "Verify migration executes cleanly without lock timeouts.",
      "Verify application continues operating normally during and after migration.",
      "Verify rollback script successfully restores previous database schema state."
    ],
    subagent: "database-eng"
  },
  {
    id: 50,
    name: "data-integrity-guardian",
    category: "Database, Supabase & Data Integrity",
    title: "Data Integrity & Transactional ACID Guardianship",
    description: "Guarantee ACID transaction properties, enforce check constraints, prevent orphan records, and maintain cross-service data consistency. Use when designing critical financial, academic, or user progress data flows.",
    objectives: [
      "Enforce strong data integrity invariants at the database engine level.",
      "Wrap multi-step state mutations in atomic database transactions (BEGIN ... COMMIT).",
      "Implement CHECK constraints, ENUM validations, and foreign key cascades."
    ],
    procedures: [
      "Define PostgreSQL CHECK constraints for range and format validations (e.g. score >= 0 AND score <= 100).",
      "Enforce foreign key integrity preventing orphaned children when parent entities update or delete.",
      "Wrap multi-table mutations in Supabase RPC functions executing within a single atomic transaction.",
      "Implement optimistic concurrency control with version / updated_at timestamps.",
      "Audit existing data periodically to detect and report any latent integrity anomalies."
    ],
    commands: [
      "npx tsx scripts/check-supabase-db.ts",
      "npm test -- tests/data-integrity-*.test.ts"
    ],
    safeguards: [
      "Never rely exclusively on client-side validation for critical data integrity rules.",
      "Avoid partial writes: if step 2 of a multi-step mutation fails, step 1 must roll back cleanly.",
      "Never bypass database constraints to patch bad incoming data."
    ],
    verification: [
      "Verify simulated transaction failures roll back completely without partial state commits.",
      "Verify database rejects invalid data violating CHECK or FOREIGN KEY constraints.",
      "Verify zero orphaned records exist in database audit scripts."
    ],
    subagent: "database-eng"
  }
];
