import fs from "fs";
import path from "path";
import { ALL_101_SKILLS, SKILL_CATEGORIES } from "./skills-definitions.ts";
import type { SkillDefinition } from "./skills-definitions.ts";

const PROJECT_ROOT = process.cwd();
const AGENTS_DIR = path.join(PROJECT_ROOT, ".agents");
const SKILLS_DIR = path.join(AGENTS_DIR, "skills");
const RULES_DIR = path.join(AGENTS_DIR, "rules");

function generateSkillMarkdown(skill: SkillDefinition): string {
  return `---
name: ${skill.name}
description: >-
  ${skill.description}
---

# ${skill.title}

> **Category**: ${skill.category}  
> **Specialist Subagent**: \`${skill.subagent}\`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

${skill.objectives.map((obj, i) => `${i + 1}. **${obj.split(":")[0]}**: ${obj.includes(":") ? obj.substring(obj.indexOf(":") + 1).trim() : obj}`).join("\n")}

---

## 2. Standard Operating Procedures (SOP)

${skill.procedures.map((proc, i) => `${i + 1}. ${proc}`).join("\n")}

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

\`\`\`bash
${skill.commands.join("\n")}
\`\`\`

---

## 4. Defensive Rules & Anti-Patterns

${skill.safeguards.map((safe) => `- **Guard**: ${safe}`).join("\n")}

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

${skill.verification.map((v) => `- [ ] ${v}`).join("\n")}

---

## 6. Subagent Coordination Matrix

- **Primary Role**: \`${skill.subagent}\`
- **Orchestrator**: \`engineering-orchestrator\`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via \`invoke_subagent\` following single-writer rules.
`;
}

function generateRules() {
  fs.mkdirSync(RULES_DIR, { recursive: true });

  const codeQualityRule = `# Global Rule: Code Quality & Architectural Integrity

> **Standard**: Build production-ready, fault-tolerant, strictly typed software. Zero dead code, zero unhandled errors.

---

## 1. TypeScript & Type Safety
1. **Strict Mode Invariant**: All TypeScript code must compile under strict settings without errors (\`npx tsc --noEmit\`).
2. **Zero \`any\`**: Never use \`any\`, loose casts (\`as unknown as T\`), or \`@ts-ignore\` / \`@ts-nocheck\`.
3. **Validated Runtime Contracts**: Every API route and service boundary must validate inputs using Zod schemas (\`src/lib/api-schemas.ts\`).

---

## 2. Component & UI Architecture
1. **4 Discrete States**: Every interactive container must support Loading (skeleton), Empty (actionable CTA), Error (recovery action), and Populated.
2. **Accessible Semantics**: Semantic HTML5 tags (\`<main>\`, \`<article>\`, \`<nav>\`), keyboard accessibility, focus indicators, and ARIA roles.
3. **Responsive Discipline**: Mobile-first design adapting fluidly from 320px mobile to 4K displays with zero horizontal scroll.

---

## 3. Clean Code & Maintainability
1. **Zero Dead Code**: Eliminate unused exports, commented-out blocks, and dangling imports.
2. **Documentation Integrity**: Maintain docstrings and comments on all public interfaces; never remove existing comments.
3. **Idiomatic Formatting**: Adhere to ESLint and Prettier formatting with zero warnings (\`npm run lint\`).
`;

  const securityRule = `# Global Rule: Security & Multi-Tenant Data Protection

> **Standard**: Guarantee multi-tenant isolation, least-privilege access, zero secret leakage, and OWASP compliance.

---

## 1. Secrets & Credentials Protection
1. **Zero Service-Role Key Rule**: \`SUPABASE_SERVICE_ROLE_KEY\` must NEVER be referenced in client-side code or browser bundles. All client interactions use \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`.
2. **Runtime Validation**: Validate all environment variables on startup with Zod. Never hardcode credentials in code.
3. **Secret Hygiene**: Maintain \`.env\` and \`.env.local\` in \`.gitignore\`. Never commit live secrets or tokens to git.

---

## 2. Row Level Security & Multi-Tenancy
1. **Mandatory RLS**: Every database table in the public schema must have Row Level Security enabled (\`ALTER TABLE ... ENABLE ROW LEVEL SECURITY\`).
2. **Tenant Scoping**: All user data queries must enforce \`auth.uid() = user_id\`. Never allow cross-tenant access.
3. **Zero Anonymous Mutations**: Anonymous users must never be permitted to execute insert, update, or delete mutations on protected tables.

---

## 3. Input Sanitization & Injection Defense
1. **Parameterized Queries**: All database queries must use parameterized query builders; zero SQL string concatenation.
2. **Output Escaping**: Escape all user-supplied data to prevent Cross-Site Scripting (XSS).
3. **Safe Error Envelopes**: Never leak internal database schemas, column names, or raw stack traces in API responses.
`;

  const testingRule = `# Global Rule: Testing & Hermetic Self-Verification

> **Standard**: Every change must be verified using strict TypeScript compilation, linting, and automated tests.

---

## 1. Verification Protocol
Every task, refactor, or bug fix must complete the full 3-tier verification gate:
1. **TypeScript Type Safety**:
   \`\`\`bash
   npx tsc --noEmit
   \`\`\`
   *Requirement*: 0 errors.

2. **Linting & Code Quality**:
   \`\`\`bash
   npm run lint
   \`\`\`
   *Requirement*: 0 warnings, 0 errors.

3. **Automated Test Suite**:
   \`\`\`bash
   npm test
   \`\`\`
   *Requirement*: 100% pass rate across all suites (341+ tests).

---

## 2. Testing Principles
1. **Zero Fabricated Functionality**: Every button, API route, form, and feature must have genuine automated tests.
2. **Zero Mock Data in Production Paths**: Unit test business logic with authentic educational domain models.
3. **Hermetic & Deterministic**: Tests must never fail due to timing jitter, uncontrolled networks, or random state.
`;

  const regressionRule = `# Global Rule: Regression Prevention & Blast Radius Containment

> **Standard**: Guard against unintended side-effects and maintain backward compatibility.

---

## 1. Blast Radius Mapping
1. **Dependency Analysis**: Identify all upstream and downstream modules importing changed symbols before modification.
2. **Contract Stability**: Never mutate public API schemas or function signatures without backward-compatible defaults.
3. **Database Schema Evolution**: Follow the Expand-Contract pattern for non-destructive, zero-downtime migrations.

---

## 2. State & Cache Integrity
1. **Dual-Persistence Protection**: Ensure client-side local cache (\`pathService.ts\`) and database truth remain synchronized.
2. **Tombstone Preservation**: Items recorded in \`deletionRegistry.ts\` must never resurrect during background sync.
3. **Account Isolation**: Account switching must immediately invalidate previous cached state and reinitialize.
`;

  fs.writeFileSync(path.join(RULES_DIR, "code-quality.md"), codeQualityRule, "utf-8");
  fs.writeFileSync(path.join(RULES_DIR, "security-data-protection.md"), securityRule, "utf-8");
  fs.writeFileSync(path.join(RULES_DIR, "testing-verification.md"), testingRule, "utf-8");
  fs.writeFileSync(path.join(RULES_DIR, "regression-prevention.md"), regressionRule, "utf-8");
}

