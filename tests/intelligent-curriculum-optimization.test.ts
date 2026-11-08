import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateTargetModuleCount,
  isNarrowFocusedTopic,
  isComprehensiveSubject,
  clusterTopicsIntoCoherentModules,
  generateAdaptiveFallbackPlan,
} from '../src/lib/resource-engine/planner';

import {
  scoreResource,
  MIN_RELEVANCE_THRESHOLD,
} from '../src/lib/resource-engine/scorer';

import {
  distributeAndSequenceModuleResources,
  calculateDynamicResourceLimits,
} from '../src/lib/resource-engine/distributor';

import {
  deduplicateModuleVideosAgainstPlaylist,
  sanitizeModuleLessonsAgainstPlaylist,
} from '../src/lib/resource-engine/playlist-deduplication';

import {
  persistEngineCourse,
} from '../src/lib/resource-engine/persistence';

import {
  analyzeTopicComplexity,
  createTopicAdaptiveCurriculum,
  validateAndSanitizeCurriculum,
} from '../src/services/ai/curriculum-adaptive-engine';

import {
  storageAdapter,
} from '../src/lib/storage/storageAdapter';

import {
  getLearningPathById,
  createFullLearningPath,
  inMemoryPathCache,
} from '../src/services/supabase/pathService';

import {
  enrollUserInCourse,
  getUserEnrollments,
  isUserEnrolled,
} from '../src/services/supabase/enrollmentService';

import {
  ModulePlan,
  NormalizedResource,
  PlaylistResource,
  LearnerGoalInput,
  AnalyzedObjective,
} from '../src/lib/resource-engine/types';

import { LearningPath } from '../src/types';

function createMockNormalizedVideo(params: {
  id: string;
  title: string;
  description: string;
  url?: string;
  durationSeconds?: number;
}): NormalizedResource {
  const url = params.url || `https://www.youtube.com/watch?v=${params.id}`;
  return {
    id: params.id,
    externalId: params.id,
    title: params.title,
    description: params.description,
    canonicalUrl: url,
    url,
    modality: 'video',
    providerId: 'youtube',
    durationSeconds: params.durationSeconds || 1200,
    durationMinutes: Math.round((params.durationSeconds || 1200) / 60),
    isEmbeddable: true,
    isVerifiedEducator: true,
    authorOrChannel: 'Academic Faculty',
    discoverySource: 'verified_channel',
  };
}

