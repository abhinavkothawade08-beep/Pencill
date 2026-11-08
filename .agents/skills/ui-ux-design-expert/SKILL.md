---
name: ui-ux-design-expert
description: >-
  Design and implement beautiful, accessible, academic-grade user interfaces with typographic discipline, visual hierarchy, and 4 discrete container states. Use when building or styling UI components and user journeys.
---

# Academic UI/UX Design & Human-Interface Guidelines

> **Category**: Frontend, UI/UX, DevTools & Performance  
> **Specialist Subagent**: `frontend-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Deliver elegant, academic-grade user interfaces with clear visual hierarchy and balanced spacing.**: Deliver elegant, academic-grade user interfaces with clear visual hierarchy and balanced spacing.
2. **Enforce the 4 mandatory interactive container states**: Loading, Empty, Error, and Populated.
3. **Ensure typographic discipline, harmonious color palettes, and intuitive micro-interactions.**: Ensure typographic discipline, harmonious color palettes, and intuitive micro-interactions.

---

## 2. Standard Operating Procedures (SOP)

1. Define component layout with strong visual hierarchy: clear headings, body text, and distinct CTAs.
2. State 1 (Loading): Build animated skeleton screens matching the exact layout geometry.
3. State 2 (Empty): Design actionable empty states with helpful illustrations and clear CTA buttons.
4. State 3 (Error): Present user-friendly error messages with retry actions and sanitized error codes.
5. State 4 (Populated): Render content with clean typography, responsive padding, and high readability.
6. Apply subtle micro-interactions: smooth hover transitions, focus rings, and active states.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npm run lint
npx tsc --noEmit
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never use full-page spinner blocks that cause layout flashes; always use geometry skeletons.
- **Guard**: Never leave empty states without a helpful explanation and a clear call-to-action.
- **Guard**: Avoid cluttered UI with excessive competing colors or distracting animations.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify all 4 states (loading, empty, error, populated) are fully implemented and tested.
- [ ] Verify typography follows established scale (h1, h2, h3, body, caption).
- [ ] Verify interface feels responsive, modern, and aligned with academic platform aesthetics.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `frontend-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
