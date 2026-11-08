---
name: code-generation
description: >-
  Synthesize clean, robust, zero-mock, fully typed TypeScript code following established repository design patterns. Use when creating new modules, implementing feature requests, or generating boilerplate services.
---

# Production-Grade Code Generation

> **Category**: Core Full-Stack & Software Architecture  
> **Specialist Subagent**: `backend-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Generate hermetic, production-ready code with complete functional implementations.**: Generate hermetic, production-ready code with complete functional implementations.
2. **Adhere strictly to project conventions, naming rules, and directory structures.**: Adhere strictly to project conventions, naming rules, and directory structures.
3. **Guarantee zero stubbed methods, placeholder comments, or unhandled branches.**: Guarantee zero stubbed methods, placeholder comments, or unhandled branches.

---

## 2. Standard Operating Procedures (SOP)

1. Inspect surrounding files and architectural guidelines to mirror project idiomatic patterns.
2. Define explicit TypeScript types and Zod schemas before authoring implementation logic.
3. Implement the complete logic without omitting edge cases, error conditions, or cleanup.
4. Add comprehensive unit and integration tests covering positive, negative, and edge scenarios.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npx tsc --noEmit
npm test
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never generate TODO, FIXME, or mock return values in production code.
- **Guard**: Never use loose 'as any' casting to bypass TypeScript type-safety.
- **Guard**: Preserve existing comments and docstrings in edited files.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify newly generated files compile cleanly with zero TypeScript errors.
- [ ] Verify 100% test pass rate for all newly generated modules.
- [ ] Verify code adheres to ESLint rules without disabling warnings.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `backend-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