function buildAll() {
  console.log(`[Skills Builder] Starting generation of ${ALL_101_SKILLS.length} skills...`);

  // Ensure directories exist
  fs.mkdirSync(SKILLS_DIR, { recursive: true });

  // 1. Generate all 101 skills
  ALL_101_SKILLS.forEach((skill) => {
    const skillFolder = path.join(SKILLS_DIR, skill.name);
    fs.mkdirSync(skillFolder, { recursive: true });
    const content = generateSkillMarkdown(skill);
    fs.writeFileSync(path.join(skillFolder, "SKILL.md"), content, "utf-8");
  });
  console.log(`[Skills Builder] Successfully wrote 101 SKILL.md files.`);

  // 2. Generate Rules
  generateRules();
  console.log(`[Skills Builder] Successfully generated 4 global rule files.`);

  // 3. Generate skills.json manifest
  const manifest = {
    version: "1.0.0",
    total_skills: ALL_101_SKILLS.length,
    categories: SKILL_CATEGORIES,
    entries: [
      {
        path: ".agents/skills"
      }
    ],
    skills: ALL_101_SKILLS.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      title: s.title,
      subagent: s.subagent
    }))
  };
  fs.writeFileSync(path.join(AGENTS_DIR, "skills.json"), JSON.stringify(manifest, null, 2), "utf-8");
  console.log(`[Skills Builder] Successfully generated .agents/skills.json manifest.`);

  // 4. Generate master README.md
  let readme = `# Antigravity Elite Autonomous Engineering System (101 Skills)

Welcome to the **Pencill Autonomous Engineering System** equipped with a comprehensive arsenal of **101 specialized software engineering skills** and a central **Engineering Orchestrator**.

---

## Architectural Taxonomy & Skill Index

`;

  SKILL_CATEGORIES.forEach((cat) => {
    readme += `### ${cat}\n\n`;
    readme += `| # | Skill Identifier | Title | Primary Role |\n`;
    readme += `| :-: | :--- | :--- | :--- |\n`;
    const catSkills = ALL_101_SKILLS.filter((s) => s.category === cat);
    catSkills.forEach((s) => {
      readme += `| **${s.id}** | [\`${s.name}\`](./skills/${s.name}/SKILL.md) | ${s.title} | \`${s.subagent}\` |\n`;
    });
    readme += `\n`;
  });

  readme += `---

## Master Orchestrator (#101: \`engineering-orchestrator\`)

The central **Engineering Orchestrator** governs all 100 specialist capabilities using the **9-Step Autonomous Engineering Cycle**:

\`\`\`
[1. Problem Audit] ──> [2. Architecture Trace] ──> [3. Skill & Risk Mapping]
                                                               │
[6. Regression Audit] <── [5. Trade-off Research] <── [4. Outcome Definition]
         │
         ▼
[7. Systematic Plan] ──> [8. Surgical Execution] ──> [9. Hermetic Verification]
\`\`\`

---

## Global Governance Rules

The system enforces 4 core global rule files located in \`.agents/rules/\`:
1. [\`code-quality.md\`](./rules/code-quality.md): Strict TypeScript, zero \`any\`, 4 UI container states, clean code.
2. [\`security-data-protection.md\`](./rules/security-data-protection.md): Zero client service keys, mandatory RLS, OWASP Top 10 defense.
3. [\`testing-verification.md\`](./rules/testing-verification.md): Mandatory 3-tier verification gate (tsc, lint, 341+ tests).
4. [\`regression-prevention.md\`](./rules/regression-prevention.md): Blast radius calculation, cache integrity, backward compatibility.

---

## Hermetic Verification Protocol

Before declaring any mission complete, the agent autonomously executes:
\`\`\`bash
npx tsc --noEmit     # Must be 0 errors
npm run lint         # Must be 0 warnings, 0 errors
npm test             # Must pass 100% across all 341+ test suites
\`\`\`
`;

  fs.writeFileSync(path.join(AGENTS_DIR, "README.md"), readme, "utf-8");
  console.log(`[Skills Builder] Successfully generated .agents/README.md catalog.`);
}

buildAll();
