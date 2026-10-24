import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  EducatorRegistry,
  EducatorMatcher,
  ChannelVerifier,
  MASTER_EDUCATOR_DIRECTORY,
  MasterEducatorRecord,
  DOMAIN_TAXONOMY,
  EXAMINATION_DIRECTORY,
  VERIFIED_LEARNING_RESOURCES,
} from '@/lib/resource-engine-v2/educators';
import {
  YouTubeProvider,
  LegacySearchPlanner as SearchPlanner,
  DeduplicationEngine,
  QualityScoringEngine,
  ValidationEngine,
  type EngineResource,
  DEFAULT_ENGINE_CONFIG,
  distributeResourcesToCourse,
} from '../src/lib/resource-engine-v2';
import { GeneratedLearningPath } from '@/services/ai';

describe('Master Educator Directory Integration Test Suite', () => {
  const registry = new EducatorRegistry();

  function makeResource(overrides: Partial<EngineResource>): EngineResource {
    const rawId = overrides.id || `res_${Math.random().toString(36).substring(2, 9)}`;
    const cleanVideoId = (overrides.metadata?.videoId as string) || rawId.padEnd(11, '0').slice(0, 11);

    return {
      id: rawId,
      title: overrides.title || 'Sample Lecture Title',
      description: overrides.description || 'Comprehensive conceptual lecture covering fundamentals and derivations.',
      type: overrides.type || 'video_lecture',
      sourceUrl: overrides.sourceUrl || `https://www.youtube.com/watch?v=${cleanVideoId}`,
      canonicalUrl: overrides.canonicalUrl || `https://www.youtube.com/watch?v=${cleanVideoId}`,
      sourceName: overrides.sourceName || 'YouTube',
      provider: 'youtube',
      authorOrChannel: overrides.authorOrChannel || 'Sample Channel',
      durationMinutes: overrides.durationMinutes || 45,
      difficulty: overrides.difficulty || 'intermediate',
      language: overrides.language || 'English',
      tags: overrides.tags || ['lecture'],
      score: overrides.score || {
        overall: 80,
        relevance: 85,
        educationalValue: 80,
        structureCompleteness: 80,
        freshness: 75,
      },
      discoveredAt: new Date().toISOString(),
      metadata: {
        videoId: cleanVideoId,
        isEmbeddable: true,
        ...overrides.metadata,
      },
      ...overrides,
    };
  }

  // --------------------------------------------------------------------------
  // Test A: Educator Matching (Maharashtra HSC Mathematics)
  // --------------------------------------------------------------------------
  test('Test A: Maharashtra HSC Mathematics prioritizes state-board specialists (Dinesh Sir / Pawan Wagh)', () => {
    const context = EducatorMatcher.deriveContext({
      courseTitle: 'Maharashtra State Board Class 12 Mathematics',
      moduleTitle: 'Matrices and Differentiation for HSC Board Exam',
      moduleObjective: 'Master HSC syllabus matrices, derivatives, and Maharashtra Board PYQs',
      subject: 'Mathematics',
      academicLevel: 'Class 12',
      examination: 'Maharashtra HSC',
      country: 'India',
      preferredLanguage: 'Marathi',
    });

    const matches = EducatorMatcher.matchEducators(context, { limit: 5 });
    assert.ok(matches.length > 0, 'Should find candidate educators for Maharashtra HSC Mathematics');

    const topEducatorIds = matches.map((m) => m.educator.Educator_ID);
    const topEducatorNames = matches.map((m) => m.educator.Educator_Name);

    // Dinesh Sir (EDU-003) and Pawan Wagh (EDU-004) must be ranked at the very top
    assert.ok(
      topEducatorIds.includes('EDU-003') || topEducatorIds.includes('EDU-004'),
      `Top matches must include Dinesh Sir or Pawan Wagh. Got: ${topEducatorNames.join(', ')}`
    );

    const firstMatch = matches[0];
    assert.ok(
      firstMatch.score.totalScore >= 70,
      `Top match score should be high (>= 70), got: ${firstMatch.score.totalScore}`
    );
    assert.ok(
      firstMatch.matchingReasons.some((r) => r.toLowerCase().includes('hsc') || r.toLowerCase().includes('maharashtra') || r.toLowerCase().includes('mathematics')),
      `Match reasons must mention HSC or Maharashtra curriculum alignment: ${firstMatch.matchingReasons.join('; ')}`
    );

    // International / non-state-board educator should rank lower than state specialists
    const khanIndex = matches.findIndex((m) => m.educator.Educator_ID === 'EDU-001');
    if (khanIndex !== -1) {
      assert.ok(
        khanIndex > 0,
        'International general curriculum (Khan Academy) must rank below Maharashtra State Board specialists'
      );
    }
  });

  // --------------------------------------------------------------------------
  // Test B: Examination Matching (JEE Physics)
  // --------------------------------------------------------------------------
  test('Test B: JEE Physics preparation prioritizes Mohit Tyagi / Competishun / Physics Wallah', () => {
    const context = EducatorMatcher.deriveContext({
      courseTitle: 'JEE Advanced Physics Mechanics & Electromagnetism',
      moduleTitle: 'Rotational Motion and Angular Momentum for JEE',
      moduleObjective: 'Derive moment of inertia and solve advanced JEE problem sets',
      subject: 'Physics',
      academicLevel: 'Competitive',
      examination: 'JEE Advanced',
      country: 'India',
    });

    const matches = EducatorMatcher.matchEducators(context, { limit: 5 });
    assert.ok(matches.length > 0, 'Should find candidate educators for JEE Physics');

    const topNames = matches.map((m) => m.educator.Educator_Name);
    const topIds = matches.map((m) => m.educator.Educator_ID);

    // Mohit Tyagi (EDU-037) or Physics Wallah (EDU-036) must be in top matches
    const hasJeeSpecialist = topIds.includes('EDU-037') || topIds.includes('EDU-036');
    assert.ok(hasJeeSpecialist, `Top matches must include Mohit Tyagi or Physics Wallah. Got: ${topNames.join(', ')}`);

    // Top match must have high exam relevance score
    const topMatch = matches[0];
    assert.ok(topMatch.score.examinationAlignment >= 80, 'JEE specialist must score high on exam relevance');
    assert.ok(topMatch.score.subjectRelevance >= 80, 'JEE specialist must score high on physics subject relevance');
  });

  // --------------------------------------------------------------------------
  // Test C: Complete Course Preference (Python Programming)
  // --------------------------------------------------------------------------
  test('Test C: Python course request prioritizes complete courses and comprehensive playlists', () => {
    const context = EducatorMatcher.deriveContext({
      courseTitle: 'Python Programming from Scratch to Advanced',
      moduleTitle: 'Variables, Data Types and Control Flow in Python',
      moduleObjective: 'Learn Python programming syntax, data structures, and object-oriented programming',
      subject: 'Python',
      academicLevel: 'Beginner',
      desiredResourceType: 'Complete Course',
    });

    const matches = EducatorMatcher.matchEducators(context, { limit: 5 });
    assert.ok(matches.length > 0, 'Should match top programming educators');

    const topIds = matches.map((m) => m.educator.Educator_ID);
    // freeCodeCamp (EDU-014), CS50 (EDU-013), Corey Schafer (EDU-016), or Chai aur Code (EDU-017)
    const hasPremierPythonEducator =
      topIds.includes('EDU-014') ||
      topIds.includes('EDU-013') ||
      topIds.includes('EDU-016') ||
      topIds.includes('EDU-017');

    assert.ok(
      hasPremierPythonEducator,
      `Top programming matches must include freeCodeCamp, CS50, Corey Schafer, or Chai aur Code. Got: ${topIds.join(', ')}`
    );

    // Verify complete course availability bonus is reflected in score breakdown
    const topMatch = matches[0];
    assert.ok(topMatch.educator.Complete_Course_Available || topMatch.educator.Playlist_Available);

    // Module distributor test: comprehensive tutorial candidate wins over short standalone clip
    const testPath: GeneratedLearningPath = {
      title: 'Python Programming Foundations',
      description: 'Master Python syntax, data structures, and functions.',
      domain: 'Computer Science',
      level: 'Beginner',
      modules: [
        {
          title: 'Module 1: Introduction to Python',
          moduleNumber: 1,
          objective: 'Learn Python fundamentals',
          lessons: [
            { title: 'Python Syntax and Variables', type: 'video', estimatedMinutes: 60, keyConcepts: ['variables', 'data types'] },
          ],
        },
        {
          title: 'Module 2: Control Structures',
          moduleNumber: 2,
          objective: 'Master if/else, loops, and conditions',
          lessons: [
            { title: 'Loops and Conditionals in Python', type: 'video', estimatedMinutes: 60, keyConcepts: ['loops', 'conditionals'] },
          ],
        },
      ],
    };

    const comprehensiveTutorial = makeResource({
      id: 'fcc-py-full',
      title: 'Python for Beginners - Full Course [Programming Tutorial]',
      durationMinutes: 260,
      type: 'full_course',
      sourceName: 'freeCodeCamp.org',
      authorOrChannel: 'freeCodeCamp.org',
      educatorId: 'EDU-014',
      discoverySource: 'curated_directory',
      score: { overall: 94, relevance: 95, educationalValue: 95, structureCompleteness: 95, freshness: 85 },
    });

    const shortTipVideo = makeResource({
      id: 'short-py-tip',
      title: '5 Python Tips and Tricks in 3 Minutes',
      durationMinutes: 3,
      type: 'video_lecture',
      sourceName: 'Random Creator',
      score: { overall: 60, relevance: 50, educationalValue: 50, structureCompleteness: 40, freshness: 90 },
    });

    const distributed = distributeResourcesToCourse(testPath, [comprehensiveTutorial, shortTipVideo]);
    const m1Lesson = distributed.modules[0].lessons[0];

    assert.equal(
      m1Lesson.sourceName,
      'freeCodeCamp.org',
      'Module distributor must select comprehensive full course over short tip video'
    );
    assert.equal(m1Lesson.educatorId, 'EDU-014');
    assert.equal(m1Lesson.discoverySource, 'curated_directory');
  });

  // --------------------------------------------------------------------------
  // Test D: Topic and Subject Relevance Guardrail
  // --------------------------------------------------------------------------
  test('Test D: Topic guardrail prioritizes true ML educators and rejects elementary science educators', () => {
    const context = EducatorMatcher.deriveContext({
      courseTitle: 'Deep Learning and Neural Network Architectures',
      moduleTitle: 'Transformers, Self-Attention Mechanisms and GPT',
      moduleObjective: 'Implement multi-head self-attention and GPT models from scratch',
      subject: 'Machine Learning',
      specificTopic: 'Transformers and Deep Learning',
      academicLevel: 'Undergraduate',
    });

    const matches = EducatorMatcher.matchEducators(context, { limit: 5 });
    const topIds = matches.map((m) => m.educator.Educator_ID);
    const topNames = matches.map((m) => m.educator.Educator_Name);

    // Andrej Karpathy (EDU-025), StatQuest (EDU-026), CampusX (EDU-027), or Krish Naik (EDU-028)
    const hasMlSpecialist =
      topIds.includes('EDU-025') ||
      topIds.includes('EDU-026') ||
      topIds.includes('EDU-027') ||
      topIds.includes('EDU-028');

    assert.ok(
      hasMlSpecialist,
      `Machine learning request must prioritize Karpathy, StatQuest, CampusX, or Krish Naik. Got: ${topNames.join(', ')}`
    );

    // K-12 school-level educators (e.g. EDU-001 or EDU-003) must NOT be at the top of an advanced ML request
    const topEducator = matches[0].educator;
    assert.notEqual(
      topEducator.Primary_Domain,
      'School Education',
      'Advanced deep learning request must not have a School Education educator as #1'
    );

    // QualityScoringEngine should reject off-topic video despite high generic publisher authority
    const qualityEngine = new QualityScoringEngine();
    const offTopicCandidate = makeResource({
      title: 'Middle School Physical Science: Forces and Motion',
      description: 'Grade 7 physics lesson on gravity and friction.',
      authorOrChannel: 'Khan Academy',
      score: { overall: 85, relevance: 15, educationalValue: 80, structureCompleteness: 80, freshness: 80 },
    });

    const scores = qualityEngine.filterAndScoreBatch(
      [offTopicCandidate],
      'Transformers self-attention neural network',
      'educational',
      50
    );

    assert.equal(
      scores.length,
      0,
      'Off-topic school science video must be filtered out for an advanced machine learning query'
    );
  });

  // --------------------------------------------------------------------------
  // Test E: Duplicate Prevention
  // --------------------------------------------------------------------------
  test('Test E: Multiple searches returning identical video IDs are strictly deduplicated', () => {
    const deduplicator = new DeduplicationEngine();

    const videoA = makeResource({
      id: 'res-1',
      title: 'Neural Networks: Zero to Hero',
      sourceUrl: 'https://www.youtube.com/watch?v=VMj-3S1tku0',
      canonicalUrl: 'https://www.youtube.com/watch?v=VMj-3S1tku0',
      authorOrChannel: 'Andrej Karpathy',
      educatorId: 'EDU-015',
    });

    const videoB = makeResource({
      id: 'res-2',
      title: 'Neural Networks: Zero to Hero (Watch on YouTube)',
      sourceUrl: 'https://youtu.be/VMj-3S1tku0?si=trackingParam123',
      canonicalUrl: 'https://www.youtube.com/watch?v=VMj-3S1tku0',
      authorOrChannel: 'Andrej Karpathy',
      educatorId: 'EDU-015',
    });

    const deduplicated = deduplicator.deduplicate([videoA, videoB]);
    assert.equal(deduplicated.length, 1, 'Two instances of the same video ID must deduplicate to 1 resource');
    assert.equal(deduplicated[0].canonicalUrl, 'https://www.youtube.com/watch?v=VMj-3S1tku0');
  });

  // --------------------------------------------------------------------------
  // Test F: Semantic Redundancy Reduction
  // --------------------------------------------------------------------------
  test('Test F: Redundant introductory videos from the same channel are pruned', () => {
    const deduplicator = new DeduplicationEngine();

    const intro1 = makeResource({
      id: 'res-intro-1',
      title: 'Python for Beginners 2024: Full Introduction Course',
      description: 'Learn python from basics',
      authorOrChannel: 'freeCodeCamp.org',
      educatorId: 'EDU-014',
    });

    const intro2 = makeResource({
      id: 'res-intro-2',
      title: 'Python for Beginners 2023: Full Introduction Course',
      description: 'Learn python from basics',
      authorOrChannel: 'freeCodeCamp.org',
      educatorId: 'EDU-014',
    });

    const advancedCourse = makeResource({
      id: 'res-adv-1',
      title: 'Intermediate Python Programming: Generators, Decorators & OOP',
      description: 'Advanced Python structures',
      authorOrChannel: 'freeCodeCamp.org',
      educatorId: 'EDU-014',
    });

    const result = deduplicator.deduplicate([intro1, intro2, advancedCourse]);
    assert.ok(
      result.length <= 2,
      `Semantic deduplication should remove redundant introductory clone. Expected <= 2, got ${result.length}`
    );
  });

  // --------------------------------------------------------------------------
  // Test G: Missing Channel ID Verification via Handle & Anti-Impersonation
  // --------------------------------------------------------------------------
  test('Test G: Handles missing channel IDs safely and rejects false title mentions', () => {
    // 1. Resolve educator with handle when channel ID is not hardcoded
    const mockEducator: MasterEducatorRecord = {
      Educator_ID: 'EDU-TEST-HANDLE',
      Educator_Name: 'Test Specialist',
      Educator_Type: 'Independent Educator',
      YouTube_Channel_Name: 'DeepLearningAI',
      YouTube_Channel_ID: '',
      Official_Channel_URL: 'https://www.youtube.com/@DeepLearningAI',
      Official_Website: '',
      Primary_Domain: 'Computer Science',
      Subdomain: '',
      Subjects: 'Deep Learning',
      Relevant_Examinations: '',
      Country: 'United States',
      Primary_Language: 'English',
      Additional_Languages: '',
      Teaching_Level: 'Undergraduate',
      Teaching_Specialization: 'Deep Learning',
      Available_Resource_Types: 'Playlists',
      Complete_Course_Available: 'Yes',
      Playlist_Available: 'Yes',
      Subject_Expertise_Evidence: 'AI Research',
      Educational_Credibility: 'Coursera Partner',
      Quality_Assessment: 'Tier 1',
      Verification_Status: 'VERIFIED',
      Active_Status: 'Active',
      Last_Verified_Date: '2026-10-18',
      Source_URLs: '',
      Research_Notes: '',
    };

    // Extract handle
    const handle = ChannelVerifier.extractHandle(mockEducator.Official_Channel_URL);
    assert.equal(handle, '@deeplearningai', 'Should extract clean lowercase handle');

    // Verification check: Genuine channel video
    const genuineResult = ChannelVerifier.verifyChannelIdentity(
      {
        videoTitle: 'Generative AI for Everyone',
        channelTitle: 'DeepLearningAI',
        channelId: 'UCxxxxxxxx',
        description: 'Official lecture by DeepLearningAI team.',
      },
      mockEducator
    );

    assert.ok(genuineResult.isVerifiedEducator, 'Genuine channel video must be verified');
    assert.equal(genuineResult.confidence, 'verified_channel_title');

    // Anti-impersonation check: Third-party video that merely mentions educator in title
    const fakeResult = ChannelVerifier.verifyChannelIdentity(
      {
        videoTitle: 'Why Andrew Ng and DeepLearningAI Are Wrong About AI',
        channelTitle: 'Random Vlogger 123',
        channelId: 'UCdifferentChannel',
        description: 'My personal opinion on DeepLearningAI courses.',
      },
      mockEducator
    );

    assert.equal(
      fakeResult.isVerifiedEducator,
      false,
      'Third party video with creator name in title must NOT be attributed to the educator'
    );
  });

  // --------------------------------------------------------------------------
  // Test H: Fallback Discovery for Niche Topics
  // --------------------------------------------------------------------------
  test('Test H: Niche topic not in directory triggers graceful fallback without breaking', async () => {
    const nicheContext = EducatorMatcher.deriveContext({
      courseTitle: 'Ancient Hittite Cuneiform Epigraphy and Translation',
      moduleTitle: 'Deciphering Bronze Age Boghazkoy Tablets',
      moduleObjective: 'Analyze phonetic and logographic values in Hittite cuneiform scripts',
      academicLevel: 'Undergraduate',
    });

    const matches = EducatorMatcher.matchEducators(nicheContext, { minScore: 50 });
    // Since ancient Hittite is not in master directory, matches should be empty or below strict threshold
    assert.equal(matches.length, 0, 'No directory educator should falsely match ancient Hittite cuneiform');

    // Planner should safely fall back to open discovery
    const planner = new SearchPlanner();
    const query = 'Deciphering Bronze Age Boghazkoy Tablets Hittite cuneiform';
    const plan = planner.createPlan({
      rawQuery: query,
      topic: query,
      isAcademic: true,
      needsVisual: false,
      needsMonograph: true,
      needsPractice: false,
      needsStructuredCourse: false,
      targetLevel: 'advanced',
    });

    assert.ok(plan.queries.length > 0, 'SearchPlanner must still produce queries for open discovery');
    assert.ok(
      plan.queries.some((q) => q.provider === 'notes' || q.provider === 'google'),
      'Plan should include academic notes and web search providers'
    );
  });

  // --------------------------------------------------------------------------
  // Test I: Module-Level Resource Relevance Across 4 Modules
  // --------------------------------------------------------------------------
  test('Test I: Multi-module course distributes distinct, relevant resources per module', () => {
    const testCourse: GeneratedLearningPath = {
      title: 'Comprehensive Machine Learning Pipeline',
      description: 'End to end machine learning from linear algebra to deep neural networks.',
      domain: 'Computer Science',
      level: 'Undergraduate',
      modules: [
        {
          title: 'Module 1: Linear Algebra Foundations',
          moduleNumber: 1,
          objective: 'Master matrix operations, eigenvectors and eigenvalues',
          lessons: [{ title: 'Eigenvalues and Eigenvectors', type: 'video', estimatedMinutes: 30, keyConcepts: ['eigenvalues', 'eigenvectors'] }],
        },
        {
          title: 'Module 2: Classical Supervised Learning',
          moduleNumber: 2,
          objective: 'Implement Linear and Logistic Regression',
          lessons: [{ title: 'Logistic Regression and Cost Functions', type: 'video', estimatedMinutes: 30, keyConcepts: ['logistic regression'] }],
        },
        {
          title: 'Module 3: Neural Networks and Backpropagation',
          moduleNumber: 3,
          objective: 'Understand multilayer perceptrons and gradient descent',
          lessons: [{ title: 'Backpropagation Calculus', type: 'video', estimatedMinutes: 30, keyConcepts: ['backpropagation', 'gradient descent'] }],
        },
        {
          title: 'Module 4: Transformer Architecture',
          moduleNumber: 4,
          objective: 'Implement Multi-Head Attention',
          lessons: [{ title: 'Self-Attention in Transformers', type: 'video', estimatedMinutes: 30, keyConcepts: ['attention', 'transformers'] }],
        },
      ],
    };

    const resMod1 = makeResource({
      id: 'res-mod-1',
      title: 'Eigenvalues and Eigenvectors Explained Visually',
      description: 'Matrix diagonalization and eigenvalues',
      metadata: { moduleNumber: 1, videoId: 'res-mod-100' },
      score: { overall: 90, relevance: 92, educationalValue: 90, structureCompleteness: 90, freshness: 80 },
    });

    const resMod2 = makeResource({
      id: 'res-mod-2',
      title: 'Logistic Regression Step by Step',
      description: 'Classification algorithms and decision boundaries',
      metadata: { moduleNumber: 2, videoId: 'res-mod-200' },
      score: { overall: 88, relevance: 90, educationalValue: 88, structureCompleteness: 88, freshness: 80 },
    });

    const resMod3 = makeResource({
      id: 'res-mod-3',
      title: 'Backpropagation and Gradient Descent Derivations',
      description: 'Neural network training calculus',
      metadata: { moduleNumber: 3, videoId: 'res-mod-300' },
      score: { overall: 92, relevance: 94, educationalValue: 92, structureCompleteness: 90, freshness: 85 },
    });

    const resMod4 = makeResource({
      id: 'res-mod-4',
      title: 'Transformers and Multi-Head Self-Attention from Scratch',
      description: 'Attention mechanisms in deep learning',
      metadata: { moduleNumber: 4, videoId: 'res-mod-400' },
      score: { overall: 95, relevance: 96, educationalValue: 95, structureCompleteness: 95, freshness: 90 },
    });

    const distributed = distributeResourcesToCourse(testCourse, [resMod1, resMod2, resMod3, resMod4]);

    const l1 = distributed.modules[0].lessons[0];
    const l2 = distributed.modules[1].lessons[0];
    const l3 = distributed.modules[2].lessons[0];
    const l4 = distributed.modules[3].lessons[0];

    assert.equal(l1.sourceUrl, resMod1.sourceUrl, 'Module 1 must receive Linear Algebra resource');
    assert.equal(l2.sourceUrl, resMod2.sourceUrl, 'Module 2 must receive Logistic Regression resource');
    assert.equal(l3.sourceUrl, resMod3.sourceUrl, 'Module 3 must receive Backpropagation resource');
    assert.equal(l4.sourceUrl, resMod4.sourceUrl, 'Module 4 must receive Transformer resource');

    // Ensure no cross-module leakage
    const assignedUrls = [l1.sourceUrl, l2.sourceUrl, l3.sourceUrl, l4.sourceUrl];
    const uniqueAssigned = new Set(assignedUrls);
    assert.equal(uniqueAssigned.size, 4, 'All 4 modules must receive distinct non-leaking resources');
  });

  // --------------------------------------------------------------------------
  // Test J: Persistence Verification
  // --------------------------------------------------------------------------
  test('Test J: Educator metadata and selection explanations survive JSON serialization and cache cycles', () => {
    const testCourse: GeneratedLearningPath = {
      title: 'Physics for Competitive Exams',
      description: 'Curated by Mohit Tyagi (Competishun)',
      domain: 'Physics',
      level: 'Competitive',
      modules: [
        {
          title: 'Module 1: Kinematics',
          moduleNumber: 1,
          objective: 'Master 1D and 2D kinematics',
          lessons: [{ title: 'Projectile Motion', type: 'video', estimatedMinutes: 45, keyConcepts: ['kinematics', 'projectile motion'] }],
        },
      ],
    };

    const educatorResource = makeResource({
      id: 'comp-kin-1',
      title: 'Projectile Motion Complete Lecture | JEE Advanced',
      sourceName: 'Mohit Tyagi',
      authorOrChannel: 'Mohit Tyagi',
      educatorId: 'EDU-007',
      educatorName: 'Mohit Tyagi & Competishun Faculty Team',
      discoverySource: 'curated_directory',
      verificationStatus: 'VERIFIED',
      selectionExplanation: 'Sourced from master educator Mohit Tyagi for JEE Advanced Physics',
      coverageAssessment: 'Covers 100% of Module 1 learning objectives',
    });

    const distributed = distributeResourcesToCourse(testCourse, [educatorResource]);
    const lesson = distributed.modules[0].lessons[0];

    // Verify fields before serialization
    assert.equal(lesson.educatorId, 'EDU-007');
    assert.equal(lesson.educatorName, 'Mohit Tyagi & Competishun Faculty Team');
    assert.equal(lesson.discoverySource, 'curated_directory');
    assert.equal(lesson.verificationStatus, 'VERIFIED');

    // Simulate serialization cycle (e.g. localStorage / database roundtrip)
    const serialized = JSON.stringify(distributed);
    const restored = JSON.parse(serialized) as GeneratedLearningPath;
    const restoredLesson = restored.modules[0].lessons[0] as any;

    assert.equal(restoredLesson.educatorId, 'EDU-007');
    assert.equal(restoredLesson.educatorName, 'Mohit Tyagi & Competishun Faculty Team');
    assert.equal(restoredLesson.discoverySource, 'curated_directory');
    assert.equal(restoredLesson.verificationStatus, 'VERIFIED');
    assert.ok(
      restoredLesson.selectionReason.includes('Mohit Tyagi'),
      'Selection reason must preserve educator name across serialization'
    );
  });

  // --------------------------------------------------------------------------
  // Test K: Unavailable Resource Handling
  // --------------------------------------------------------------------------
  test('Test K: Unplayable / private / non-embeddable videos are safely rejected and replaced', () => {
    const validator = new ValidationEngine();

    const unplayableVideo = makeResource({
      id: 'unplayable-1',
      title: 'Private Lecture on Algorithms',
      metadata: {
        isEmbeddable: false, // Flagged unplayable
      },
      score: { overall: 80, relevance: 85, educationalValue: 80, structureCompleteness: 80, freshness: 80 },
    });

    const playableVideo = makeResource({
      id: 'playable-1',
      title: 'Open Access Algorithms Masterclass',
      metadata: {
        isEmbeddable: true,
      },
      score: { overall: 85, relevance: 88, educationalValue: 85, structureCompleteness: 85, freshness: 85 },
    });

    const validBatch = validator.filterValid([unplayableVideo, playableVideo]);
    assert.equal(validBatch.length, 1, 'Unembeddable video must be safely filtered out');
    assert.equal(validBatch[0].id, 'playable-1', 'Only playable video should be retained');
  });

  // --------------------------------------------------------------------------
  // Test L: Directory Import & Validation (60 Records)
  // --------------------------------------------------------------------------
  test('Test L: All 60 records imported, validated against schema, duplicates handled, and malformed rejected', () => {
    const allEducators = registry.getAll();
    assert.equal(
      allEducators.length,
      60,
      `Directory must contain exactly 60 curated educators (EDU-001 to EDU-060). Found: ${allEducators.length}`
    );

    // Verify first and last records
    const first = registry.getById('EDU-001');
    assert.ok(first, 'EDU-001 (Khan Academy) must be present');
    assert.equal(first?.Educator_Name, 'Salman Khan & Khan Academy Team');

    const last = registry.getById('EDU-060');
    assert.ok(last, 'EDU-060 (ChrisFix) must be present');
    assert.equal(last?.Educator_Name, 'ChrisFix');

    // Duplicate detection check
    const dupSummary = registry.importRecords([first], { overwrite: false });
    assert.equal(dupSummary.duplicateCount, 1, 'Importing existing record without overwrite must count as duplicate');

    // Malformed record check (missing required fields)
    const malformed = {
      Educator_ID: 'MALFORMED-001',
      // Missing Educator_Name and Primary_Domain
    };
    const malformedSummary = registry.importRecords([malformed]);
    assert.equal(malformedSummary.invalidCount, 1, 'Malformed record missing required fields must be rejected');

    // Verify taxonomies and blueprints
    assert.equal(registry.getAllDomains().length, 14, 'Must have 14 domain taxonomies');
    assert.equal(registry.getAllExaminations().length, 25, 'Must have 25 examination blueprints');
    assert.equal(registry.getVerifiedLearningResources().length, 12, 'Must have 12 verified flagship resources');
  });

  // --------------------------------------------------------------------------
  // Test M: Full Regression and Integration Test
  // --------------------------------------------------------------------------
  test('Test M: Full regression test verifies YouTubeProvider fallback to verified resources in offline mode', async () => {
    const ytProvider = new YouTubeProvider();
    assert.ok(ytProvider.isAvailable(), 'YouTubeProvider must be available (with API key or verified dataset fallback)');

    // Search for a flagship Algorithms topic covered in VERIFIED_LEARNING_RESOURCES (RES-004)
    const results = await ytProvider.search('Algorithms Complete Course', {
      limit: 3,
      targetTypes: ['full_course', 'youtube_playlist'],
    });

    assert.ok(results.length > 0, 'YouTubeProvider should return verified flagship resources in test/offline mode');
    const topResult = results[0];
    assert.ok(topResult.title.toLowerCase().includes('algorithm'));
    assert.equal(topResult.discoverySource, 'curated_directory');
    assert.ok(topResult.educatorId, 'Discovered resource must carry educatorId');
    assert.ok(topResult.educatorName, 'Discovered resource must carry educatorName');
  });
});
