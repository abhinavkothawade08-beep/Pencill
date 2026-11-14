/**
 * Topic Consistency & Cross-Domain Isolation Validator
 * 
 * Enforces strict pedagogical and semantic consistency across all course components:
 * - Course Title & Description
 * - Module Titles & Module Objectives
 * - Video Lectures & Playlists
 * - Reading Materials & Study Monographs
 * - Checkpoint Quizzes
 * 
 * Prevents cross-course context leakage, state contamination, and false-positive verification.
 */

export type DomainArchetype =
  | 'COMMUNICATION_AND_HUMANITIES'
  | 'PHYSICS_AND_MECHANICS'
  | 'COMPUTER_SCIENCE'
  | 'AI_AND_DATA'
  | 'MATHEMATICS'
  | 'CHEMISTRY'
  | 'BIOLOGY_AND_MEDICINE'
  | 'BUSINESS_AND_ECONOMICS'
  | 'ENGINEERING_CIRCUITS'
  | 'GENERAL';

export interface ConsistencyEvaluation {
  isConsistent: boolean;
  relevanceScore: number; // 0 to 100
  archetypeMatch: boolean;
  detectedCollisions: string[];
  reason?: string;
}

/**
 * Domain Lexicon & Strong Concept Signatures
 */
const DOMAIN_SIGNATURES: Record<DomainArchetype, { keywords: string[]; forbiddenCrossConcepts: string[] }> = {
  COMMUNICATION_AND_HUMANITIES: {
    keywords: [
      'public speaking', 'presentation', 'speech', 'rhetoric', 'audience', 'vocal', 'pacing',
      'body language', 'storytelling', 'persuasion', 'articulation', 'stage presence', 'toastmasters',
      'impromptu', 'debate', 'communication', 'oratory', 'monologue', 'discourse', 'elocution',
      'keynote', 'pitch', 'slide deck', 'verbal', 'non-verbal', 'rhetorical', 'active listening',
      'breathing', 'pause', 'hook', 'demographics', 'gestures', 'posture', 'delivery', 'voice', 'cadence',
      'slide', 'slides', 'slide design', 'visual aids',
    ],
    forbiddenCrossConcepts: [
      'rotational dynamics', 'torque', 'moment of inertia', 'free-body diagram', 'free body diagram',
      'inclined plane', 'rolling motion', 'angular momentum', 'kinematics', 'projectile motion',
      'friction coefficient', "newton's laws", 'centripetal', 'center of mass', 'harmonic oscillation',
      'gravitation', 'kepler', 'op-amp', 'transistor', 'kirchhoff', 'bjt', 'mosfet', 'haloalkane',
      'haloarene', 'electrophilic', 'sn1', 'sn2', 'linear regression', 'binary search', 'gradient descent',
      'vector space', 'differential equation', 'laplace transform', 'eigenvalue', 'eigenvector',
      'units, dimensions', 'measurement errors', 'dimensional analysis', 'error analysis', 'circular dynamics',
      'work, energy, power', 'work-energy', 'system of particles',
    ],
  },
  PHYSICS_AND_MECHANICS: {
    keywords: [
      'physics', 'mechanics', 'kinematics', 'dynamics', 'rotational', 'torque', 'moment of inertia',
      'angular momentum', 'equilibrium', 'free-body diagram', 'free body', 'inclined plane', 'friction',
      'newton', 'work energy', 'conservation of energy', 'rolling without slipping', 'center of mass',
      'gravitation', 'oscillation', 'shm', 'projectile', 'vectors and kinematics', 'thermodynamics',
      'optics', 'electromagnetism', 'quantum physics', 'quantum mechanics', 'quantum', 'relativity',
      'wave-particle', 'schrodinger', 'schrödinger', 'wave mechanics', 'harmonic oscillator',
      'perturbation', 'hilbert space', 'spin', 'uncertainty principle',
    ],
    forbiddenCrossConcepts: [
      'public speaking', 'speech delivery', 'audience engagement', 'stage fright', 'vocal variety',
      'impromptu speaking', 'oratory', 'slide deck design', 'financial reporting', 'ind as 109',
      'ecl model', 'react components', 'useeffect', 'jsx', 'django', 'css flexbox',
    ],
  },
  COMPUTER_SCIENCE: {
    keywords: [
      'python', 'javascript', 'typescript', 'react', 'next.js', 'programming', 'code', 'software',
      'algorithm', 'data structure', 'binary search', 'sorting', 'git', 'docker', 'database', 'sql',
      'operating system', 'network', 'concurrency', 'oop', 'recursion', 'api', 'backend', 'frontend',
      'variable', 'variables', 'data type', 'data types', 'operator', 'operators', 'loop', 'loops',
      'conditional', 'function', 'functions', 'syntax', 'array', 'object', 'class', 'methods',
      'control flow', 'expression', 'boolean', 'integer', 'string',
    ],
    forbiddenCrossConcepts: [
      'torque', 'moment of inertia', 'rotational dynamics', 'free-body diagram', 'inclined plane',
      'angular momentum', 'public speaking', 'stage presence', 'vocal pacing', 'oratory',
      'haloalkane', 'sn1 sn2', 'ind as 109', 'expected credit loss',
    ],
  },
  AI_AND_DATA: {
    keywords: [
      'machine learning', 'deep learning', 'artificial intelligence', 'neural network', 'transformer',
      'llm', 'large language model', 'rag', 'retrieval augmented', 'vector search', 'embeddings',
      'gradient descent', 'fine-tuning', 'fine tuning', 'nlp', 'computer vision', 'generative ai',
    ],
    forbiddenCrossConcepts: [
      'rotational dynamics', 'torque', 'moment of inertia', 'free-body diagram', 'inclined plane',
      'rolling motion', 'public speaking', 'vocal variety', 'toastmasters', 'haloalkane',
      'ind as 109', 'ind as 115', 'auditing standards',
    ],
  },
  MATHEMATICS: {
    keywords: [
      'calculus', 'linear algebra', 'differential equation', 'derivative', 'integral', 'matrix',
      'eigenvalue', 'vector space', 'real analysis', 'complex analysis', 'probability', 'statistics',
      'geometry', 'trigonometry', 'laplace transform', 'fourier', 'topology', 'discrete math',
    ],
    forbiddenCrossConcepts: [
      'public speaking', 'stage presence', 'toastmasters', 'vocal delivery', 'slide deck',
      'ind as 109', 'expected credit loss', 'react props', 'useeffect hook',
    ],
  },
  CHEMISTRY: {
    keywords: [
      'chemistry', 'organic chemistry', 'inorganic', 'haloalkane', 'haloarene', 'reaction mechanism',
      'electrophilic', 'nucleophilic', 'sn1', 'sn2', 'orbital', 'chemical bonding', 'thermodynamic cycle',
      'equilibrium constant', 'titration', 'isomerism', 'polymers', 'coordination compound',
    ],
    forbiddenCrossConcepts: [
      'rotational dynamics', 'moment of inertia', 'public speaking', 'vocal variety', 'toastmasters',
      'binary search', 'react hooks', 'ind as 109', 'docker compose',
    ],
  },
  BIOLOGY_AND_MEDICINE: {
    keywords: [
      'biology', 'genetics', 'dna', 'cell', 'anatomy', 'physiology', 'zoology', 'botany', 'neet',
      'evolution', 'ecology', 'immunology', 'pathology', 'biochemistry', 'microbiology',
    ],
    forbiddenCrossConcepts: [
      'torque', 'moment of inertia', 'rotational dynamics', 'public speaking', 'toastmasters',
      'git rebase', 'react hooks', 'ind as 109',
    ],
  },
  BUSINESS_AND_ECONOMICS: {
    keywords: [
      'finance', 'accounting', 'economics', 'financial reporting', 'ca final', 'ind as', 'ecl',
      'balance sheet', 'macroeconomics', 'microeconomics', 'investment', 'corporate finance',
      'auditing', 'cost accounting', 'taxation', 'valuation', 'marketing', 'strategic management',
    ],
    forbiddenCrossConcepts: [
      'rotational dynamics', 'torque', 'moment of inertia', 'free-body diagram', 'inclined plane',
      'rolling motion', 'angular momentum', 'sn1 sn2', 'haloalkane', 'react hooks',
    ],
  },
  ENGINEERING_CIRCUITS: {
    keywords: [
      'circuit', 'analog circuit', 'electronics', 'op-amp', 'transistor', 'bjt', 'mosfet', 'diode',
      'kirchhoff', 'thevenin', 'norton', 'signal processing', 'filters', 'oscillators', 'vlsi',
    ],
    forbiddenCrossConcepts: [
      'public speaking', 'vocal delivery', 'toastmasters', 'ind as 109', 'ecl model',
      'haloalkane', 'sn1 sn2', 'cell biology',
    ],
  },
  GENERAL: {
    keywords: [],
    forbiddenCrossConcepts: [],
  },
};

