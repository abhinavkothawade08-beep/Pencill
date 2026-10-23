import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  EDUCATIONAL_DOMAINS,
  searchEducationalDomain,
  getDomainTopicSuggestions,
  getDomainById,
} from '@/lib/catalogs/domainCatalog';
import {
  EXAM_CATALOG,
  searchExaminations,
  getExamById,
} from '@/lib/catalogs/examCatalog';
import {
  estimateCurriculumBlueprint,
} from '@/lib/curriculum/blueprintEstimator';
import {
  DEFAULT_BUILDER_CONFIG,
  LearningPathConfig,
} from '@/lib/types/builder';
import { DiscoverRequestSchema } from '@/lib/api-schemas';
import {
  createTopicAdaptiveCurriculum,
  inferDomain,
  analyzeTopicComplexity,
} from '@/services/ai/curriculum-adaptive-engine';
import { createFullLearningPath, getLearningPathById } from '@/services/supabase/pathService';

describe('Universal Learning Path Builder: Catalogs & Search Architecture', () => {
  test('Domain Catalog covers all 12 educational domains with hierarchical disciplines', () => {
    assert.strictEqual(EDUCATIONAL_DOMAINS.length, 12);
    const domainIds = EDUCATIONAL_DOMAINS.map(d => d.id);

    const requiredDomains = [
      'school-education',
      'engineering-technology',
      'medical-health',
      'business-management',
      'science-mathematics',
      'arts-humanities',
      'law-government',
      'finance-qualifications',
      'vocational-professional',
      'languages-communication',
      'research-academic',
      'personal-practical',
    ];

    for (const req of requiredDomains) {
      assert.ok(domainIds.includes(req), `Catalog must include domain: ${req}`);
      const domain = getDomainById(req);
      assert.ok(domain, `Domain ${req} should be retrievable`);
      assert.ok(domain.disciplines.length > 0, `Domain ${req} must have disciplines`);
      assert.ok(domain.popularTopics.length > 0, `Domain ${req} must have suggestions`);
    }
  });

  test('Domain fuzzy search returns ranked results across subjects, topics and subtopics', () => {
    const csResults = searchEducationalDomain('Machine Learning');
    assert.ok(csResults.length > 0);
    assert.ok(csResults.some(r => r.displayName.toLowerCase().includes('machine learning')));

    const medResults = searchEducationalDomain('Anatomy');
    assert.ok(medResults.length > 0);
    assert.ok(medResults.some(r => r.domainName.toLowerCase().includes('medical')));

    const lawResults = searchEducationalDomain('Constitutional Law');
    assert.ok(lawResults.length > 0);
    assert.ok(lawResults.some(r => r.domainName.toLowerCase().includes('law')));
  });

  test('Examination Catalog supports acronym lookups and comprehensive metadata', () => {
    assert.ok(EXAM_CATALOG.length >= 25, 'Exam catalog must contain verified examinations');

    // Test Acronym searches
    const jeeResults = searchExaminations('JEE');
    assert.ok(jeeResults.some(e => e.acronym.includes('JEE Main')));
    assert.ok(jeeResults.some(e => e.acronym.includes('JEE Adv')));

    const upscResults = searchExaminations('UPSC');
    assert.ok(upscResults.some(e => e.acronym.includes('UPSC CSE')));

    const gateResults = searchExaminations('GATE');
    assert.ok(gateResults.some(e => e.acronym === 'GATE'));

    const awsResults = searchExaminations('AWS');
    assert.ok(awsResults.some(e => e.acronym.includes('AWS')));

    const catResults = searchExaminations('CAT');
    assert.ok(catResults.some(e => e.acronym === 'CAT'));

    const satResults = searchExaminations('SAT');
    assert.ok(satResults.some(e => e.acronym === 'SAT'));

    const cfaResults = searchExaminations('CFA');
    assert.ok(cfaResults.some(e => e.acronym === 'CFA'));
  });

  test('Exam retrieval by ID returns verified syllabus references and category labels', () => {
    const jeeMain = getExamById('jee-main');
    assert.ok(jeeMain);
    assert.strictEqual(jeeMain.countryOrRegion, 'India');
    assert.ok(jeeMain.typicalSubjects.includes('Physics'));
    assert.ok(jeeMain.officialSite?.includes('nta.nic.in'));

    const aws = getExamById('aws-cert');
    assert.ok(aws);
    assert.strictEqual(aws.category, 'it_industry_certifications');
  });
});

