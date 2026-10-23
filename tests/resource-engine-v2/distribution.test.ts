import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ResourceModuleDistributor,
  ModuleInputContext,
  determineResourceRole,
} from '../../src/lib/resource-engine-v2/distribution';
import {
  parseTimestampToSeconds,
  formatSecondsToTimestamp,
  generateDeepLinkUrl,
  extractChaptersFromDescription,
} from '../../src/lib/resource-engine-v2/chapters';
import {
  PersistenceMapper,
  PersistenceSafeguardEngine,
} from '../../src/lib/resource-engine-v2/persistence';
import {
  AnalyzedObjective,
  NormalizedResourceCandidate,
  EducationalDomain,
} from '../../src/lib/resource-engine-v2/types';

// Helper to construct realistic AnalyzedObjective fixtures
function makeObjective(partial: Partial<AnalyzedObjective> & { rawTitle: string; domain: EducationalDomain; primaryConcepts: string[] }): AnalyzedObjective {
  return {
    rawTitle: partial.rawTitle,
    rawDescription: partial.rawDescription || '',
    subject: partial.subject,
    learningGoal: partial.learningGoal,
    academicLevel: partial.academicLevel,
    targetExam: partial.targetExam,
    preferredLanguage: partial.preferredLanguage,
    domain: partial.domain,
    domainProvenance: partial.domainProvenance || 'user_provided',
    cognitiveIntent: partial.cognitiveIntent || 'conceptual_foundations',
    intentProvenance: partial.intentProvenance || 'inferred_high',
    primaryConcepts: partial.primaryConcepts,
    supportingConcepts: partial.supportingConcepts || [],
    explicitOutcomes: partial.explicitOutcomes || [],
    expectedSkills: partial.expectedSkills || [],
    prerequisites: partial.prerequisites || [],
    negativeConstraints: partial.negativeConstraints || [],
    domainExclusions: partial.domainExclusions || [],
    evidenceNotes: partial.evidenceNotes || [],
  };
}

// Helper to construct realistic NormalizedResourceCandidate fixtures
function makeCandidate(partial: Partial<NormalizedResourceCandidate> & { id: string; title: string; canonicalUrl: string }): NormalizedResourceCandidate {
  return {
    id: partial.id,
    provider: partial.provider || 'youtube',
    externalId: partial.externalId || partial.id,
    title: partial.title,
    description: partial.description || '',
    canonicalUrl: partial.canonicalUrl,
    sourceUrl: partial.sourceUrl || partial.canonicalUrl,
    modality: partial.modality || 'video',
    durationSeconds: partial.durationSeconds,
    publishedAt: partial.publishedAt || '2025-01-15T00:00:00Z',
    verificationStatus: partial.verificationStatus || 'unverified_candidate',
    creator: partial.creator || { name: 'Educational Creator' },
    retrievalProvenance: partial.retrievalProvenance || {
      queryString: 'test query',
      provider: partial.provider || 'youtube',
      retrievedAt: '2025-01-15T00:00:00Z',
    },
    missingMetadata: partial.missingMetadata || [],
    rawMetadata: partial.rawMetadata,
    playlist: partial.playlist,
  };
}

