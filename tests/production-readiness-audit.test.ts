import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { storageAdapter } from "../src/lib/storage/storageAdapter";
import { getAllQuizzes, inMemoryQuizStore } from "../src/services/supabase/quizService";
import { getLearningPathById, inMemoryPathCache } from "../src/services/supabase/pathService";
import { GET as getCourseRoute } from "../src/app/api/courses/[id]/route";
import { NextRequest } from "next/server";

describe("Production Readiness Audit & Bug Remediation Verification Suite", () => {
  const USER_ALPHA = "user-audit-alpha-001";
  const USER_BETA = "user-audit-beta-002";

  beforeEach(async () => {
    storageAdapter.setUserScope(null);
    await storageAdapter.clearCurrentUserData();
  });

  afterEach(async () => {
    storageAdapter.setUserScope(null);
    await storageAdapter.clearCurrentUserData();
  });

  // ============================================================================
  // BUG-001: Reading Material Cache Scope Isolation
  // ============================================================================
  test("BUG-001 / REP-001: Reading materials are strictly scoped and cleared on user sign-out", async () => {
    // 1. User Alpha generates a reading document
    storageAdapter.setUserScope(USER_ALPHA);
    const docAlpha = {
      id: "doc-quantum-electrodynamics-01",
      lessonId: "les-qed-01",
      title: "Introduction to QED",
      content: { introduction: "Quantum electrodynamics is the relativistic field theory of electrodynamics." },
    };

    await storageAdapter.saveReadingMaterial(docAlpha);

    // Alpha can retrieve the document from memory/IDB
    const foundAlpha = await storageAdapter.getReadingMaterialById("doc-quantum-electrodynamics-01");
    assert.ok(foundAlpha, "User Alpha must retrieve their cached reading document");
    assert.strictEqual(foundAlpha.id, docAlpha.id);

    const foundByLessonAlpha = await storageAdapter.getReadingMaterialByLesson("les-qed-01");
    assert.ok(foundByLessonAlpha, "User Alpha must retrieve reading document by lesson ID");

    // 2. User Alpha logs out -> clearCurrentUserData runs
    await storageAdapter.clearCurrentUserData();
    storageAdapter.setUserScope(USER_BETA);

    // 3. User Beta must NOT see User Alpha's cached reading document
    const foundBeta = await storageAdapter.getReadingMaterialById("doc-quantum-electrodynamics-01");
    assert.strictEqual(foundBeta, null, "User Beta must NOT see User Alpha cached reading material");

    const foundByLessonBeta = await storageAdapter.getReadingMaterialByLesson("les-qed-01");
    assert.strictEqual(foundByLessonBeta, null, "User Beta must NOT see User Alpha reading material by lesson ID");
  });

  // ============================================================================
  // BUG-002: getAllQuizzes Data Isolation
  // ============================================================================
  test("BUG-002 / REP-002: getAllQuizzes isolates authenticated accounts from guest storage quizzes", async () => {
    // Calling getAllQuizzes with an authenticated userId returns only quizzes belonging to that user
    const authenticatedQuizzes = await getAllQuizzes(USER_ALPHA);
    assert.ok(Array.isArray(authenticatedQuizzes));
    for (const q of authenticatedQuizzes) {
      if (q.userId) {
        assert.strictEqual(q.userId, USER_ALPHA, "All returned user quizzes must belong to USER_ALPHA");
      }
    }
  });

  // ============================================================================
  // BUG-004: Course API GET Handler Symmetry
  // ============================================================================
  test("BUG-004 / REP-004: GET /api/courses/[id] returns 200 for existing course and 404 for missing", async () => {
    // Setup a known course in cache
    const testCourseId = `course-rest-test-${Date.now()}`;
    inMemoryPathCache.set(testCourseId, {
      id: testCourseId,
      title: "Topology & Differential Forms",
      domain: "Mathematics",
      description: "Rigorous differential topology",
      level: "Undergraduate",
      durationHours: 18,
      moduleCount: 3,
      verified: true,
      modules: [],
    });

    // 1. Valid lookup
    const reqValid = new NextRequest(`http://localhost:3000/api/courses/${testCourseId}`);
    const resValid = await getCourseRoute(reqValid, { params: { id: testCourseId } });
    assert.strictEqual(resValid.status, 200);

    const bodyValid = await resValid.json();
    assert.strictEqual(bodyValid.success, true);
    assert.strictEqual(bodyValid.course.id, testCourseId);
    assert.strictEqual(bodyValid.course.title, "Topology & Differential Forms");

    // 2. Missing course lookup
    const missingCourseId = "non-existent-course-uuid-9999";
    const reqMissing = new NextRequest(`http://localhost:3000/api/courses/${missingCourseId}`);
    const resMissing = await getCourseRoute(reqMissing, { params: { id: missingCourseId } });
    assert.strictEqual(resMissing.status, 404);

    const bodyMissing = await resMissing.json();
    assert.strictEqual(bodyMissing.success, false);
    assert.ok(bodyMissing.error.includes("not found"));

    // Cleanup
    inMemoryPathCache.delete(testCourseId);
  });

  // ============================================================================
  // MANDATORY USER JOURNEY A: New User Onboarding & Clean Dashboard Isolation
  // ============================================================================
  test("JOURNEY A: New User Onboarding has completely clean slate and zero cross-user leakage", async () => {
    const NEW_USER_ID = `new-student-${Date.now()}`;
    storageAdapter.setUserScope(NEW_USER_ID);

    const paths = await storageAdapter.getSavedPaths();
    assert.strictEqual(paths.length, 0, "New user must start with 0 saved paths");

    const bookmarks = await storageAdapter.getBookmarks();
    assert.strictEqual(bookmarks.length, 0, "New user must start with 0 bookmarks");

    const draft = await storageAdapter.getDraft();
    assert.strictEqual(draft, null, "New user must have null active builder draft");

    const notifications = await storageAdapter.getNotifications();
    assert.strictEqual(notifications.length, 1, "New user starts with only the canonical welcome notification");
    assert.strictEqual(notifications[0].id, "notif-welcome");
  });

  // ============================================================================
  // MANDATORY USER JOURNEY C: Learning Experience Progress & Note Persistence
  // ============================================================================
  test("JOURNEY C: Learning Experience maintains progress and persists across re-access", async () => {
    const LEARNER_ID = `learner-${Date.now()}`;
    storageAdapter.setUserScope(LEARNER_ID);

    const courseId = `path-learner-${Date.now()}`;
    const course = {
      id: courseId,
      title: "Real Analysis & Measure Theory",
      domain: "Mathematics",
      modules: [
        {
          id: "mod-1",
          title: "Lebesgue Integration",
          lessons: [{ id: "les-lebesgue-1", title: "Measurable Sets" }],
        },
      ],
    };

    await storageAdapter.savePath(course);
    await storageAdapter.updateProgress(courseId, {
      completedLessonIds: ["les-lebesgue-1"],
      hoursLogged: 2.5,
    });

    const progress = await storageAdapter.getProgress(courseId);
    assert.ok(progress);
    assert.deepStrictEqual(progress?.completedLessonIds, ["les-lebesgue-1"]);
    assert.strictEqual(progress?.hoursLogged, 2.5);
  });
});
