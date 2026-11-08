---
name: a11y-debugging
description: >-
  Inspect the browser Accessibility Tree, debug ARIA role attributes, verify screen reader announcements, and resolve accessibility tree discrepancies. Use when debugging complex accessible widgets, dropdowns, and comboboxes.
---

# Accessibility Tree Inspection & Screen Reader Debugging

> **Category**: Frontend, UI/UX, DevTools & Performance  
> **Specialist Subagent**: `frontend-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Inspect the computed accessibility tree in browser DevTools to verify accessible names and roles.**: Inspect the computed accessibility tree in browser DevTools to verify accessible names and roles.
2. **Verify live region announcements (aria-live) for asynchronous content updates.**: Verify live region announcements (aria-live) for asynchronous content updates.
3. **Debug combobox, tabs, and menu roving tabindex patterns for assistive technology.**: Debug combobox, tabs, and menu roving tabindex patterns for assistive technology.

---

## 2. Standard Operating Procedures (SOP)

1. Open Accessibility pane in browser DevTools and inspect target element's accessibility node.
2. Verify accessible name computation: check aria-label, aria-labelledby, and text content cascade.
3. Test screen reader navigation: verify announcements when interacting with tabs, dialogs, and alerts.
4. Validate aria-expanded, aria-selected, and aria-controls state updates on dynamic interactions.
5. Audit keyboard roving tabindex implementation to ensure single tab stop per widget.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npx axe-core-cli http://localhost:3000
npm test
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never use 'role="presentation"' or 'role="none"' on interactive elements.
- **Guard**: Avoid aria-hidden="true" on elements that currently contain user focus or interactive children.
- **Guard**: Do not announce redundant information in aria-labels that matches visible text exactly.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify accessibility tree exposes correct role and accessible name for all controls.
- [ ] Verify aria-live regions announce status updates without interrupting critical alerts.
- [ ] Verify zero accessibility violations in DevTools accessibility audit.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `frontend-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