describe('Resource Engine 2.0 - Phase 5: Resource-to-Module Distribution', () => {
  const distributor = new ResourceModuleDistributor();

  // Scenario A: Mathematics module separation
  it('Scenario A: Mathematics module separation (matrices resource is not assigned to differentiation)', () => {
    const matricesModule: ModuleInputContext = {
      moduleId: 'mod-math-matrices',
      moduleNumber: 1,
      moduleTitle: 'Matrices and Determinants',
      objective: makeObjective({
        rawTitle: 'Matrices and Determinants',
        domain: 'mathematics',
        cognitiveIntent: 'worked_examples',
        primaryConcepts: ['matrix multiplication', 'determinants'],
      }),
    };

    const differentiationModule: ModuleInputContext = {
      moduleId: 'mod-math-diff',
      moduleNumber: 2,
      moduleTitle: 'Differentiation and Derivatives',
      objective: makeObjective({
        rawTitle: 'Differentiation and Derivatives',
        domain: 'mathematics',
        cognitiveIntent: 'worked_examples',
        primaryConcepts: ['derivative', 'chain rule', 'differentiation'],
      }),
    };

    const candidatePool = [
      makeCandidate({
        id: 'matrix-lecture-1',
        title: 'Matrix Multiplication & Determinants Masterclass',
        description: 'Complete worked examples on matrix multiplication and determinants.',
        canonicalUrl: 'https://youtube.com/watch?v=matrix1',
        durationSeconds: 1800,
      }),
      makeCandidate({
        id: 'diff-lecture-1',
        title: 'Differentiation & Chain Rule Step by Step',
        description: 'Calculating derivatives and applying the chain rule with worked solutions.',
        canonicalUrl: 'https://youtube.com/watch?v=diff1',
        durationSeconds: 1500,
      }),
    ];

    const plan = distributor.distribute([matricesModule, differentiationModule], candidatePool);

    assert.equal(plan.modules.length, 2);

    const mod1Resources = plan.modules[0].resources;
    const mod2Resources = plan.modules[1].resources;

    // Module 1 must only receive matrices, never differentiation
    assert.equal(mod1Resources.length, 1);
    assert.equal(mod1Resources[0].candidateId, 'matrix-lecture-1');

    // Module 2 must only receive differentiation, never matrices
    assert.equal(mod2Resources.length, 1);
    assert.equal(mod2Resources[0].candidateId, 'diff-lecture-1');
  });

  // Scenario B: Objective coverage across complementary roles
  it('Scenario B: Objective coverage selects complementary resources (conceptual + worked demonstration)', () => {
    const moduleCtx: ModuleInputContext = {
      moduleId: 'mod-calculus',
      moduleNumber: 1,
      moduleTitle: 'Calculus: Fundamental Concepts and Worked Problems',
      objective: makeObjective({
        rawTitle: 'Calculus Fundamentals and Problem Solving',
        domain: 'mathematics',
        cognitiveIntent: 'worked_examples',
        primaryConcepts: ['integration', 'calculus'],
      }),
    };

    const candidatePool = [
      makeCandidate({
        id: 'calc-theory',
        title: 'Conceptual Foundations of Integral Calculus',
        description: 'Understanding the definite integral, Riemann sums, and area under curves.',
        canonicalUrl: 'https://youtube.com/watch?v=calc-th',
        durationSeconds: 1200,
      }),
      makeCandidate({
        id: 'calc-problems',
        title: 'Integration Worked Examples and Practice Problem Set',
        description: 'Step-by-step problem set solutions for definite and indefinite integrals.',
        canonicalUrl: 'https://youtube.com/watch?v=calc-pr',
        durationSeconds: 1600,
      }),
      makeCandidate({
        id: 'calc-redundant-theory',
        title: 'Integral Calculus Introduction and Concepts',
        description: 'Another high-level overview of calculus concepts.',
        canonicalUrl: 'https://youtube.com/watch?v=calc-th2',
        durationSeconds: 900,
      }),
    ];

    const plan = distributor.distribute([moduleCtx], candidatePool, { maxResourcesPerModule: 2 });
    const assigned = plan.modules[0].resources;

    assert.equal(assigned.length, 2);
    const roles = assigned.map((r) => r.assignedRole);

    // Complementary selection must include both a conceptual and a worked demonstration resource
    assert.ok(roles.includes('primary_conceptual'));
    assert.ok(roles.includes('worked_demonstration'));
  });

  // Scenario C: Beginner programming prioritizes beginner video and docs, not research papers
  it('Scenario C: Beginner Python module prioritizes beginner explanation and code walkthrough, not research papers', () => {
    const beginnerModule: ModuleInputContext = {
      moduleId: 'mod-py-beginner',
      moduleNumber: 1,
      moduleTitle: 'Python Fundamentals: Variables and Loops',
      objective: makeObjective({
        rawTitle: 'Python Variables and Loops',
        academicLevel: 'beginner',
        cognitiveIntent: 'coding_walkthrough',
        domain: 'computer_science',
        primaryConcepts: ['python variables', 'for loops'],
      }),
    };

    const candidatePool = [
      makeCandidate({
        id: 'py-tut-video',
        title: 'Python for Beginners: Variables and For Loops Walkthrough',
        description: 'Hands-on live coding tutorial: understand variables, strings, and loops in Python.',
        canonicalUrl: 'https://youtube.com/watch?v=pybeg1',
        durationSeconds: 1500,
        modality: 'video',
      }),
      makeCandidate({
        id: 'py-doc',
        title: 'Python Documentation: Control Flow and Data Structures',
        description: 'Official Python tutorial covering variables, data types, and loop structures.',
        canonicalUrl: 'https://docs.python.org/3/tutorial/controlflow.html',
        modality: 'documentation',
      }),
      makeCandidate({
        id: 'py-paper',
        title: 'Denotational Semantics and Variable Scoping in Dynamically Typed Bytecode',
        description: 'Scholarly preprint exploring lambda calculus models of Python variable binding.',
        canonicalUrl: 'https://arxiv.org/abs/2301.99999',
        modality: 'paper',
      }),
    ];

    const plan = distributor.distribute([beginnerModule], candidatePool, { maxResourcesPerModule: 2 });
    const assignedIds = plan.modules[0].resources.map((r) => r.candidateId);

    // The beginner video and docs should be chosen; the advanced research paper must NOT be selected
    assert.ok(assignedIds.includes('py-tut-video'));
    assert.ok(!assignedIds.includes('py-paper'), 'Academic paper must not be selected for Beginner Python');
  });

  // Scenario D: Advanced AI research module includes relevant papers alongside practical implementation
  it('Scenario D: Advanced AI research module includes relevant scholarly paper and code walkthrough', () => {
    const aiModule: ModuleInputContext = {
      moduleId: 'mod-ai-lora',
      moduleNumber: 1,
      moduleTitle: 'Parameter-Efficient Fine-Tuning with LoRA',
      objective: makeObjective({
        rawTitle: 'Parameter-Efficient Fine-Tuning with LoRA',
        academicLevel: 'advanced',
        cognitiveIntent: 'in_depth_conceptual',
        domain: 'data_science_ai',
        primaryConcepts: ['lora', 'fine-tuning'],
      }),
    };

    const candidatePool = [
      makeCandidate({
        id: 'lora-lecture',
        title: 'LoRA & QLoRA In-Depth Lecture: Low-Rank Adaptation',
        description: 'Theoretical derivation and matrix factorization mechanics of LoRA.',
        canonicalUrl: 'https://youtube.com/watch?v=loralec',
        durationSeconds: 2400,
        modality: 'video',
      }),
      makeCandidate({
        id: 'lora-code',
        title: 'Hands-on LoRA Implementation in PyTorch and HuggingFace',
        description: 'Code walkthrough: fine-tune Llama with LoRA from scratch.',
        canonicalUrl: 'https://youtube.com/watch?v=loracode',
        durationSeconds: 1800,
        modality: 'video',
      }),
      makeCandidate({
        id: 'lora-original-paper',
        title: 'LoRA: Low-Rank Adaptation of Large Language Models',
        description: 'The seminal research paper introducing low-rank decomposition for parameter-efficient adaptation.',
        canonicalUrl: 'https://arxiv.org/abs/2106.09685',
        modality: 'paper',
      }),
    ];

    const plan = distributor.distribute([aiModule], candidatePool, { maxResourcesPerModule: 3 });
    const assignedModalities = plan.modules[0].resources.map((r) => r.modality);

    // Both video and scholarly paper should be present for advanced AI research
    assert.ok(assignedModalities.includes('video'));
    assert.ok(assignedModalities.includes('paper'));
  });

  // Scenario E: Insufficient resources returns honest empty state
  it('Scenario E: Insufficient resources returns honest empty state without silent lowering of threshold', () => {
    const quantumModule: ModuleInputContext = {
      moduleId: 'mod-quantum',
      moduleNumber: 1,
      moduleTitle: 'Quantum Computing and Shor Algorithm',
      objective: makeObjective({
        rawTitle: 'Quantum Computing and Shor Algorithm',
        domain: 'physics',
        primaryConcepts: ['quantum computing', 'shor algorithm'],
      }),
    };

    // Candidate pool contains only completely unrelated candidates (e.g. baking and gardening)
    const irrelevantPool = [
      makeCandidate({
        id: 'baking-vid',
        title: 'Delicious Chocolate Brownie Recipe',
        description: 'How to bake soft chocolate brownies at home.',
        canonicalUrl: 'https://youtube.com/watch?v=brownie',
        durationSeconds: 600,
      }),
      makeCandidate({
        id: 'gardening-vid',
        title: 'Organic Backyard Vegetable Gardening',
        description: 'How to grow organic tomatoes.',
        canonicalUrl: 'https://youtube.com/watch?v=garden',
        durationSeconds: 900,
      }),
    ];

    const plan = distributor.distribute([quantumModule], irrelevantPool);
    const modOutput = plan.modules[0];

    assert.equal(modOutput.isEmptyState, true);
    assert.equal(modOutput.resources.length, 0);
    assert.ok(modOutput.emptyStateReason?.includes('relevance threshold'));
    assert.deepEqual(modOutput.coverageSummary.uncoveredConcepts, ['quantum computing', 'shor algorithm']);
  });

  // Scenario F: Cross-module duplication prevention & justified sharing
  it('Scenario F: Cross-module duplication is prevented by default, allowed only when justified by coverage', () => {
    const mod1: ModuleInputContext = {
      moduleId: 'mod-python-vars',
      moduleNumber: 1,
      moduleTitle: 'Python Variables',
      objective: makeObjective({
        rawTitle: 'Python Variables and Types',
        domain: 'computer_science',
        primaryConcepts: ['python variables'],
      }),
    };

    const mod2: ModuleInputContext = {
      moduleId: 'mod-python-loops',
      moduleNumber: 2,
      moduleTitle: 'Python Loops',
      objective: makeObjective({
        rawTitle: 'Python Loops and Control Flow',
        domain: 'computer_science',
        primaryConcepts: ['for loops', 'while loops'],
      }),
    };

    const candidatePool = [
      makeCandidate({
        id: 'vars-only',
        title: 'Python Variables Tutorial',
        description: 'Learn variables in Python.',
        canonicalUrl: 'https://youtube.com/watch?v=v1',
        durationSeconds: 900,
      }),
      makeCandidate({
        id: 'loops-only',
        title: 'Python For and While Loops Tutorial',
        description: 'Learn loops in Python.',
        canonicalUrl: 'https://youtube.com/watch?v=l1',
        durationSeconds: 900,
      }),
    ];

    // Default: allowCrossModuleSharing = false
    const planNoShare = distributor.distribute([mod1, mod2], candidatePool, { allowCrossModuleSharing: false });
    const mod1Res = planNoShare.modules[0].resources.map((r) => r.canonicalUrl);
    const mod2Res = planNoShare.modules[1].resources.map((r) => r.canonicalUrl);

    // Each module receives its distinct resource; zero cross-module overlap
    assert.notEqual(mod1Res[0], mod2Res[0]);
    assert.equal(planNoShare.sharedResourcesCount, 0);
  });

  // Scenario G: Resource limits (per-module and global)
  it('Scenario G: Respects configurable maxResourcesPerModule and maxTotalResources limits', () => {
    const mod1: ModuleInputContext = {
      moduleId: 'mod-1',
      moduleNumber: 1,
      moduleTitle: 'Module 1',
      objective: makeObjective({
        rawTitle: 'Linear Algebra Matrices',
        domain: 'mathematics',
        primaryConcepts: ['matrix multiplication'],
      }),
    };

    const mod2: ModuleInputContext = {
      moduleId: 'mod-2',
      moduleNumber: 2,
      moduleTitle: 'Module 2',
      objective: makeObjective({
        rawTitle: 'Linear Algebra Determinants',
        domain: 'mathematics',
        primaryConcepts: ['determinants'],
      }),
    };

    const pool = [
      makeCandidate({ id: 'm1', title: 'Matrix Multiplication 1', canonicalUrl: 'https://youtube.com/watch?v=m1' }),
      makeCandidate({ id: 'm2', title: 'Matrix Multiplication 2', canonicalUrl: 'https://youtube.com/watch?v=m2' }),
      makeCandidate({ id: 'm3', title: 'Matrix Multiplication 3', canonicalUrl: 'https://youtube.com/watch?v=m3' }),
      makeCandidate({ id: 'd1', title: 'Determinants 1', canonicalUrl: 'https://youtube.com/watch?v=d1' }),
      makeCandidate({ id: 'd2', title: 'Determinants 2', canonicalUrl: 'https://youtube.com/watch?v=d2' }),
    ];

    // Limit to max 2 resources per module and max 3 total across course
    const plan = distributor.distribute([mod1, mod2], pool, {
      maxResourcesPerModule: 2,
      maxTotalResources: 3,
    });

    assert.ok(plan.modules[0].resources.length <= 2, 'Module 1 must not exceed 2 resources');
    assert.ok(plan.totalResourcesAssigned <= 3, 'Total distributed resources must not exceed 3');
  });

  // Scenario K: Identity and deduplication
  it('Scenario K: Deduplicates identical provider resources while keeping distinct ones separate', () => {
    const mod: ModuleInputContext = {
      moduleId: 'mod-dedup',
      moduleNumber: 1,
      moduleTitle: 'Deduplication Test',
      objective: makeObjective({
        rawTitle: 'Calculus Derivatives',
        domain: 'mathematics',
        primaryConcepts: ['derivatives'],
      }),
    };

    const pool = [
      makeCandidate({
        id: 'dup-1',
        title: 'Derivatives Lecture',
        canonicalUrl: 'https://youtube.com/watch?v=sameId',
        durationSeconds: 1200,
      }),
      makeCandidate({
        id: 'dup-2',
        title: 'Derivatives Lecture (Duplicate Entry with Same URL)',
        canonicalUrl: 'https://youtube.com/watch?v=sameId', // Duplicate canonicalUrl!
        durationSeconds: 1200,
      }),
      makeCandidate({
        id: 'distinct-1',
        title: 'Derivatives Worked Problems',
        canonicalUrl: 'https://youtube.com/watch?v=differentId',
        durationSeconds: 1500,
      }),
    ];

    const plan = distributor.distribute([mod], pool);
    const assigned = plan.modules[0].resources;

    // Must have deduplicated the identical URL, leaving 2 distinct resources
    assert.equal(assigned.length, 2);
    const urls = new Set(assigned.map((r) => r.canonicalUrl));
    assert.equal(urls.size, 2);
  });

  // Scenario L: Determinism
  it('Scenario L: Produces strictly deterministic distribution results across repeated runs', () => {
    const mod: ModuleInputContext = {
      moduleId: 'mod-det',
      moduleNumber: 1,
      moduleTitle: 'Determinism Test',
      objective: makeObjective({
        rawTitle: 'Binary Search Algorithm',
        domain: 'computer_science',
        primaryConcepts: ['binary search'],
      }),
    };

    const pool = [
      makeCandidate({ id: 'a', title: 'Binary Search Lecture A', canonicalUrl: 'https://youtube.com/watch?v=a' }),
      makeCandidate({ id: 'b', title: 'Binary Search Lecture B', canonicalUrl: 'https://youtube.com/watch?v=b' }),
    ];

    const run1 = distributor.distribute([mod], pool);
    const run2 = distributor.distribute([mod], pool);

    assert.deepEqual(run1.modules[0].resources.map((r) => r.resourceId), run2.modules[0].resources.map((r) => r.resourceId));
    assert.deepEqual(run1.modules[0].resources.map((r) => r.overallScore), run2.modules[0].resources.map((r) => r.overallScore));
    assert.equal(run1.totalResourcesAssigned, run2.totalResourcesAssigned);
  });
});

