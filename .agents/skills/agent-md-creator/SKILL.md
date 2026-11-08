---
name: agent-md-creator
description: >-
  Author, update, and govern AGENTS.md and GEMINI.md project charters, specialist subagent registries, and engineering guidelines. Use when establishing repository rules, onboarding agents, or codifying team practices.
---

# Agent Operating System & AGENTS.md Governance

> **Category**: Technical Documentation, Product & Repository Ops  
> **Specialist Subagent**: `architect`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Standardize repository engineering governance through comprehensive AGENTS.md files.**: Standardize repository engineering governance through comprehensive AGENTS.md files.
2. **Define clear specialist subagent registries with distinct domains and boundaries.**: Define clear specialist subagent registries with distinct domains and boundaries.
3. **Establish strict engineering rules for code quality, testing, security, and verification.**: Establish strict engineering rules for code quality, testing, security, and verification.

---

## 2. Standard Operating Procedures (SOP)

1. Analyze project tech stack, architecture, domain intelligence, and testing frameworks.
2. Author or update AGENTS.md with 7 standardized sections: Operating Charter, 9-Step Cycle, Subagent Registry, Technical Stack Standards, Domain Intelligence, Testing Protocol, and Communication Protocol.
3. Ensure rules are actionable, concrete, and enforceable via automated commands.
4. Verify rule files adhere to the 24,000 byte per-file size cap for progressive loading.
5. Review and commit AGENTS.md to version control at project root.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
git status
npx tsx scripts/verify-skills.ts
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never remove or weaken existing project safety rules or testing standards.
- **Guard**: Do not create vague, aspirational rules; define exact commands, files, and criteria.
- **Guard**: Ensure AGENTS.md does not exceed maximum file byte limits.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify AGENTS.md file exists at project root and is valid Markdown.
- [ ] Verify all 7 standard operational sections are present and fully articulated.
- [ ] Verify agent adheres strictly to defined rules in subsequent interactions.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `architect`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