/**
 * Detects domain archetype from topic string.
 */
export function detectTopicDomainArchetype(topic: string): DomainArchetype {
  const t = topic.toLowerCase().trim();

  if (
    /public speaking|presentation|speech|rhetoric|debate|communication|oratory|storytelling|toastmaster|vocal|elocution|pitching/i.test(t)
  ) {
    return 'COMMUNICATION_AND_HUMANITIES';
  }

  if (
    /mechanic|rotational|torque|physics|kinematic|dynamics|momentum|equilibrium|gravitation|newton|projectile/i.test(t) &&
    !/quantum computing/i.test(t)
  ) {
    return 'PHYSICS_AND_MECHANICS';
  }

  if (
    /python|javascript|typescript|react|code|programming|algorithm|data structure|git|docker|sql|linux|operating system|web dev/i.test(t) &&
    !/machine learning|deep learning|llm|rag/i.test(t)
  ) {
    return 'COMPUTER_SCIENCE';
  }

  if (
    /machine learning|deep learning|neural|llm|large language|rag|retrieval|ai|artificial intelligence|transformer|vision|nlp/i.test(t)
  ) {
    return 'AI_AND_DATA';
  }

  if (
    /calculus|linear algebra|differential equation|real analysis|probability|statistics|geometry|algebra|math/i.test(t)
  ) {
    return 'MATHEMATICS';
  }

  if (/chemistry|organic|inorganic|haloalkane|haloarene|reaction|molecule|orbital/i.test(t)) {
    return 'CHEMISTRY';
  }

  if (/biology|genetics|cell|anatomy|physiology|neet|zoology|botany/i.test(t)) {
    return 'BIOLOGY_AND_MEDICINE';
  }

  if (/finance|accounting|economics|financial reporting|ca final|ind as|business|investment/i.test(t)) {
    return 'BUSINESS_AND_ECONOMICS';
  }

  if (/circuit|analog|op-amp|transistor|bjt|mosfet|electronics/i.test(t)) {
    return 'ENGINEERING_CIRCUITS';
  }

  return 'GENERAL';
}

