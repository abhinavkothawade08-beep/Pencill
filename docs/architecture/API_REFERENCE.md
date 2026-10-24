# Pencill — API Reference Manual

> **Base URL**: `/api`  
> **Protocol**: HTTPS / RESTful JSON  
> **Authentication**: Bearer JWT (`Authorization: Bearer <token>`) via Supabase Auth

---

## Complete API Route Index

| Method | Endpoint | Source File | Purpose | Auth Required |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/resources/discover` | [`src/app/api/resources/discover/route.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/app/api/resources/discover/route.ts) | Synthesizes learning path & discovers resources | Optional (Guest supported) |
| `POST` | `/api/resources/search` | [`src/app/api/resources/search/route.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/app/api/resources/search/route.ts) | Fast multi-provider resource search | No |
| `POST` | `/api/resources/evaluate` | [`src/app/api/resources/evaluate/route.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/app/api/resources/evaluate/route.ts) | Batched quality & relevance scoring | No |
| `POST` | `/api/resources/notes` | [`src/app/api/resources/notes/route.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/app/api/resources/notes/route.ts) | Fetches lesson study notes & NCERT PDFs | No |
| `GET` | `/api/resources/practice` | [`src/app/api/resources/practice/route.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/app/api/resources/practice/route.ts) | Fetches practice sets and PYQs | No |
| `GET` | `/api/courses/[id]` | [`src/app/api/courses/[id]/route.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/app/api/courses/[id]/route.ts) | Retrieves a single course syllabus | No |
| `DELETE` | `/api/courses/[id]` | [`src/app/api/courses/[id]/route.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/app/api/courses/[id]/route.ts) | Deletes an authored course | Yes (Author or Admin) |
| `POST` | `/api/courses/batch-delete` | [`src/app/api/courses/batch-delete/route.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/app/api/courses/batch-delete/route.ts) | Bulk deletes multiple courses | Yes (Author or Admin) |
| `GET` | `/api/enrollments` | [`src/app/api/enrollments/route.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/app/api/enrollments/route.ts) | Fetches active enrollments | Optional |
| `POST` | `/api/enrollments` | [`src/app/api/enrollments/route.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/app/api/enrollments/route.ts) | Enrolls user in a course | Optional |
| `DELETE` | `/api/enrollments` | [`src/app/api/enrollments/route.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/app/api/enrollments/route.ts) | Unenrolls user from a course | Optional |
| `GET` | `/api/quizzes/[id]` | [`src/app/api/quizzes/[id]/route.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/app/api/quizzes/[id]/route.ts) | Retrieves a quiz (redacts answer keys) | No |
| `DELETE` | `/api/quizzes/[id]` | [`src/app/api/quizzes/[id]/route.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/app/api/quizzes/[id]/route.ts) | Deletes a quiz checkpoint | Yes (Owner or Admin) |
| `POST` | `/api/quizzes/generate` | [`src/app/api/quizzes/generate/route.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/app/api/quizzes/generate/route.ts) | Generates AI diagnostic questions | No |
| `POST` | `/api/quizzes/attempt` | [`src/app/api/quizzes/attempt/route.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/app/api/quizzes/attempt/route.ts) | Starts / resumes a test attempt | No |
| `POST` | `/api/quizzes/submit` | [`src/app/api/quizzes/submit/route.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/app/api/quizzes/submit/route.ts) | Evaluates quiz answers & records score | No |
| `POST` | `/api/quizzes/batch-delete`| [`src/app/api/quizzes/batch-delete/route.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/app/api/quizzes/batch-delete/route.ts) | Bulk deletes multiple quizzes | Yes (Owner or Admin) |
| `GET` | `/api/ai/test` | [`src/app/api/ai/test/route.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/app/api/ai/test/route.ts) | Health-check for Gemini API | No |

---

## Detailed Route Specifications

### 1. `POST /api/resources/discover`
* **File**: `src/app/api/resources/discover/route.ts`
* **Description**: Primary curriculum synthesis and autonomous resource discovery orchestrator.
* **Validation Schema**: `DiscoverRequestSchema` ([`src/lib/api-schemas.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/lib/api-schemas.ts#L3))
* **Request Body**:
  ```json
  {
    "query": "JEE Physics Mechanics Class 11",
    "domain": "Physics",
    "depthLevel": "class-11",
    "targetExam": "JEE",
    "weeklyHours": 8,
    "language": "English",
    "modalities": ["videos", "reading", "practice", "quizzes"],
    "limit": 12,
    "generateLearningPath": true
  }
  ```
* **Success Response (HTTP 200)**:
  ```json
  {
    "success": true,
    "learningPath": {
      "title": "JEE Physics: Class 11 Mechanics",
      "domain": "Physics",
      "level": "Class 11",
      "durationHours": 32,
      "moduleCount": 4,
      "modules": [
        {
          "moduleNumber": 1,
          "title": "Vectors & Kinematics Primitives",
          "objective": "Establish coordinate frameworks and vector calculus.",
          "lessons": [
            {
              "title": "Vector Resolution and Cross Products",
              "type": "video",
              "durationMinutes": 35,
              "sourceName": "Walter Lewin (MIT OCW)",
              "sourceUrl": "https://www.youtube.com/watch?v=...",
              "chapters": [
                { "title": "Vector Definitions", "timestampSeconds": 0 },
                { "title": "Analytical Cross Product", "timestampSeconds": 920 }
              ]
            }
          ]
        }
      ]
    },
    "discoveredResources": [ ... ],
    "diagnosticsGenerated": 4
  }
  ```
* **Status Codes**:
  * `200 OK`: Successful synthesis.
  * `400 Bad Request`: Payload validation failed (`query`, `goal`, or `topics` missing).
  * `500 Internal Server Error`: Unhandled fatal error.
* **Services Invoked**: `aiService.generateLearningPath()`, `ResourceEngineV2.discover()`, `createQuiz()`.

---

### 2. `POST /api/courses/batch-delete`
* **File**: `src/app/api/courses/batch-delete/route.ts`
* **Description**: Bulk deletes up to 100 courses owned by the authenticated caller.
* **Validation Schema**: `BatchDeleteCoursesSchema` ([`src/lib/api-schemas.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/lib/api-schemas.ts#L176))
* **Headers**: `Authorization: Bearer <Supabase_JWT>`
* **Request Body**:
  ```json
  {
    "courseIds": ["path-python-mv6cro8p", "jee-physics-mvlv7maf"],
    "softDelete": false
  }
  ```
* **Success Response (HTTP 200)**:
  ```json
  {
    "success": true,
    "deletedCount": 2,
    "deletedIds": ["path-python-mv6cro8p", "jee-physics-mvlv7maf"],
    "failedItems": []
  }
  ```
* **Status Codes**:
  * `200 OK`: All eligible courses deleted.
  * `400 Bad Request`: Malformed IDs or batch exceeds 100 limit.
  * `401 Unauthorized`: Missing or invalid Bearer token.
  * `403 Forbidden`: Attempted to delete catalog courses or courses authored by others without admin role.
* **Database Operations**:
  * Calls `recordDeletedItem('learning_path', id)` in `deletionRegistry.ts`.
  * Executes `DELETE FROM public.learning_paths WHERE id = id`.
  * Cascades across child `modules`, `lessons`, and `enrollments`.

---

### 3. `POST /api/quizzes/submit`
* **File**: `src/app/api/quizzes/submit/route.ts`
* **Description**: Submits student quiz answers for instant scoring and distractor analysis.
* **Validation Schema**: `QuizSubmitRequestSchema` ([`src/lib/api-schemas.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/lib/api-schemas.ts#L97))
* **Request Body**:
  ```json
  {
    "attemptId": "f7d3a2b1-1234-4567-89ab-cdef01234567",
    "quizId": "quiz-rotational-dynamics-checkpoint",
    "answers": {
      "1": "A",
      "2": "C",
      "3": "B"
    },
    "flaggedQuestions": [3],
    "timeSpentSeconds": 480
  }
  ```
* **Success Response (HTTP 200)**:
  ```json
  {
    "success": true,
    "score": 85.0,
    "accuracyPercent": 85,
    "totalQuestions": 4,
    "correctCount": 3,
    "review": [
      {
        "questionNumber": 1,
        "selectedOptionId": "A",
        "correctOptionId": "A",
        "isCorrect": true,
        "explanation": "Newton's Second Law F = dp/dt directly relates impulse to momentum change."
      }
    ]
  }
  ```
* **Database Operations**:
  * Reads authoritative questions from `public.quiz_questions` or `inMemoryQuizStore`.
  * Writes score and answers to `public.quiz_attempts`.

---

### 4. `POST /api/resources/notes`
* **File**: `src/app/api/resources/notes/route.ts`
* **Description**: Discovers verified reading monographs, official developer documentation, and direct NCERT textbook PDFs for a lesson title.
* **Request Body**:
  ```json
  {
    "topic": "Haloalkanes and Haloarenes",
    "lessonTitle": "Nucleophilic Substitution Reactions",
    "domain": "Chemistry",
    "limit": 6
  }
  ```
* **Success Response (HTTP 200)**:
  ```json
  {
    "success": true,
    "lessonTitle": "Nucleophilic Substitution Reactions",
    "notes": [
      {
        "id": "ncert-chem-ch10",
        "title": "NCERT Class 12 Chemistry: Haloalkanes and Haloarenes (Official Textbook)",
        "type": "textbook",
        "sourceUrl": "https://ncert.nic.in/textbook.php?lech1=1-10",
        "downloadUrl": "https://ncert.nic.in/textbook.php?lech1=1-10",
        "publisher": "National Council of Educational Research and Training (NCERT)",
        "isDirectPdf": false,
        "qualityScore": 95,
        "relevanceExplanation": "Official NCERT textbook chapter mapping directly to CBSE and JEE syllabus."
      }
    ],
    "total": 1
  }
  ```
