---
name: seo-auditor
description: >-
  Implement search engine optimization best practices, OpenGraph meta tags, JSON-LD structured data, canonical URLs, and sitemap generators. Use when creating public routes, landing pages, or sharing previews.
---

# Search Engine Optimization (SEO) & Metadata Auditing

> **Category**: Frontend, UI/UX, DevTools & Performance  
> **Specialist Subagent**: `frontend-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Maximize search engine indexability and social sharing previews across all public routes.**: Maximize search engine indexability and social sharing previews across all public routes.
2. **Implement dynamic metadata and OpenGraph / Twitter card tags using Next.js Metadata API.**: Implement dynamic metadata and OpenGraph / Twitter card tags using Next.js Metadata API.
3. **Embed structured JSON-LD schemas (Course, EducationalOrganization, BreadcrumbList) for rich snippets.**: Embed structured JSON-LD schemas (Course, EducationalOrganization, BreadcrumbList) for rich snippets.

---

## 2. Standard Operating Procedures (SOP)

1. Configure metadata objects in page.tsx / layout.tsx with title, description, and canonical URLs.
2. Generate dynamic OpenGraph image previews (opengraph-image.tsx) for social media sharing.
3. Inject validated JSON-LD schema scripts matching Google Search Central structured data specs.
4. Configure dynamic robots.txt and sitemap.xml route generators in src/app/.
5. Audit rendered HTML headers to verify complete meta tag coverage and tag uniqueness.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
curl -s http://localhost:3000 | grep -i '<meta'
npm test -- tests/seo-*.test.ts
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never duplicate title or meta description tags across different public routes.
- **Guard**: Ensure private or authenticated dashboard routes are marked with noindex, nofollow.
- **Guard**: Validate that canonical URLs use absolute HTTPS URLs matching the production domain.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify Rich Results Test validates JSON-LD structured data without errors.
- [ ] Verify OpenGraph tags render valid preview cards on social sharing debuggers.
- [ ] Verify sitemap.xml generates valid XML listing all public indexable routes.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `frontend-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
