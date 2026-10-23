import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  IntentAwareSearchPlanner,
  SearchQueryItemSchema,
  QueryDeduplicator,
  SearchQueryItem,
} from '../../src/lib/resource-engine-v2';

describe('Resource Engine 2.0 - Intent-Aware Search Planner', () => {
  const planner = new IntentAwareSearchPlanner();

  describe('Scenario A: Maharashtra HSC Math (Matrices & Determinants)', () => {
    it('generates strictly mathematical queries with HSC anchors and zero DevOps bleed', () => {
      const input = {
        courseTitle: 'Class 12 Mathematics - Maharashtra State Board (HSC)',
        moduleTitle: 'Matrices and Determinants',
        moduleDescription:
          'Understanding matrix operations, inverse of a matrix, determinants, and solving systems of linear equations for Maharashtra HSC Board Examination.',
        subject: 'Mathematics',
        targetExam: 'Maharashtra HSC',
        academicLevel: 'class-12',
        preferredLanguage: 'English / Marathi',
      };

      const { analysis, queries } = planner.planFromContext(input, { maxTotalQueries: 6 });

      // Schema validation
      assert.ok(queries.length > 0 && queries.length <= 6);
      queries.forEach((q) => assert.doesNotThrow(() => SearchQueryItemSchema.parse(q)));

      // Curricular and subject anchors
      const allQueryStrings = queries.map((q) => q.queryString.toLowerCase()).join(' | ');
      assert.ok(
        allQueryStrings.includes('hsc') || allQueryStrings.includes('class 12'),
        'Expected HSC or Class 12 curricular anchor in search queries'
      );
      assert.ok(
        allQueryStrings.includes('matri') || allQueryStrings.includes('determinant'),
        'Expected matrices or determinants in search queries'
      );

      // Strict rejection of DevOps / CI-CD matrix builds
      assert.ok(!allQueryStrings.includes('devops'), 'Found forbidden word "devops" in math queries');
      assert.ok(!allQueryStrings.includes('github actions'), 'Found "github actions" in math queries');
      assert.ok(!allQueryStrings.includes('matrix build'), 'Found "matrix build" in math queries');
      assert.ok(!allQueryStrings.includes('yaml workflow'), 'Found "yaml workflow" in math queries');

      // Negative constraints passed to providers
      queries.forEach((q) => {
        if (q.negativeTerms && q.negativeTerms.length > 0) {
          assert.ok(
            q.negativeTerms.some((t) => t.includes('devops') || t.includes('github') || t.includes('matrix build')),
            'Expected DevOps exclusions in negative terms'
          );
        }
      });
    });
  });

  describe('Scenario B: Neural Networks Architecture & Backpropagation', () => {
    it('generates deep learning queries and strictly prevents Cisco CCNA networking collision', () => {
      const input = {
        courseTitle: 'Deep Learning and Modern AI',
        moduleTitle: 'Neural Networks Architecture and Backpropagation',
        moduleDescription:
          'Foundations of artificial neural networks, activation functions, forward propagation, loss calculation, and gradient backpropagation.',
        subject: 'Artificial Intelligence',
        academicLevel: 'undergraduate-intermediate',
      };

      const { queries } = planner.planFromContext(input, { maxTotalQueries: 6 });

      const allQueryStrings = queries.map((q) => q.queryString.toLowerCase()).join(' | ');

      // Should target AI/deep learning
      assert.ok(
        allQueryStrings.includes('neural') || allQueryStrings.includes('backpropagation'),
        'Expected neural networks or backpropagation in search queries'
      );

      // Strict rejection of Cisco CCNA / Computer Networking
      assert.ok(!allQueryStrings.includes('cisco'), 'Found forbidden word "cisco"');
      assert.ok(!allQueryStrings.includes('ccna'), 'Found forbidden word "ccna"');
      assert.ok(!allQueryStrings.includes('subnetting'), 'Found forbidden word "subnetting"');
      assert.ok(!allQueryStrings.includes('router'), 'Found forbidden word "router"');
      assert.ok(!allQueryStrings.includes('osi layer'), 'Found forbidden word "osi layer"');

      // Negative constraints verification
      queries.forEach((q) => {
        if (q.negativeTerms && q.negativeTerms.length > 0) {
          assert.ok(
            q.negativeTerms.some((t) => t.includes('cisco') || t.includes('ccna') || t.includes('routing')),
            'Expected Cisco/CCNA exclusions in negative terms'
          );
        }
      });
    });
  });

  describe('Scenario C: Python Fundamentals (Beginner Foundations & Memory Model)', () => {
    it('generates coding walkthroughs and foundational queries without injecting ML bloat', () => {
      const input = {
        courseTitle: 'Python Programming for Complete Beginners',
        moduleTitle: 'Variables, Data Types, and Memory Model',
        moduleDescription:
          'Understanding Python variables, primitive data types, memory reference, and basic assignment.',
        learnerDifficulty: 'beginner' as const,
        academicLevel: 'foundation',
        subject: 'Computer Science',
      };

      const { queries } = planner.planFromContext(input, { maxTotalQueries: 6 });

      const allQueryStrings = queries.map((q) => q.queryString.toLowerCase()).join(' | ');

      assert.ok(
        allQueryStrings.includes('variable') || allQueryStrings.includes('data type') || allQueryStrings.includes('memory'),
        'Expected variables or data types in search queries'
      );

      // Zero AI / ML bloat injected into beginner programming
      assert.ok(!allQueryStrings.includes('pytorch'));
      assert.ok(!allQueryStrings.includes('tensorflow'));
      assert.ok(!allQueryStrings.includes('transformer'));
      assert.ok(!allQueryStrings.includes('llm'));

      // Modalities include both video and documentation/reading
      const modalities = new Set(queries.map((q) => q.preferredModality));
      assert.ok(modalities.has('video'), 'Expected video modality');
      assert.ok(
        modalities.has('documentation') || modalities.has('monograph'),
        'Expected documentation or monograph modality'
      );
    });
  });

  describe('Scenario D: Frontier AI (PEFT, LoRA & QLoRA)', () => {
    it('generates queries targeting parameter-efficient fine-tuning without generic training collapse', () => {
      const input = {
        courseTitle: 'Fine-Tuning Large Language Models',
        moduleTitle: 'Parameter-Efficient Fine-Tuning with LoRA and QLoRA',
        moduleDescription:
          'Practical implementation of Low-Rank Adaptation (LoRA) and 4-bit Quantized LoRA (QLoRA) for instruction-tuning open-source LLMs.',
        academicLevel: 'undergraduate-advanced',
        learnerDifficulty: 'advanced' as const,
      };

      const { queries } = planner.planFromContext(input, { maxTotalQueries: 6 });

      const allQueryStrings = queries.map((q) => q.queryString.toLowerCase()).join(' | ');

      // Check preservation of compound terms
      assert.ok(
        allQueryStrings.includes('lora') ||
        allQueryStrings.includes('peft') ||
        allQueryStrings.includes('parameter-efficient') ||
        allQueryStrings.includes('qlora'),
        'Expected LoRA/PEFT compound terms in search queries'
      );

      // Fitness exclusions present
      queries.forEach((q) => {
        if (q.negativeTerms && q.negativeTerms.length > 0) {
          assert.ok(
            q.negativeTerms.some((t) => t.includes('gym') || t.includes('fitness') || t.includes('workout')),
            'Expected fitness training exclusions'
          );
        }
      });
    });
  });

  describe('Scenario E: Macroeconomics (Monetary Policy & Central Banking)', () => {
    it('anchors queries to monetary economics with zero software/coding terms', () => {
      const input = {
        courseTitle: 'Principles of Macroeconomics',
        moduleTitle: 'Monetary Policy and Central Banking Instruments',
        moduleDescription:
          'How central banks control money supply, interest rate channels, open market operations, reserve requirements, and inflation targeting.',
        subject: 'Economics',
        academicLevel: 'undergraduate-intro',
      };

      const { queries } = planner.planFromContext(input, { maxTotalQueries: 6 });

      const allQueryStrings = queries.map((q) => q.queryString.toLowerCase()).join(' | ');

      // Should target monetary policy / central banking
      assert.ok(
        allQueryStrings.includes('monetary policy') || allQueryStrings.includes('central bank'),
        'Expected monetary policy or central banking in queries'
      );

      // Must have zero programming or coding terms
      assert.ok(!allQueryStrings.includes('python'));
      assert.ok(!allQueryStrings.includes('javascript'));
      assert.ok(!allQueryStrings.includes('code implementation'));
      assert.ok(!allQueryStrings.includes('coding walkthrough'));

      // Modalities should include monograph/reading notes
      const modalities = new Set(queries.map((q) => q.preferredModality));
      assert.ok(modalities.has('monograph'), 'Expected monograph reading modality for macroeconomics');
    });
  });

  describe('Scenario F: Incomplete Module ("Introduction" with empty description)', () => {
    it('safely uses course context without crashing and avoids hallucinating syllabus facts', () => {
      const input = {
        courseTitle: 'Quantum Computing Fundamentals',
        moduleTitle: 'Introduction',
        moduleDescription: '', // Empty description
      };

      const { analysis, queries } = planner.planFromContext(input, { maxTotalQueries: 4 });

      assert.ok(queries.length > 0 && queries.length <= 4);
      queries.forEach((q) => assert.doesNotThrow(() => SearchQueryItemSchema.parse(q)));

      const allQueryStrings = queries.map((q) => q.queryString.toLowerCase()).join(' | ');
      assert.ok(allQueryStrings.includes('quantum computing'));

      // Check no unmentioned syllabus topics were hallucinated
      assert.ok(!allQueryStrings.includes("shor's"));
      assert.ok(!allQueryStrings.includes("grover's"));
    });
  });

  describe('Scenario G: Practical Project Module', () => {
    it('generates project implementation queries with step-by-step walkthrough keywords', () => {
      const input = {
        courseTitle: 'Full Stack Web Development',
        moduleTitle: 'Building a Real-Time Chat App with WebSockets',
        moduleDescription:
          'Step-by-step implementation of a full-stack real-time chat application using Node.js, WebSockets, and React from scratch.',
        subject: 'Computer Science',
      };

      const { queries } = planner.planFromContext(input, { maxTotalQueries: 6 });

      const allQueryStrings = queries.map((q) => q.queryString.toLowerCase()).join(' | ');

      assert.ok(
        allQueryStrings.includes('build') ||
        allQueryStrings.includes('project') ||
        allQueryStrings.includes('step by step') ||
        allQueryStrings.includes('walkthrough'),
        'Expected project implementation keywords in queries'
      );

      const modalities = new Set(queries.map((q) => q.preferredModality));
      assert.ok(modalities.has('project') || modalities.has('video'));
    });
  });

  describe('Scenario H: Semantic Permutation Deduplication & Redundancy Prevention', () => {
    it('prunes exact word-order permutations and respects query limit', () => {
      const mockCandidates: SearchQueryItem[] = [
        {
          id: 'q1',
          targetConcept: 'Matrices and Determinants',
          queryString: 'Calculus matrix multiplication rules step by step',
          intent: 'worked_examples',
          preferredModality: 'video',
          providerCompatibility: ['youtube'],
          priority: 1,
          provenance: 'Primary worked example query',
        },
        {
          id: 'q2', // Exact token permutation of q1 with different word order
          targetConcept: 'Matrices and Determinants',
          queryString: 'Matrix multiplication rules calculus step by step',
          intent: 'worked_examples',
          preferredModality: 'video',
          providerCompatibility: ['youtube'],
          priority: 2,
          provenance: 'Redundant permutation',
        },
        {
          id: 'q3', // Minor preposition variant
          targetConcept: 'Matrices and Determinants',
          queryString: 'Rules for matrix multiplication in calculus step by step',
          intent: 'worked_examples',
          preferredModality: 'video',
          providerCompatibility: ['youtube'],
          priority: 2,
          provenance: 'Redundant preposition variant',
        },
        {
          id: 'q4', // Distinct concept / modality
          targetConcept: 'Inverse of a Matrix',
          queryString: 'Inverse of a matrix linear algebra textbook notes',
          intent: 'authoritative_documentation',
          preferredModality: 'monograph',
          providerCompatibility: ['academic_notes'],
          priority: 2,
          provenance: 'Authoritative textbook notes',
        },
        {
          id: 'q5', // Distinct concept
          targetConcept: 'Systems of Linear Equations',
          queryString: 'Solving systems of linear equations Gaussian elimination tutorial',
          intent: 'in_depth_conceptual',
          preferredModality: 'video',
          providerCompatibility: ['youtube'],
          priority: 1,
          provenance: 'Conceptual lecture',
        },
      ];

      const deduplicated = QueryDeduplicator.deduplicate(mockCandidates, {
        maxTotalQueries: 3,
        maxQueriesPerIntent: 2,
      });

      // q2 and q3 should be pruned as redundant permutations of q1
      const queryStrings = deduplicated.map((q) => q.queryString);
      assert.ok(queryStrings.includes('Calculus matrix multiplication rules step by step'));
      assert.ok(!queryStrings.includes('Matrix multiplication rules calculus step by step'));

      // Total count strictly respects maxTotalQueries
      assert.strictEqual(deduplicated.length, 3);
    });

    it('preserves distinct learning intents (introductory, worked solutions, derivations, monographs) even when sharing core concept words', () => {
      // 4 distinct queries targeting different pedagogical functions for the same concept
      const multiIntentCandidates: SearchQueryItem[] = [
        {
          id: 'q-intro',
          targetConcept: 'Matrices and Determinants',
          queryString: 'Class 12 Matrices and Determinants full tutorial explanation',
          intent: 'foundational_explanation',
          preferredModality: 'video',
          providerCompatibility: ['youtube'],
          priority: 1,
          provenance: 'Foundational introduction',
        },
        {
          id: 'q-worked',
          targetConcept: 'Matrices and Determinants',
          queryString: 'Class 12 Matrices and Determinants solved problems step by step exercises',
          intent: 'worked_examples',
          preferredModality: 'video',
          providerCompatibility: ['youtube'],
          priority: 1,
          provenance: 'Worked exercise solutions',
        },
        {
          id: 'q-derivation',
          targetConcept: 'Matrices and Determinants',
          queryString: 'Class 12 Matrices and Determinants derivation theory in-depth lecture',
          intent: 'in_depth_conceptual',
          preferredModality: 'video',
          providerCompatibility: ['youtube'],
          priority: 1,
          provenance: 'Rigorous derivation lecture',
        },
        {
          id: 'q-reading',
          targetConcept: 'Matrices and Determinants',
          queryString: 'Class 12 Matrices and Determinants textbook chapter notes summary',
          intent: 'authoritative_documentation',
          preferredModality: 'monograph',
          providerCompatibility: ['academic_notes'],
          priority: 2,
          provenance: 'Authoritative textbook reading notes',
        },
      ];

      const retained = QueryDeduplicator.deduplicate(multiIntentCandidates, {
        maxTotalQueries: 6,
        maxQueriesPerIntent: 2,
        maxQueriesPerModality: 3,
      });

      // All 4 distinct pedagogical intents must be retained
      const retainedIntents = retained.map((q) => q.intent);
      assert.ok(retainedIntents.includes('foundational_explanation'), 'Expected foundational explanation');
      assert.ok(retainedIntents.includes('worked_examples'), 'Expected worked examples');
      assert.ok(retainedIntents.includes('in_depth_conceptual'), 'Expected in-depth conceptual derivation');
      assert.ok(retainedIntents.includes('authoritative_documentation'), 'Expected authoritative textbook notes');
      assert.strictEqual(retained.length, 4);
    });
  });

  describe('Deterministic & Offline Invariants', () => {
    it('produces identical query sequence across repeated planning runs', () => {
      const input = {
        courseTitle: 'Physics I: Classical Mechanics',
        moduleTitle: 'Rotational Dynamics and Angular Momentum',
        moduleDescription: 'Torque, moment of inertia, and conservation of angular momentum.',
        subject: 'Physics',
        targetExam: 'JEE Advanced',
      };

      const run1 = planner.planFromContext(input);
      const run2 = planner.planFromContext(input);

      assert.deepStrictEqual(run1, run2);
    });

    it('every query provides explicit provenance explaining its educational existence', () => {
      const input = {
        courseTitle: 'Organic Chemistry',
        moduleTitle: 'Haloalkanes and Haloarenes',
        moduleDescription: 'Nucleophilic substitution reactions, SN1 and SN2 mechanisms.',
        subject: 'Chemistry',
      };

      const { queries } = planner.planFromContext(input);

      queries.forEach((q) => {
        assert.ok(q.provenance && q.provenance.trim().length > 10, 'Expected detailed provenance string');
        assert.ok(q.priority >= 1 && q.priority <= 5, 'Priority must be between 1 and 5');
        assert.ok(q.providerCompatibility.length > 0, 'Must have at least one compatible provider');
      });
    });
  });
});
