/**
 * Concept Extractor for Pencill Resource Engine 2.0
 * 
 * Extracts high-signal educational concepts while preserving multi-word
 * compound technical phrases and avoiding arbitrary token truncation.
 */

export interface ConceptExtractionResult {
  primaryConcepts: string[];
  supportingConcepts: string[];
  explicitOutcomes: string[];
  expectedSkills: string[];
  confidence: number;
  extractedFrom: {
    rawTokens: string[];
    compoundPhrases: string[];
  };
}

// Known pedagogical wrappers that should be stripped to isolate the core concept
const META_WRAPPERS = [
  /^(introduction\s+to\s+)/i,
  /^(overview\s+of\s+)/i,
  /^(fundamentals\s+of\s+)/i,
  /^(basics\s+of\s+)/i,
  /^(understanding\s+)/i,
  /^(mastering\s+)/i,
  /^(deep\s+dive\s+into\s+)/i,
  /^(guide\s+to\s+)/i,
  /^(principles\s+of\s+)/i,
  /^(a\s+tour\s+of\s+)/i,
  /^(getting\s+started\s+with\s+)/i,
  /^(hands-on\s+with\s+)/i,
  /^(comprehensive\s+guide\s+to\s+)/i,
];

// Preserved compound multi-word technical concepts across STEM, AI, Economics, and Programming
const COMPOUND_CONCEPT_DICTIONARY: string[] = [
  // AI & Data Science
  'machine learning',
  'model evaluation',
  'precision and recall',
  'confusion matrix',
  'roc curve',
  'parameter-efficient fine-tuning',
  'low-rank adaptation',
  'quantized lora',
  'neural networks',
  'artificial neural networks',
  'deep learning',
  'gradient descent',
  'gradient backpropagation',
  'loss function',
  'activation function',
  'activation functions',
  'forward propagation',
  'large language models',
  'attention mechanism',
  'self-attention',
  'cross-entropy loss',
  'transformer architecture',
  'instruction tuning',

  // Mathematics
  'matrices and determinants',
  'matrix multiplication',
  'matrix operations',
  'inverse of a matrix',
  'linear algebra',
  'differential calculus',
  'integral calculus',
  'systems of linear equations',
  'eigenvalues and eigenvectors',
  'partial fractions',
  'definite integrals',
  'chain rule',
  'differentiation rules',

  // Physics
  'rotational dynamics',
  'rotational motion',
  'moment of inertia',
  'angular momentum',
  'conservation of angular momentum',
  'electromagnetic induction',
  'lorentz force',
  'newton\'s laws of motion',
  'photoelectric effect',
  'simple harmonic motion',

  // Economics & Commerce
  'monetary policy',
  'central banking',
  'central bank instruments',
  'inflation targeting',
  'repo rate',
  'reverse repo rate',
  'open market operations',
  'cash reserve ratio',
  'fiscal policy',
  'balance of payments',
  'aggregate demand',
  'aggregate supply',

  // Computer Science & Web
  'python programming',
  'python beginner',
  'python projects',
  'distributed consensus',
  'consensus algorithm',
  'raft consensus',
  'raft algorithm',
  'cpu scheduling',
  'process scheduling',
  'full stack web development',
  'web development',
  'sql querying',
  'relational database',
  'memory model',
  'control flow',
  'data structures',
  'binary search tree',
  'dynamic programming',
  'real-time chat app',
  'restful api',
  'full stack',
  'object oriented programming',
  'virtual environment',
];

/**
 * Extracts structured concepts from module title, description, and lesson outlines.
 */