describe('Resource Engine 2.0 - Phase 5: Chapter and Timestamp References', () => {
  // Scenario H: Chapter timestamps
  it('Scenario H: Parses valid timestamps and rejects negative, malformed, or out-of-range values', () => {
    // Valid standard formats
    assert.equal(parseTimestampToSeconds('08:30'), 510);
    assert.equal(parseTimestampToSeconds('01:15:20'), 4520);
    assert.equal(parseTimestampToSeconds('0:00'), 0);
    assert.equal(parseTimestampToSeconds('754s'), 754);
    assert.equal(parseTimestampToSeconds(120), 120);

    // Negative values -> rejected
    assert.equal(parseTimestampToSeconds('-10'), null);
    assert.equal(parseTimestampToSeconds('-08:30'), null);

    // Malformed and non-numeric -> rejected
    assert.equal(parseTimestampToSeconds('invalid:text'), null);
    assert.equal(parseTimestampToSeconds('12:99'), null); // invalid seconds >= 60
    assert.equal(parseTimestampToSeconds(''), null);
    assert.equal(parseTimestampToSeconds(undefined), null);

    // Formatting seconds back to timestamp
    assert.equal(formatSecondsToTimestamp(510), '08:30');
    assert.equal(formatSecondsToTimestamp(4520), '01:15:20');
    assert.equal(formatSecondsToTimestamp(0), '00:00');
  });

  it('Scenario H: Generates authentic YouTube deep-link URLs preserving existing query params', () => {
    const url1 = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const deepLink1 = generateDeepLinkUrl(url1, 150);
    assert.ok(deepLink1.includes('v=dQw4w9WgXcQ'));
    assert.ok(deepLink1.includes('t=150s'));

    const url2 = 'https://youtu.be/dQw4w9WgXcQ';
    const deepLink2 = generateDeepLinkUrl(url2, 90);
    assert.ok(deepLink2.includes('t=90s'));
  });

  it('Scenario H: Extracts genuine chapters from description and filters timestamps exceeding duration', () => {
    const description = `
      Complete Linear Algebra Course
      00:00 Introduction to Matrices
      05:30 Matrix Multiplication
      15:45 Determinants Calculation
      55:00 Out of Range Chapter Beyond Video Length
    `;

    const videoDuration = 1800; // 30 minutes (1800s)
    const videoUrl = 'https://youtube.com/watch?v=math123';

    const chapters = extractChaptersFromDescription(description, videoDuration, videoUrl);

    // 00:00 (0s), 05:30 (330s), 15:45 (945s) are within 1800s
    // 55:00 (3300s) exceeds 1800s and MUST be excluded
    assert.equal(chapters.length, 3);
    assert.equal(chapters[0].seconds, 0);
    assert.equal(chapters[1].seconds, 330);
    assert.equal(chapters[2].seconds, 945);

    assert.equal(chapters[1].title, 'Matrix Multiplication');
    assert.ok(chapters[1].deepLinkUrl.includes('t=330s'));
    assert.equal(chapters[1].provenance, 'parsed_description_timestamp');
  });

  it('Scenario H: Returns empty array when description contains no chapters (never invents chapters)', () => {
    const emptyDesc = 'A quick video with no timestamps or chapters listed anywhere.';
    const chapters = extractChaptersFromDescription(emptyDesc, 600, 'https://youtube.com/watch?v=test');
    assert.equal(chapters.length, 0);
  });
});