/**
 * Strips non-alphanumeric characters, tokenizes, and removes common educational stop words.
 */
export function extractSignificantTokens(text: string): string[] {
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from',
    'of', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'can', 'could', 'may',
    'might', 'must', 'about', 'into', 'through', 'during', 'before', 'after', 'above',
    'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there',
    'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most',
    'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
    'too', 'very', 's', 't', 'just', 'don', 'now',
    // Generic educational words that don't indicate topical specificity
    'introduction', 'intro', 'basics', 'fundamentals', 'principles', 'concepts',
    'mastery', 'guide', 'tutorial', 'lecture', 'course', 'overview', 'complete',
    'comprehensive', 'chapter', 'unit', 'module', 'lesson', 'explained', 'notes',
    'study', 'practice', 'problem', 'solving', 'applied', 'advanced', 'part', 'step',
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 3 && !stopWords.has(w));
}

/**
 * Evaluates semantic consistency between an item (title, description, or objective)
 * and the target course topic.
 */
export function evaluateTopicConsistency(
  itemText: string,
  targetTopic: string,
  targetDomainArchetype?: DomainArchetype
): ConsistencyEvaluation {
  if (!itemText || !itemText.trim() || !targetTopic || !targetTopic.trim()) {
    return {
      isConsistent: false,
      relevanceScore: 0,
      archetypeMatch: false,
      detectedCollisions: ['Empty item or target topic'],
      reason: 'Empty item or target topic provided',
    };
  }

  const itemLower = itemText.toLowerCase();
  const topicLower = targetTopic.toLowerCase();
  const archetype = targetDomainArchetype || detectTopicDomainArchetype(targetTopic);
  const detectedCollisions: string[] = [];

  // 1. Cross-Domain Forbidden Concept Collision Gate
  const signature = DOMAIN_SIGNATURES[archetype];
  if (signature && signature.forbiddenCrossConcepts.length > 0) {
    for (const forbidden of signature.forbiddenCrossConcepts) {
      if (itemLower.includes(forbidden)) {
        detectedCollisions.push(forbidden);
      }
    }
  }

  if (detectedCollisions.length > 0) {
    return {
      isConsistent: false,
      relevanceScore: 0,
      archetypeMatch: false,
      detectedCollisions,
      reason: `Hard cross-domain collision: item contains forbidden concepts for ${archetype}: ${detectedCollisions.join(', ')}`,
    };
  }

  // 2. Direct Subject Match
  if (itemLower.includes(topicLower)) {
    return {
      isConsistent: true,
      relevanceScore: 95,
      archetypeMatch: true,
      detectedCollisions: [],
    };
  }

  // 3. Significant Token Overlap
  const targetTokens = extractSignificantTokens(targetTopic);
  const itemTokens = extractSignificantTokens(itemText);

  let tokenMatches = 0;
  for (const t of targetTokens) {
    if (itemTokens.includes(t)) {
      tokenMatches++;
    }
  }

  // 4. Domain Archetype Vocabulary Overlap
  let archetypeMatches = 0;
  if (signature && signature.keywords.length > 0) {
    for (const kw of signature.keywords) {
      if (itemLower.includes(kw)) {
        archetypeMatches++;
      }
    }
  }

  const tokenRatio = targetTokens.length > 0 ? tokenMatches / targetTokens.length : 0;
  let relevanceScore = 0;

  if (tokenRatio >= 0.5) {
    relevanceScore = 70 + Math.round(tokenRatio * 30);
  } else if (tokenMatches > 0) {
    relevanceScore = 50 + tokenMatches * 10 + archetypeMatches * 5;
  } else if (archetypeMatches >= 2) {
    relevanceScore = 55 + Math.min(30, archetypeMatches * 10);
  } else if (archetypeMatches === 1) {
    relevanceScore = 45;
  } else {
    relevanceScore = 10;
  }

  relevanceScore = Math.min(100, Math.max(0, relevanceScore));

  // Consistent if score is at least 40 and archetype aligns or tokens match
  const isConsistent = relevanceScore >= 40 || (tokenMatches > 0 && archetypeMatches > 0);

  return {
    isConsistent,
    relevanceScore,
    archetypeMatch: archetypeMatches > 0,
    detectedCollisions: [],
    reason: isConsistent
      ? undefined
      : `Insufficient semantic relevance (${relevanceScore}/100) to target topic "${targetTopic}"`,
  };
}