export function extractConcepts(context: {
  moduleTitle: string;
  moduleDescription?: string;
  courseTitle?: string;
  lessonTitles?: string[];
}): ConceptExtractionResult {
  const { moduleTitle, moduleDescription, courseTitle, lessonTitles } = context;

  const primarySet = new Set<string>();
  const supportingSet = new Set<string>();
  const outcomeSet = new Set<string>();
  const skillSet = new Set<string>();
  const matchedCompounds: string[] = [];

  const combinedText = [
    moduleTitle,
    moduleDescription || '',
    (lessonTitles || []).join('; '),
  ].join('. ');

  // 1. Scan for established compound multi-word technical concepts
  const lowerCombined = combinedText.toLowerCase();
  for (const compound of COMPOUND_CONCEPT_DICTIONARY) {
    if (lowerCombined.includes(compound)) {
      matchedCompounds.push(compound);
      // If it appears in the module title, it's a primary concept
      if (moduleTitle.toLowerCase().includes(compound)) {
        primarySet.add(capitalizePhrase(compound));
      } else {
        supportingSet.add(capitalizePhrase(compound));
      }
    }
  }

  // 2. Extract concepts from the module title itself
  const titleActionMatch = moduleTitle.match(/^(Building|Creating|Implementing|Developing|Configuring|Solving)\s+(.+)/i);
  if (titleActionMatch) {
    const verb = titleActionMatch[1];
    const target = titleActionMatch[2].trim();
    const actionSkill = `${verb.charAt(0).toUpperCase() + verb.slice(1).toLowerCase()} ${target}`;
    skillSet.add(actionSkill);
    outcomeSet.add(actionSkill);
  }

  const cleanedTitle = cleanPedagogicalWrappers(moduleTitle);
  if (cleanedTitle.length > 0) {
    // Check if the title is split by conjuncts ("and", "with", "&", ",", ":", "-")
    const titleParts = cleanedTitle
      .split(/\band\b|&|,|\bwith\b|\busing\b|[:\-–—\(\)]/i)
      .map((part) => cleanPedagogicalWrappers(part.trim()))
      .filter((part) => part.length >= 3);

    for (const part of titleParts) {
      if (!isGenericNoise(part)) {
        primarySet.add(capitalizePhrase(part));
      }
    }

    if (primarySet.size === 0 && !isGenericNoise(cleanedTitle)) {
      primarySet.add(capitalizePhrase(cleanedTitle));
    }
  }

  // 3. Extract from module description clauses
  if (moduleDescription && moduleDescription.trim().length > 0) {
    const sentences = moduleDescription.split(/[.;\n]+/).map((s) => s.trim()).filter(Boolean);

    for (const sentence of sentences) {
      // Check for noun-style action patterns (e.g. "Step-by-step implementation of ...")
      const nounActionMatch = sentence.match(/^(?:step-by-step\s+)?(implementation|building|creation|development|configuration)\s+of\s+(.+)/i);
      if (nounActionMatch) {
        const noun = nounActionMatch[1].toLowerCase();
        const target = nounActionMatch[2].trim();
        const verbMap: Record<string, string> = {
          implementation: 'Implement',
          building: 'Build',
          creation: 'Create',
          development: 'Develop',
          configuration: 'Configure',
        };
        const actionVerb = verbMap[noun] || 'Implement';
        const actionSkill = `${actionVerb} ${target}`;
        skillSet.add(actionSkill);
        outcomeSet.add(actionSkill);

        const coreConcept = cleanPedagogicalWrappers(target);
        if (coreConcept.length >= 3 && !isGenericNoise(coreConcept)) {
          supportingSet.add(capitalizePhrase(coreConcept));
        }
      }

      // Check for explicit outcome/skill verbs (e.g. "understanding", "solving", "building", "implementing")
      const outcomeMatch = sentence.match(/^(understanding|mastering|exploring|learning|solving|building|implementing|analyzing|calculating|deriving|configuring)\s+(.+)/i);
      if (outcomeMatch) {
        const verb = outcomeMatch[1];
        const target = outcomeMatch[2].trim();
        const normalizedOutcome = `${verb.charAt(0).toUpperCase() + verb.slice(1).toLowerCase()} ${target}`;
        outcomeSet.add(normalizedOutcome);

        // Derive practical skill if actionable
        if (/^(solving|building|implementing|calculating|deriving|configuring)/i.test(verb)) {
          skillSet.add(normalizedOutcome);
        }

        // Add the core concept of the outcome to supporting concepts
        const coreConcept = cleanPedagogicalWrappers(target);
        if (coreConcept.length >= 3 && !isGenericNoise(coreConcept)) {
          supportingSet.add(capitalizePhrase(coreConcept));
        }
      } else {
        // Look for comma-separated or key phrases
        const clauses = sentence.split(/,\s*/);
        for (const clause of clauses) {
          const cleanedClause = cleanPedagogicalWrappers(clause.trim());
          if (cleanedClause.length >= 4 && cleanedClause.length <= 40 && !isGenericNoise(cleanedClause)) {
            supportingSet.add(capitalizePhrase(cleanedClause));
          }
        }
      }
    }
  }

  // 4. Extract from lesson titles if provided
  if (lessonTitles && lessonTitles.length > 0) {
    for (const lesson of lessonTitles) {
      const cleanedLesson = cleanPedagogicalWrappers(lesson.trim());
      if (cleanedLesson.length >= 3 && !isGenericNoise(cleanedLesson)) {
        supportingSet.add(capitalizePhrase(cleanedLesson));
      }
    }
  }

  // 5. Handle Incomplete / Generic Module Title (e.g. "Introduction", "Overview")
  if (primarySet.size === 0) {
    if (courseTitle && courseTitle.trim().length > 0) {
      // Safe anchor from course title without hallucinating detailed syllabus
      const cleanedCourse = cleanPedagogicalWrappers(courseTitle.trim());
      primarySet.add(`${cleanedCourse} (Overview)`);
    } else {
      primarySet.add(moduleTitle.trim());
    }
  }

  // Primary concepts shouldn't be duplicated in supporting
  for (const p of primarySet) {
    supportingSet.delete(p);
  }

  const primaryConcepts = Array.from(primarySet);
  const supportingConcepts = Array.from(supportingSet).slice(0, 8); // Bound supporting concepts
  const explicitOutcomes = Array.from(outcomeSet).slice(0, 6);
  const expectedSkills = Array.from(skillSet).slice(0, 6);

  // Compute confidence based on signal richness
  const isGeneric = isGenericNoise(moduleTitle);
  const hasDesc = !!moduleDescription && moduleDescription.trim().length > 10;
  let confidence = 0.85;

  if (isGeneric && !hasDesc) {
    confidence = 0.4;
  } else if (isGeneric && hasDesc) {
    confidence = 0.7;
  } else if (!hasDesc) {
    confidence = 0.65;
  }

  return {
    primaryConcepts,
    supportingConcepts,
    explicitOutcomes,
    expectedSkills,
    confidence,
    extractedFrom: {
      rawTokens: moduleTitle.split(/\s+/),
      compoundPhrases: matchedCompounds,
    },
  };
}

function cleanPedagogicalWrappers(phrase: string): string {
  let cleaned = phrase.trim();
  for (const regex of META_WRAPPERS) {
    cleaned = cleaned.replace(regex, '').trim();
  }
  return cleaned;
}

function isGenericNoise(phrase: string): boolean {
  const lower = phrase.trim().toLowerCase();
  const genericTerms = [
    'introduction',
    'intro',
    'overview',
    'basics',
    'fundamentals',
    'conclusion',
    'summary',
    'next steps',
    'module',
    'lesson',
    'chapter',
    'part 1',
    'part 2',
    'week 1',
    'week 2',
  ];
  return genericTerms.includes(lower) || lower.length < 3;
}

function capitalizePhrase(str: string): string {
  if (!str) return '';
  return str
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
