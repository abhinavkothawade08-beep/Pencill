import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  LearnerGoalInputSchema,
  analyzeLearningGoal,
  educatorIntelligence,
  YouTubeProvider,
  ReadingMaterialProvider,
  normalizeCandidateResource,
  validateResource,
  deduplicateResources,
  scoreResource,
  MIN_RELEVANCE_THRESHOLD,
  generateModuleStudyNotes,
  generateModuleQuiz,
  distributeAndSequenceModuleResources,
  validateCurriculumCoverage,
  ResourceEngineOrchestrator,
  ModulePlan,
} from '../src/lib/resource-engine';

describe('1. Learner Goal Input & Objective Analyzer', () => {
  it('validates learner goal inputs and infers defaults', () => {
    const valid = LearnerGoalInputSchema.parse({ topic: 'Learn Python' });
    assert.equal(valid.topic, 'Learn Python');
    assert.equal(valid.level, 'intermediate');
    assert.equal(valid.weeklyStudyHours, 10);
    assert.equal(valid.targetWeeks, 4);
    assert.equal(valid.language, 'English');
  });

  it('rejects empty or whitespace topic', () => {
    assert.throws(() => {
      LearnerGoalInputSchema.parse({ topic: ' ' });
    });
  });

  it('correctly detects computer_science domain and sets practical coding emphasis', () => {
    const analyzed = analyzeLearningGoal({
      topic: 'React & Frontend Web Development',
      learningStyle: 'practical_projects',
    });
    assert.equal(analyzed.detectedDomain, 'computer_science');
    assert.equal(analyzed.pedagogicalStrategy.videoEmphasis, 'practical_coding');
    assert.equal(analyzed.pedagogicalStrategy.readingEmphasis, 'official_docs');
  });

  it('correctly detects mathematics domain and sets worked derivations emphasis', () => {
    const analyzed = analyzeLearningGoal({
      topic: 'First-Order and Second-Order Differential Equations',
      learningStyle: 'balanced',
    });
    assert.equal(analyzed.detectedDomain, 'mathematics');
    assert.equal(analyzed.pedagogicalStrategy.videoEmphasis, 'worked_derivations');
    assert.equal(analyzed.pedagogicalStrategy.readingEmphasis, 'academic_textbooks');
  });

  it('correctly detects ai_and_data domain for Large Language Models', () => {
    const analyzed = analyzeLearningGoal({
      topic: 'Large Language Models and Transformers',
      learningStyle: 'theory_focused',
    });
    assert.equal(analyzed.detectedDomain, 'ai_and_data');
    assert.equal(analyzed.pedagogicalStrategy.readingEmphasis, 'research_papers');
  });

  it('correctly detects natural_sciences domain for Physics', () => {
    const analyzed = analyzeLearningGoal({
      topic: 'Class 12 Physics: Rotational Dynamics and Gravitation',
      learningStyle: 'exam_preparation',
    });
    assert.equal(analyzed.detectedDomain, 'natural_sciences');
    assert.equal(analyzed.pedagogicalStrategy.readingEmphasis, 'academic_textbooks');
  });
});

describe('2. Master Educator Intelligence System', () => {
  it('retrieves educator by canonical channel ID', () => {
    // 3Blue1Brown channel ID
    const match = educatorIntelligence.findByChannelId('UCYO_jab_esuFRV4b17AJtAw');
    assert.ok(match, '3Blue1Brown should be found');
    assert.equal(match.channelName, '3Blue1Brown');
    assert.ok(match.verificationStatus.includes('VERIFIED'));
  });

  it('retrieves educator by channel name or handle', () => {
    const match = educatorIntelligence.findByNameOrHandle('3Blue1Brown');
    assert.ok(match);
    assert.equal(match.channelName, '3Blue1Brown');
  });

  it('matches verified educators for linear algebra and differential equations', () => {
    const matches = educatorIntelligence.matchEducatorsForObjective('Differential Equations and Calculus', 'mathematics', 3);
    assert.ok(matches.length > 0);
    const hasMathEducator = matches.some((m) => m.subjects.some((s) => s.toLowerCase().includes('calculus') || s.toLowerCase().includes('equation') || s.toLowerCase().includes('math')));
    assert.ok(hasMathEducator, 'Expected at least one math educator in match results');
  });
});

