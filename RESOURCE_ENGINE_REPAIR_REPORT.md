# PENCILL RESOURCE ENGINE — REPAIR & QUALITY OPTIMIZATION REPORT

**Document Type:** Principal Engineering Architecture & Verification Report  
**Target System:** Pencill Resource Discovery & Curriculum Curation Pipeline  
**Status:** Complete & Fully Verified  
**Date:** October 27, 2026  
**Audience:** Technical Leadership, Systems Architecture, Engineering  

---

## 1. EXECUTIVE SUMMARY

The Pencill Universal Learning Path Builder and Resource Discovery Engine have undergone a comprehensive root-cause audit, architectural repair, and end-to-end quality optimization. 

Prior to this repair, users requesting learning paths for computer science topics such as **"Python Loops & Iteration"** or higher mathematics topics such as **"Differential Equations"** were presented with irrelevant physics textbooks (*Class 11 NCERT Physics*), mechanical engineering treatises (*Classical Mechanics*), and cross-domain telecommunications papers (*Satellite Routing and Timoshenko Beams*). Furthermore, the 117-channel **Master YouTube Educator Directory** was completely disconnected from the active runtime, diagnostic quizzes presented hardcoded kinematics questions regardless of subject, and generated courses failed to persist into the course player.

### Core Achievements

1. **Eliminated the Shadow Pipeline & Established One Authoritative Discovery Architecture:**  
   Retired the static mock-slicing bypass in `src/curator/stage4-resource-discovery.ts` and `stage5-quality-audit.ts`. All resource discovery, relevance gating, educator matching, deduplication, and quality auditing are now orchestrated directly through **`ResourceEngineV2`**, which feeds verified, module-specific resources into the Curator 7-stage state machine.
2. **Deterministic Objective-Level Relevance Gating & Cross-Domain Collision Protection:**  
   Implemented semantic concept token gates and anti-collision rules in `relevance-scorer.ts` and `ranking-engine.ts`. Programming queries (`loop`, `iteration`, `while`, `for`) strictly reject telecommunications ("closed-loop routing"), control systems, and mechanical beam vibrations. Academic papers and monographs are gated by cognitive appropriateness (`isModalityAppropriateForObjective`), ensuring introductory programming courses receive code-first interactive tutorials and official documentation rather than theoretical research papers.
3. **Master YouTube Educator Directory Reconnected & Grounded:**  
   Unified `MasterDataset` with verified video/playlist destination URLs for major global educators (CS50, freeCodeCamp, Programming with Mosh, Abdul Bari, NeetCode, Traversy Media, Fireship) while preserving verified catalog constraints. Synthetic educator generation was restricted strictly to targeted queries to prevent educator bias from polluting general subject searches.
4. **Registered `AcademicRepositoryAdapter` in Provider Registry:**  
   Created and registered `AcademicRepositoryAdapter` as `academic_notes` in `ProviderRegistry`, bringing together NCERT textbooks, NPTEL, Khan Academy, MIT OpenCourseWare, OpenStax, SWAYAM, and official programming documentation (Python 3.12 docs, React.dev, MDN, Pro Git, PostgreSQL).
5. **Topic-Adaptive Diagnostic Checkpoints & Spaced Flashcards:**  
   Upgraded `stage6-checkpoints-flashcards.ts` to synthesize domain-grounded diagnostic checkpoint questions and flashcards. Python courses now generate questions testing loop invariants, `break`/`continue` semantics, and generator performance, while Calculus courses generate questions on separable differential equations, integrating factors, and Euler's method. Past Year Questions (PYQs) honestly report provenance and flag missing archives instead of hallucinating exam questions.
6. **Universal Persistence & Instant Course Player Retrieval:**  
   Synchronized field mapping across `CuratorResource`, `DistributedResourceItem`, and `UniversalLessonSchema` in `stage7-assembly-persistence.ts`. Freshly generated learning paths are persisted synchronously to IndexedDB via `storageAdapter` and registered into the in-memory cache of `pathService.ts`, enabling instant zero-latency loading in the `/learn/[courseId]/[lessonId]` course player.
7. **Verification Metrics:**  
   - **TypeScript (`npx tsc --noEmit`):** 0 errors.
   - **Automated Regression Suite (`npm test`):** **504 / 504 passed** across 147 test suites (0 failures, 0 skipped).
   - **Production Next.js Build (`npm run build`):** Compiled successfully, all 25 static and dynamic routes validated.

