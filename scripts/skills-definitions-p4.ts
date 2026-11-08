import type { SkillDefinition } from "./skills-definitions-p1.ts";

export const SKILLS_76_TO_101: SkillDefinition[] = [
  {
    id: 76,
    name: "agentic-workflow-engineering",
    category: "AI Systems, LLMs & Agentic Engineering",
    title: "Agentic Workflow Engineering & ReAct Reasoning Loops",
    description: "Architect autonomous agentic workflows using ReAct loops (Reasoning + Acting), tool execution chains, state checkpointing, and termination criteria. Use when designing autonomous task-solving agents or pipelines.",
    objectives: [
      "Design robust agent loops that iteratively perceive, reason, act, and verify outcomes.",
      "Integrate tool calling with strict schema definitions, error handling, and parameter coercion.",
      "Implement deterministic termination guards preventing infinite agent loops and runaways."
    ],
    procedures: [
      "Define agent state machine: Initialize -> Plan -> Select Tool -> Execute -> Observe -> Assess.",
      "Provide typed tool definitions with clear descriptions and parameter validation schemas.",
      "Implement guardrails: max loop iterations (10-25), max time limits, and budget caps.",
      "Checkpoint intermediate state so failed steps can resume without re-running entire workflows.",
      "Evaluate terminal condition: verify all success assertions are satisfied before declaring completion."
    ],
    commands: [
      "npm test -- tests/agentic-*.test.ts",
      "npx tsx scripts/verify-builder-flow.js"
    ],
    safeguards: [
      "Never create unconstrained while(true) agent loops without hard iteration ceilings.",
      "Never allow agents to execute arbitrary destructive shell commands without safety barriers.",
      "Ensure tool execution errors are fed back into agent context for self-correction rather than crashing."
    ],
    verification: [
      "Verify agent loop converges to valid solution within target iteration count.",
      "Verify error recovery mechanisms correctly handle tool invocation failures.",
      "Verify final state satisfies 100% of defined task success criteria."
    ],
    subagent: "architect"
  },
  {
    id: 77,
    name: "multi-agent-orchestration",
    category: "AI Systems, LLMs & Agentic Engineering",
    title: "Multi-Agent System Orchestration & Consensus Protocols",
    description: "Coordinate teams of specialized autonomous subagents with domain boundaries, inter-agent messaging, shared workspaces, and conflict resolution. Use when coordinating complex multi-domain projects.",
    objectives: [
      "Coordinate specialized subagents (architect, backend, frontend, qa, security, database) harmoniously.",
      "Prevent file collision: enforce single-writer locks across agent workspaces.",
      "Implement consensus protocols and architectural sign-offs before code modification."
    ],
    procedures: [
      "Decompose high-level mission into domain-specific subtasks assigned strictly by role expertise.",
      "Invoke specialized subagents using invoke_subagent tool with explicit prompts and constraints.",
      "Enforce workspace isolation: use branched workspaces or file locking to prevent write collisions.",
      "Facilitate structured communication: pass outputs and artifacts cleanly between agents.",
      "Aggregate specialist deliverables and verify holistic system behavior with full test suite."
    ],
    commands: [
      "npm test",
      "git status"
    ],
    safeguards: [
      "Never allow multiple subagents to mutate the same source file concurrently.",
      "Reconcile architectural disagreements between agents prior to code authoring.",
      "Never declare mission success solely on a subagent's self-reported message without verification."
    ],
    verification: [
      "Verify all subagents complete assigned tasks without deadlock or conflict.",
      "Verify final integrated system compiles cleanly and passes all test suites.",
      "Verify git status shows clean, coherent changes across all affected files."
    ],
    subagent: "architect"
  },
  {
    id: 78,
    name: "agent-skill-creator",
    category: "AI Systems, LLMs & Agentic Engineering",
    title: "Agent Skill Creation & Packaging Mastery",
    description: "Create, package, and document production-grade Antigravity skills with YAML frontmatter, SOPs, commands, scripts, and references. Use when creating new capabilities, runbooks, or tool bundles.",
    objectives: [
      "Author standardized Antigravity skills following official SKILL.md specifications.",
      "Define concise, effective frontmatter (name, description) optimized for progressive disclosure.",
      "Package reusable scripts, references, and verification checklists within skill bundles."
    ],
    procedures: [
      "Determine skill name (lowercase, hyphenated) and craft third-person description with clear triggers.",
      "Create directory structure: .agents/skills/<name>/ with SKILL.md and optional scripts/ or references/.",
      "Structure SKILL.md: Frontmatter -> Overview -> Objectives -> SOP -> Commands -> Safeguards -> Verification.",
      "Keep main instruction concise; place voluminous reference material in references/ directory.",
      "Register skill in skills.json manifest and verify syntax and frontmatter validity."
    ],
    commands: [
      "npx tsx scripts/verify-skills.ts",
      "git status"
    ],
    safeguards: [
      "Never create duplicate skills that overlap completely with existing capabilities.",
      "Avoid bloated SKILL.md files exceeding token budgets; use references/ for documentation.",
      "Ensure frontmatter strictly conforms to valid YAML without invalid character escapes."
    ],
    verification: [
      "Verify SKILL.md parses cleanly with valid YAML frontmatter.",
      "Verify skill is discovered and recognized by the Antigravity customization engine.",
      "Verify skill instructions provide clear, executable, and unambiguous procedures."
    ],
    subagent: "architect"
  },
  {
    id: 79,
    name: "workflow-creator",
    category: "AI Systems, LLMs & Agentic Engineering",
    title: "Automated Workflow Creation & Background Schedulers",
    description: "Design and implement background automations, cron-scheduled workflows, event-driven runbooks, and one-shot timers. Use when creating automated maintenance, data syncs, or recurring tasks.",
    objectives: [
      "Design reliable, scheduled background tasks and event-triggered automated workflows.",
      "Leverage the Antigravity schedule tool with 5-field cron expressions or duration timers.",
      "Implement idempotent runbooks that handle interruption and resumption gracefully."
    ],
    procedures: [
      "Define automation requirements: frequency (cron), execution trigger, inputs, and desired outputs.",
      "Author standalone automation runbook script in scripts/ or background service.",
      "Configure schedule tool with Prompt and CronExpression (or DurationSeconds for one-shot).",
      "Implement structured logging and alert notification for workflow failures or SLA breaches.",
      "Verify workflow terminates cleanly, cleans up locks, and records completion state."
    ],
    commands: [
      "npm test -- tests/workflow-*.test.ts",
      "npx tsx scripts/verify-builder-flow.js"
    ],
    safeguards: [
      "Never use shell sleep commands as timers; always use the native schedule tool.",
      "Set IsDaemon=true only for independent standing jobs meant to survive current session.",
      "Ensure workflows are idempotent: re-running a failed job must not corrupt data."
    ],
    verification: [
      "Verify scheduled job triggers at expected time interval.",
      "Verify workflow executes to completion and records success in log.",
      "Verify system resources (memory, connections) are cleanly released after execution."
    ],
    subagent: "backend-eng"
  },
  {
    id: 80,
    name: "context-management",
    category: "AI Systems, LLMs & Agentic Engineering",
    title: "Agent Context Management & Token Window Optimization",
    description: "Optimize agent context window utilization using progressive disclosure, targeted file reads, compact transcripts, and memory pruning. Use when managing long conversations or large codebases.",
    objectives: [
      "Maximize reasoning performance by maintaining high signal-to-noise ratio in context.",
      "Prevent context window exhaustion and unnecessary token bloat.",
      "Enforce progressive disclosure: load only relevant lines and reference files on demand."
    ],
    procedures: [
      "Read only targeted line ranges of large files using read_file with StartLine and EndLine.",
      "Summarize bulky outputs before feeding into downstream agent conversations.",
      "Delegate deep research tasks to subagents running in isolated conversation contexts.",
      "Keep SKILL.md and rule files concise, referencing detailed manuals in external files.",
      "Prune outdated intermediate thinking from prompt state when compacting."
    ],
    commands: [
      "git diff --stat",
      "npx tsx scripts/compile-taxonomy.js"
    ],
    safeguards: [
      "Never dump massive 10,000-line files or entire database dumps directly into chat context.",
      "Avoid repetitive polling loops that pollute transcript history.",
      "Do not re-summarize persistent artifact contents in chat messages."
    ],
    verification: [
      "Verify conversation context remains agile and responsive.",
      "Verify token utilization stays within optimal model capacity limits.",
      "Verify key architectural decisions and requirements remain preserved across turns."
    ],
    subagent: "architect"
  },
  {
    id: 81,
    name: "technical-research-agent",
    category: "AI Systems, LLMs & Agentic Engineering",
    title: "Deep Technical Research & Architecture Spikes",
    description: "Conduct thorough technical research, library evaluations, architecture spikes, and ecosystem benchmarks to resolve technical unknowns. Use when investigating unfamiliar technologies, complex bugs, or architectural trade-offs.",
    objectives: [
      "Investigate and resolve complex technical unknowns through structured research.",
      "Evaluate competing libraries, frameworks, and patterns across criteria matrices.",
      "Produce concise, evidence-backed Technical Spike Reports guiding architectural decisions."
    ],
    procedures: [
      "Define research question and clear evaluation criteria (performance, bundle size, maintenance, typing).",
      "Survey official documentation, RFCs, GitHub issues, and reputable technical resources.",
      "Build minimal proof-of-concept (PoC) code in a scratch script to verify real-world behavior.",
      "Benchmark alternatives and record concrete metrics (latency, memory, API ergonomic).",
      "Synthesize findings into an Architecture Spike Report with a definitive recommendation."
    ],
    commands: [
      "npx tsx scripts/compile-taxonomy.js",
      "npm test"
    ],
    safeguards: [
      "Never base architectural recommendations on hearsay or unverified forum posts.",
      "Ensure proof-of-concept code runs in standard sandbox mode without bypassing security.",
      "Distinguish clearly between established standards and experimental beta features."
    ],
    verification: [
      "Verify research findings are verified by working executable proof-of-concept code.",
      "Verify trade-off matrix evaluates at least two viable alternatives.",
      "Verify final recommendation aligns with project constraints and standards."
    ],
    subagent: "research"
  },
  {
    id: 82,
    name: "agent-md-creator",
    category: "Technical Documentation, Product & Repository Ops",
    title: "Agent Operating System & AGENTS.md Governance",
    description: "Author, update, and govern AGENTS.md and GEMINI.md project charters, specialist subagent registries, and engineering guidelines. Use when establishing repository rules, onboarding agents, or codifying team practices.",
    objectives: [
      "Standardize repository engineering governance through comprehensive AGENTS.md files.",
      "Define clear specialist subagent registries with distinct domains and boundaries.",
      "Establish strict engineering rules for code quality, testing, security, and verification."
    ],
    procedures: [
      "Analyze project tech stack, architecture, domain intelligence, and testing frameworks.",
      "Author or update AGENTS.md with 7 standardized sections: Operating Charter, 9-Step Cycle, Subagent Registry, Technical Stack Standards, Domain Intelligence, Testing Protocol, and Communication Protocol.",
      "Ensure rules are actionable, concrete, and enforceable via automated commands.",
      "Verify rule files adhere to the 24,000 byte per-file size cap for progressive loading.",
      "Review and commit AGENTS.md to version control at project root."
    ],
    commands: [
      "git status",
      "npx tsx scripts/verify-skills.ts"
    ],
    safeguards: [
      "Never remove or weaken existing project safety rules or testing standards.",
      "Do not create vague, aspirational rules; define exact commands, files, and criteria.",
      "Ensure AGENTS.md does not exceed maximum file byte limits."
    ],
    verification: [
      "Verify AGENTS.md file exists at project root and is valid Markdown.",
      "Verify all 7 standard operational sections are present and fully articulated.",
      "Verify agent adheres strictly to defined rules in subsequent interactions."
    ],
    subagent: "architect"
  },
  {
    id: 83,
    name: "project-documentation",
    category: "Technical Documentation, Product & Repository Ops",
    title: "Project Documentation & Architecture Decision Records",
    description: "Author and maintain comprehensive system documentation, API references, Architecture Decision Records (ADRs), and onboarding guides. Use when documenting new modules, API changes, or system designs.",
    objectives: [
      "Maintain clear, accurate, and up-to-date documentation across docs/ and README.md.",
      "Document architectural decisions using standard ADR templates (Context, Decision, Consequences).",
      "Ensure code docstrings and README instructions match implemented software behavior."
    ],
    procedures: [
      "Identify undocumented components, changed API contracts, or new architectural patterns.",
      "Create ADR in docs/architecture/adr/ (e.g. 0001-universal-builder-architecture.md).",
      "Update API documentation in docs/api/ with request/response schemas and example cURL calls.",
      "Keep README.md updated with setup commands, environment requirements, and test instructions.",
      "Add JSDoc/TSDoc comments on exported functions, types, and interfaces."
    ],
    commands: [
      "git status",
      "npm test"
    ],
    safeguards: [
      "Never commit out-of-date or contradictory documentation that misleads developers.",
      "Avoid documenting obvious implementation trivialities; focus on rationale, constraints, and contracts.",
      "Preserve all existing unrelated documentation when updating docs."
    ],
    verification: [
      "Verify all documentation links, commands, and code samples are valid and functional.",
      "Verify ADR clearly explains trade-offs and alternative designs considered.",
      "Verify documentation compiles cleanly in markdown linters."
    ],
    subagent: "architect"
  },
  {
    id: 84,
    name: "prd-architecture-generator",
    category: "Technical Documentation, Product & Repository Ops",
    title: "PRD & Technical Architecture Synthesis",
    description: "Transform high-level feature requirements into detailed Product Requirements Documents (PRDs), user stories, acceptance criteria, and system specifications. Use when planning major features or releases.",
    objectives: [
      "Translate ambiguous feature requests into rigorous, unambiguous Product Requirements Documents.",
      "Define comprehensive user personas, user stories, and Gherkin-style acceptance criteria.",
      "Formulate technical architecture blueprints mapping required schemas, APIs, and UI views."
    ],
    procedures: [
      "Analyze stakeholder goals, target audience, and business context.",
      "Structure PRD: Problem Statement, Target Personas, User Stories, Functional Requirements, Non-Functional Requirements.",
      "Formulate verifiable acceptance criteria for every feature using Given-When-Then syntax.",
      "Produce Technical Architecture Blueprint: Schema Changes, API Contracts, Component Hierarchy, and Security Plan.",
      "Review PRD with stakeholders and secure architectural sign-off before implementation."
    ],
    commands: [
      "git status",
      "npx tsc --noEmit"
    ],
    safeguards: [
      "Never proceed to implementation on complex features without an approved PRD / plan.",
      "Avoid vague acceptance criteria ('system must be fast'); use measurable metrics (< 200ms p95).",
      "Ensure out-of-scope items are explicitly documented to prevent scope creep."
    ],
    verification: [
      "Verify PRD covers 100% of functional requirements and edge cases.",
      "Verify acceptance criteria are testable via automated test assertions.",
      "Verify technical architecture aligns with existing codebase patterns."
    ],
    subagent: "architect"
  },
  {
    id: 85,
    name: "task-planning",
    category: "Technical Documentation, Product & Repository Ops",
    title: "Systematic Task Planning & Work Breakdown Structure",
    description: "Decompose complex engineering initiatives into logical, sequential, atomic tasks with dependency mapping and verification milestones. Use before executing multi-file or multi-step engineering missions.",
    objectives: [
      "Create structured, step-by-step Work Breakdown Structures (WBS) for complex tasks.",
      "Sequence tasks logically: Schema -> Service -> API Route -> UI Components -> Tests.",
      "Identify dependencies, critical path bottlenecks, and regression risk checkpoints."
    ],
    procedures: [
      "Decompose overall goal into atomic, independent tasks (15-45 minutes execution scope).",
      "Order tasks following architectural layering: foundational database models first, then services, then UI.",
      "Define explicit entry and exit criteria for every task in the plan.",
      "Attach automated verification commands to each milestone.",
      "Track task execution status dynamically (Pending, In-Progress, Completed, Verified)."
    ],
    commands: [
      "git status",
      "npm test"
    ],
    safeguards: [
      "Never write code without a structured systematic plan.",
      "Avoid large monolithic tasks that cannot be verified independently.",
      "Update task status in real time to provide complete transparency."
    ],
    verification: [
      "Verify plan covers 100% of requirements without skipped intermediate steps.",
      "Verify each task milestone is verified by an automated test or command.",
      "Verify all tasks conclude with passing verification gates."
    ],
    subagent: "architect"
  },
  {
    id: 86,
    name: "technical-debt-manager",
    category: "Technical Documentation, Product & Repository Ops",
    title: "Technical Debt Tracking & Refactoring Roadmaps",
    description: "Identify, quantify, track, and remediate technical debt, deprecated patterns, and architectural shortcuts. Use when auditing code smells, scheduling refactors, or prioritizing maintenance.",
    objectives: [
      "Maintain a living Technical Debt Ledger documenting known shortcuts and architectural debt.",
      "Quantify technical debt impact: maintenance friction, performance drag, bug recurrence.",
      "Prioritize and execute targeted refactoring sprints alongside feature development."
    ],
    procedures: [
      "Scan codebase for TODO, FIXME, deprecated methods, and high-complexity files.",
      "Log findings in docs/TECHNICAL_DEBT.md with Location, Category, Impact, and Remediation Plan.",
      "Score debt items using an Impact vs Effort matrix (High/Medium/Low).",
      "Schedule high-impact debt remediation into planned engineering cycles.",
      "Verify remediation resolves the underlying technical debt without introducing regressions."
    ],
    commands: [
      "git grep -iE \"(TODO|FIXME|HACK|DEPRECATED)\"",
      "npm test"
    ],
    safeguards: [
      "Never leave untracked temporary hacks in code; always log to the debt ledger.",
      "Do not perform massive unverified refactorings that jeopardize system stability.",
      "Ensure removed shortcuts are backed by proper permanent implementations."
    ],
    verification: [
      "Verify remediated debt items are closed with verified test coverage.",
      "Verify code complexity metrics improve following debt reduction.",
      "Verify full regression test suite passes after refactoring."
    ],
    subagent: "code-reviewer"
  },
  {
    id: 87,
    name: "project-cleanup",
    category: "Technical Documentation, Product & Repository Ops",
    title: "Repository Hygiene, Dead Code Elimination & Cleanup",
    description: "Safely remove dead code, unused files, obsolete dependencies, orphan assets, and temporary artifacts while preserving Git history. Use when decluttering repositories or performing spring cleaning.",
    objectives: [
      "Eliminate dead code, unreferenced components, and obsolete test files safely.",
      "Purge dangling assets, unused packages, and temporary scratch scripts.",
      "Maintain pristine repository cleanliness and minimal disk footprint."
    ],
    procedures: [
      "Scan for unused exports and orphaned files using static analysis (knip, ts-prune).",
      "Verify zero internal or external references before deleting any file.",
      "Remove obsolete dependency packages from package.json and run 'npm install' to clean lockfile.",
      "Delete obsolete temporary test scripts or scratch files from repo root.",
      "Execute full test suite and TypeScript checks to confirm zero unintended breakage."
    ],
    commands: [
      "npx tsc --noEmit",
      "npm test",
      "git status"
    ],
    safeguards: [
      "Never delete files without checking git history and confirming zero active references.",
      "Never delete configuration files (.env.example, tsconfig.json) without explicit approval.",
      "Keep cleanup commits separate from functional feature or bug fix commits."
    ],
    verification: [
      "Verify repository compiles cleanly with 0 TypeScript errors after deletion.",
      "Verify 100% of test suites pass after dead code removal.",
      "Verify git status shows clean, intended file deletions."
    ],
    subagent: "code-reviewer"
  },
  {
    id: 88,
    name: "repository-auditor",
    category: "Technical Documentation, Product & Repository Ops",
    title: "Comprehensive Repository Health & Compliance Audit",
    description: "Perform holistic audits across repository health: file structures, dependency vulnerabilities, test suites, documentation, and security hygiene. Use when assessing repository quality or conducting reviews.",
    objectives: [
      "Evaluate entire repository against industry and project engineering standards.",
      "Audit 5 core dimensions: Code Health, Security, Test Coverage, Architecture, and Docs.",
      "Produce actionable Repository Audit Reports with prioritized remediation recommendations."
    ],
    procedures: [
      "Inspect directory structure for adherence to project standards (src/, tests/, docs/, supabase/).",
      "Audit dependencies: check for outdated packages, security vulnerabilities, and license compliance.",
      "Audit test suite: measure total test count, suite duration, pass rate, and coverage.",
      "Audit security: scan for hardcoded secrets, open endpoints, and missing RLS policies.",
      "Compile findings into structured AUDIT/REPOSITORY_AUDIT.md report."
    ],
    commands: [
      "npm audit",
      "npx tsc --noEmit",
      "npm test"
    ],
    safeguards: [
      "Do not modify application code during an audit phase; audit first, plan second, execute third.",
      "Ensure findings cite exact file paths and line numbers.",
      "Prioritize findings objectively by severity (Critical, High, Medium, Low)."
    ],
    verification: [
      "Verify audit report provides complete, evidence-based assessment of repository health.",
      "Verify all automated check outputs (tsc, lint, audit, tests) are included.",
      "Verify actionable remediation roadmap is provided for all identified defects."
    ],
    subagent: "code-reviewer"
  },
  {
    id: 89,
    name: "subagent-task-delegation",
    category: "Technical Documentation, Product & Repository Ops",
    title: "Subagent Task Prompting & Boundary Delegation",
    description: "Craft clear, actionable task prompts for specialist subagents, establish execution boundaries, and aggregate results. Use when delegating parallel tasks to architect, research, or engineering subagents.",
    objectives: [
      "Delegate subtasks with precision: clear context, explicit objectives, boundaries, and expected output.",
      "Assign tasks strictly aligned with subagent specialist expertise.",
      "Aggregate and validate subagent deliverables before integrating into the main branch."
    ],
    procedures: [
      "Select appropriate subagent role (architect, research, frontend-eng, backend-eng, database-eng, etc.).",
      "Draft delegation prompt: Context, Exact Task, Permitted Files, Constraints, and Verification Gate.",
      "Invoke subagent using invoke_subagent tool; do not poll; wait for reactive notification.",
      "Review subagent output upon completion: inspect modified files and test verification evidence.",
      "Integrate approved changes and execute full repository verification gate."
    ],
    commands: [
      "git diff --stat",
      "npm test"
    ],
    safeguards: [
      "Never delegate open-ended, ambiguous tasks ('fix everything'); provide bounded scopes.",
      "Never allow two subagents to edit the same file simultaneously.",
      "Never accept subagent results without independent verification."
    ],
    verification: [
      "Verify subagent returns clear, structured completion report with line citations.",
      "Verify subagent modifications pass all automated tests and type checks.",
      "Verify main branch integrity is preserved across all delegated contributions."
    ],
    subagent: "architect"
  },
  {
    id: 90,
    name: "implementation-verification",
    category: "Technical Documentation, Product & Repository Ops",
    title: "Implementation-to-Spec Verification & Acceptance Sign-Off",
    description: "Validate implemented code against initial PRD specifications, acceptance criteria, and user stories. Use before declaring feature implementation complete or handing over to stakeholders.",
    objectives: [
      "Verify 100% of requirements and acceptance criteria in the PRD are fully implemented.",
      "Ensure zero gaps between planned specifications and actual software behavior.",
      "Deliver transparent, verifiable evidence for every acceptance criterion."
    ],
    procedures: [
      "Review the original PRD / task plan and extract all acceptance criteria checklist items.",
      "Map each criterion to concrete implementation files and corresponding automated tests.",
      "Execute automated tests proving each criterion passes with green assertion results.",
      "Manually verify UI flows, interactive states, and edge case behaviors.",
      "Document Verification Matrix linking Requirement -> Implementation -> Test -> Status."
    ],
    commands: [
      "npm test",
      "npx tsc --noEmit"
    ],
    safeguards: [
      "Never mark an acceptance criterion as complete without corresponding test evidence.",
      "Do not redefine or water down acceptance criteria to match incomplete implementations.",
      "Ensure all negative edge cases and error states are verified alongside happy paths."
    ],
    verification: [
      "Verify 100% of acceptance criteria items are marked as Verified.",
      "Verify all automated verification test suites pass cleanly.",
      "Verify implementation verification matrix is documented in final report."
    ],
    subagent: "qa-eng"
  },
  {
    id: 91,
    name: "change-impact-analysis",
    category: "Deep System Verification, Safety & Acceptance",
    title: "Static Dependency Tracing & Change Impact Analysis",
    description: "Analyze the ripple effects of proposed code changes across dependency trees, exported symbols, database contracts, and consumer routes. Use prior to refactoring core utilities, schemas, or shared types.",
    objectives: [
      "Identify 100% of upstream and downstream components affected by a proposed modification.",
      "Detect breaking interface contract changes before code modification begins.",
      "Formulate a comprehensive regression testing scope tailored to the change blast radius."
    ],
    procedures: [
      "Use static analysis or grep to find all import sites referencing the targeted symbol or module.",
      "Trace transitive dependencies: identify secondary consumers that could be affected by behavior changes.",
      "Check database contract dependencies: verify queries, views, and migrations relying on modified columns.",
      "Document the complete Blast Radius Map listing affected files, routes, and services.",
      "Define mandatory verification test list covering all identified dependents."
    ],
    commands: [
      "git grep -l \"<symbol-or-module>\" src/",
      "npx dependency-cruiser --include-only src"
    ],
    safeguards: [
      "Never assume a change to a shared utility or type is 'safe' without checking all import call sites.",
      "Ensure exported API contracts maintain backward compatibility unless explicitly breaking version.",
      "Do not forget to audit test files that import and test the modified symbols."
    ],
    verification: [
      "Verify all consumer call sites compile cleanly against modified symbol signatures.",
      "Verify tests for all components in the blast radius are executed and pass 100%.",
      "Verify no unexpected runtime breaks occur across dependent routes."
    ],
    subagent: "architect"
  },
  {
    id: 92,
    name: "safe-refactoring",
    category: "Deep System Verification, Safety & Acceptance",
    title: "Safe Multi-File Refactoring & Symbol Renaming",
    description: "Execute safe, atomic multi-file refactorings, symbol renames, and structural reorganizations with zero regression. Use when renaming widely used functions, restructuring directories, or changing interfaces.",
    objectives: [
      "Perform complex multi-file refactoring operations safely and cleanly.",
      "Ensure 100% of call sites, imports, and type references are updated atomically.",
      "Guarantee zero behavioral regressions throughout the refactoring lifecycle."
    ],
    procedures: [
      "Establish pre-refactoring test baseline: run test suite and verify 100% pass rate.",
      "Apply refactoring across all affected files atomically: rename symbol, adjust imports, update types.",
      "Run TypeScript compiler 'npx tsc --noEmit' to catch any missed call sites or broken references.",
      "Run full test suite 'npm test' to verify behavioral preservation.",
      "Commit refactoring changeset as a single atomic git commit with descriptive message."
    ],
    commands: [
      "npx tsc --noEmit",
      "npm test",
      "git diff --stat"
    ],
    safeguards: [
      "Never perform multi-file search-and-replace using naive regex without compiler verification.",
      "Never combine structural refactoring with new functional feature logic in the same commit.",
      "Ensure git status is reviewed thoroughly before staging multi-file changes."
    ],
    verification: [
      "Verify 'npx tsc --noEmit' reports 0 errors across the entire codebase.",
      "Verify 100% of automated tests pass without modifying pre-existing assertions.",
      "Verify application runtime behaves identically to pre-refactoring state."
    ],
    subagent: "code-reviewer"
  },
  {
    id: 93,
    name: "api-contract-validation",
    category: "Deep System Verification, Safety & Acceptance",
    title: "API Contract Validation & Schema Backward Compatibility",
    description: "Validate API request and response contracts, enforce backward compatibility, and prevent breaking schema changes. Use when modifying API schemas in src/lib/api-schemas.ts or route handlers.",
    objectives: [
      "Ensure API schemas strictly validate all incoming and outgoing data contracts.",
      "Prevent breaking changes that would cause legacy clients or mobile apps to fail.",
      "Enforce additive-only schema evolution patterns for public API routes."
    ],
    procedures: [
      "Inspect API validation schemas in src/lib/api-schemas.ts.",
      "Verify schema changes are backward-compatible: new fields must be optional or have default values.",
      "Never remove or rename existing fields without a formal deprecation lifecycle.",
      "Author schema contract tests asserting on valid, invalid, and legacy payload formats.",
      "Execute automated tests in tests/api-*.test.ts to verify contract integrity."
    ],
    commands: [
      "npm test -- tests/api-*.test.ts",
      "npx tsc --noEmit"
    ],
    safeguards: [
      "Never change a previously optional field to required without client version coordination.",
      "Never alter field data types (e.g. string to number) in an existing API schema.",
      "Always validate outgoing API responses to ensure internal private fields are never leaked."
    ],
    verification: [
      "Verify API schema accepts legacy request payloads without validation errors.",
      "Verify API schema rejects malformed or unauthorized inputs with 400 Bad Request.",
      "Verify API contract tests achieve 100% pass rate."
    ],
    subagent: "backend-eng"
  },
  {
    id: 94,
    name: "authentication-flow-testing",
    category: "Deep System Verification, Safety & Acceptance",
    title: "End-to-End Authentication & Authorization Flow Testing",
    description: "Test authentication workflows: user registration, email verification, session renewal, password reset, and cross-tenant authorization boundaries. Use when modifying auth routes, middleware, or user permissions.",
    objectives: [
      "Verify complete authentication and authorization lifecycles under positive and hostile conditions.",
      "Ensure unauthenticated requests are blocked with 401 Unauthorized across all protected routes.",
      "Verify role-based access control (RBAC): ensure standard users cannot access admin endpoints."
    ],
    procedures: [
      "Author automated tests for user login, token refresh, and logout lifecycle.",
      "Test token expiration: simulate expired JWT and verify automatic refresh or redirect to login.",
      "Test authorization boundaries: simulate User A requesting User B's resource; verify 403 Forbidden.",
      "Test session cookie security: verify HttpOnly, Secure, and SameSite attributes on set-cookie headers.",
      "Test account switching: verify immediate cache invalidation and clean state re-initialization."
    ],
    commands: [
      "npm test -- tests/auth-*.test.ts",
      "npx tsx scripts/verify_auth_live.js"
    ],
    safeguards: [
      "Never hardcode live user passwords or real authentication credentials in test files.",
      "Ensure test users are cleaned up after test execution to prevent cluttering databases.",
      "Never bypass middleware authentication checks in test environments without explicit mocking."
    ],
    verification: [
      "Verify all authentication and authorization test suites pass 100%.",
      "Verify unauthenticated access to protected routes is completely blocked.",
      "Verify session logout cleanly purges all stored tokens and cached profile data."
    ],
    subagent: "security-eng"
  },
  {
    id: 95,
    name: "state-management-debugging",
    category: "Deep System Verification, Safety & Acceptance",
    title: "Client State Management & Cache Synchronization Debugging",
    description: "Debug complex client-side state, React Context, localStorage cache synchronization, and stale state bugs. Use when UI state drifts from database truth or components fail to re-render.",
    objectives: [
      "Ensure seamless synchronization between server database truth and client local cache.",
      "Diagnose and resolve stale closure bugs, duplicate state dispatches, and render loops.",
      "Maintain offline-first responsiveness without data corruption."
    ],
    procedures: [
      "Trace state updates from source action through reducers/hooks to UI component rendering.",
      "Audit localStorage cache handlers in pathService.ts and deletionRegistry.ts for synchronization drifts.",
      "Inspect hook dependencies: ensure all referenced variables are included in dependency arrays.",
      "Implement optimistic UI updates with automated rollback on server mutation failure.",
      "Verify that user account switching immediately purges previous user cache state."
    ],
    commands: [
      "npm test -- tests/cache-*.test.ts",
      "npx tsc --noEmit"
    ],
    safeguards: [
      "Never store unsynchronized duplicate copies of identical domain state in multiple components.",
      "Ensure optimistic UI updates always handle rejection by restoring previous state cleanly.",
      "Avoid storing sensitive credentials or oversized blobs in browser localStorage."
    ],
    verification: [
      "Verify client UI updates immediately upon user interaction.",
      "Verify server state and client local cache match 100% after network synchronization.",
      "Verify zero stale state bugs or infinite re-render loops in test suites."
    ],
    subagent: "frontend-eng"
  },
  {
    id: 96,
    name: "race-condition-detection",
    category: "Deep System Verification, Safety & Acceptance",
    title: "Async Concurrency & Race Condition Detection",
    description: "Detect and eliminate asynchronous race conditions, out-of-order promise resolutions, and database concurrent write hazards. Use when debugging rapid user clicks, search debouncing, or concurrent mutations.",
    objectives: [
      "Eliminate race conditions where asynchronous responses resolve in arbitrary order.",
      "Implement AbortController request cancellation for search inputs and typeaheads.",
      "Ensure database transactions use optimistic locking or atomic updates to prevent lost updates."
    ],
    procedures: [
      "Inspect asynchronous event handlers for missing cancellation logic (AbortController / signal).",
      "Add debounce wrappers (300ms) on high-frequency search and auto-save inputs.",
      "In database services, use atomic increment / conditional WHERE clauses (version = previous_version).",
      "Simulate high-concurrency race condition test cases: fire 10 simultaneous mutations.",
      "Verify that system state converges to correct final value without lost writes or corruptions."
    ],
    commands: [
      "npm test -- tests/concurrency-*.test.ts",
      "npx tsx scripts/verify-builder-flow.js"
    ],
    safeguards: [
      "Never ignore outdated responses from previous search queries; always check AbortSignal.aborted.",
      "Avoid read-modify-write patterns without database transaction locks or atomic SQL operations.",
      "Never disable debouncing on auto-saving inputs."
    ],
    verification: [
      "Verify out-of-order API responses are cleanly discarded without overwriting newer state.",
      "Verify concurrent database writes maintain strict serializability and data integrity.",
      "Verify automated concurrency test suites pass 100% across multiple iterations."
    ],
    subagent: "backend-eng"
  },
  {
    id: 97,
    name: "accessibility-automation",
    category: "Deep System Verification, Safety & Acceptance",
    title: "Automated Accessibility (a11y) CI Pipeline Gates",
    description: "Automate accessibility auditing in continuous integration using axe-core, enforcing 0 violations for WCAG 2.1 AA before merge. Use when establishing automated a11y gates or running repository audits.",
    objectives: [
      "Enforce automated accessibility regression testing across every pull request and build.",
      "Guarantee zero critical or serious WCAG 2.1 Level AA violations across all views.",
      "Automate reporting of accessible tree regressions and color contrast failures."
    ],
    procedures: [
      "Configure automated axe-core accessibility checks in Playwright / Jest test suites.",
      "Target all major application routes (/explore, /learn, /practice, /dashboard, /profile).",
      "Assert expect(results.violations).toEqual([]) on every rendered view.",
      "Generate structured accessibility audit reports detailing any flagged violations.",
      "Block CI pipeline build if any accessibility violation is detected."
    ],
    commands: [
      "npx axe-core-cli http://localhost:3000",
      "npm test -- tests/a11y-*.test.ts"
    ],
    safeguards: [
      "Never disable axe rules or increase violation threshold to pass broken builds.",
      "Ensure dynamic modal and dropdown states are tested in both open and closed positions.",
      "Do not skip color contrast checks for dark mode themes."
    ],
    verification: [
      "Verify automated a11y suite executes across 100% of primary application pages.",
      "Verify 0 violations reported for WCAG 2.1 Level AA compliance.",
      "Verify accessibility test suite passes cleanly in CI pipeline."
    ],
    subagent: "qa-eng"
  },
  {
    id: 98,
    name: "cost-optimization",
    category: "Deep System Verification, Safety & Acceptance",
    title: "Cloud Infrastructure & AI Cost Optimization",
    description: "Optimize cloud computing resources, minimize LLM token consumption, eliminate redundant API calls, and tune caching. Use when auditing operational expenses, API quotas, or cloud billing.",
    objectives: [
      "Minimize operational costs across cloud infrastructure, databases, and third-party APIs.",
      "Reduce LLM token expenditure through prompt compression, response caching, and model routing.",
      "Eliminate redundant database reads and network calls via effective edge and local caching."
    ],
    procedures: [
      "Audit LLM token usage: identify high-cost prompts and compress instructions without losing precision.",
      "Implement prompt caching and response caching for frequently requested syllabi and topics.",
      "Optimize database queries: add covering indexes to reduce compute and memory instance requirements.",
      "Configure cloud resource scaling: set auto-scaling minimums to 0 on non-production environments.",
      "Track and report cost-per-active-user metrics across all services."
    ],
    commands: [
      "npx tsx scripts/compile-taxonomy.js",
      "npm test"
    ],
    safeguards: [
      "Never sacrifice data integrity, user security, or software correctness for minor cost savings.",
      "Avoid aggressive caching that serves stale or incorrect user-specific data.",
      "Never disable critical monitoring or backup infrastructure to save costs."
    ],
    verification: [
      "Verify token consumption per curriculum generation is reduced by > 30%.",
      "Verify cache hit ratio for common topics exceeds 75%.",
      "Verify system performance and response latency remain within target SLAs."
    ],
    subagent: "performance-eng"
  },
  {
    id: 99,
    name: "secrets-detection",
    category: "Deep System Verification, Safety & Acceptance",
    title: "Automated Secret Scanning & Credential Exposure Prevention",
    description: "Scan codebases and Git history for committed API keys, private tokens, passwords, and service role secrets. Use before committing changes, creating releases, or auditing repositories.",
    objectives: [
      "Prevent accidental leakage of secrets, API keys, private certificates, or database credentials.",
      "Scan staged diffs and historical commits for high-entropy secret patterns.",
      "Enforce immediate revocation and rotation protocols if any credential is compromised."
    ],
    procedures: [
      "Run automated secret scanning across all repository files using regex pattern matching.",
      "Check staged changes for API key formats (Google AI keys, Supabase service keys, Stripe secrets).",
      "Verify .gitignore includes .env, .env.local, .pem, .key, and credential files.",
      "Scan git commit history using git log -p -S to ensure no past commits contain exposed secrets.",
      "If a secret is detected: immediately notify, rotate the credential, and remove from git history."
    ],
    commands: [
      "git diff | grep -iE \"(AIza[0-9A-Za-z-_]{35}|eyJh[A-Za-z0-9_-]{20,})\"",
      "git status"
    ],
    safeguards: [
      "Never commit live secrets, test credentials, or private keys to source control under any circumstance.",
      "Never display full unredacted secrets in logs, chat messages, or task outputs.",
      "Ensure pre-commit hooks block git commits containing detected secret patterns."
    ],
    verification: [
      "Verify secret scanner reports 0 exposed secrets in working tree.",
      "Verify git status confirms all .env files remain untracked.",
      "Verify all environment variable secrets are loaded securely from runtime configuration."
    ],
    subagent: "security-eng"
  },
  {
    id: 100,
    name: "feature-acceptance-testing",
    category: "Deep System Verification, Safety & Acceptance",
    title: "Behavior-Driven Feature Acceptance Testing (BDD)",
    description: "Execute Behavior-Driven Development (BDD) feature acceptance tests using Given-When-Then specifications, validating user expectations. Use when verifying new feature releases and user story sign-offs.",
    objectives: [
      "Validate complete feature implementations against business acceptance criteria using BDD.",
      "Ensure all user stories and edge cases have corresponding automated acceptance tests.",
      "Provide formal sign-off reports demonstrating 100% criteria fulfillment."
    ],
    procedures: [
      "Translate user story acceptance criteria into Gherkin Given-When-Then scenarios.",
      "Implement executable acceptance test specs in tests/ feature suites.",
      "Given: set up initial authentic precondition state (authenticated user, seeded curriculum).",
      "When: execute user action (click 'Start Quiz', submit answer, generate custom path).",
      "Then: assert observable outcomes (score computed, streak updated, progress persisted).",
      "Execute acceptance test suite and capture passing test evidence for release documentation."
    ],
    commands: [
      "npm test -- tests/*-acceptance.test.ts",
      "npx tsx scripts/verify-builder-flow.js"
    ],
    safeguards: [
      "Never mark an acceptance test as passed without executing real application code.",
      "Avoid testing trivial UI styling; focus on business rules, data persistence, and user workflows.",
      "Ensure acceptance tests run hermetically without depending on external un-mocked networks."
    ],
    verification: [
      "Verify 100% of Given-When-Then acceptance test scenarios pass.",
      "Verify user journeys reflect authentic pedagogical behavior without mock data.",
      "Verify formal acceptance sign-off is included in final mission deliverable."
    ],
    subagent: "qa-eng"
  },
  {
    id: 101,
    name: "engineering-orchestrator",
    category: "Metacognitive Engineering Orchestration",
    title: "Metacognitive Engineering Orchestrator & Autonomous Dispatcher",
    description: "The central metacognitive governor that intelligently analyzes any engineering prompt, maps it across the 101-skill matrix, coordinates specialist sub-agents, enforces quality gates, and conducts end-to-end verification. Use as the master orchestrator for complex missions.",
    objectives: [
      "Act as the supreme operational conductor across all 100 specialized engineering skills.",
      "Execute the rigorous 9-Step Autonomous Engineering Cycle for every task, bug, or feature.",
      "Delegate subtasks with surgical precision to specialist subagents according to role boundaries.",
      "Enforce mandatory hermetic verification gates (TypeScript, ESLint, Automated Tests) before completion."
    ],
    procedures: [
      "Step 1 (Problem Audit): Dissect user prompt, identify root requirements, and categorize intent.",
      "Step 2 (Architecture Trace): Inspect relevant files in src/, docs/, and database schemas.",
      "Step 3 (Skill Selection): Map the mission to the precise subset of the 100 specialized capabilities.",
      "Step 4 (Subagent Dispatch): If parallel work is required, prompt specialist subagents with strict boundaries.",
      "Step 5 (Surgical Execution): Implement changes maintaining clean code, strict typing, and zero dead code.",
      "Step 6 (Hermetic Verification): Run npx tsc --noEmit, npm run lint, and npm test (all 341+ tests).",
      "Step 7 (Structured Reporting): Deliver concise, evidence-based reports with root cause, files changed, and test proof."
    ],
    commands: [
      "npx tsc --noEmit",
      "npm run lint",
      "npm test"
    ],
    safeguards: [
      "Never bypass the 9-Step Autonomous Engineering Cycle.",
      "Never declare a mission complete without passing the 3-tier verification gate.",
      "Never install unverified packages, fabricate mock data, or compromise security.",
      "Ensure zero file collisions between concurrent subagents."
    ],
    verification: [
      "Verify all selected skills from the 101-skill catalog are executed cohesively.",
      "Verify 100% pass rate across TypeScript, ESLint, and all 341+ automated tests.",
      "Verify final deliverable provides complete, verifiable, production-ready software."
    ],
    subagent: "architect"
  }
];
