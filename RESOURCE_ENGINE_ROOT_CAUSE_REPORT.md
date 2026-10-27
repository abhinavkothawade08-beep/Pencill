# PENCILL RESOURCE ENGINE — ROOT-CAUSE AUDIT & ARCHITECTURAL REPORT

**Audit Date:** 2026-10-27  
**Auditor:** Principal AI Search Engineer, Educational Recommendation Systems Architect, Software Reliability Engineer  
**System Under Audit:** Pencill Resource Discovery & Synthesis Engine (Curator Engine + Resource Engine 2.0)  
**Status:** COMPLETE AUDIT — ALL DEFECTS CONFIRMED AGAINST SOURCE CODE & RUNTIME

---

## EXECUTIVE SUMMARY

A root-cause investigation was conducted across the Pencill application to determine why the Resource Engine recently began recommending random, irrelevant, or poorly matched educational content (such as Class 11 Physics and Classical Mechanics videos for Python programming or Differential Equations courses).

The audit established that the defect is **not a scoring anomaly or subtle weight miscalibration**. Rather, the application currently suffers from an **architectural pipeline bifurcation**:

1. When a user clicks **"Build My Learning Path"** in the builder UI (`src/app/(dashboard)/new-goal/page.tsx`), the application instantiates and executes `CuratorEngine` (`src/curator/index.ts`).
2. `CuratorEngine` was designed as a 7-stage pipeline. However, its resource discovery stage (`src/curator/stage4-resource-discovery.ts`) and quality audit stage (`src/curator/stage5-quality-audit.ts`) **completely bypassed the authoritative Resource Engine 2.0** (`src/lib/resource-engine-v2/`).
3. Instead of executing the sophisticated query planning, provider retrieval, and objective-grounded ranking in Engine 2.0, `stage4-resource-discovery.ts` iterated over a static 19-item array (`CURATED_REPOSITORY_INDEX`), all of which were School Physics resources (NCERT Class 11 Physics and Classical Mechanics).
4. `stage4-resource-discovery.ts` also attempted to parse `(masterDirectory as any).candidates`, but in `data/master-youtube-educator-directory.json`, `.candidates` is an editorial exclusion list consisting of string arrays, causing `cand.url` to evaluate to `undefined` and yielding 0 candidates from the Master Educator Directory.
5. In `stage5-quality-audit.ts`, these 19 static physics items were awarded arbitrary default scores (80-90) and then **sliced by array index into the course modules** (`videos.slice(mIdx * maxVideos, (mIdx + 1) * maxVideos)`), completely disregarding module learning objectives.
6. In `stage7-assembly-persistence.ts`, property name mismatches corrupted the saved lessons (`type: r.type` instead of `r.modality`, `sourceName: r.sourceName` instead of `r.source`), causing further degradation in the course player.

---

## CALL GRAPH & EXECUTION TRACE

### Intended Architectural Flow
```
User Input (BuilderConfig)
  ↓
Stage 1: Domain & Syllabus Deconstruction
  ↓
Stage 2: Prerequisite Hierarchy Mapping
  ↓
Stage 3: Topic-Adaptive Curriculum Synthesis (Modules & Learning Objectives)
  ↓
Stage 4: Verified Resource Discovery & Objective-Aware Provider Execution (Engine 2.0)
  ├── Curated Educator Directory Adapter (Verified Channels & Flagship Courses)
  ├── Academic Repository Adapter (NCERT, Documentation, Khan, MIT OCW, OpenStax)
  └── YouTube Data API v3 Adapter (When API key configured)
  ↓
Explainable Relevance & Depth Scoring (Relevance Gating + Cross-Domain Collision Guards)
  ↓
Module-Aware Distribution & Role Assignment (Distributor evaluating candidates against module objectives)
  ↓
Stage 5: Quality, Metadata & Accessibility Audit (Hard caption/transcript gates, vintage, empty states)
  ↓
Stage 6: Diagnostic Checkpoints & Flashcards Grounded in Module Objectives
  ↓
Stage 7: Canonical Assembly & Persistence (Preserving full provenance, URLs, source, status)
  ↓
Course Player & Learning Workspace
```