describe('3. Resource Discovery Providers', () => {
  it('ReadingMaterialProvider returns official Python documentation for Python queries', async () => {
    const provider = new ReadingMaterialProvider();
    const results = await provider.search('Python data structures and syntax', {
      maxResults: 2,
      domain: 'computer_science',
    });
    assert.ok(results.length > 0);
    const pythonDoc = results.find((r) => r.url.includes('docs.python.org'));
    assert.ok(pythonDoc, 'Expected official python documentation');
    assert.equal(pythonDoc.modality, 'documentation');
  });

  it('ReadingMaterialProvider returns official React.dev documentation for React queries', async () => {
    const provider = new ReadingMaterialProvider();
    const results = await provider.search('React hooks and state management', {
      maxResults: 2,
      domain: 'computer_science',
    });
    assert.ok(results.length > 0);
    const reactDoc = results.find((r) => r.url.includes('react.dev'));
    assert.ok(reactDoc, 'Expected react.dev documentation');
    assert.equal(reactDoc.modality, 'documentation');
  });

  it('ReadingMaterialProvider returns OpenStax calculus textbook for Differential Equations', async () => {
    const provider = new ReadingMaterialProvider();
    const results = await provider.search('Differential equations analytical solutions', {
      maxResults: 2,
      domain: 'mathematics',
    });
    assert.ok(results.length > 0);
    const openstax = results.find((r) => r.url.includes('openstax.org'));
    assert.ok(openstax, 'Expected OpenStax textbook');
  });

  it('YouTubeProvider parses ISO durations and formats canonical video URLs', () => {
    const provider = new YouTubeProvider('TEST_MOCK_KEY');
    const norm = normalizeCandidateResource({
      providerId: 'youtube',
      externalId: 'dQw4w9WgXcQ',
      title: 'Educational Video Tutorial',
      url: 'https://youtu.be/dQw4w9WgXcQ?si=tracking123',
      modality: 'video',
      durationSeconds: 1800,
    });
    assert.equal(norm.canonicalUrl, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    assert.equal(norm.embedUrl, 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
    assert.equal(norm.durationMinutes, 30);
  });
});

describe('4. Normalization, Validation and Deduplication', () => {
  it('validates well-formed resources and flags invalid URLs', () => {
    const valid = validateResource(
      normalizeCandidateResource({
        providerId: 'official_docs',
        externalId: 'doc1',
        title: 'Valid Documentation',
        url: 'https://docs.python.org/3/',
        modality: 'documentation',
        durationSeconds: 1200,
      })
    );
    assert.equal(valid.valid, true);

    const invalid = validateResource(
      normalizeCandidateResource({
        providerId: 'official_docs',
        externalId: 'doc2',
        title: 'Local Doc',
        url: 'http://localhost:3000/broken',
        modality: 'documentation',
        durationSeconds: 1200,
      })
    );
    assert.equal(invalid.valid, false);
    assert.ok(invalid.errors.some((e) => e.includes('localhost')));
  });

  it('deduplicates resources by canonical URL and YouTube video ID', () => {
    const res1 = normalizeCandidateResource({
      providerId: 'youtube',
      externalId: 'vid123',
      title: 'Lesson 1',
      url: 'https://www.youtube.com/watch?v=vid123&utm_source=test',
      modality: 'video',
      durationSeconds: 1200,
    });
    const res2 = normalizeCandidateResource({
      providerId: 'youtube',
      externalId: 'vid123',
      title: 'Lesson 1 Duplicate',
      url: 'https://youtu.be/vid123',
      modality: 'video',
      durationSeconds: 1200,
    });
    const res3 = normalizeCandidateResource({
      providerId: 'youtube',
      externalId: 'vid456',
      title: 'Lesson 2',
      url: 'https://www.youtube.com/watch?v=vid456',
      modality: 'video',
      durationSeconds: 1500,
    });

    const deduped = deduplicateResources([res1, res2, res3]);
    assert.equal(deduped.length, 2);
  });
});

describe('5. Relevance Scoring and Cross-Domain Collision Gating', () => {
  const dummyModule: ModulePlan = {
    id: 'mod-1',
    moduleNumber: 1,
    title: 'Python Language Foundations & Control Flow',
    description: 'Learn variables, conditionals, loops and functions in Python',
    estimatedHours: 6,
    prerequisites: [],
    expectedOutcomes: ['Write idiomatic Python scripts'],
    learningObjectives: [
      {
        id: 'obj-1',
        statement: 'Apply control flow and loops to solve computational tasks in Python',
        keyTerms: ['python', 'loops', 'control flow'],
      },
    ],
    searchQueries: { videoQueries: [], readingQueries: [] },
  };

  it('awards high relevance score to on-topic Python resource', () => {
    const pythonRes = normalizeCandidateResource({
      providerId: 'youtube',
      externalId: 'py1',
      title: 'Python for Beginners: Control Flow and Loops Explained',
      url: 'https://www.youtube.com/watch?v=py111111111',
      description: 'Complete Python tutorial covering loops, conditionals, and functions with examples.',
      modality: 'video',
      durationSeconds: 1800,
    });

    const scored = scoreResource(pythonRes, dummyModule, 'computer_science', 'Python Programming');
    assert.ok(scored.relevanceScore >= MIN_RELEVANCE_THRESHOLD, `Score ${scored.relevanceScore} should pass gate`);
    assert.equal(scored.passedRelevanceGate, true);
    assert.equal(scored.rejectionReason, undefined);
  });

  it('COLLISION GUARD: Penalizes and rejects Class 11 Physics videos for a Python course', () => {
    const physicsRes = normalizeCandidateResource({
      providerId: 'curated_directory',
      externalId: 'phy1',
      title: 'NCERT Class 11 Physics Chapter 3: Motion in a Straight Line & Kinematics',
      url: 'https://ncert.nic.in/textbook.php?keph1=3-8',
      description: 'Definitive theoretical chapter on rectilinear kinematics, instantaneous velocity and calculus notation.',
      modality: 'monograph',
      durationSeconds: 1800,
    });

    const scored = scoreResource(physicsRes, dummyModule, 'computer_science', 'Python Programming');
    assert.equal(scored.passedRelevanceGate, false, 'Physics must NOT pass gate for Python');
    assert.ok(scored.rejectionReason?.includes('Cross-domain collision'), 'Must flag cross-domain collision');
    assert.ok(scored.scoringFactors.collisionPenalty > 0, 'Collision penalty must be positive');
  });
});

describe('6. Study Notes and Formative Quiz Generation', () => {
  const sampleModule: ModulePlan = {
    id: 'mod-diff-eq',
    moduleNumber: 1,
    title: 'First-Order Differential Equations',
    description: 'Separable equations, integrating factors, and initial value problems.',
    estimatedHours: 6,
    prerequisites: ['Calculus I'],
    expectedOutcomes: ['Analytical solutions to first-order ODEs'],
    learningObjectives: [
      {
        id: 'obj-1',
        statement: 'Solve separable first-order differential equations analytically',
        keyTerms: ['separable', 'differential equation'],
      },
    ],
    searchQueries: { videoQueries: [], readingQueries: [] },
  };

  it('generates grounded study notes with key concepts, misconceptions and takeaways', async () => {
    const notes = await generateModuleStudyNotes(sampleModule, 'mathematics', [], 'Differential Equations');
    assert.ok(notes.length > 0);
    const note = notes[0];
    assert.ok(note.title.includes('First-Order Differential Equations'));
    assert.ok(note.overview.length > 20);
    assert.ok(note.keyConcepts.length > 0);
    assert.ok(note.commonMisconceptions.length > 0);
    assert.ok(note.keyTakeaways.length > 0);
  });

  it('generates formative quiz with 4 options and valid correct answer index', async () => {
    const quiz = await generateModuleQuiz(sampleModule, 'mathematics', [], 'Differential Equations');
    assert.ok(quiz);
    assert.ok(quiz.questions.length >= 1);
    for (const q of quiz.questions) {
      assert.equal(q.options.length, 4);
      assert.ok(q.correctOptionIndex >= 0 && q.correctOptionIndex < 4);
      assert.ok(q.prompt.length > 10);
      assert.ok(q.explanation.length > 10);
    }
  });
});

describe('7. Distribution and Curriculum Coverage Validation', () => {
  it('distributes resources and validates complete coverage', () => {
    const mod: ModulePlan = {
      id: 'mod-1',
      moduleNumber: 1,
      title: 'Core Concepts',
      description: 'Basics',
      estimatedHours: 5,
      prerequisites: [],
      expectedOutcomes: [],
      learningObjectives: [{ id: 'o1', statement: 'Learn basics', keyTerms: ['basics'] }],
      searchQueries: { videoQueries: [], readingQueries: [] },
    };

    const dummyVideo = scoreResource(
      normalizeCandidateResource({
        providerId: 'youtube',
        externalId: 'v1',
        title: 'Computer Science Core Concepts & Algorithms',
        url: 'https://www.youtube.com/watch?v=v1111111111',
        description: 'Computer science core principles and algorithm concepts explained',
        modality: 'video',
        durationSeconds: 1500,
      }),
      mod,
      'computer_science',
      'Computer Science'
    );

    const dummyReading = scoreResource(
      normalizeCandidateResource({
        providerId: 'official_docs',
        externalId: 'r1',
        title: 'Computer Science Core Concepts: Official Documentation & Specifications',
        url: 'https://docs.example.com',
        description: 'Comprehensive computer science core concepts specification and guide',
        modality: 'documentation',
        durationSeconds: 1200,
      }),
      mod,
      'computer_science',
      'Computer Science'
    );

    const assignment = distributeAndSequenceModuleResources(
      mod,
      [dummyVideo],
      [dummyReading],
      [{ id: 'n1', title: 'Notes', type: 'study_notes', overview: 'Overview', estimatedReadingMinutes: 10, keyConcepts: [], commonMisconceptions: [], keyTakeaways: [], verificationStatus: 'curated' }],
      { id: 'q1', title: 'Quiz', moduleId: 'mod-1', moduleTitle: 'Core Concepts', timeLimitMinutes: 10, questions: [{ id: 'q1-1', questionNumber: 1, prompt: 'Q?', questionType: 'multiple_choice', options: ['A', 'B', 'C', 'D'], correctOptionIndex: 0, explanation: 'Exp', difficulty: 'intermediate', learningObjectiveReference: 'Learn basics' }] }
    );

    assert.equal(assignment.videos.length, 1);
    assert.equal(assignment.readings.length, 1);
    assert.ok(assignment.quiz);

    const audit = validateCurriculumCoverage(
      { courseTitle: 'Course', description: 'Desc', domain: 'computer_science', level: 'intermediate', totalEstimatedHours: 10, modules: [mod], pedagogicalRationale: 'Rationale' },
      [assignment, assignment]
    );

    assert.ok(audit.overallCoveragePercent >= 70);
    assert.equal(audit.isComplete, true);
  });
});

describe('8. End-to-End Engine Scenarios Across Domains', () => {
  const orchestrator = new ResourceEngineOrchestrator();

  it('Scenario 1: Python programming from fundamentals to real-world projects', async () => {
    const result = await orchestrator.execute({
      topic: 'Python Programming',
      level: 'beginner',
      learningGoal: 'build_projects',
      weeklyStudyHours: 8,
      targetWeeks: 4,
    });

    assert.equal(result.success, true);
    assert.ok(result.courseId.startsWith('path-'));
    assert.ok(result.curriculum.modules.length >= 3);
    assert.equal(result.curriculum.domain, 'computer_science');

    // Verify all modules have lessons
    for (const assign of result.assignments) {
      assert.ok(assign.readings.length > 0 || assign.studyNotes.length > 0, 'Module must have reading/notes');
      assert.ok(assign.quiz, 'Module must have formative assessment');
    }

    // Verify no Physics video was accidentally assigned to Python
    for (const assign of result.assignments) {
      for (const v of assign.videos) {
        assert.ok(!v.title.toLowerCase().includes('physics') && !v.title.toLowerCase().includes('kinematics'), `Illegal physics video in Python course: ${v.title}`);
      }
    }
  });

  it('Scenario 2: Differential Equations (Theoretical Mathematics)', async () => {
    const result = await orchestrator.execute({
      topic: 'Differential Equations',
      level: 'intermediate',
      learningGoal: 'understand_concepts',
      learningStyle: 'theory_focused',
    });

    assert.equal(result.success, true);
    assert.equal(result.curriculum.domain, 'mathematics');
    assert.ok(result.curriculum.modules.length >= 3);
    // Verify reading contains math textbooks or OpenStax/MIT
    const hasMathReading = result.assignments.some((a) => a.readings.some((r) => r.title.toLowerCase().includes('calculus') || r.title.toLowerCase().includes('equation') || r.canonicalUrl.includes('openstax')));
    assert.ok(hasMathReading, 'Expected mathematical reading resource');
  });

  it('Scenario 3: React Development', async () => {
    const result = await orchestrator.execute({
      topic: 'React Development with Hooks & State Management',
      level: 'intermediate',
      learningStyle: 'practical_projects',
    });

    assert.equal(result.success, true);
    assert.equal(result.curriculum.domain, 'computer_science');
    assert.ok(result.assignments.length >= 3);
  });

  it('Scenario 4: Large Language Models (AI & Data)', async () => {
    const result = await orchestrator.execute({
      topic: 'Large Language Models and Transformers',
      level: 'advanced',
      learningStyle: 'theory_focused',
    });

    assert.equal(result.success, true);
    assert.equal(result.curriculum.domain, 'ai_and_data');
    assert.ok(result.curriculum.modules.length >= 4);
  });

  it('Scenario 5: Examination preparation (JEE Physics / Board Exam)', async () => {
    const result = await orchestrator.execute({
      topic: 'Class 12 Physics: Mechanics and Motion',
      level: 'competitive_exam',
      learningGoal: 'prepare_exam',
      targetExam: 'JEE Advanced',
    });

    assert.equal(result.success, true);
    assert.equal(result.curriculum.domain, 'natural_sciences');
    assert.ok(result.curriculum.modules.length >= 3);
  });
});
