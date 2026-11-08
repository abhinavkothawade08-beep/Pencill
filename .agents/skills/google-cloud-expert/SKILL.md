---
name: google-cloud-expert
description: >-
  Architect, deploy, and secure cloud workloads on Google Cloud Platform: Cloud Run, Artifact Registry, IAM roles, and Secret Manager. Use when configuring cloud deployments, secrets, or GCP infrastructure.
---

# Google Cloud Platform (GCP) Architecture & Services

> **Category**: Google Ecosystem, APIs & Mobile  
> **Specialist Subagent**: `backend-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Deploy scalable, containerized microservices and web applications to Google Cloud Run.**: Deploy scalable, containerized microservices and web applications to Google Cloud Run.
2. **Enforce least-privilege Identity and Access Management (IAM) role assignments.**: Enforce least-privilege Identity and Access Management (IAM) role assignments.
3. **Manage sensitive application secrets securely using GCP Secret Manager.**: Manage sensitive application secrets securely using GCP Secret Manager.

---

## 2. Standard Operating Procedures (SOP)

1. Configure gcloud CLI with target project and authenticated service account.
2. Build and push container images to Google Artifact Registry.
3. Deploy services to Cloud Run with explicit memory, CPU, and auto-scaling limits.
4. Bind IAM service accounts with minimal required roles (e.g. roles/run.invoker).
5. Mount application secrets into Cloud Run containers directly from Secret Manager.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
gcloud config get-value project
gcloud run services list
gcloud secrets list
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never grant broad Owner or Editor roles to service accounts used in automated pipelines.
- **Guard**: Never commit GCP service account keys (.json) into git repositories.
- **Guard**: Ensure Cloud Run services are configured with concurrency and max instance caps to prevent cost spikes.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify Cloud Run service responds to health check probes with HTTP 200.
- [ ] Verify application secrets are injected securely into the runtime environment.
- [ ] Verify IAM role bindings strictly conform to least-privilege principles.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `backend-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
