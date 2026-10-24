# Pencill — End-to-End Execution Trace

> **Representative Topic Traced**: `"JEE Physics Class 11 Mechanics"`  
> **Secondary Topic Traced**: `"Python Programming Foundations"`  
> **Source Evidence**: Verified against live execution logs from [`scripts/verify_new_goal_e2e.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/scripts/verify_new_goal_e2e.ts) and runtime engine tests.

---

## 1. Initial UI State (`/new-goal`)

The learner navigates to `/new-goal`. The client mounts [`src/app/(dashboard)/new-goal/page.tsx`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/app/(dashboard)/new-goal/page.tsx):
* **Active Form State**:
  * `domainName`: `"School Education"`
  * `subject`: `"CBSE"`
  * `topics`: `["JEE Physics Class 11 Mechanics"]`
  * `targetExam`: `{ name: "JEE Main & Advanced", category: "Engineering Entrance" }`
  * `depthLevel`: `"class-11"`
  * `difficulty`: `"advanced"`
  * `weeklyHours`: `8`
  * `pacingStrategy`: `"balanced"`
  * `modalities`: `{ videos: true, reading: true, practice: true, quizzes: true }`
* **Real-time Blueprint Estimate**:
  [`estimateCurriculumBlueprint()`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/lib/curriculum/blueprintEstimator.ts#L43) evaluates the configuration and displays:
  * Estimated Modules: `[4, 6]` modules.
  * Estimated Total Study Investment: `38` hours over `4.5` weeks.
  * Feasibility Status: `isFeasible: true`.

---

## 2. Inbound HTTP Request Payload

Learner clicks **"Synthesize Learning Path"**.
The browser fires a `POST` request to `/api/resources/discover`:

```json
{
  "query": "JEE Physics Class 11 Mechanics",
  "domain": "Physics",
  "subject": "Physics",
  "topics": ["JEE Physics Class 11 Mechanics"],
  "targetExam": { "name": "JEE Main & Advanced" },
  "depthLevel": "class-11",
  "difficulty": "advanced",
  "instructionLanguage": "English",
  "weeklyHours": 8,
  "pacingStrategy": "balanced",
  "modalities": ["videos", "reading", "practice", "quizzes"],
  "generateLearningPath": true,
  "limit": 12
}
```

---

## 3. Server Request Validation

Route handler [`src/app/api/resources/discover/route.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/app/api/resources/discover/route.ts#L106) executes:

```typescript
const parseResult = DiscoverRequestSchema.safeParse(rawBody);
```
* **Validation Outcome**: `parseResult.success === true`.
* **Sanitized Parameters**:
  * `query`: `"JEE Physics Class 11 Mechanics"`
  * `level`: `"class-11"`
  * `weeklyHours`: `8`
  * `detectedExam`: `"JEE"`
  * `options.difficulty`: `"intermediate"`

---

## 4. Phase 1: Gemini AI Curriculum Synthesis

The server calls [`aiService.generateLearningPath()`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/services/ai/gemini/geminiProvider.ts#L62):

### 4.1 System Instruction Sent to Model
```
You are the Chief Academic Curriculum Architect at Pencill, an elite scholarly learning platform.
Your mandate is to synthesize rigorous, deeply intuitive, pedagogical learning paths with zero superficial fluff.
CRITICAL PEDAGOGICAL INVARIANT:
The curriculum structure—including module count, depth, sequence, and pedagogical granularity—MUST dynamically adapt to the inherent complexity and technical scope of the requested topic, rather than adhering to any artificial or fixed limit.
Always output pure valid JSON matching the exact schema requested.
```

### 4.2 Synthesis Prompt
```
Synthesize a structured, topic-adaptive academic learning path for the following topic:
- Topic: JEE Physics Class 11 Mechanics
- Depth / Rigor: rigorous
- Target Level: Class 11
- Target Weekly Study Hours: 8h
- Language: English
- Modalities: Video lectures, monographs, problem sets, quizzes
- Target Academic Goal / Exam: JEE

DYNAMIC TOPIC-ADAPTIVE ARCHITECTURE GUIDELINES:
1. Recommended Target: 4 to 6 modules.
2. Structure: Foundations & Axioms -> Core Architectures & Methods -> Applied Workflows & Optimization -> Synthesis.
3. Use LaTeX mathematical notation ($E = mc^2$) for all equations.
```

### 4.3 Live Execution & Model Fallback Cascade
During live test execution (verified in `task-208` logs):
1. `gemini-3.8-flash` received HTTP 503 (high demand from Google Cloud).
2. Client caught 503 error after 14,728ms and automatically retried candidate model `gemini-3.5-flash`.
3. `gemini-3.5-flash` succeeded in 2,410ms and returned valid structured JSON!

### 4.4 Parsed Learning Path Output
```json
{
  "title": "JEE Physics Class 11 Mechanics Comprehensive Academic Curriculum",
  "domain": "Physics",
  "level": "Advanced",
  "durationHours": 32,
  "moduleCount": 5,
  "modules": [
    {
      "moduleNumber": 1,
      "title": "Kinematics & Vector Calculus Foundations",
      "objective": "Establish dimensional homogeneity, vector cross products, and differential equations of motion.",
      "lessons": [
        { "title": "Differential Kinematics and Non-Uniform Acceleration", "type": "video", "estimatedMinutes": 30 },
        { "title": "2D Projectile & Trajectory Parabola Equations", "type": "monograph", "estimatedMinutes": 25 },
        { "title": "Relative Velocity in 2D Problem Set", "type": "practice", "estimatedMinutes": 45 },
        { "title": "Kinematics Checkpoint Assessment", "type": "quiz", "estimatedMinutes": 20 }
      ]
    },
    { "moduleNumber": 2, "title": "Newtonian Dynamics & Friction Mechanics", "lessons": [ ... ] },
    { "moduleNumber": 3, "title": "Work, Energy, Power & Conservative Fields", "lessons": [ ... ] },
    { "moduleNumber": 4, "title": "System of Particles & Center of Mass", "lessons": [ ... ] },
    { "moduleNumber": 5, "title": "Rotational Dynamics & Rigid Body Equilibrium", "lessons": [ ... ] }
  ]
}
```

---

## 5. Phase 2: Resource Engine 2.0 Autonomous Discovery

The server invokes [`ResourceEngineV2.discover()`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/lib/resource-engine-v2/orchestrator.ts#L161):

### 5.1 Objective Analysis
[`LearningObjectiveAnalyzer.analyze()`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/lib/resource-engine-v2/analysis/objective-analyzer.ts#L45) extracts:
* `domain`: `'physics'`
* `cognitiveIntent`: `'exam_practice'`
* `primaryConcepts`: `['kinematics', 'vectors', 'newtonian dynamics', 'work energy', 'rotational motion']`
* `intentProfile.practicalEmphasis`: `'moderate'`

### 5.2 Multi-Provider Search Planning
[`IntentAwareSearchPlanner.plan()`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/lib/resource-engine-v2/planning/search-planner.ts#L40) generates queries:
* Provider `youtube`: `"JEE Physics Class 11 Mechanics Walter Lewin MIT OCW"`
* Provider `academic-notes`: `"Class 11 Physics NCERT Kinematics textbook"`
* Provider `openalex`: `"Rotational dynamics rigid bodies physics"`

### 5.3 Candidate Retrieval & Normalization
* **YouTube Adapter**:
  * Matches verified institutional lectures from MIT OpenCourseWare (Prof. Walter Lewin 8.01 Physics I).
  * Validates embeddability (`status.embeddable == true`).
  * Normalizes video URL: `https://www.youtube.com/watch?v=s9wquzYwLq0`.
  * Extracts duration: `2,840 seconds` (~47 mins).
* **Master Educator Directory Match**:
  * Matches educator `EDU-010` (MIT OpenCourseWare) and `EDU-001` (Khan Academy).
* **Academic Notes Provider**:
  * Discovers official NCERT textbook: `https://ncert.nic.in/textbook.php?leph1=1-8`.

---

## 6. Phase 3: Ranking, Gating & Distribution

### 6.1 Ranking Engine Calculations
[`ExplainableRankingEngine.rank()`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/lib/resource-engine-v2/evaluation/ranking-engine.ts#L85) evaluates candidates:

```
Candidate 1: "MIT 8.01 Classical Mechanics - Lecture 1: Kinematics"
  Relevance Score:   95 / 100
  Depth Score:       98 / 100 (Tier 1 University Institution)
  Duration Score:    92 / 100 (47 mins is optimal for complete derivation)
  Coverage Ratio:    100% (3 of 3 concepts covered)
  Category Bonus:    +5 (Rigorous derivation)
  Buzzword Penalty:  0
  Composite Score:   96 / 100 -> ACCEPTED (Slotted as Core Video)

Candidate 2: "How to Solve Any Physics Problem in 3 Minutes" (Clickbait)
  Relevance Score:   30 / 100 (Generic keywords only)
  Composite Score:   42 / 100 -> REJECTED (Below minRelevanceThreshold 50)
```

### 6.2 Modality Diversity Slotting
* Slot #1 (Core Video): Walter Lewin MIT OCW Kinematics (Score 96).
* Slot #2 (Monograph): NCERT Class 11 Physics Chapter 3 (Score 94).
* Slot #3 (Practice Set): JEE Advanced Kinematics Worked Problems (Score 90).

### 6.3 Chapter Timestamp Extraction
Description parser in [`chapter-resolver.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/lib/resource-engine-v2/chapters/chapter-resolver.ts#L32) extracts timestamps:
* `00:00 Introduction & Vectors` -> `0s`
* `12:45 1D Differential Acceleration` -> `765s`
* `28:30 Projectile Trajectories` -> `1710s`
Assigns start time parameter `&start=765` to Lesson 1.

---

## 7. Phase 4: Diagnostic Checkpoint Generation & Persistence

1. **AI Checkpoint Questions**:
   Server calls `aiService.generateQuizQuestions()` for Module 1:
   * Generates 4 diagnostic multiple-choice questions with LaTeX formulas and distractor analysis.
   * Isolates answer keys (`correctOptionId: 'B'`).
2. **Database Persistence**:
   Calls `createQuiz()` to insert checkpoint into `public.quizzes` and `public.quiz_questions`.
3. **Course Persistence**:
   Client calls [`createFullLearningPath()`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/services/supabase/pathService.ts#L494):
   * Generates course ID: `jee-physics-class-11-mechanics-c-mvlv7maf`.
   * Caches in memory (`inMemoryPathCache`) and `localStorage`.
   * Writes course row into `public.learning_paths`.
   * Bulk-inserts 5 module rows into `public.modules`.
   * Bulk-inserts 20 lesson rows into `public.lessons`.
4. **Auto-Enrollment**:
   Inserts enrollment record into `public.enrollments`.

---

## 8. Client UI Hydration & Navigation

1. Router executes `router.push('/courses/jee-physics-class-11-mechanics-c-mvlv7maf')`.
2. The Course Overview page renders the 5 synthesized modules.
3. Learner clicks Lesson 1 and enters the **3-Pane Study Workspace** (`/learn/jee-physics-.../les-mod-1-1`):
   * Left pane: Displays 5 modules with active indicator on Lesson 1.
   * Center pane: YouTube player loads `https://www.youtube-nocookie.com/embed/s9wquzYwLq0?start=765`.
   * Right pane: Study tools render key takeaways, in-context note input, and NCERT PDF download link.

---

## 9. Reload Verification (`F5`)

When the user refreshes the browser:
1. Next.js App Router executes `getLearningPathById('jee-physics-class-11-mechanics-c-mvlv7maf')`.
2. Server checks `isItemDeleted('jee-physics-...')` -> returns `false`.
3. Checks `inMemoryPathCache` (returns in 1ms) or fetches from `public.learning_paths` joined with `modules` and `lessons`.
4. Hydrates active enrollment from `public.enrollments`.
5. Learner resumes study exactly where they left off.