### Actual Defective Execution Flow (Before Repair)
```
User clicks "Build My Learning Path" (src/app/(dashboard)/new-goal/page.tsx)
  ↓
CuratorEngine.run(config) (src/curator/index.ts)
  ↓
runStage1Deconstruction() (Taxonomy lookup)
  ↓
runStage2PrerequisiteMapping() (Topological sort)
  ↓
runStage3Synthesis() (Hardcoded physics or generic string templates)
  ↓
runStage4Discovery() [BYPASSES RESOURCE ENGINE V2 ENTIRELY]
  ├── Loops over CURATED_REPOSITORY_INDEX (Only 19 items, ALL School Physics!)
  │   └── Filters by repository name (NCERT, NPTEL) - NO TOPIC OR OBJECTIVE CHECK!
  └── Reads (masterDirectory as any).candidates
      └── Fails silently because .candidates is string[][] of editorial exclusions!
  ↓
runStage5Audit() [NO OBJECTIVE SCORING]
  ├── Assigns arbitrary additive score (qualityScore || 80 + captions + transcripts)
  └── Slices candidate array by index across modules:
      Module 0: videos[0..2], readings[0..3] (NCERT Physics Chapter 2, 3, 4)
      Module 1: videos[2..4], readings[3..6] (NCERT Physics Chapter 5, 7, etc.)
  ↓
runStage6Checkpoints()
  └── Generates Newton's Second Law & Kinematics formulas for ANY course!
  ↓
runStage7AssemblyAndPersistence()
  └── Strips fields due to property mismatches (r.type undefined, r.sourceName undefined)
  ↓
Course Player renders corrupted, completely irrelevant Physics cards for Python/Math!
```

---

## CONFIRMED DEFECT INVENTORY

### Defect 1: Pipeline Bypass & Dual Competing Discovery Implementations
* **File and Function:** `src/curator/stage4-resource-discovery.ts` (`runStage4Discovery`) and `src/curator/stage5-quality-audit.ts` (`runStage5Audit`).
* **Root Cause:** When the 7-stage Curator Engine was introduced, Stage 4 bypassed the authoritative `ResourceEngineV2` (`src/lib/resource-engine-v2/orchestrator.ts`). Stage 4 implemented an independent, naive harvesting loop over `CURATED_REPOSITORY_INDEX` that completely ignored course topic, module titles, and module learning objectives.
* **Reproduction Scenario:** Build any learning path for "Python Loops", "Differential Equations", "React Hooks", or "Modern Web Development".
* **Effect on Resource Relevance:** Complete topical mismatch. Every learning path received Physics textbooks (NCERT Class 11 Physics Chapters 2, 3, 4, 5) and Classical Mechanics videos regardless of the user's requested topic.
* **Proposed Correction:** Connect `runStage4Discovery` directly to the authoritative `ResourceEngineV2` discovery pipeline. Construct typed discovery specifications for each module, invoke `ResourceEngineV2.discover()`, and use its verified results.
* **Test Proving Correction:** `tests/curator-authoritative-pipeline.test.ts`: Synthesizing a "Python Loops" learning path returns Python programming tutorials and documentation, with 0 Physics resources.

---