---

## 2. COMPLETE CALL GRAPH OF THE REPAIRED PIPELINE

```
User Click: "Build My Learning Path" (/new-goal)
  │
  ▼
triggerSynthesis(config: BuilderConfig)
  │
  ▼
CuratorEngine.run(config) [src/curator/curator-engine.ts]
  │
  ├── Stage 1: runStage1Resolution(config)
  │     └─ Resolves subject taxonomy, cognitive depth, and exam alignment parameters
  │
  ├── Stage 2: runStage2Prerequisites(config, res1)
  │     └─ Identifies foundational prerequisites and conceptual order
  │
  ├── Stage 3: runStage3Synthesis(config, res2) [stage3-curriculum-synthesis.ts]
  │     └─ Topic-Adaptive Curriculum Synthesis: produces 3 to 5 cohesive CuratorModules
  │        with explicit, non-generic learning objectives and concept tokens
  │
  ├── Stage 4: runStage4Discovery(config, res3) [stage4-resource-discovery.ts]
  │     │
  │     ▼
  │   ResourceEngineV2.discover(discoveryInput) [src/lib/resource-engine-v2/orchestrator.ts]
  │     ├── Objective Planning: SearchPlanner & QueryGenerator (builds module-specific typed queries)
  │     ├── Provider Selection: ProviderRegistry (YouTube, AcademicRepository, CuratedDirectory)
  │     │     ├── YouTubeProvider (API v3 with 60s quota circuit-breaker & token matching)
  │     │     ├── AcademicRepositoryAdapter (NCERT, NPTEL, Khan, MIT OCW, OpenStax, Python/React Docs)
  │     │     └── CuratedDirectoryAdapter (Master YouTube Educator Directory with 117 verified channels)
  │     ├── Candidate Normalization & Deduplication: canonical URL, video ID, channel ID hashing
  │     ├── Multi-Stage Quality & Relevance Scoring:
  │     │     ├── RelevanceScorer (Token coverage, anti-collision matrix, domain match)
  │     │     ├── QualityScoringEngine (Pedagogical clarity, structure, vintage, captions, engagement)
  │     │     └── ModalityAppropriatenessGate (Matches modality to depth & topic)
  │     └── Module Distribution: ModuleDistributor (Assigns top candidates per module objective)
  │
  ├── Stage 5: runStage5QualityAudit(config, res3, res4) [stage5-quality-audit.ts]
  │     └─ Enforces strict per-module score thresholds (≥60 for advanced, ≥50 standard),
  │        verifies captions/transcripts, assigns verified vs provisional status
  │
  ├── Stage 6: runStage6Checkpoints(config, res3, res5) [stage6-checkpoints-flashcards.ts]
  │     └─ Generates topic-grounded diagnostic questions, spaced repetition flashcards,
  │        and honest PYQ availability markers
  │
  └── Stage 7: runStage7AssemblyAndPersistence(config, res3, res5, res6) [stage7-assembly-persistence.ts]
        ├── Assembles canonical LearningPath matching UniversalLessonSchema
        ├── Synchronous Persistence to IndexedDB via storageAdapter
        ├── Synchronous Cache Update in inMemoryPathCache (src/services/supabase/pathService.ts)
        └── Returns validated LearningPath to UI
              │
              ▼
Router Navigation: /learn/[courseId]/[firstLessonId]
  └─ Course Player loads lesson without network latency, displaying verified video/reading embed
```

---

## 3. BEFORE AND AFTER COMPARISON FOR REPRESENTATIVE SCENARIOS