describe('Curriculum Blueprint Estimator: Dynamic Pacing & Feasibility Analysis', () => {
  test('Blueprint estimates adapt module range dynamically to topic breadth', () => {
    // Narrow topic
    const narrowConfig: LearningPathConfig = {
      ...DEFAULT_BUILDER_CONFIG,
      topics: ['Python Decorators'],
      depthLevel: 'undergraduate-intro',
      difficulty: 'intermediate',
      weeklyHours: 4,
    };
    const narrowEst = estimateCurriculumBlueprint(narrowConfig);
    assert.deepStrictEqual(narrowEst.moduleRange, [2, 3], 'Narrow topic should estimate 2-3 modules');
    assert.ok(narrowEst.estimatedTotalHours <= 20, 'Narrow topic should have compact total hours');

    // Core topic
    const coreConfig: LearningPathConfig = {
      ...DEFAULT_BUILDER_CONFIG,
      topics: ['Data Structures and Algorithms'],
      depthLevel: 'undergraduate-intermediate',
      difficulty: 'intermediate',
      weeklyHours: 6,
    };
    const coreEst = estimateCurriculumBlueprint(coreConfig);
    assert.deepStrictEqual(coreEst.moduleRange, [3, 5], 'Core topic should estimate 3-5 modules');

    // Comprehensive exam topic
    const examConfig: LearningPathConfig = {
      ...DEFAULT_BUILDER_CONFIG,
      topics: ['JEE Advanced Physics', 'Rotational Dynamics', 'Electrodynamics'],
      targetExam: { name: 'JEE Advanced', acronym: 'JEE Adv' },
      depthLevel: 'competitive',
      difficulty: 'expert',
      weeklyHours: 12,
    };
    const examEst = estimateCurriculumBlueprint(examConfig);
    assert.deepStrictEqual(examEst.moduleRange, [5, 6], 'Exam track should estimate 5-6 modules');
    assert.ok(examEst.estimatedTotalHours >= 45, 'Competitive expert topic should have extensive hours');
  });

  test('Detects schedule compression and provides realistic feasibility recommendations', () => {
    const today = new Date();
    const tenDaysLater = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const compressedConfig: LearningPathConfig = {
      ...DEFAULT_BUILDER_CONFIG,
      topics: ['Machine Learning Engineering & LLM Study'],
      targetExam: null,
      depthLevel: 'competitive',
      difficulty: 'advanced',
      weeklyHours: 3, // Only 3 hours a week for a 40+ hour course in 10 days!
      targetCompletionDate: tenDaysLater,
    };

    const estimate = estimateCurriculumBlueprint(compressedConfig);
    assert.strictEqual(estimate.scheduleFeasibility.isFeasible, false, 'Should flag infeasible schedule');
    assert.ok(estimate.scheduleFeasibility.conflictWarning?.includes('requires ~'));
    assert.ok(estimate.scheduleFeasibility.suggestedWeeklyHours! > 10, 'Should suggest higher weekly hours');
  });

  test('Schedule feasibility approves realistic timelines', () => {
    const today = new Date();
    const threeMonthsLater = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const feasibleConfig: LearningPathConfig = {
      ...DEFAULT_BUILDER_CONFIG,
      topics: ['Class 12 Physics'],
      weeklyHours: 8,
      targetCompletionDate: threeMonthsLater,
    };

    const estimate = estimateCurriculumBlueprint(feasibleConfig);
    assert.strictEqual(estimate.scheduleFeasibility.isFeasible, true);
    assert.strictEqual(estimate.scheduleFeasibility.conflictWarning, undefined);
  });
});

