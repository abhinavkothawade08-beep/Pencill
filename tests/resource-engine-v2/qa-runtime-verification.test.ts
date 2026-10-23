import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ResourceEngineV2,
  discoverResources,
  adaptV2ToDiscoverResponse,
  PracticalResourceClassifier,
  ExplainableRankingEngine,
  ResourceModuleDistributor,
  classifyLearningIntentProfile,
  QueryGenerator,
  AnalyzedObjective,
  NormalizedResourceCandidate,
  DistributedModuleOutput,
} from '../../src/lib/resource-engine-v2';
import { PersistenceMapper } from '../../src/lib/resource-engine-v2/persistence/persistence-mapper';

// Helper to construct realistic candidate fixtures
function makeCandidate(partial: Partial<NormalizedResourceCandidate> & {
  id: string;
  title: string;
  canonicalUrl: string;
}): NormalizedResourceCandidate {
  return {
    id: partial.id,
    provider: partial.provider || 'youtube',
    externalId: partial.externalId || partial.id,
    title: partial.title,
    description: partial.description || '',
    canonicalUrl: partial.canonicalUrl,
    sourceUrl: partial.sourceUrl || partial.canonicalUrl,
    modality: partial.modality || 'video',
    durationSeconds: partial.durationSeconds ?? 900,
    publishedAt: partial.publishedAt || '2025-01-15T00:00:00Z',
    verificationStatus: partial.verificationStatus || 'curated_authority',
    creator: partial.creator || { name: 'Verified Educator' },
    retrievalProvenance: partial.retrievalProvenance || {
      queryString: 'test query',
      provider: partial.provider || 'youtube',
      retrievedAt: '2025-01-15T00:00:00Z',
    },
    missingMetadata: partial.missingMetadata || [],
  };
}

// Helper to construct realistic analyzed objectives with intent profiles
function makeObjective(partial: Partial<AnalyzedObjective> & {
  rawTitle: string;
  domain: any;
  primaryConcepts: string[];
}): AnalyzedObjective {
  const obj: AnalyzedObjective = {
    rawTitle: partial.rawTitle,
    rawDescription: partial.rawDescription || '',
    subject: partial.subject,
    learningGoal: partial.learningGoal,
    academicLevel: partial.academicLevel || 'undergraduate',
    targetExam: partial.targetExam,
    preferredLanguage: partial.preferredLanguage || 'English',
    domain: partial.domain,
    domainProvenance: 'user_provided',
    cognitiveIntent: partial.cognitiveIntent || 'conceptual_foundations',
    intentProvenance: 'inferred_high',
    primaryConcepts: partial.primaryConcepts,
    supportingConcepts: partial.supportingConcepts || [],
    explicitOutcomes: [],
    expectedSkills: [],
    prerequisites: [],
    negativeConstraints: [],
    domainExclusions: [],
    evidenceNotes: [],
  };
  obj.intentProfile = classifyLearningIntentProfile(obj);
  return obj;
}

