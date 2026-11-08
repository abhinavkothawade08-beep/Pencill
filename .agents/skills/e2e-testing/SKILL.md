---
name: e2e-testing
description: >-
  Validate full customer workflows and critical user paths from initial page visit to final goal completion. Use when verifying release readiness, critical user journeys, or major feature integration.
---

# End-to-End User Journey Verification

> **Category**: Automated Testing & Verification QA  
> **Specialist Subagent**: `qa-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Simulate authentic user interactions across complete multi-step journeys.**: Simulate authentic user interactions across complete multi-step journeys.
2. **Validate cross-page navigation, session preservation, and local storage caching.**: Validate cross-page navigation, session preservation, and local storage caching.
3. **Ensure zero blockers on revenue-critical or mission-critical user workflows.**: Ensure zero blockers on revenue-critical or mission-critical user workflows.

---

## 2. Standard Operating Procedures (SOP)

1. Map out the end-to-end user path: Home -> Search -> Path Builder -> Module View -> Quiz -> Profile.
2. Automate browser actions filling forms, clicking CTA buttons, and navigating routes.
3. Verify that visual feedback, loading indicators, and success states appear promptly.
4. Assert that final user data persists accurately and reflects in dashboard metrics.
5. Record execution video and screenshots for auditing.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npx playwright test tests/e2e/
npm test
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Avoid brittle selectors that fail when copy or styling changes slightly.
- **Guard**: Ensure test users are cleaned up or isolated to prevent account collisions.
- **Guard**: Set sensible timeouts (30s) to detect hanging API calls or infinite loaders.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify end-to-end journey completes successfully from initial click to terminal state.
- [ ] Verify local storage cache and database state remain in sync.
- [ ] Verify zero unexpected console errors during browser execution.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `qa-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