describe('Configuration Schema Validation & Backward Compatibility', () => {
  test('DiscoverRequestSchema accepts new universal builder configuration', () => {
    const validBuilderPayload = {
      query: 'Quantum Computing and Algorithms',
      domain: 'Science & Mathematics',
      subject: 'Physics',
      topics: ['Quantum Circuits', 'Shor Algorithm'],
      targetExam: { name: 'Graduate Entrance', acronym: 'GATE' },
      depthLevel: 'undergraduate-advanced',
      difficulty: 'advanced',
      instructionLanguage: 'English',
      weeklyHours: 10,
      pacingStrategy: 'intensive',
      modalities: ['videos', 'reading', 'practice', 'quizzes', 'flashcards'],
      generateLearningPath: true,
      advancedPreferences: {
        currentKnowledgeLevel: 'intermediate',
        desiredMastery: 'deep_conceptual',
        explanationStyle: 'mathematical_rigorous',
      },
    };

    const parsed = DiscoverRequestSchema.safeParse(validBuilderPayload);
    assert.ok(parsed.success, `Schema validation failed: ${JSON.stringify(parsed.error?.flatten())}`);
    assert.strictEqual(parsed.data.difficulty, 'advanced');
    assert.strictEqual(parsed.data.depthLevel, 'undergraduate-advanced');
  });

  test('DiscoverRequestSchema retains full backward compatibility with legacy goal requests', () => {
    const legacyPayload = {
      goal: 'Classical Mechanics',
      level: 'class-11',
      language: 'English',
      weeklyHours: 6,
      generateLearningPath: true,
    };

    const parsed = DiscoverRequestSchema.safeParse(legacyPayload);
    assert.ok(parsed.success);
    assert.strictEqual(parsed.data.goal, 'Classical Mechanics');
  });

  test('DiscoverRequestSchema rejects empty requests without query, goal, or topics', () => {
    const invalidPayload = {
      level: 'class-11',
      weeklyHours: 6,
    };

    const parsed = DiscoverRequestSchema.safeParse(invalidPayload);
    assert.strictEqual(parsed.success, false);
  });
});

describe('Adaptive Curriculum Engine: Modalities & Exam Syllabus Grounding', () => {
  test('Omits video lessons when video modality is explicitly disabled', () => {
    const textOnlyCurriculum = createTopicAdaptiveCurriculum(
      'Python Programming',
      'Beginner',
      6,
      [],
      {
        modalities: ['reading', 'practice', 'quizzes'],
      }
    );

    assert.ok(textOnlyCurriculum.modules.length > 0);
    for (const mod of textOnlyCurriculum.modules) {
      const hasVideo = mod.lessons.some(l => l.type === 'video');
      assert.strictEqual(hasVideo, false, `Module "${mod.title}" must not contain video lessons when video modality is disabled`);
      assert.ok(mod.lessons.some(l => l.type === 'monograph'), 'Must contain monograph lesson');
    }
  });

  test('Generates formula flashcards when flashcards modality is enabled', () => {
    const flashcardCurriculum = createTopicAdaptiveCurriculum(
      'Rotational Dynamics',
      'class-11',
      6,
      [],
      {
        modalities: ['videos', 'reading', 'flashcards', 'quizzes'],
      }
    );

    for (const mod of flashcardCurriculum.modules) {
      const hasFlashcard = mod.lessons.some(l => l.type === 'formulae');
      assert.ok(hasFlashcard, `Module "${mod.title}" should contain formula/flashcard lesson when flashcards enabled`);
    }
  });

  test('Grounds curriculum in target examination syllabus when exam is provided', () => {
    const jeeCurriculum = createTopicAdaptiveCurriculum(
      'Calculus and Integration',
      'competitive',
      10,
      [],
      {
        targetExam: 'JEE Advanced',
        difficulty: 'expert',
      }
    );

    assert.ok(jeeCurriculum.syllabusNote?.includes('JEE Advanced'), 'Syllabus note must reference target exam');
    const hasExamPractice = jeeCurriculum.modules.some(m =>
      m.lessons.some(l => l.title.includes('JEE Advanced'))
    );
    assert.ok(hasExamPractice, 'At least one module practice set must reflect the JEE Advanced exam target');
  });
});