/**
 * Filters a list of user-provided learning objectives, dropping any that have
 * cross-domain collisions or are semantically disjoint from the course topic.
 */
export function sanitizeInputObjectives<T extends { text: string } | string>(
  objectives: T[] | undefined | null,
  targetTopic: string
): T[] {
  if (!objectives || objectives.length === 0) return [];
  const archetype = detectTopicDomainArchetype(targetTopic);

  return objectives.filter((obj) => {
    const text = typeof obj === 'string' ? obj : obj.text;
    const evalResult = evaluateTopicConsistency(text, targetTopic, archetype);
    return evalResult.detectedCollisions.length === 0;
  });
}

/**
 * Filters a list of subtopics, dropping any that conflict with the course topic.
 */
export function sanitizeInputSubtopics(
  subtopics: string[] | undefined | null,
  targetTopic: string
): string[] {
  if (!subtopics || subtopics.length === 0) return [];
  const archetype = detectTopicDomainArchetype(targetTopic);

  return subtopics.filter((sub) => {
    const evalResult = evaluateTopicConsistency(sub, targetTopic, archetype);
    return evalResult.detectedCollisions.length === 0;
  });
}

/**
 * Filters a list of user prerequisites, dropping only those that exhibit
 * hard cross-domain collisions (e.g. physics concepts in a speech course).
 * Allows foundational math, notation, or adjacent foundational tools to pass.
 */
