---
name: youtube-api-expert
description: >-
  Integrate YouTube Data API v3 to search educational playlists, retrieve verified video metadata, and validate academic channels from MASTER_YOUTUBE_EDUCATOR_DIRECTORY.md. Use when recommending educational videos.
---

# YouTube Data API v3 & Educational Video Integration

> **Category**: Google Ecosystem, APIs & Mobile  
> **Specialist Subagent**: `backend-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Integrate YouTube Data API v3 with quota-aware caching and retry logic.**: Integrate YouTube Data API v3 with quota-aware caching and retry logic.
2. **Ground video recommendations exclusively in verified academic educators and channels.**: Ground video recommendations exclusively in verified academic educators and channels.
3. **Validate video URLs, channel IDs, titles, and thumbnails for real educational content.**: Validate video URLs, channel IDs, titles, and thumbnails for real educational content.

---

## 2. Standard Operating Procedures (SOP)

1. Reference docs/MASTER_YOUTUBE_EDUCATOR_DIRECTORY.md for canonical academic channel IDs.
2. Query YouTube Data API v3 (search, playlists, videos endpoints) with strict topic parameters.
3. Cache API responses locally in data/ or database to preserve daily API quota limits.
4. Filter returned videos to guarantee high educational value, high resolution, and valid embeddability.
5. Format video recommendations with verified URLs (https://www.youtube.com/watch?v=...), duration, and channel.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npm test -- tests/resource-engine-*.test.ts
npx tsx scripts/compile-taxonomy.js
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never fabricate fake channel names, invalid video URLs, or generic homepage links (youtube.com).
- **Guard**: Never recommend clickbait, entertainment, or unverified commercial courses.
- **Guard**: Ensure API calls handle quota exhaustion (quotaExceeded 403) gracefully with cached fallback.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify all recommended video URLs resolve to real, active YouTube videos.
- [ ] Verify channel names match verified educators in MASTER_YOUTUBE_EDUCATOR_DIRECTORY.md.
- [ ] Verify automated test suites for educational resource discovery pass 100%.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `backend-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