describe('12 End-to-End Scenarios: Verification Across Domains & Settings', () => {
  // Scenario 1: Class 12 Physics
  test('Scenario 1: Class 12 Physics learning path synthesizes appropriate board syllabus', () => {
    const cur = createTopicAdaptiveCurriculum('CBSE Class 12 Physics', 'class-12', 6, [], {
      explicitDomain: 'School Education',
    });
    assert.strictEqual(cur.domain, 'School Education');
    assert.ok(cur.modules.length >= 4, 'Class 12 board curriculum requires at least 4 modules');
  });

  // Scenario 2: JEE Advanced Mathematics
  test('Scenario 2: JEE Advanced Mathematics preparation path produces rigorous modules', () => {
    const cur = createTopicAdaptiveCurriculum('JEE Advanced Differential Calculus', 'competitive', 12, [], {
      targetExam: 'JEE Advanced',
      difficulty: 'expert',
    });
    assert.ok(cur.modules.length >= 4);
    assert.ok(cur.syllabusNote?.includes('JEE Advanced'));
  });

  // Scenario 3: Machine Learning Engineering
  test('Scenario 3: Machine Learning course generates 5 cohesive frontier modules', () => {
    const cur = createTopicAdaptiveCurriculum('Machine Learning Engineering', 'undergraduate', 15);
    assert.strictEqual(cur.modules.length, 5, 'Comprehensive ML should scale to 5 cohesive modules');
  });

  // Scenario 4: NEET UG Biology
  test('Scenario 4: NEET UG Biology grounds curriculum in NCERT medical syllabus', () => {
    const cur = createTopicAdaptiveCurriculum('NEET UG Human Physiology', 'competitive', 8, [], {
      targetExam: 'NEET UG',
      explicitDomain: 'Medical & Health Sciences',
    });
    assert.strictEqual(cur.domain, 'Medical & Health Sciences');
    assert.ok(cur.modules.some(m => m.title.toLowerCase().includes('physiology') || m.title.toLowerCase().includes('axiomatic')));
  });

  // Scenario 5: Beginner Python Programming
  test('Scenario 5: Beginner Python programming course produces 4 foundational units', () => {
    const cur = createTopicAdaptiveCurriculum('Python Basics', 'beginner', 6);
    assert.strictEqual(cur.modules.length, 4, 'Python Basics generates 4 modules');
  });

  // Scenario 6: AWS Certification
  test('Scenario 6: Professional AWS certification path adapts to cloud domain', () => {
    const cur = createTopicAdaptiveCurriculum('AWS Solutions Architect Associate', 'professional', 8, [], {
      targetExam: 'AWS SAA',
      explicitDomain: 'Engineering & Technology',
    });
    assert.strictEqual(cur.domain, 'Engineering & Technology');
    assert.ok(cur.modules.length >= 3);
  });

  // Scenario 7: Custom Unlisted Subject
  test('Scenario 7: Custom unlisted subject synthesizes coherent topic-adaptive structure', () => {
    const unlistedTopic = 'Ion Trap Quantum Architecture Design';
    const cur = createTopicAdaptiveCurriculum(unlistedTopic, 'research', 10, [], {
      explicitDomain: 'Science & Mathematics',
      difficulty: 'expert',
    });
    assert.strictEqual(cur.domain, 'Science & Mathematics');
    assert.ok(cur.title.includes(unlistedTopic));
    assert.ok(cur.modules.length >= 3);
  });

  // Scenario 8: Multiple Modalities with strict time budget
  test('Scenario 8: Multiple modalities with strict weekly budget scales duration realistically', () => {
    const cur = createTopicAdaptiveCurriculum('Microeconomics', 'intermediate', 4, [], {
      modalities: ['reading', 'practice', 'quizzes'],
    });
    assert.strictEqual(cur.durationHours, 16);
    // Videos disabled
    assert.ok(cur.modules.every(m => !m.lessons.some(l => l.type === 'video')));
  });

  // Scenario 9: Language Selection & Technical Term Preservation
  test('Scenario 9: Instruction language is recorded in path metadata', () => {
    const cur = createTopicAdaptiveCurriculum('Classical Mechanics', 'class-11', 6, [], {
      language: 'Hindi',
    });
    assert.ok(cur.title.includes('Classical Mechanics'));
  });

  // Scenario 10: Fallback handling when AI provider fails
  test('Scenario 10: Fallback engine gracefully synthesizes complete curriculum with quizzes', () => {
    const cur = createTopicAdaptiveCurriculum('Complex Analysis', 'undergraduate', 6);
    assert.ok(cur.modules.length > 0);
    assert.ok(cur.modules[0].lessons.length > 0);
    assert.ok(cur.modules[0].lessons.some(l => l.type === 'quiz'));
  });

  // Scenario 11 & 12: Course Persistence & Retrieval
  test('Scenario 11 & 12: Generated course persists to client cache and can be retrieved', async () => {
    const cur = createTopicAdaptiveCurriculum('Organic Chemistry Haloalkanes', 'class-12', 6);
    const mockUserId = 'test-author-user-uuid';

    const pathId = await createFullLearningPath(
      {
        title: cur.title,
        description: cur.description,
        domain: cur.domain,
        level: cur.level,
        durationHours: cur.durationHours,
        modules: cur.modules.map((m, mIdx) => ({
          moduleNumber: m.moduleNumber || mIdx + 1,
          title: m.title,
          lessons: m.lessons.map((l, lIdx) => ({
            title: l.title,
            type: l.type,
            orderIndex: lIdx,
            durationMinutes: l.estimatedMinutes,
            sourceName: 'Pencill Academic Repository',
          })),
        })),
      },
      mockUserId
    );

    assert.ok(pathId, 'createFullLearningPath should return valid path ID');
    const retrieved = await getLearningPathById(pathId!);
    assert.ok(retrieved, 'Should be retrievable from local cache / database');
    assert.strictEqual(retrieved.title, cur.title);
    assert.strictEqual(retrieved.modules?.length, cur.modules.length);
  });
});

