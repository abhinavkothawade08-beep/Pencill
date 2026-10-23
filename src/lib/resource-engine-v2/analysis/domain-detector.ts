import { EducationalDomain, EvidenceStatus } from '../types';

export interface DomainDetectionResult {
  domain: EducationalDomain;
  provenance: EvidenceStatus;
  confidence: number;
  rationale: string;
  domainExclusions: string[];
}

interface DomainSignalDefinition {
  domain: EducationalDomain;
  keywords: string[];
  phrases: string[];
  examPatterns: RegExp[];
  antiKeywords?: string[];
  crossDomainCollisions?: {
    collidingTerm: string;
    matchPattern?: RegExp;
    exclusionTerms: string[];
  }[];
}

const DOMAIN_DEFINITIONS: DomainSignalDefinition[] = [
  {
    domain: 'mathematics',
    keywords: [
      'math', 'mathematics', 'calculus', 'algebra', 'matrix', 'matrices', 'determinant',
      'determinants', 'differential', 'derivative', 'integration', 'integral', 'trigonometry',
      'geometry', 'vector', 'vectors', 'eigenvalue', 'eigenvector', 'probability', 'statistics',
      'arithmetic', 'limits', 'continuity', 'theorem', 'differentiation', 'linear algebra',
    ],
    phrases: [
      'matrices and determinants',
      'differential calculus',
      'integral calculus',
      'linear algebra',
      'coordinate geometry',
      'discrete mathematics',
      'vector calculus',
      'complex numbers',
      'quadratic equations',
      'probability distribution',
    ],
    examPatterns: [
      /hsc.*math/i,
      /cbse.*math/i,
      /jee.*math/i,
      /class\s*1[12].*math/i,
    ],
    crossDomainCollisions: [
      {
        collidingTerm: 'matrix',
        matchPattern: /\bmatri(x|ces)\b/i,
        exclusionTerms: ['github actions', 'matrix build', 'devops', 'ci/cd', 'yaml workflow', 'travis'],
      },
    ],
  },
  {
    domain: 'data_science_ai',
    keywords: [
      'ai', 'artificial intelligence', 'machine learning', 'deep learning', 'neural network',
      'neural networks', 'transformer', 'transformers', 'llm', 'llms', 'peft', 'lora', 'qlora',
      'backpropagation', 'gradient descent', 'nlp', 'computer vision', 'pytorch', 'tensorflow',
      'huggingface', 'embedding', 'embeddings', 'fine-tuning', 'quantization', 'perceptron',
      'supervised learning', 'unsupervised learning', 'reinforcement learning',
    ],
    phrases: [
      'neural networks',
      'deep learning',
      'large language models',
      'parameter-efficient fine-tuning',
      'low-rank adaptation',
      'quantized lora',
      'gradient descent',
      'loss function',
      'activation function',
      'attention mechanism',
      'model evaluation',
      'precision and recall',
      'confusion matrix',
    ],
    examPatterns: [
      /gate.*data science/i,
      /gate.*ai/i,
    ],
    crossDomainCollisions: [
      {
        collidingTerm: 'network',
        matchPattern: /\bnetworks?\b/i,
        exclusionTerms: ['cisco', 'ccna', 'ccna 200-301', 'subnetting', 'osi layer', 'tcp/ip networking'],
      },
      {
        collidingTerm: 'training',
        matchPattern: /\b(train(ing)?|fine-?tuning|instruction-?tuning|weights?)\b/i,
        exclusionTerms: ['workout', 'gym', 'fitness', 'bodybuilding', 'weight lifting'],
      },
    ],
  },
  {
    domain: 'computer_science',
    keywords: [
      'programming', 'python', 'javascript', 'typescript', 'java', 'c++', 'rust', 'golang',
      'algorithm', 'algorithms', 'data structure', 'data structures', 'compiler', 'operating system',
      'database', 'sql', 'nosql', 'git', 'oop', 'concurrency', 'multithreading', 'rest api',
      'websocket', 'websockets', 'full stack', 'frontend', 'backend', 'web development',
      'consensus', 'raft', 'scheduling', 'cpu scheduling', 'process scheduling',
    ],
    phrases: [
      'python programming',
      'python beginner',
      'python projects',
      'distributed consensus',
      'raft consensus',
      'data structures and algorithms',
      'object oriented programming',
      'web development',
      'full stack web development',
      'software engineering',
      'relational database',
      'restful api',
      'full stack',
      'version control',
    ],
    examPatterns: [
      /gate.*cs/i,
      /gate.*computer science/i,
    ],
    crossDomainCollisions: [
      {
        collidingTerm: 'rust',
        exclusionTerms: ['corrosion', 'oxidation', 'iron rust', 'metallurgy'],
      },
    ],
  },
  {
    domain: 'physics',
    keywords: [
      'physics', 'mechanics', 'kinematics', 'fluid dynamics', 'thermodynamics', 'electromagnetism',
      'optics', 'quantum', 'relativity', 'torque', 'rotational motion', 'moment of inertia',
      'angular momentum', 'gravitation', 'oscillation', 'waves', 'electric field', 'magnetic field',
      'current electricity', 'semiconductor', 'voltage', 'resistance', 'circuits', 'circuit',
    ],
    phrases: [
      'rotational dynamics',
      'moment of inertia',
      'angular momentum',
      'laws of motion',
      'electromagnetic induction',
      'quantum mechanics',
      'wave optics',
      'kinetic theory',
      'circuit analysis',
    ],
    examPatterns: [
      /jee.*physics/i,
      /neet.*physics/i,
      /hsc.*physics/i,
      /cbse.*physics/i,
    ],
  },
  {
    domain: 'chemistry',
    keywords: [
      'chemistry', 'organic chemistry', 'inorganic chemistry', 'physical chemistry', 'reaction',
      'reactions', 'stoichiometry', 'haloalkanes', 'haloarenes', 'hydrocarbons', 'polymers',
      'electrochemistry', 'chemical kinetics', 'periodic table', 'thermodynamics', 'bonding',
      'acids', 'bases', 'equilibrium', 'coordination compounds',
    ],
    phrases: [
      'organic chemistry',
      'chemical bonding',
      'coordination compounds',
      'haloalkanes and haloarenes',
      'reaction mechanism',
      'chemical kinetics',
    ],
    examPatterns: [
      /jee.*chemistry/i,
      /neet.*chemistry/i,
      /hsc.*chemistry/i,
      /cbse.*chemistry/i,
    ],
  },
  {
    domain: 'biology',
    keywords: [
      'biology', 'genetics', 'cell biology', 'physiology', 'ecology', 'evolution', 'anatomy',
      'immunology', 'microbiology', 'biochemistry', 'dna', 'rna', 'mitosis', 'meiosis', 'botany',
      'zoology', 'photosynthesis', 'respiration', 'molecular biology',
    ],
    phrases: [
      'molecular biology',
      'cell division',
      'human physiology',
      'plant physiology',
      'principles of inheritance',
      'biotechnology principles',
    ],
    examPatterns: [
      /neet.*biology/i,
      /hsc.*biology/i,
      /cbse.*biology/i,
    ],
  },
  {
    domain: 'economics_commerce',
    keywords: [
      'economics', 'macroeconomics', 'microeconomics', 'monetary policy', 'fiscal policy',
      'inflation', 'central bank', 'central banking', 'repo rate', 'reverse repo', 'gdp',
      'banking', 'finance', 'accounting', 'balance of payments', 'aggregate demand', 'supply demand',
      'econometrics', 'taxation', 'interest rates',
    ],
    phrases: [
      'monetary policy',
      'central banking',
      'principles of macroeconomics',
      'inflation targeting',
      'fiscal policy',
      'money and banking',
      'aggregate demand and aggregate supply',
    ],
    examPatterns: [
      /upsc.*economics/i,
      /upsc.*economy/i,
      /rbi.*grade\s*b/i,
    ],
  },
  {
    domain: 'law',
    keywords: [
      'legal', 'jurisprudence', 'constitutional', 'constitution', 'criminal law', 'contracts',
      'torts', 'penal code', 'civil procedure', 'statute', 'litigation', 'human rights',
      'judiciary', 'statutory', 'legal reasoning', 'court', 'plaintiff',
    ],
    phrases: [
      'constitutional law',
      'law of contracts',
      'criminal procedure',
      'indian penal code',
      'legal jurisprudence',
    ],
    examPatterns: [
      /clat/i,
      /judiciary.*exam/i,
      /bar.*exam/i,
    ],
  },
  {
    domain: 'medical_health',
    keywords: [
      'medicine', 'pharmacology', 'pathology', 'clinical', 'pediatrics', 'surgery',
      'cardiology', 'neurology', 'diagnostics', 'epidemiology', 'medical', 'healthcare',
      'symptoms', 'pharmacokinetics', 'therapeutics',
    ],
    phrases: [
      'clinical pharmacology',
      'pathological basis',
      'internal medicine',
      'diagnostic criteria',
    ],
    examPatterns: [
      /usmle/i,
      /neet\s*pg/i,
      /plab/i,
    ],
  },
  {
    domain: 'humanities_social_sciences',
    keywords: [
      'history', 'sociology', 'political science', 'philosophy', 'geography', 'psychology',
      'anthropology', 'ethics', 'governance', 'international relations', 'ancient history',
      'modern history', 'polity',
    ],
    phrases: [
      'political science',
      'ancient indian history',
      'modern world history',
      'indian polity',
      'ethics and governance',
    ],
    examPatterns: [
      /upsc.*history/i,
      /upsc.*polity/i,
      /upsc.*sociology/i,
    ],
  },
];

