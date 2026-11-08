---
name: google-developer-knowledge
description: >-
  Search, synthesize, and apply official Google developer documentation across Google Cloud, Gemini API, Android, Firebase, and Web APIs. Use when integrating Google platforms, APIs, or developer services.
---

# Google Developer Ecosystem & Documentation Synthesis

> **Category**: Google Ecosystem, APIs & Mobile  
> **Specialist Subagent**: `research`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Navigate official Google developer documentation and API specifications accurately.**: Navigate official Google developer documentation and API specifications accurately.
2. **Select correct Google Cloud / Gemini / Firebase SDK methods, parameters, and quotas.**: Select correct Google Cloud / Gemini / Firebase SDK methods, parameters, and quotas.
3. **Ensure compliance with Google API deprecation timelines and recommended best practices.**: Ensure compliance with Google API deprecation timelines and recommended best practices.

---

## 2. Standard Operating Procedures (SOP)

1. Query official Google Developer documentation resources (or Google Developer Knowledge tools).
2. Cross-reference SDK method signatures against official reference specifications.
3. Identify required Google Cloud IAM roles, scopes, and API enablement prerequisites.
4. Implement proper error handling for Google API error payloads and quota exhaustion (429).
5. Document architectural decisions referencing official Google documentation.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
gcloud services list --enabled
curl -s https://www.googleapis.com/discovery/v1/apis
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never use deprecated v1 / beta endpoints when stable v1beta / v2 APIs are recommended.
- **Guard**: Never hardcode Google API keys in source files; always read from validated environment variables.
- **Guard**: Adhere to Google API Terms of Service and rate limits.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify Google API requests succeed with valid authenticated responses.
- [ ] Verify method calls adhere strictly to official current SDK documentation.
- [ ] Verify zero deprecated API usage warnings in logs.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `research`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
