---
name: log-analysis
description: >-
  Parse, filter, and correlate structured server and client application logs to diagnose runtime anomalies and trace user sessions. Use when analyzing server error logs, network traces, or crash dumps.
---

# Structured Log Analysis & Stack Symbolication

> **Category**: Automated Debugging & Root Cause Analysis  
> **Specialist Subagent**: `backend-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Extract actionable signals, error codes, and correlation IDs from high-volume logs.**: Extract actionable signals, error codes, and correlation IDs from high-volume logs.
2. **Symbolicate minified production stack traces back to original TypeScript source lines.**: Symbolicate minified production stack traces back to original TypeScript source lines.
3. **Reconstruct end-to-end request lifecycle across distributed service boundaries.**: Reconstruct end-to-end request lifecycle across distributed service boundaries.

---

## 2. Standard Operating Procedures (SOP)

1. Ingest application logs from console, file output, or monitoring endpoints.
2. Filter logs by severity level (ERROR, WARN, FATAL) and correlation/request ID.
3. Parse structured JSON metadata (timestamp, user_id, route, duration, status).
4. Map stack trace source positions using source maps if minified.
5. Identify the initiating event and trace the propagation chain leading to the error log.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
Get-Content app.log -Tail 100
npx source-map-cli resolve <map-file> <line> <column>
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Ensure logs are sanitized to prevent exposing PII, passwords, or bearer tokens.
- **Guard**: Avoid parsing massive log files into memory at once; use streaming or tail filters.
- **Guard**: Verify log levels are configured appropriately to avoid log spam in production.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify identified log event correlates directly with the reported defect.
- [ ] Verify stack trace points to exact source file and line number.
- [ ] Verify fix eliminates the recurring error log in subsequent test runs.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `backend-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
