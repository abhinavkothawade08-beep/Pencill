import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  NormalizedCourseSchema,
  NormalizedModuleSchema,
  NormalizedLessonSchema,
} from '../src/lib/ingestion/types';
import { MitOcwAdapter } from '../src/lib/ingestion/adapters/mit-ocw-adapter';
import { LEGACY_MOCK_COURSE_IDS } from '../src/services/supabase/pathService';

describe('Academic Content Ingestion & Verification Integrity', () => {
  test('NormalizedCourseSchema enforces strict validation of academic course structure', () => {
    const validCourse = {
      id: 'mit-8-012-physics-i-classical-mechanics',
      externalId: '8.012',
      title: 'Physics I: Classical Mechanics',
      description: 'Calculus-based classical mechanics at the university level.',
      domain: 'Physics',
      level: 'Undergraduate' as const,
      durationHours: 45,
      moduleCount: 2,
      verified: true,
      publisher: 'Massachusetts Institute of Technology',
      canonicalUrl: 'https://ocw.mit.edu/courses/8-012-physics-i-classical-mechanics-fall-2008/',
      courseNumber: '8.012',
      instructors: ['Prof. Nergis Mavalvala'],
      license: 'Creative Commons BY-NC-SA 4.0',
      modules: [
        {
          id: 'mod-1',
          title: 'Kinematics & Coordinate Systems',
          moduleNumber: 1,
          orderIndex: 0,
          status: 'in_progress' as const,
          lessons: [
            {
              id: 'les-1',
              title: 'Vectors in 3D',
              type: 'monograph' as const,
              durationMinutes: 30,
              sourceName: 'MIT OpenCourseWare',
              sourceUrl: 'https://ocw.mit.edu/courses/8-012/',
              orderIndex: 0,
              summaryPoints: ['Analytical vector decomposition'],
            },
          ],
        },
      ],
    };

    const parsed = NormalizedCourseSchema.safeParse(validCourse);
    assert.strictEqual(parsed.success, true);
  });

  test('NormalizedCourseSchema rejects courses with missing canonical URLs or publisher', () => {
    const invalidCourse = {
      id: 'fake-physics',
      externalId: '123',
      title: 'Fake Course',
      description: 'No publisher or source URL provided.',
      domain: 'Physics',
      level: 'Undergraduate',
      durationHours: 10,
      moduleCount: 1,
      verified: false,
      // Missing publisher, canonicalUrl, and modules
    };

    const parsed = NormalizedCourseSchema.safeParse(invalidCourse);
    assert.strictEqual(parsed.success, false);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      assert.ok(fieldErrors.publisher, 'Must require publisher');
      assert.ok(fieldErrors.canonicalUrl, 'Must require canonicalUrl');
    }
  });

  test('MitOcwAdapter normalizes raw API payloads with institutional metadata and attribution', () => {
    const adapter = new MitOcwAdapter();

    const mockRawMitCourse = {
      id: 101,
      readable_id: '8.012+fall_2008',
      title: 'Physics I: Classical Mechanics',
      description: 'A university physics course covering classical mechanics.',
      url: '/courses/8-012-physics-i-classical-mechanics-fall-2008/',
      departments: [{ department_id: '8', name: 'Physics' }],
      course_feature: ['Lecture Notes', 'Problem Sets', 'Exams with Solutions'],
      runs: [
        {
          level: [{ code: 'Undergraduate' }],
          instructors: [{ full_name: 'Prof. Walter Lewin' }],
        },
      ],
      course: {
        course_numbers: [{ value: '8.012' }],
      },
    };

    // Private method accessed for unit testing normalization logic
    // @ts-expect-error testing private normalization method
    const normalized = adapter.normalizeCourse(mockRawMitCourse);

    assert.ok(normalized);
    assert.strictEqual(normalized.domain, 'Physics');
    assert.strictEqual(normalized.level, 'Undergraduate');
    assert.strictEqual(normalized.publisher, 'Massachusetts Institute of Technology');
    assert.strictEqual(normalized.license, 'Creative Commons BY-NC-SA 4.0');
    assert.strictEqual(
      normalized.canonicalUrl,
      'https://ocw.mit.edu/courses/8-012-physics-i-classical-mechanics-fall-2008/'
    );
    assert.deepStrictEqual(normalized.instructors, ['Prof. Walter Lewin']);
    assert.ok(normalized.modules.length >= 2, 'Should create structured syllabus modules');

    // Verify lessons within module
    const firstMod = normalized.modules[0];
    assert.ok(firstMod.lessons.length >= 1);
    assert.strictEqual(firstMod.lessons[0].sourceName, 'MIT OpenCourseWare');
    assert.strictEqual(firstMod.lessons[0].sourceUrl, normalized.canonicalUrl);
  });
});

describe('Legacy Mock Course Exclusion & Data Cleanliness', () => {
  test('LEGACY_MOCK_COURSE_IDS filters out all fabricated courses from UI presentation', () => {
    const testCatalog = [
      { id: 'jee-physics', title: 'JEE Physics: Class 11 Mechanics & Foundation' },
      { id: 'python-foundations', title: 'Python Foundations: Computational Thinking' },
      { id: 'calculus-3', title: 'Calculus III: Vector Fields & Stokes\' Theorem' },
      { id: 'modern-ai', title: 'Foundations of Modern AI: Linear Algebra to Transformers' },
      { id: 'organic-chemistry', title: 'Organic Chemistry: Reaction Mechanisms & Stereochemistry' },
      { id: 'mit-8-012-physics-i-classical-mechanics', title: 'MIT 8.012: Physics I - Classical Mechanics' },
      { id: 'mit-18-02-multivariable-calculus', title: 'MIT 18.02: Multivariable Calculus' },
    ];

    const filtered = testCatalog.filter((c) => !LEGACY_MOCK_COURSE_IDS.has(c.id));

    assert.strictEqual(filtered.length, 2);
    assert.strictEqual(filtered[0].id, 'mit-8-012-physics-i-classical-mechanics');
    assert.strictEqual(filtered[1].id, 'mit-18-02-multivariable-calculus');
  });

  test('All 11 known legacy mock course IDs are accounted for in exclusion blacklist', () => {
    const expectedLegacyIds = [
      'jee-physics',
      'python-foundations',
      'calculus-3',
      'modern-ai',
      'organic-chemistry',
      'a-to-z-comprehensive-mastery-pat-mutqv4nb',
      'advanced-ai-engineering-from-tra-mutq7hab',
      'python-foundations-computational-mv6cro8p',
      'foundations-of-attention-mechani-mutpu81c',
      'advanced-rotational-dynamics-fro-mutq0uz5',
      'jee-maths-mastering-differential-muqmzehb',
    ];

    for (const legacyId of expectedLegacyIds) {
      assert.ok(
        LEGACY_MOCK_COURSE_IDS.has(legacyId),
        `Exclusion list must contain legacy ID: ${legacyId}`
      );
    }
  });
});
