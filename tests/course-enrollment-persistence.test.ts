import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";
import {
  getUserEnrollments,
  enrollUserInCourse,
  unenrollUserFromCourse,
  isUserEnrolled,
  getGuestEnrollments,
  saveGuestEnrollments,
} from "../src/services/supabase/enrollmentService";
import {
  getServerUserEnrollments,
  addServerEnrollment,
  removeServerEnrollment,
  readServerEnrollments,
  writeServerEnrollments,
} from "../src/services/supabase/serverEnrollmentStore";
import { recordDeletedItem, clearDeletionRegistryForTesting } from "../src/services/supabase/deletionRegistry";
import { inMemoryPathCache } from "../src/services/supabase/pathService";
import { LearningPath } from "../src/types";

describe("Course Enrollment: Persistence, Verification & Synchronization", () => {
  const userA = "test-learner-alice-uuid-001";
  const userB = "test-learner-bob-uuid-002";
  const validCourseId = "oops-in-python-programming-langu-mv9rshpy";
  const secondCourseId = "fine-tuning-of-ai-model-study-sy-mv9dt7cf";
  const fakeCourseId = "non-existent-course-uuid-999";

  const sampleCourse1: LearningPath = {
    id: validCourseId,
    title: "Oops in python programming language . Study Syllabus",
    description: "A structured academic study syllabus covering core OOP theory.",
    domain: "Computer Science",
    level: "Undergraduate",
    durationHours: 25,
    moduleCount: 3,
    verified: true,
    enrolledCount: 0,
    averageCompletion: "0%",
    modules: [
      {
        id: "mod-1",
        pathId: validCourseId,
        title: "Foundations of Oops in python programming language",
        moduleNumber: 1,
        orderIndex: 0,
        status: "in_progress",
        totalResources: 4,
        completedResources: 0,
        lessons: [],
      },
    ],
  };

  const sampleCourse2: LearningPath = {
    id: secondCourseId,
    title: "Fine Tuning of AI Model Study Syllabus",
    description: "Deep dive into model fine tuning architectures and alignment.",
    domain: "Computer Science",
    level: "Undergraduate",
    durationHours: 30,
    moduleCount: 2,
    verified: true,
    enrolledCount: 0,
    averageCompletion: "0%",
    modules: [],
  };

  beforeEach(() => {
    clearDeletionRegistryForTesting();
    inMemoryPathCache.set(validCourseId, sampleCourse1);
    inMemoryPathCache.set(secondCourseId, sampleCourse2);

    // Clean up test enrollments in server store
    const existing = readServerEnrollments();
    const cleaned = existing.filter((e) => e.userId !== userA && e.userId !== userB);
    writeServerEnrollments(cleaned);
  });

  test("1. Enrolling in a valid course creates a persistent record with user ID and course ID", async () => {
    const res = await enrollUserInCourse(userA, validCourseId);
    assert.strictEqual(res.success, true, "Enrollment should succeed for valid course");
    assert.ok(res.enrollment, "Enrollment record should be returned");
    assert.strictEqual(res.enrollment?.userId, userA);
    assert.strictEqual(res.enrollment?.courseId, validCourseId);
    assert.strictEqual(res.enrollment?.completionStatus, "in_progress");

    // Verify retrieval via getUserEnrollments
    const enrollments = await getUserEnrollments(userA);
    assert.strictEqual(enrollments.length, 1);
    assert.strictEqual(enrollments[0].courseId, validCourseId);
    assert.ok(enrollments[0].course, "Course details must be attached");
    assert.strictEqual(enrollments[0].course?.id, validCourseId);
    assert.ok(enrollments[0].course?.title.includes("Oops in python"), "Course title must match");
  });

  test("2. Duplicate enrollment is prevented (idempotent)", async () => {
    const first = await enrollUserInCourse(userA, validCourseId);
    assert.strictEqual(first.success, true);

    // Second attempt to enroll in same course
    const second = await enrollUserInCourse(userA, validCourseId);
    assert.strictEqual(second.success, true);

    const enrollments = await getUserEnrollments(userA);
    assert.strictEqual(enrollments.length, 1, "Must not create duplicate enrollment records");
  });

  test("3. Multi-user isolation: User A enrollments are isolated from User B", async () => {
    // Enroll User A in course 1
    await enrollUserInCourse(userA, validCourseId);
    // Enroll User B in course 2
    await enrollUserInCourse(userB, secondCourseId);

    const enrollmentsA = await getUserEnrollments(userA);
    const enrollmentsB = await getUserEnrollments(userB);

    assert.strictEqual(enrollmentsA.length, 1);
    assert.strictEqual(enrollmentsA[0].courseId, validCourseId);
    assert.strictEqual(enrollmentsA[0].userId, userA);

    assert.strictEqual(enrollmentsB.length, 1);
    assert.strictEqual(enrollmentsB[0].courseId, secondCourseId);
    assert.strictEqual(enrollmentsB[0].userId, userB);

    // Neither user sees the other's enrolled course
    assert.strictEqual(enrollmentsA.some((e) => e.courseId === secondCourseId), false);
    assert.strictEqual(enrollmentsB.some((e) => e.courseId === validCourseId), false);
  });

  test("4. Unenrolling removes the course from My Courses", async () => {
    await enrollUserInCourse(userA, validCourseId);
    let enrollments = await getUserEnrollments(userA);
    assert.strictEqual(enrollments.length, 1);

    const unenrollRes = await unenrollUserFromCourse(userA, validCourseId);
    assert.strictEqual(unenrollRes.success, true);

    enrollments = await getUserEnrollments(userA);
    assert.strictEqual(enrollments.length, 0, "Enrolled courses should be empty after unenrollment");

    const isEnrolled = await isUserEnrolled(userA, validCourseId);
    assert.strictEqual(isEnrolled, false);
  });

  test("5. Enrolling in a non-existent course returns a clear error message", async () => {
    const res = await enrollUserInCourse(userA, fakeCourseId);
    assert.strictEqual(res.success, false);
    assert.ok(res.error, "Should provide an informative error message");
    assert.ok(res.error?.includes("does not exist"), "Error message should mention course does not exist");
  });

  test("6. Enrolled courses display accurate modules, duration, and level", async () => {
    await enrollUserInCourse(userA, validCourseId);
    const enrollments = await getUserEnrollments(userA);
    assert.strictEqual(enrollments.length, 1);

    const course = enrollments[0].course;
    assert.ok(course);
    assert.strictEqual(course?.domain, "Computer Science");
    assert.strictEqual(course?.level, "Undergraduate");
    assert.ok((course?.moduleCount || 0) >= 1, "Must have modules");
    assert.ok(Array.isArray(course?.modules), "Modules array must be present");
  });

  test("7. Deleted courses are automatically excluded from enrolled courses", async () => {
    await enrollUserInCourse(userA, validCourseId);
    let enrollments = await getUserEnrollments(userA);
    assert.strictEqual(enrollments.length, 1);

    // Simulate course deletion in deletion registry
    await recordDeletedItem("learning_path", validCourseId);

    // Re-query enrollments
    enrollments = await getUserEnrollments(userA);
    assert.strictEqual(enrollments.length, 0, "Deleted course must not appear in enrolled courses");
  });

  test("8. Application restart simulation: enrollment persists across reloads", async () => {
    await enrollUserInCourse(userA, validCourseId);

    // Verify it was written to persistent server store
    const serverRecords = getServerUserEnrollments(userA);
    assert.strictEqual(serverRecords.length, 1);
    assert.strictEqual(serverRecords[0].courseId, validCourseId);

    // Simulate new request / cold read
    const reloaded = await getUserEnrollments(userA);
    assert.strictEqual(reloaded.length, 1);
    assert.strictEqual(reloaded[0].courseId, validCourseId);
  });
});
