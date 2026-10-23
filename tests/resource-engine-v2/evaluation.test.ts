import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ExplainableRelevanceScorer,
  EducationalDepthEvaluator,
  DurationIntelligenceEvaluator,
  ObjectiveCoverageAnalyzer,
  ExplainableRankingEngine,
  isModalityAppropriateForObjective,
} from '../../src/lib/resource-engine-v2/evaluation';
import {
  AnalyzedObjective,
  NormalizedResourceCandidate,
  EducationalDomain,
} from '../../src/lib/resource-engine-v2/types';

// Helper to construct realistic AnalyzedObjective objects for offline evaluation testing
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

// Helper to construct realistic NormalizedResourceCandidate objects for offline evaluation testing
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

describe('Resource Engine 2.0 - Phase 4: Relevance Scoring & Cross-Domain Anti-Collision', () => {
  const scorer = new ExplainableRelevanceScorer();

  it('Scenario A: Math Matrices vs DevOps Matrix Build Collision', () => {
    const mathObjective = makeObjective({
      rawTitle: 'Matrices and Determinants',
      rawDescription: 'Maharashtra State Board Class 12 Linear Algebra',
      subject: 'Mathematics',
      academicLevel: 'Class 12 HSC',
      targetExam: 'HSC',
      domain: 'mathematics',
      cognitiveIntent: 'worked_examples',
      primaryConcepts: ['matrix multiplication', 'determinants', 'inverse matrix'],
      supportingConcepts: ['matrix addition', 'row operations'],
      explicitOutcomes: ['Calculate determinant and matrix multiplication'],
      expectedSkills: ['Solve linear equations using inverse matrix'],
      negativeConstraints: ['github actions', 'matrix build', 'yaml workflow'],
      domainExclusions: ['devops', 'ci/cd'],
    });

    // Valid Math resource
    const validMath = makeCandidate({
      id: 'math-1',
      title: 'Matrix Multiplication & Determinants - Class 12 HSC Mathematics',
      description: 'Step-by-step tutorial on matrix multiplication, determinants, and solving linear systems for HSC board exams.',
      canonicalUrl: 'https://youtube.com/watch?v=math123',
      durationSeconds: 1500,
    });

    const validEval = scorer.score(mathObjective, validMath);
    assert.equal(validEval.isEligible, true);
    assert.ok(validEval.score >= 70, `Expected score >= 70, got ${validEval.score}`);
    assert.equal(validEval.breakdown.negativeCollisionPenalty, 0);
    assert.ok(validEval.positiveEvidence.some((e) => e.includes('primary concept match')));

    // Colliding CI/CD resource
    const collidingDevops = makeCandidate({
      id: 'devops-1',
      title: 'GitHub Actions Matrix Builds Tutorial - Complete CI/CD Workflow',
      description: 'Learn how to configure matrix builds in GitHub Actions with YAML workflow for automated multi-OS testing.',
      canonicalUrl: 'https://youtube.com/watch?v=devops123',
      durationSeconds: 900,
    });

    const devopsEval = scorer.score(mathObjective, collidingDevops);
    assert.equal(devopsEval.isEligible, false);
    assert.ok(devopsEval.score < 50, `Expected score < 50, got ${devopsEval.score}`);
    assert.ok(devopsEval.breakdown.negativeCollisionPenalty >= 80);
    assert.ok(devopsEval.rejectionReasons.some((r) => r.toLowerCase().includes('collision')));
  });

  it('Scenario B: Deep Learning Neural Networks vs Cisco CCNA Networking Collision', () => {
    const aiObjective = makeObjective({
      rawTitle: 'Deep Learning: Neural Networks and Backpropagation',
      domain: 'data_science_ai',
      cognitiveIntent: 'in_depth_conceptual',
      primaryConcepts: ['neural networks', 'backpropagation', 'gradient descent'],
      supportingConcepts: ['activation functions', 'loss functions'],
      explicitOutcomes: ['Derive backpropagation gradient updates'],
      expectedSkills: ['Implement a 2-layer neural network'],
      negativeConstraints: ['cisco', 'ccna', 'subnetting', 'osi layer'],
      domainExclusions: ['computer networking'],
    });

    // Valid AI resource
    const validAI = makeCandidate({
      id: 'ai-1',
      title: 'Neural Networks from Scratch: Forward Pass and Backpropagation',
      description: 'In-depth derivation of gradient descent, loss functions, and backpropagation for deep neural networks.',
      canonicalUrl: 'https://youtube.com/watch?v=ai123',
      durationSeconds: 2400,
    });

    const aiEval = scorer.score(aiObjective, validAI);
    assert.equal(aiEval.isEligible, true);
    assert.ok(aiEval.score >= 75);

    // Colliding Cisco CCNA resource
    const collidingCisco = makeCandidate({
      id: 'cisco-1',
      title: 'Cisco CCNA 200-301 Full Course: Router and Switch Network Configuration',
      description: 'Complete computer networking course covering OSI layers, subnetting, TCP/IP, and Cisco router configurations.',
      canonicalUrl: 'https://youtube.com/watch?v=cisco123',
      durationSeconds: 3600,
    });

    const ciscoEval = scorer.score(aiObjective, collidingCisco);
    assert.equal(ciscoEval.isEligible, false);
    assert.ok(ciscoEval.score < 50);
    assert.ok(ciscoEval.breakdown.negativeCollisionPenalty >= 80);
    assert.ok(ciscoEval.rejectionReasons.some((r) => r.toLowerCase().includes('collision')));
  });

  it('Scenario C: Beginner Python Fundamentals vs Advanced Machine Learning Mismatch', () => {
    const pythonObjective = makeObjective({
      rawTitle: 'Python Fundamentals: Variables, Data Types, and Loops',
      academicLevel: 'beginner',
      domain: 'computer_science',
      cognitiveIntent: 'coding_walkthrough',
      primaryConcepts: ['python variables', 'data types', 'for loops', 'while loops'],
      supportingConcepts: ['integers', 'strings', 'boolean logic'],
      explicitOutcomes: ['Write simple Python scripts using variables and loops'],
      expectedSkills: ['Control flow with while and for loops'],
    });

    // Valid Beginner Python
    const validPython = makeCandidate({
      id: 'py-1',
      title: 'Python for Beginners: Variables, Data Types, and Loops Explained',
      description: 'Step-by-step introduction to programming in Python. Covers variables, data types, and for loops with hands-on examples.',
      canonicalUrl: 'https://youtube.com/watch?v=py123',
      durationSeconds: 1200,
    });

    const pyEval = scorer.score(pythonObjective, validPython);
    assert.equal(pyEval.isEligible, true);
    assert.ok(pyEval.score >= 70);

    // Advanced PyTorch Transformers using Python as a language tool
    const advancedML = makeCandidate({
      id: 'ml-1',
      title: 'Deep Learning with PyTorch: Transformers from Scratch in Python',
      description: 'Build an end-to-end multi-head attention transformer architecture using PyTorch and Python on GPU clusters.',
      canonicalUrl: 'https://youtube.com/watch?v=ml123',
      durationSeconds: 3600,
    });

    const mlEval = scorer.score(pythonObjective, advancedML);
    assert.ok(mlEval.score < 50 || mlEval.breakdown.negativeCollisionPenalty >= 50);
    assert.equal(mlEval.isEligible, false);
  });

  it('Scenario D: PEFT / LoRA Fine-Tuning vs Fitness & Telecom Traps', () => {
    const loraObjective = makeObjective({
      rawTitle: 'Parameter-Efficient Fine-Tuning with LoRA and QLoRA',
      domain: 'data_science_ai',
      cognitiveIntent: 'coding_walkthrough',
      primaryConcepts: ['lora', 'qlora', 'peft', 'fine-tuning'],
      supportingConcepts: ['quantization', 'low-rank adaptation', 'huggingface'],
      explicitOutcomes: ['Fine-tune an open-source LLM with LoRA'],
      expectedSkills: ['Configure PEFT config and train adapter weights'],
      negativeConstraints: ['fitness', 'workout', 'lorawan'],
    });

    // Valid LoRA resource
    const validLoRA = makeCandidate({
      id: 'lora-1',
      title: 'Fine-Tuning LLMs with LoRA and QLoRA in 30 Minutes',
      description: 'Hands-on guide to parameter-efficient fine-tuning (PEFT) using LoRA and 4-bit quantization with HuggingFace.',
      canonicalUrl: 'https://youtube.com/watch?v=lora123',
      durationSeconds: 1800,
    });

    const loraEval = scorer.score(loraObjective, validLoRA);
    assert.equal(loraEval.isEligible, true);
    assert.ok(loraEval.score >= 75);

    // Colliding Fitness resource
    const fitnessColliding = makeCandidate({
      id: 'gym-1',
      title: 'Full Body Gym Workout Routine - Intense Muscle Training',
      description: 'Day 1 full body workout: chest, arms, bodybuilding exercises, and high-intensity weight training for muscle gain.',
      canonicalUrl: 'https://youtube.com/watch?v=gym123',
      durationSeconds: 900,
    });

    const gymEval = scorer.score(loraObjective, fitnessColliding);
    assert.equal(gymEval.isEligible, false);
    assert.ok(gymEval.breakdown.negativeCollisionPenalty >= 80);

    // Colliding LoRa RF telecom resource
    const telecomColliding = makeCandidate({
      id: 'rf-1',
      title: 'LoRa and LoRaWAN Explained: Long Range Radio Frequency IoT Modules',
      description: 'How 915MHz LoRa RF transceivers work with Semtech chips and IoT gateway antennas for wireless range.',
      canonicalUrl: 'https://youtube.com/watch?v=rf123',
      durationSeconds: 1100,
    });

    const rfEval = scorer.score(loraObjective, telecomColliding);
    assert.equal(rfEval.isEligible, false);
    assert.ok(rfEval.breakdown.negativeCollisionPenalty >= 80);
  });

  it('Scenario E: Macroeconomics Monetary Policy vs Banking Software Development', () => {
    const econObjective = makeObjective({
      rawTitle: 'Monetary Policy, Central Banking, and Repo Rates',
      domain: 'economics_commerce',
      cognitiveIntent: 'in_depth_conceptual',
      primaryConcepts: ['monetary policy', 'central bank', 'repo rate'],
      supportingConcepts: ['inflation', 'money supply', 'interest rates'],
      explicitOutcomes: ['Explain how repo rate adjustments control inflation'],
      expectedSkills: ['Analyze central bank policy statements'],
    });

    // Valid Macroeconomics resource
    const validEcon = makeCandidate({
      id: 'econ-1',
      title: 'Monetary Policy Explained: Central Bank Repo Rates and Inflation Control',
      description: 'In-depth lecture on macroeconomics, monetary policy mechanisms, reverse repo, and central banking money supply.',
      canonicalUrl: 'https://youtube.com/watch?v=econ123',
      durationSeconds: 2100,
    });

    const econEval = scorer.score(econObjective, validEcon);
    assert.equal(econEval.isEligible, true);
    assert.ok(econEval.score >= 70);

    // Colliding Banking Software Tutorial
    const softwareColliding = makeCandidate({
      id: 'bank-app-1',
      title: 'Build a Banking App with Spring Boot, Java, and REST API',
      description: 'CRUD application tutorial: learn how to create a full stack banking website using Spring Boot, Java, and PostgreSQL.',
      canonicalUrl: 'https://youtube.com/watch?v=bank123',
      durationSeconds: 3200,
    });

    const bankEval = scorer.score(econObjective, softwareColliding);
    assert.equal(bankEval.isEligible, false);
    assert.ok(bankEval.breakdown.negativeCollisionPenalty >= 80);
  });

  it('Audit: handles equivalent wording and morphological variations (multiplying matrices)', () => {
    const mathObjective = makeObjective({
      rawTitle: 'Matrix Multiplication',
      domain: 'mathematics',
      cognitiveIntent: 'worked_examples',
      primaryConcepts: ['matrix multiplication'],
      supportingConcepts: [],
    });

    // Different wording: "multiplying matrices" instead of exact "matrix multiplication"
    const variantCandidate = makeCandidate({
      id: 'math-var-1',
      title: 'Multiplying Matrices Step by Step: Full Problem Walkthrough',
      description: 'Worked solutions showing how to multiply two matrices easily.',
      canonicalUrl: 'https://youtube.com/watch?v=multipli123',
      durationSeconds: 1200,
    });

    const evalResult = scorer.score(mathObjective, variantCandidate);
    assert.equal(evalResult.isEligible, true);
    assert.ok(evalResult.score >= 60, `Expected score >= 60 for morphological variant, got ${evalResult.score}`);
    assert.ok(evalResult.positiveEvidence.some((e) => e.includes('morphological stems')));
  });

  it('Audit: broad subject matches do not automatically receive high scores', () => {
    const specificObjective = makeObjective({
      rawTitle: 'Binary Search Algorithm',
      domain: 'computer_science',
      cognitiveIntent: 'coding_walkthrough',
      primaryConcepts: ['binary search'],
      supportingConcepts: ['divide and conquer'],
    });

    // Broad candidate: covers Computer Science generally without touching binary search
    const broadCandidate = makeCandidate({
      id: 'broad-cs-1',
      title: 'Introduction to Computer Science and Programming Systems',
      description: 'A general overview of computer hardware, operating systems, and high level languages.',
      canonicalUrl: 'https://youtube.com/watch?v=broadcs',
      durationSeconds: 3600,
    });

    const broadEval = scorer.score(specificObjective, broadCandidate);
    assert.equal(broadEval.isEligible, false);
    assert.ok(broadEval.score < 50);
    assert.ok(broadEval.rejectionReasons.some((r) => r.includes('lacks demonstrable match for module primary learning concepts')));
  });

  it('Audit: missing description lowers confidence without unsupported rejection', () => {
    const mathObjective = makeObjective({
      rawTitle: 'Matrix Multiplication',
      domain: 'mathematics',
      cognitiveIntent: 'worked_examples',
      primaryConcepts: ['matrix multiplication'],
    });

    const minimalCandidate = makeCandidate({
      id: 'math-no-desc',
      title: 'Matrix Multiplication Complete Lecture - Linear Algebra',
      description: '', // Empty description
      canonicalUrl: 'https://youtube.com/watch?v=nodesc',
      durationSeconds: 1500,
    });

    const evalResult = scorer.score(mathObjective, minimalCandidate);
    // Should still pass because title is highly relevant
    assert.equal(evalResult.isEligible, true);
    assert.ok(evalResult.score >= 50);
    // But confidence should be reduced compared to candidate with description
    assert.ok(evalResult.confidence <= 0.75);
  });
});

