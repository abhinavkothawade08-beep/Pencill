import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  evaluateTopicConsistency,
  auditCourseTopicConsistency,
  sanitizeInputObjectives,
  sanitizeInputSubtopics,
  validateModuleTopicConsistency,
} from '../src/lib/curriculum-intelligence/topic-consistency-validator';
import { planIntelligentCurriculum } from '../src/lib/curriculum-intelligence/syllabus-planner';
import { CuratorEngine } from '../src/curator';
import { DEFAULT_BUILDER_CONFIG_STATE, BuilderConfig } from '../src/lib/types/builderConfig';
import { evaluatePlaylist } from '../src/lib/resource-engine/playlist-intelligence';
import { scoreResource } from '../src/lib/resource-engine/scorer';
import { validateCurriculumCoverage } from '../src/lib/resource-engine/coverage-validator';
import { repairCourseTopicMismatches, getLearningPathById } from '../src/services/supabase/pathService';
import { analyzeLearningGoal } from '../src/lib/resource-engine/analyzer';
import { LearningPath } from '../src/types';

describe('Topic Consistency & Context Leakage Prevention Suite', () => {
  // Test 1: Public Speaking generates 100% speech curriculum with ZERO physics concepts
  it('1. Public Speaking & Presentation generates speech curriculum with 0 physics contamination', async () => {
    const config: BuilderConfig = {
      ...DEFAULT_BUILDER_CONFIG_STATE,
      title: 'Public Speaking & Presentation',
      domainId: 'humanities',
      subjectId: 'communication',
      selectedTopics: [
        {
          id: 'topic-ps-1',
          label: 'Public Speaking & Presentation',
          source: 'custom',
          complexity: 3,
        },
      ],
      // User passed tainted objectives from old default state
      learningObjectives: [
        { id: 'lo-1', text: 'Derive and explain rotational dynamics, torque, and moment of inertia of regular bodies.' },
        { id: 'lo-2', text: 'Solve multi-body equilibrium, inclined plane, and friction problems with free-body diagrams.' },
        { id: 'lo-3', text: 'Apply conservation of energy and angular momentum to rolling motion without slipping.' },
      ],
      subtopics: [
        'Units, Dimensions & Measurement Errors',
        'System of Particles & Rotational Dynamics',
      ],
    };

    const engine = new CuratorEngine();
    const result = await engine.run(config);

    assert.ok(result.modules.length >= 3, 'Must generate multiple cohesive modules');

    const allModuleTitles = result.modules.map((m) => m.title).join(' ');
    const allObjectives = result.modules.flatMap((m) => m.objectives).join(' ');
    const fullText = (allModuleTitles + ' ' + allObjectives).toLowerCase();

    // Verify ZERO physics contamination
    assert.strictEqual(fullText.includes('torque'), false, 'Must not contain torque');
    assert.strictEqual(fullText.includes('moment of inertia'), false, 'Must not contain moment of inertia');
    assert.strictEqual(fullText.includes('rotational dynamics'), false, 'Must not contain rotational dynamics');
    assert.strictEqual(fullText.includes('free-body diagram'), false, 'Must not contain free-body diagram');
    assert.strictEqual(fullText.includes('rolling motion'), false, 'Must not contain rolling motion');
    assert.strictEqual(fullText.includes('inclined plane'), false, 'Must not contain inclined plane');

    // Verify speech & presentation pedagogical presence
    const hasSpeechTerms =
      fullText.includes('speech') ||
      fullText.includes('presentation') ||
      fullText.includes('audience') ||
      fullText.includes('vocal') ||
      fullText.includes('rhetoric') ||
      fullText.includes('slide');
    assert.ok(hasSpeechTerms, 'Must contain authentic public speaking curriculum terms');
  });

  // Test 2: Python Programming generates Python curriculum with 0 Physics/Public Speaking content
  it('2. Python Programming generates Python curriculum without cross-domain leakage', async () => {
    const config: BuilderConfig = {
      ...DEFAULT_BUILDER_CONFIG_STATE,
      title: 'Python Programming',
      domainId: 'computer-science',
      subjectId: 'python',
      selectedTopics: [
        {
          id: 'topic-py-1',
          label: 'Python Programming',
          source: 'custom',
          complexity: 3,
        },
      ],
      learningObjectives: [],
      subtopics: [],
    };

    const engine = new CuratorEngine();
    const result = await engine.run(config);

    const fullText = result.modules
      .map((m) => `${m.title} ${m.objectives.join(' ')}`)
      .join(' ')
      .toLowerCase();

    assert.ok(fullText.includes('python'), 'Must focus on Python');
    assert.strictEqual(fullText.includes('torque'), false, 'No physics');
    assert.strictEqual(fullText.includes('speech architecture'), false, 'No public speaking');
  });

  // Test 3: Physics generates Physics curriculum
  it('3. Physics generates genuine Physics curriculum', async () => {
    const config: BuilderConfig = {
      ...DEFAULT_BUILDER_CONFIG_STATE,
      title: 'Class 11 Mechanics & Rotational Dynamics',
      selectedTopics: [
        {
          id: 'topic-phys-1',
          label: 'Class 11 Mechanics & Rotational Dynamics',
          source: 'popular',
          complexity: 3,
        },
      ],
    };

    const engine = new CuratorEngine();
    const result = await engine.run(config);

    const fullText = result.modules
      .map((m) => `${m.title} ${m.objectives.join(' ')}`)
      .join(' ')
      .toLowerCase();

    assert.ok(
      fullText.includes('motion') || fullText.includes('energy') || fullText.includes('kinematics'),
      'Must contain authentic physics curriculum'
    );
  });

  // Test 4: Mathematics generates Mathematics curriculum
  it('4. Differential Equations generates Mathematics curriculum', async () => {
    const config: BuilderConfig = {
      ...DEFAULT_BUILDER_CONFIG_STATE,
      title: 'Differential Equations & Dynamic Systems',
      domainId: 'mathematics',
      subjectId: 'calculus',
      selectedTopics: [
        {
          id: 'topic-math-1',
          label: 'Differential Equations & Dynamic Systems',
          source: 'custom',
          complexity: 3,
        },
      ],
      learningObjectives: [],
      subtopics: [],
    };

    const engine = new CuratorEngine();
    const result = await engine.run(config);

    const fullText = result.modules
      .map((m) => `${m.title} ${m.objectives.join(' ')}`)
      .join(' ')
      .toLowerCase();

    assert.ok(
      fullText.includes('differential') || fullText.includes('laplace') || fullText.includes('equations'),
      'Must contain math/differential equations curriculum'
    );
    assert.strictEqual(fullText.includes('torque'), false, 'No physics leaks');
    assert.strictEqual(fullText.includes('rhetoric'), false, 'No public speaking leaks');
  });

  // Test 5: React Development generates React curriculum
  it('5. React Development generates React curriculum', async () => {
    const config: BuilderConfig = {
      ...DEFAULT_BUILDER_CONFIG_STATE,
      title: 'React Development & Modern Frontend Architecture',
      domainId: 'computer-science',
      subjectId: 'web-development',
      selectedTopics: [
        {
          id: 'topic-react-1',
          label: 'React Development & Modern Frontend Architecture',
          source: 'custom',
          complexity: 3,
        },
      ],
      learningObjectives: [],
      subtopics: [],
    };

    const engine = new CuratorEngine();
    const result = await engine.run(config);

    const fullText = result.modules
      .map((m) => `${m.title} ${m.objectives.join(' ')}`)
      .join(' ')
      .toLowerCase();

    assert.ok(fullText.includes('react') || fullText.includes('component'), 'Must contain React curriculum');
    assert.strictEqual(fullText.includes('torque'), false, 'No physics leaks');
  });

  // Test 6: Concurrent course generations have completely isolated contexts
  it('6. Concurrent course generations execute in isolated contexts with 0 cross-contamination', async () => {
    const engine1 = new CuratorEngine();
    const engine2 = new CuratorEngine();

    const [resSpeaking, resPhysics] = await Promise.all([
      engine1.run({
        ...DEFAULT_BUILDER_CONFIG_STATE,
        title: 'Public Speaking & Presentation',
        selectedTopics: [{ id: 'ps-1', label: 'Public Speaking & Presentation', source: 'custom', complexity: 3 }],
        learningObjectives: [],
        subtopics: [],
      }),
      engine2.run({
        ...DEFAULT_BUILDER_CONFIG_STATE,
        title: 'Physics: Kinematics & Mechanics',
        selectedTopics: [{ id: 'ph-1', label: 'Physics: Kinematics & Mechanics', source: 'custom', complexity: 3 }],
      }),
    ]);

    const speakingText = resSpeaking.modules.map((m) => m.title).join(' ').toLowerCase();
    const physicsText = resPhysics.modules.map((m) => m.title).join(' ').toLowerCase();

    assert.strictEqual(speakingText.includes('kinematics'), false, 'Speaking must have no physics');
    assert.strictEqual(speakingText.includes('torque'), false, 'Speaking must have no torque');
    assert.ok(physicsText.includes('motion') || physicsText.includes('kinematics') || physicsText.includes('mechanics'), 'Physics must retain mechanics');
  });

  // Test 7: Sanitization filters out stale/conflicting objectives and subtopics
  it('7. sanitizeInputObjectives and sanitizeInputSubtopics purge conflicting cross-domain terms', () => {
    const rawObjectives = [
      { id: '1', text: 'Derive and explain rotational dynamics, torque, and moment of inertia of regular bodies.' },
      { id: '2', text: 'Craft a compelling opening hook and analyze audience demographics.' },
      { id: '3', text: 'Apply conservation of energy and angular momentum to rolling motion without slipping.' },
      { id: '4', text: 'Master diaphragmatic breathing and deliberate pause control.' },
    ];

    const sanitized = sanitizeInputObjectives(rawObjectives, 'Public Speaking & Presentation');
    assert.strictEqual(sanitized.length, 2, 'Only the 2 speech objectives must survive');
    assert.strictEqual(sanitized[0].text.includes('audience'), true);
    assert.strictEqual(sanitized[1].text.includes('breathing'), true);

    const rawSubtopics = [
      'Units, Dimensions & Measurement Errors',
      'Speech Architecture & Rhetoric',
      'System of Particles & Rotational Dynamics',
      'Visual Slide Design',
    ];

    const sanitizedSubs = sanitizeInputSubtopics(rawSubtopics, 'Public Speaking & Presentation');
    assert.strictEqual(sanitizedSubs.length, 2, 'Only speech subtopics must survive');
    assert.deepStrictEqual(sanitizedSubs, ['Speech Architecture & Rhetoric', 'Visual Slide Design']);
  });

  // Test 8: Playlist rejection: Classical Mechanics playlist is rejected for Public Speaking with score 0
  it('8. evaluatePlaylist rejects Classical Mechanics playlist for Public Speaking with score 0 and E_NO_YOUTUBE', () => {
    const mechanicsPlaylist = {
      id: 'pl-physics-class11-mechanics',
      title: 'Class 11 Physics Mechanics Full Course',
      channelName: 'Physics Wallah',
      channelId: 'UCV3Nm3T-XesgB_bMlsj-38A',
      playlistUrl: 'https://www.youtube.com/playlist?list=PL_physics_11_mechanics',
      itemCount: 45,
      topicsCovered: ['Kinematics', 'Dynamics', 'Rotational Motion'],
      coverageStatus: 'VERIFIED_COMPLETE' as const,
      isCurated: true,
      items: [
        { videoId: 'v1', title: 'Rotational Dynamics Lecture 1', videoUrl: 'https://youtube.com/watch?v=v1', sequenceNumber: 1 },
      ],
    };

    const evalResult = evaluatePlaylist(
      mechanicsPlaylist,
      'Speech Architecture, Rhetoric & Audience Analysis',
      ['Craft opening hook', 'Analyze audience'],
      'Public Speaking & Presentation'
    );

    assert.strictEqual(evalResult.score, 0, 'Cross-domain collision must result in 0 score');
    assert.strictEqual(evalResult.diagnosticCode, 'E_NO_YOUTUBE', 'Must yield E_NO_YOUTUBE diagnostic');
    assert.ok(evalResult.exclusionReason?.includes('collision') || evalResult.exclusionReason?.includes('incompatible'));
  });

  // Test 9: Resource scoring rejects conflicting video with 0 score
  it('9. scoreResource gives 0 score and fails relevance gate for cross-domain collision', () => {
    const physicsResource = {
      providerId: 'youtube' as const,
      externalId: 'rot-1',
      title: 'Rotational Motion: Torque and Moment of Inertia Explained',
      url: 'https://youtube.com/watch?v=rot1',
      description: 'Complete physics lecture on torque, angular momentum, and moment of inertia derivations.',
      modality: 'video' as const,
      authorOrChannel: 'Physics Galaxy',
    };

    const score = scoreResource(
      physicsResource as any,
      'Speech Architecture, Rhetoric & Audience Analysis',
      ['Audience analysis', 'Speech structuring', 'Rhetorical appeals'],
      'Public Speaking & Presentation'
    );

    assert.strictEqual(score.combinedScore, 0, 'Resource with cross-domain collision must receive 0 combined score');
    assert.strictEqual(score.relevanceScore, 0, 'Resource with cross-domain collision must receive 0 relevance score');
    assert.strictEqual(score.passedRelevanceGate, false, 'Relevance gate must fail');
    assert.ok(score.rejectionReason?.includes('collision') || score.rejectionReason?.includes('Relevance score'), 'Must have collision rejection reason');
  });

  // Test 10: Coverage validator fails quality gate on mismatched content
  it('10. validateCurriculumCoverage fails Topic Coverage Gate when modules conflict with course topic', () => {
    const plan = {
      courseTitle: 'Public Speaking & Presentation',
      description: 'Master public speaking and presentation skills',
      domain: 'humanities_and_social_sciences' as const,
      level: 'intermediate' as const,
      totalEstimatedHours: 20,
      pedagogicalRationale: 'Master verbal and non-verbal skills',
      modules: [
        {
          id: 'mod-1',
          moduleNumber: 1,
          title: 'Units, Dimensions & Error Analysis',
          description: 'Physics dimensional analysis',
          learningObjectives: [],
          prerequisites: [],
          estimatedHours: 5,
          expectedOutcomes: [],
          searchQueries: { videoQueries: [], readingQueries: [] },
        },
      ],
    };

    const assignments = [
      {
        moduleId: 'mod-1',
        moduleTitle: 'Units, Dimensions & Error Analysis',
        videos: [
          {
            resource: {
              providerId: 'youtube' as const,
              externalId: 'vid-dim-1',
              title: 'Dimensional Analysis and Error Calculation',
              url: 'https://youtube.com/watch?v=dim1',
              modality: 'video' as const,
            },
            totalScore: 80,
            status: 'ACCEPTED' as const,
            subscores: {} as any,
            matchedObjectives: [],
            missingObjectives: [],
            relevanceGatePassed: true,
          },
        ],
        readings: [],
        studyNotes: [{ id: 'n1', title: 'Dimensions', moduleId: 'mod-1', chapterOutline: [], substantiveContent: 'test', keyTakeaways: [], reviewQuestions: [] }],
        quiz: { id: 'q1', title: 'Quiz', moduleId: 'mod-1', moduleTitle: 'Units', timeLimitMinutes: 10, questions: [{ id: 'q1-1', questionNumber: 1, text: 'Q1', options: ['A', 'B'], correctOptionIndex: 0, explanation: 'Exp' }] },
        coverageScore: 80,
        unmetObjectives: [],
      },
    ];

    const audit = validateCurriculumCoverage(plan, assignments as any);

    assert.strictEqual(audit.qualityGates?.topicCoverage.status, 'FAILED', 'Topic coverage must FAIL on collision');
    assert.strictEqual(audit.qualityGates?.allPassed, false, 'All gates must not pass');
    assert.strictEqual(audit.isComplete, false, 'Course cannot be marked complete with cross-domain collision');
  });

  // Test 11: Audit and repair mechanism heals corrupted course without data loss
  it('11. repairCourseTopicMismatches heals path-public-speaking-presenta-mwayiapo cleanly', () => {
    const corruptedCourse: LearningPath = {
      id: 'path-public-speaking-presenta-mwayiapo',
      title: 'Public Speaking & Presentation',
      description: 'Old corrupted description with physics mechanics',
      domain: 'school-education',
      level: 'Intermediate',
      durationHours: 24,
      moduleCount: 4,
      verified: true,
      modules: [
        {
          id: 'mod-1-corrupted',
          pathId: 'path-public-speaking-presenta-mwayiapo',
          title: 'Units, Dimensions & Error Analysis',
          moduleNumber: 1,
          orderIndex: 0,
          status: 'in_progress',
          totalResources: 2,
          completedResources: 0,
          lessons: [
            {
              id: 'l-1',
              moduleId: 'mod-1-corrupted',
              title: 'Rotational Dynamics, Torque, and Moment of Inertia',
              type: 'video',
              durationMinutes: 45,
              orderIndex: 0,
              sourceName: 'Physics Wallah',
              sourceUrl: 'https://youtube.com/watch?v=phys1',
            },
          ],
        },
      ],
    };

    const { path: repaired, repaired: wasRepaired } = repairCourseTopicMismatches(corruptedCourse);

    assert.strictEqual(wasRepaired, true, 'Corrupted course must be flagged as repaired');
    assert.strictEqual(repaired.id, 'path-public-speaking-presenta-mwayiapo', 'Preserves original course ID');
    assert.strictEqual(repaired.modules!.length, 4, 'Restores full 4 cohesive modules');

    const repairedText = repaired.modules!
      .map((m) => `${m.title} ${m.lessons.map((l) => l.title).join(' ')}`)
      .join(' ')
      .toLowerCase();

    assert.strictEqual(repairedText.includes('torque'), false, 'All torque references removed');
    assert.strictEqual(repairedText.includes('rotational'), false, 'All rotational references removed');
    assert.strictEqual(repairedText.includes('moment of inertia'), false, 'All moment of inertia references removed');
    assert.ok(repairedText.includes('speech architecture') || repairedText.includes('vocal dynamics'), 'Contains genuine public speaking modules');
  });

  // Test 12: getLearningPathById retrieves healed course for path-public-speaking-presenta-mwayiapo
  it('12. getLearningPathById returns healed public speaking course for target ID', async () => {
    const course = await getLearningPathById('path-public-speaking-presenta-mwayiapo');
    assert.ok(course, 'Course must be returned');
    assert.strictEqual(course!.id, 'path-public-speaking-presenta-mwayiapo');
    assert.strictEqual(course!.title, 'Public Speaking & Presentation');
    assert.strictEqual(course!.modules!.length, 4);

    const fullText = course!.modules!
      .map((m) => `${m.title} ${m.lessons.map((l) => l.title).join(' ')}`)
      .join(' ')
      .toLowerCase();

    assert.strictEqual(fullText.includes('rotational dynamics'), false);
    assert.strictEqual(fullText.includes('free-body diagram'), false);
    assert.ok(fullText.includes('speech architecture'));
  });
});
