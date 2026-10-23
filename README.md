# Pencill - AI-Powered Academic Learning Pathways

> **Pencill** turns your academic goals into structured, rigorous learning pathways by discovering, validating, and sequencing high-quality free educational resources from across the open web.

---

## Overview

Pencill is built for university students, competitive exam scholars (JEE, NEET), and self-directed learners. Rather than relying on static or commercial walled gardens, Pencill combines:
- **Google Gemini Generative AI** (`gemini-3.8-flash`) for curriculum synthesis, module blueprints, and LaTeX-annotated diagnostic checkpoint authoring.
- **Native Resource Discovery Engine** for querying Google Search and YouTube Data API v3, scoring authority domains (e.g. MIT OCW, NPTEL, arXiv), deduplicating URLs, and ranking materials pedagogically.
- **Supabase PostgreSQL & Row Level Security (RLS)** for authenticated learner progress tracking, study notes, formula bookmarking, and offline-first guest session data migration.

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5 (Strict Mode)
- **Styling**: Tailwind CSS & Material Symbols Outlined
- **Database & Auth**: Supabase (`@supabase/supabase-js`) PostgreSQL with RLS
- **AI & LLM**: Google Gemini Generative Language API
- **Testing**: Node.js Native Test Runner (`node:test`, `node:assert`, `tsx`)

---

## Project Structure

```
├── public/                 # Static assets, branding wordmark & user avatars
├── scripts/                # Verification and integration smoke tests
├── src/
│   ├── app/                # Next.js App Router pages, layouts, and API routes
│   │   ├── (auth)/         # Login, signup, OAuth callback
│   │   ├── (dashboard)/    # Dashboard, explore, my courses, practice, progress, bookmarks
│   │   ├── (learning)/     # 3-pane active study workspace & lecture reader
│   │   └── api/            # Server-side API endpoints (courses, quizzes, discovery)
│   ├── components/         # Reusable UI components, layout shell, guards, modals
│   ├── context/            # React Context providers (AuthContext)
│   ├── lib/
│   │   ├── env.ts          # Zod-validated environment configuration
│   │   └── resource-engine/# Multi-source discovery, validation, and ranking pipeline
│   ├── services/
│   │   ├── ai/             # Gemini API client, system instructions, and parsers
│   │   └── supabase/       # Typed database service layer (paths, lessons, notes, quizzes)
│   └── types/              # Domain TypeScript interfaces and types
├── supabase/               # PostgreSQL schema migrations and seed datasets
└── tests/                  # Automated test suites
```

---

## Getting Started

### 1. Prerequisites
- **Node.js** >= 18.17.0
- **npm** >= 9.0.0
- A [Supabase](https://supabase.com) project (or local development instance)
- A [Google AI Studio](https://aistudio.google.com) API key for Gemini

### 2. Environment Setup
Copy the template configuration file:
```bash
cp .env.example .env.local
```

Fill in the required keys in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Server-Side Only
GEMINI_API_KEY=your-gemini-api-key
GOOGLE_SEARCH_API_KEY=your-google-search-api-key
GOOGLE_SEARCH_ENGINE_ID=your-google-search-engine-id
YOUTUBE_API_KEY=your-youtube-api-key
```

### 3. Install Dependencies & Seed Database
```bash
npm install
```

To initialize your Supabase database schema, apply the SQL files in `supabase/migrations/`:
1. `20260921000000_pencill_core_schema.sql`
2. `20260927000000_enable_author_content_rls.sql`
3. `20261004000000_course_deletion_and_cascade.sql`
4. `supabase/seed.sql` (Curated syllabi for Physics, Calculus, Python, and AI)

### 4. Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## Available Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts local Next.js development server with hot reload |
| `npm run build` | Compiles an optimized production build and checks bundle sizes |
| `npm run start` | Starts the production server |
| `npm test` | Runs the automated Node.js test suite with `tsx` |
| `npm run lint` | Runs Next.js ESLint code quality checks |

---

## Security & Architecture Principles

- **System Catalog Protection**: Official catalog pathways (`author_user_id IS NULL`) are system-curated and can strictly only be deleted or archived by administrators. Learners have ownership and deletion privileges solely over pathways they personally synthesized.
- **Batch Processing**: Pathway generation and guest session migrations execute bulk array operations against Supabase to avoid N+1 network request waterfalls.
- **Privacy & Guest Mode**: Visitors can explore curricula, take practice quizzes, and take notes offline. All guest progress, quiz attempts, and notes automatically sync upon authentication.