export function sanitizeInputPrerequisites(
  prerequisites: string[] | undefined | null,
  targetTopic: string
): string[] {
  if (!prerequisites || prerequisites.length === 0) return [];
  const archetype = detectTopicDomainArchetype(targetTopic);
  const signature = DOMAIN_SIGNATURES[archetype];

  return prerequisites.filter((prereq) => {
    if (!prereq || !prereq.trim()) return false;
    const prereqLower = prereq.toLowerCase();

    if (signature && signature.forbiddenCrossConcepts.length > 0) {
      for (const forbidden of signature.forbiddenCrossConcepts) {
        if (prereqLower.includes(forbidden)) {
          return false;
        }
      }
    }
    return true;
  });
}

/**
 * Validates module title and objectives for strict topic consistency.
 */
export function validateModuleTopicConsistency(
  moduleTitle: string,
  objectives: string[],
  targetTopic: string
): { isValid: boolean; reason?: string } {
  const archetype = detectTopicDomainArchetype(targetTopic);

  const titleEval = evaluateTopicConsistency(moduleTitle, targetTopic, archetype);
  if (!titleEval.isConsistent) {
    return {
      isValid: false,
      reason: `Module title "${moduleTitle}" failed topic consistency validation: ${titleEval.reason}`,
    };
  }

  for (const obj of objectives) {
    const objEval = evaluateTopicConsistency(obj, targetTopic, archetype);
    if (!objEval.isConsistent && objEval.detectedCollisions.length > 0) {
      return {
        isValid: false,
        reason: `Module objective contains cross-domain collision: ${objEval.reason}`,
      };
    }
  }

  return { isValid: true };
}

/**
 * Audits a complete course structure for topic mismatches or cross-course leaks.
 */
export function auditCourseTopicConsistency(course: {
  title: string;
  topic?: string;
  modules?: Array<{
    id?: string;
    title: string;
    lessons?: Array<{ id?: string; title: string; sourceUrl?: string; sourceName?: string }>;
    primaryPlaylist?: { title?: string; playlistUrl?: string };
  }>;
}): {
  isConsistent: boolean;
  targetTopic: string;
  mismatchedModules: Array<{ moduleIndex: number; title: string; reason: string }>;
  mismatchedLessons: Array<{ moduleId?: string; lessonId?: string; title: string; reason: string }>;
  mismatchedPlaylists: Array<{ moduleIndex: number; playlistTitle?: string; reason: string }>;
} {
  const targetTopic = course.topic || course.title;
  const archetype = detectTopicDomainArchetype(targetTopic);

  const mismatchedModules: Array<{ moduleIndex: number; title: string; reason: string }> = [];
  const mismatchedLessons: Array<{ moduleId?: string; lessonId?: string; title: string; reason: string }> = [];
  const mismatchedPlaylists: Array<{ moduleIndex: number; playlistTitle?: string; reason: string }> = [];

  const modules = course.modules || [];

  modules.forEach((mod, mIdx) => {
    const modEval = evaluateTopicConsistency(mod.title, targetTopic, archetype);
    if (!modEval.isConsistent) {
      mismatchedModules.push({
        moduleIndex: mIdx,
        title: mod.title,
        reason: modEval.reason || 'Module title irrelevant to course topic',
      });
    }

    if (mod.primaryPlaylist && mod.primaryPlaylist.title) {
      const plEval = evaluateTopicConsistency(mod.primaryPlaylist.title, targetTopic, archetype);
      if (!plEval.isConsistent) {
        mismatchedPlaylists.push({
          moduleIndex: mIdx,
          playlistTitle: mod.primaryPlaylist.title,
          reason: plEval.reason || 'Playlist title irrelevant to course topic',
        });
      }
    }

    for (const lesson of mod.lessons || []) {
      const lessonEval = evaluateTopicConsistency(lesson.title, targetTopic, archetype);
      if (!lessonEval.isConsistent && lessonEval.detectedCollisions.length > 0) {
        mismatchedLessons.push({
          moduleId: mod.id,
          lessonId: lesson.id,
          title: lesson.title,
          reason: lessonEval.reason || 'Lesson title contains cross-domain collision',
        });
      }
    }
  });

  const isConsistent =
    mismatchedModules.length === 0 &&
    mismatchedLessons.length === 0 &&
    mismatchedPlaylists.length === 0;

  return {
    isConsistent,
    targetTopic,
    mismatchedModules,
    mismatchedLessons,
    mismatchedPlaylists,
  };
}