describe('Resource Engine 2.0 - Phase 5: Persistence Safeguards & Mapping Boundary', () => {
  const mapper = new PersistenceMapper();
  const safeguard = new PersistenceSafeguardEngine();

  // Scenario I: Persistence mapping preserves genuine metadata without fabricating missing data
  it('Scenario I: Preserves genuine metadata and keeps absent metadata null/empty without fabrication', () => {
    const sampleDistributedModules = [
      {
        moduleId: 'mod-persist-1',
        moduleNumber: 1,
        moduleTitle: 'Module 1: Matrices',
        resources: [
          {
            resourceId: 'res-mod-persist-1-1',
            candidateId: 'cand-yt-1',
            provider: 'youtube' as const,
            externalId: 'ext-yt-1',
            title: 'Matrix Multiplication Lecture',
            canonicalUrl: 'https://youtube.com/watch?v=ext-yt-1',
            sourceUrl: 'https://youtube.com/watch?v=ext-yt-1',
            modality: 'video' as const,
            durationSeconds: 1500,
            durationMinutes: 25,
            relevanceScore: 88,
            overallScore: 85,
            selectionReason: 'Matches primary concepts of linear algebra.',
            coverageAssessment: 'Covers 100% of matrix multiplication.',
            assignedRole: 'primary_conceptual' as const,
            chapters: [
              {
                timestampFormatted: '05:00',
                seconds: 300,
                title: 'Multiplication Rule',
                deepLinkUrl: 'https://youtube.com/watch?v=ext-yt-1&t=300s',
                provenance: 'parsed_description_timestamp' as const,
                confidence: 0.85,
              },
            ],
            creator: { name: 'Math Professor', channelId: 'channel-math-123' },
            sourceName: 'Math Professor',
            isVerified: true,
            discoverySource: 'verified_channel',
          },
        ],
        coverageSummary: {
          satisfiedRatio: 1.0,
          coveredConcepts: ['matrix multiplication'],
          uncoveredConcepts: [],
        },
        isEmptyState: false,
        totalDurationMinutes: 25,
      },
    ];

    const mapping = mapper.mapDistributionToPersistence(sampleDistributedModules);

    assert.equal(mapping.success, true);
    assert.equal(mapping.databaseResources.length, 1);
    assert.equal(mapping.databaseLessons.length, 1);
    assert.equal(mapping.learningPathModules.length, 1);

    const dbRes = mapping.databaseResources[0];
    assert.equal(dbRes.id, 'res-mod-persist-1-1');
    assert.equal(dbRes.title, 'Matrix Multiplication Lecture');
    assert.equal(dbRes.duration_minutes, 25);
    assert.equal(dbRes.source_url, 'https://youtube.com/watch?v=ext-yt-1');
    assert.equal(dbRes.quality_score, 0.85); // 85 mapped to 0.85 for numeric(3, 2)
    assert.equal(dbRes.educator_id, 'channel-math-123');
    assert.equal(dbRes.is_verified, true);

    const dbLes = mapping.databaseLessons[0];
    assert.equal(dbLes.module_id, 'mod-persist-1');
    assert.equal(dbLes.concept_id, null, 'Must keep unassigned concept_id null, never fabricate');
    assert.equal(dbLes.prerequisites_note, null);
    assert.equal(Array.isArray(dbLes.chapters), true);
    assert.equal((dbLes.chapters as Array<{ seconds: number }>)[0].seconds, 300);

    // Unmapped fields are reported explicitly
    assert.ok(mapping.unmappedFields.length > 0);
  });

  // Scenario J: Persistence failure handling
  it('Scenario J: Simulated persistence failure does not silently strip metadata or corrupt records', async () => {
    const sampleDistributedModules = [
      {
        moduleId: 'mod-fail-1',
        moduleNumber: 1,
        moduleTitle: 'Fail Test Module',
        resources: [
          {
            resourceId: 'res-fail-1',
            candidateId: 'cand-fail-1',
            provider: 'youtube' as const,
            externalId: 'ext-fail-1',
            title: 'Sample Resource',
            canonicalUrl: 'https://youtube.com/watch?v=fail1',
            sourceUrl: 'https://youtube.com/watch?v=fail1',
            modality: 'video' as const,
            durationSeconds: 1200,
            durationMinutes: 20,
            relevanceScore: 75,
            overallScore: 75,
            selectionReason: 'Sample',
            coverageAssessment: 'Sample',
            assignedRole: 'primary_conceptual' as const,
            chapters: [],
            sourceName: 'Sample Source',
            isVerified: false,
            discoverySource: 'open_discovery',
          },
        ],
        coverageSummary: { satisfiedRatio: 1.0, coveredConcepts: [], uncoveredConcepts: [] },
        isEmptyState: false,
        totalDurationMinutes: 20,
      },
    ];

    const mapping = mapper.mapDistributionToPersistence(sampleDistributedModules);

    // Pre-write validation passes
    const validation = safeguard.validatePayload(mapping);
    assert.equal(validation.isValid, true);

    // Simulate database write failure (e.g. Supabase connection timeout or foreign key reject)
    const executionReport = await safeguard.executeSafePersistence(mapping, async () => {
      return { success: false, error: 'Database transaction aborted: 504 Gateway Timeout' };
    });

    assert.equal(executionReport.success, false);
    assert.equal(executionReport.rollbackOccurred, true);
    assert.ok(executionReport.error?.includes('504 Gateway Timeout'));

    // In-memory payload is preserved in full snapshot without silent field deletion
    assert.equal(executionReport.preservedPayloadSnapshot.databaseResources.length, 1);
    assert.equal(executionReport.preservedPayloadSnapshot.databaseResources[0].id, 'res-fail-1');
  });
});