### Defect 2: Broken Master Educator Directory Integration
* **File and Function:** `src/curator/stage4-resource-discovery.ts` (`runStage4Discovery`).
* **Root Cause:** Line 53 executed:
  ```ts
  const masterCandidates = (masterDirectory as any).candidates || [];
  ```
  In `data/master-youtube-educator-directory.json`, `.candidates` is an editorial exclusion list consisting of string arrays (`["Walter Lewin lectures...", "Physics", "EDITORIAL_REVIEW_REQUIRED", ...]`), NOT resource candidate objects. Lines 57-58:
  ```ts
  const url = cand.url || (cand.id ? `https://www.youtube.com/watch?v=${cand.id}` : null);
  if (!url || seenUrls.has(url)) continue;
  ```
  Since `cand` is an array of strings, `cand.url` and `cand.id` were `undefined`, evaluating `url` to `null` and skipping every item. Zero resources were ever discovered from the directory. Furthermore, the 96 verified educators in `masterDirectory.educators` and `VERIFIED_LEARNING_RESOURCES` were never matched to the module objectives.
* **Reproduction Scenario:** Inspecting `masterCandidates` during any discovery run.
* **Effect on Resource Relevance:** No educators from the Master Educator Directory were ever discovered or matched; discovery fell back exclusively to the 19 static physics items.
* **Proposed Correction:** Use `educatorRegistry` and `EducatorMatcher` from `src/lib/resource-engine-v2` which properly indexes the 96 master educators, verified channel IDs, and verified resources. Ensure `CuratedDirectoryAdapter` matches candidate educators to learning objectives and verifies channel identity.
* **Test Proving Correction:** `tests/educator-matching-integrity.test.ts`: Verifies that educators matching the subject (e.g., Corey Schafer, freeCodeCamp, CS50 for Python; 3Blue1Brown for Linear Algebra/Calculus) are discovered with verified channel IDs and attribution.

---

### Defect 3: Naive Array Slicing Instead of Objective-to-Resource Assignment
* **File and Function:** `src/curator/stage5-quality-audit.ts` (`runStage5Audit`).
* **Root Cause:** Lines 101-115 assigned resources across modules using naive index slicing:
  ```ts
  const vOffset = mIdx * maxVideos;
  const moduleVideos = videos.slice(vOffset, vOffset + maxVideos);
  assigned.push(...moduleVideos);
  const rOffset = mIdx * maxReadings;
  const moduleReadings = readings.slice(rOffset, rOffset + maxReadings);
  assigned.push(...moduleReadings);
  ```
  There was zero evaluation of whether a video or reading taught that module's specific learning objectives.
* **Reproduction Scenario:** Any multi-module path. Module 1 received items 0..2, Module 2 received items 2..4, etc.
* **Effect on Resource Relevance:** Resources were distributed arbitrarily by position in an array rather than educational alignment.
* **Proposed Correction:** Use `ResourceModuleDistributor` from `src/lib/resource-engine-v2/distribution/module-distributor.ts`, which evaluates every candidate specifically against that module's `AnalyzedObjective`, enforces role complementarity (primary conceptual, worked demonstration, practical application, supplementary reading), and respects cross-module deduplication.
* **Test Proving Correction:** `tests/module-resource-alignment.test.ts`: Module 1 ("For loops") receives loop-specific resources, while Module 2 ("Functions and Scope") receives function-specific resources without cross-module leakage or positional slicing.

---

### Defect 4: Field Name Desynchronization and Data Stripping in Persistence
* **File and Function:** `src/curator/stage7-assembly-persistence.ts` (`runStage7AssemblyAndPersistence`).
* **Root Cause:** When mapping `CuratorResource` to `lessons`, the code used wrong property names:
  * `type: r.type` -> `CuratorResource` defines `r.modality`, so `type` was `undefined`.
  * `sourceName: r.sourceName` -> `CuratorResource` defines `r.source`, so `sourceName` was `undefined`.
  * `hasCaptions: r.hasClosedCaptions` -> `CuratorResource` defines `r.hasCaptions`, so `hasClosedCaptions` was `undefined`.
  * `durationMinutes: r.durationMinutes || 20` -> `CuratorResource` lacked `durationMinutes`, always defaulting to 20.
  * `objective: m.objective` -> `CuratorModule` defines `objectives: string[]`, so `m.objective` was `undefined`.
* **Reproduction Scenario:** Persist any synthesized path through Stage 7 and load it in `src/app/(dashboard)/courses/[courseId]/page.tsx` or `src/app/(learning)/learn/[courseId]/[lessonId]/page.tsx`.
* **Effect on Resource Relevance:** The Course Player received corrupted lesson records with missing resource types, missing source names, and missing captions/duration metadata.
* **Proposed Correction:** Align all property mappings with canonical schema definitions (`CuratorResource`, `DistributedResourceItem`, `Lesson`), preserving `modality`, `source`, `durationMinutes`, `hasCaptions`, `verificationStatus`, and module objectives.
* **Test Proving Correction:** `tests/persistence-fidelity.test.ts`: Verifies that all persisted lessons maintain complete, non-null properties matching the source candidate.

---

### Defect 5: Generic Physics Checkpoints & Flashcards Hardcoded for All Courses
* **File and Function:** `src/curator/stage6-checkpoints-flashcards.ts` (`runStage6Checkpoints`) and `src/curator/stage3-curriculum-synthesis.ts` (`runStage3Synthesis`).
* **Root Cause:** In Stage 6, lines 121-138 generated physics flashcards (`Σ F = m · a`, `W_non-conservative = ΔK + ΔU`) for ANY course unless the title specifically matched "unit" or "kinematics". Lines 59-79 generated a 1D kinematics question (`x(t) = at^2 - bt^3`) for ANY course if exam alignment was enabled. In Stage 3, if not `isSchoolPhysics`, it generated four generic string templates rather than analyzing topic subtopics.
* **Reproduction Scenario:** Generating a course on "Python loops" or "Differential Equations" with flashcards/quiz enabled produced Newton's laws of motion and 1D kinematics questions.
* **Effect on Resource Relevance:** Learners saw completely irrelevant diagnostic quizzes and formula cards.
* **Proposed Correction:** Synthesize checkpoints and flashcards dynamically grounded in each module's actual learning objectives, concepts, and discovered resources.
* **Test Proving Correction:** `tests/checkpoints-grounding.test.ts`: Verifies that a Python loops course produces loop-focused questions and iteration flashcards, with zero Newtonian physics questions.

---

### Defect 6: Unregistered Academic Repositories Provider in Engine V2
* **File and Function:** `src/lib/resource-engine-v2/providers/index.ts` (`ProviderRegistry`).
* **Root Cause:** `AcademicNotesProvider` (which holds NCERT textbooks, Python documentation, React documentation, MDN, Pro Git, etc.) implements `ResourceProvider`, but `ProviderRegistry` only registered `YouTubeAdapterV2`, `OpenAlexAdapterV2`, `ArXivAdapterV2`, and `CuratedDirectoryAdapter`. `AcademicNotesProvider` and `CuratedRepositoryIndex` were not registered as `ResourceProviderAdapter`s in the engine's provider registry, meaning Engine V2 was unaware of official documentation, NCERT monographs, and curated open-access textbooks unless accessed through legacy routes.
* **Reproduction Scenario:** Searching for Python or React documentation through `ResourceEngineV2` without external API keys.
* **Effect on Resource Relevance:** Engine V2 could not discover official documentation (`docs.python.org`, `react.dev`, `developer.mozilla.org`) or curated textbooks (`NCERT`, `MIT OCW`, `OpenStax`).
* **Proposed Correction:** Create an authoritative `AcademicRepositoryAdapter` in `src/lib/resource-engine-v2/providers/` that implements `ResourceProviderAdapter`, wraps curated repositories (NCERT, NPTEL, Khan Academy, MIT OCW, OpenStax, SWAYAM, official tech documentation), and register it in `ProviderRegistry`. Ensure it maps to the user's `config.advanced.repositories` preferences.
* **Test Proving Correction:** `tests/academic-repository-adapter.test.ts`: Verifies that `AcademicRepositoryAdapter` returns official documentation and verified textbooks matching module objectives.

---

### Defect 7: Incomplete Token Filtering in `CuratedDirectoryAdapter`
* **File and Function:** `src/lib/resource-engine-v2/providers/curated-directory-adapter.ts`.
* **Root Cause:** In `CuratedDirectoryAdapter.search`, stop-word filtering checked `!['tutorial', 'course', ...].includes(t)`. However, search planner query strings include words like "explanation" (stemmed to "explanat"), "demonstration" (stemmed to "demonstr"), "walkthrough", "understanding", etc. Because these weren't in the stop-word filter, they were treated as strict content tokens. This inflated `contentTokens.size` and caused `overlapCount >= Math.min(2, contentTokens.size)` to fail even when the focal concept (e.g. "Linear Algebra", "Calculus") had an exact match.
* **Reproduction Scenario:** Querying `Essence of Linear Algebra` with query `Linear Algebra full explanation` requires 2 matches; if `explanat` is treated as a required content token, resources matching "Linear Algebra" without the word "explanation" fail matching.
* **Effect on Resource Relevance:** High-quality verified directory resources were erroneously rejected because of query format boilerplate words.
* **Proposed Correction:** Expand format stop words using stemmed tokens (`explan`, `demonstr`, `walkthrough`, `concept`, `practic`, `step`, `full`, `guid`, etc.) and ensure focal concept matching has primary weight.
* **Test Proving Correction:** `tests/curated-directory-matching.test.ts`: Verifies that queries containing formatting words like "explanation" or "walkthrough" cleanly match verified resources.

---

### Defect 8: Arbitrary Quality Scoring Additive Points Without Topical Evidence
* **File and Function:** `src/curator/stage5-quality-audit.ts`.
* **Root Cause:** Lines 69-72 simply assigned:
  ```ts
  let finalScore = res.qualityScore || 80;
  if (res.status === 'verified') finalScore += 5;
  if (res.hasCaptions) finalScore += 3;
  if (res.hasTranscript) finalScore += 2;
  ```
  This assigned scores between 80 and 90 to totally irrelevant resources without checking if the resource covered the requested learning objectives.
* **Reproduction Scenario:** Physics videos received a 90/100 score in a Python course simply because they had captions and verified status.
* **Effect on Resource Relevance:** Irrelevant content passed the "quality audit" with high scores.
* **Proposed Correction:** Use the authoritative `ExplainableRankingEngine` and `ExplainableRelevanceScorer` which compute scores based on primary concept coverage, domain alignment, pedagogical depth, and cross-domain collision penalties.
* **Test Proving Correction:** `tests/quality-scoring-integrity.test.ts`: Verifies that off-topic candidates receive failing relevance scores (< 50) and are gated out, regardless of whether they have captions or verified badges.

---

## HYPOTHESES EVALUATED & DISPROVED

1. **Hypothesis: YouTube Data API Quota was the sole cause of irrelevant results.**
   * *Finding:* DISPROVED. While YouTube API quota exhaustion causes the YouTube adapter to fall back, the immediate cause of irrelevant results was `CuratorEngine`'s hardcoded physics index and naive array slicing. Even with a valid YouTube API key, `CuratorEngine` never called the YouTube adapter because it bypassed Engine 2.0.

2. **Hypothesis: The scoring weights in `ExplainableRankingEngine` were improperly tuned.**
   * *Finding:* DISPROVED. `ExplainableRankingEngine` in `src/lib/resource-engine-v2/` already has strict gating (`minRelevanceThreshold = 50`), cross-domain collision rules, and concept matching. The problem was that `CuratorEngine` did not invoke `ExplainableRankingEngine` at all.

3. **Hypothesis: Stale browser localStorage or IndexedDB cache was serving old learning paths.**
   * *Finding:* DISPROVED. While `storageAdapter` stores paths, freshly generated paths had fresh IDs (`path-${Date.now()}-...`). The irrelevant contents were newly synthesized on every single run by `stage4-resource-discovery.ts` and `stage5-quality-audit.ts`.

---

## IMPLEMENTATION PLAN FOR PHASES 2 THROUGH 11

1. **Phase 2 — Establish One Authoritative Discovery Pipeline:**
   Unify `CuratorEngine` and `ResourceEngineV2`. Make `CuratorEngine` the top-level orchestrator that delegates discovery, ranking, and distribution to `ResourceEngineV2`.
2. **Phase 3 — Fix Learning-Objective Matching:**
   Ensure `CuratorEngine` passes complete, typed `ModuleDiscoveryInput` specifications with domain, subject, objectives, and concepts to `ResourceEngineV2`.
3. **Phase 4 — Integrate Master Educator Directory:**
   Connect `EducatorMatcher` and verified catalog resources into the active discovery pipeline.
4. **Phase 5 — Build Robust Provider Layer:**
   Implement `AcademicRepositoryAdapter` (for NCERT, documentation, Khan Academy, MIT OCW, OpenStax, SWAYAM) implementing `ResourceProviderAdapter`, and register it in `ProviderRegistry`.
5. **Phase 6 — Defensible Quality Scoring:**
   Replace the arbitrary additive points in Stage 5 with `ExplainableRankingEngine` and hard accessibility gates.
6. **Phase 7 — Fix Resource-to-Module Assignment:**
   Use `ResourceModuleDistributor` for objective-grounded assignment with zero naive slicing.
7. **Phase 8 & 9 — Preserve Provenance & Make Failures Visible:**
   Fix property names in Stage 7. Report real telemetry, coverage gaps, and honest empty states.
8. **Phase 10 & 11 — Regression Test Suite & Verification:**
   Build comprehensive tests for topic relevance, educator directory, providers, ranking, and E2E generation. Run full suite, TypeScript checks, and production build.
