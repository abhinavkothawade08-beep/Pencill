---
name: responsive-design
description: >-
  Engineer fluid, responsive layouts using modern CSS Grid, Flexbox, and Tailwind breakpoints that render flawlessly from 320px mobile to 4K displays. Use when styling pages, tables, navigation, or grids.
---

# Mobile-First Responsive Layout Engineering

> **Category**: Frontend, UI/UX, DevTools & Performance  
> **Specialist Subagent**: `frontend-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Build mobile-first responsive layouts that adapt seamlessly across all screen dimensions.**: Build mobile-first responsive layouts that adapt seamlessly across all screen dimensions.
2. **Eliminate horizontal scrollbars, text overflows, and broken grid alignments on mobile devices.**: Eliminate horizontal scrollbars, text overflows, and broken grid alignments on mobile devices.
3. **Ensure touch targets are appropriately sized (minimum 44x44px) for mobile usability.**: Ensure touch targets are appropriately sized (minimum 44x44px) for mobile usability.

---

## 2. Standard Operating Procedures (SOP)

1. Author CSS utility classes using Tailwind's mobile-first breakpoint prefixes (sm:, md:, lg:, xl:, 2xl:).
2. Use modern CSS Grid and Flexbox with auto-fit / auto-fill minmax() for fluid grid scaling.
3. Test layouts at critical responsive breakpoints: 320px, 375px, 640px, 768px, 1024px, 1440px, and 2560px.
4. Implement responsive navigation patterns: hamburger menus / bottom sheets on mobile, persistent nav on desktop.
5. Ensure data tables gracefully collapse into card views or support smooth horizontal scroll on narrow screens.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npx playwright test tests/visual/responsive.test.ts
npm run lint
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never use hardcoded fixed pixel widths (width: 800px) that trigger horizontal scrolling on mobile.
- **Guard**: Never hide critical functionality or content on mobile breakpoints without an accessible alternative.
- **Guard**: Avoid tiny tap targets that lead to frustrating missed taps on touch screens.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify zero horizontal scroll on viewports from 320px to 4K.
- [ ] Verify all interactive elements meet minimum 44x44px touch target dimensions.
- [ ] Verify text scales legibly without clipping across all responsive breakpoints.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `frontend-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