| Scenario / Topic | Before Repair (Observed Failure) | After Repair (Verified Behavior) |
| :--- | :--- | :--- |
| **Python Loops & Iteration**<br>*(Computer Science / Programming)* | Recommended NCERT Class 11 Physics textbook and Classical Mechanics videos due to static bypass and array slicing. Telecommunications papers on "closed loop routing" passed relevance filters. | Recommends official Python 3.12 Tutorial on Control Flow & Iteration, FreeCodeCamp Python for Beginners (Loop chapters), and Corey Schafer Python Loops tutorials. Zero physics or telecommunication collisions. |
| **Differential Equations**<br>*(Higher Mathematics / Calculus)* | Sliced random physics videos; diagnostic checkpoints asked questions about Newton's Second Law ($\Sigma F = dp/dt$); flashcards tested kinematics velocity equations. | Recommends MIT OCW 18.03 Differential Equations (Prof. Arthur Mattuck), 3Blue1Brown Essence of Calculus, and OpenStax Calculus Vol 3. Checkpoints evaluate separable ODEs and integrating factors. |
| **Class 11 Rotational Dynamics**<br>*(School Physics / CBSE / JEE)* | Discovered unverified random YouTube clips with missing channel metadata; no structured NCERT textbook alignment. | Discovers official NCERT Class 11 Physics Part 1 (Chapter 7: Systems of Particles & Rotational Motion) via `AcademicRepositoryAdapter`, paired with verified Khan Academy India & NPTEL video lectures. |
| **Advanced PEFT / LoRA Fine-Tuning**<br>*(AI / Deep Learning)* | Rejected research papers because modality gating blindly demanded video lectures; educator matching failed due to missing channels. | Permits foundational ArXiv PEFT/LoRA monographs for advanced cognitive level while pairing with Hugging Face & Umar Jamil deep-dive walkthroughs. |

---

## 4. ROOT CAUSES CONFIRMED & REPAIRED

### Defect 1: Stage 4 Static Curated Index Bypass
- **Location:** `src/curator/stage4-resource-discovery.ts`
- **Root Cause:** Line 40 had `const repoIndex = CURATED_REPOSITORY_INDEX;` and iterated over a hardcoded 19-element physics array, completely ignoring `ResourceEngineV2` and the user's selected topic.
- **Repair:** Completely replaced the bypass with direct invocation of `ResourceEngineV2.discover()`, passing structured `ModuleDiscoveryInput[]` with each module's title, learning objectives, and domain context.

### Defect 2: Master YouTube Educator Directory Array-of-Arrays Deserialization Failure
- **Location:** `src/curator/stage4-resource-discovery.ts` (line 120) & `data/master-youtube-educator-directory.json`
- **Root Cause:** The code attempted `for (const ed of (masterDirectory as any).candidates)`, but in the JSON file `.candidates` was an array of string tuples (`[id, name, channelId, ...]`) rather than objects, and lacked video URLs. As a result, 0 educator directory resources were discovered.
- **Repair:** Replaced direct file parsing with `CuratedDirectoryAdapter` and `EducatorRegistry`, which properly normalizes directory records, resolves channel IDs, and maps verified video/playlist URLs.

### Defect 3: Naive Array Slicing Detached Resources from Module Objectives
- **Location:** `src/curator/stage5-quality-audit.ts` (lines 72-95)
- **Root Cause:** `candidatesForModule = videos.slice(mIdx * maxVideos, (mIdx + 1) * maxVideos)`. Candidates were partitioned strictly by array indices rather than topic relevance or module objective matching. Module 2 would receive whatever random videos happened to sit at indices 2 and 3 of the pool.
- **Repair:** Stage 5 now inspects `discovery.distributedModules`, ensuring candidates assigned to Module $K$ were scored and selected by `ModuleDistributor` specifically for Module $K$'s learning objectives.

### Defect 4: Field Desynchronization Between Curator and Universal Lesson Contracts
- **Location:** `src/curator/stage7-assembly-persistence.ts`
- **Root Cause:** Properties `type: (r as any).type` and `sourceName: (r as any).sourceName` were `undefined` on `CuratorResource`, causing persisted lessons to render with blank sources and unplayable types.
- **Repair:** Synchronized contract mappings to extract `source: r.source || r.sourceName`, `type: r.modality === 'video' ? 'video' : r.modality === 'practice' ? 'practice' : 'monograph'`, `qualityEvidence: { score: r.qualityScore, verified: r.status === 'verified' }`.

### Defect 5: Subject-Blind Diagnostic Checkpoints & Hardcoded Physics Questions
- **Location:** `src/curator/stage6-checkpoints-flashcards.ts`
- **Root Cause:** Questions like *"What is the SI unit of force?"* and *"State Newton's second law"* were hardcoded as universal fallbacks. Python and Calculus learners were asked physics trivia.
- **Repair:** Grounded checkpoint question and flashcard generation in the module's actual learning objectives, concepts, and domain. Added domain-aware generators for Computer Science, Mathematics, and Physical Sciences.

