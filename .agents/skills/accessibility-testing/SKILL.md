---
name: accessibility-testing
description: >-
  Audit and enforce WCAG 2.1 AA/AAA accessibility standards using axe-core, semantic HTML, keyboard navigation, and screen reader testing. Use when evaluating UI components, forms, modals, or navigation menus.
---

# Web Accessibility (a11y) & WCAG Compliance Auditing

> **Category**: Automated Testing & Verification QA  
> **Specialist Subagent**: `frontend-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Ensure all user interfaces conform to WCAG 2.1 Level AA standards.**: Ensure all user interfaces conform to WCAG 2.1 Level AA standards.
2. **Guarantee full keyboard navigability with visible focus indicators and tab sequences.**: Guarantee full keyboard navigability with visible focus indicators and tab sequences.
3. **Enforce semantic HTML, ARIA landmarks, roles, and accessible names for assistive technology.**: Enforce semantic HTML, ARIA landmarks, roles, and accessible names for assistive technology.

---

## 2. Standard Operating Procedures (SOP)

1. Run automated accessibility scans using @axe-core/playwright on all primary views.
2. Audit keyboard navigation: verify Tab traverses elements in logical order; Esc closes modals.
3. Inspect interactive elements: ensure all buttons, links, and inputs have accessible labels.
4. Audit color contrast ratios: ensure minimum 4.5:1 for normal text and 3:1 for large text.
5. Verify focus management: ensure focus returns to trigger element when modals dismiss.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npx axe-core-cli http://localhost:3000
npm test -- tests/a11y-*.test.ts
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never remove CSS focus outlines (outline: none) without providing an accessible alternative.
- **Guard**: Never use non-semantic elements (<div>, <span>) for buttons or links without full ARIA roles.
- **Guard**: Ensure icon-only buttons always include an aria-label or screen-reader text.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify axe-core reports 0 critical or serious accessibility violations.
- [ ] Verify 100% of interactive controls are reachable and operable via keyboard.
- [ ] Verify modal dialogs trap focus while open and release cleanly on Esc.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `frontend-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
