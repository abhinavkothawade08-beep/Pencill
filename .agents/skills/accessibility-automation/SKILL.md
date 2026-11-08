---
name: accessibility-automation
description: >-
  Automate accessibility auditing in continuous integration using axe-core, enforcing 0 violations for WCAG 2.1 AA before merge. Use when establishing automated a11y gates or running repository audits.
---

# Automated Accessibility (a11y) CI Pipeline Gates

> **Category**: Deep System Verification, Safety & Acceptance  
> **Specialist Subagent**: `qa-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Enforce automated accessibility regression testing across every pull request and build.**: Enforce automated accessibility regression testing across every pull request and build.
2. **Guarantee zero critical or serious WCAG 2.1 Level AA violations across all views.**: Guarantee zero critical or serious WCAG 2.1 Level AA violations across all views.
3. **Automate reporting of accessible tree regressions and color contrast failures.**: Automate reporting of accessible tree regressions and color contrast failures.

---

## 2. Standard Operating Procedures (SOP)

1. Configure automated axe-core accessibility checks in Playwright / Jest test suites.
2. Target all major application routes (/explore, /learn, /practice, /dashboard, /profile).
3. Assert expect(results.violations).toEqual([]) on every rendered view.
4. Generate structured accessibility audit reports detailing any flagged violations.
5. Block CI pipeline build if any accessibility violation is detected.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npx axe-core-cli http://localhost:3000
npm test -- tests/a11y-*.test.ts
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never disable axe rules or increase violation threshold to pass broken builds.
- **Guard**: Ensure dynamic modal and dropdown states are tested in both open and closed positions.
- **Guard**: Do not skip color contrast checks for dark mode themes.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify automated a11y suite executes across 100% of primary application pages.
- [ ] Verify 0 violations reported for WCAG 2.1 Level AA compliance.
- [ ] Verify accessibility test suite passes cleanly in CI pipeline.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `qa-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
