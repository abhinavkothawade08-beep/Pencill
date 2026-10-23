import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { canonicalizeUrl, extractDomain, extractYouTubeVideoId } from '@/lib/resource-engine-v2/utils/url-utils';
import { calculateSourceAuthorityScore, clampScore } from '@/lib/resource-engine-v2/utils/scoring-utils';
import { extractJsonFromText } from '@/lib/resource-engine-v2/utils/text-utils';

describe('Resource Engine Scoring & Normalization Utilities', () => {
  test('URL Canonicalization strips tracking parameters and trailing slashes', () => {
    assert.strictEqual(
      canonicalizeUrl('https://www.youtube.com/watch?v=12345678901&utm_source=test&utm_medium=email'),
      'https://www.youtube.com/watch?v=12345678901'
    );
    assert.strictEqual(
      extractDomain('https://ocw.mit.edu/courses/physics/index.html'),
      'ocw.mit.edu'
    );
    assert.strictEqual(
      extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ'),
      'dQw4w9WgXcQ'
    );
  });

  test('Authority scoring computes correct weights for university & archive domains', () => {
    const mitScore = calculateSourceAuthorityScore('https://ocw.mit.edu/courses/18-02-calculus');
    assert.ok(mitScore >= 80, `MIT OCW should have high authority score >= 80, received: ${mitScore}`);

    const genericScore = calculateSourceAuthorityScore('https://randomblog.com/post');
    assert.ok(genericScore < mitScore, 'Random blog score should be lower than university authority score');
  });

  test('Score clamping stays strictly within bounds', () => {
    assert.strictEqual(clampScore(120, 0, 100), 100);
    assert.strictEqual(clampScore(-15, 0, 100), 0);
    assert.strictEqual(clampScore(75.6, 0, 100), 76);
  });

  test('JSON extraction properly parses markdown-wrapped code blocks', () => {
    const markdownText = '```json\n{"quizTitle": "Calculus Diagnostics", "score": 100}\n```';
    const parsed = extractJsonFromText(markdownText);
    assert.deepStrictEqual(parsed, { quizTitle: 'Calculus Diagnostics', score: 100 });
  });

  test('JSON extraction safely parses unescaped LaTeX math formulas without syntax errors', () => {
    const latexJson = `\`\`\`json
{
  "quizTitle": "Units Diagnostics",
  "questions": [
    {
      "id": "q1",
      "question": "What is the unit of magnetic flux density?\\nFormula: \\vec{B} = \\frac{\\mu_0 I}{2\\pi r}",
      "options": ["Tesla (T)", "Weber (Wb)", "\\text{N}/(\\text{A}\\cdot\\text{m})", "Henry"]
    }
  ]
}
\`\`\``;
    const parsed = extractJsonFromText<{ quizTitle: string; questions: Array<{ question: string }> }>(latexJson);
    assert.ok(parsed, 'Must parse JSON containing LaTeX');
    assert.strictEqual(parsed?.quizTitle, 'Units Diagnostics');
    assert.ok(parsed?.questions[0].question.includes('\\vec{B}'));
  });

  test('JSON extraction recovers truncated JSON responses', () => {
    const truncated = '{"quizTitle": "Rotational Mechanics", "items": ["Item 1", "Item 2';
    const parsed = extractJsonFromText<{ quizTitle: string; items: string[] }>(truncated);
    assert.ok(parsed, 'Must repair and parse truncated JSON');
    assert.strictEqual(parsed?.quizTitle, 'Rotational Mechanics');
  });
});