describe('Resource Engine 2.0 - Phase 4: Educational Depth Evaluation', () => {
  const depthEvaluator = new EducationalDepthEvaluator();

  const dummyObjective = makeObjective({
    rawTitle: 'Binary Search Algorithm',
    domain: 'computer_science',
    cognitiveIntent: 'coding_walkthrough',
    primaryConcepts: ['binary search'],
  });

  it('evaluates ultra-short video (< 3 min) as superficial_overview', () => {
    const shortCandidate = makeCandidate({
      id: 'short-1',
      title: 'Binary Search in 60 Seconds #shorts',
      description: 'Quick binary search explanation in one minute.',
      canonicalUrl: 'https://youtube.com/watch?v=short123',
      durationSeconds: 58,
    });

    const res = depthEvaluator.evaluate(dummyObjective, shortCandidate);
    assert.equal(res.tier, 'superficial_overview');
    assert.ok(res.score <= 35);
  });

  it('evaluates 10-minute video as focused_concept', () => {
    const focusedCandidate = makeCandidate({
      id: 'focused-1',
      title: 'Understanding Binary Search: Concept and Implementation',
      description: 'A focused guide on how the binary search algorithm divides search space in O(log n) time.',
      canonicalUrl: 'https://youtube.com/watch?v=focus123',
      durationSeconds: 650,
    });

    const res = depthEvaluator.evaluate(dummyObjective, focusedCandidate);
    assert.equal(res.tier, 'focused_concept');
    assert.ok(res.score >= 50 && res.score <= 68);
  });

  it('evaluates 45-minute lecture with timestamps and exercises as in_depth_lecture', () => {
    const lectureCandidate = makeCandidate({
      id: 'lecture-1',
      title: 'Binary Search & Divide and Conquer Masterclass',
      description: 'Comprehensive algorithmic derivation. Chapters:\n0:00 Introduction\n10:15 Mathematical proof\n25:30 Worked examples & practice problems\n38:00 GitHub code repository: github.com/algo/binary-search',
      canonicalUrl: 'https://youtube.com/watch?v=lecture123',
      durationSeconds: 2700,
    });

    const res = depthEvaluator.evaluate(dummyObjective, lectureCandidate);
    assert.equal(res.tier, 'in_depth_lecture');
    assert.ok(res.score >= 75);
    assert.ok(res.signalsObserved.includes('structured_chapter_timestamps'));
    assert.ok(res.signalsObserved.includes('worked_problems_and_exercises'));
  });

  it('evaluates multi-hour bootcamp or playlist as comprehensive_course', () => {
    const courseCandidate = makeCandidate({
      id: 'course-1',
      title: 'Data Structures and Algorithms Full Course - 10 Hours',
      description: 'Complete masterclass on algorithms from scratch to advanced competitive programming.',
      canonicalUrl: 'https://youtube.com/watch?v=course123',
      durationSeconds: 7200,
    });

    const res = depthEvaluator.evaluate(dummyObjective, courseCandidate);
    assert.equal(res.tier, 'comprehensive_course');
    assert.ok(res.score >= 85);
  });

  it('evaluates academic papers with format-appropriate in_depth_lecture depth', () => {
    const paperCandidate = makeCandidate({
      id: 'paper-1',
      title: 'Optimal Binary Search Trees Under Non-Uniform Query Distributions',
      canonicalUrl: 'https://arxiv.org/abs/2301.12345',
      modality: 'paper',
      provider: 'arxiv',
    });

    const res = depthEvaluator.evaluate(dummyObjective, paperCandidate);
    assert.equal(res.tier, 'in_depth_lecture');
    assert.ok(res.score >= 70);
  });

  it('handles unknown duration without crashing or fabricating duration', () => {
    const unknownCandidate = makeCandidate({
      id: 'unk-1',
      title: 'Binary Search Lecture by Professor Smith',
      description: 'University lecture on binary search algorithms.',
      canonicalUrl: 'https://youtube.com/watch?v=unk123',
      durationSeconds: undefined,
    });

    const res = depthEvaluator.evaluate(dummyObjective, unknownCandidate);
    assert.ok(res.signalsObserved.includes('unknown_duration_metadata'));
    assert.ok(res.confidence < 0.7);
  });
});