### Defect 6: Missing `AcademicRepositoryAdapter` in Provider Registry
- **Location:** `src/lib/resource-engine-v2/providers/index.ts` & `provider-registry.ts`
- **Root Cause:** `AcademicNotesProvider` existed in isolation but was never registered in the `ProviderRegistry`. The active engine could not retrieve official documentation or open textbooks.
- **Repair:** Created and registered `AcademicRepositoryAdapter` as `academic_notes` in `ProviderRegistry`, exposing NCERT, NPTEL, Khan Academy, MIT OCW, OpenStax, SWAYAM, and official programming language documentation.

### Defect 7: Inadequate Modality Gating During Ranking Phase
- **Location:** `src/lib/resource-engine-v2/evaluation/ranking-engine.ts`
- **Root Cause:** `isModalityAppropriateForObjective` was only checked during post-ranking diversity slotting, allowing research papers to score high relevance for beginner programming topics.
- **Repair:** Integrated `isModalityAppropriateForObjective` into the initial candidate eligibility gate. Introductory topics reject theoretical research papers, while advanced research topics welcome them.

### Defect 8: Cross-Domain Concept Token Collisions
- **Location:** `src/lib/resource-engine-v2/evaluation/relevance-scorer.ts`
- **Root Cause:** The word "loop" in "Python loops" matched "closed-loop control systems" and "satellite routing loops" in telecommunication datasets.
- **Repair:** Added anti-collision rules in `relevance-scorer.ts` (`programming_loop_vs_telecom_control_theory`) that penalize non-computing candidates matching common stem overlaps.

---

## 5. EDUCATOR DIRECTORY COVERAGE & VERIFICATION INTEGRITY

1. **Verified Channel Matching:**  
   The system queries `EducatorRegistry` using domain, subject, and subtopic taxonomy. Matches are validated against canonical YouTube channel IDs (`UC...`) and educator identifiers (`PEN-ED-0001` through `PEN-ED-0117`).
2. **Provenance & No Unearned Trust:**  
   Directory approval grants a trust multiplier (+10 to +15 points on the 100-point quality scale) but **does not bypass topical relevance**. If a verified educator's video has low conceptual overlap (<50 relevance) with the module objective, it is gated out.
3. **Canonical Destination URLs Only:**  
   All verified directory resources are guaranteed to point to playable destination URLs (`https://www.youtube.com/watch?v=...` or `https://www.youtube.com/playlist?list=...`). Channel homepages (`/user/...`, `/@channel`) are strictly rejected.

---

## 6. PROVIDER RESILIENCE & QUOTA CIRCUIT BREAKERS

| Provider Adapter | Primary Role | Failure Mode Handling | Circuit Breaker Policy |
| :--- | :--- | :--- | :--- |
| **YouTubeProvider** | Dynamic video search & metadata | If quota exhausted (429/quotaExceeded) or unconfigured API key: trips circuit breaker to `OPEN`. | 60-second cooldown period. Falls back gracefully to `CuratedDirectoryAdapter` and verified catalog. |
| **CuratedDirectoryAdapter** | Master Educator Directory lookup | If channel has no video matching module: returns empty list cleanly without throwing or fabricating. | Standalone local dataset; 100% offline availability. |
| **AcademicRepositoryAdapter** | Textbooks & official documentation | Filtered by configured repositories (`NCERT`, `NPTEL`, `MIT OCW`, `OpenStax`, `Khan Academy`). Concept token gate enforces relevance. | Standalone verified index; 100% offline availability. |
| **GoogleSearchProvider** | Web search enrichment | If API quota exceeded (429) or Project lacks Custom Search (403): logs warning and marks provider unhealthy. | 60-second cooldown period. No pipeline disruption. |

---

## 7. PERSISTENCE & COURSE PLAYER VERIFICATION

1. **Zero-Latency In-Memory Synchronization:**  
   When `CuratorEngine` finishes Stage 7, it calls `inMemoryPathCache.set(path.id, path)`. The course player at `/learn/[courseId]/[lessonId]` immediately retrieves the path from memory without needing an asynchronous network round-trip.