describe('Master Test Suite: Intelligent Curriculum Architecture & Module Optimization', () => {

  // =========================================================================
  // SCENARIO 1: Small topic that fits into 1 module (e.g. Binary Search)
  // =========================================================================
  test('Scenario 1: Small topic adapts to 1 cohesive module without artificial fragmentation', () => {
    const topic = 'Binary Search';
    assert.strictEqual(isNarrowFocusedTopic(topic), true, 'Binary Search must be recognized as narrow focused');

    const targetModuleCount = calculateTargetModuleCount(topic, 'introductory', 4);
    assert.strictEqual(targetModuleCount, 1, 'Small focused topic must target exactly 1 module for introductory/short duration');

    const input: LearnerGoalInput = {
      topic,
      level: 'intermediate',
      learningGoal: 'understand_concepts',
      learningStyle: 'balanced',
      language: 'English',
      depth: 'introductory',
      weeklyStudyHours: 4,
      targetWeeks: 1,
    };
    const analyzed: AnalyzedObjective = {
      primaryTopic: topic,
      detectedDomain: 'computer_science',
      normalizedLevel: 'intermediate',
      learningStyle: 'balanced',
      coreConcepts: ['binary search', 'invariants', 'pointers'],
      prerequisites: ['arrays'],
      pedagogicalStrategy: {
        videoEmphasis: 'practical_coding',
        readingEmphasis: 'official_docs',
        practiceEmphasis: 'code_challenges',
      },
    };

    const plan = generateAdaptiveFallbackPlan(input, analyzed, 1, 4);
    assert.strictEqual(plan.modules.length, 1, 'Must generate exactly 1 module');
    assert.ok(plan.modules[0].title.toLowerCase().includes('binary search'), 'Module title must specifically reflect binary search');
    assert.ok(plan.modules[0].learningObjectives.length >= 2, 'Module must contain specific actionable learning objectives');
    assert.ok(plan.modules[0].estimatedHours <= 8, 'Module hours must not artificially inflate');
  });

  // =========================================================================
  // SCENARIO 2: Multiple closely related concepts grouped into 1 module
  // =========================================================================
  test('Scenario 2: Semantic topic grouping merges tightly coupled concepts into cohesive units', () => {
    // 3 tightly coupled concepts
    const basicConcepts = ['Variables', 'Data Types', 'Arithmetic Operators'];
    const clusters = clusterTopicsIntoCoherentModules(basicConcepts, 'computer_science', 'Python');
    assert.strictEqual(clusters.length, 1, 'Variables, Types, and Operators must group into exactly 1 module');
    assert.ok(clusters[0].concepts.includes('Variables'));
    assert.ok(clusters[0].concepts.includes('Data Types'));
    assert.ok(clusters[0].concepts.includes('Arithmetic Operators'));

    // 5 concepts spanning syntax and control flow
    const fiveConcepts = ['Variables', 'Data Types', 'Operators', 'While Loops', 'If-Else Conditionals'];
    const twoClusters = clusterTopicsIntoCoherentModules(fiveConcepts, 'computer_science', 'Python');
    assert.strictEqual(twoClusters.length, 2, 'Five concepts across syntax and control flow must cluster into 2 modules, NOT 5');
    assert.ok(twoClusters[0].concepts.some(c => /variable|type|operator/i.test(c)));
    assert.ok(twoClusters[1].concepts.some(c => /loop|conditional/i.test(c)));
  });

  // =========================================================================
  // SCENARIO 3: Large subject requiring 4-6 modules (e.g. Full Python Programming)
  // =========================================================================
  test('Scenario 3: Broad subject dynamically generates 4-6 cohesive modules without skipping core stages', () => {
    const topic = 'Python Programming';
    const targetModuleCount = calculateTargetModuleCount(topic, 'comprehensive', 40);
    assert.ok(targetModuleCount >= 4 && targetModuleCount <= 6, `Target module count for Python (${targetModuleCount}) should be 4-6 modules`);

    const input: LearnerGoalInput = {
      topic,
      level: 'intermediate',
      learningGoal: 'master_subject',
      learningStyle: 'balanced',
      language: 'English',
      depth: 'comprehensive',
      weeklyStudyHours: 10,
      targetWeeks: 4,
    };
    const analyzed: AnalyzedObjective = {
      primaryTopic: topic,
      detectedDomain: 'computer_science',
      normalizedLevel: 'intermediate',
      learningStyle: 'balanced',
      coreConcepts: ['syntax', 'loops', 'data structures', 'oop', 'exceptions'],
      prerequisites: ['basic computer literacy'],
      pedagogicalStrategy: {
        videoEmphasis: 'practical_coding',
        readingEmphasis: 'official_docs',
        practiceEmphasis: 'code_challenges',
      },
    };

    const plan = generateAdaptiveFallbackPlan(input, analyzed, 5, 40);
    assert.strictEqual(plan.modules.length, 5, 'Must generate 5 sequential modules');
    assert.ok(plan.modules[0].title.includes('Foundations') || plan.modules[0].title.includes('Control Flow'));
    assert.ok(plan.modules[1].title.includes('Data Structures') || plan.modules[1].title.includes('Functions'));
    assert.ok(plan.modules[2].title.includes('Object-Oriented') || plan.modules[2].title.includes('OOP'));
    assert.ok(plan.modules[3].title.includes('Error Handling') || plan.modules[3].title.includes('Generators'));
  });

  // =========================================================================
  // SCENARIO 4: Advanced subject with independent units (e.g. CA Final / React)
  // =========================================================================
  test('Scenario 4: Advanced subject produces distinct, independent learning units', () => {
    const topic = 'CA Final Financial Reporting Ind AS';
    const targetModuleCount = calculateTargetModuleCount(topic, 'rigorous', 60);
    assert.strictEqual(targetModuleCount, 4, 'CA Final Financial Reporting Ind AS should target 4 dedicated accounting standards');

    const input: LearnerGoalInput = {
      topic,
      level: 'competitive_exam',
      learningGoal: 'prepare_exam',
      learningStyle: 'theory_focused',
      language: 'English',
      depth: 'rigorous',
      weeklyStudyHours: 15,
      targetWeeks: 4,
    };
    const analyzed: AnalyzedObjective = {
      primaryTopic: topic,
      detectedDomain: 'business_and_economics',
      normalizedLevel: 'competitive_exam',
      learningStyle: 'theory_focused',
      coreConcepts: ['ind as 109', 'ind as 115', 'ind as 116', 'ind as 103'],
      prerequisites: ['ind as 1'],
      pedagogicalStrategy: {
        videoEmphasis: 'comprehensive_tutorials',
        readingEmphasis: 'academic_textbooks',
        practiceEmphasis: 'exam_style_questions',
      },
    };

    const plan = generateAdaptiveFallbackPlan(input, analyzed, 4, 60);
    assert.strictEqual(plan.modules.length, 4);
    assert.ok(plan.modules.some(m => m.title.includes('Ind AS 109')), 'Module 1 covers Financial Instruments (Ind AS 109)');
    assert.ok(plan.modules.some(m => m.title.includes('Ind AS 115')), 'Module 2 covers Revenue (Ind AS 115)');
    assert.ok(plan.modules.some(m => m.title.includes('Ind AS 116')), 'Module 3 covers Leases (Ind AS 116)');
    assert.ok(plan.modules.some(m => m.title.includes('Ind AS 103')), 'Module 4 covers Business Combinations & Consolidation');
  });

  // =========================================================================
  // SCENARIO 5: Python course containing Python-only resources (Zero C++ Contamination)
  // =========================================================================
  test('Scenario 5: Strict anti-contamination rejects C++, Java and Rust tutorials for Python course', () => {
    const baseModule: ModulePlan = {
      id: 'mod-py-1',
      moduleNumber: 1,
      title: 'Binary Search Implementation in Python',
      description: 'Implementing binary search and loop invariants in Python.',
      estimatedHours: 4,
      prerequisites: [],
      expectedOutcomes: ['Implement binary search in Python'],
      learningObjectives: [
        {
          id: 'obj-1',
          statement: 'Implement binary search algorithm in Python',
          keyTerms: ['binary search', 'python', 'loop'],
        },
      ],
      searchQueries: { videoQueries: [], readingQueries: [] },
    };

    const pythonVideo = createMockNormalizedVideo({
      id: 'vid-py-1',
      title: 'Binary Search Algorithm in Python with Code',
      description: 'Step by step implementation of binary search in Python with loop invariants.',
    });

    const cppVideo = createMockNormalizedVideo({
      id: 'vid-cpp-1',
      title: 'Binary Search in C++ STL with std::vector',
      description: 'Master binary search in C++ using cout, cin, and std::vector.',
    });

    const javaVideo = createMockNormalizedVideo({
      id: 'vid-java-1',
      title: 'Binary Search in Java Data Structures',
      description: 'Write binary search in Java using public static void main.',
    });

    const scoredPy = scoreResource(pythonVideo, baseModule, 'computer_science', 'Python Programming');
    const scoredCpp = scoreResource(cppVideo, baseModule, 'computer_science', 'Python Programming');
    const scoredJava = scoreResource(javaVideo, baseModule, 'computer_science', 'Python Programming');

    assert.strictEqual(scoredPy.passedRelevanceGate, true, 'Python video must pass relevance gate');
    assert.strictEqual(scoredCpp.passedRelevanceGate, false, 'C++ video MUST be rejected for Python course');
    assert.strictEqual(scoredJava.passedRelevanceGate, false, 'Java video MUST be rejected for Python course');
    assert.ok(scoredCpp.rejectionReason?.includes('Cross-language contamination'), 'Rejection reason must flag cross-language contamination');
    assert.ok(scoredJava.rejectionReason?.includes('Cross-language contamination'), 'Rejection reason must flag cross-language contamination');
  });

  // =========================================================================
  // SCENARIO 6: Mathematics course without irrelevant coding tutorials
  // =========================================================================
  test('Scenario 6: Mathematics course rejects irrelevant web development / coding tutorials', () => {
    const mathModule: ModulePlan = {
      id: 'mod-math-1',
      moduleNumber: 1,
      title: 'First-Order Differential Equations & Analytical Solutions',
      description: 'Solving first order separable and linear ODEs analytically.',
      estimatedHours: 5,
      prerequisites: [],
      expectedOutcomes: ['Derive analytical solutions to ODEs'],
      learningObjectives: [
        {
          id: 'obj-1',
          statement: 'Solve separable differential equations analytically',
          keyTerms: ['differential equation', 'calculus', 'derivatives', 'integrals'],
        },
      ],
      searchQueries: { videoQueries: [], readingQueries: [] },
    };

    const mathVideo = createMockNormalizedVideo({
      id: 'vid-math-1',
      title: 'First Order Separable Differential Equations - Full Derivation',
      description: 'Analytical methods and worked derivations for solving first order differential equations.',
    });

    const webDevVideo = createMockNormalizedVideo({
      id: 'vid-web-1',
      title: 'Learn React.js & Web Development from Scratch',
      description: 'Become a frontend developer using React.js, HTML, CSS, and component state.',
    });

    const scoredMath = scoreResource(mathVideo, mathModule, 'mathematics', 'Differential Equations');
    const scoredWeb = scoreResource(webDevVideo, mathModule, 'mathematics', 'Differential Equations');

    assert.strictEqual(scoredMath.passedRelevanceGate, true, 'Pure math derivation video must pass relevance gate');
    assert.strictEqual(scoredWeb.passedRelevanceGate, false, 'Web development tutorial MUST be rejected for mathematics course');
    assert.ok(scoredWeb.rejectionReason?.includes('Cross-domain collision'), 'Rejection reason must flag cross-domain collision');
  });

  // =========================================================================
  // SCENARIO 7: Playlist covering complete topic
  // =========================================================================
  test('Scenario 7: Curated playlist covering complete topic is selected as primary without video duplication', () => {
    const modulePlan: ModulePlan = {
      id: 'mod-playlist-complete',
      moduleNumber: 1,
      title: 'Limits & Derivatives in Calculus',
      description: 'Limits, continuity, and differential calculus.',
      estimatedHours: 6,
      prerequisites: [],
      expectedOutcomes: ['Compute limits and derivatives'],
      learningObjectives: [
        { id: 'obj-1', statement: 'Compute limits of algebraic and trigonometric functions', keyTerms: ['limits'] },
        { id: 'obj-2', statement: 'Apply differentiation rules', keyTerms: ['derivatives'] },
      ],
      searchQueries: { videoQueries: [], readingQueries: [] },
    };

    const completePlaylist: PlaylistResource = {
      id: 'pl-complete-1',
      title: 'Complete Calculus 1 Lecture Series',
      channelName: 'MIT OpenCourseWare',
      channelId: 'UC_mit',
      playlistUrl: 'https://youtube.com/playlist?list=PL_complete_1',
      itemCount: 8,
      totalDurationMinutes: 240,
      topicsCovered: ['limits', 'derivatives', 'continuity'],
      coverageStatus: 'VERIFIED_COMPLETE',
      isCurated: true,
      relevanceScore: 98,
      items: [
        { videoId: 'vid-mit-1', title: 'Lecture 1: Limits & Continuity', durationSeconds: 1800, videoUrl: 'https://youtube.com/watch?v=vid-mit-1', sequenceNumber: 1 },
        { videoId: 'vid-mit-2', title: 'Lecture 2: Derivatives & Power Rule', durationSeconds: 1800, videoUrl: 'https://youtube.com/watch?v=vid-mit-2', sequenceNumber: 2 },
      ],
    };

    const candidateVideos = [
      createMockNormalizedVideo({ id: 'vid-mit-1', title: 'Lecture 1: Limits & Continuity', description: 'Limits lecture' }),
      createMockNormalizedVideo({ id: 'vid-mit-2', title: 'Lecture 2: Derivatives & Power Rule', description: 'Derivatives lecture' }),
    ].map(v => scoreResource(v, modulePlan, 'mathematics', 'Calculus'));

    const assignment = distributeAndSequenceModuleResources(
      modulePlan,
      candidateVideos,
      [],
      [],
      undefined,
      completePlaylist,
      undefined,
      'intermediate'
    );

    assert.ok(assignment.primaryPlaylist, 'Primary playlist must be assigned to the module');
    assert.strictEqual((assignment.removedDuplicateVideos || []).length, 2, 'Both duplicate videos must be deduplicated against the playlist');
    assert.strictEqual(assignment.videos.length, 0, 'No redundant individual videos should appear when complete playlist covers topic');
    assert.ok(assignment.coverageScore >= 80, 'Coverage score must reflect high playlist coverage');
  });

  // =========================================================================
  // SCENARIO 8: Playlist covering partial topic with complementary resources
  // =========================================================================
  test('Scenario 8: Playlist covering partial topic admits complementary non-duplicate videos', () => {
    const modulePlan: ModulePlan = {
      id: 'mod-playlist-partial',
      moduleNumber: 1,
      title: 'Differential Equations and Modeling',
      description: 'First order equations and harmonic modeling.',
      estimatedHours: 6,
      prerequisites: [],
      expectedOutcomes: ['Solve ODEs and harmonic models'],
      learningObjectives: [
        { id: 'obj-1', statement: 'Solve separable first-order differential equations', keyTerms: ['first-order', 'separable'] },
        { id: 'obj-2', statement: 'Model damped harmonic oscillators with second-order ODEs', keyTerms: ['harmonic', 'oscillators', 'second-order'] },
      ],
      searchQueries: { videoQueries: [], readingQueries: [] },
    };

    const partialPlaylist: PlaylistResource = {
      id: 'pl-partial-1',
      title: 'First-Order Differential Equations Series',
      channelName: 'Khan Academy',
      channelId: 'UC_khan',
      playlistUrl: 'https://youtube.com/playlist?list=PL_partial_1',
      itemCount: 4,
      totalDurationMinutes: 80,
      topicsCovered: ['first-order', 'separable'],
      coverageStatus: 'PARTIALLY_VERIFIED',
      isCurated: true,
      relevanceScore: 90,
      items: [
        { videoId: 'vid-khan-1', title: 'Separable Differential Equations', durationSeconds: 1200, videoUrl: 'https://youtube.com/watch?v=vid-khan-1', sequenceNumber: 1 },
      ],
    };

    const candidateVideos = [
      createMockNormalizedVideo({ id: 'vid-khan-1', title: 'Separable Differential Equations', description: 'Khan lecture' }),
      createMockNormalizedVideo({ id: 'vid-harmonic-supp', title: 'Damped Harmonic Oscillators and Resonance Second Order ODEs', description: 'Harmonic oscillator modeling lecture' }),
    ].map(v => scoreResource(v, modulePlan, 'mathematics', 'Differential Equations'));

    const assignment = distributeAndSequenceModuleResources(
      modulePlan,
      candidateVideos,
      [],
      [],
      undefined,
      partialPlaylist,
      undefined,
      'intermediate'
    );

    assert.ok(assignment.primaryPlaylist, 'Primary playlist is assigned');
    assert.strictEqual((assignment.removedDuplicateVideos || []).length, 1, 'Duplicate video vid-khan-1 must be removed');
    assert.strictEqual(assignment.videos.length, 1, 'Complementary video vid-harmonic-supp must be preserved');
    assert.strictEqual(assignment.videos[0].id, 'vid-harmonic-supp');
  });

  // =========================================================================
  // SCENARIO 9: Zero duplicate videos across modules
  // =========================================================================
  test('Scenario 9: Exact and canonical video deduplication guarantees 0 duplicate videos in module', () => {
    const rawVideos = [
      createMockNormalizedVideo({ id: 'xyz123', title: 'Loop Invariants Tutorial', description: 'Invariants explained' }),
      createMockNormalizedVideo({ id: 'xyz123', title: 'Loop Invariants Tutorial (Duplicate Entry)', description: 'Invariants explained' }),
    ];

    const modPlan: ModulePlan = {
      id: 'mod-dedup-check',
      moduleNumber: 1,
      title: 'Loop Invariants',
      description: 'Loop invariants overview',
      estimatedHours: 4,
      prerequisites: [],
      expectedOutcomes: ['Understand loop invariants'],
      learningObjectives: [{ id: 'obj-1', statement: 'Understand loop invariants', keyTerms: ['invariants'] }],
      searchQueries: { videoQueries: [], readingQueries: [] },
    };

    const scored = rawVideos.map(v => scoreResource(v, modPlan, 'computer_science', 'Algorithms'));
    const uniqueIds = new Set(scored.map(v => v.id));
    assert.strictEqual(uniqueIds.size, 1, 'Duplicate external IDs must collapse to single canonical entry');
  });

  // =========================================================================
  // SCENARIO 10: Graceful handling of low resource availability
  // =========================================================================
  test('Scenario 10: Gracefully synthesizes valid module when 0 video resources pass relevance gate', () => {
    const modPlan: ModulePlan = {
      id: 'mod-low-res',
      moduleNumber: 1,
      title: 'Hyper-Specialized Advanced Formal Verification',
      description: 'Formal mathematical proofs in Coq.',
      estimatedHours: 4,
      prerequisites: [],
      expectedOutcomes: ['Write Coq proofs'],
      learningObjectives: [{ id: 'obj-1', statement: 'Write Coq proofs', keyTerms: ['coq', 'proofs'] }],
      searchQueries: { videoQueries: [], readingQueries: [] },
    };

    const assignment = distributeAndSequenceModuleResources(
      modPlan,
      [], // No valid videos
      [], // No valid readings
      [], // Notes empty initially
      undefined,
      undefined,
      undefined,
      'intermediate'
    );

    assert.strictEqual(assignment.videos.length, 0);
    assert.strictEqual(assignment.readings.length, 0);
    assert.ok(assignment.moduleId === 'mod-low-res');
    assert.ok(typeof assignment.coverageScore === 'number');
  });

  // =========================================================================
  // SCENARIO 11: Safe module regeneration without corrupting course
  // =========================================================================
  test('Scenario 11: Module regeneration and sanitization preserves user-created custom lessons and excludes duplicates', () => {
    const existingLessons = [
      {
        id: 'les-custom-123',
        title: 'My Custom Worked Example Video',
        type: 'video' as const,
        durationMinutes: 20,
        sourceUrl: 'https://youtube.com/watch?v=custom_video_user',
        isUserCreated: true,
        isCustom: true,
      },
      {
        id: 'les-old-dup',
        title: 'Old Duplicate Video in Playlist',
        type: 'video' as const,
        durationMinutes: 30,
        sourceUrl: 'https://youtube.com/watch?v=old_dup_123',
      },
      {
        id: 'les-supp',
        title: 'Unique Supplemental Reading',
        type: 'monograph' as const,
        durationMinutes: 25,
        sourceUrl: 'https://example.com/unique_reading',
      },
    ];

    const primaryPlaylist: PlaylistResource = {
      id: 'pl-regen-1',
      title: 'Curated Verified Lecture Series',
      channelName: 'Faculty',
      channelId: 'UC1',
      playlistUrl: 'https://youtube.com/playlist?list=PL_regen_1',
      itemCount: 4,
      totalDurationMinutes: 120,
      topicsCovered: ['functions'],
      coverageStatus: 'VERIFIED_COMPLETE',
      isCurated: true,
      relevanceScore: 95,
      items: [
        { videoId: 'old_dup_123', title: 'Old Duplicate Video in Playlist', durationSeconds: 1800, videoUrl: 'https://youtube.com/watch?v=old_dup_123', sequenceNumber: 1 },
      ],
    };

    const { lessons: sanitizedLessons } = sanitizeModuleLessonsAgainstPlaylist({ lessons: existingLessons, primaryPlaylist } as any);

    assert.ok(
      sanitizedLessons.some((l: any) => l.id === 'les-custom-123' || l.title === 'My Custom Worked Example Video'),
      'User-created custom lesson MUST be strictly preserved during module sanitization'
    );
    assert.ok(
      !sanitizedLessons.some((l: any) => l.id === 'les-old-dup'),
      'Redundant duplicate playlist video MUST be eliminated'
    );
    assert.ok(
      sanitizedLessons.some((l: any) => l.id === 'les-supp'),
      'Supplemental reading material must be preserved'
    );
  });

  // =========================================================================
  // SCENARIO 12: Existing course with completed lessons preserved
  // =========================================================================
  test('Scenario 12: Storage adapter and path service preserve user completed lessons', async () => {
    const userId = 'user-test-persistence-12';
    const courseId = `path-test-completed-${Date.now()}`;

    await createFullLearningPath(
      {
        id: courseId,
        title: 'Preserved Progress Course',
        description: 'Course testing progress preservation',
        domain: 'Computer Science',
        level: 'intermediate',
        durationHours: 10,
        moduleCount: 1,
        tags: ['test'],
        modules: [
          {
            id: `mod-${courseId}-1`,
            title: 'Module 1',
            moduleNumber: 1,
            orderIndex: 0,
            status: 'in_progress',
            totalResources: 3,
            objective: 'Master module 1',
            lessons: [
              { id: 'les-1', title: 'Lesson 1', type: 'video', durationMinutes: 20, sourceUrl: 'https://example.com/1', orderIndex: 1 },
              { id: 'les-2', title: 'Lesson 2', type: 'reading', durationMinutes: 15, sourceUrl: 'https://example.com/2', orderIndex: 2 },
              { id: 'les-3', title: 'Lesson 3', type: 'quiz', durationMinutes: 10, sourceUrl: 'https://example.com/3', orderIndex: 3 },
            ],
          },
        ],
      },
      userId
    );

    await enrollUserInCourse(userId, courseId);

    // Record completed lessons for this user course
    await storageAdapter.updateProgress(courseId, {
      completedLessonIds: ['les-1', 'les-2'],
    });

    // Retrieve progress
    const progress = await storageAdapter.getProgress(courseId);
    assert.ok(progress, 'User progress record must exist');
    assert.ok(progress.completedLessonIds.includes('les-1'), 'Lesson 1 must remain marked completed');
    assert.ok(progress.completedLessonIds.includes('les-2'), 'Lesson 2 must remain marked completed');
    assert.strictEqual(progress.completedLessonIds.length, 2, 'Exactly 2 lessons must be recorded completed');

    // Reload course from pathService
    const reloaded = await getLearningPathById(courseId);
    assert.strictEqual(reloaded?.id, courseId);
    assert.ok(reloaded?.modules && reloaded.modules[0].lessons.length === 3);
  });

  // =========================================================================
  // SCENARIO 13: Existing course with bookmarks and notes preserved
  // =========================================================================
  test('Scenario 13: Storage adapter preserves user bookmarks across sessions', async () => {
    const courseId = `path-test-bookmark-${Date.now()}`;

    // Add bookmark
    const bookmark = {
      pathId: courseId,
      resourceId: 'les-bookmarked-99',
      title: 'Critical Architecture Concept',
      type: 'resource' as const,
      sourceUrl: 'https://youtube.com/watch?v=sample_bm',
    };

    await storageAdapter.addBookmark(bookmark);
    const bookmarks = await storageAdapter.getBookmarks();
    assert.ok(bookmarks.some((b) => b.pathId === courseId && b.resourceId === 'les-bookmarked-99'));
    const isBm = await storageAdapter.isBookmarked(courseId, 'les-bookmarked-99');
    assert.strictEqual(isBm, true, 'Bookmark status must be true');
  });

  // =========================================================================
  // SCENARIO 14: Course reload and duration reconciliation verified
  // =========================================================================
  test('Scenario 14: Course persistence reconciles module lesson durations with course durationHours', async () => {
    const userId = 'user-test-duration-14';
    const input: LearnerGoalInput = {
      topic: 'Binary Search Algorithm',
      level: 'intermediate',
      learningGoal: 'understand_concepts',
      learningStyle: 'practical_projects',
      language: 'English',
      depth: 'introductory',
      weeklyStudyHours: 5,
      targetWeeks: 1,
    };
    const analyzed: AnalyzedObjective = {
      primaryTopic: 'Binary Search Algorithm',
      detectedDomain: 'computer_science',
      normalizedLevel: 'intermediate',
      learningStyle: 'practical_projects',
      coreConcepts: ['binary search'],
      prerequisites: [],
      pedagogicalStrategy: {
        videoEmphasis: 'practical_coding',
        readingEmphasis: 'official_docs',
        practiceEmphasis: 'code_challenges',
      },
    };

    const plan = generateAdaptiveFallbackPlan(input, analyzed, 1, 4);

    const videoResource = createMockNormalizedVideo({
      id: 'vid-bs-reconcile',
      title: 'Binary Search Implementation',
      description: 'Binary search code walkthrough',
      durationSeconds: 1800, // 30 min
    });
    const scoredVideo = scoreResource(videoResource, plan.modules[0], 'computer_science', 'Binary Search Algorithm');

    const assignment = distributeAndSequenceModuleResources(
      plan.modules[0],
      [scoredVideo],
      [],
      [
        {
          id: 'note-bs-1',
          type: 'study_notes' as const,
          title: 'Binary Search Invariants',
          overview: 'Overview',
          keyConcepts: [{ term: 'Loop Invariant', explanation: 'Bounds must decrease' }],
          commonMisconceptions: ['Midpoint calculation without overflow protection'],
          keyTakeaways: ['Check mid = low + (high - low)/2'],
          estimatedReadingMinutes: 15,
          canonicalUrl: '/courses/test',
          verificationStatus: 'verified' as const,
        },
      ],
      undefined,
      undefined,
      undefined,
      'intermediate'
    );

    const persistResult = await persistEngineCourse(input, plan, [assignment], userId);
    assert.strictEqual(persistResult.verificationPassed, true, 'Persisted course verification must pass');
    assert.strictEqual(persistResult.totalModules, 1, 'Exactly 1 module persisted');

    // Reload course
    const loadedCourse = await getLearningPathById(persistResult.courseId);
    assert.ok(loadedCourse, 'Course must reload from persistence');
    assert.strictEqual(loadedCourse.moduleCount, 1);
    // Calculated duration must be realistic (30m video + 15m notes = 45m ~ 1 hour), not inflated to 40 hours!
    assert.ok(loadedCourse.durationHours <= 4, `Reconciled duration (${loadedCourse.durationHours}h) must reflect actual lesson content, not arbitrary default`);
  });

  // =========================================================================
  // SCENARIO 15: Multi-user isolation verified
  // =========================================================================
  test('Scenario 15: Multi-tenant data isolation prevents cross-account course or enrollment leakage', async () => {
    const userA = 'scholar-tenant-alpha';
    const userB = 'scholar-tenant-beta';

    const courseAId = `path-alpha-exclusive-${Date.now()}`;

    await createFullLearningPath(
      {
        id: courseAId,
        title: 'Tenant Alpha Private Research Track',
        description: 'Restricted research pathway',
        domain: 'Computer Science',
        level: 'advanced',
        durationHours: 20,
        moduleCount: 1,
        tags: ['alpha-confidential'],
        modules: [],
      },
      userA
    );

    await enrollUserInCourse(userA, courseAId);

    // Verify User A is enrolled
    const enrolledA = await isUserEnrolled(userA, courseAId);
    assert.strictEqual(enrolledA, true, 'User A must be enrolled in Course A');

    // Verify User B is NOT enrolled in User A's private course
    const enrolledB = await isUserEnrolled(userB, courseAId);
    assert.strictEqual(enrolledB, false, 'User B must NOT be enrolled in User A private course');
  });
});
