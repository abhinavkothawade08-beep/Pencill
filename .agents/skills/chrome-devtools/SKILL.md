---
name: chrome-devtools
description: >-
  Leverage Chrome DevTools Protocol to inspect live DOM trees, monitor network payloads, profile JavaScript execution, and evaluate CSS styling. Use when debugging live web applications or testing browser rendering.
---

# Chrome DevTools Protocol (CDP) & Browser Inspection

> **Category**: Frontend, UI/UX, DevTools & Performance  
> **Specialist Subagent**: `frontend-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Inspect and manipulate live DOM elements and CSS computed styles in real time.**: Inspect and manipulate live DOM elements and CSS computed styles in real time.
2. **Analyze network request/response headers, status codes, and timing waterfalls.**: Analyze network request/response headers, status codes, and timing waterfalls.
3. **Capture console logs, uncaught exceptions, and performance traces directly from Chrome.**: Capture console logs, uncaught exceptions, and performance traces directly from Chrome.

---

## 2. Standard Operating Procedures (SOP)

1. Connect to target Chrome instance via Chrome DevTools MCP or remote debugging port.
2. Inspect target DOM nodes to verify attributes, ARIA roles, and computed CSS properties.
3. Monitor Network panel to inspect API payloads, status codes, and response latency.
4. Capture console messages and stack traces for runtime JavaScript exceptions.
5. Profile CPU and memory allocation during heavy user interactions.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npx chrome-devtools-mcp
curl http://localhost:9222/json
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Follow sandbox rules when interacting with local browser instances on Windows.
- **Guard**: Do not leave detached headless Chrome processes consuming background system memory.
- **Guard**: Ensure sensitive authentication cookies or headers are redacted in shared logs.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify browser page navigates and renders target URL without console errors.
- [ ] Verify network inspection accurately captures API request and response data.
- [ ] Verify DOM tree structure matches expected React virtual DOM hierarchy.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `frontend-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
