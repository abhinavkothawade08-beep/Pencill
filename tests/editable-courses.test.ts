import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  UpdateCourseSchema,
  UpdateModuleInputSchema,
  UpdateLessonInputSchema,
} from '../src/lib/api-schemas';
import {
  updateFullLearningPath,
  saveLearningPath,
  getLearningPathById,
} from '../src/services/supabase/pathService';
import { storageAdapter } from '../src/lib/storage/storageAdapter';
import { LearningPath, Module, Lesson } from '../src/types';

describe('Editable Courses: Zod Schemas & Validation', () => {
  test('UpdateLessonInputSchema accepts valid lesson payloads', () => {
    const validLesson = {
      id: 'les-test-1',
      title: 'Introduction to Dynamic Programming',
      type: 'video',
      durationMinutes: 25,
      sourceName: 'MIT OpenCourseWare',
      sourceUrl: 'https://youtube.com/watch?v=example1',
      orderIndex: 0,
      summaryPoints: ['Overlapping subproblems', 'Optimal substructure'],
      studyNotes: [
        {
          id: 'note-1',
          title: 'Dynamic Programming Monograph',
          description: 'Comprehensive analysis of memoization vs tabulation.',
          readingMinutes: 15,
        },
      ],
      verificationStatus: 'verified',
    };

    const parsed = UpdateLessonInputSchema.safeParse(validLesson);
    assert.strictEqual(parsed.success, true, 'Valid lesson must parse successfully');
    if (parsed.success) {
      assert.strictEqual(parsed.data.title, 'Introduction to Dynamic Programming');
      assert.strictEqual(parsed.data.durationMinutes, 25);
      assert.strictEqual(parsed.data.type, 'video');
    }
  });

  test('UpdateLessonInputSchema rejects invalid modality types', () => {
    const invalidLesson = {
      title: 'Invalid Modality Lesson',
      type: 'podcast', // Invalid modality
      durationMinutes: 15,
    };

    const parsed = UpdateLessonInputSchema.safeParse(invalidLesson);
    assert.strictEqual(parsed.success, false, 'Should reject unsupported modality');
  });

  test('UpdateModuleInputSchema accepts valid module with nested lessons', () => {
    const validModule = {
      id: 'mod-test-1',
      title: 'Advanced Dynamic Programming & Memoization',
      moduleNumber: 1,
      orderIndex: 0,
      objective: 'Master bottom-up and top-down DP state formulations',
      lessons: [
        {
          id: 'les-1',
          title: 'Memoization Patterns',
          type: 'reading',
          durationMinutes: 20,
        },
      ],
    };

    const parsed = UpdateModuleInputSchema.safeParse(validModule);
    assert.strictEqual(parsed.success, true, 'Valid module must parse');
    if (parsed.success) {
      assert.strictEqual(parsed.data.title, 'Advanced Dynamic Programming & Memoization');
      assert.strictEqual(parsed.data.lessons?.length, 1);
    }
  });

  test('UpdateCourseSchema validates full course update payload', () => {
    const validCourseUpdate = {
      title: 'Complete Algorithms Masterclass: Theory & Applications',
      description: 'A comprehensive curriculum covering graph theory, DP, and greedy algorithms.',
      domain: 'Computer Science',
      level: 'Advanced',
      durationHours: 35,
      tags: ['Algorithms', 'Data Structures', 'Competitive Programming'],
      syllabusNote: 'Rigorous mathematical analysis with asymptotic proof standards.',
      modules: [
        {
          id: 'mod-1',
          title: 'Foundations of Algorithm Analysis',
          moduleNumber: 1,
          orderIndex: 0,
          lessons: [
            {
              id: 'les-1',
              title: 'Big-O Notation and Recurrence Relations',
              type: 'video',
              durationMinutes: 30,
              sourceName: 'MIT OCW',
            },
          ],
        },
      ],
    };

    const parsed = UpdateCourseSchema.safeParse(validCourseUpdate);
    assert.strictEqual(parsed.success, true, 'Valid course update must parse');
  });

  test('UpdateCourseSchema enforces minimum string length and positive duration', () => {
    const invalidTitle = {
      title: '', // Empty title
    };
    assert.strictEqual(UpdateCourseSchema.safeParse(invalidTitle).success, false);

    const invalidDuration = {
      durationHours: -5, // Negative duration
    };
    assert.strictEqual(UpdateCourseSchema.safeParse(invalidDuration).success, false);
  });
});