describe('Resource Engine 2.0 - Phase 4: Duration Intelligence & 7 Targeted Audit Cases', () => {
  const durationEvaluator = new DurationIntelligenceEvaluator();
  const relevanceScorer = new ExplainableRelevanceScorer();
  const rankingEngine = new ExplainableRankingEngine();

  const objective = makeObjective({
    rawTitle: 'Binary Search Implementation and Complexity',
    domain: 'computer_science',
    cognitiveIntent: 'coding_walkthrough',
    primaryConcepts: ['binary search'],
  });

  // Case 1: Relevant 12-minute video with detailed preference
  it('Case 1: Relevant 12-minute video with detailed preference receives moderate, non-zero score', () => {
    const vid12 = makeCandidate({
      id: 'vid-12m',
      title: 'Binary Search Implementation in Python',
      canonicalUrl: 'https://youtube.com/watch?v=12m',
      durationSeconds: 720, // 12 min
    });
    const evalResult = durationEvaluator.evaluate(vid12, 'detailed');
    assert.ok(evalResult.score >= 60 && evalResult.score <= 75, `Expected 60-75, got ${evalResult.score}`);
    assert.equal(evalResult.isUnknownDuration, false);
  });

  // Case 2: Relevant 35-minute video with detailed preference
  it('Case 2: Relevant 35-minute video with detailed preference receives top score', () => {
    const vid35 = makeCandidate({
      id: 'vid-35m',
      title: 'Binary Search Deep Dive: Invariants and Edge Cases',
      canonicalUrl: 'https://youtube.com/watch?v=35m',
      durationSeconds: 2100, // 35 min
    });
    const evalResult = durationEvaluator.evaluate(vid35, 'detailed');
    assert.ok(evalResult.score >= 90, `Expected >= 90, got ${evalResult.score}`);
  });

  // Case 3: Relevant 90-minute tutorial with detailed preference
  it('Case 3: Relevant 90-minute tutorial with detailed preference receives solid score', () => {
    const vid90 = makeCandidate({
      id: 'vid-90m',
      title: 'Complete Masterclass on Binary Search and Divide-and-Conquer',
      canonicalUrl: 'https://youtube.com/watch?v=90m',
      durationSeconds: 5400, // 90 min
    });
    const evalResult = durationEvaluator.evaluate(vid90, 'detailed');
    assert.ok(evalResult.score >= 80, `Expected >= 80, got ${evalResult.score}`);
  });

  // Case 4: 90-minute video about an unrelated topic NEVER overrides relevance gate
  it('Case 4: 90-minute video about an unrelated topic is gated out regardless of duration length', () => {
    const unrelatedVid90 = makeCandidate({
      id: 'unrelated-90m',
      title: 'Complete 90-Minute Guide to Organic Vegetable Gardening',
      description: 'Learn how to grow tomatoes, carrots, and lettuce in your backyard with organic soil.',
      canonicalUrl: 'https://youtube.com/watch?v=garden90',
      durationSeconds: 5400, // 90 min
    });

    const rel = relevanceScorer.score(objective, unrelatedVid90);
    assert.equal(rel.isEligible, false);
    assert.ok(rel.score < 50);

    const rankResult = rankingEngine.rank(objective, [unrelatedVid90], { durationPreference: 'detailed' });
    assert.equal(rankResult.rankedCandidates.length, 0);
    assert.equal(rankResult.rejectedCandidates.length, 1);
    assert.equal(rankResult.rejectedCandidates[0].candidate.id, 'unrelated-90m');
  });

  // Case 5: Relevant video with unknown duration
  it('Case 5: Relevant video with unknown duration receives neutral baseline without rejection', () => {
    const unkVideo = makeCandidate({
      id: 'unk-vid',
      title: 'Binary Search Algorithm Explained',
      description: 'Detailed explanation of binary search and recursion.',
      canonicalUrl: 'https://youtube.com/watch?v=unkvid',
      durationSeconds: undefined,
    });

    const durEval = durationEvaluator.evaluate(unkVideo, 'balanced');
    assert.equal(durEval.score, 50);
    assert.equal(durEval.isUnknownDuration, true);
    assert.ok(durEval.suitabilityRationale.includes('neutral baseline'));

    const rankResult = rankingEngine.rank(objective, [unkVideo]);
    assert.equal(rankResult.rankedCandidates.length, 1);
  });

  // Case 6: Comprehensive playlist containing relevant videos
  it('Case 6: Comprehensive playlist containing relevant videos receives high depth score', () => {
    const playlistCandidate = makeCandidate({
      id: 'playlist-1',
      title: 'Searching Algorithms Course Playlist',
      description: 'Complete playlist on search algorithms including binary search and ternary search.',
      canonicalUrl: 'https://youtube.com/playlist?list=PL123',
      playlist: {
        isPlaylist: true,
        playlistItemCount: 12,
      },
    });

    const depthRes = new EducationalDepthEvaluator().evaluate(objective, playlistCandidate);
    assert.equal(depthRes.tier, 'comprehensive_course');
    assert.ok(depthRes.score >= 85);
  });

  // Case 7: Scholarly paper with no video duration
  it('Case 7: Scholarly paper with no video duration is scored as self-paced without penalty', () => {
    const paperCandidate = makeCandidate({
      id: 'paper-7',
      title: 'Analysis of Binary Search Variants in Distributed Memory',
      canonicalUrl: 'https://arxiv.org/abs/2301.55555',
      modality: 'paper',
      durationSeconds: undefined,
    });

    const durEval = durationEvaluator.evaluate(paperCandidate, 'detailed');
    assert.ok(durEval.score >= 75);
    assert.ok(durEval.suitabilityRationale.includes('self-paced'));
  });
});