2. **IndexedDB Local Storage:**  
   Paths and bookmarks are saved to IndexedDB via `storageAdapter.savePath()`. Unauthenticated users and offline sessions retain their full synthesized pathways.
3. **Database Schema Conformance:**  
   `PersistenceMapper` validates each module lesson against `UniversalLessonSchema`, ensuring valid `durationMinutes`, `sourceName`, `canonicalUrl`, and `lessonType`.

---

## 8. TEST & VERIFICATION METRICS

### Test Suite Execution Summary

```
▶ Academic Content Ingestion & Verification Integrity (3 tests)
▶ Legacy Mock Course Exclusion & Data Cleanliness (2 tests)
▶ Gemini AI Provider & Client Error Handling (3 tests)
▶ Batch Deletion: Schema Validation & Security Guards (6 tests)
▶ Batch Deletion: Role Authorization & Scope Protection (4 tests)
▶ Batch Deletion: Client Service & Persistence Helpers (4 tests)
▶ Practice Page & Explore Page: Scoping and State Synchronization (4 tests)
▶ Catalog Syllabi and Modular Curriculum Integrity (2 tests)
▶ Comprehensive Course Generation & Video Sourcing Pipeline (5 tests)
▶ Universal Learning Path Builder - Form State Machine (23 tests)
▶ Universal Learning Path Builder - Pacing, Language & Modality (22 tests)
▶ Master YouTube Educator Directory Integration (37 tests)
▶ Global Video Deduplication & Module-Specific Sourcing Pipeline (6 tests)
▶ Video Pipeline: Quality Scoring, Relevance, Deduplication & Sequencing (10 tests)
▶ Video Sourcing & Quality Ranking System (10 tests)
▶ YouTube Provider: Topic Filtering & Quota Circuit Breakers (4 tests)
▶ Resource Engine Repair & Quality Optimization Verification Suite (12 tests)
  ✔ Python Loops: Discovers authentic Python resources & rejects cross-domain collisions
  ✔ Differential Equations: Discovers calculus resources & rejects coding tutorials
  ✔ Academic Level Gating: Rejects papers for introductory topics; permits them for advanced
  ✔ Master Educator Directory: Recommends verified CS50 / freeCodeCamp resources with channel IDs
  ✔ Preserves verified learning catalog invariants (12 canonical records)
  ✔ Rejects unverified channels claiming directory status
  ✔ Academic Repository Adapter: Discovers NCERT textbooks & official Python docs
  ✔ Respects user repository selection whitelist
  ✔ Curator Engine 7-Stage Pipeline runs end-to-end for Python loops without naive array slicing
  ✔ Module-specific diagnostic checkpoints and spaced flashcards
  ✔ Persists path and makes it instantly retrievable via getLearningPathById
  ✔ StorageAdapter reflects saved course and modules

ℹ tests 504
ℹ suites 147
ℹ pass 504
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 14572.5117
```

### TypeScript & Production Build Verification

- **`npx tsc --noEmit`**: Exited with code `0` (Zero compiler warnings or errors).
- **`npm run build`**: Exited with code `0`. All 25 application routes compiled and optimized for production.

---

## 9. KNOWN LIMITATIONS & RECOMMENDED FUTURE ENHANCEMENTS

1. **Dynamic YouTube Transcript Retrieval:**  
   Currently, closed caption and transcript availability flags are detected from API response snippets and verified catalog metadata. In an environment with an unrestricted YouTube Data API quota, implementing automated server-side subtitle download via official YouTube v3 caption endpoints will enable keyword-level transcript timestamp navigation.
2. **Expanded Regional Language Catalogs:**  
   While Hindi and regional Indian language support is present via Khan Academy India and SWAYAM, catalog depth in regional languages for advanced computer science topics can be augmented by indexing verified regional educators (e.g., CodeWithHarry, Telusko).
3. **Automated Quota Usage Telemetry:**  
   Adding an administrative dashboard widget showing real-time YouTube Data API v3 quota consumption and circuit breaker status will allow operations teams to monitor API health proactively.

---

**Report Certification:**  
*All defects identified in `RESOURCE_ENGINE_ROOT_CAUSE_REPORT.md` have been corrected, validated against the running application codebase, and verified with 504 passing automated tests and a production build.*
