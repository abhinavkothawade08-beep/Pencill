# Global Rule: Code Quality & Architectural Integrity

> **Standard**: Build production-ready, fault-tolerant, strictly typed software. Zero dead code, zero unhandled errors.

---

## 1. TypeScript & Type Safety
1. **Strict Mode Invariant**: All TypeScript code must compile under strict settings without errors (`npx tsc --noEmit`).
2. **Zero `any`**: Never use `any`, loose casts (`as unknown as T`), or `@ts-ignore` / `@ts-nocheck`.
3. **Validated Runtime Contracts**: Every API route and service boundary must validate inputs using Zod schemas (`src/lib/api-schemas.ts`).

---

## 2. Component & UI Architecture
1. **4 Discrete States**: Every interactive container must support Loading (skeleton), Empty (actionable CTA), Error (recovery action), and Populated.
2. **Accessible Semantics**: Semantic HTML5 tags (`<main>`, `<article>`, `<nav>`), keyboard accessibility, focus indicators, and ARIA roles.
3. **Responsive Discipline**: Mobile-first design adapting fluidly from 320px mobile to 4K displays with zero horizontal scroll.

---

## 3. Clean Code & Maintainability
1. **Zero Dead Code**: Eliminate unused exports, commented-out blocks, and dangling imports.
2. **Documentation Integrity**: Maintain docstrings and comments on all public interfaces; never remove existing comments.
3. **Idiomatic Formatting**: Adhere to ESLint and Prettier formatting with zero warnings (`npm run lint`).
