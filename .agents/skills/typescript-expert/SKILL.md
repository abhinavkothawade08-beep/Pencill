---
name: typescript-expert
description: >-
  Enforce strict TypeScript type systems, branded nominal typing, discriminated unions, and generic constraints. Use when fixing complex type errors, designing type-safe APIs, or eliminating unsafe type assertions.
---

# Advanced TypeScript Engineering & Type Safety

> **Category**: Core Full-Stack & Software Architecture  
> **Specialist Subagent**: `architect`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Enforce strict mode TypeScript with zero 'any' or loose type assertions.**: Enforce strict mode TypeScript with zero 'any' or loose type assertions.
2. **Design expressive type contracts using discriminated unions, generics, and template literals.**: Design expressive type contracts using discriminated unions, generics, and template literals.
3. **Implement runtime-to-static type synchronization using Zod type inference (z.infer<T>).**: Implement runtime-to-static type synchronization using Zod type inference (z.infer<T>).

---

## 2. Standard Operating Procedures (SOP)

1. Audit codebase with 'npx tsc --noEmit' to detect implicit any, loose casts, or unsound types.
2. Replace 'any' with explicit discriminated unions, generics, or unknown with type guards.
3. Model domain IDs and primitives with branded types (e.g. type UserId = string & { readonly __brand: unique symbol }).
4. Leverage utility types (Pick, Omit, Readonly, Partial, Record) for robust API modeling.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npx tsc --noEmit
npx tsc --build --force
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never disable tsconfig strict settings (noImplicitAny, strictNullChecks, etc.).
- **Guard**: Never cast through 'as unknown as T' unless operating at a verified boundary adapter.
- **Guard**: Avoid circular type definitions that slow down TypeScript compilation.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify 'npx tsc --noEmit' returns exit code 0 with 0 errors.
- [ ] Verify exported interfaces and types are exported cleanly without type truncation.
- [ ] Verify autocomplete and intellisense operate accurately across consumer modules.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `architect`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
