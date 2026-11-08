# Pencill — Find Your Path

> **Autonomous AI-Powered Academic Curriculum Synthesis & Learning Ecosystem**

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14.2%20App%20Router-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6%20Strict-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20RLS-3ECF8E.svg)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-3.5%20%2F%202.5%20Flash-8E75C4.svg)](https://ai.google.dev/)
[![Tests](https://img.shields.io/badge/Tests-412%20Passed%20(88%20Suites)-brightgreen.svg)](#testing--verification)

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Project Directory Structure](#project-directory-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Supabase Setup & Migrations](#supabase-setup--migrations)
  - [Running Locally](#running-locally)
- [Environment Variables Reference](#environment-variables-reference)
- [API Route Reference](#api-route-reference)
- [Testing & Verification](#testing--verification)
- [Deployment](#deployment)
- [Security & Architectural Guardrails](#security--architectural-guardrails)
- [Known Limitations & Fallbacks](#known-limitations--fallbacks)
- [Documentation Index](#documentation-index)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**Pencill — Find Your Path** is an academic-grade, open-access educational platform engineered for university scholars, competitive examination aspirants (JEE, NEET, GATE), and self-directed lifelong learners. 

Rather than confining students to commercial paywalls or static, uncurated video dumps, Pencill autonomously converts any learning objective into a rigorous, pedagogically sequenced academic curriculum. It discovers, scores, and sequences verified open-access materials from the world's finest educators, supplements every lesson with on-demand LaTeX-rendered study monographs, tracks long-term retention using spaced repetition, and conducts authoritative diagnostic checkpoint assessments.

### Core Philosophy & Tenets

1. **Pedagogical Integrity First**: Module scope is determined strictly by the inherent cognitive complexity of the subject matter, not an arbitrary hardcoded count.
2. **Zero Fabricated Resources**: All video lessons resolve to verified academic institutions and educators (e.g., MIT OpenCourseWare, 3Blue1Brown, Khan Academy, Physics Wallah, CS Dojo, NPTEL).
3. **Hermetic Multi-Tenant Security**: Every database row is governed by PostgreSQL Row Level Security (RLS). Zero service-role keys are exposed to the client.
4. **Authoritative Server Grading**: Quiz answer keys are redacted before delivery to the browser to prevent client-side answer key inspection.
5. **Dual-Persistence Reliability**: Blends PostgreSQL persistence with an offline-first client cache and tombstone deletion registries to eliminate ghost data resurrections.

---

## Key Features

### 🎓 1. Interactive 3-Step Course Builder
- **Goal Definition**: Define topics, target proficiency (Beginner, Intermediate, Advanced), and pacing.
- **Pedagogical Personalization**: Specify learning preferences (theory-heavy, practical coding, exam prep) and prerequisite backgrounds.
- **Live Curriculum Review**: Review and interactively customize synthesized modules and lessons prior to enrolling.

### 🧠 2. Adaptive Curriculum Intelligence
- **Cognitive Scope Analysis**: Dynamically determines module breadth—broad fields (e.g., Computer Science, Organic Chemistry) expand into 4–6 comprehensive modules, while narrow topics (e.g., Binary Search Trees) remain cohesive and focused.
- **Pedagogical Progression**: Automatically sequences modules from *Foundations & Prerequisites* to *Core Concepts*, *Practical Applications*, and *Advanced Checkpoints*.
- **Resilient Fallback Engine**: If AI API quotas are exceeded, the deterministic adaptive curriculum engine activates instantaneously, maintaining 100% platform availability.

### 🎥 3. Verified Academic Video Discovery & Deduplication
- **Master Educator Directory**: Curated academic channels indexed from `docs/MASTER_YOUTUBE_EDUCATOR_DIRECTORY.md`.
- **Playlist-Aware Deduplication**: Identifies multi-part lecture series, groups related videos, and eliminates duplicate content across modules.
- **Syllabus Coverage Engine**: Computes syllabus coverage percentages and flags prerequisites or conceptual gaps.

### 📖 4. On-Demand Academic Reading Monographs
- **Chapter-Structured Notes**: Generates complete, book-quality monographs with rigorous academic prose.
- **LaTeX Mathematical Typesetting**: Beautiful inline and block math formatting powered by KaTeX.
- **Practical Artifacts**: Code snippets, key theorem callouts, real-world applications, and reference citations.
- **Full In-Place Editing**: Learners can modify, supplement, or regenerate monograph content directly within the course workspace.

### ✏️ 5. In-Place Course Customization & Module Repair
- **Syllabus Reorganization**: Add custom web resources or supplementary videos to any module.
- **Targeted Module Regeneration**: Regenerate specific modules without altering or resetting other enrolled course materials.
- **Diagnostic Module Repair**: Scan for missing resources or broken links and automatically repair them with fresh academic alternatives.

### 🧪 6. Authoritative Diagnostic Quiz Engine
- **Algorithmic Checkpoints**: Quizzes generated with rigorous distractor rationale and step-by-step mathematical explanations.
- **Anti-Cheat Redaction**: Quiz answer keys are redacted on the server before transmitting payloads to the client.
- **Authoritative Grading**: Submissions are evaluated server-side (`/api/quizzes/submit`), computing objective mastery metrics and review summaries.

### 🔄 7. FSRS Spaced Repetition Review Queue
- Implements the modern **Free Spaced Repetition Scheduler (FSRS)** algorithm to schedule concept reviews at optimal intervals, preventing memory decay.

### 🌐 8. Interactive Knowledge Graph & Community Q&A
- **Knowledge Graph Visualizer**: Interactive network map illustrating topic dependencies, prerequisite chains, and concept clusters.
- **Academic Discussion Forums**: Dedicated Q&A boards per course with duplicate-vote prevention tied to authenticated user IDs.

### 🖥️ 9. 3-Pane Distraction-Free Study Workspace
- Synchronized video lecture player, lesson roadmap, and real-time AI study assistant in a clean, focused reading layout.

---

## System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                              CLIENT TIER                                │
│                                                                        │
│   Next.js 14 App Router  •  React 18  •  Tailwind CSS  •  KaTeX         │
│   ┌───────────────────────────┬─────────────────────────────────────┐  │
│   │   Interactive Builder     │   3-Pane Study Workspace            │  │
│   │   Course Syllabus Editor  │   FSRS Spaced Repetition Queue      │  │
│   │   Knowledge Graph View    │   Community Discussion Board        │  │
│   └───────────────────────────┴─────────────────────────────────────┘  │
│                                │                                        │
│                 REST / JSON API Requests (Zod Validated)                │
└────────────────────────────────┼───────────────────────────────────────┘
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS SERVER / API TIER                        │
│                                                                        │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │ Route Handlers (src/app/api/**)                                 │  │
│   │   • /api/courses/*    • /api/reading/*    • /api/quizzes/*      │  │
│   │   • /api/community/*  • /api/enrollments  • /api/ai/tutor       │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                │                                        │
│   ┌────────────────────────────┴────────────────────────────────────┐  │
│   │ Service & Orchestration Layer                                   │  │
│   │   • Curriculum Intelligence Engine (Objective & Prereq Analysis)│  │
│   │   • Resource Engine 4.0 (Discovery, Scoring & Deduplication)   │  │
│   │   • Dual-Persistence Engine (Supabase Sync + Deletion Registry) │  │
│   │   • Deterministic Fallback Curricula Engine                     │  │
│   └─────────────────────────────────────────────────────────────────┘  │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │                                 │
                   ▼                                 ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│          EXTERNAL SERVICES           │  │      PERSISTENCE TIER        │
│                                      │  │                              │
│  • Google Gemini API                 │  │  Supabase PostgreSQL         │
│    (Curriculum, Monographs, Quizzes) │  │  • Strict Row Level Security │
│  • YouTube Data API v3 (Optional)    │  │  • Foreign Key Cascades      │
│  • Master Educator Directory         │  │  • Offline Sync Tombstones   │
└──────────────────────────────────────┘  └──────────────────────────────┘
```

---

## Technology Stack

| Layer | Technologies | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | [Next.js 14](https://nextjs.org/) (App Router), [React 18](https://react.dev/) | Server Components, dynamic streaming, and client-side interactions |
| **Language** | [TypeScript 5.6](https://www.typescriptlang.org/) (Strict Mode) | Strict type contracts across client, server, and test suites |
| **Styling & Icons** | [Tailwind CSS 3.4](https://tailwindcss.com/), `clsx`, `tailwind-merge` | Responsive design system from 320px mobile to 4K displays |
| **Database & Auth** | [Supabase](https://supabase.com/) (`@supabase/supabase-js` 2.116) | PostgreSQL database with RLS policies, Auth, and session state |
| **AI / LLM Integration** | [Google Gemini API](https://ai.google.dev/) (`gemini-3.5-flash-lite`, `gemini-2.5-flash`) | Curriculum structuring, LaTeX monographs, diagnostic quiz authoring |
| **Validation** | [Zod 4.6](https://zod.dev/) | Runtime validation for API payloads, query params, and environment variables |
| **Math Typesetting** | KaTeX | High-performance LaTeX formula rendering in reading notes and quizzes |
| **Test Framework** | Node.js Native Test Runner (`node:test`, `node:assert`, `tsx`) | 88 test suites verifying algorithms, RLS policies, and API contracts |

---

## Project Directory Structure

```
pencill/
├── .agents/                      # 101-skill autonomous engineering registry & rules
├── docs/                         # Comprehensive engineering documentation
│   ├── architecture/             # System diagrams, standards, TDRs, security audits
│   ├── interview/                # Architecture defense drills and technical flashcards
│   ├── learning/                 # First-principles learning guides
│   └── MASTER_YOUTUBE_EDUCATOR_DIRECTORY.md # Verified academic channel directory
├── public/                       # Static brand assets (icon, wordmark, avatars)
├── scripts/                      # Verification utilities and migration helpers
├── src/
│   ├── app/                      # Next.js App Router routes
│   │   ├── (auth)/               # Login, Signup, and OAuth authentication flows
│   │   ├── (dashboard)/          # Dashboard, new-goal builder, courses, practice, review
│   │   ├── (learning)/           # 3-pane active study workspace & reading monograph reader
│   │   ├── (marketing)/          # Responsive landing and marketing presentation
│   │   └── api/                  # 19 REST route handlers (courses, quizzes, reading, etc.)
│   ├── components/               # Atomic UI components, modals, cards, and layouts
│   ├── context/                  # React Context providers (AuthContext, SidebarContext)
│   ├── curator/                  # Multi-stage curriculum synthesis pipelines
│   ├── lib/
│   │   ├── curriculum-intelligence/ # Cognitive scope analyzer, grouping & planning
│   │   ├── resource-engine/      # Sourcing, scoring, deduplication, and persistence
│   │   ├── api-schemas.ts        # Centralized Zod request/response validation schemas
│   │   └── env.ts                # Validated environment configuration helper
│   ├── services/
│   │   ├── ai/                   # Gemini client integration and deterministic fallbacks
│   │   └── supabase/             # Typed Supabase database services (paths, quizzes, notes)
│   └── types/                    # Domain TypeScript interfaces and database schemas
├── supabase/
│   ├── migrations/               # 19 sequential PostgreSQL schema migrations
│   └── seed.sql                  # Seed datasets for Physics, Calculus, Python, and AI
└── tests/                        # 88 automated unit, integration, and regression test suites
```

---

## Getting Started

### Prerequisites

Ensure you have the following installed locally:
- **Node.js** >= 18.17.0 (Node 20+ recommended)
- **npm** >= 9.0.0
- A **Supabase** account and project ([supabase.com](https://supabase.com))
- A **Google AI Studio** Gemini API Key ([aistudio.google.com](https://aistudio.google.com/))

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/abhinavkothawade08-beep/Pencill.git
   cd Pencill
   ```

2. **Install project dependencies**:
   ```bash
   npm install
   ```

### Environment Configuration

Copy the template configuration file:
```bash
cp .env.example .env.local
```

Open `.env.local` and configure your credentials:

```ini
# Supabase Configuration (Client & Server)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Gemini AI (Server-Side Only - Never prefix with NEXT_PUBLIC_)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Dedicated Reading Engine Key & Model
# GEMINI_READING_API_KEY=your_gemini_reading_api_key_here
# GEMINI_READING_MODEL=gemini-3.5-flash-lite

# Optional: Dedicated Curriculum Engine Model
# GEMINI_CURRICULUM_MODEL=gemini-3.5-flash-lite

# Optional: Real-time YouTube Data API v3 verification
# YOUTUBE_API_KEY=your_youtube_api_key_here
```

### Supabase Setup & Migrations

Pencill uses PostgreSQL migrations with Row Level Security. To set up your database schema:

#### Option A: Using the Supabase CLI (Recommended)
```bash
# Link to your Supabase project
npx supabase login
npx supabase link --project-ref your-project-ref

# Push all migrations in sequential order
npx supabase db push
```

#### Option B: Manual Execution via Supabase Dashboard
Execute the SQL migration files located in `supabase/migrations/` sequentially in your Supabase SQL Editor:
1. `20260921000000_pencill_core_schema.sql` (Core learning paths and lessons schema)
2. `20260927000000_enable_author_content_rls.sql` (Author RLS policies)
3. `20261004000000_course_deletion_and_cascade.sql` (Cascade delete functions)
4. ... through `20261103000000_editable_courses_rls.sql` (Course customization permissions)

*(Optional: apply `supabase/seed.sql` to populate curated academic pathways for Physics, Calculus, Python, and Machine Learning).*

### Running Locally

Start the local Next.js development server:
```bash
npm run dev
```

Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables Reference

| Variable | Location | Required | Description |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Client & Server | **Yes** | Your Supabase project REST API endpoint URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client & Server | **Yes** | Public anonymous client API key with RLS enforcement |
| `GEMINI_API_KEY` | Server Only | **Yes** | Primary Google Gemini API key for curriculum synthesis and quizzes |
| `GEMINI_READING_API_KEY` | Server Only | *Optional* | Dedicated key for generating study monographs (falls back to `GEMINI_API_KEY`) |
| `GEMINI_READING_MODEL` | Server Only | *Optional* | Gemini model for reading monographs (defaults to `gemini-3.5-flash-lite`) |
| `GEMINI_CURRICULUM_MODEL` | Server Only | *Optional* | Gemini model for curriculum planning (defaults to `gemini-3.5-flash-lite`) |
| `YOUTUBE_API_KEY` | Server Only | *Optional* | YouTube Data API v3 key for real-time video metadata verification |

> [!IMPORTANT]
> Never prefix `GEMINI_API_KEY` or other server secrets with `NEXT_PUBLIC_`. All secret keys are strictly validated and quarantined to server-side route handlers.

---

## API Route Reference

All route handlers validate incoming payloads with strict Zod schemas (`src/lib/api-schemas.ts`) and return standardized error envelopes.

| Endpoint | Method | Purpose | Authentication |
| :--- | :--- | :--- | :--- |
| `/api/courses/generate` | `POST` | Synthesizes an academic curriculum and discovers verified resources | Public / Optional |
| `/api/courses/[id]` | `GET` | Retrieves full course blueprint, modules, lessons, and progress | Public / Optional |
| `/api/courses/[id]` | `PUT` | Updates course metadata, customizations, and module arrangements | Authenticated Owner |
| `/api/courses/[id]` | `DELETE` | Executes cascade deletion of a course, modules, and notes | Authenticated Owner |
| `/api/courses/[id]/regenerate-module` | `POST` | Re-synthesizes an individual module without affecting the course | Authenticated Owner |
| `/api/courses/[id]/repair-module` | `POST` | Scans and repairs missing or damaged resources in a module | Authenticated Owner |
| `/api/courses/batch-delete` | `POST` | Bulk cascade deletion of selected courses | Authenticated Owner |
| `/api/reading/generate` | `POST` | Generates a comprehensive LaTeX study monograph for a lesson | Optional |
| `/api/reading/lesson/[lessonId]` | `GET` | Retrieves saved study notes or reading monographs for a lesson | Optional |
| `/api/reading/save` | `POST` | Persists or updates edited study monographs in PostgreSQL | Optional |
| `/api/reading/[documentId]` | `GET`, `PUT` | Retrieves or updates an existing monograph document | Optional |
| `/api/reading/[documentId]/regenerate` | `POST` | Re-generates a monograph with enhanced depth or modified prompts | Optional |
| `/api/quizzes/generate` | `POST` | Synthesizes diagnostic checkpoint quizzes with LaTeX formulas | Optional |
| `/api/quizzes/[id]` | `GET` | Fetches quiz details with correct answer keys redacted | Optional |
| `/api/quizzes/attempt` | `POST` | Initializes a new quiz attempt session | Optional |
| `/api/quizzes/submit` | `POST` | Authoritatively scores student answers and records mastery | Optional |
| `/api/quizzes/batch-delete` | `POST` | Cleans up historical quiz attempts for a user | Authenticated Owner |
| `/api/community` | `GET`, `POST` | Retrieves or creates peer discussion questions and answers | Optional / Auth |
| `/api/enrollments` | `GET`, `POST` | Manages course enrollments and synchronizes progress state | Authenticated User |
| `/api/ai/tutor` | `POST` | Multi-turn contextual AI tutor assisting with lesson material | Optional |
| `/api/ai/test` | `GET` | Diagnostic health check for Gemini API connectivity | Diagnostic |

---

## Testing & Verification

Pencill enforces an automated three-tier quality verification gate. Every change must pass type checking, linting, and automated tests.

```bash
# 1. TypeScript Strict Typecheck (0 errors required)
npm run typecheck

# 2. Next.js ESLint Code Quality (0 warnings, 0 errors required)
npm run lint

# 3. Automated Test Suite (100% pass rate required)
npm test

# Run all verification checks in a single command
npm run verify
```

### Test Suite Coverage

The test suite covers **88 test suites** and **412 tests** across critical domains:
- **Curriculum Optimization & Module Sizing**: Verifies topic complexity analysis, dynamic module count decisions, and prerequisite ordering.
- **Playlist-Aware Deduplication**: Tests multi-video playlist grouping and duplicate removal algorithms.
- **Resource Sourcing & Scoring**: Tests educator intelligence, domain authority weighting, and duration filters.
- **FSRS Spaced Repetition**: Tests memory retention interval calculations and rating schedules.
- **Multi-Tenant Data Isolation**: Proves that RLS policies prevent cross-user data leakage.
- **Course Customization & Dual Persistence**: Validates tombstone registry synchronization and cascade deletions.

---

## Deployment

### Deploying to Vercel (Recommended)

1. **Push your repository to GitHub**.
2. **Import the repository into Vercel**.
3. **Configure Environment Variables** in the Vercel Project Settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
   - *(Optional: `GEMINI_READING_API_KEY`, `YOUTUBE_API_KEY`)*
4. **Deploy**: Vercel automatically detects Next.js 14 and optimizes production builds.

### Production Build & Preview
```bash
# Compile production bundle
npm run build

# Start local production server
npm run start
```

*For Docker, Google Cloud Run, and alternative production setups, see [docs/architecture/DEPLOYMENT_INSTRUCTIONS.md](docs/architecture/DEPLOYMENT_INSTRUCTIONS.md).*

---

## Security & Architectural Guardrails

- **Row Level Security (RLS)**: Enforced on all PostgreSQL tables. Learner progress, notes, bookmarks, and quiz attempts are tied to `auth.uid() = user_id`.
- **Zero Service-Role Key Exposure**: Service role keys are never referenced in client code. Only `NEXT_PUBLIC_SUPABASE_ANON_KEY` is shipped to the browser.
- **Answer Key Redaction**: Diagnostic quiz answer keys and distractor logic are stripped on the server before client delivery; submissions are evaluated authoritatively on the server to prevent inspection.
- **Zod Schema Validation**: All incoming requests to route handlers are strictly parsed and validated against typed schemas, mitigating injection hazards.
- **Tombstone Deletion Registry**: Ensures deleted courses and notes are recorded in an authoritative deletion register so background synchronizations never resurrect deleted items.

---

## Known Limitations & Fallbacks

- **Gemini Free-Tier Rate Limits**: High-frequency curriculum requests may encounter rate limits (HTTP 429). The system includes a deterministic fallback curriculum engine that immediately steps in with pre-verified academic pathways.
- **YouTube API Quotas**: If a YouTube Data API v3 key is omitted or reaches its daily quota, Pencill seamlessly switches to its pre-indexed `MASTER_YOUTUBE_EDUCATOR_DIRECTORY.md` and curated video database, ensuring zero downtime.

---

## Documentation Index

Explore the comprehensive documentation suite located in [`docs/`](docs/):

- **[System Architecture](docs/architecture/SYSTEM_ARCHITECTURE.md)**: Deep dive into architectural layers, sequence diagrams, and lifecycle models.
- **[Engineering Standards](docs/architecture/ENGINEERING_STANDARDS.md)**: Strict coding standards, 4-state UI rules, and TypeScript best practices.
- **[Deployment Instructions](docs/architecture/DEPLOYMENT_INSTRUCTIONS.md)**: Production deployment, database seeding, and operational runbooks.
- **[Technical Decision Records (TDRs)](docs/architecture/TECHNICAL_DECISION_RECORDS.md)**: Documented architectural choices and trade-offs.
- **[API Reference](docs/architecture/API_REFERENCE.md)**: Granular schemas, request/response envelopes, and status codes.
- **[Master Educator Directory](docs/MASTER_YOUTUBE_EDUCATOR_DIRECTORY.md)**: Curated list of verified academic channels and instructors.
- **[First-Principles Guide](docs/learning/PROJECT_FROM_ZERO.md)**: Explains the entire platform from zero for new developers.

---

## Contributing

Contributions are welcome from educators, software engineers, and researchers!

1. **Fork the repository** and create your branch (`git checkout -b feature/amazing-feature`).
2. **Follow Engineering Standards** codified in [`AGENTS.md`](AGENTS.md) and [`docs/architecture/ENGINEERING_STANDARDS.md`](docs/architecture/ENGINEERING_STANDARDS.md).
3. **Execute the Verification Gate**: Ensure `npm run verify` passes with 0 errors and 0 warnings.
4. **Commit with Conventional Commits** (`git commit -m 'feat: add interactive formula scratchpad'`).
5. **Push to your fork** and submit a **Pull Request**.

---

## License

This project is open-source and licensed under the **[Apache License 2.0](LICENSE)**.

```
Copyright 2026 Pencill Contributors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
```

---

<p align="center">
  <b>Pencill — Find Your Path</b><br/>
  <i>Democratizing rigorous academic mastery through autonomous AI curriculum engineering.</i>
</p>