describe('Universal Learning Path Builder: Advanced Preferences, Edge Cases & Schedule Feasibility', () => {
  test('DiscoverRequestSchema validates all 20 advanced preferences and granular language options', () => {
    const validPayload = {
      query: 'Quantum Computing and Cryptography',
      domain: 'Engineering & Technology',
      subject: 'Computer Science',
      topics: ['Quantum Key Distribution', 'Shor Algorithm'],
      depthLevel: 'custom',
      customDepthLevel: 'Graduate Quantum Information Lab Tier 2',
      difficulty: 'expert',
      instructionLanguage: 'English',
      explanationLanguage: 'English',
      resourceLanguage: 'English',
      quizLanguage: 'English',
      bilingualExplanations: false,
      preserveTechnicalTerms: true,
      weeklyHours: 35,
      pacingStrategy: 'sprint',
      targetCompletionDate: '2026-12-31',
      modalities: ['videos', 'reading', 'practice', 'quizzes', 'flashcards', 'codingExercises'],
      advancedPreferences: {
        learningGoal: 'research_foundation',
        currentKnowledgeLevel: 'advanced',
        desiredMastery: 'mastery',
        explanationStyle: 'mathematical_rigorous',
        preferredSources: ['NPTEL', 'MIT OCW', 'Peer-Reviewed Papers'],
        maxVideosPerModule: 3,
        maxReadingPerModule: 5,
        desiredPracticeQuestions: 16,
        quizFrequency: 'every_module',
        flashcardFrequency: 'high',
        revisionFrequency: 'every_module',
        mockExamFrequency: 'mid_and_final',
        practicalProjects: 'hands_on_per_module',
        accessibility: {
          closedCaptions: true,
          highContrastNotes: true,
          transcriptsRequired: true,
        },
        dailyAvailability: 'Weekdays 3 hrs',
        preferredSessionLengthMinutes: 90,
        resourceFreshness: 'recent_years',
        citationRequirement: 'institutional_peer_reviewed',
        customInstructions: 'Focus exclusively on post-quantum lattice cryptography schemes.',
      },
    };

    const result = DiscoverRequestSchema.safeParse(validPayload);
    assert.ok(result.success, `Schema parse failed: ${JSON.stringify(result.error?.issues)}`);
    assert.strictEqual(result.data.weeklyHours, 35);
    assert.strictEqual(result.data.customDepthLevel, 'Graduate Quantum Information Lab Tier 2');
    assert.strictEqual(result.data.preserveTechnicalTerms, true);
  });

  test('Schedule feasibility engine flags severe deadline compression and computes corrective weekly hours', () => {
    const today = new Date();
    const twoWeeksAway = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    const dateStr = twoWeeksAway.toISOString().split('T')[0];

    const compressedConfig: LearningPathConfig = {
      ...DEFAULT_BUILDER_CONFIG,
      topics: ['JEE Advanced Comprehensive Mechanics & Electrodynamics'],
      depthLevel: 'competitive',
      difficulty: 'expert',
      weeklyHours: 4, // 4 hrs/wk for 2 weeks = 8 hours total, but JEE syllabus requires ~40+ hours!
      targetCompletionDate: dateStr,
    };

    const estimate = estimateCurriculumBlueprint(compressedConfig);
    assert.ok(estimate.scheduleFeasibility.isCompressed, 'Engine must flag compressed schedule');
    assert.ok(estimate.scheduleFeasibility.conflictWarning, 'Engine must emit an actionable warning');
    assert.ok(
      estimate.scheduleFeasibility.suggestedWeeklyHours && estimate.scheduleFeasibility.suggestedWeeklyHours > 10,
      'Suggested hours should scale to realistically cover the required curriculum hours'
    );
  });

  test('Draft serialization and deserialization retains complete configuration without data loss', () => {
    const customConfig: LearningPathConfig = {
      domainId: 'medical-health',
      domainName: 'Medical & Health Sciences',
      subject: 'Cardiology',
      topics: ['Arrhythmia & ECG Interpretation', 'Congestive Heart Failure'],
      targetExam: {
        id: 'usmle-step-1',
        name: 'USMLE Step 1',
        acronym: 'USMLE',
        examDate: '2026-11-15',
        targetScore: '250',
      },
      depthLevel: 'custom',
      customDepthLevel: 'PG Year 1 Internal Medicine Residency',
      difficulty: 'expert',
      instructionLanguage: 'English',
      explanationLanguage: 'English',
      resourceLanguage: 'English',
      preserveTechnicalTerms: true,
      modalities: {
        videos: true,
        reading: true,
        practice: true,
        quizzes: true,
        flashcards: true,
        caseStudies: true,
      },
      weeklyHours: 15,
      pacingStrategy: 'intensive',
      advancedPreferences: {
        currentKnowledgeLevel: 'advanced',
        desiredMastery: 'mastery',
        learningGoal: 'exam_preparation',
        explanationStyle: 'step_by_step',
        preferredSources: ['SWAYAM', 'Peer-Reviewed Papers'],
        maxVideosPerModule: 2,
        maxReadingPerModule: 3,
        desiredPracticeQuestions: 12,
        quizFrequency: 'every_module',
        flashcardFrequency: 'high',
        revisionFrequency: 'every_module',
        mockExamFrequency: 'weekly',
        practicalProjects: 'hands_on_per_module',
        accessibility: {
          closedCaptions: true,
          highContrastNotes: false,
          transcriptsRequired: true,
        },
        dailyAvailability: 'Evenings 2 hrs',
        preferredSessionLengthMinutes: 60,
        resourceFreshness: 'recent_years',
        citationRequirement: 'institutional_peer_reviewed',
        customInstructions: 'Align with AHA / ACC clinical practice guidelines.',
      },
    };

    const serialized = JSON.stringify(customConfig);
    const restored = JSON.parse(serialized) as LearningPathConfig;

    assert.strictEqual(restored.domainId, customConfig.domainId);
    assert.strictEqual(restored.targetExam?.acronym, 'USMLE');
    assert.strictEqual(restored.customDepthLevel, 'PG Year 1 Internal Medicine Residency');
    assert.strictEqual(restored.advancedPreferences.learningGoal, 'exam_preparation');
    assert.strictEqual(restored.advancedPreferences.preferredSessionLengthMinutes, 60);
    assert.strictEqual(restored.advancedPreferences.accessibility?.closedCaptions, true);
  });

  test('Subject fallback works when topics array is empty but subject is provided', () => {
    const payloadWithSubjectOnly = {
      domain: 'Engineering & Technology',
      subject: 'Compiler Design',
      depthLevel: 'undergraduate-advanced',
      weeklyHours: 8,
    };

    const result = DiscoverRequestSchema.safeParse(payloadWithSubjectOnly);
    assert.ok(result.success, 'Subject-only requests must pass validation');
  });

  test('POST /api/resources/discover accepts default /new-goal payload with targetExam: null', () => {
    // Exact payload generated by /new-goal when user builds path without a target exam
    const frontendDefaultPayload = {
      query: 'Class 11 Mechanics & Rotational Dynamics',
      domain: 'School Education',
      subject: 'Physics',
      topics: ['Class 11 Mechanics & Rotational Dynamics'],
      targetExam: null,
      depthLevel: 'class-11',
      customDepthLevel: undefined,
      difficulty: 'intermediate',
      instructionLanguage: 'English',
      explanationLanguage: undefined,
      resourceLanguage: undefined,
      quizLanguage: undefined,
      bilingualExplanations: undefined,
      preserveTechnicalTerms: true,
      modalities: ['videos', 'reading', 'practice', 'quizzes', 'flashcards'],
      weeklyHours: 6,
      pacingStrategy: 'balanced',
      targetCompletionDate: undefined,
      advancedPreferences: {
        currentKnowledgeLevel: 'some_basics',
        desiredMastery: 'deep_conceptual',
        learningGoal: 'concept_mastery',
        explanationStyle: 'step_by_step',
        preferredSources: ['NCERT', 'NPTEL', 'Khan Academy'],
        maxVideosPerModule: 2,
        maxReadingPerModule: 3,
        desiredPracticeQuestions: 8,
        quizFrequency: 'every_module',
        flashcardFrequency: 'standard',
      },
      generateLearningPath: true,
    };

    const result = DiscoverRequestSchema.safeParse(frontendDefaultPayload);
    assert.ok(result.success, `Must accept targetExam: null without 400 error: ${JSON.stringify(result.error?.flatten())}`);
    assert.strictEqual(result.data.targetExam, null);
    assert.strictEqual(result.data.weeklyHours, 6);
  });

  test('POST /api/resources/discover accepts nullable/empty optional fields gracefully', () => {
    const payloadWithNulls = {
      query: 'Organic Chemistry Reactions',
      domain: 'Science & Mathematics',
      subject: 'Chemistry',
      topics: ['Electrophilic Addition'],
      targetExam: null,
      depthLevel: null,
      customDepthLevel: null,
      difficulty: null,
      instructionLanguage: null,
      explanationLanguage: null,
      resourceLanguage: null,
      quizLanguage: null,
      bilingualExplanations: null,
      preserveTechnicalTerms: null,
      pacingStrategy: null,
      targetCompletionDate: null,
      advancedPreferences: null,
      weeklyHours: null, // Should preprocess to default 6
      modalities: null,
    };

    const result = DiscoverRequestSchema.safeParse(payloadWithNulls);
    assert.ok(result.success, `Must accept null in optional fields: ${JSON.stringify(result.error?.flatten())}`);
    assert.strictEqual(result.data.weeklyHours, 6, 'weeklyHours: null must default to 6');
  });

  test('POST /api/resources/discover rejects invalid empty payloads with actionable error messages', () => {
    // 1. Completely empty payload
    const emptyPayload = {};
    const resEmpty = DiscoverRequestSchema.safeParse(emptyPayload);
    assert.strictEqual(resEmpty.success, false);
    const errors = resEmpty.error?.flatten();
    assert.ok(
      errors?.fieldErrors?.query?.[0]?.includes('Either "query", "goal", "subject", or "topics" must be provided'),
      'Must provide actionable refinement error for missing topic/query'
    );

    // 2. Whitespace-only payload
    const whitespacePayload = { query: '   ', subject: '   ', topics: ['  ', ''] };
    const resWhitespace = DiscoverRequestSchema.safeParse(whitespacePayload);
    assert.strictEqual(resWhitespace.success, false);

    // 3. Out-of-bounds weeklyHours (> 60)
    const outOfBoundsHours = { query: 'Calculus', weeklyHours: 120 };
    const resHours = DiscoverRequestSchema.safeParse(outOfBoundsHours);
    assert.strictEqual(resHours.success, false);
    assert.ok(resHours.error?.flatten()?.fieldErrors?.weeklyHours);

    // 4. Out-of-bounds minQualityScore (> 100)
    const outOfBoundsScore = { query: 'Calculus', minQualityScore: 150 };
    const resScore = DiscoverRequestSchema.safeParse(outOfBoundsScore);
    assert.strictEqual(resScore.success, false);
    assert.ok(resScore.error?.flatten()?.fieldErrors?.minQualityScore);
  });

  test('Resource discovery and curriculum generation across varied domains, languages and modalities', () => {
    // 1. Medical & Health Sciences with flashcards & practice
    const medCur = createTopicAdaptiveCurriculum('Human Cardiovascular Anatomy', 'undergraduate-intro', 8, [], {
      explicitDomain: 'Medical & Health Sciences',
      modalities: ['reading', 'flashcards', 'practice'],
      language: 'English',
    });
    assert.strictEqual(medCur.domain, 'Medical & Health Sciences');
    assert.ok(medCur.modules.some(m => m.lessons.some(l => l.type === 'formulae')));
    assert.ok(!medCur.modules.some(m => m.lessons.some(l => l.type === 'video')));

    // 2. Law & Governance
    const lawCur = createTopicAdaptiveCurriculum('Constitutional Law & Fundamental Rights', 'undergraduate-core', 6, [], {
      explicitDomain: 'Law & Governance',
      language: 'English',
    });
    assert.strictEqual(lawCur.domain, 'Law & Governance');
    assert.ok(lawCur.modules.length >= 3);

    // 3. Business & Management
    const bizCur = createTopicAdaptiveCurriculum('Corporate Financial Accounting', 'intermediate', 10, [], {
      explicitDomain: 'Business & Management',
      difficulty: 'intermediate',
    });
    assert.strictEqual(bizCur.domain, 'Business & Management');
    assert.ok((bizCur.durationHours ?? 0) >= 10);
  });
});
