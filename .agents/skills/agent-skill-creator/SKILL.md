---
name: agent-skill-creator
description: >-
  Create, package, and document production-grade Antigravity skills with YAML frontmatter, SOPs, commands, scripts, and references. Use when creating new capabilities, runbooks, or tool bundles.
---

# Agent Skill Creation & Packaging Mastery

> **Category**: AI Systems, LLMs & Agentic Engineering  
> **Specialist Subagent**: `architect`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Author standardized Antigravity skills following official SKILL.md specifications.**: Author standardized Antigravity skills following official SKILL.md specifications.
2. **Define concise, effective frontmatter (name, description) optimized for progressive disclosure.**: Define concise, effective frontmatter (name, description) optimized for progressive disclosure.
3. **Package reusable scripts, references, and verification checklists within skill bundles.**: Package reusable scripts, references, and verification checklists within skill bundles.

---

## 2. Standard Operating Procedures (SOP)

1. Determine skill name (lowercase, hyphenated) and craft third-person description with clear triggers.
2. Create directory structure: .agents/skills/<name>/ with SKILL.md and optional scripts/ or references/.
3. Structure SKILL.md: Frontmatter -> Overview -> Objectives -> SOP -> Commands -> Safeguards -> Verification.
4. Keep main instruction concise; place voluminous reference material in references/ directory.
5. Register skill in skills.json manifest and verify syntax and frontmatter validity.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npx tsx scripts/verify-skills.ts
git status
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never create duplicate skills that overlap completely with existing capabilities.
- **Guard**: Avoid bloated SKILL.md files exceeding token budgets; use references/ for documentation.
- **Guard**: Ensure frontmatter strictly conforms to valid YAML without invalid character escapes.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify SKILL.md parses cleanly with valid YAML frontmatter.
- [ ] Verify skill is discovered and recognized by the Antigravity customization engine.
- [ ] Verify skill instructions provide clear, executable, and unambiguous procedures.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `architect`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
