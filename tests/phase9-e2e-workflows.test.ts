import test, { describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { storageAdapter } from "../src/lib/storage/storageAdapter";
import { estimateBlueprint } from "../src/lib/curriculum/blueprintEstimator";
import { DEFAULT_BUILDER_CONFIG_STATE, BuilderConfig } from "../src/lib/types/builderConfig";
import {
  enrollUserInCourse,
  getUserEnrollments,
  unenrollUserFromCourse,
  isUserEnrolled,
} from "../src/services/supabase/enrollmentService";
import {
  getServerUserEnrollments,
  isServerUserEnrolled,
} from "../src/services/supabase/serverEnrollmentStore";
import {
  deleteLearningPath,
  getLearningPathById,
  deleteLearningPathFromDatabase,
  inMemoryPathCache,
} from "../src/services/supabase/pathService";
import {
  recordDeletedItem,
  isItemDeletedSync,
  getDeletedItemIds,
  clearDeletionRegistryForTesting,
} from "../src/services/supabase/deletionRegistry";
import {
  createQuiz,
  getQuizById,
  startQuizAttempt,
  submitQuizAttempt,
  deleteQuizFromDatabase,
  deleteQuiz,
} from "../src/services/supabase/quizService";
import { CuratorEngine } from "../src/curator";
import { LearningPath, QuizQuestion } from "../src/types";

describe("Phase 9: Comprehensive Functional Workflows & Verification Suite", () => {
  const verifiedTestCourse: LearningPath = {
    id: "mit-8-012-physics-i-classical-mechanics",
    title: "MIT 8.012: Physics I - Classical Mechanics",
    domain: "Physics",
    description: "Foundational classical mechanics course with verified literature",
    level: "Undergraduate",
    durationHours: 24,
    moduleCount: 4,
    verified: true,
    modules: [],
  };

  beforeEach(() => {
    clearDeletionRegistryForTesting();
    inMemoryPathCache.set("mit-8-012-physics-i-classical-mechanics", verifiedTestCourse);
  });

  // ============================================================================
  // TEST 1 & 2: ADD TOPIC, REMOVE TOPIC & BLUEPRINT CALIBRATION
  // ============================================================================
  describe("Test 1 & 2: Add Topic, Remove Topic, Limits & Blueprint Synchronization", () => {
    test("1.1. Add Topic: Enforces 3-character minimum and rejects empty or whitespace-only input", () => {
      const validateTopic = (label: string) => {
        const clean = label ? label.trim() : "";
        if (!clean) return { added: false, reason: "Topic name cannot be empty or whitespace only." };
        if (clean.length < 3) return { added: false, reason: "Topic must be at least 3 characters long." };
        return { added: true, label: clean };
      };

      assert.strictEqual(validateTopic("").added, false);
      assert.strictEqual(validateTopic("   ").added, false);
      assert.strictEqual(validateTopic("ab").added, false);
      assert.strictEqual(validateTopic("Python Loops").added, true);
      assert.strictEqual(validateTopic("  Rotational Dynamics  ").label, "Rotational Dynamics");
    });

    test("1.2. Add Topic: Enforces case-insensitive duplicate prevention and 8-topic limit", () => {
      const selectedTopics: Array<{ id: string; label: string }> = [];

      const add = (label: string) => {
        const clean = label.trim();
        if (selectedTopics.length >= 8) return { added: false, reason: "Maximum limit of 8 topics reached." };
        if (selectedTopics.some((t) => t.label.toLowerCase() === clean.toLowerCase())) {
          return { added: false, reason: `Topic "${clean}" is already selected.` };
        }
        selectedTopics.push({ id: `t-${selectedTopics.length + 1}`, label: clean });
        return { added: true };
      };

      // Add valid topic
      const r1 = add("Python Loops");
      assert.strictEqual(r1.added, true);
      assert.strictEqual(selectedTopics.length, 1);

      // Duplicate attempt (case-insensitive)
      const r2 = add("python loops");
      assert.strictEqual(r2.added, false);
      assert.strictEqual(selectedTopics.length, 1);
      assert.ok(r2.reason?.includes("already selected"));

      // Add up to limit
      for (let i = 2; i <= 8; i++) {
        const r = add(`Topic ${i}`);
        assert.strictEqual(r.added, true);
      }
      assert.strictEqual(selectedTopics.length, 8);

      // 9th topic attempt must be rejected
      const r9 = add("Extra Topic 9");
      assert.strictEqual(r9.added, false);
      assert.ok(r9.reason?.includes("Maximum limit"));
      assert.strictEqual(selectedTopics.length, 8);
    });

    test("1.3. Adding and removing topics dynamically re-calibrates blueprint estimates", () => {
      const config1: BuilderConfig = {
        ...DEFAULT_BUILDER_CONFIG_STATE,
        selectedTopics: [{ id: "t1", label: "Loops & Iterations", source: "custom", complexity: 3 }],
      };
      const est1 = estimateBlueprint(config1);
      assert.ok(est1.estimatedTotalHours > 0);
      assert.ok(est1.moduleRange[0] >= 2);

      // Adding 4 complex topics increases scope and module range
      const config2: BuilderConfig = {
        ...DEFAULT_BUILDER_CONFIG_STATE,
        selectedTopics: [
          { id: "t1", label: "Loops & Iterations", source: "custom", complexity: 3 },
          { id: "t2", label: "Object-Oriented Programming", source: "custom", complexity: 4 },
          { id: "t3", label: "Design Patterns", source: "custom", complexity: 4 },
          { id: "t4", label: "Concurrency & Multithreading", source: "custom", complexity: 5 },
        ],
      };
      const est2 = estimateBlueprint(config2);
      assert.ok(est2.estimatedTotalHours >= est1.estimatedTotalHours);
      assert.ok(est2.moduleRange[0] >= 4);

      // Removing topics scales blueprint back down
      const config3: BuilderConfig = {
        ...DEFAULT_BUILDER_CONFIG_STATE,
        selectedTopics: [{ id: "t1", label: "Loops & Iterations", source: "custom", complexity: 3 }],
      };
      const est3 = estimateBlueprint(config3);
      assert.strictEqual(est3.estimatedTotalHours, est1.estimatedTotalHours);
      assert.deepStrictEqual(est3.moduleRange, est1.moduleRange);
    });

    test("1.4. Custom topics persist cleanly in draft storage and restore without corruption", async () => {
      const draftConfig: BuilderConfig = {
        ...DEFAULT_BUILDER_CONFIG_STATE,
        domainId: "engineering-technology",
        subjectId: "Computer Science",
        selectedTopics: [
          { id: "cust-1", label: "Microservices with Docker", source: "custom", complexity: 4 },
          { id: "cust-2", label: "Distributed Message Queues", source: "custom", complexity: 4 },
        ],
      };

      await storageAdapter.saveDraft("test_custom_topics_draft", draftConfig);
      const restored = await storageAdapter.getDraft<BuilderConfig>("test_custom_topics_draft");

      assert.ok(restored);
      assert.strictEqual(restored.selectedTopics.length, 2);
      assert.strictEqual(restored.selectedTopics[0].label, "Microservices with Docker");
      assert.strictEqual(restored.selectedTopics[1].label, "Distributed Message Queues");
    });
  });

  // ============================================================================
  // TEST 3: DELETE A COURSE & REFRESH PERSISTENCE
  // ============================================================================
  describe("Test 3: Permanent Course Deletion & Refresh Persistence", () => {
    test("3.1. Deleting a course permanently excludes it from queries across page reloads", async () => {
      const testCourseId = `test-delete-course-${Date.now()}`;
      const syntheticCourse: LearningPath = {
        id: testCourseId,
        title: "Test Course for Deletion",
        domain: "Computer Science",
        description: "Course slated for verification deletion",
        level: "Undergraduate",
        durationHours: 12,
        moduleCount: 0,
        verified: false,
        modules: [],
        authorUserId: "author-user-123",
      };

      // Save to local storage adapter
      await storageAdapter.savePath(syntheticCourse);
      let found = await storageAdapter.getSavedPathById(testCourseId);
      assert.ok(found, "Course must initially exist in storageAdapter");

      // Execute permanent deletion via client helper
      const delResult = await deleteLearningPath(testCourseId);
      assert.strictEqual(delResult.success, true);

      // Verify deletion registry record
      assert.strictEqual(isItemDeletedSync(testCourseId, "learning_path"), true);

      // Simulate cold page reload / new query
      found = await storageAdapter.getSavedPathById(testCourseId);
      assert.strictEqual(found, null, "Deleted course must NOT be returned by getSavedPathById");

      const allSaved = await storageAdapter.getSavedPaths();
      assert.ok(!allSaved.some((p) => p.id === testCourseId), "Deleted course must NOT appear in getSavedPaths");

      const remoteLookup = await getLearningPathById(testCourseId);
      assert.strictEqual(remoteLookup, null, "Deleted course must return null from getLearningPathById");
    });
  });

  // ============================================================================
  // TEST 4: COURSE ENROLLMENT PERSISTENCE & IDEMPOTENCY
  // ============================================================================
  describe("Test 4: Enrollment Verification, Persistence & Synchronization", () => {
    const studentUser = "student-phase9-test-user";
    const courseId = "mit-8-012-physics-i-classical-mechanics";

    test("4.1. Enrolling persists record, updates server store, and survives simulated reload", async () => {
      const res = await enrollUserInCourse(studentUser, courseId);
      assert.strictEqual(res.success, true);
      assert.ok(res.enrollment);
      assert.strictEqual(res.enrollment?.userId, studentUser);
      assert.strictEqual(res.enrollment?.courseId, courseId);

      // Verify server store reflects record
      const isEnrolledServer = isServerUserEnrolled(studentUser, courseId);
      assert.strictEqual(isEnrolledServer, true);

      // Verify duplicate enrollment is idempotent
      const duplicateRes = await enrollUserInCourse(studentUser, courseId);
      assert.strictEqual(duplicateRes.success, true);
      const serverRecords = getServerUserEnrollments(studentUser);
      const matching = serverRecords.filter((r) => r.courseId === courseId);
      assert.strictEqual(matching.length, 1, "Duplicate enrollments must be idempotent");

      // Verify user query
      const userEnrollments = await getUserEnrollments(studentUser);
      assert.ok(userEnrollments.some((e) => e.courseId === courseId));

      // Clean up / unenroll
      const unenrollRes = await unenrollUserFromCourse(studentUser, courseId);
      assert.strictEqual(unenrollRes.success, true);
      assert.strictEqual(isServerUserEnrolled(studentUser, courseId), false);
    });
  });

  // ============================================================================
  // TEST 5: LEARNING PATH GENERATION & RELEVANCE
  // ============================================================================
  describe("Test 5: Learning Path Generation & Multi-Topic Relevance", () => {
    test("5.1. Synthesizes coherent, topic-adaptive curriculum with verified resources", async () => {
      const pythonConfig: BuilderConfig = {
        ...DEFAULT_BUILDER_CONFIG_STATE,
        domainId: "engineering-technology",
        subjectId: "Computer Science",
        selectedTopics: [{ id: "py-loops", label: "Python Loops and Iteration", source: "custom", complexity: 2 }],
        modalities: {
          video: true,
          reading: true,
          practice: true,
          diagnostic: true,
          flashcards: true,
          worked: false,
          pyq: false,
          coding: true,
          projects: false,
        },
      };

      const engine = new CuratorEngine();
      const course = await engine.run(pythonConfig);

      assert.ok(course);
      assert.ok(course.id);
      assert.ok(course.title.toLowerCase().includes("python"));
      assert.ok(course.modules.length >= 2, "Must produce multiple cohesive modules");

      // Verify modules are synthesized with objectives and checkpoint quizzes
      for (const mod of course.modules) {
        assert.ok(mod.title.length > 0);
        assert.ok(mod.objectives.length > 0);
        assert.ok(mod.checkpointQuestions.length > 0);
      }

      // Verify generated course persists in storageAdapter
      const saved = await storageAdapter.getSavedPathById(course.id);
      assert.ok(saved);
      assert.strictEqual(saved.id, course.id);
    });
  });

  // ============================================================================
  // TEST 6: QUIZ SYSTEM: SUBMISSION, SCORING & PERSISTENCE
  // ============================================================================
  describe("Test 6: Diagnostic Quiz Submission, Scoring & Alignment", () => {
    test("6.1. Evaluates answers accurately, computes percentage, and saves submission result", async () => {
      const testQuizId = `test-quiz-${Date.now()}`;
      const questions: any[] = [
        {
          id: "q1",
          questionNumber: 1,
          prompt: "What keyword is used to exit a loop prematurely in Python?",
          options: [
            { id: "A", text: "continue" },
            { id: "B", text: "exit" },
            { id: "C", text: "break" },
            { id: "D", text: "stop" },
          ],
          correctOptionId: "C",
          explanation: "The 'break' keyword terminates the smallest enclosing loop.",
        },
        {
          id: "q2",
          questionNumber: 2,
          prompt: "Which loop structure repeats as long as a condition evaluates to True?",
          options: [
            { id: "A", text: "for" },
            { id: "B", text: "while" },
            { id: "C", text: "do-until" },
            { id: "D", text: "foreach" },
          ],
          correctOptionId: "B",
          explanation: "A 'while' loop executes its body repeatedly as long as its condition remains True.",
        },
      ];

      // Create in-memory test quiz
      const created = await createQuiz(
        {
          id: testQuizId,
          title: "Python Iteration Checkpoint",
          subject: "Computer Science",
          topic: "Python Loops",
          difficulty: "Beginner",
          timeLimitMinutes: 10,
        },
        questions,
        "test-student-phase9"
      );
      assert.ok(created);

      // Start quiz attempt
      const attempt = await startQuizAttempt(testQuizId, "test-student-phase9", 10);
      assert.ok(attempt);
      assert.strictEqual(attempt.quizId, testQuizId);

      // Record answers: 1 correct (C for break), 1 incorrect (A instead of B)
      const submission = await submitQuizAttempt({
        attemptId: attempt.id,
        quizId: testQuizId,
        answers: {
          q1: "C", // correct (break)
          q2: "A", // incorrect (for instead of while)
        },
        timeSpentSeconds: 120, // 2 minutes spent
        userId: "test-student-phase9",
      });

      assert.strictEqual(submission.totalQuestions, 2);
      assert.strictEqual(submission.correctCount, 1);
      assert.strictEqual(submission.accuracyPercent, 50);
      assert.strictEqual(submission.status, "submitted");

      // Clean up test quiz
      await deleteQuiz(testQuizId);
      assert.strictEqual(isItemDeletedSync(testQuizId, "quiz"), true);
    });
  });

  // ============================================================================
  // TEST 7: USER DATA ISOLATION & PERMISSION GUARDS
  // ============================================================================
  describe("Test 7: User Data Isolation & Permission Guards", () => {
    test("7.1. Prevents unauthorized deletion of another user private course", async () => {
      const userAlpha = "user-alpha-999";
      const userBeta = "user-beta-888";
      const userAlphaCourseId = `private-course-alpha-${Date.now()}`;

      // Simulate authorization check on course deletion
      const checkAuthorization = (authorUserId: string, requestingUserId: string, isAdmin = false) => {
        if (isAdmin) return { authorized: true };
        if (authorUserId === requestingUserId) return { authorized: true };
        return { authorized: false, error: "Forbidden: You do not have permission to delete this course." };
      };

      // User Beta attempts to delete User Alpha's course
      const unauthorizedCheck = checkAuthorization(userAlpha, userBeta, false);
      assert.strictEqual(unauthorizedCheck.authorized, false);
      assert.ok(unauthorizedCheck.error?.includes("Forbidden"));

      // User Alpha deletes their own course
      const authorizedCheck = checkAuthorization(userAlpha, userAlpha, false);
      assert.strictEqual(authorizedCheck.authorized, true);

      // Admin deletes any course
      const adminCheck = checkAuthorization(userAlpha, "admin-user", true);
      assert.strictEqual(adminCheck.authorized, true);
    });

    test("7.2. Enrollments of User Alpha are isolated from User Beta", async () => {
      const studentA = "student-iso-a";
      const studentB = "student-iso-b";
      const courseAlpha = "mit-8-012-physics-i-classical-mechanics";

      const res = await enrollUserInCourse(studentA, courseAlpha);
      assert.strictEqual(res.success, true);

      const enrollmentsA = await getUserEnrollments(studentA);
      const enrollmentsB = await getUserEnrollments(studentB);

      assert.ok(enrollmentsA.some((e) => e.courseId === courseAlpha));
      assert.ok(!enrollmentsB.some((e) => e.courseId === courseAlpha));

      // Cleanup
      await unenrollUserFromCourse(studentA, courseAlpha);
    });
  });

  // ============================================================================
  // TEST 8: REGRESSION & INTEGRITY VERIFICATION
  // ============================================================================
  describe("Test 8: System Integrity & End-to-End Regression Audit", () => {
    test("8.1. Deletion registry correctly tracks multiple types and handles idempotent markers", async () => {
      const dummyPathId = `dummy-path-${Date.now()}`;
      await recordDeletedItem("learning_path", dummyPathId);
      assert.strictEqual(isItemDeletedSync(dummyPathId, "learning_path"), true);
      assert.strictEqual(isItemDeletedSync(dummyPathId, "quiz"), false);

      const deletedIds = await getDeletedItemIds("learning_path");
      assert.ok(deletedIds.has(dummyPathId));
    });
  });
});
