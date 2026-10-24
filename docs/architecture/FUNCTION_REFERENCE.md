# Pencill — Core Function & Service Reference

> **Document Version**: 2.0  
> **Scope**: Critical exported and internally significant functions, classes, service methods, and hooks.

---

## 1. Resource Engine 2.0 Core Functions

### 1.1 `ResourceEngineV2.discover()`
* **Source**: [`src/lib/resource-engine-v2/orchestrator.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/lib/resource-engine-v2/orchestrator.ts#L161)
* **Signature**:
  ```typescript
  public async discover(
    input: EngineDiscoveryInput,
    options?: { config?: EngineConfig }
  ): Promise<EngineDiscoveryOutput>
  ```
* **Purpose**: Primary orchestrator entry point. Coordinates objective analysis, search planning, concurrent provider execution, candidate ranking, module distribution, chapter extraction, and pre-write schema validation.
* **Parameters**:
  * `input`: `EngineDiscoveryInput` containing `query`, `modules`, `academicLevel`, `targetExam`, `modalities`, `timeoutMs`.
  * `options`: Optional configuration override (`v2TimeoutMs`, `concurrencyLimit`).
* **Return Value**: `Promise<EngineDiscoveryOutput>` containing `distributedModules`, `rankedPool`, `persistenceMapping`, `validationReport`, and `executionMetrics`.
* **Side Effects**: Reads from external cloud APIs (YouTube, Google Search, arXiv, OpenAlex) and the Master Educator Directory.
* **Callers**: [`src/app/api/resources/discover/route.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/app/api/resources/discover/route.ts#L241), [`engine-router.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/lib/resource-engine-v2/bridge/engine-router.ts#L219).
* **Error Behavior**: Catches individual provider errors into `partialFailures`; returns whatever verified resources were collected.

---

### 1.2 `ExplainableRankingEngine.rank()`
* **Source**: [`src/lib/resource-engine-v2/evaluation/ranking-engine.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/lib/resource-engine-v2/evaluation/ranking-engine.ts#L85)
* **Signature**:
  ```typescript
  rank(
    objective: AnalyzedObjective,
    candidates: NormalizedResourceCandidate[],
    options?: RankingOptions
  ): RankedResult
  ```
* **Purpose**: Evaluates candidate resources against pedagogical objectives using normalized weighted multi-criteria scoring.
* **Parameters**:
  * `objective`: The structured pedagogical target (`AnalyzedObjective`).
  * `candidates`: Array of raw normalized candidates.
  * `options`: Configurable weights (`relevanceWeight: 0.50`, `depthWeight: 0.25`, `durationWeight: 0.15`, `coverageWeight: 0.10`).
* **Return Value**: `RankedResult` containing `rankedCandidates` and `rejectedCandidates` with detailed `rankingRationale`.
* **Side Effects**: Pure deterministic evaluation (no network calls).
* **Dependencies**: `ExplainableRelevanceScorer`, `EducationalDepthEvaluator`, `DurationIntelligenceEvaluator`, `ObjectiveCoverageAnalyzer`, `PracticalResourceClassifier`.

---

### 1.3 `isModalityAppropriateForObjective()`
* **Source**: [`src/lib/resource-engine-v2/evaluation/ranking-engine.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/lib/resource-engine-v2/evaluation/ranking-engine.ts#L20)
* **Signature**:
  ```typescript
  export function isModalityAppropriateForObjective(
    modality: ResourceModality,
    objective: AnalyzedObjective
  ): boolean
  ```
* **Purpose**: Prevents academic research papers from displacing practical tutorials or high school study materials.
* **Rules**:
  * If `modality === 'paper'`: Returns `false` for beginner levels, high school board exams (CBSE, ICSE, NEET, JEE), or coding walkthroughs. Returns `true` only for advanced undergraduate, postgraduate, or research intent.
  * If `modality === 'documentation'`: Returns `true` for computer science, data science, and programming.

---

### 1.4 `extractChaptersFromDescription()`
* **Source**: [`src/lib/resource-engine-v2/chapters/chapter-resolver.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/lib/resource-engine-v2/chapters/chapter-resolver.ts#L32)
* **Signature**:
  ```typescript
  export function extractChaptersFromDescription(
    description: string,
    videoDurationSeconds?: number,
    videoBaseUrl?: string
  ): VideoChapter[]
  ```
* **Purpose**: Parses YouTube descriptions for timestamps (`14:22 Kinematics`), validates chronological order against total video duration, and constructs parameterized destination links (`&start=862`).

---

## 2. AI & Curriculum Synthesis Functions

### 2.1 `callGemini()`
* **Source**: [`src/services/ai/gemini/client.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/services/ai/gemini/client.ts#L66)
* **Signature**:
  ```typescript
  export async function callGemini(
    prompt: string,
    systemInstruction?: string,
    options?: GeminiRequestOptions
  ): Promise<string>
  ```
* **Purpose**: Communicates with Google Gemini Generative Language API using native REST `fetch`. Enforces server-only execution, redacts API keys in logs, configures JSON response mode, and iterates through candidate model fallbacks (`gemini-3.8-flash` -> `gemini-3.5-flash` -> `gemini-flash-latest`).
* **Parameters**:
  * `prompt`: The user or synthesis prompt.
  * `systemInstruction`: The academic role prompt.
  * `options`: `temperature`, `timeoutMs`, `jsonMode: true`, `maxOutputTokens`.
* **Return Value**: `Promise<string>` raw response text.
* **Error Behavior**: Throws `GeminiClientError` if all models fail or time out.

---

### 2.2 `createTopicAdaptiveCurriculum()`
* **Source**: [`src/services/ai/curriculum-adaptive-engine.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/services/ai/curriculum-adaptive-engine.ts#L476)
* **Signature**:
  ```typescript
  export function createTopicAdaptiveCurriculum(
    topic: string,
    level: string = 'intermediate',
    weeklyHours: number = 6,
    resources: EngineResource[] = [],
    options?: AdaptiveCurriculumOptions
  ): GeneratedLearningPath
  ```
* **Purpose**: Deterministic curriculum generation engine used when LLM providers are offline. Employs `analyzeTopicComplexity()` and `inferDomain()` to construct structured syllabi with module objectives, lesson blueprints, and formula decks without external API calls.

---

## 3. Database & Persistence Services

### 3.1 `createFullLearningPath()`
* **Source**: [`src/services/supabase/pathService.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/services/supabase/pathService.ts#L494)
* **Signature**:
  ```typescript
  export async function createFullLearningPath(
    pathData: CreateFullLearningPathInput,
    userId: string,
    discoveredResources?: DiscoveredResourcePayload[]
  ): Promise<string | null>
  ```
* **Purpose**: Generates slug ID, writes course to in-memory cache and `localStorage`, then executes batched relational writes to Supabase (`learning_paths`, `modules`, `lessons`).
* **Return Value**: `Promise<string | null>` (the created path ID).

---

### 3.2 `repairCourseVideoDuplicates()`
* **Source**: [`src/services/supabase/pathService.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/services/supabase/pathService.ts#L191)
* **Signature**:
  ```typescript
  export function repairCourseVideoDuplicates(course: LearningPath): { path: LearningPath; repaired: boolean }
  ```
* **Purpose**: Scans all lessons across modules in a course. If the same video URL appears in multiple modules, it checks for chapter timestamps. If timestamps differ, it preserves them as intentional chapter references; otherwise, it assigns distinct replacement resources from the Master Educator Directory, preserving lesson IDs, progress, and user notes.

---

### 3.3 `recordDeletedItem()` & `getDeletedItemIds()`
* **Source**: [`src/services/supabase/deletionRegistry.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/services/supabase/deletionRegistry.ts#L137)
* **Signature**:
  ```typescript
  export async function recordDeletedItem(
    type: "learning_path" | "quiz",
    targetId: string,
    options?: { userId?: string | null; client?: SupabaseClient }
  ): Promise<boolean>
  ```
* **Purpose**: Solves the "deleted item reappearing on page refresh" bug by writing authoritative marker rows into `public.quizzes` (`id = '__deleted__path__<id>'`, `status = 'deleted'`) and keeping an in-memory set.
* **`getDeletedItemIds(type)`**: Returns a `Set<string>` used by `getLearningPaths()` to filter out deleted courses across all reloads.

---

### 3.4 `migrateGuestDataToUser()`
* **Source**: [`src/services/supabase/migrationService.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/services/supabase/migrationService.ts#L10)
* **Signature**:
  ```typescript
  export async function migrateGuestDataToUser(userId: string): Promise<MigrationSummary>
  ```
* **Purpose**: Invoked by `AuthContext` when a user signs in. Reads offline progress (`pencill_guest_progress`), notes (`pencill_notes_*`), and quiz attempts from `localStorage`, performs batched `upsert` queries into Supabase PostgreSQL, and cleans up local guest storage.

---

### 3.5 `canDeleteLearningPath()`
* **Source**: [`src/lib/permissions.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/lib/permissions.ts#L58)
* **Signature**:
  ```typescript
  export function canDeleteLearningPath(
    path: Pick<LearningPath, "id" | "authorUserId">,
    user: User | UserRoleContext | null | undefined,
    profile?: UserProfile | null,
    isConfigured: boolean = true
  ): boolean
  ```
* **Purpose**: Access control gate. Ensures system-curated catalog tracks (`authorUserId === null`) can strictly be deleted only by administrators, while authored tracks can be deleted by their creator or an administrator.
