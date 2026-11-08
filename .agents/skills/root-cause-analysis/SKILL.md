---
name: root-cause-analysis
description: >-
  Conduct rigorous Root Cause Analysis using 5 Whys, failure mode effect analysis, and execution trace timeline reconstruction. Use when investigating recurring defects, data corruption incidents, or complex distributed bugs.
---

# Root Cause Analysis (RCA) & Failure Decomposition

> **Category**: Automated Debugging & Root Cause Analysis  
> **Specialist Subagent**: `architect`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Uncover the foundational root cause behind superficial symptoms and error manifestations.**: Uncover the foundational root cause behind superficial symptoms and error manifestations.
2. **Map out the causal chain of events from initial trigger to terminal failure.**: Map out the causal chain of events from initial trigger to terminal failure.
3. **Produce actionable structural recommendations preventing class-wide failure recurrence.**: Produce actionable structural recommendations preventing class-wide failure recurrence.

---

## 2. Standard Operating Procedures (SOP)

1. Collect all available artifacts: logs, timestamps, error payloads, inputs, environment state.
2. Reconstruct the timeline of events preceding the failure.
3. Apply the 5 Whys methodology: drill down into each contributing factor until the systemic defect is isolated.
4. Categorize failure: schema mismatch, concurrency race, boundary validation gap, or state leak.
5. Document RCA findings with Root Cause, Impact, Resolution, and Prevention Checklist.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
git log -p -S <symbol>
git blame <file>
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Do not stop at superficial causes (e.g. 'null pointer') without identifying why it was null.
- **Guard**: Ensure findings distinguish between direct triggers and systemic vulnerabilities.
- **Guard**: Avoid assigning blame to tooling; focus on code contracts and architectural boundaries.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify root cause explanation accounts for 100% of observed failure symptoms.
- [ ] Verify the proposed fix eliminates the systemic root cause, not just the symptom.
- [ ] Verify regression tests prevent recurrence under identical trigger conditions.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `architect`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