describe('Editable Courses: updateFullLearningPath Service & Persistence', () => {
  const testCourseId = 'course-editable-unit-test-101';
  const initialAuthorId = 'user-author-42';

  const mockInitialPath: LearningPath = {
    id: testCourseId,
    title: 'Modern Distributed Systems',
    description: 'Foundations of distributed consensus, Raft, Paxos, and replication.',
    domain: 'Computer Science',
    level: 'Advanced',
    durationHours: 24,
    moduleCount: 2,
    verified: true,
    tags: ['Distributed Systems', 'Consensus'],
    authorUserId: initialAuthorId,
    syllabusNote: 'Focus on network partitions and Byzantine fault tolerance.',
    modules: [
      {
        id: 'mod-dist-1',
        pathId: testCourseId,
        title: 'Module 1: Replication and Consistency',
        moduleNumber: 1,
        orderIndex: 0,
        status: 'completed',
        objective: 'Understand sequential and linearizable consistency.',
        totalResources: 2,
        completedResources: 0,
        lessons: [
          {
            id: 'les-dist-101',
            moduleId: 'mod-dist-1',
            title: 'Linearizability vs Eventual Consistency',
            type: 'video',
            durationMinutes: 20,
            sourceName: 'Martin Kleppmann Lectures',
            sourceUrl: 'https://youtube.com/watch?v=kleppmann1',
            orderIndex: 0,
            summaryPoints: ['Total ordering of operations', 'CAP theorem trade-offs'],
            verificationStatus: 'verified',
          },
          {
            id: 'les-dist-102',
            moduleId: 'mod-dist-1',
            title: 'Raft Consensus Protocol Reading',
            type: 'reading',
            durationMinutes: 30,
            sourceName: 'Stanford In Search of an Understandable Consensus Algorithm',
            orderIndex: 1,
            summaryPoints: ['Leader election', 'Log replication', 'Safety invariants'],
            verificationStatus: 'verified',
          },
        ],
      },
      {
        id: 'mod-dist-2',
        pathId: testCourseId,
        title: 'Module 2: Byzantine Fault Tolerance',
        moduleNumber: 2,
        orderIndex: 1,
        status: 'locked',
        objective: 'Master PBFT and modern BFT consensus protocols.',
        totalResources: 1,
        completedResources: 0,
        lessons: [
          {
            id: 'les-dist-201',
            moduleId: 'mod-dist-2',
            title: 'Practical Byzantine Fault Tolerance (Castro & Liskov)',
            type: 'reading',
            durationMinutes: 45,
            sourceName: 'MIT LCS Monograph',
            orderIndex: 0,
            verificationStatus: 'verified',
          },
        ],
      },
    ],
  };

  test('setup: saves initial test path into store', async () => {
    const saved = await saveLearningPath(mockInitialPath);
    assert.ok(saved);
    const retrieved = await getLearningPathById(testCourseId);
    assert.strictEqual(retrieved?.id, testCourseId);
    assert.strictEqual(retrieved?.title, 'Modern Distributed Systems');
  });

  test('Course-Level Editing: updates title, description, level, and tags', async () => {
    const updateInput = {
      title: 'Modern Distributed Systems & Cloud Infrastructure',
      description: 'Updated comprehensive curriculum covering consensus, Raft, Paxos, and geo-replication.',
      level: 'Mastery' as const,
      durationHours: 30,
      tags: ['Distributed Systems', 'Consensus', 'Cloud Architecture', 'Fault Tolerance'],
      syllabusNote: 'Updated pedagogical advisory with practical TLA+ specification lab.',
    };

    const result = await updateFullLearningPath(testCourseId, updateInput, {
      userId: initialAuthorId,
    });

    assert.ok(result.success, 'Update should succeed');
    if (!result.success) return;

    assert.strictEqual(result.course.title, updateInput.title);
    assert.strictEqual(result.course.description, updateInput.description);
    assert.strictEqual(result.course.level, 'Mastery');
    assert.strictEqual(result.course.durationHours, 30);
    assert.deepStrictEqual(result.course.tags, updateInput.tags);
    assert.strictEqual(result.course.syllabusNote, updateInput.syllabusNote);
    assert.ok(result.course.updatedAt, 'Must set updatedAt timestamp');

    // Verify storage persistence
    const loaded = await getLearningPathById(testCourseId);
    assert.strictEqual(loaded?.title, updateInput.title);
    assert.strictEqual(loaded?.tags?.length, 4);
  });

  test('Module-Level Editing: reorders modules, updates title, and adds new module', async () => {
    const current = await getLearningPathById(testCourseId);
    assert.ok(current?.modules && current.modules.length >= 2);
    if (!current?.modules) throw new Error('Modules not found');

    // Swap module 1 and module 2, update title of module 1, and add module 3
    const updatedModules = [
      {
        id: current.modules[1].id,
        title: 'Module 1: Advanced BFT & Asynchronous Consensus',
        moduleNumber: 1,
        orderIndex: 0,
        objective: current.modules[1].objective,
        status: current.modules[1].status,
        lessons: current.modules[1].lessons,
      },
      {
        id: current.modules[0].id,
        title: current.modules[0].title,
        moduleNumber: 2,
        orderIndex: 1,
        objective: current.modules[0].objective,
        status: current.modules[0].status,
        lessons: current.modules[0].lessons,
      },
      {
        id: 'mod-dist-3-new',
        title: 'Module 3: Real-World Distributed Storage Engines',
        moduleNumber: 3,
        orderIndex: 2,
        objective: 'Study Spanner, CockroachDB, and Dynamo architecture.',
        status: 'locked' as const,
        lessons: [
          {
            id: 'les-dist-301',
            title: 'Google Spanner TrueTime Deep Dive',
            type: 'video' as const,
            durationMinutes: 20,
            sourceName: 'Google Research Talks',
            orderIndex: 0,
            verificationStatus: 'user_added',
          },
        ],
      },
    ];

    const result = await updateFullLearningPath(
      testCourseId,
      { modules: updatedModules },
      { userId: initialAuthorId }
    );

    assert.ok(result.success);
    if (!result.success) return;

    assert.strictEqual(result.course.modules?.length, 3, 'Course should now have 3 modules');
    assert.strictEqual(result.course.modules[0].id, 'mod-dist-2', 'First module should be mod-dist-2');
    assert.strictEqual(result.course.modules[0].title, 'Module 1: Advanced BFT & Asynchronous Consensus');
    assert.strictEqual(result.course.modules[2].id, 'mod-dist-3-new', 'Third module should be new module');
  });

  test('Lesson-Level Editing: updates lesson attributes and rich study notes', async () => {
    const current = await getLearningPathById(testCourseId);
    assert.ok(current?.modules && current.modules.length > 0);
    if (!current?.modules) throw new Error('Modules not found');

    // Target the first module (which now has les-dist-201)
    const targetMod = current.modules[0];
    const updatedLessons = [
      {
        id: 'les-dist-201',
        moduleId: targetMod.id,
        title: 'Practical Byzantine Fault Tolerance: Theory, Proofs & Implementation',
        type: 'reading' as const,
        durationMinutes: 50,
        sourceName: 'ACM Transactions on Computer Systems (TOCS)',
        sourceUrl: 'https://pmg.csail.mit.edu/papers/osdi99.pdf',
        orderIndex: 0,
        summaryPoints: [
          '3f + 1 node replica requirement',
          'Pre-prepare, prepare, and commit phases',
          'View change protocol and garbage collection',
        ],
        studyNotes: [
          {
            id: 'note-pbft-custom',
            title: 'PBFT Monograph & Formal Proof Notes',
            description: 'Essential mathematical derivation of Byzantine quorum boundaries.',
            readingMinutes: 20,
            contentMarkdown: '# PBFT Formal Analysis\n\n## Quorum Intersection Proof\nWhy 3f + 1 replicas are required for tolerance of f Byzantine failures.',
          } as any,
        ],
        verificationStatus: 'verified',
      },
      {
        id: 'les-dist-202-new',
        moduleId: targetMod.id,
        title: 'PBFT Hands-on Rust Implementation',
        type: 'practice' as const,
        durationMinutes: 40,
        sourceName: 'Verified Academic Lab',
        orderIndex: 1,
        verificationStatus: 'user_added',
        isUserCreated: true,
      },
    ];

    const updatedModules = current.modules.map((m) => ({
      id: m.id,
      title: m.title,
      moduleNumber: m.moduleNumber,
      orderIndex: m.orderIndex,
      status: m.status,
      objective: m.objective,
      lessons: m.id === targetMod.id ? updatedLessons : m.lessons,
    }));

    const result = await updateFullLearningPath(
      testCourseId,
      { modules: updatedModules },
      { userId: initialAuthorId }
    );

    assert.ok(result.success);
    if (!result.success) return;

    const mod1 = result.course.modules?.find((m) => m.id === targetMod.id);
    assert.strictEqual(mod1?.lessons?.length, 2);
    
    // Validate updated attributes
    const lesson1 = mod1?.lessons?.[0];
    assert.strictEqual(lesson1?.title, 'Practical Byzantine Fault Tolerance: Theory, Proofs & Implementation');
    assert.strictEqual(lesson1?.durationMinutes, 50);
    assert.strictEqual(lesson1?.sourceUrl, 'https://pmg.csail.mit.edu/papers/osdi99.pdf');
    assert.strictEqual(lesson1?.studyNotes?.[0]?.title, 'PBFT Monograph & Formal Proof Notes');

    // Validate new user-added lesson
    const lesson2 = mod1?.lessons?.[1];
    assert.strictEqual(lesson2?.id, 'les-dist-202-new');
    assert.strictEqual(lesson2?.verificationStatus, 'user_added');
    assert.strictEqual(lesson2?.type, 'practice');
  });

  test('Module Deletion: removes specified module and safely reindexes', async () => {
    const current = await getLearningPathById(testCourseId);
    assert.ok(current?.modules);
    if (!current?.modules) throw new Error('Modules not found');
    assert.strictEqual(current.modules.length, 3);

    // Remove the newly added 3rd module
    const remainingModules = current.modules
      .filter((m) => m.id !== 'mod-dist-3-new')
      .map((m, idx) => ({
        id: m.id,
        title: m.title,
        moduleNumber: idx + 1,
        orderIndex: idx,
        status: m.status,
        objective: m.objective,
        lessons: m.lessons,
      }));

    const result = await updateFullLearningPath(
      testCourseId,
      { modules: remainingModules },
      { userId: initialAuthorId }
    );

    assert.ok(result.success);
    if (!result.success) return;

    assert.strictEqual(result.course.modules?.length, 2);
    assert.strictEqual(result.course.modules[0].moduleNumber, 1);
    assert.strictEqual(result.course.modules[1].moduleNumber, 2);
    assert.ok(result.course.modules.every((m) => m.id !== 'mod-dist-3-new'));
  });

  test('Authorization Enforcement: prevents unauthorized stranger from modifying course', async () => {
    const strangerUserId = 'user-unauthorized-999';

    const result = await updateFullLearningPath(
      testCourseId,
      { title: 'Hacked Course Title by Stranger' },
      { userId: strangerUserId, isAdmin: false }
    );

    assert.strictEqual(result.success, false, 'Must reject unauthorized stranger update');
    assert.strictEqual(result.status, 403, 'Must return 403 status code');
    assert.ok(result.error?.includes('Forbidden'), 'Error must contain Forbidden notice');

    // Verify course title was NOT altered
    const unchanged = await getLearningPathById(testCourseId);
    assert.notStrictEqual(unchanged?.title, 'Hacked Course Title by Stranger');
  });

  test('Authorization Enforcement: allows platform Admin to update any course', async () => {
    const adminUserId = 'admin-user-007';

    const result = await updateFullLearningPath(
      testCourseId,
      { syllabusNote: 'Admin certified pedagogical quality review.' },
      { userId: adminUserId, isAdmin: true }
    );

    assert.ok(result.success);
    if (!result.success) return;

    assert.strictEqual(result.course.syllabusNote, 'Admin certified pedagogical quality review.');
  });

  test('Zero-Regeneration Invariant: preserves user learning progress and lesson IDs', async () => {
    // 1. Set progress on lesson les-dist-201
    await storageAdapter.updateProgress(testCourseId, {
      completedLessonIds: ['les-dist-201'],
      hoursLogged: 2,
    });

    const progBefore = await storageAdapter.getProgress(testCourseId);
    assert.ok(progBefore?.completedLessonIds.includes('les-dist-201'));

    // 2. Perform a curriculum edit (modifying course level and tags)
    await updateFullLearningPath(
      testCourseId,
      { level: 'Expert', tags: ['Distributed Systems', 'BFT', 'High Availability'] },
      { userId: initialAuthorId }
    );

    // 3. Verify that les-dist-201 still exists and progress remains intact
    const refreshedCourse = await getLearningPathById(testCourseId);
    const allLessonIds = refreshedCourse?.modules?.flatMap((m) =>
      (m.lessons || []).map((l) => l.id)
    );
    assert.ok(allLessonIds?.includes('les-dist-201'), 'Original completed lesson ID must remain preserved');

    const progAfter = await storageAdapter.getProgress(testCourseId);
    assert.ok(
      progAfter?.completedLessonIds.includes('les-dist-201'),
      'Learner completed progress must not be lost after course edits'
    );
  });
});