describe('Module-Wise Resource Distribution', () => {
  test('distributeResourcesToCourse assigns resources contextually by topic affinity', async () => {
    const { distributeResourcesToCourse } = await import('@/lib/resource-engine-v2');

    const samplePath = {
      title: 'Classical Mechanics Course',
      description: 'Foundations and advanced mechanics',
      domain: 'Physics',
      level: 'Class 11',
      durationHours: 20,
      moduleCount: 2,
      tags: ['Physics'],
      syllabusNote: 'Note',
      weeklyCheckpoint: { title: 'W1', description: 'D1', targetMilestone: 'M1' },
      modules: [
        {
          title: 'Vectors and Kinematics',
          moduleNumber: 1,
          estimatedHours: 10,
          objective: 'Master 1D and 2D kinematics with vector notation',
          lessons: [
            {
              title: 'Vector Addition and Resolving Components',
              type: 'video' as const,
              estimatedMinutes: 30,
              keyConcepts: ['Vectors', 'Dot Product', 'Components'],
              sourceName: 'Default Source',
            },
            {
              title: 'Kinematics Practice Problems',
              type: 'practice' as const,
              estimatedMinutes: 45,
              keyConcepts: ['Acceleration', 'Trajectories'],
              sourceName: 'Default Practice',
            },
          ],
        },
        {
          title: 'Work, Energy, and Conservative Forces',
          moduleNumber: 2,
          estimatedHours: 10,
          objective: 'Analyze kinetic and potential energy transformations',
          lessons: [
            {
              title: 'Work-Energy Theorem & Power',
              type: 'video' as const,
              estimatedMinutes: 35,
              keyConcepts: ['Work', 'Kinetic Energy', 'Conservative Force'],
              sourceName: 'Default Source',
            },
          ],
        },
      ],
    };

    const mockResources: any[] = [
      {
        id: 'res-energy',
        title: 'Work and Kinetic Energy Derivations',
        description: 'Detailed analysis of work energy theorem and power calculations',
        type: 'video_lecture',
        canonicalUrl: 'https://youtube.com/watch?v=energy123',
        sourceUrl: 'https://youtube.com/watch?v=energy123',
        sourceName: 'Physics Open Channel',
        provider: 'youtube',
        durationMinutes: 32,
        difficulty: 'intermediate',
        score: { overall: 88, relevance: 90, educationalValue: 85, structureCompleteness: 85, freshness: 80 },
        tags: ['Work', 'Energy', 'Power'],
      },
      {
        id: 'res-vectors',
        title: 'Vectors & 2D Kinematics Masterclass',
        description: 'Complete breakdown of vector resolution, dot products, and position vectors',
        type: 'video_lecture',
        canonicalUrl: 'https://youtube.com/watch?v=vector123',
        sourceUrl: 'https://youtube.com/watch?v=vector123',
        sourceName: 'MIT OCW',
        provider: 'youtube',
        durationMinutes: 40,
        difficulty: 'intermediate',
        score: { overall: 94, relevance: 95, educationalValue: 95, structureCompleteness: 90, freshness: 85 },
        tags: ['Vectors', 'Kinematics'],
      },
      {
        id: 'res-kinematics-practice',
        title: 'Kinematics and Projectile Motion Problem Set',
        description: 'Comprehensive 20-problem sheet with step-by-step solutions',
        type: 'practice_questions',
        canonicalUrl: 'https://openstax.org/practice/kinematics',
        sourceUrl: 'https://openstax.org/practice/kinematics',
        sourceName: 'OpenStax Archive',
        provider: 'practice',
        durationMinutes: 45,
        difficulty: 'intermediate',
        score: { overall: 91, relevance: 92, educationalValue: 90, structureCompleteness: 90, freshness: 85 },
        tags: ['Kinematics', 'Problems'],
      },
    ];

    const distributed = distributeResourcesToCourse(samplePath, mockResources);

    // Module 1 Lesson 1 (Vectors) must match the vector resource, NOT the first array element (energy)
    const mod1Les1 = distributed.modules[0].lessons[0] as any;
    assert.strictEqual(mod1Les1.sourceUrl, 'https://youtube.com/watch?v=vector123');
    assert.strictEqual(mod1Les1.sourceName, 'MIT OCW');

    // Module 1 Lesson 2 (Practice) must receive the kinematics practice set
    const mod1Les2 = distributed.modules[0].lessons[1] as any;
    assert.strictEqual(mod1Les2.sourceUrl, 'https://openstax.org/practice/kinematics');

    // Module 2 Lesson 1 (Work-Energy) must match the energy video
    const mod2Les1 = distributed.modules[1].lessons[0] as any;
    assert.strictEqual(mod2Les1.sourceUrl, 'https://youtube.com/watch?v=energy123');
  });
});


describe('Search Planning & Query Normalization', () => {
  test('SearchPlanner avoids redundant prefix duplication in practice queries', async () => {
    const { SearchPlanner } = await import('../.backup_engine_v1/core/search-planner');
    const planner = new SearchPlanner();

    const plan = planner.createPracticePlan('JEE Physics Rotational Dynamics', { examContext: 'JEE' });
    for (const item of plan) {
      assert.ok(
        !item.query.startsWith('JEE JEE'),
        `Query should not repeat prefix: "${item.query}"`
      );
    }
  });
});

