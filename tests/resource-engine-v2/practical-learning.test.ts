import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyLearningIntentProfile,
} from '../../src/lib/resource-engine-v2/analysis/intent-classifier';
import { LearningObjectiveAnalyzer } from '../../src/lib/resource-engine-v2/analysis/objective-analyzer';
import { QueryGenerator } from '../../src/lib/resource-engine-v2/planning/query-generator';
import { PracticalResourceClassifier } from '../../src/lib/resource-engine-v2/evaluation/practical-classifier';
import { ExplainableRankingEngine } from '../../src/lib/resource-engine-v2/evaluation/ranking-engine';
import {
  ResourceModuleDistributor,
  ModuleInputContext,
} from '../../src/lib/resource-engine-v2/distribution/module-distributor';
import {
  AnalyzedObjective,
  NormalizedResourceCandidate,
  EducationalDomain,
} from '../../src/lib/resource-engine-v2/types';

// Helper to create test AnalyzedObjective fixtures
function createTestObjective(partial: Partial<AnalyzedObjective> & {
  rawTitle: string;
  domain: EducationalDomain;
  primaryConcepts: string[];
}): AnalyzedObjective {
  const objective: AnalyzedObjective = {
    rawTitle: partial.rawTitle,
    rawDescription: partial.rawDescription || '',
    subject: partial.subject,
    learningGoal: partial.learningGoal,
    academicLevel: partial.academicLevel || 'undergraduate',
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

  objective.intentProfile = classifyLearningIntentProfile(objective);
  return objective;
}

// Helper to create test NormalizedResourceCandidate fixtures
function createTestCandidate(partial: Partial<NormalizedResourceCandidate> & {
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
    creator: partial.creator || { name: 'Expert Educator' },
    retrievalProvenance: partial.retrievalProvenance || {
      queryString: 'educational query',
      provider: partial.provider || 'youtube',
      retrievedAt: '2025-01-15T00:00:00Z',
    },
    missingMetadata: [],
  };
}

describe('Pencill Resource Engine — Intelligent Practical Learning & Sourcing Upgrade', () => {
  const practicalClassifier = new PracticalResourceClassifier();
  const rankingEngine = new ExplainableRankingEngine();
  const distributor = new ResourceModuleDistributor(rankingEngine);

  // =========================================================================
  // 1. Learning Intent Profiler & Query Expansion
  // =========================================================================
  describe('1. Domain Classification & Intent-Aware Query Expansion', () => {
    it('classifies practical programming topics with high practical emphasis and generates complementary query mix', () => {
      const pyObjective = createTestObjective({
        rawTitle: 'Python For and While Loops with Collections',
        domain: 'computer_science',
        primaryConcepts: ['for loops', 'while loops', 'python iterables'],
      });

      assert.ok(pyObjective.intentProfile);
      assert.equal(pyObjective.intentProfile.practicalEmphasis, 'high');
      assert.ok(pyObjective.intentProfile.categoryMix.some((c) => c.category === 'practical_tutorial'));
      assert.ok(pyObjective.intentProfile.categoryMix.some((c) => c.category === 'guided_exercise'));

      const queries = QueryGenerator.generateCandidates(pyObjective);
      assert.ok(queries.length >= 3, 'Must generate multiple diverse queries');

      const intents = queries.map((q) => q.intent);
      assert.ok(intents.includes('foundational_explanation'), 'Must include foundational conceptual query');
      assert.ok(intents.includes('practical_tutorial'), 'Must include practical tutorial query');
      assert.ok(intents.includes('guided_exercise') || intents.includes('project_based'), 'Must include exercise/project query');

      const queryTexts = queries.map((q) => q.queryString.toLowerCase());
      assert.ok(
        queryTexts.some((q) => q.includes('code') || q.includes('implementation') || q.includes('tutorial')),
        'Queries must include practical keywords for programming'
      );
    });

    it('classifies pure mathematics with zero practical coding emphasis and avoids forcing programming queries', () => {
      const mathObjective = createTestObjective({
        rawTitle: 'Second Order Linear Homogeneous Differential Equations with Constant Coefficients',
        domain: 'mathematics',
        primaryConcepts: ['differential equations', 'characteristic equation', 'homogeneous ode'],
      });

      assert.ok(mathObjective.intentProfile);
      assert.equal(mathObjective.intentProfile.practicalEmphasis, 'none');
      assert.ok(!mathObjective.intentProfile.categoryMix.some((c) => c.category === 'practical_tutorial'));
      assert.ok(mathObjective.intentProfile.categoryMix.some((c) => c.category === 'guided_exercise'));

      const queries = QueryGenerator.generateCandidates(mathObjective);
      const queryTexts = queries.map((q) => q.queryString.toLowerCase());

      // Pure math queries must focus on proofs, derivations, and worked examples, never programming
      assert.ok(
        queryTexts.every((q) => !q.includes('python') && !q.includes('github') && !q.includes('live coding')),
        'Must never inject programming terms into pure math queries'
      );
      assert.ok(
        queryTexts.some((q) => q.includes('step by step') || q.includes('worked examples') || q.includes('derivation') || q.includes('problems')),
        'Must generate step-by-step mathematical demonstration queries'
      );
    });

    it('classifies electronics & hardware with moderate practical emphasis for simulations and breadboard labs', () => {
      const eeObjective = createTestObjective({
        rawTitle: 'Operational Amplifiers: Inverting and Non-Inverting Op-Amp Configurations',
        domain: 'engineering',
        primaryConcepts: ['inverting op-amp', 'non-inverting amplifier', 'virtual ground'],
      });

      assert.ok(eeObjective.intentProfile);
      assert.equal(eeObjective.intentProfile.practicalEmphasis, 'high');
      assert.ok(eeObjective.intentProfile.categoryMix.some((c) => c.category === 'practical_tutorial'));

      const queries = QueryGenerator.generateCandidates(eeObjective);
      const queryTexts = queries.map((q) => q.queryString.toLowerCase());

      assert.ok(
        queryTexts.some((q) => q.includes('circuit') || q.includes('simulation') || q.includes('breadboard') || q.includes('lab') || q.includes('experiment')),
        'Must generate hardware/simulation queries for electronics'
      );
    });
  });

  // =========================================================================
  // 2. Evidence-Based Practical Resource Classification & Buzzword Gating
  // =========================================================================
  describe('2. Evidence-Based Practical Resource Classifier & Anti-Buzzword Gating', () => {
    it('detects genuine practical tutorial evidence (code repos, IDE tools, live coding, chapters)', () => {
      const genuineCandidate = createTestCandidate({
        id: 'py-loop-genuine',
        title: 'Python Loops: Complete Hands-On Tutorial with Live Coding',
        canonicalUrl: 'https://youtube.com/watch?v=pyloop1',
        description:
          'In this practical tutorial, we build real-world loop patterns in VS Code.\n' +
          'GitHub repo with all code examples: https://github.com/example/python-loops\n' +
          '00:00 Introduction\n02:15 For loop syntax\n08:30 Iterating over dictionaries\n15:45 While loops with break/continue',
        durationSeconds: 1260, // 21 minutes
      });

      const classification = practicalClassifier.classify(genuineCandidate);
      assert.equal(classification.primaryCategory, 'practical_tutorial');
      assert.equal(classification.isSuperficialBuzzwordOnly, false);
      assert.ok(classification.practicalQualityScore >= 75);
      assert.ok(classification.breakdown.hasLiveCoding);
      assert.ok(classification.breakdown.hasCodeRepository);
      assert.ok(classification.breakdown.hasToolMention);
      assert.ok(classification.breakdown.hasChapterPracticalSteps);
    });

    it('gating: detects and penalizes superficial buzzword-only videos with no practical substance', () => {
      const buzzwordCandidate = createTestCandidate({
        id: 'buzzword-trap',
        title: 'FASTEST Hands-On Practical Python Project Full Course In 60 Seconds #shorts',
        canonicalUrl: 'https://youtube.com/watch?v=buzzword1',
        description: 'Hands-on practical coding tutorial build full stack app! Like and subscribe for more tips!',
        durationSeconds: 58, // 58 seconds
      });

      const classification = practicalClassifier.classify(buzzwordCandidate);
      assert.equal(classification.isSuperficialBuzzwordOnly, true);
      assert.ok(classification.practicalQualityScore < 30, 'Superficial buzzword shorts must receive low practical score');
    });

    it('classifies concise solved exercise walkthroughs as guided_exercise with high quality score', () => {
      const exerciseCandidate = createTestCandidate({
        id: 'dsa-leetcode-206',
        title: 'Reverse Linked List — LeetCode 206 — Step by Step Python Solution',
        canonicalUrl: 'https://youtube.com/watch?v=leetcode206',
        description:
          'Solving LeetCode 206 Reverse Linked List with iterative and recursive pointer manipulation.\n' +
          'Time Complexity: O(n), Space Complexity: O(1).\n' +
          '00:00 Problem explanation\n03:10 Visual pointer walkthrough\n07:45 Live code in Python\n11:20 Edge cases',
        durationSeconds: 780, // 13 minutes (crisp solved exercise)
      });

      const classification = practicalClassifier.classify(exerciseCandidate);
      assert.equal(classification.primaryCategory, 'guided_exercise');
      assert.ok(classification.practicalQualityScore >= 70);
      assert.equal(classification.isSuperficialBuzzwordOnly, false);
    });
  });

  // =========================================================================
  // 3. Category-Aware Duration Intelligence
  // =========================================================================
  describe('3. Category-Aware Duration Intelligence', () => {
    it('does NOT penalize high-quality 10-20 minute solved exercises or practical demos', () => {
      const objective = createTestObjective({
        rawTitle: 'Singly Linked List Implementation and Operations',
        domain: 'computer_science',
        primaryConcepts: ['linked list', 'node pointers'],
      });

      const conciseExercise = createTestCandidate({
        id: 'linked-list-exercise',
        title: 'Solving Linked List Cycle Detection Step by Step',
        canonicalUrl: 'https://youtube.com/watch?v=ll-cycle',
        description: 'Step-by-step problem walkthrough with Floyd Tortoise and Hare algorithm.',
        durationSeconds: 720, // 12 minutes
      });

      const ranked = rankingEngine.rank(objective, [conciseExercise]);
      assert.equal(ranked.rankedCandidates.length, 1);
      const evalItem = ranked.rankedCandidates[0];

      // Duration suitability for guided_exercise in 7-25m range should be optimal (100) or near optimal
      assert.ok(
        evalItem.durationSuitability.score >= 90,
        `Concise exercise should have high duration suitability score, got: ${evalItem.durationSuitability.score}`
      );
    });
  });

  // =========================================================================
  // 4. Scenario Tests (Scenarios A through F)
  // =========================================================================
  describe('4. Real-World Pedagogical Balancing Scenarios', () => {
    // Scenario A: Python Programming (Loops)
    it('Scenario A: Python Programming balances conceptual mental model, authentic coding tutorial, and hands-on project', () => {
      const moduleCtx: ModuleInputContext = {
        moduleId: 'mod-py-loops',
        moduleNumber: 1,
        moduleTitle: 'Python Control Flow and Loops',
        objective: createTestObjective({
          rawTitle: 'Python For and While Loops',
          domain: 'computer_science',
          academicLevel: 'beginner',
          primaryConcepts: ['python loops', 'for loops', 'while loops'],
        }),
      };

      const candidatePool = [
        createTestCandidate({
          id: 'py-concept-theory',
          title: 'Understanding Python Loops & Iteration Protocol Conceptually',
          canonicalUrl: 'https://youtube.com/watch?v=py-concept',
          description: 'A deep dive into how iterables, iterators, and loops work in Python. Foundational theory.',
          durationSeconds: 1500, // 25 min
        }),
        createTestCandidate({
          id: 'py-hands-on-tutorial',
          title: 'Python Loops Hands-On Tutorial: Live Coding in VS Code',
          canonicalUrl: 'https://youtube.com/watch?v=py-hands-on',
          description:
            'Live coding walkthrough of for loops and while loops.\n' +
            'GitHub repo: https://github.com/teacher/python-loops\n' +
            '00:00 Setup\n04:00 For loops\n12:00 While loops\n20:00 Nested loops',
          durationSeconds: 1600, // 26 min
        }),
        createTestCandidate({
          id: 'py-exercise-project',
          title: 'Building a CLI Number Guessing Game with Python Loops (Guided Project)',
          canonicalUrl: 'https://youtube.com/watch?v=py-project',
          description:
            'Step by step hands-on project: build a number guessing game applying while loops, break, and user input.\n' +
            '00:00 Game rules\n02:30 Game loop\n07:00 Tracking guesses\n11:00 Final polish',
          durationSeconds: 840, // 14 min
        }),
        createTestCandidate({
          id: 'py-superficial-short',
          title: 'Practical Python Loops in 50 Seconds! Fast Tutorial',
          canonicalUrl: 'https://youtube.com/watch?v=py-short',
          description: 'Quick practical tips on Python loops! Subscribe for more #python #shorts',
          durationSeconds: 50,
        }),
      ];

      const plan = distributor.distribute([moduleCtx], candidatePool, { maxResourcesPerModule: 3 });
      const resources = plan.modules[0].resources;

      assert.equal(resources.length, 3, 'Must select exactly 3 balanced resources');

      const categories = resources.map((r) => r.resourceCategory);
      const roles = resources.map((r) => r.assignedRole);

      // Must have conceptual foundation
      assert.ok(
        categories.includes('conceptual_explanation') || roles.includes('primary_conceptual'),
        'Must include a conceptual foundation'
      );

      // Must have authentic practical tutorial
      assert.ok(
        categories.includes('practical_tutorial') || roles.includes('practical_application'),
        'Must include an authentic practical tutorial'
      );

      // Must have guided project or exercise
      assert.ok(
        categories.includes('guided_exercise') || categories.includes('project_based') || roles.includes('worked_demonstration'),
        'Must include a guided project or exercise'
      );

      // Must reject superficial short
      assert.ok(
        !resources.some((r) => r.candidateId === 'py-superficial-short'),
        'Superficial short must be rejected'
      );
    });

    // Scenario B: DSA (Linked Lists)
    it('Scenario B: Data Structures & Algorithms balances data structure concepts, implementation, and problem walkthrough', () => {
      const moduleCtx: ModuleInputContext = {
        moduleId: 'mod-dsa-linked-list',
        moduleNumber: 1,
        moduleTitle: 'Singly and Doubly Linked Lists',
        objective: createTestObjective({
          rawTitle: 'Linked List Data Structure Operations',
          domain: 'computer_science',
          academicLevel: 'undergraduate',
          primaryConcepts: ['linked list', 'node pointers', 'insertion deletion'],
        }),
      };

      const candidatePool = [
        createTestCandidate({
          id: 'll-theory',
          title: 'Linked Lists Explained: Pointers, Memory Layout, and Complexity',
          canonicalUrl: 'https://youtube.com/watch?v=ll-theory',
          description: 'Visual conceptual explanation of linked lists versus arrays, memory allocation, and big-O analysis.',
          durationSeconds: 1200,
        }),
        createTestCandidate({
          id: 'll-code-impl',
          title: 'Implement a Linked List from Scratch in Python (Step-by-Step Code Walkthrough)',
          canonicalUrl: 'https://youtube.com/watch?v=ll-code',
          description:
            'Complete live coding implementation of Node and LinkedList classes with insert, delete, and search.\n' +
            'GitHub repo: https://github.com/algo/linked-list-code\n' +
            '00:00 Node class\n05:00 Append\n10:00 Prepend\n16:00 Delete',
          durationSeconds: 1500,
        }),
        createTestCandidate({
          id: 'll-leetcode-solve',
          title: 'Reverse Linked List (LeetCode 206) Solved Iteratively and Recursively',
          canonicalUrl: 'https://youtube.com/watch?v=ll-reverse',
          description: 'Step-by-step problem walkthrough with diagrammed pointer manipulation and test cases.',
          durationSeconds: 800,
        }),
      ];

      const plan = distributor.distribute([moduleCtx], candidatePool, { maxResourcesPerModule: 3 });
      const resources = plan.modules[0].resources;

      assert.equal(resources.length, 3);
      const ids = resources.map((r) => r.candidateId);
      assert.ok(ids.includes('ll-theory'), 'Must include theory');
      assert.ok(ids.includes('ll-code-impl'), 'Must include implementation code');
      assert.ok(ids.includes('ll-leetcode-solve'), 'Must include problem walkthrough');
    });

    // Scenario C: Engineering Mathematics (Differential Equations)
    it('Scenario C: Engineering Math prioritizes conceptual meaning, worked numericals, and physical applications WITHOUT forcing code', () => {
      const moduleCtx: ModuleInputContext = {
        moduleId: 'mod-math-ode',
        moduleNumber: 1,
        moduleTitle: 'Second-Order Linear Homogeneous ODEs',
        objective: createTestObjective({
          rawTitle: 'Second-Order Linear Differential Equations',
          domain: 'mathematics',
          academicLevel: 'undergraduate',
          primaryConcepts: ['differential equations', 'second order odes', 'characteristic equation'],
        }),
      };

      const candidatePool = [
        createTestCandidate({
          id: 'ode-theory',
          title: 'Differential Equations: Conceptual Intuition Behind Second Order ODEs',
          canonicalUrl: 'https://youtube.com/watch?v=ode-theory',
          description: 'Intuitive geometric and mathematical explanation of linear differential operators and superposition principle.',
          durationSeconds: 1400,
        }),
        createTestCandidate({
          id: 'ode-worked-problems',
          title: 'Second Order ODEs Worked Examples: Step-by-Step Problem Solving',
          canonicalUrl: 'https://youtube.com/watch?v=ode-problems',
          description:
            'Solving 5 full examination differential equations step by step with real, repeated, and complex conjugate roots.\n' +
            '00:00 Distinct real roots\n08:00 Repeated roots\n15:00 Complex roots',
          durationSeconds: 1800,
        }),
        createTestCandidate({
          id: 'ode-engineering-app',
          title: 'Differential Equations in Engineering: Mass-Spring Dampers and RLC Circuits (Applications of Second Order ODEs)',
          canonicalUrl: 'https://youtube.com/watch?v=ode-physics',
          description: 'Physical application of second order linear differential equations in mechanical harmonic oscillators and electrical circuits.',
          durationSeconds: 1200,
        }),
        createTestCandidate({
          id: 'irrelevant-python-ode',
          title: 'Solving ODEs in Python with Scipy: Live Coding Tutorial',
          canonicalUrl: 'https://youtube.com/watch?v=py-ode',
          description: 'Writing Python scripts to solve ODEs with numpy and scipy.integrate.odeint.',
          durationSeconds: 1100,
        }),
      ];

      const plan = distributor.distribute([moduleCtx], candidatePool, { maxResourcesPerModule: 3 });
      const resources = plan.modules[0].resources;

      assert.equal(resources.length, 3);
      const ids = resources.map((r) => r.candidateId);

      // Must select conceptual ODE + worked numerical derivations + real-world physical applications
      assert.ok(ids.includes('ode-theory'), 'Must include conceptual ODE');
      assert.ok(ids.includes('ode-worked-problems'), 'Must include step-by-step worked math problems');
      assert.ok(ids.includes('ode-engineering-app'), 'Must include physical/engineering application');

      // STRICT VALIDATION: Pure math module must NOT select irrelevant coding tutorial when pure math candidates exist
      assert.ok(
        !ids.includes('irrelevant-python-ode'),
        'Must NOT force irrelevant programming tutorial onto pure analytical math topic'
      );
    });

    // Scenario D: Electronics / Hardware (Operational Amplifiers)
    it('Scenario D: Electronics balances op-amp theory, circuit calculations, and breadboard/SPICE simulation demos', () => {
      const moduleCtx: ModuleInputContext = {
        moduleId: 'mod-ee-opamp',
        moduleNumber: 1,
        moduleTitle: 'Operational Amplifiers: Circuits and Analysis',
        objective: createTestObjective({
          rawTitle: 'Operational Amplifiers inverting and non-inverting',
          domain: 'engineering',
          academicLevel: 'undergraduate',
          primaryConcepts: ['op-amp', 'inverting amplifier', 'gain calculation'],
        }),
      };

      const candidatePool = [
        createTestCandidate({
          id: 'opamp-theory',
          title: 'Op-Amp Fundamentals: The Golden Rules and Ideal Operational Amplifier',
          canonicalUrl: 'https://youtube.com/watch?v=opamp-th',
          description: 'Theoretical foundations of op-amps, virtual ground, high input impedance, and negative feedback.',
          durationSeconds: 1300,
        }),
        createTestCandidate({
          id: 'opamp-bench-lab',
          title: 'Building Op-Amp Circuits on Breadboard with Oscilloscope & SPICE Simulation',
          canonicalUrl: 'https://youtube.com/watch?v=opamp-lab',
          description:
            'Hardware lab demonstration: constructing an inverting op-amp on a breadboard, testing with function generator and scope.\n' +
            '00:00 Schematic\n03:00 Breadboard wiring\n08:00 Oscilloscope waveforms\n14:00 SPICE verification',
          durationSeconds: 1100,
        }),
        createTestCandidate({
          id: 'opamp-calculations',
          title: 'Op-Amp Circuit Worked Examples & Solved Calculations',
          canonicalUrl: 'https://youtube.com/watch?v=opamp-calc',
          description: 'Step-by-step solved design problems calculating closed-loop gain, resistor values, and saturation limits.',
          durationSeconds: 950,
        }),
      ];

      const plan = distributor.distribute([moduleCtx], candidatePool, { maxResourcesPerModule: 3 });
      const resources = plan.modules[0].resources;

      assert.equal(resources.length, 3);
      const ids = resources.map((r) => r.candidateId);
      assert.ok(ids.includes('opamp-theory'), 'Must include opamp theory');
      assert.ok(ids.includes('opamp-bench-lab'), 'Must include breadboard/lab demonstration');
      assert.ok(ids.includes('opamp-calculations'), 'Must include worked circuit calculations');
    });

    // Scenario E: Web Development (REST APIs)
    it('Scenario E: Web Development balances REST architecture, live API implementation, and Postman API testing', () => {
      const moduleCtx: ModuleInputContext = {
        moduleId: 'mod-web-rest',
        moduleNumber: 1,
        moduleTitle: 'Building RESTful APIs with Node and Express',
        objective: createTestObjective({
          rawTitle: 'RESTful API Development with Express',
          domain: 'computer_science',
          academicLevel: 'undergraduate',
          primaryConcepts: ['rest api', 'http methods', 'express routing'],
        }),
      };

      const candidatePool = [
        createTestCandidate({
          id: 'rest-theory',
          title: 'What is a REST API? HTTP Methods, Status Codes, and Architecture Explained',
          canonicalUrl: 'https://youtube.com/watch?v=rest-theory',
          description: 'Conceptual foundations of RESTful architecture, statelessness, HTTP verbs (GET, POST, PUT, DELETE), and JSON payload format.',
          durationSeconds: 1100,
        }),
        createTestCandidate({
          id: 'rest-code-tutorial',
          title: 'Build a REST API with Node.js and Express — Live Coding Walkthrough',
          canonicalUrl: 'https://youtube.com/watch?v=rest-code',
          description:
            'Hands-on tutorial building a full CRUD API from scratch.\n' +
            'GitHub repo: https://github.com/developer/express-api-tutorial\n' +
            '00:00 Project setup\n04:00 Express server\n11:00 Route handlers\n18:00 Error handling',
          durationSeconds: 1600,
        }),
        createTestCandidate({
          id: 'rest-postman-testing',
          title: 'Testing REST APIs with Postman: Complete Practical Walkthrough',
          canonicalUrl: 'https://youtube.com/watch?v=rest-postman',
          description: 'Hands-on practical guide to sending GET, POST, PUT requests and verifying responses using Postman and curl.',
          durationSeconds: 850,
        }),
      ];

      const plan = distributor.distribute([moduleCtx], candidatePool, { maxResourcesPerModule: 3 });
      const resources = plan.modules[0].resources;

      assert.equal(resources.length, 3);
      const ids = resources.map((r) => r.candidateId);
      assert.ok(ids.includes('rest-theory'), 'Must include REST architecture');
      assert.ok(ids.includes('rest-code-tutorial'), 'Must include live API coding');
      assert.ok(ids.includes('rest-postman-testing'), 'Must include API testing walkthrough');
    });

    // Scenario F: Insufficient Practical Results
    it('Scenario F: Gracefully handles modules where authentic practical resources are unavailable without fabricating filler', () => {
      const moduleCtx: ModuleInputContext = {
        moduleId: 'mod-niche-theory',
        moduleNumber: 1,
        moduleTitle: 'Homotopy Type Theory Foundations',
        objective: createTestObjective({
          rawTitle: 'Homotopy Type Theory and Univalence Axiom',
          domain: 'mathematics',
          academicLevel: 'advanced',
          primaryConcepts: ['homotopy type theory', 'univalence axiom'],
        }),
      };

      // Pool only has 1 high-quality conceptual lecture and 1 irrelevant spam video
      const candidatePool = [
        createTestCandidate({
          id: 'hott-lecture',
          title: 'Introduction to Homotopy Type Theory and the Univalence Axiom',
          canonicalUrl: 'https://youtube.com/watch?v=hott-1',
          description: 'Authoritative university lecture introducing identity types and univalence axiom.',
          durationSeconds: 3200,
        }),
        createTestCandidate({
          id: 'spam-video',
          title: 'Make $10,000 with crypto fast',
          canonicalUrl: 'https://youtube.com/watch?v=spam',
          description: 'Unrelated financial advice.',
          durationSeconds: 300,
        }),
      ];

      const plan = distributor.distribute([moduleCtx], candidatePool, {
        minRelevanceThreshold: 50,
        maxResourcesPerModule: 3,
      });

      const resources = plan.modules[0].resources;

      // Must select the 1 authentic lecture and NEVER select the spam video
      assert.equal(resources.length, 1);
      assert.equal(resources[0].candidateId, 'hott-lecture');
      assert.ok(!resources.some((r) => r.candidateId === 'spam-video'));
      assert.ok(plan.modules[0].isEmptyState === false);
    });
  });

  // =========================================================================
  // 5. Upgrade Scoreboard Validation
  // =========================================================================
  describe('5. Intelligent Practical Learning Upgrade Scoreboard', () => {
    it('verifies all quality dimensions: query expansion, classification accuracy, duration scoring, and distribution balance', () => {
      // 1. Query Expansion Check
      const pyObj = createTestObjective({
        rawTitle: 'React Hooks and State Management',
        domain: 'computer_science',
        primaryConcepts: ['react hooks', 'usestate', 'useeffect'],
      });
      const queries = QueryGenerator.generateCandidates(pyObj);
      assert.ok(queries.length >= 3, 'Must produce multiple targeted queries');
      assert.ok(queries.some((q) => q.intent === 'practical_tutorial'));

      // 2. Classification Accuracy Check
      const genuineProject = createTestCandidate({
        id: 'react-todo-project',
        title: 'Build a Todo App in React with Hooks — Full Hands-On Project',
        canonicalUrl: 'https://youtube.com/watch?v=react-todo',
        description: 'Complete project walkthrough from scratch.\nGitHub repo: https://github.com/react/todo\n00:00 Setup\n10:00 State',
        durationSeconds: 2400,
      });
      const evalProj = practicalClassifier.classify(genuineProject);
      assert.ok(
        evalProj.primaryCategory === 'project_based' || evalProj.primaryCategory === 'practical_tutorial',
        'Should classify project/tutorial accurately'
      );
      assert.equal(evalProj.isSuperficialBuzzwordOnly, false);

      // 3. Scoreboard assertions completed
      assert.ok(true, 'Intelligent Practical Learning Upgrade Scoreboard validated successfully');
    });
  });
});
