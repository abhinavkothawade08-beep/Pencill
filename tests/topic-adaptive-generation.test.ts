import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeTopicComplexity,
  createTopicAdaptiveCurriculum,
  validateAndSanitizeCurriculum,
} from '@/services/ai/curriculum-adaptive-engine';
import {
  distributeResourcesToCourse,
  QualityScoringEngine,
  type EngineResource,
} from '@/lib/resource-engine-v2';
import {
  createFullLearningPath,
  getLearningPathById,
  inMemoryPathCache,
} from '@/services/supabase/pathService';
import {
  enrollUserInCourse,
  isUserEnrolled,
} from '@/services/supabase/enrollmentService';
import { clearDeletionRegistryForTesting } from '@/services/supabase/deletionRegistry';

describe('Topic-Adaptive Module Generation & Curriculum Architecture', () => {
  beforeEach(() => {
    clearDeletionRegistryForTesting();
    inMemoryPathCache.clear();
  });

  test('1. Topic complexity analysis calibrates cohesive module ranges dynamically to subject scope', () => {
    const pythonAnalysis = analyzeTopicComplexity('Python Basics', 'Beginner');
    assert.strictEqual(pythonAnalysis.complexityTier, 'foundational_compact');
    assert.deepStrictEqual(pythonAnalysis.recommendedModuleRange, [3, 4]);
    assert.strictEqual(pythonAnalysis.domain, 'Computer Science');

    const dsaAnalysis = analyzeTopicComplexity('Data Structures and Algorithms', 'Intermediate');
    assert.strictEqual(dsaAnalysis.complexityTier, 'intermediate_core');
    assert.deepStrictEqual(dsaAnalysis.recommendedModuleRange, [4, 5]);
    assert.strictEqual(dsaAnalysis.domain, 'Computer Science');

    const mlAnalysis = analyzeTopicComplexity('Machine Learning', 'Undergraduate');
    assert.strictEqual(mlAnalysis.complexityTier, 'comprehensive_mastery');
    assert.deepStrictEqual(mlAnalysis.recommendedModuleRange, [5, 6]);
    assert.strictEqual(mlAnalysis.domain, 'Computer Science');

    const llmAnalysis = analyzeTopicComplexity('Large Language Models', 'Advanced');
    assert.strictEqual(llmAnalysis.complexityTier, 'comprehensive_mastery');
    assert.deepStrictEqual(llmAnalysis.recommendedModuleRange, [5, 6]);

    const fineTuningAnalysis = analyzeTopicComplexity('Fine Tuning of AI Models', 'Advanced');
    assert.strictEqual(fineTuningAnalysis.complexityTier, 'comprehensive_mastery');
    assert.deepStrictEqual(fineTuningAnalysis.recommendedModuleRange, [5, 6]);
  });

  test('2. Python Basics generates a focused 4-module curriculum with non-redundant primitives', () => {
    const curriculum = createTopicAdaptiveCurriculum('Python Basics', 'Beginner', 6);

    assert.strictEqual(curriculum.moduleCount, 4, 'Python Basics must have 4 focused modules');
    assert.strictEqual(curriculum.modules.length, 4);

    const titles = curriculum.modules.map((m) => m.title);
    assert.ok(titles.some((t) => t.toLowerCase().includes('primitive') || t.toLowerCase().includes('syntax')));
    assert.ok(titles.some((t) => t.toLowerCase().includes('control flow') || t.toLowerCase().includes('iteration')));
    assert.ok(titles.some((t) => t.toLowerCase().includes('composite') || t.toLowerCase().includes('collections')));
    assert.ok(titles.some((t) => t.toLowerCase().includes('function') || t.toLowerCase().includes('i/o')));

    // Verify sequential ordering 1..4
    curriculum.modules.forEach((m, idx) => {
      assert.strictEqual(m.moduleNumber, idx + 1);
      assert.ok(m.lessons.length >= 4, `Module ${m.moduleNumber} must have at least 4 lessons`);
    });
  });

  test('3. Data Structures and Algorithms generates a comprehensive, cohesive 5-module progression', () => {
    const curriculum = createTopicAdaptiveCurriculum('Data Structures and Algorithms', 'Intermediate', 8);

    assert.strictEqual(curriculum.moduleCount, 5, 'DSA must have 5 cohesive modules without concept fragmentation');
    assert.strictEqual(curriculum.modules.length, 5);

    const titles = curriculum.modules.map((m) => m.title.toLowerCase());
    assert.ok(titles.some((t) => t.includes('complexity') || t.includes('linear')), 'Must cover complexity & linear structures');
    assert.ok(titles.some((t) => t.includes('hash') || t.includes('sorting')), 'Must cover hash tables & sorting');
    assert.ok(titles.some((t) => t.includes('tree') || t.includes('heap')), 'Must cover trees & heaps');
    assert.ok(titles.some((t) => t.includes('graph') || t.includes('traversal')), 'Must cover graphs & traversals');
    assert.ok(titles.some((t) => t.includes('dynamic programming')), 'Must cover dynamic programming');
  });

  test('4. Fine-Tuning of AI Models generates a 5-module cohesive technical pipeline without fragmentation', () => {
    const curriculum = createTopicAdaptiveCurriculum('Fine Tuning of AI Models', 'Undergraduate', 8);

    assert.strictEqual(curriculum.moduleCount, 5, 'Fine-Tuning must have 5 cohesive modules unifying PEFT and LoRA');
    assert.strictEqual(curriculum.modules.length, 5);

    const titles = curriculum.modules.map((m) => m.title.toLowerCase());
    assert.ok(titles.some((t) => t.includes('transformer') || t.includes('pre-trained')), 'Must cover Transformer foundations');
    assert.ok(titles.some((t) => t.includes('dataset') || t.includes('supervised fine-tuning') || t.includes('sft')), 'Must cover SFT & datasets');
    assert.ok(titles.some((t) => (t.includes('peft') || t.includes('adapter')) && (t.includes('lora') || t.includes('qlora'))), 'Must unify PEFT, LoRA & QLoRA into a single module');
    assert.ok(titles.some((t) => t.includes('dpo') || t.includes('rlhf') || t.includes('preference')), 'Must cover preference alignment');
    assert.ok(titles.some((t) => t.includes('evaluation') && (t.includes('quantization') || t.includes('deployment'))), 'Must cover evaluation, quantization & deployment');

    // Verify distinct lesson types in each module
    for (const mod of curriculum.modules) {
      const types = mod.lessons.map((l) => l.type);
      assert.ok(types.includes('video'), `Module ${mod.title} must include a video lesson`);
      assert.ok(types.includes('monograph'), `Module ${mod.title} must include a monograph lesson`);
      assert.ok(types.includes('practice'), `Module ${mod.title} must include a practice lesson`);
      assert.ok(types.includes('quiz'), `Module ${mod.title} must include a quiz lesson`);
    }
  });

  test('5. Curriculum validator sanitizes numbering gaps and enforces lesson completeness', () => {
    const rawCurriculum = {
      title: 'Quantum Mechanics',
      modules: [
        {
          moduleNumber: 10, // gap in numbering
          title: 'Wave Functions & Schrodinger Equation',
          estimatedHours: 8,
          objective: 'Master wave function probability density',
          lessons: [
            { title: 'Lecture 1', type: 'video' as const, estimatedMinutes: 30, keyConcepts: ['Wave'] },
          ], // fewer than 2 lessons
        },
        {
          moduleNumber: 25, // gap in numbering
          title: 'Quantum Harmonic Oscillator',
          estimatedHours: 10,
          objective: 'Solve ladder operator eigenstates',
          lessons: [], // empty lessons
        },
      ],
    };

    const { valid, curriculum } = validateAndSanitizeCurriculum(rawCurriculum, 'Quantum Mechanics');
    assert.strictEqual(valid, true);
    assert.strictEqual(curriculum.modules.length, 2);
    assert.strictEqual(curriculum.modules[0].moduleNumber, 1, 'First module must be re-indexed to 1');
    assert.strictEqual(curriculum.modules[1].moduleNumber, 2, 'Second module must be re-indexed to 2');
    assert.strictEqual(curriculum.moduleCount, 2);

    // Lessons must have been padded with pedagogical quartets
    assert.ok(curriculum.modules[0].lessons.length >= 4);
    assert.ok(curriculum.modules[1].lessons.length >= 4);
  });

  test('6. Module-wise resource distributor maps resources across cohesive modules without leakage', () => {
    const curriculum = createTopicAdaptiveCurriculum('Fine Tuning of AI Models', 'Undergraduate', 8);

    const mockResources: EngineResource[] = [
      {
        id: 'res-lora-video',
        title: 'Complete Guide to LoRA and QLoRA in PyTorch',
        type: 'video_lecture',
        sourceName: 'YouTube - AI Engineering',
        sourceUrl: 'https://youtube.com/watch?v=lora123',
        canonicalUrl: 'https://youtube.com/watch?v=lora123',
        durationMinutes: 42,
        difficulty: 'advanced',
        language: 'English',
        tags: ['LoRA', 'QLoRA', 'PEFT'],
        description: 'Deep dive into rank scaling, low-rank matrices, and memory reduction with QLoRA.',
        discoveredAt: new Date().toISOString(),
        score: { overall: 96, relevance: 98, educationalValue: 95, structureCompleteness: 94, freshness: 95 },
      },
      {
        id: 'res-dpo-monograph',
        title: 'Direct Preference Optimization: Your Language Model is Secretly a Reward Model',
        type: 'research_paper',
        sourceName: 'arXiv Academic Repository',
        sourceUrl: 'https://arxiv.org/abs/2305.18290',
        canonicalUrl: 'https://arxiv.org/abs/2305.18290',
        durationMinutes: 45,
        difficulty: 'advanced',
        language: 'English',
        tags: ['DPO', 'RLHF', 'Alignment'],
        description: 'Seminal paper deriving DPO closed-form implicit reward loss.',
        discoveredAt: new Date().toISOString(),
        score: { overall: 98, relevance: 99, educationalValue: 98, structureCompleteness: 95, freshness: 95 },
      },
      {
        id: 'quiz-mod-3',
        title: 'Parameter-Efficient Fine-Tuning (PEFT, LoRA & QLoRA) Checkpoint',
        type: 'ai_quiz',
        sourceName: 'Pencill Diagnostics',
        sourceUrl: '/practice/quiz-mod-3',
        canonicalUrl: '/practice/quiz-mod-3',
        durationMinutes: 15,
        difficulty: 'advanced',
        language: 'English',
        tags: ['PEFT', 'LoRA', 'Assessment'],
        description: 'Formative checkpoint for Module 3.',
        discoveredAt: new Date().toISOString(),
        metadata: { moduleNumber: 3, moduleId: 'mod-3' },
        score: { overall: 95, relevance: 95, educationalValue: 95, structureCompleteness: 95, freshness: 95 },
      },
    ];

    const distributed = distributeResourcesToCourse(curriculum, mockResources);

    // Verify Module 3 (PEFT & LoRA) received the LoRA video resource
    const loraModule = distributed.modules[2]; // Module 3 (index 2)
    assert.strictEqual(loraModule.moduleNumber, 3);
    const loraVideoLesson = loraModule.lessons.find((l) => l.type === 'video');
    assert.strictEqual(loraVideoLesson?.sourceUrl, 'https://youtube.com/watch?v=lora123');

    // Verify Module 4 (DPO) received the DPO monograph
    const dpoModule = distributed.modules[3]; // Module 4 (index 3)
    assert.strictEqual(dpoModule.moduleNumber, 4);
    const dpoMonographLesson = dpoModule.lessons.find((l) => l.type === 'monograph');
    assert.strictEqual(dpoMonographLesson?.sourceUrl, 'https://arxiv.org/abs/2305.18290');

    // Verify Module 3 quiz lesson received the Module 3 quiz
    const loraQuizLesson = loraModule.lessons.find((l) => l.type === 'quiz');
    assert.strictEqual(loraQuizLesson?.sourceUrl, '/practice/quiz-mod-3');
  });

  test('7. createFullLearningPath persists variable cohesive courses and correctly initializes lock states', async () => {
    const curriculum = createTopicAdaptiveCurriculum('Fine Tuning of AI Models', 'Undergraduate', 8);
    const testUserId = 'test-curriculum-author-uuid';

    const courseId = await createFullLearningPath(curriculum, testUserId);
    assert.ok(courseId, 'Course ID must be generated');

    const loadedCourse = await getLearningPathById(courseId);
    assert.ok(loadedCourse, 'Saved course must be retrievable from cache/storage');
    assert.strictEqual(loadedCourse.moduleCount, 5, 'Module count must accurately reflect 5 cohesive modules');
    assert.strictEqual(loadedCourse.modules?.length, 5);

    // Module 1 must be in_progress, while Modules 2..5 must be locked
    const modules = loadedCourse.modules || [];
    assert.strictEqual(modules[0].status, 'in_progress', 'Module 1 must be in_progress initially');
    for (let i = 1; i < modules.length; i++) {
      assert.strictEqual(modules[i].status, 'locked', `Module ${i + 1} must be locked initially`);
    }

    // Verify enrollment integration works
    const studentId = 'test-student-charlie-uuid';
    const enrollResult = await enrollUserInCourse(studentId, courseId);
    assert.strictEqual(enrollResult.success, true);

    const isEnrolled = await isUserEnrolled(studentId, courseId);
    assert.strictEqual(isEnrolled, true, 'User must be recorded as enrolled in course');
  });

  test('8. Video relevance rejects generic keyword matches and retains genuinely aligned videos', () => {
    const scoringEngine = new QualityScoringEngine();

    const highlyRelevantVideo: EngineResource = {
      id: 'v_lora_exact',
      title: 'Low-Rank Adaptation (LoRA) and QLoRA Explained from Scratch',
      description: 'Complete mathematical walkthrough of LoRA decomposition, alpha scaling, and PEFT integration in PyTorch.',
      type: 'video_lecture',
      sourceName: 'Stanford Online',
      authorOrChannel: 'Stanford Online',
      sourceUrl: 'https://youtube.com/watch?v=exact_lora',
      canonicalUrl: 'https://youtube.com/watch?v=exact_lora',
      durationMinutes: 35,
      difficulty: 'advanced',
      language: 'English',
      tags: ['LoRA', 'PEFT', 'PyTorch'],
      score: { overall: 92, relevance: 95, educationalValue: 90, structureCompleteness: 90, freshness: 85 },
      discoveredAt: new Date().toISOString(),
    };

    const genericVideoWithRelatedWord: EngineResource = {
      id: 'v_generic_ai',
      title: 'AI Models and Modern Computing Overview - Full Course',
      description: 'General discussion about computers, artificial intelligence, and software engineering basics.',
      type: 'video_lecture',
      sourceName: 'Random Tech Uploader',
      authorOrChannel: 'Random Tech Uploader',
      sourceUrl: 'https://youtube.com/watch?v=generic_ai',
      canonicalUrl: 'https://youtube.com/watch?v=generic_ai',
      durationMinutes: 20,
      difficulty: 'beginner',
      language: 'English',
      tags: ['ai', 'course', 'basics'],
      score: { overall: 45, relevance: 30, educationalValue: 40, structureCompleteness: 40, freshness: 60 },
      discoveredAt: new Date().toISOString(),
    };

    const scored = scoringEngine.filterAndScoreBatch(
      [highlyRelevantVideo, genericVideoWithRelatedWord],
      'Parameter-Efficient Fine-Tuning LoRA QLoRA PEFT',
      'educational',
      55
    );

    const acceptedIds = scored.map((s) => s.resource.id);
    assert.ok(acceptedIds.includes('v_lora_exact'), 'Exact topical LoRA video must pass acceptance');
    assert.ok(!acceptedIds.includes('v_generic_ai'), 'Generic video matching only incidental words must be rejected');
  });

  test('9. Honest empty state is maintained when no verified video meets the relevance threshold', () => {
    const curriculum = createTopicAdaptiveCurriculum('Fine Tuning of AI Models', 'Undergraduate', 8);

    // Pass completely unrelated videos (cooking, gaming) to resource distribution
    const unrelatedResources: EngineResource[] = [
      {
        id: 'v_unrelated',
        title: 'Italian Pasta Making Masterclass',
        type: 'video_lecture',
        sourceName: 'Chef Cooking Channel',
        sourceUrl: 'https://youtube.com/watch?v=pasta',
        canonicalUrl: 'https://youtube.com/watch?v=pasta',
        durationMinutes: 25,
        difficulty: 'beginner',
        language: 'English',
        tags: ['pasta', 'recipe'],
        score: { overall: 20, relevance: 15, educationalValue: 30, structureCompleteness: 20, freshness: 50 },
        discoveredAt: new Date().toISOString(),
      },
    ];

    const distributed = distributeResourcesToCourse(curriculum, unrelatedResources);

    // Verify video lessons do NOT assign the unrelated video or fabricate a fake YouTube search link
    for (const mod of distributed.modules) {
      const videoLesson = mod.lessons.find((l) => l.type === 'video');
      assert.ok(videoLesson, 'Video lesson must exist in module');
      assert.strictEqual(
        videoLesson.sourceUrl,
        undefined,
        'Lesson sourceUrl must be undefined when no verified topical video is available'
      );
      assert.notStrictEqual(
        videoLesson.sourceUrl,
        'https://youtube.com/watch?v=pasta',
        'Unrelated video must never be assigned'
      );
      assert.ok(
        !String(videoLesson.sourceUrl || '').includes('youtube.com/results?search_query='),
        'Must never fabricate a YouTube search URL'
      );
      assert.strictEqual(
        videoLesson.thumbnailUrl,
        undefined,
        'Must never fabricate an Unsplash thumbnail URL'
      );
    }
  });
});
