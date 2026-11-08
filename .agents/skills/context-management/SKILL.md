---
name: context-management
description: >-
  Optimize agent context window utilization using progressive disclosure, targeted file reads, compact transcripts, and memory pruning. Use when managing long conversations or large codebases.
---

# Agent Context Management & Token Window Optimization

> **Category**: AI Systems, LLMs & Agentic Engineering  
> **Specialist Subagent**: `architect`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Maximize reasoning performance by maintaining high signal-to-noise ratio in context.**: Maximize reasoning performance by maintaining high signal-to-noise ratio in context.
2. **Prevent context window exhaustion and unnecessary token bloat.**: Prevent context window exhaustion and unnecessary token bloat.
3. **Enforce progressive disclosure**: load only relevant lines and reference files on demand.

---

## 2. Standard Operating Procedures (SOP)

1. Read only targeted line ranges of large files using read_file with StartLine and EndLine.
2. Summarize bulky outputs before feeding into downstream agent conversations.
3. Delegate deep research tasks to subagents running in isolated conversation contexts.
4. Keep SKILL.md and rule files concise, referencing detailed manuals in external files.
5. Prune outdated intermediate thinking from prompt state when compacting.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
git diff --stat
npx tsx scripts/compile-taxonomy.js
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never dump massive 10,000-line files or entire database dumps directly into chat context.
- **Guard**: Avoid repetitive polling loops that pollute transcript history.
- **Guard**: Do not re-summarize persistent artifact contents in chat messages.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify conversation context remains agile and responsive.
- [ ] Verify token utilization stays within optimal model capacity limits.
- [ ] Verify key architectural decisions and requirements remain preserved across turns.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `architect`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