/**
 * Detects educational domain deterministically from contextual signals.
 */
export function detectEducationalDomain(context: {
  subject?: string;
  domainHint?: string;
  courseTitle?: string;
  moduleTitle: string;
  moduleDescription?: string;
  targetExam?: string;
}): DomainDetectionResult {
  const { subject, domainHint, courseTitle, moduleTitle, moduleDescription, targetExam } = context;

  // 1. Direct explicit user-provided subject / domainHint match
  if (subject || domainHint) {
    const directTarget = `${subject || ''} ${domainHint || ''}`.trim().toLowerCase();
    for (const def of DOMAIN_DEFINITIONS) {
      if (
        directTarget === def.domain ||
        def.keywords.some((kw) => directTarget === kw) ||
        directTarget.includes(def.domain.replace('_', ' '))
      ) {
        // Collect cross-domain collisions
        const exclusions = getExclusionsForDomain(def, `${moduleTitle} ${moduleDescription || ''}`);
        return {
          domain: def.domain,
          provenance: 'user_provided',
          confidence: 0.95,
          rationale: `Direct match with user-provided subject/domain hint: "${subject || domainHint}"`,
          domainExclusions: exclusions,
        };
      }
    }
  }

  // 2. Exam Contextual Pattern Matching
  if (targetExam) {
    const fullExamContext = `${targetExam} ${subject || ''} ${courseTitle || ''} ${moduleTitle}`.toLowerCase();
    for (const def of DOMAIN_DEFINITIONS) {
      for (const pattern of def.examPatterns) {
        if (pattern.test(fullExamContext)) {
          const exclusions = getExclusionsForDomain(def, `${moduleTitle} ${moduleDescription || ''}`);
          return {
            domain: def.domain,
            provenance: 'inferred_high',
            confidence: 0.9,
            rationale: `Inferred domain from examination pattern match "${pattern.source}" in context`,
            domainExclusions: exclusions,
          };
        }
      }
    }
  }

  // 3. Multi-signal Text Analysis (Weighted scoring)
  const fullText = [
    courseTitle || '',
    moduleTitle,
    moduleDescription || '',
    subject || '',
  ].join(' ').toLowerCase();

  let highestScore = 0;
  let bestMatch: DomainSignalDefinition | null = null;
  const matchRationales: string[] = [];

  for (const def of DOMAIN_DEFINITIONS) {
    let score = 0;

    // Exact phrase matches (strongest signal)
    for (const phrase of def.phrases) {
      if (fullText.includes(phrase)) {
        score += 8;
        matchRationales.push(`Found key phrase "${phrase}"`);
      }
    }

    // Keyword matches
    for (const kw of def.keywords) {
      // Use regex boundary to avoid partial subword false matches
      const kwRegex = new RegExp(`\\b${escapeRegExp(kw)}\\b`, 'i');
      if (kwRegex.test(fullText)) {
        score += 3;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = def;
    }
  }

  // Require strong contextual evidence (phrase match or domain keywords)
  // to prevent jumping to conclusions based on zero domain signals.
  if (bestMatch && highestScore >= 6) {
    const exclusions = getExclusionsForDomain(bestMatch, fullText);
    const confidence = Math.min(0.95, 0.5 + highestScore * 0.05);
    return {
      domain: bestMatch.domain,
      provenance: 'inferred_high',
      confidence,
      rationale: `Inferred domain based on strong lexical density (score: ${highestScore}) for ${bestMatch.domain}`,
      domainExclusions: exclusions,
    };
  }

  if (bestMatch && highestScore >= 4) {
    const exclusions = getExclusionsForDomain(bestMatch, fullText);
    return {
      domain: bestMatch.domain,
      provenance: 'inferred_medium',
      confidence: 0.65,
      rationale: `Moderate lexical evidence with multiple keywords (score: ${highestScore}) for ${bestMatch.domain}`,
      domainExclusions: exclusions,
    };
  }

  // Fallback default when signals are ambiguous or insufficient (< 4 score)
  return {
    domain: 'general_academic',
    provenance: 'fallback_default',
    confidence: 0.35,
    rationale: 'Single or ambiguous keyword evidence without corroborating discipline context; defaulted to general academic to prevent cross-domain misclassification.',
    domainExclusions: [],
  };
}

function getExclusionsForDomain(def: DomainSignalDefinition, text: string): string[] {
  if (!def.crossDomainCollisions) return [];
  const textLower = text.toLowerCase();
  const exclusions: string[] = [];

  for (const collision of def.crossDomainCollisions) {
    const pattern = collision.matchPattern || new RegExp(`\\b${escapeRegExp(collision.collidingTerm)}\\b`, 'i');
    if (pattern.test(textLower)) {
      exclusions.push(...collision.exclusionTerms);
    }
  }

  return Array.from(new Set(exclusions));
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
