---
name: visual-regression-testing
description: >-
  Detect unintended pixel-level regressions, layout shifts, typography breaks, and color drifts across responsive breakpoints. Use when modifying CSS, Tailwind configurations, or global layout components.
---

# Visual Regression & Layout Shift Testing

> **Category**: Automated Testing & Verification QA  
> **Specialist Subagent**: `frontend-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Capture baseline screenshots of core views across mobile, tablet, and desktop viewports.**: Capture baseline screenshots of core views across mobile, tablet, and desktop viewports.
2. **Compare newly rendered pages against baselines with pixel-diff thresholds.**: Compare newly rendered pages against baselines with pixel-diff thresholds.
3. **Prevent Cumulative Layout Shift (CLS) and visual artifacts in production releases.**: Prevent Cumulative Layout Shift (CLS) and visual artifacts in production releases.

---

## 2. Standard Operating Procedures (SOP)

1. Define visual regression test suite in Playwright with toHaveScreenshot() assertions.
2. Configure deterministic test environment: disable CSS animations, freeze system clock, mock dynamic data.
3. Run visual regression tests across 320px, 768px, 1024px, and 1440px viewports.
4. Review pixel diff images when tests flag visual deviations; verify if intentional.
5. Update baseline snapshots when visual changes represent approved design updates.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npx playwright test --update-snapshots
npx playwright test tests/visual/
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never commit new baseline snapshots without visual review and design confirmation.
- **Guard**: Ensure web fonts are fully loaded before capturing screenshot baselines.
- **Guard**: Avoid volatile elements (unpinned dates, avatars) in snapshot comparison areas.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify visual regression suite passes with 0 unexpected pixel diffs.
- [ ] Verify CLS score remains < 0.1 across all primary routes.
- [ ] Verify layout integrity holds across mobile and desktop viewport sizes.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `frontend-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