describe('Resource Engine 2.0 - Phase 4: Objective-Aware Modality Diversity Audit', () => {
  const rankingEngine = new ExplainableRankingEngine();

  it('Modality Guard: correctly identifies appropriateness across 5 distinct domains/intents', () => {
    // 1. Beginner Python
    const beginnerPy = makeObjective({
      rawTitle: 'Python Basics',
      academicLevel: 'beginner',
      cognitiveIntent: 'coding_walkthrough',
      domain: 'computer_science',
      primaryConcepts: ['python'],
    });
    assert.equal(isModalityAppropriateForObjective('paper', beginnerPy), false, 'Paper must be inappropriate for Beginner Python');
    assert.equal(isModalityAppropriateForObjective('documentation', beginnerPy), true, 'Docs must be appropriate for Beginner Python');

    // 2. Maharashtra HSC Mathematics
    const hscMath = makeObjective({
      rawTitle: 'Matrices',
      academicLevel: 'Class 12',
      targetExam: 'HSC',
      cognitiveIntent: 'worked_examples',
      domain: 'mathematics',
      primaryConcepts: ['matrices'],
    });
    assert.equal(isModalityAppropriateForObjective('paper', hscMath), false, 'Paper must be inappropriate for HSC Board exam prep');
    assert.equal(isModalityAppropriateForObjective('practice', hscMath), true, 'Practice must be appropriate for HSC math');

    // 3. Practical Project Implementation
    const practicalProject = makeObjective({
      rawTitle: 'Build a Full-Stack Web App',
      cognitiveIntent: 'project_implementation',
      domain: 'computer_science',
      primaryConcepts: ['web development'],
    });
    assert.equal(isModalityAppropriateForObjective('paper', practicalProject), false, 'Paper must be inappropriate for hands-on project');
    assert.equal(isModalityAppropriateForObjective('project', practicalProject), true, 'Project modality must be appropriate');

    // 4. Advanced AI Research
    const aiResearch = makeObjective({
      rawTitle: 'Parameter-Efficient Fine-Tuning LoRA Theory',
      academicLevel: 'advanced',
      cognitiveIntent: 'in_depth_conceptual',
      domain: 'data_science_ai',
      primaryConcepts: ['lora'],
    });
    assert.equal(isModalityAppropriateForObjective('paper', aiResearch), true, 'Paper must be appropriate for Advanced AI research');

    // 5. Exam Preparation
    const examPrep = makeObjective({
      rawTitle: 'JEE Advanced Physics Problem Sets',
      targetExam: 'JEE',
      cognitiveIntent: 'exam_practice',
      domain: 'physics',
      primaryConcepts: ['kinematics'],
    });
    assert.equal(isModalityAppropriateForObjective('paper', examPrep), false, 'Paper must be inappropriate for competitive exam prep');
    assert.equal(isModalityAppropriateForObjective('practice', examPrep), true, 'Practice must be appropriate for JEE prep');
  });

  it('Beginner Python: does NOT force academic paper into top 3', () => {
    const beginnerPy = makeObjective({
      rawTitle: 'Python Fundamentals: Variables and Loops',
      academicLevel: 'beginner',
      cognitiveIntent: 'coding_walkthrough',
      domain: 'computer_science',
      primaryConcepts: ['python variables', 'for loops'],
    });

    const candidates = [
      makeCandidate({
        id: 'py-vid-1',
        title: 'Python for Beginners: Variables and Loops Tutorial 1',
        description: 'Complete hands-on guide to variables and for loops in Python.',
        canonicalUrl: 'https://youtube.com/watch?v=pyv1',
        durationSeconds: 1200,
        modality: 'video',
      }),
      makeCandidate({
        id: 'py-vid-2',
        title: 'Python for Beginners: Variables and Loops Tutorial 2',
        description: 'Second hands-on session on loops and variables.',
        canonicalUrl: 'https://youtube.com/watch?v=pyv2',
        durationSeconds: 1500,
        modality: 'video',
      }),
      makeCandidate({
        id: 'py-vid-3',
        title: 'Python for Beginners: Variables and Loops Tutorial 3',
        description: 'Third tutorial on while loops and variable scopes.',
        canonicalUrl: 'https://youtube.com/watch?v=pyv3',
        durationSeconds: 1400,
        modality: 'video',
      }),
      makeCandidate({
        id: 'py-paper-1',
        title: 'Formal Semantics of Python Variables and Loop Invariants',
        description: 'Scholarly preprint on abstract interpretation of dynamic variable binding in Python.',
        canonicalUrl: 'https://arxiv.org/abs/2301.88888',
        modality: 'paper',
      }),
    ];

    const result = rankingEngine.rank(beginnerPy, candidates, { requireModalityDiversity: true });

    // Top 3 must all be videos/tutorials, NOT forced paper!
    const top3Ids = result.rankedCandidates.slice(0, 3).map((r) => r.candidate.id);
    assert.ok(!top3Ids.includes('py-paper-1'), 'Academic paper must NOT be forced into top 3 for Beginner Python');
  });

  it('Advanced AI Research: slots academic paper into top 3 when eligible and competitive', () => {
    const aiResearch = makeObjective({
      rawTitle: 'Parameter-Efficient Fine-Tuning with LoRA',
      academicLevel: 'advanced',
      cognitiveIntent: 'in_depth_conceptual',
      domain: 'data_science_ai',
      primaryConcepts: ['lora', 'fine-tuning'],
    });

    const candidates = [
      makeCandidate({
        id: 'ai-vid-1',
        title: 'LoRA Fine-Tuning Explained: Video Lecture',
        description: 'Deep dive into low-rank adaptation matrix decomposition.',
        canonicalUrl: 'https://youtube.com/watch?v=aiv1',
        durationSeconds: 2400,
        modality: 'video',
      }),
      makeCandidate({
        id: 'ai-vid-2',
        title: 'LoRA Fine-Tuning Practical Implementation Video',
        description: 'Step by step implementation video.',
        canonicalUrl: 'https://youtube.com/watch?v=aiv2',
        durationSeconds: 1800,
        modality: 'video',
      }),
      makeCandidate({
        id: 'ai-paper-1',
        title: 'LoRA: Low-Rank Adaptation of Large Language Models',
        description: 'The foundational research paper introducing low-rank matrix decomposition for fine-tuning LLMs.',
        canonicalUrl: 'https://arxiv.org/abs/2106.09685',
        modality: 'paper',
      }),
    ];

    const result = rankingEngine.rank(aiResearch, candidates, { requireModalityDiversity: true });
    const top3Modalities = result.rankedCandidates.slice(0, 3).map((r) => r.candidate.modality);
    assert.ok(top3Modalities.includes('paper'), 'Academic paper must be slotted for Advanced AI research');
  });
});

