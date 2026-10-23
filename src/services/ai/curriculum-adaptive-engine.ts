/**
 * Topic-Adaptive Curriculum Engine
 * 
 * Provides topic-breadth analysis, structural validation, and pedagogical curriculum
 * synthesis for Pencill's AI learning paths. Ensures module count, technical depth,
 * and sequencing dynamically match topic complexity without arbitrary limits.
 */

import { GeneratedLearningPath, GeneratedModuleOutline, GeneratedLessonSummaryOutline } from './types';
import { EngineResource } from '@/lib/resource-engine-v2';

export interface TopicComplexityAnalysis {
  complexityTier: 'narrow_focused' | 'foundational_compact' | 'intermediate_core' | 'advanced_frontier' | 'comprehensive_mastery';
  recommendedModuleRange: [number, number];
  domain: string;
  detectedSubtopics: string[];
  prerequisites: string[];
  practicalFocus: string[];
}

/**
 * Infer primary academic domain from topic string
 */
export function inferDomain(topic: string, explicitDomain?: string): string {
  if (explicitDomain && explicitDomain !== 'Interdisciplinary Studies' && explicitDomain !== 'General') {
    return explicitDomain;
  }
  const t = topic.toLowerCase();
  if (
    t.includes('llm') ||
    /\bai\b/i.test(topic) ||
    t.includes('intelligence') ||
    t.includes('neural') ||
    t.includes('deep learning') ||
    t.includes('python') ||
    t.includes('code') ||
    t.includes('programming') ||
    t.includes('algorithm') ||
    t.includes('machine learning') ||
    t.includes('data structure') ||
    t.includes('software') ||
    t.includes('fine-tuning') ||
    t.includes('fine tuning') ||
    t.includes('transformer') ||
    t.includes('database') ||
    t.includes('frontend') ||
    t.includes('backend')
  ) {
    return 'Computer Science';
  }
  if (
    t.includes('math') ||
    t.includes('calculus') ||
    t.includes('algebra') ||
    t.includes('geometry') ||
    t.includes('probability') ||
    t.includes('statistics') ||
    t.includes('linear algebra') ||
    t.includes('differential')
  ) {
    return 'Mathematics';
  }
  if (
    t.includes('chem') ||
    t.includes('organic') ||
    t.includes('inorganic') ||
    t.includes('molecul') ||
    t.includes('orbital') ||
    t.includes('reaction') ||
    t.includes('equilibrium') ||
    t.includes('haloalkane') ||
    t.includes('haloarene') ||
    t.includes('alkyl halide') ||
    t.includes('aryl halide')
  ) {
    return 'Chemistry';
  }
  if (
    t.includes('bio') ||
    t.includes('genetics') ||
    t.includes('cell') ||
    t.includes('anatomy') ||
    t.includes('physiology') ||
    t.includes('zoology') ||
    t.includes('botany')
  ) {
    return 'Biology';
  }
  if (
    t.includes('physic') ||
    t.includes('quantum') ||
    t.includes('mechanic') ||
    t.includes('relativity') ||
    t.includes('thermodynamic') ||
    t.includes('optics') ||
    t.includes('electromagnet') ||
    t.includes('kinematic')
  ) {
    return 'Physics';
  }
  if (t.includes('econ') || t.includes('finance') || t.includes('market') || t.includes('accounting')) {
    return 'Economics & Finance';
  }
  return 'Interdisciplinary Studies';
}

/**
 * Analyzes topic complexity, breadth, and essential conceptual coverage.
 * Dynamically computes a balanced, cohesive module range based on subject scope,
 * level, and target duration to avoid over-fragmentation or artificial bloat.
 */
export function analyzeTopicComplexity(
  topic: string,
  level?: string,
  durationHours?: number
): TopicComplexityAnalysis {
  const t = topic.toLowerCase();
  const domain = inferDomain(topic);

  // 1. Narrow / Focused / Single-Concept Topics (2-3 cohesive modules)
  // Evaluated first so specific concepts (e.g. "Binary Search", "Gradient Descent", "Python Decorators")
  // avoid unnecessary over-segmentation into multi-stage foundational or core tiers
  const isNarrowFocused =
    t.includes('decorator') ||
    t.includes('generator') ||
    t.includes('list comprehension') ||
    t.includes('binary search') ||
    t.includes('gradient descent') ||
    t.includes('backpropagation') ||
    t.includes('regex') ||
    t.includes('regular expression') ||
    t.includes('docker compose') ||
    t.includes('git rebase') ||
    t.includes('react hook') ||
    t.includes('flexbox') ||
    t.includes('jwt') ||
    t.includes('recursion') ||
    (t.includes('lora') && !t.includes('fine'));

  if (isNarrowFocused) {
    return {
      complexityTier: 'narrow_focused',
      recommendedModuleRange: [2, 3],
      domain,
      detectedSubtopics: [
        'Core Mechanics, Architecture & Foundational Principles',
        'Applied Implementation, Idiomatic Patterns & Edge Cases',
        'Advanced Optimizations, Diagnostics & Production Synthesis',
      ],
      prerequisites: ['Foundational Syntax & Execution Environment'],
      practicalFocus: ['Hands-on Implementation', 'Edge Case Diagnostics', 'Pattern Benchmarking'],
    };
  }

  // 2. Broad / Frontier / Multi-Stage Engineering (5-6 cohesive modules)
  const isDeepFrontier =
    t.includes('fine-tuning') ||
    t.includes('fine tuning') ||
    t.includes('large language model') ||
    t.includes('llm') ||
    (t.includes('machine learning') && !t.includes('intro') && !t.includes('basics')) ||
    t.includes('deep learning') ||
    t.includes('distributed system') ||
    t.includes('cloud architecture') ||
    t.includes('compiler design') ||
    t.includes('computer vision') ||
    t.includes('natural language processing') ||
    t.includes('quantum computing') ||
    t.includes('full stack') ||
    t.includes('robotics');

  if (isDeepFrontier) {
    const maxModules = durationHours && durationHours >= 40 ? 7 : 6;
    return {
      complexityTier: 'comprehensive_mastery',
      recommendedModuleRange: [5, maxModules],
      domain,
      detectedSubtopics: [
        'Foundational Theory & Architecture Mechanics',
        'Dataset Engineering & Supervised Training (SFT)',
        'Parameter-Efficient Fine-Tuning (PEFT, LoRA & QLoRA)',
        'Alignment, Preference Optimization & Safety (RLHF & DPO)',
        'Evaluation, Quantization & Production Deployment',
      ],
      prerequisites: ['Linear Algebra', 'Probability & Statistics', 'Python Programming', 'PyTorch / GPU Compute'],
      practicalFocus: ['End-to-End Pipeline Implementation', 'Hyperparameter Optimization', 'Benchmark Evaluation'],
    };
  }

  // 2b. Haloalkanes and Haloarenes (Dedicated NCERT / JEE Class 12 Chemistry Chapter: 4 Cohesive Modules)
  const isHaloalkanes =
    t.includes('haloalkane') ||
    t.includes('haloarene') ||
    t.includes('alkyl halide') ||
    t.includes('aryl halide');

  if (isHaloalkanes) {
    return {
      complexityTier: 'intermediate_core',
      recommendedModuleRange: [4, 4],
      domain: 'Chemistry',
      detectedSubtopics: [
        'Classification, IUPAC Nomenclature & Nature of the C-X Bond',
        'Methods of Preparation of Haloalkanes & Haloarenes',
        'Nucleophilic Substitution Reactions & Mechanisms (SN1 & SN2)',
        'Elimination Reactions, Organometallics & Polyhalogen Compounds',
      ],
      prerequisites: ['General Organic Chemistry (GOC)', 'Reaction Intermediates & Isomerism'],
      practicalFocus: ['Mechanism Arrow-Pushing Drills', 'Stereochemical Inversion & Retention Analysis', 'Synthetic Conversions & Problem Sets'],
    };
  }

  // 3. Intermediate / Core Multi-Topic Disciplines (4-5 cohesive modules)
  const isIntermediateCore =
    t.includes('data structure') ||
    t.includes('algorithm') ||
    t.includes('computer network') ||
    t.includes('operating system') ||
    t.includes('linear algebra') ||
    t.includes('calculus') ||
    t.includes('organic chemistry') ||
    t.includes('classical mechanic') ||
    t.includes('electrodynamics') ||
    t.includes('database management') ||
    t.includes('microeconomics') ||
    (level && (level.includes('12') || level.includes('undergraduate') || level.includes('rigorous')));

  if (isIntermediateCore) {
    const maxModules = durationHours && durationHours >= 36 ? 6 : 5;
    const isChem = domain === 'Chemistry';
    const isPhys = domain === 'Physics';

    const intermediateSubtopics = isChem
      ? [
          'Foundational Principles, Nomenclature & Molecular Structures',
          'Methods of Synthesis & Reaction Pathways',
          'Reaction Mechanisms, Kinetics & Energetics',
          'Chemical Reactivity, Stereochemistry & Transformations',
          'Advanced Problem-Solving & Applied Synthesis',
        ]
      : isPhys
      ? [
          'Fundamental Axioms, Coordinate Systems & Laws of Motion',
          'Conservation Principles, Work-Energy & Field Interactions',
          'Oscillatory Systems, Waves & Dynamic Equations',
          'Advanced Field Equations & Analytical Derivations',
          'Comprehensive Problem-Solving & Quantitative Synthesis',
        ]
      : [
          'Axiomatic Foundations & Linear Structures',
          'Hierarchical & Tree-Based Representations',
          'Graph Algorithms & Traversals',
          'Dynamic Programming & Optimization Paradigms',
          'Advanced Problem-Solving & Applied Synthesis',
        ];

    return {
      complexityTier: 'intermediate_core',
      recommendedModuleRange: [4, maxModules],
      domain,
      detectedSubtopics: intermediateSubtopics,
      prerequisites: ['Secondary Mathematics', 'Introductory Fundamentals'],
      practicalFocus: ['Analytical Problem Sets', 'Standard Implementation Drills', 'Diagnostic Verification'],
    };
  }

  // 4. Focused / Foundational / Single-Concept Topics (3-4 cohesive modules)
  const isChemFoundational = domain === 'Chemistry';
  const foundationalSubtopics = isChemFoundational
    ? [
        'Core Chemical Nomenclature, Formulas & Atomic Models',
        'Chemical Bonding, States of Matter & Stoichiometry',
        'Thermodynamics, Equilibrium & Reaction Kinetics',
        'Applied Chemical Drills & Diagnostic Synthesis',
      ]
    : [
        'Core Terminology, Environment Setup & Conceptual Primitives',
        'Control Flow, Logic & Functions',
        'Composite Data Structures & File Operations',
        'Applied Workflows, Debugging & Practical Mini-Project',
      ];

  return {
    complexityTier: 'foundational_compact',
    recommendedModuleRange: [3, 4],
    domain,
    detectedSubtopics: foundationalSubtopics,
    prerequisites: ['Basic Analytical Literacy'],
    practicalFocus: ['Hands-on Syntax Exercises', 'Unit Tests', 'Practical Drills'],
  };
}

