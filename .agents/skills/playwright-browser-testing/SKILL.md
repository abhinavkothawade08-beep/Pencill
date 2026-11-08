---
name: playwright-browser-testing
description: >-
  Develop robust, resilient headless browser tests using Playwright with locator best practices, Page Object Models, and network request interception. Use when testing user journeys, cross-browser behavior, or UI workflows.
---

# Playwright Headless Browser Testing & Automation

> **Category**: Automated Testing & Verification QA  
> **Specialist Subagent**: `qa-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Author reliable browser automation tests resistant to DOM structure changes.**: Author reliable browser automation tests resistant to DOM structure changes.
2. **Test complete user workflows (registration, login, path creation, quiz completion).**: Test complete user workflows (registration, login, path creation, quiz completion).
3. **Capture screenshots, DOM snapshots, and network traces on test failure.**: Capture screenshots, DOM snapshots, and network traces on test failure.

---

## 2. Standard Operating Procedures (SOP)

1. Initialize Playwright test configuration with target viewports (desktop, mobile).
2. Implement Page Object Models (POM) encapsulating page locators and user actions.
3. Use user-facing accessibility locators (getByRole, getByLabel, getByText) over CSS selectors.
4. Intercept and mock external third-party network APIs to isolate internal application logic.
5. Execute tests in headless mode and inspect HTML report artifacts.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npx playwright test
npx playwright test --ui
npx playwright show-report
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never use hardcoded arbitrary sleep (waitForTimeout); use web assertions with auto-wait.
- **Guard**: Avoid fragile XPath or deep CSS selectors that break on layout changes.
- **Guard**: Clean up browser contexts and test state between test specs.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify all Playwright test specs pass cleanly across Chromium, Firefox, and WebKit.
- [ ] Verify test traces and screenshots are recorded on any unexpected assertion failure.
- [ ] Verify tests run deterministically in CI environments.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `qa-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
