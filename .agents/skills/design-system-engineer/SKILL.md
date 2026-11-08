---
name: design-system-engineer
description: >-
  Architect and maintain atomic design systems, design tokens, reusable UI primitives, and Tailwind theme configurations. Use when creating design components, establishing theme tokens, or standardizing UI patterns.
---

# Atomic Design System Engineering & Design Tokens

> **Category**: Frontend, UI/UX, DevTools & Performance  
> **Specialist Subagent**: `frontend-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Build a cohesive atomic design system**: Tokens -> Atoms -> Molecules -> Organisms -> Templates.
2. **Manage central design tokens (colors, typography, spacing, shadows, radii) in Tailwind configuration.**: Manage central design tokens (colors, typography, spacing, shadows, radii) in Tailwind configuration.
3. **Create reusable, compound component primitives with strict TypeScript props and accessibility.**: Create reusable, compound component primitives with strict TypeScript props and accessibility.

---

## 2. Standard Operating Procedures (SOP)

1. Define centralized design tokens in tailwind.config.ts (palette, spacing, fonts, animations).
2. Implement atomic primitive components in src/components/ui/ (Button, Input, Badge, Card, Modal).
3. Use class-variance-authority (cva) or clsx / tailwind-merge for flexible component variants.
4. Document component props, variants, and usage guidelines in component docstrings.
5. Ensure all design system primitives adhere to accessibility standards out of the box.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npm test -- tests/components/*.test.ts
npx tsc --noEmit
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never use arbitrary hardcoded color hex values (#234abc) in components; always use design tokens.
- **Guard**: Avoid duplicated component implementations; reuse design system primitives consistently.
- **Guard**: Ensure breaking prop changes on primitives are audited across all consumer call sites.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify all UI primitives compile cleanly and pass component unit tests.
- [ ] Verify design tokens correctly drive styling across light/dark themes.
- [ ] Verify zero duplicate styling classes or conflicting Tailwind class precedence.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `frontend-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