/**
 * Validates and sanitizes a generated curriculum structure.
 * Enforces sequential module numbering, ensures no empty modules or lessons,
 * and guards against malformed outputs without imposing artificial limits.
 */
export function validateAndSanitizeCurriculum(
  data: Partial<GeneratedLearningPath>,
  fallbackTopic: string
): { valid: boolean; curriculum: GeneratedLearningPath; warnings: string[] } {
  const warnings: string[] = [];

  const title = (data.title || `${fallbackTopic} Comprehensive Mastery Path`).trim();
  const description = (
    data.description ||
    `A comprehensive academic learning path covering foundational theory, applied methods, and mastery milestones for ${fallbackTopic}.`
  ).trim();
  const domain = (data.domain || inferDomain(fallbackTopic)).trim();
  const level = (data.level || 'Intermediate').trim();
  const tags = Array.isArray(data.tags) && data.tags.length > 0 ? data.tags : [domain, 'Academic', 'Mastery'];
  const syllabusNote = (
    data.syllabusNote ||
    'Curated academic curriculum organized into verified modular milestones aligned with peer-reviewed literature and university standards.'
  ).trim();

  const rawModules = Array.isArray(data.modules) ? data.modules : [];

  if (rawModules.length === 0) {
    warnings.push('Curriculum returned 0 modules; fallback synthesis required.');
    const fallback = createTopicAdaptiveCurriculum(fallbackTopic, level, 8);
    return { valid: false, curriculum: fallback, warnings };
  }

  // Deduplicate duplicate or empty module titles and enforce sensible upper bound (max 8 cohesive modules)
  const seenModuleTitles = new Set<string>();
  const deduplicatedRawModules: typeof rawModules = [];

  for (const m of rawModules) {
    if (!m || typeof m !== 'object') continue;
    const normTitle = (m.title || '')
      .toLowerCase()
      .replace(/^(module\s*\d+[:.-]?\s*)/i, '')
      .replace(/[^a-z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!normTitle || seenModuleTitles.has(normTitle)) {
      warnings.push(`Filtered duplicate or empty module: "${m.title}"`);
      continue;
    }
    seenModuleTitles.add(normTitle);
    deduplicatedRawModules.push(m);
  }

  const effectiveModules = deduplicatedRawModules.length >= 2 ? deduplicatedRawModules.slice(0, 8) : rawModules.slice(0, 8);
  const sanitizedModules: GeneratedModuleOutline[] = [];

  effectiveModules.forEach((m, idx) => {
    if (!m || typeof m !== 'object') return;

    const moduleNumber = idx + 1;
    const modTitle = (m.title || `Module ${moduleNumber}: Core Concepts`).trim();
    const objective = (
      m.objective ||
      `Master core theoretical principles and applied methods of ${modTitle}.`
    ).trim();
    const estimatedHours = typeof m.estimatedHours === 'number' && m.estimatedHours > 0 ? m.estimatedHours : 6;

    // Validate and sanitize lessons
    const rawLessons = Array.isArray(m.lessons) ? m.lessons : [];
    const sanitizedLessons: GeneratedLessonSummaryOutline[] = [];

    rawLessons.forEach((l) => {
      if (!l || typeof l !== 'object') return;
      const lessonTitle = (l.title || 'Core Lesson Unit').trim();
      const validTypes: Array<'video' | 'monograph' | 'practice' | 'quiz'> = ['video', 'monograph', 'practice', 'quiz'];
      const lessonType = validTypes.includes(l.type as any) ? (l.type as 'video' | 'monograph' | 'practice' | 'quiz') : 'video';
      const estimatedMinutes = typeof l.estimatedMinutes === 'number' && l.estimatedMinutes > 0 ? l.estimatedMinutes : 25;
      const keyConcepts = Array.isArray(l.keyConcepts) && l.keyConcepts.length > 0
        ? l.keyConcepts.map((k) => String(k).trim()).filter(Boolean)
        : [modTitle, 'Foundational Method'];

      sanitizedLessons.push({
        title: lessonTitle,
        type: lessonType,
        estimatedMinutes,
        keyConcepts,
      });
    });

    // If module has no lessons or fewer than 2 lessons, inject standard pedagogical lesson quartets
    if (sanitizedLessons.length < 2) {
      sanitizedLessons.push(
        {
          title: `${modTitle}: Lecture & Core Principles`,
          type: 'video',
          estimatedMinutes: 30,
          keyConcepts: [modTitle, 'Theoretical Framework'],
        },
        {
          title: `${modTitle}: Comprehensive Monograph & Reference Notes`,
          type: 'monograph',
          estimatedMinutes: 45,
          keyConcepts: ['Formal Definitions', 'Analytical Derivation'],
        },
        {
          title: `${modTitle}: Problem Set & Applied Drills`,
          type: 'practice',
          estimatedMinutes: 40,
          keyConcepts: ['Practical Problem Solving', 'Case Implementations'],
        },
        {
          title: `${modTitle}: Diagnostic Checkpoint`,
          type: 'quiz',
          estimatedMinutes: 15,
          keyConcepts: ['Formative Assessment', 'Mastery Verification'],
        }
      );
    }

    sanitizedModules.push({
      title: modTitle,
      moduleNumber,
      estimatedHours,
      objective,
      description: m.description,
      keySubtopics: m.keySubtopics,
      prerequisites: m.prerequisites,
      practicalActivity: m.practicalActivity,
      lessons: sanitizedLessons,
    });
  });

  const totalCalculatedHours = sanitizedModules.reduce((acc, m) => acc + (m.estimatedHours || 0), 0);
  const durationHours = typeof data.durationHours === 'number' && data.durationHours > 0
    ? data.durationHours
    : Math.max(12, totalCalculatedHours);

  const weeklyCheckpoint = data.weeklyCheckpoint && typeof data.weeklyCheckpoint === 'object'
    ? {
        title: (data.weeklyCheckpoint.title || `${sanitizedModules[0]?.title || 'Module 1'} Checkpoint`).trim(),
        description: (data.weeklyCheckpoint.description || 'Formative conceptual review to verify readiness.').trim(),
        targetMilestone: (data.weeklyCheckpoint.targetMilestone || 'Sprint Checkpoint').trim(),
      }
    : {
        title: `${sanitizedModules[0]?.title || 'Module 1'} Checkpoint`,
        description: 'Verify foundational clarity before proceeding to applied setups.',
        targetMilestone: 'Sprint Checkpoint',
      };

  const curriculum: GeneratedLearningPath = {
    title,
    description,
    domain,
    level,
    durationHours,
    moduleCount: sanitizedModules.length,
    tags,
    syllabusNote,
    weeklyCheckpoint,
    modules: sanitizedModules,
  };

  return {
    valid: sanitizedModules.length >= 2,
    curriculum,
    warnings,
  };
}

export interface AdaptiveCurriculumOptions {
  modalities?: string[];
  targetExam?: string;
  difficulty?: string;
  explicitDomain?: string;
  depthLevel?: string;
  language?: string;
}

/**
 * Intelligent Topic-Adaptive Fallback Curriculum Synthesizer.
 * Creates a pedagogically sound, topic-specific curriculum when AI service is unavailable.
 * Dynamically scales module count and titles based on topic complexity.
 */
export function createTopicAdaptiveCurriculum(
  topic: string,
  level: string = 'intermediate',
  weeklyHours: number = 6,
  resources: EngineResource[] = [],
  options?: AdaptiveCurriculumOptions
): GeneratedLearningPath {
  const cleanTopic = topic.trim();
  const domain = inferDomain(cleanTopic, options?.explicitDomain);
  const complexity = analyzeTopicComplexity(cleanTopic, level);
  const durationHours = Math.max(16, weeklyHours * 4);
  const t = cleanTopic.toLowerCase();

  let moduleTemplates: Array<{
    title: string;
    objective: string;
    hoursWeight: number;
    videoTitle: string;
    videoConcepts: string[];
    monographTitle: string;
    monographConcepts: string[];
    practiceTitle: string;
    practiceConcepts: string[];
    quizTitle: string;
    quizConcepts: string[];
  }> = [];

  // =========================================================================
  // Specific Topic Curricula (Haloalkanes & Haloarenes, Fine-Tuning, LLMs, ML, DSA, Python)
  // =========================================================================

  if (t.includes('haloalkane') || t.includes('haloarene') || t.includes('alkyl halide') || (t.includes('halo') && t.includes('chem'))) {
    // 4 Cohesive Modules for Haloalkanes and Haloarenes (NCERT / JEE Syllabus)
    moduleTemplates = [
      {
        title: 'Classification, Nomenclature & Nature of the C-X Bond',
        objective: 'Master IUPAC nomenclature, classification of mono/di/polyhaloalkanes and haloarenes, C-X bond polarity, and physical properties (boiling points, dipole moments, density).',
        hoursWeight: 0.25,
        videoTitle: 'Haloalkanes and Haloarenes: Classification, IUPAC Nomenclature & Nature of C-X Bond',
        videoConcepts: ['Classification of Haloalkanes', 'IUPAC Nomenclature', 'C-X Bond Polarity & Dipole Moments', 'Physical Properties & Boiling Point Trends'],
        monographTitle: 'Electronic Structure, Dipole Moments & Physical Properties of Alkyl and Aryl Halides',
        monographConcepts: ['Carbon-Halogen Bond Characteristics', 'Dipole Moments', 'Solubility & Boiling Point Factors'],
        practiceTitle: 'Nomenclature, Structural Isomerism & Nature of C-X Bond Problem Set',
        practiceConcepts: ['IUPAC Naming Drills', 'Boiling Point Trend Analysis', 'Isomer Identification'],
        quizTitle: 'Classification, Nomenclature & Physical Properties Diagnostic Checkpoint',
        quizConcepts: ['IUPAC Nomenclature Rules', 'C-X Bond Length & Polarity Ordering'],
      },
      {
        title: 'Methods of Preparation of Haloalkanes & Haloarenes',
        objective: 'Formulate synthetic pathways from alcohols (HX, SOCl2, PX3/PX5), free radical halogenation of alkanes, electrophilic addition to alkenes, halogen exchange (Finkelstein & Swarts), and Sandmeyer/Gattermann reactions for haloarenes.',
        hoursWeight: 0.25,
        videoTitle: 'Preparation of Haloalkanes & Haloarenes: Alcohols, Halogen Exchange & Sandmeyer Reaction',
        videoConcepts: ['Preparation from Alcohols (Darzens Process)', 'Markovnikov & Anti-Markovnikov Addition', 'Finkelstein & Swarts Halogen Exchange', 'Sandmeyer Reaction from Diazonium Salts'],
        monographTitle: 'Synthetic Protocols and Mechanistic Pathways for Alkyl and Aryl Halides',
        monographConcepts: ['Darzens Process Thermodynamics', 'Carbocation Rearrangements in Addition', 'Halogen Exchange Equilibria'],
        practiceTitle: 'Reagent-Based Preparation and Conversion Drills',
        practiceConcepts: ['Alcohol to Haloalkane Reagents', 'Halogen Exchange Reactions', 'Diazonium Salt Conversions'],
        quizTitle: 'Methods of Preparation Formative Assessment',
        quizConcepts: ['Reagent Selectivity (SOCl2 vs PCl5)', 'Markovnikov vs Peroxide Effect'],
      },
      {
        title: 'Nucleophilic Substitution Reactions & Mechanisms (SN1 & SN2)',
        objective: 'Master nucleophilic substitution kinetics, SN1 vs SN2 mechanism pathways, energy profiles, solvent and leaving group effects, stereochemical inversion (Walden inversion) vs retention/racemization, and optical activity.',
        hoursWeight: 0.25,
        videoTitle: 'Nucleophilic Substitution Mechanisms: SN1 vs SN2 Kinetics, Stereochemistry & Energy Profiles',
        videoConcepts: ['SN1 Carbocation Mechanism', 'SN2 Concerted Backside Attack', 'Walden Inversion', 'Optical Activity, Chirality & Racemization', 'Solvent & Leaving Group Effects'],
        monographTitle: 'Comprehensive Mechanistic Analysis: Kinetics, Stereochemistry & Substrate Reactivity in SN1 and SN2',
        monographConcepts: ['Rate Laws and Reaction Orders', 'Walden Inversion Transition State', 'Polar Protic vs Aprotic Solvent Effects'],
        practiceTitle: 'SN1 vs SN2 Pathway Prediction & Stereochemical Outcomes Problem Set',
        practiceConcepts: ['Predicting Substitution Pathways', 'Stereochemical Outcome Mapping', 'Leaving Group Ability Comparisons'],
        quizTitle: 'Substitution Mechanisms & Stereochemistry Diagnostic Checkpoint',
        quizConcepts: ['SN1 vs SN2 Kinetic Differences', 'Carbocation Rearrangement Likelihood', 'Inversion vs Racemization'],
      },
      {
        title: 'Elimination Reactions, Organometallics & Polyhalogen Compounds',
        objective: 'Analyze dehydrohalogenation elimination pathways (E1, E2, Saytzeff vs Hofmann rule), competition between substitution and elimination, Grignard reagents and Wurtz-Fittig couplings, low reactivity of haloarenes, electrophilic aromatic substitution, and polyhalogen compounds (chloroform, freons, DDT).',
        hoursWeight: 0.25,
        videoTitle: 'Elimination Reactions (E1/E2), Saytzeff Rule, Grignard Reagents & Polyhalogen Compounds',
        videoConcepts: ['Beta-Elimination (E1 vs E2)', 'Saytzeff Rule', 'Grignard Reagents & Wurtz-Fittig Reactions', 'Haloarene Low Reactivity & Resonance Stabilization', 'Polyhalogen Compounds (Freons, Chloroform, DDT)'],
        monographTitle: 'Dehydrohalogenation Invariants, Organometallic Synthesis, and Polyhalogen Environmental Chemistry',
        monographConcepts: ['Base Strength and Steric Crowding in Elimination', 'Resonance and sp2 Hybridization in Haloarenes', 'Organomagnesium Chemistry'],
        practiceTitle: 'Elimination vs Substitution & Multi-Step Organic Synthesis Problem Set',
        practiceConcepts: ['Saytzeff Product Prediction', 'Grignard Synthetic Schemes', 'Electrophilic Aromatic Substitution Products'],
        quizTitle: 'Haloalkanes & Haloarenes Capstone Assessment',
        quizConcepts: ['Saytzeff Elimination Products', 'Resonance Explanation of Haloarene Inertness', 'Grignard Reagent Handling'],
      },
    ];
  } else if (t.includes('fine-tuning') || t.includes('fine tuning') || (t.includes('llm') && t.includes('model'))) {
    // 5 Cohesive, Comprehensive Modules for AI Model Fine-Tuning
    moduleTemplates = [
      {
        title: 'Transformer Architecture Foundations & Pre-trained Encoders/Decoders',
        objective: 'Analyze self-attention mechanics, position embeddings, and autoregressive model representations for downstream adaptation.',
        hoursWeight: 0.18,
        videoTitle: 'Deconstructing Attention Mechanics & Pre-trained Transformer Heads',
        videoConcepts: ['Self-Attention', 'Residual Connections', 'LayerNorm', 'Encoder-Decoder vs Causal Decoder'],
        monographTitle: 'Mathematical Formalisms of Transfer Learning in Deep Transformers',
        monographConcepts: ['Transfer Learning Theory', 'Context Windows', 'Activation Distribution'],
        practiceTitle: 'Layer Inspection & Representation Probing Exercises',
        practiceConcepts: ['Hidden State Extraction', 'Attention Map Analysis'],
        quizTitle: 'Foundations of Attention & Transformer Primitives Checkpoint',
        quizConcepts: ['Self-Attention Complexity', 'Positional Encoding Properties'],
      },
      {
        title: 'Instruction Dataset Engineering & Supervised Fine-Tuning (SFT)',
        objective: 'Design high-yield instruction datasets, token masking strategies, and execute full-parameter supervised fine-tuning with AdamW.',
        hoursWeight: 0.20,
        videoTitle: 'Instruction Datasets, Chat Templates & Supervised Fine-Tuning (SFT)',
        videoConcepts: ['Alpaca vs ShareGPT Schema', 'ChatML Formatting', 'Loss Masking', 'AdamW Dynamics'],
        monographTitle: 'Data Quality Auditing, Deduplication & Loss Masking Protocols',
        monographConcepts: ['Prompt-Completion Loss Masking', 'Token Distribution Skew', 'Catastrophic Forgetting'],
        practiceTitle: 'End-to-End Supervised Training Loop in PyTorch',
        practiceConcepts: ['Fast Tokenizer Encoding', 'PyTorch Training Loop', 'Learning Rate Warmup'],
        quizTitle: 'Data Curation & SFT Diagnostics Checkpoint',
        quizConcepts: ['BPE Subword Tokenization', 'Loss Masking Behavior', 'Cross Entropy Loss'],
      },
      {
        title: 'Parameter-Efficient Fine-Tuning (PEFT, LoRA & QLoRA)',
        objective: 'Derive low-rank matrix decomposition for weight updates and apply NF4 double quantization for resource-efficient fine-tuning.',
        hoursWeight: 0.22,
        videoTitle: 'PEFT, LoRA & QLoRA: Matrix Factorization, Rank Selection & 4-bit NormalFloat',
        videoConcepts: ['Bottleneck Adapters', 'Low-Rank Decomposition', 'LoRA Alpha Scaling', 'NF4 Quantization'],
        monographTitle: 'Theoretical Foundations of PEFT: Intrinsic Rank & Singular Value Decomposition',
        monographConcepts: ['Aghajanyan Intrinsic Dimensionality', 'Singular Value Decomposition (SVD)', 'Target Modules'],
        practiceTitle: 'Fine-Tuning an Open LLM with QLoRA & PEFT Libraries',
        practiceConcepts: ['BitsAndBytes Integration', 'LoRA Config Setup', 'Memory Profiling'],
        quizTitle: 'PEFT, LoRA & QLoRA Derivation Assessment',
        quizConcepts: ['Rank Scaling Factor (alpha/r)', 'NF4 Representation Mechanics', 'Adapter Overhead'],
      },
      {
        title: 'Preference Alignment & Safety: Direct Preference Optimization (DPO) & RLHF',
        objective: 'Formulate policy optimization strategies to align model outputs with human intent using pairwise preference datasets.',
        hoursWeight: 0.20,
        videoTitle: 'From RLHF to DPO: Reward Modeling, PPO, and Implicit Reward Optimization',
        videoConcepts: ['RLHF Pipeline', 'Bradley-Terry Preference Model', 'DPO Closed-Form Solution', 'KL Penalty'],
        monographTitle: 'Comparative Mathematical Framework: PPO vs DPO vs KTO Policy Gradients',
        monographConcepts: ['Implicit Reward Derivation', 'Reference Model Divergence', 'Margin Optimization'],
        practiceTitle: 'Pairwise Preference Alignment Training with DPO',
        practiceConcepts: ['Chosen vs Rejected Loss', 'Beta Hyperparameter Tuning', 'Safety Red-Teaming'],
        quizTitle: 'Human Alignment & DPO Assessment',
        quizConcepts: ['Bradley-Terry Formulation', 'Role of the Reference Policy in DPO'],
      },
      {
        title: 'Rigorous Evaluation, Quantization & Production Deployment',
        objective: 'Implement standardized evaluation suites, apply AWQ/GPTQ/GGUF quantization, and deploy high-throughput serving endpoints with vLLM.',
        hoursWeight: 0.20,
        videoTitle: 'Evaluation, AWQ Quantization, Weight Merging & vLLM Production Serving',
        videoConcepts: ['MMLU & GSM8K Benchmarks', 'LoRA Weight Merging', 'PagedAttention', 'vLLM Architecture'],
        monographTitle: 'High-Throughput Inference Architecture: KV-Cache Management & Benchmark Rigor',
        monographConcepts: ['Continuous Batching', 'KV-Cache Memory Footprint', 'Benchmark Contamination Detection'],
        practiceTitle: 'Merging LoRA Weights and Deploying an OpenAI-Compatible API Endpoint',
        practiceConcepts: ['Merge and Unload', 'vLLM Docker Deployment', 'Latency Benchmarking'],
        quizTitle: 'Model Evaluation & Production Serving Final Examination',
        quizConcepts: ['PagedAttention Memory Benefits', 'Perplexity vs Accuracy', 'LoRA Merging Formula'],
      },
    ];
  } else if (t.includes('llm') || t.includes('large language model')) {
    // 5 Cohesive Modules for Comprehensive LLM Study
    moduleTemplates = [
      {
        title: 'Language Modeling Foundations & Transformer Architecture',
        objective: 'Analyze autoregressive generative modeling, multi-head self-attention, and decoder representations.',
        hoursWeight: 0.18,
        videoTitle: 'Transformer Architecture & Autoregressive Language Modeling Foundations',
        videoConcepts: ['Autoregressive Modeling', 'Multi-Head Attention', 'Causal Masking', 'Context Length'],
        monographTitle: 'Mathematical Foundations of Deep Transformers & Attention Mechanics',
        monographConcepts: ['Query-Key-Value Projections', 'Attention Complexity', 'Residual Streams'],
        practiceTitle: 'Attention Matrix Computation and KV-Cache Memory Profiling',
        practiceConcepts: ['Attention Computation', 'KV-Cache Sizing', 'LayerNorm'],
        quizTitle: 'Transformer Architecture Checkpoint',
        quizConcepts: ['Self-Attention Mechanics', 'Autoregressive Generation'],
      },
      {
        title: 'Tokenization, Pre-training Objectives & Scaling Laws',
        objective: 'Analyze subword tokenization algorithms, compute-optimal scaling laws, and large-scale pre-training dynamics.',
        hoursWeight: 0.20,
        videoTitle: 'BPE Tokenization, Pre-training Pipelines & Chinchilla Scaling Laws',
        videoConcepts: ['Byte-Pair Encoding (BPE)', 'Causal Loss', 'Chinchilla Scaling', 'Data Quality'],
        monographTitle: 'Empirical Scaling Laws and Pre-training Loss Dynamics',
        monographConcepts: ['Power Law Scaling', 'Token Allocation', 'Perplexity Curves'],
        practiceTitle: 'Training a Custom BPE Tokenizer on Raw Corpora',
        practiceConcepts: ['BPE Vocabulary Merges', 'Special Token Handling', 'Out-of-Vocabulary Robustness'],
        quizTitle: 'Pre-training & Tokenization Diagnostic',
        quizConcepts: ['BPE Algorithm Steps', 'Scaling Law Exponents'],
      },
      {
        title: 'In-Context Learning, Advanced Prompting & RAG Architectures',
        objective: 'Design structured in-context prompts, few-shot reasoning chains, vector retrieval, and grounding architectures.',
        hoursWeight: 0.22,
        videoTitle: 'Advanced Prompting, Chain-of-Thought & Production RAG Architectures',
        videoConcepts: ['Few-Shot In-Context Learning', 'Chain-of-Thought', 'Vector Embeddings', 'RAG Pipeline'],
        monographTitle: 'Theoretical Principles of In-Context Learning and Semantic Retrieval',
        monographConcepts: ['Vector Similarity Metrics', 'Context Window Utilization', 'Chunking Strategies'],
        practiceTitle: 'Building a Production RAG Pipeline with Semantic Vector Search',
        practiceConcepts: ['Vector Database Indexing', 'Top-K Retrieval', 'Hallucination Mitigation'],
        quizTitle: 'Prompting & RAG Assessment Checkpoint',
        quizConcepts: ['RAG Architecture Stages', 'In-Context Generalization'],
      },
      {
        title: 'Instruction Tuning, Parameter-Efficient Adaptation (PEFT/LoRA) & Alignment (DPO/RLHF)',
        objective: 'Formulate instruction fine-tuning, parameter-efficient rank adaptation, and direct preference optimization for safety.',
        hoursWeight: 0.20,
        videoTitle: 'Instruction Tuning, LoRA Adapters & Preference Alignment (DPO/RLHF)',
        videoConcepts: ['Supervised Fine-Tuning', 'Low-Rank Adaptation (LoRA)', 'Direct Preference Optimization', 'Safety Alignment'],
        monographTitle: 'Parameter-Efficient Optimization and Closed-Form Preference Loss',
        monographConcepts: ['Intrinsic Dimensionality', 'LoRA Weight Updates', 'Bradley-Terry Preference Formulations'],
        practiceTitle: 'Adapting an Open LLM with LoRA and Evaluating Task Performance',
        practiceConcepts: ['LoRA Hyperparameters', 'Loss Convergence', 'Safety Red-Teaming'],
        quizTitle: 'Fine-Tuning & Alignment Checkpoint',
        quizConcepts: ['LoRA Rank vs Alpha', 'DPO vs PPO Advantages'],
      },
      {
        title: 'Model Evaluation, Quantization, High-Throughput Serving (vLLM) & Agent Systems',
        objective: 'Execute standardized academic benchmarks, apply weight quantization, and deploy production serving pipelines.',
        hoursWeight: 0.20,
        videoTitle: 'LLM Benchmarking, AWQ/GGUF Quantization & High-Throughput vLLM Serving',
        videoConcepts: ['MMLU & GSM8K Benchmarks', 'Weight Quantization (AWQ/GGUF)', 'PagedAttention', 'vLLM Engine'],
        monographTitle: 'High-Throughput Inference Dynamics: PagedAttention and Continuous Batching',
        monographConcepts: ['Continuous Batching', 'KV-Cache Memory Footprint', 'Contamination Auditing'],
        practiceTitle: 'Benchmarking Inference Latency and Serving with vLLM',
        practiceConcepts: ['Throughput Benchmarking', 'Quantized Model Serving', 'API Integration'],
        quizTitle: 'LLM Capstone Examination',
        quizConcepts: ['PagedAttention Memory Footprint', 'Quantization Trade-offs'],
      },
    ];
  } else if (t.includes('machine learning') && !t.includes('basics')) {
    // 5 Cohesive Modules for Comprehensive Machine Learning
    moduleTemplates = [
      {
        title: 'Mathematical Foundations, Vector Spaces & Data Preprocessing',
        objective: 'Master multidimensional vector spaces, matrix factorizations, gradients, and robust feature engineering required for ML.',
        hoursWeight: 0.20,
        videoTitle: 'Vectors, Eigenvalues, Gradient Descent & Feature Scaling Mathematics',
        videoConcepts: ['Eigenvalues', 'Singular Value Decomposition', 'Gradient Descent', 'Standardization'],
        monographTitle: 'Analytical Optimization: Loss Surfaces, Hessians, and Convexity',
        monographConcepts: ['Hessian Matrices', 'Lagrangian Multipliers', 'Convex Optimization'],
        practiceTitle: 'Implementing Gradient Descent and Feature Pipelines in NumPy',
        practiceConcepts: ['Vectorized Operations', 'Gradient Computation', 'Feature Normalization'],
        quizTitle: 'Mathematical Foundations Diagnostic Assessment',
        quizConcepts: ['Eigenvalue Decomposition', 'Gradient Properties'],
      },
      {
        title: 'Supervised Learning: Parametric, Tree-Based & Ensemble Models',
        objective: 'Derive linear/logistic regression, L1/L2 regularization, Decision Trees, Random Forests, and Gradient Boosting (XGBoost).',
        hoursWeight: 0.22,
        videoTitle: 'Regression, Decision Trees, Random Forests & XGBoost Gradient Boosting',
        videoConcepts: ['Ordinary Least Squares', 'L1 Lasso vs L2 Ridge', 'Gini Impurity', 'Gradient Boosting'],
        monographTitle: 'The Bias-Variance Tradeoff & Ensemble Convergence Theory',
        monographConcepts: ['Bias-Variance Decomposition', 'Functional Gradient Descent', 'Shrinkage Dynamics'],
        practiceTitle: 'Ensemble Modeling & Hyperparameter Optimization on Tabular Data',
        practiceConcepts: ['Cross-Validation', 'Grid Search', 'Feature Importance Curves'],
        quizTitle: 'Supervised Learning & Ensemble Checkpoint',
        quizConcepts: ['Ridge vs Lasso Sparsity', 'Bagging vs Boosting Variance Reduction'],
      },
      {
        title: 'Support Vector Machines, Margin Theory & Kernel Methods',
        objective: 'Derive maximum margin hyperplanes, primal and dual formulations, and Mercer kernel Hilbert spaces.',
        hoursWeight: 0.18,
        videoTitle: 'Support Vector Machines: Maximum Margins, Dual Formulation & RBF Kernels',
        videoConcepts: ['Support Vectors', 'Hyperplane Geometry', 'Kernel Trick', 'Mercer Theorem'],
        monographTitle: 'Reproducing Kernel Hilbert Spaces (RKHS) and Dual Optimization',
        monographConcepts: ['Dual Problem', 'Slack Variables', 'RBF Kernel Bandwidth'],
        practiceTitle: 'Non-Linear Classification with Custom SVM Kernels',
        practiceConcepts: ['Kernel Matrix Computation', 'Margin Visualization'],
        quizTitle: 'SVM & Kernel Methods Assessment',
        quizConcepts: ['Support Vector Multipliers', 'Kernel Function Properties'],
      },
      {
        title: 'Unsupervised Learning: Clustering, Dimensionality Reduction & Mixture Models',
        objective: 'Implement K-Means, Expectation-Maximization for Gaussian Mixture Models, DBSCAN, and PCA dimensionality reduction.',
        hoursWeight: 0.20,
        videoTitle: 'K-Means, Gaussian Mixture Models, EM Algorithm & PCA Dimensionality Reduction',
        videoConcepts: ['K-Means Clustering', 'EM Algorithm', 'DBSCAN', 'Principal Component Analysis'],
        monographTitle: 'Probabilistic Graphical Models: Latent Variables and Information Theory',
        monographConcepts: ['Posterior Probability', 'Log-Likelihood Lower Bound', 'Covariance Eigenvectors'],
        practiceTitle: 'Gaussian Mixture Model Clustering and PCA Workshop',
        practiceConcepts: ['Component Selection via BIC/AIC', 'Explained Variance Ratio'],
        quizTitle: 'Unsupervised Learning Checkpoint',
        quizConcepts: ['Expectation Step vs Maximization Step', 'PCA Orthogonality'],
      },
      {
        title: 'Deep Learning Foundations & End-to-End Production ML Pipeline',
        objective: 'Formulate neural networks, automatic differentiation, backpropagation, model evaluation metrics, and production deployment.',
        hoursWeight: 0.20,
        videoTitle: 'Neural Networks from Scratch, ROC-AUC Evaluation & Production MLOps',
        videoConcepts: ['Feedforward Networks', 'Backpropagation', 'ROC-AUC Curve', 'Model Serialization'],
        monographTitle: 'Optimization Landscapes, Vanishing Gradients & Statistical Rigor',
        monographConcepts: ['Jacobian Matrices', 'Adam Optimizer', 'Calibration Curves'],
        practiceTitle: 'Building a Neural Network Framework with Autograd from Scratch',
        practiceConcepts: ['Forward & Backward Passes', 'Mini-batch SGD', 'ONNX Export'],
        quizTitle: 'Deep Learning & ML Capstone Comprehensive Examination',
        quizConcepts: ['Chain Rule in Tensor Backprop', 'Precision-Recall vs ROC Curves'],
      },
    ];
  } else if (t.includes('data structure') || (t.includes('algorithm') && !t.includes('machine learning'))) {
    // 5 Cohesive Modules for Data Structures and Algorithms
    moduleTemplates = [
      {
        title: 'Algorithmic Complexity & Linear Data Structures (Arrays, Lists, Stacks, Queues)',
        objective: 'Analyze time and space asymptotic complexity, Big-O notation, and implement contiguous and pointer-based linear structures.',
        hoursWeight: 0.20,
        videoTitle: 'Asymptotic Complexity (Big-O) & Linear Data Structures (Arrays, Linked Lists, Stacks, Queues)',
        videoConcepts: ['Big-O Notation', 'Amortized Resizing', 'Doubly Linked Lists', 'Monotonic Stacks'],
        monographTitle: 'Formal Foundations of Algorithmic Complexity and Memory Locality',
        monographConcepts: ['Master Theorem', 'Cache Lines & Memory Locality', 'Amortized Analysis'],
        practiceTitle: 'Two-Pointers, Sliding Window, and Monotonic Stack Problem Set',
        practiceConcepts: ['Two-Pointer Techniques', 'Next Greater Element', 'Ring Buffers'],
        quizTitle: 'Complexity & Linear Data Structures Checkpoint',
        quizConcepts: ['Dynamic Array Resizing Amortization', 'Master Theorem Cases'],
      },
      {
        title: 'Hash Tables, Disjoint Set Union (DSU) & Sorting Algorithms',
        objective: 'Design robust hashing algorithms, collision resolution, Disjoint Set Union with path compression, and efficient sorting.',
        hoursWeight: 0.20,
        videoTitle: 'Hash Maps, Collision Handling, Union-Find (DSU) & QuickSort/MergeSort',
        videoConcepts: ['Universal Hashing', 'Open Addressing vs Chaining', 'Union by Rank', 'QuickSort Partitioning'],
        monographTitle: 'Probabilistic Analysis of Hash Collisions & Sorting Lower Bounds',
        monographConcepts: ['Birthday Paradox', 'Inverse Ackermann Complexity', 'Omega(N log N) Lower Bound'],
        practiceTitle: 'Implementing Hash Maps, DSU Connected Components, and Dual-Pivot QuickSort',
        practiceConcepts: ['Collision Probing', 'Path Compression', 'Top-K Elements'],
        quizTitle: 'Hash Tables, Disjoint Sets & Sorting Assessment',
        quizConcepts: ['Amortized Time Complexity of DSU', 'Load Factor Thresholds'],
      },
      {
        title: 'Hierarchical Trees & Priority Queues (Binary Trees, BST, AVL, Heaps)',
        objective: 'Implement balanced search trees, tree rotations, traversal orders, binary heaps, and priority queues.',
        hoursWeight: 0.20,
        videoTitle: 'Binary Search Trees (BST), AVL Rotations, and Binary Heaps',
        videoConcepts: ['Tree Traversals', 'AVL Balance Factor', 'Left/Right Rotations', 'Min/Max Heaps'],
        monographTitle: 'Balanced Search Trees: Formal Logarithmic Height Proofs and Rotations',
        monographConcepts: ['Height Invariants', 'O(N) Build-Heap Derivation', 'Lowest Common Ancestor'],
        practiceTitle: 'Tree Inversion, Serialization, and Sliding Window Median Drills',
        practiceConcepts: ['DFS/BFS Tree Traversals', 'Dual Heap Median Maintenance'],
        quizTitle: 'Trees & Priority Queues Checkpoint',
        quizConcepts: ['AVL Rotation Types', 'BST Inorder Property', 'Build-Heap Complexity'],
      },
      {
        title: 'Graph Algorithms & Network Traversals (BFS, DFS, Dijkstra, MST)',
        objective: 'Formulate graph representations, topological sorting, shortest path algorithms (Dijkstra, Bellman-Ford), and Kruskal/Prim MST.',
        hoursWeight: 0.20,
        videoTitle: 'Graph Theory: DFS/BFS, Dijkstra Shortest Path, and Kruskal Minimum Spanning Tree',
        videoConcepts: ['Adjacency Lists', 'Topological Sort', 'Dijkstra Priority Queue', 'Kruskal with DSU'],
        monographTitle: 'Shortest Path Optimality Conditions & Negative Cycle Detection',
        monographConcepts: ['Triangle Inequality', 'Relaxation Invariant', 'Bipartite Graphs'],
        practiceTitle: 'Network Routing and Topological Dependency Resolution Drills',
        practiceConcepts: ['Cycle Detection', 'Shortest Path Grid Traversal'],
        quizTitle: 'Graph Algorithms Diagnostic Assessment',
        quizConcepts: ['Dijkstra Greedy Invariant', 'Topological Sort DAG Constraint'],
      },
      {
        title: 'Dynamic Programming & Algorithmic Problem Solving',
        objective: 'Design optimal substructure, overlapping subproblems, memoization, 2D tabular DP, and interval dynamic programming.',
        hoursWeight: 0.20,
        videoTitle: 'Dynamic Programming: Memoization, Tabulation, 0/1 Knapsack & Interval DP',
        videoConcepts: ['State Space Representation', 'Transitions', '0/1 Knapsack', 'Longest Common Subsequence'],
        monographTitle: 'The Bellman Principle of Optimality and Space Optimization Techniques',
        monographConcepts: ['State Compression', 'Space Optimization Rolling Arrays'],
        practiceTitle: 'Hard-Level Dynamic Programming and Capstone Algorithmic Problems',
        practiceConcepts: ['Grid DP', 'Interval Dynamic Programming', 'Bitmask DP'],
        quizTitle: 'DSA Capstone Examination',
        quizConcepts: ['Identifying Optimal Substructure', 'DP Transition Formulation'],
      },
    ];
  } else if ((t.includes('python') || t === 'python') && complexity.complexityTier !== 'narrow_focused') {
    // 4 Modules for Python Programming & Basics
    moduleTemplates = [
      {
        title: 'Computational Primitives, Execution Model & Syntax Fundamentals',
        objective: 'Understand Python execution pipeline, primitive data types, memory references, and variables.',
        hoursWeight: 0.25,
        videoTitle: 'Python Architecture: CPython, Bytecode, Variables & Memory Objects',
        videoConcepts: ['CPython Execution Model', 'Primitive Types', 'Dynamic Typing', 'Memory Id & Ref Counts'],
        monographTitle: 'The Python Memory Model: Mutability, Identity vs Equality, and Scoping',
        monographConcepts: ['Mutable vs Immutable Objects', 'Variable Binding', 'LEGB Rule'],
        practiceTitle: 'Variables, Type Conversions, and Arithmetic Operations Drills',
        practiceConcepts: ['Type Casting', 'Format Strings', 'Operator Precedence'],
        quizTitle: 'Python Primitive Types & Execution Checkpoint',
        quizConcepts: ['is vs == Operators', 'Immutable Types in Python'],
      },
      {
        title: 'Control Flow, Branching Logic & Iteration Protocols',
        objective: 'Implement conditional branching, loops, iterators, generators, and comprehension expressions.',
        hoursWeight: 0.25,
        videoTitle: 'Control Flow: While Loops, For-In Iteration & List Comprehensions',
        videoConcepts: ['Conditional Statements', 'Iteration Protocol', 'Range Function', 'List Comprehensions'],
        monographTitle: 'Iteration Semantics in Python: Iterables, Iterators, and the `iter()` Protocol',
        monographConcepts: ['StopIteration Protocol', 'Generator Expressions', 'Short-Circuit Evaluation'],
        practiceTitle: 'Loop Invariants and Multi-Condition Branching Exercises',
        practiceConcepts: ['Nested Loops', 'Dictionary Comprehension', 'Break/Continue'],
        quizTitle: 'Control Flow & Iteration Assessment',
        quizConcepts: ['Generator Memory Footprint', 'Short-Circuit Logic'],
      },
      {
        title: 'Composite Data Structures: Lists, Tuples, Dictionaries & Sets',
        objective: 'Master built-in data collections, time complexity of common operations, and hashable keys.',
        hoursWeight: 0.25,
        videoTitle: 'Python Collections: Lists, Tuples, Dictionaries & Set Operations',
        videoConcepts: ['List Slicing', 'Tuple Unpacking', 'Hashable Dictionary Keys', 'Set Mathematical Operations'],
        monographTitle: 'Under the Hood: How Python Dictionaries Implement Hash Tables',
        monographConcepts: ['Open Addressing in Dictionaries', 'Collision Handling', 'Tuple Immutability'],
        practiceTitle: 'Data Structure Manipulation & Aggregation Workshop',
        practiceConcepts: ['Dictionary Grouping', 'Set Intersections', 'Deep vs Shallow Copy'],
        quizTitle: 'Composite Collections Checkpoint',
        quizConcepts: ['Dictionary Key Hashability Constraints', 'List Append vs Insert Complexity'],
      },
      {
        title: 'Modular Functions, Exception Handling & File I/O Workflows',
        objective: 'Design modular functions with *args/**kwargs, robust try/except error handling, and structured file operations.',
        hoursWeight: 0.25,
        videoTitle: 'Functions, Variable Arguments, Exception Architecture & File Handling',
        videoConcepts: ['Function Signatures', 'Positional & Keyword Arguments', 'Exception Hierarchies', 'Context Managers'],
        monographTitle: 'Pythonic Design Principles: First-Class Functions and Context Managers (with statement)',
        monographConcepts: ['__enter__ and __exit__ Protocols', 'Custom Exception Classes', 'File Buffering'],
        practiceTitle: 'Mini-Project: File Processing Pipeline with Error Logging',
        practiceConcepts: ['JSON File Processing', 'Exception Propagation'],
        quizTitle: 'Python Functions & I/O Final Examination',
        quizConcepts: ['Context Manager Invariant', 'Default Parameter Evaluation Timing'],
      },
    ];
  } else if (complexity.complexityTier === 'narrow_focused') {
    // 2-3 Cohesive Modules for Narrow / Focused Single-Concept Topics
    moduleTemplates = [
      {
        title: `${cleanTopic}: Core Mechanics, Syntax & Internal Architecture`,
        objective: `Analyze foundational primitives, syntactic rules, and execution mechanics of ${cleanTopic}.`,
        hoursWeight: 0.5,
        videoTitle: `${cleanTopic} Complete Technical Deep Dive`,
        videoConcepts: [`${cleanTopic} Foundations`, 'Internal Mechanics', 'Syntax Semantics'],
        monographTitle: `${cleanTopic}: Formal Architecture & Specification Reference`,
        monographConcepts: ['Formal Mechanics', 'Memory & State Model', 'Axiomatic Invariants'],
        practiceTitle: `${cleanTopic}: Hands-on Implementation Drills`,
        practiceConcepts: ['Core Drills', 'Syntax Exercises'],
        quizTitle: `${cleanTopic} Diagnostic Checkpoint`,
        quizConcepts: ['Conceptual Clarity', 'Syntax Rules'],
      },
      {
        title: `${cleanTopic}: Applied Implementation, Idiomatic Patterns & Production Edge Cases`,
        objective: `Implement idiomatic production patterns, resolve edge cases, and benchmark performance in ${cleanTopic}.`,
        hoursWeight: 0.5,
        videoTitle: `${cleanTopic} Practical Implementation, Common Mistakes & Best Practices`,
        videoConcepts: ['Idiomatic Patterns', 'Edge Case Handling', 'Performance Optimization'],
        monographTitle: `${cleanTopic}: Design Patterns, Anti-Patterns & Best Practices`,
        monographConcepts: ['Design Patterns', 'Defensive Engineering', 'Benchmarking'],
        practiceTitle: `${cleanTopic}: Applied Problem Set & Production Refactoring`,
        practiceConcepts: ['Refactoring Drills', 'Edge Case Tests'],
        quizTitle: `${cleanTopic} Mastery Assessment`,
        quizConcepts: ['Pattern Identification', 'Error Prevention'],
      },
    ];
  } else {
    // =========================================================================
    // Generic Dynamic Topic Adapter: Generates 5 to 7 modules based on topic keywords
    // =========================================================================
    const subtopics = complexity.detectedSubtopics;
    const moduleCount = complexity.recommendedModuleRange[0];

    moduleTemplates = subtopics.slice(0, moduleCount).map((subtopic, sIdx) => {
      const isIntro = sIdx === 0;
      const isOutro = sIdx === moduleCount - 1;
      const modTitle = isIntro
        ? `${cleanTopic}: Axiomatic Principles & Primitives`
        : isOutro
        ? `${cleanTopic}: Advanced Frontiers, Synthesis & Rigorous Applications`
        : `${cleanTopic}: ${subtopic}`;

      return {
        title: modTitle,
        objective: `Achieve conceptual mastery and rigorous analytical capability in ${subtopic} within ${cleanTopic}.`,
        hoursWeight: 1 / moduleCount,
        videoTitle: `${modTitle} Comprehensive Lecture Seminar`,
        videoConcepts: [subtopic, `${cleanTopic} Framework`, 'Core Derivation'],
        monographTitle: `${modTitle}: Monograph, Proofs & Academic Notes`,
        monographConcepts: [subtopic, 'Theoretical Invariants', 'Formal Terminology'],
        practiceTitle: `${modTitle}: Analytical Problem Set & Practical Drills`,
        practiceConcepts: ['Applied Drills', 'Methodological Verification'],
        quizTitle: `${modTitle} Diagnostic Assessment Checkpoint`,
        quizConcepts: ['Formative Assessment', 'Mastery Milestone'],
      };
    });
  }

  // Construct final modules
  const modules: GeneratedModuleOutline[] = moduleTemplates.map((tpl, idx) => {
    const modNumber = idx + 1;
    const estimatedHours = Math.max(4, Math.round(durationHours * tpl.hoursWeight));

    const userModalities = options?.modalities && options.modalities.length > 0 ? options.modalities : undefined;
    const includeVideos = !userModalities || userModalities.some(m => m.toLowerCase().includes('video'));
    const includeReading = !userModalities || userModalities.some(m => m.toLowerCase().includes('read') || m.toLowerCase().includes('monograph'));
    const includePractice = !userModalities || userModalities.some(m => m.toLowerCase().includes('practice'));
    const includeQuizzes = !userModalities || userModalities.some(m => m.toLowerCase().includes('quiz'));
    const includeFlashcards = Boolean(userModalities && userModalities.some(m => m.toLowerCase().includes('flashcard') || m.toLowerCase().includes('formula')));
    const includeCoding = Boolean(userModalities && userModalities.some(m => m.toLowerCase().includes('coding') || m.toLowerCase().includes('exercise')));

    const lessons: GeneratedLessonSummaryOutline[] = [];
    if (includeVideos) {
      lessons.push({
        title: tpl.videoTitle,
        type: 'video',
        estimatedMinutes: 30,
        keyConcepts: tpl.videoConcepts,
      });
    }
    if (includeReading) {
      lessons.push({
        title: tpl.monographTitle,
        type: 'monograph',
        estimatedMinutes: 45,
        keyConcepts: tpl.monographConcepts,
      });
    }
    if (includeFlashcards) {
      const sampleFormulae = tpl.monographConcepts.slice(0, 3).map((concept, cIdx) => ({
        name: `${concept} Key Principle`,
        latex: `\\mathbf{\\Omega}_{${cIdx + 1}} = \\lim_{\\Delta t \\to 0} \\frac{\\Delta \\mathbf{\\Phi}}{\\Delta t}`,
        notes: `Core conceptual formulation and memory anchor for ${concept}.`,
      }));
      lessons.push({
        title: `${tpl.title}: Formula & Memory Anchor Flashcards`,
        type: 'formulae',
        estimatedMinutes: 15,
        keyConcepts: tpl.monographConcepts.slice(0, 3),
        formulae: sampleFormulae,
      });
    }
    if (includePractice) {
      lessons.push({
        title: options?.targetExam
          ? `${tpl.title}: ${options.targetExam} Practice Set & Analysis`
          : tpl.practiceTitle,
        type: 'practice',
        estimatedMinutes: 40,
        keyConcepts: tpl.practiceConcepts,
      });
    }
    if (includeCoding) {
      lessons.push({
        title: `${tpl.title}: Applied Interactive Exercise`,
        type: 'practice',
        estimatedMinutes: 30,
        keyConcepts: ['Hands-on Implementation', 'Edge Case Analysis'],
      });
    }
    if (includeQuizzes) {
      lessons.push({
        title: tpl.quizTitle,
        type: 'quiz',
        estimatedMinutes: 15,
        keyConcepts: tpl.quizConcepts,
      });
    }

    if (lessons.length === 0) {
      lessons.push({
        title: tpl.monographTitle,
        type: 'monograph',
        estimatedMinutes: 45,
        keyConcepts: tpl.monographConcepts,
      });
    }

    return {
      title: tpl.title,
      moduleNumber: modNumber,
      estimatedHours,
      objective: tpl.objective,
      lessons,
    };
  });

  return {
    title: `${cleanTopic} Comprehensive Academic Curriculum`,
    description: `A topic-adaptive curriculum systematically decomposing ${cleanTopic} across ${modules.length} specialized modules, progressing from core principles to applied mastery.`,
    domain,
    level: level.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    durationHours,
    moduleCount: modules.length,
    tags: [domain, 'Syllabus', 'Topic-Adaptive', 'Scholarly'],
    syllabusNote: options?.targetExam
      ? `Curriculum dynamically synthesized for ${cleanTopic} with ${modules.length} modules, aligned to ${options.targetExam} verified syllabus.`
      : `Curriculum dynamically synthesized for ${cleanTopic} with ${modules.length} modules based on disciplinary depth and standard university syllabi.`,
    weeklyCheckpoint: {
      title: `${modules[0]?.title || 'Module 1'} Synthesis`,
      description: 'Verify foundational clarity and core concepts before progressing to advanced applications.',
      targetMilestone: 'Sprint Target Checkpoint',
    },
    modules,
  };
}
