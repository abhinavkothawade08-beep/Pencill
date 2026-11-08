---
name: browser-automation
description: >-
  Automate complex browser workflows including form completion, file uploads, state transitions, and screenshot capture. Use when automating manual web tasks, scraping, or running synthetic workflows.
---

# Scripted Browser Automation & Interaction Workflows

> **Category**: Frontend, UI/UX, DevTools & Performance  
> **Specialist Subagent**: `frontend-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Automate multi-step browser user workflows reliably and reproducibly.**: Automate multi-step browser user workflows reliably and reproducibly.
2. **Interact with form inputs, dropdowns, date pickers, and drag-and-drop interfaces.**: Interact with form inputs, dropdowns, date pickers, and drag-and-drop interfaces.
3. **Capture visual artifacts (screenshots, PDF exports, traces) during automation.**: Capture visual artifacts (screenshots, PDF exports, traces) during automation.

---

## 2. Standard Operating Procedures (SOP)

1. Launch automated browser session with target viewport and user-agent settings.
2. Navigate to target URL and wait for DOM network idle state.
3. Perform automated actions: type into inputs, select options, click buttons with auto-wait.
4. Validate that UI state updates correctly following each automated action.
5. Capture screenshot proof upon task completion and terminate browser session cleanly.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npx playwright test tests/e2e/
npx tsx scripts/screenshot-new-goal.ts
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never hardcode static timeouts; always wait for explicit selector states or network idle.
- **Guard**: Ensure automated actions respect rate limits and terms of service of third-party domains.
- **Guard**: Always close browser contexts in finally blocks to prevent process leaks.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify automated sequence completes from start to finish without timing out.
- [ ] Verify captured screenshot demonstrates successful UI state completion.
- [ ] Verify browser process exits cleanly with code 0.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `frontend-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
