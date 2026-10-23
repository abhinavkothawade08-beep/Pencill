import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  LearningObjectiveAnalyzer,
  AnalyzedObjectiveSchema,
  AnalysisResultSchema,
} from '../../src/lib/resource-engine-v2';

describe('Resource Engine 2.0 - Learning Objective Analyzer', () => {
  const analyzer = new LearningObjectiveAnalyzer();

  describe('Scenario A: Maharashtra HSC Math (Matrices & Differentiation)', () => {
    it('classifies mathematical domain and guards against DevOps/matrix build collision', () => {
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

      const result = analyzer.analyze(input);

      // Validate schema compliance
      assert.doesNotThrow(() => AnalysisResultSchema.parse(result));
      assert.doesNotThrow(() => AnalyzedObjectiveSchema.parse(result.objective));

      // Domain verification
      assert.strictEqual(result.objective.domain, 'mathematics');
      assert.strictEqual(result.objective.domainProvenance, 'user_provided');
      assert.ok(result.confidence.domainConfidence >= 0.9);

      // Concept extraction verification
      const conceptsLower = result.objective.primaryConcepts.map((c) => c.toLowerCase());
      assert.ok(
        conceptsLower.some((c) => c.includes('matri') || c.includes('determinant')),
        'Expected matrices or determinants in primary concepts'
      );

      // Anti-collision guard verification
      assert.ok(result.objective.domainExclusions.length > 0);
      assert.ok(
        result.objective.domainExclusions.some((term) =>
          term.includes('github') || term.includes('devops') || term.includes('matrix build')
        ),
        'Expected DevOps/GitHub Actions matrix build terms in exclusions'
      );
      assert.ok(
        result.objective.negativeConstraints.some((t) => t.includes('devops') || t.includes('github')),
        'Expected negative constraints to include DevOps exclusion'
      );

      // Curricular context preservation
      assert.strictEqual(result.objective.targetExam, 'Maharashtra HSC');
      assert.strictEqual(result.objective.academicLevel, 'class-12');
      assert.strictEqual(result.objective.preferredLanguage, 'English / Marathi');
    });
  });

  describe('Scenario B: Neural Networks Architecture & Backpropagation', () => {
    it('classifies deep learning domain and guards against Cisco CCNA collision', () => {
      const input = {
        courseTitle: 'Deep Learning and Modern AI',
        moduleTitle: 'Neural Networks Architecture and Backpropagation',
        moduleDescription:
          'Foundations of artificial neural networks, activation functions, forward propagation, loss calculation, and gradient backpropagation.',
        subject: 'Artificial Intelligence',
        academicLevel: 'undergraduate-intermediate',
      };

      const result = analyzer.analyze(input);

      assert.strictEqual(result.objective.domain, 'data_science_ai');
      assert.ok(
        result.objective.primaryConcepts.some((c) =>
          c.toLowerCase().includes('neural network') || c.toLowerCase().includes('backpropagation')
        )
      );

      // Anti-collision: Cisco CCNA / Computer Networking exclusion
      assert.ok(
        result.objective.domainExclusions.some((term) =>
          term.includes('cisco') || term.includes('ccna') || term.includes('subnetting')
        ),
        'Expected Cisco / CCNA terms in domain exclusions'
      );

      // Intent should be theoretical / in-depth conceptual or coding walkthrough
      assert.ok(
        result.objective.cognitiveIntent === 'in_depth_conceptual' ||
        result.objective.cognitiveIntent === 'coding_walkthrough'
      );
    });
  });

  describe('Scenario C: Python Fundamentals (Foundations & Memory Model)', () => {
    it('identifies beginner programming foundations without injecting ML bloat', () => {
      const input = {
        courseTitle: 'Python Programming for Complete Beginners',
        moduleTitle: 'Variables, Data Types, and Memory Model',
        moduleDescription:
          'Understanding Python variables, primitive data types, memory reference, and basic assignment.',
        learnerDifficulty: 'beginner' as const,
        academicLevel: 'foundation',
        subject: 'Computer Science',
      };

      const result = analyzer.analyze(input);

      assert.strictEqual(result.objective.domain, 'computer_science');
      assert.strictEqual(result.objective.academicLevel, 'foundation');

      // Intent should be conceptual foundations or coding walkthrough
      assert.ok(
        result.objective.cognitiveIntent === 'conceptual_foundations' ||
        result.objective.cognitiveIntent === 'coding_walkthrough'
      );

      // Check concepts do not contain deep learning / neural / transformer hallucination
      const allExtracted = [
        ...result.objective.primaryConcepts,
        ...result.objective.supportingConcepts,
      ].join(' ').toLowerCase();

      assert.ok(!allExtracted.includes('neural'));
      assert.ok(!allExtracted.includes('transformer'));
      assert.ok(!allExtracted.includes('lora'));
    });
  });

  describe('Scenario D: Frontier AI (PEFT, LoRA & QLoRA)', () => {
    it('recognizes compound PEFT terminology and avoids generic fitness training traps', () => {
      const input = {
        courseTitle: 'Fine-Tuning Large Language Models',
        moduleTitle: 'Parameter-Efficient Fine-Tuning with LoRA and QLoRA',
        moduleDescription:
          'Practical implementation of Low-Rank Adaptation (LoRA) and 4-bit Quantized LoRA (QLoRA) for instruction-tuning open-source LLMs.',
        academicLevel: 'undergraduate-advanced',
        learnerDifficulty: 'advanced' as const,
      };

      const result = analyzer.analyze(input);

      assert.strictEqual(result.objective.domain, 'data_science_ai');

      // Compound terms preserved
      const conceptsLower = [
        ...result.objective.primaryConcepts,
        ...result.objective.supportingConcepts,
      ].map((c) => c.toLowerCase());

      assert.ok(
        conceptsLower.some((c) =>
          c.includes('parameter-efficient') ||
          c.includes('lora') ||
          c.includes('qlora') ||
          c.includes('low-rank')
        ),
        'Expected compound PEFT/LoRA terminology'
      );

      // Fitness training exclusions
      assert.ok(
        result.objective.domainExclusions.some((t) =>
          t.includes('gym') || t.includes('fitness') || t.includes('bodybuilding')
        ),
        'Expected fitness/gym training exclusions for AI weights/training'
      );
    });
  });

  describe('Scenario E: Macroeconomics (Monetary Policy & Central Banking)', () => {
    it('classifies economics domain with zero software or tech assumptions', () => {
      const input = {
        courseTitle: 'Principles of Macroeconomics',
        moduleTitle: 'Monetary Policy and Central Banking Instruments',
        moduleDescription:
          'How central banks control money supply, interest rate channels, open market operations, reserve requirements, and inflation targeting.',
        subject: 'Economics',
        academicLevel: 'undergraduate-intro',
      };

      const result = analyzer.analyze(input);

      assert.strictEqual(result.objective.domain, 'economics_commerce');
      assert.strictEqual(result.objective.domainProvenance, 'user_provided');

      // Primary concepts
      const concepts = result.objective.primaryConcepts.map((c) => c.toLowerCase());
      assert.ok(
        concepts.some((c) => c.includes('monetary policy') || c.includes('central bank')),
        'Expected monetary policy or central banking in primary concepts'
      );

      // Zero software or coding assumptions
      assert.notStrictEqual(result.objective.cognitiveIntent, 'coding_walkthrough');
      assert.notStrictEqual(result.objective.cognitiveIntent, 'project_implementation');
    });
  });

  describe('Scenario F: Incomplete Module ("Introduction" with empty description)', () => {
    it('preserves uncertainty, tracks missing info, and prevents syllabus hallucination', () => {
      const input = {
        courseTitle: 'Quantum Computing Fundamentals',
        moduleTitle: 'Introduction',
        moduleDescription: '', // Missing description
      };

      const result = analyzer.analyze(input);

      // Uncertainty and missing info tracked
      assert.ok(result.missingInformation.length > 0);
      assert.ok(
        result.missingInformation.some((m) => m.toLowerCase().includes('description')),
        'Expected missing information note for empty description'
      );

      // Confidence reflects uncertainty
      assert.ok(
        result.confidence.conceptsConfidence <= 0.65,
        'Expected lower concepts confidence for empty description'
      );

      // Safe anchor from course title without hallucinating detailed algorithms
      const concepts = [
        ...result.objective.primaryConcepts,
        ...result.objective.supportingConcepts,
      ].join(' ').toLowerCase();

      assert.ok(concepts.includes('quantum computing'));
      // Must NOT hallucinate specific unmentioned advanced theorems
      assert.ok(!concepts.includes("shor's algorithm"));
      assert.ok(!concepts.includes("grover's algorithm"));
      assert.ok(!concepts.includes('fault-tolerant surface codes'));
    });
  });

  describe('Scenario G: Practical Project Module', () => {
    it('classifies project implementation cognitive intent for hands-on build module', () => {
      const input = {
        courseTitle: 'Full Stack Web Development',
        moduleTitle: 'Building a Real-Time Chat App with WebSockets',
        moduleDescription:
          'Step-by-step implementation of a full-stack real-time chat application using Node.js, WebSockets, and React from scratch.',
        subject: 'Computer Science',
      };

      const result = analyzer.analyze(input);

      assert.strictEqual(result.objective.cognitiveIntent, 'project_implementation');
      assert.strictEqual(result.objective.domain, 'computer_science');
      assert.ok(result.objective.expectedSkills.length > 0);
    });
  });

  describe('Contextual Domain Disambiguation & Polysemous Protection', () => {
    it('does not classify scientific laws (Ohm\'s Law) as legal studies', () => {
      const input = {
        courseTitle: 'Introduction to Electronics and Circuit Analysis',
        moduleTitle: 'Ohm\'s Law and Electrical Resistance',
        moduleDescription: 'Relationship between voltage, current, and resistance in electrical circuits.',
      };

      const result = analyzer.analyze(input);

      assert.notStrictEqual(result.objective.domain, 'law');
      assert.strictEqual(result.objective.domain, 'physics');
    });

    it('falls back to general_academic when context has insufficient evidence', () => {
      const input = {
        moduleTitle: 'General Communication Patterns',
        moduleDescription: 'An exploratory look at dialogue dynamics.',
      };

      const result = analyzer.analyze(input);

      assert.strictEqual(result.objective.domain, 'general_academic');
      assert.strictEqual(result.objective.domainProvenance, 'fallback_default');
      assert.ok(result.confidence.domainConfidence <= 0.5);
    });
  });

  describe('Deterministic & Offline Invariants', () => {
    it('produces identical output for identical inputs across repeated runs', () => {
      const input = {
        courseTitle: 'Physics I: Classical Mechanics',
        moduleTitle: 'Rotational Dynamics and Angular Momentum',
        moduleDescription: 'Torque, moment of inertia, and conservation of angular momentum.',
        subject: 'Physics',
        targetExam: 'JEE Advanced',
      };

      const run1 = analyzer.analyze(input);
      const run2 = analyzer.analyze(input);

      assert.deepStrictEqual(run1, run2);
    });

    it('operates purely offline without network access or environment variables', () => {
      // Analyzer does not require API keys or external services
      assert.doesNotThrow(() => {
        analyzer.analyze({
          moduleTitle: 'Kinetic Theory of Gases',
          subject: 'Physics',
        });
      });
    });
  });
});