describe('Resource Engine 2.0 - Phase 4: Objective Coverage Audit & Title Stuffing', () => {
  const coverageAnalyzer = new ObjectiveCoverageAnalyzer();

  it('discounts multiple primary concepts packed into title of a short video without description', () => {
    const broadMathObjective = makeObjective({
      rawTitle: 'Linear Algebra Core Concepts',
      domain: 'mathematics',
      cognitiveIntent: 'conceptual_foundations',
      primaryConcepts: [
        'matrix multiplication',
        'determinants',
        'eigenvalues',
        'vector spaces',
        'linear transformations',
      ],
    });

    // Short 3-minute video stuffing all concepts in title with empty description
    const stuffedCandidate = makeCandidate({
      id: 'stuffed-1',
      title: 'Matrix Multiplication, Determinants, Eigenvalues, Vector Spaces, and Linear Transformations in 3 Minutes',
      description: '', // Empty description
      canonicalUrl: 'https://youtube.com/watch?v=stuff3m',
      durationSeconds: 180, // 3 min
    });

    const res = coverageAnalyzer.analyze(broadMathObjective, stuffedCandidate);

    // It should NOT credit all 5 concepts
    assert.ok(res.coveredPrimaryConcepts.length <= 2, `Expected at most 2 credited concepts, got ${res.coveredPrimaryConcepts.length}`);
    assert.ok(res.uncoveredConcepts.length >= 3);
    assert.ok(res.limitations.some((l) => l.includes('superficial title mentions without explanatory description were not credited')));
  });

  it('credits multiple concepts when supported by substantive description chapters', () => {
    const broadMathObjective = makeObjective({
      rawTitle: 'Linear Algebra Core Concepts',
      domain: 'mathematics',
      cognitiveIntent: 'in_depth_conceptual',
      primaryConcepts: ['matrix multiplication', 'determinants', 'eigenvalues'],
    });

    const legitimateLecture = makeCandidate({
      id: 'legit-1',
      title: 'Linear Algebra Masterclass',
      description: 'Comprehensive 60-minute university lecture.\n0:00 Introduction\n10:00 Matrix multiplication mechanics\n25:00 Determinants and geometric scaling\n45:00 Eigenvalues and eigenvectors derivation',
      canonicalUrl: 'https://youtube.com/watch?v=legit60m',
      durationSeconds: 3600,
    });

    const res = coverageAnalyzer.analyze(broadMathObjective, legitimateLecture);
    assert.equal(res.coveredPrimaryConcepts.length, 3);
    assert.equal(res.uncoveredConcepts.length, 0);
  });
});

