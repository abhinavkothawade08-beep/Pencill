import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeTopicComplexity,
  createTopicAdaptiveCurriculum,
  validateAndSanitizeCurriculum,
} from '@/services/ai/curriculum-adaptive-engine';
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

  test('6. createFullLearningPath persists variable cohesive courses and correctly initializes lock states', async () => {
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
});
