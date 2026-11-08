---
name: firebase-expert
description: >-
  Configure and manage Firebase Authentication, Firestore databases, Cloud Storage, and Firebase Cloud Functions. Use when integrating Firebase services or authoring Firestore security rules.
---

# Firebase Cloud Services & Realtime Infrastructure

> **Category**: Google Ecosystem, APIs & Mobile  
> **Specialist Subagent**: `backend-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Integrate Firebase SDKs with type-safe data access and security rules.**: Integrate Firebase SDKs with type-safe data access and security rules.
2. **Author declarative Firestore and Storage security rules protecting user data.**: Author declarative Firestore and Storage security rules protecting user data.
3. **Implement serverless Cloud Functions with idempotent execution and error recovery.**: Implement serverless Cloud Functions with idempotent execution and error recovery.

---

## 2. Standard Operating Procedures (SOP)

1. Initialize Firebase app with validated project credentials and environment variables.
2. Configure Firestore data models with atomic batch writes and transaction support.
3. Author firestore.rules defining granular read/write conditions matching request.auth.uid.
4. Test Firestore rules locally using the Firebase Local Emulator Suite.
5. Deploy Firebase resources and functions using Firebase CLI.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
firebase emulators:start
firebase deploy --only firestore:rules
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never publish open Firestore rules ('allow read, write: if true;') to production.
- **Guard**: Never check Firebase admin service account JSON keys into source control.
- **Guard**: Avoid unbounded Firestore collection queries that consume excessive read quotas.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify Firebase emulator tests pass all security rule assertions.
- [ ] Verify unauthorized clients are blocked from reading or writing Firestore collections.
- [ ] Verify Firebase Cloud Functions execute and respond within latency budgets.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `backend-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
