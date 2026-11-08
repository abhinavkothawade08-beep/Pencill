---
name: docker-expert
description: >-
  Build secure, lightweight, multi-stage Docker container images, optimize layer caching, and configure container runtimes. Use when containerizing applications, writing Dockerfiles, or configuring Docker Compose.
---

# Docker Containerization & Image Optimization

> **Category**: DevOps, Infrastructure, Git & Observability  
> **Specialist Subagent**: `backend-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Build secure, minimal, multi-stage Docker images (< 150MB) for Next.js applications.**: Build secure, minimal, multi-stage Docker images (< 150MB) for Next.js applications.
2. **Optimize Docker layer caching to accelerate build times in CI/CD pipelines.**: Optimize Docker layer caching to accelerate build times in CI/CD pipelines.
3. **Run containers as non-root users with minimal attack surfaces and secure defaults.**: Run containers as non-root users with minimal attack surfaces and secure defaults.

---

## 2. Standard Operating Procedures (SOP)

1. Author multi-stage Dockerfile: deps stage -> builder stage -> runner stage.
2. Leverage Next.js standalone output mode (output: 'standalone' in next.config.mjs).
3. Copy only necessary standalone files, public assets, and static assets into runner stage.
4. Create non-root user (USER nextjs) to execute the Node.js application process.
5. Define explicit HEALTHCHECK instruction verifying application response on /api/health.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
docker build -t app:latest .
docker run -p 3000:3000 app:latest
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never run Docker containers as root user in production environments.
- **Guard**: Never copy .env files or secrets into Docker image build layers.
- **Guard**: Always include .dockerignore excluding node_modules, .git, and build artifacts.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify Docker image builds successfully and image size is within budget (< 200MB).
- [ ] Verify container boots cleanly and passes Docker HEALTHCHECK probe.
- [ ] Verify container vulnerability scan reports 0 critical security vulnerabilities.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `backend-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