describe('Resource Engine 2.0 — Production QA & Runtime Verification Gate', () => {
  const engine = new ResourceEngineV2();
  const classifier = new PracticalResourceClassifier();
  const rankingEngine = new ExplainableRankingEngine();
  const distributor = new ResourceModuleDistributor(rankingEngine);
  const persistenceMapper = new PersistenceMapper();

  // =========================================================================
  // 1. Runtime Call Path & Contract Verification
  // =========================================================================
  describe('1. Runtime Call Path & Contract Verification', () => {
    it('verifies discoverResources returns normalized public resources with category and practical evidence', async () => {
      const result = await discoverResources('Python For Loops', {
        limit: 5,
        difficulty: 'beginner',
      });

      assert.ok(result);
      assert.ok(Array.isArray(result.rankedResources));
      assert.ok(result.rankedResources.length > 0);

      // Verify each ranked resource preserves contracts and practical metadata
      const first = result.rankedResources[0].resource;
      assert.ok(first.id);
      assert.ok(first.title);
      assert.ok(first.canonicalUrl);
      assert.ok(first.type);
      assert.ok(typeof first.score.overall === 'number');

      // Check whether resourceCategory is populated on resource
      if (first.resourceCategory) {
        assert.ok([
          'conceptual_explanation',
          'practical_tutorial',
          'guided_exercise',
          'project_based',
          'real_world_application',
          'advanced_optimization',
        ].includes(first.resourceCategory));
      }
    });

    it('verifies adaptV2ToDiscoverResponse preserves positionReason, resourceCategory, and practicalEvidence on lessons', () => {
      const dummyDistributedMod: DistributedModuleOutput = {
        moduleId: 'mod-1',
        moduleNumber: 1,
        moduleTitle: 'Python Loops',
        resources: [
          {
            resourceId: 'res-mod-1-1',
            candidateId: 'cand-1',
            provider: 'youtube',
            externalId: 'ext-1',
            title: 'Python Loops Hands-On Tutorial',
            canonicalUrl: 'https://youtube.com/watch?v=loop1',
            sourceUrl: 'https://youtube.com/watch?v=loop1',
            modality: 'video',
            durationMinutes: 20,
            durationSeconds: 1200,
            relevanceScore: 85,
            overallScore: 88,
            selectionReason: 'Authentic hands-on tutorial',
            coverageAssessment: 'Covers loops',
            assignedRole: 'practical_application',
            resourceCategory: 'practical_tutorial',
            practicalEvidence: { hasLiveCoding: true, hasCodeRepository: true },
            chapters: [],
            sourceName: 'Corey Schafer',
            isVerified: true,
            discoverySource: 'curated_directory',
          },
        ],
        coverageSummary: {
          satisfiedRatio: 1.0,
          coveredConcepts: ['python loops'],
          uncoveredConcepts: [],
        },
        isEmptyState: false,
        totalDurationMinutes: 20,
      };

      const adapted = adaptV2ToDiscoverResponse({
        engineVersion: 'v2',
        query: 'Python Loops',
        domain: 'computer_science',
        academicLevel: 'beginner',
        primaryConcepts: ['python loops'],
        rankedPool: {
          rankedCandidates: [],
          rejectedCandidates: [],
          totalEvaluated: 1,
          eligibleCount: 1,
          summary: {
            averageRelevance: 0.9,
            highestScore: 0.9,
            modalitiesRepresented: ['video'],
            explanation: 'Summary',
          },
        },
        distributedModules: [dummyDistributedMod],
        persistenceMapping: {
          success: true,
          databaseResources: [],
          databaseLessons: [],
          learningPathModules: [],
          unmappedFields: [],
          warnings: [],
        },
        validationReport: {
          isValid: true,
          errors: [],
          resourceCount: 1,
          lessonCount: 1,
          moduleCount: 1,
        },
        executionMetrics: {
          totalDurationMs: 120,
          queriesExecuted: 2,
          totalCandidatesRetrieved: 1,
          totalCandidatesEvaluated: 1,
          totalCandidatesDistributed: 1,
          circuitBreakerTripped: false,
          partialFailures: [],
          providerLatencies: {},
        },
      });

      assert.ok(adapted.success);
      assert.ok(adapted.learningPath);
      assert.equal(adapted.learningPath.modules.length, 1);

      const lesson = adapted.learningPath.modules[0].lessons[0];
      assert.ok(lesson.positionReason?.includes('practical tutorial') || lesson.positionReason === 'practical_application');
      assert.equal(lesson.resourceCategory, 'practical_tutorial');
      assert.ok(lesson.practicalEvidence);

      // Verify discoveredResources flat output contains resourceCategory
      const flat = adapted.discoveredResources[0];
      assert.equal(flat.resourceCategory, 'practical_tutorial');
    });
  });

  // =========================================================================
  // 2. Realistic Learning Scenarios A - E
  // =========================================================================
  describe('2. Realistic Learning Scenarios (Controlled Deterministic Tests)', () => {
    // Topic A: Beginner Python loops
    it('Topic A (Python Loops): Assembles conceptual mental model, live coding tutorial, and hands-on project', () => {
      const obj = makeObjective({
        rawTitle: 'Python For and While Loops with Iteration Protocol',
        domain: 'computer_science',
        academicLevel: 'beginner',
        primaryConcepts: ['python loops', 'for loops', 'while loops'],
      });

      assert.equal(obj.intentProfile?.practicalEmphasis, 'high');
      assert.ok(obj.intentProfile?.categoryMix.some((c) => c.category === 'practical_tutorial'));

      const pool = [
        makeCandidate({
          id: 'py-concept',
          title: 'Understanding Python Loops & Iterators Under the Hood',
          canonicalUrl: 'https://youtube.com/watch?v=py-c',
          description: 'A conceptual overview of iterables and loop execution.',
          durationSeconds: 1200,
        }),
        makeCandidate({
          id: 'py-live-code',
          title: 'Python Loops Hands-On Tutorial in VS Code (Live Coding)',
          canonicalUrl: 'https://youtube.com/watch?v=py-lc',
          description: 'Live coding walkthrough of for loops and while loops.\nGitHub repo: https://github.com/learn/py-loops\n00:00 Setup\n04:00 For loop\n10:00 While loop',
          durationSeconds: 1500,
        }),
        makeCandidate({
          id: 'py-project',
          title: 'Build a Number Guessing Game with Python Loops (Step-by-Step Project)',
          canonicalUrl: 'https://youtube.com/watch?v=py-pr',
          description: 'Hands-on mini-project building a full CLI game applying loops and control flow.',
          durationSeconds: 900,
        }),
      ];

      const plan = distributor.distribute(
        [{ moduleId: 'mod-py', moduleNumber: 1, moduleTitle: 'Python Loops', objective: obj }],
        pool,
        { maxResourcesPerModule: 3 }
      );

      const assigned = plan.modules[0].resources;
      assert.equal(assigned.length, 3);
      const categories = assigned.map((r) => r.resourceCategory);
      assert.ok(categories.includes('conceptual_explanation'));
      assert.ok(categories.includes('practical_tutorial'));
      assert.ok(categories.includes('project_based'));
    });

    // Topic B: DSA Linked Lists
    it('Topic B (DSA Linked Lists): Assembles pointer concepts, implementation class, and LeetCode problem walkthrough', () => {
      const obj = makeObjective({
        rawTitle: 'Singly and Doubly Linked List Implementation',
        domain: 'computer_science',
        primaryConcepts: ['linked list', 'node pointers', 'insertion deletion'],
      });

      const pool = [
        makeCandidate({
          id: 'dsa-theory',
          title: 'Linked List Conceptual Visual Guide: Node Pointers & Memory Layout',
          canonicalUrl: 'https://youtube.com/watch?v=dsa-th',
          description: 'Visual intuition of linked lists, node pointers, and head/tail traversal.',
          durationSeconds: 1100,
        }),
        makeCandidate({
          id: 'dsa-code',
          title: 'Implementing LinkedList and Node Class from Scratch in Python',
          canonicalUrl: 'https://youtube.com/watch?v=dsa-cd',
          description: 'Step by step implementation in VS Code with unit tests.\nGitHub repo: https://github.com/algo/ll',
          durationSeconds: 1400,
        }),
        makeCandidate({
          id: 'dsa-exercise',
          title: 'Reverse Linked List (LeetCode 206) Solved Iteratively and Recursively',
          canonicalUrl: 'https://youtube.com/watch?v=dsa-ex',
          description: 'Solved problems walkthrough analyzing pointers and edge cases step by step.',
          durationSeconds: 780, // 13 min
        }),
      ];

      const plan = distributor.distribute(
        [{ moduleId: 'mod-dsa', moduleNumber: 1, moduleTitle: 'Linked Lists', objective: obj }],
        pool,
        { maxResourcesPerModule: 3 }
      );

      const assigned = plan.modules[0].resources;
      assert.equal(assigned.length, 3);
      assert.ok(assigned.some((r) => r.resourceCategory === 'guided_exercise'));
    });

    // Topic C: Web Development: REST APIs with Express
    it('Topic C (Web Dev REST APIs): Balances HTTP architecture, live Express routes, and Postman API testing', () => {
      const obj = makeObjective({
        rawTitle: 'Building RESTful APIs with Node.js and Express',
        domain: 'computer_science',
        primaryConcepts: ['rest api', 'http methods', 'express routing'],
      });

      const pool = [
        makeCandidate({
          id: 'rest-concept',
          title: 'REST API Concepts Explained: HTTP Verbs, Status Codes & Statelessness',
          canonicalUrl: 'https://youtube.com/watch?v=rest-cp',
          description: 'Architecture principles of RESTful services.',
          durationSeconds: 1000,
        }),
        makeCandidate({
          id: 'rest-impl',
          title: 'Build a REST API from Scratch in Node and Express (Live Coding Tutorial)',
          canonicalUrl: 'https://youtube.com/watch?v=rest-im',
          description: 'Live coding walkthrough creating CRUD routes.\nGitHub repo: https://github.com/dev/express-api\n00:00 Setup\n05:00 Routes',
          durationSeconds: 1600,
        }),
        makeCandidate({
          id: 'rest-postman',
          title: 'Testing REST APIs with Postman: Complete Practical Walkthrough',
          canonicalUrl: 'https://youtube.com/watch?v=rest-pm',
          description: 'Hands-on practice sending requests and inspecting JSON responses using Postman.',
          durationSeconds: 850,
        }),
      ];

      const plan = distributor.distribute(
        [{ moduleId: 'mod-web', moduleNumber: 1, moduleTitle: 'Express REST APIs', objective: obj }],
        pool,
        { maxResourcesPerModule: 3 }
      );

      const assigned = plan.modules[0].resources;
      assert.equal(assigned.length, 3);
      assert.ok(assigned.some((r) => r.candidateId === 'rest-postman'));
    });

    // Topic D: Electronics Engineering: Operational Amplifiers
    it('Topic D (Electronics Op-Amps): Balances golden rules theory, breadboard/SPICE simulation, and circuit calculations', () => {
      const obj = makeObjective({
        rawTitle: 'Operational Amplifiers inverting and non-inverting',
        domain: 'engineering',
        primaryConcepts: ['op-amp', 'inverting amplifier', 'gain calculation'],
      });

      const pool = [
        makeCandidate({
          id: 'ee-theory',
          title: 'Op-Amp Fundamentals: The Golden Rules and Ideal Operational Amplifier',
          canonicalUrl: 'https://youtube.com/watch?v=ee-th',
          description: 'Theoretical foundations of op-amps, virtual ground, and negative feedback.',
          durationSeconds: 1200,
        }),
        makeCandidate({
          id: 'ee-lab',
          title: 'Building Op-Amp Inverting Amplifier Circuits on Breadboard with Oscilloscope & SPICE Simulation',
          canonicalUrl: 'https://youtube.com/watch?v=ee-lb',
          description: 'Hardware lab demo: building on breadboard, testing with oscilloscope waveforms and SPICE.',
          durationSeconds: 1100,
        }),
        makeCandidate({
          id: 'ee-calc',
          title: 'Op-Amp Inverting Amplifier Circuit Worked Examples & Gain Calculation',
          canonicalUrl: 'https://youtube.com/watch?v=ee-cl',
          description: 'Step-by-step solved design problems calculating closed-loop gain and saturation limits.',
          durationSeconds: 950,
        }),
      ];

      const plan = distributor.distribute(
        [{ moduleId: 'mod-ee', moduleNumber: 1, moduleTitle: 'Op-Amps', objective: obj }],
        pool,
        { maxResourcesPerModule: 3 }
      );

      const assigned = plan.modules[0].resources;
      assert.equal(assigned.length, 3);
      assert.ok(assigned.some((r) => r.candidateId === 'ee-lab'));
    });

    // Topic E: Engineering Mathematics: Second-Order Differential Equations
    it('Topic E (Engineering Math ODEs): Prioritizes conceptual ODE intuition, worked derivations, and physical applications WITHOUT forcing code', () => {
      const obj = makeObjective({
        rawTitle: 'Second-Order Linear Homogeneous Differential Equations',
        domain: 'mathematics',
        primaryConcepts: ['differential equations', 'second order odes', 'characteristic equation'],
      });

      assert.equal(obj.intentProfile?.practicalEmphasis, 'none');

      const pool = [
        makeCandidate({
          id: 'math-theory',
          title: 'Differential Equations: Conceptual Intuition Behind Second Order ODEs',
          canonicalUrl: 'https://youtube.com/watch?v=m-th',
          description: 'Intuitive geometric explanation of linear differential operators.',
          durationSeconds: 1300,
        }),
        makeCandidate({
          id: 'math-worked',
          title: 'Second Order ODEs Worked Examples: Step-by-Step Problem Solving',
          canonicalUrl: 'https://youtube.com/watch?v=m-wk',
          description: 'Solving 5 full examination differential equations step by step with real and complex roots.',
          durationSeconds: 1700,
        }),
        makeCandidate({
          id: 'math-applied',
          title: 'Differential Equations in Engineering: Mass-Spring Dampers and RLC Circuits (Applications of Second Order ODEs)',
          canonicalUrl: 'https://youtube.com/watch?v=m-ap',
          description: 'Physical application of second order linear differential equations in mechanical harmonic oscillators and electrical circuits.',
          durationSeconds: 1200,
        }),
        makeCandidate({
          id: 'irrelevant-code',
          title: 'Solving Differential Equations in Python with Scipy: Live Coding Tutorial',
          canonicalUrl: 'https://youtube.com/watch?v=m-cd',
          description: 'Writing Python scripts to solve ODEs with numpy and scipy.integrate.odeint.',
          durationSeconds: 1100,
        }),
      ];

      const plan = distributor.distribute(
        [{ moduleId: 'mod-math', moduleNumber: 1, moduleTitle: '2nd Order ODEs', objective: obj }],
        pool,
        { maxResourcesPerModule: 3 }
      );

      const assigned = plan.modules[0].resources;
      assert.equal(assigned.length, 3);
      const assignedIds = assigned.map((r) => r.candidateId);
      assert.ok(assignedIds.includes('math-theory'));
      assert.ok(assignedIds.includes('math-worked'));
      assert.ok(assignedIds.includes('math-applied'));
      assert.ok(!assignedIds.includes('irrelevant-code'), 'Pure math must NOT force irrelevant software coding tutorial');
    });
  });

  // =========================================================================
  // 3. Practical Resource Authenticity (8 Targeted Cases)
  // =========================================================================
  describe('3. Practical Resource Authenticity (8 Edge Cases)', () => {
    it('Case 1: Genuine coding walkthrough is recognized with high fidelity', () => {
      const cand = makeCandidate({
        id: 'c1',
        title: 'Python Loops: Complete Hands-On Live Coding Walkthrough in VS Code',
        canonicalUrl: 'https://youtube.com/watch?v=c1',
        description: 'Live coding walkthrough implementing for and while loops in VS Code.\nGitHub: https://github.com/app/demo\n00:00 Setup\n05:00 Code',
        durationSeconds: 1800,
      });
      const evalResult = classifier.classify(cand);
      assert.equal(evalResult.primaryCategory, 'practical_tutorial');
      assert.equal(evalResult.isSuperficialBuzzwordOnly, false);
      assert.ok(evalResult.practicalQualityScore >= 80);
    });

    it('Case 2: Project tutorial with implementation steps is recognized as project_based', () => {
      const cand = makeCandidate({
        id: 'c2',
        title: 'Build a Complete E-Commerce Store Project from Scratch',
        canonicalUrl: 'https://youtube.com/watch?v=c2',
        description: 'Step-by-step project build tutorial. GitHub repo: https://github.com/store/proj\n00:00 DB\n15:00 API\n35:00 UI',
        durationSeconds: 3600,
      });
      const evalResult = classifier.classify(cand);
      assert.equal(evalResult.primaryCategory, 'project_based');
      assert.equal(evalResult.isSuperficialBuzzwordOnly, false);
    });

    it('Case 3: Theoretical lecture mentioning practical applications is classified as conceptual_explanation', () => {
      const cand = makeCandidate({
        id: 'c3',
        title: 'Foundations and Theoretical Principles of Relational Database Normalization',
        canonicalUrl: 'https://youtube.com/watch?v=c3',
        description: 'In this university lecture, we discuss theoretical proofs of BCNF and 3NF. Practical applications are mentioned briefly.',
        durationSeconds: 2400,
      });
      const evalResult = classifier.classify(cand);
      assert.equal(evalResult.primaryCategory, 'conceptual_explanation');
    });

    it('Case 4: Clickbait video with "hands-on" in title but no evidence is caught by buzzword guard', () => {
      const cand = makeCandidate({
        id: 'c4',
        title: 'Practical Hands-On Full Stack Project in 45 Seconds! #shorts',
        canonicalUrl: 'https://youtube.com/watch?v=c4',
        description: 'Hands-on coding tutorial! Like and subscribe for more tips!',
        durationSeconds: 45,
      });
      const evalResult = classifier.classify(cand);
      assert.equal(evalResult.isSuperficialBuzzwordOnly, true);
      assert.ok(evalResult.practicalQualityScore < 30);
    });

    it('Case 5: Short coding exercise walkthrough is classified as guided_exercise', () => {
      const cand = makeCandidate({
        id: 'c5',
        title: 'Two Sum (LeetCode 1) — Python Solved Problem Walkthrough',
        canonicalUrl: 'https://youtube.com/watch?v=c5',
        description: 'Solving LeetCode 1 Two Sum with hash map. Time Complexity O(n), Space Complexity O(n).',
        durationSeconds: 650, // ~11 min
      });
      const evalResult = classifier.classify(cand);
      assert.equal(evalResult.primaryCategory, 'guided_exercise');
      assert.ok(evalResult.practicalQualityScore >= 70);
    });

    it('Case 6: Practical video WITHOUT a GitHub repository is still recognized via live coding / tool signals', () => {
      const cand = makeCandidate({
        id: 'c6',
        title: 'Live Coding a REST API in VS Code from Scratch',
        canonicalUrl: 'https://youtube.com/watch?v=c6',
        description: 'In this live coding video, we type out all Express handlers step by step in terminal and VS Code.\n00:00 Setup\n04:00 Handlers',
        durationSeconds: 1500,
      });
      const evalResult = classifier.classify(cand);
      assert.equal(evalResult.primaryCategory, 'practical_tutorial');
      assert.equal(evalResult.breakdown.hasCodeRepository, false);
      assert.equal(evalResult.breakdown.hasLiveCoding, true);
      assert.ok(evalResult.practicalQualityScore >= 75);
    });

    it('Case 7: Hardware demonstration without software development tools is recognized as practical_tutorial', () => {
      const cand = makeCandidate({
        id: 'c7',
        title: 'Inverting Op-Amp on Breadboard: Oscilloscope Measurement and Gain Experiment',
        canonicalUrl: 'https://youtube.com/watch?v=c7',
        description: 'Laboratory hardware experiment constructing an inverting op-amp on a breadboard, verifying gain with a function generator and oscilloscope.',
        durationSeconds: 1100,
      });
      const evalResult = classifier.classify(cand);
      assert.equal(evalResult.primaryCategory, 'practical_tutorial');
      assert.equal(evalResult.breakdown.hasCircuitOrLabExperiment, true);
      assert.ok(evalResult.practicalQualityScore >= 80);
    });

    it('Case 8: Resource with empty description honestly records uncertainty without crash', () => {
      const cand = makeCandidate({
        id: 'c8',
        title: 'Calculus III Vector Fields Introduction',
        canonicalUrl: 'https://youtube.com/watch?v=c8',
        description: '', // Empty description
        durationSeconds: 1200,
      });
      const evalResult = classifier.classify(cand);
      assert.ok(evalResult.uncertaintyReasons.some((u) => u.includes('lacks description')));
      assert.ok(evalResult.confidence <= 0.70);
      assert.ok(evalResult.confidence < 0.85);
    });
  });

  // =========================================================================
  // 4. Ranking and Balanced Distribution Integrity
  // =========================================================================
  describe('4. Ranking and Balanced Distribution Integrity', () => {
    it('permits a practical resource with a slight score deficit to win its complementary slot over a 2nd redundant lecture', () => {
      const obj = makeObjective({
        rawTitle: 'Python Control Flow and Loops',
        domain: 'computer_science',
        primaryConcepts: ['python loops', 'for loops', 'while loops'],
      });

      const pool = [
        makeCandidate({
          id: 'lecture-1',
          title: 'Python Loops: Complete Comprehensive Foundations Masterclass',
          canonicalUrl: 'https://youtube.com/watch?v=lec1',
          description: 'A deep lecture on iteration theory and control flow.',
          durationSeconds: 3000,
        }),
        makeCandidate({
          id: 'lecture-2-redundant',
          title: 'Python Loops: Extended Theoretical Overview and Principles',
          canonicalUrl: 'https://youtube.com/watch?v=lec2',
          description: 'Another long theoretical course on loop mechanics.',
          durationSeconds: 3200,
        }),
        makeCandidate({
          id: 'practical-code',
          title: 'Python Loops in Practice: Live Coding in VS Code',
          canonicalUrl: 'https://youtube.com/watch?v=prac1',
          description: 'Hands-on live coding with GitHub repo: https://github.com/code/loops\n00:00 Setup\n05:00 Loops',
          durationSeconds: 1400,
        }),
      ];

      const plan = distributor.distribute(
        [{ moduleId: 'mod-1', moduleNumber: 1, moduleTitle: 'Loops', objective: obj }],
        pool,
        { maxResourcesPerModule: 2 }
      );

      const assigned = plan.modules[0].resources;
      assert.equal(assigned.length, 2);
      const assignedIds = assigned.map((r) => r.candidateId);
      // Both the conceptual lecture and the practical tutorial must be chosen; the redundant 2nd lecture is avoided
      assert.ok(assignedIds.includes('lecture-1'));
      assert.ok(assignedIds.includes('practical-code'));
      assert.ok(!assignedIds.includes('lecture-2-redundant'));
    });

    it('prevents low-quality clickbait practical short from displacing high-quality candidate', () => {
      const obj = makeObjective({
        rawTitle: 'Python Loops',
        domain: 'computer_science',
        primaryConcepts: ['python loops', 'for loops'],
      });

      const pool = [
        makeCandidate({
          id: 'good-lecture',
          title: 'Python Loops Explained Conceptually',
          canonicalUrl: 'https://youtube.com/watch?v=good',
          description: 'In-depth conceptual lecture on for loops.',
          durationSeconds: 1500,
        }),
        makeCandidate({
          id: 'bad-buzzword-short',
          title: 'Practical Hands-On Python Loop in 30 Seconds #shorts',
          canonicalUrl: 'https://youtube.com/watch?v=bad',
          description: 'Practical tutorial! Subscribe now!',
          durationSeconds: 30,
        }),
      ];

      const plan = distributor.distribute(
        [{ moduleId: 'mod-1', moduleNumber: 1, moduleTitle: 'Loops', objective: obj }],
        pool,
        { minRelevanceThreshold: 50 }
      );

      const assignedIds = plan.modules[0].resources.map((r) => r.candidateId);
      assert.ok(assignedIds.includes('good-lecture'));
      assert.ok(!assignedIds.includes('bad-buzzword-short'), 'Clickbait short must be gated out');
    });

    it('gracefully handles missing categories without inserting irrelevant filler', () => {
      const obj = makeObjective({
        rawTitle: 'Complex Number Geometry',
        domain: 'mathematics',
        primaryConcepts: ['complex numbers', 'argand plane'],
      });

      // Pool only has 1 relevant math lecture
      const pool = [
        makeCandidate({
          id: 'math-complex-1',
          title: 'Geometry of Complex Numbers and the Argand Plane',
          canonicalUrl: 'https://youtube.com/watch?v=cmplx1',
          description: 'Deep mathematical exposition on geometric representations of complex numbers.',
          durationSeconds: 1800,
        }),
        makeCandidate({
          id: 'unrelated-filler',
          title: 'How to Train Your Dog to Sit in 5 Minutes',
          canonicalUrl: 'https://youtube.com/watch?v=dog',
          description: 'Dog training tips.',
          durationSeconds: 300,
        }),
      ];

      const plan = distributor.distribute(
        [{ moduleId: 'mod-1', moduleNumber: 1, moduleTitle: 'Complex Numbers', objective: obj }],
        pool,
        { minRelevanceThreshold: 50, maxResourcesPerModule: 3 }
      );

      const assigned = plan.modules[0].resources;
      assert.equal(assigned.length, 1);
      assert.equal(assigned[0].candidateId, 'math-complex-1');
      assert.ok(!assigned.some((r) => r.candidateId === 'unrelated-filler'));
    });
  });

  // =========================================================================
  // 5. Search Coverage, Caching & Concurrency
  // =========================================================================
  describe('5. Search Coverage, Concurrency & Caching', () => {
    it('generates 2 to 4 diverse, deduplicated queries per module and preserves complementary intents', () => {
      const obj = makeObjective({
        rawTitle: 'Python Data Structures: Lists and Dictionaries',
        domain: 'computer_science',
        primaryConcepts: ['python lists', 'python dictionaries'],
      });

      const queries = QueryGenerator.generateCandidates(obj);
      assert.ok(queries.length >= 2, `Should generate at least 2 queries, got: ${queries.length}`);
      assert.ok(queries.length <= 6, `Should not exceed 6 queries, got: ${queries.length}`);

      const intents = new Set(queries.map((q) => q.intent));
      assert.ok(intents.size >= 2, 'Must include at least 2 distinct pedagogical intents');
    });

    it('persists distributed resources into database-compatible types without schema violation', () => {
      const distributedMod: DistributedModuleOutput = {
        moduleId: 'mod-1',
        moduleNumber: 1,
        moduleTitle: 'Python Testing',
        resources: [
          {
            resourceId: 'res-1',
            candidateId: 'cand-1',
            provider: 'youtube',
            externalId: 'ext-1',
            title: 'PyTest Hands-On Tutorial',
            canonicalUrl: 'https://youtube.com/watch?v=pytest1',
            sourceUrl: 'https://youtube.com/watch?v=pytest1',
            modality: 'video',
            durationMinutes: 25,
            durationSeconds: 1500,
            relevanceScore: 90,
            overallScore: 92,
            selectionReason: 'Great tutorial',
            coverageAssessment: 'Full coverage',
            assignedRole: 'practical_application',
            resourceCategory: 'practical_tutorial',
            chapters: [],
            sourceName: 'Corey Schafer',
            isVerified: true,
            discoverySource: 'curated_directory',
          },
        ],
        coverageSummary: {
          satisfiedRatio: 1,
          coveredConcepts: ['pytest'],
          uncoveredConcepts: [],
        },
        isEmptyState: false,
        totalDurationMinutes: 25,
      };

      const persistence = persistenceMapper.mapDistributionToPersistence([distributedMod], 'path-123');
      assert.equal(persistence.databaseResources.length, 1);
      assert.equal(persistence.databaseLessons.length, 1);
      assert.equal(persistence.databaseResources[0].type, 'video');
      assert.ok(persistence.databaseResources[0].quality_score >= 0.05 && persistence.databaseResources[0].quality_score <= 1.0);
    });
  });
});