describe('Resource Engine 2.0 - Phase 4: Configurable Weights & Determinism', () => {
  const rankingEngine = new ExplainableRankingEngine();

  const objective = makeObjective({
    rawTitle: 'Matrix Multiplication and Determinants',
    domain: 'mathematics',
    cognitiveIntent: 'worked_examples',
    primaryConcepts: ['matrix multiplication', 'determinants'],
  });

  const candidates = [
    makeCandidate({
      id: 'cand-1',
      title: 'Matrix Multiplication and Determinants Lecture',
      description: 'Step by step problem walkthrough.',
      canonicalUrl: 'https://youtube.com/watch?v=c1',
      durationSeconds: 1800,
    }),
    makeCandidate({
      id: 'cand-2',
      title: 'Determinants and Matrix Multiplication Worked Problems',
      description: 'Exercises on matrices and determinants.',
      canonicalUrl: 'https://youtube.com/watch?v=c2',
      durationSeconds: 1200,
    }),
  ];

  it('supports configurable weights in RankingOptions', () => {
    // Run with custom weights heavily emphasizing depth (60%) over relevance (20%)
    const customResult = rankingEngine.rank(objective, candidates, {
      weights: {
        relevanceWeight: 0.20,
        depthWeight: 0.60,
        durationWeight: 0.10,
        coverageWeight: 0.10,
      },
    });

    assert.equal(customResult.rankedCandidates.length, 2);
    for (const r of customResult.rankedCandidates) {
      assert.ok(r.overallScore >= 50);
    }
  });

  it('produces strictly deterministic scores and rankings across repeated runs', () => {
    const run1 = rankingEngine.rank(objective, candidates);
    const run2 = rankingEngine.rank(objective, candidates);

    assert.equal(run1.rankedCandidates.length, run2.rankedCandidates.length);
    assert.equal(run1.rankedCandidates[0].candidate.id, run2.rankedCandidates[0].candidate.id);
    assert.equal(run1.rankedCandidates[0].overallScore, run2.rankedCandidates[0].overallScore);
    assert.equal(run1.rankedCandidates[1].candidate.id, run2.rankedCandidates[1].candidate.id);
    assert.equal(run1.rankedCandidates[1].overallScore, run2.rankedCandidates[1].overallScore);
  });
});
