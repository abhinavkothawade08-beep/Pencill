import {
  AnalyzedObjective,
  NormalizedResourceCandidate,
  SearchQueryItem,
  RelevanceEvaluation,
  RelevanceScoreBreakdown,
  EducationalDomain,
} from '../types';

interface CollisionRule {
  name: string;
  condition: (obj: AnalyzedObjective, text: string) => boolean;
  collisionPatterns: RegExp[];
  penalty: number;
  reason: string;
}

const COLLISION_RULES: CollisionRule[] = [
  {
    name: 'math_matrix_vs_cicd',
    condition: (obj) =>
      obj.domain === 'mathematics' ||
      obj.primaryConcepts.some((c) => /\bmatri(x|ces)\b/i.test(c)),
    collisionPatterns: [
      /\bgithub\s*actions\b/i,
      /\bmatrix\s*build(s)?\b/i,
      /\bci\s*\/\s*cd\b/i,
      /\byaml\s*workflow\b/i,
      /\bdevops\b/i,
      /\btravis\s*ci\b/i,
      /\bdocker\s*container\b/i,
    ],
    penalty: 85,
    reason: 'Cross-domain collision: CI/CD / DevOps "matrix build" collides with mathematical matrix concepts',
  },
  {
    name: 'ai_neural_network_vs_cisco',
    condition: (obj) =>
      obj.domain === 'data_science_ai' ||
      obj.primaryConcepts.some((c) => /\bneural\s*network(s)?\b/i.test(c) || /\bdeep\s*learning\b/i.test(c)),
    collisionPatterns: [
      /\bcisco\b/i,
      /\bccna\b/i,
      /\b200-301\b/i,
      /\bsubnetting\b/i,
      /\bosi\s*layer(s)?\b/i,
      /\brouter\s*and\s*switch\b/i,
      /\bpacket\s*tracer\b/i,
      /\brouting\s*protocol(s)?\b/i,
      /\btcp\s*\/\s*ip\s*networking\b/i,
    ],
    penalty: 85,
    reason: 'Cross-domain collision: Computer networking / Cisco CCNA "network" collides with deep learning neural networks',
  },
  {
    name: 'lora_peft_vs_fitness',
    condition: (obj) =>
      obj.primaryConcepts.some((c) => /\b(lora|qlora|peft)\b/i.test(c)),
    collisionPatterns: [
      /\bworkout\b/i,
      /\bgym\b/i,
      /\bfitness\b/i,
      /\bbodybuilding\b/i,
      /\bmuscle\s*building\b/i,
      /\bbicep(s)?\b/i,
      /\bweight\s*loss\b/i,
    ],
    penalty: 90,
    reason: 'Cross-domain collision: Fitness / gym workout "training" collides with machine learning fine-tuning (LoRA/QLoRA)',
  },
  {
    name: 'lora_ai_vs_telecom',
    condition: (obj) =>
      obj.domain === 'data_science_ai' &&
      obj.primaryConcepts.some((c) => /\b(lora|qlora|peft)\b/i.test(c)),
    collisionPatterns: [
      /\blorawan\b/i,
      /\bsemtech\b/i,
      /\blong\s*range\s*radio\b/i,
      /\b868\s*mhz\b/i,
      /\b915\s*mhz\b/i,
      /\brf\s*module\b/i,
      /\biot\s*antenna\b/i,
    ],
    penalty: 85,
    reason: 'Cross-domain collision: Long Range radio (LoRa/LoRaWAN) telecom collides with AI Low-Rank Adaptation (LoRA)',
  },
  {
    name: 'macroeconomics_vs_software_banking',
    condition: (obj) =>
      obj.domain === 'economics_commerce' ||
      obj.primaryConcepts.some((c) => /\b(monetary\s*policy|central\s*bank(ing)?|repo\s*rate|macroeconomics)\b/i.test(c)),
    collisionPatterns: [
      /\bspring\s*boot\b/i,
      /\bjava\s*banking\b/i,
      /\bbuild\s*a\s*banking\s*app\b/i,
      /\bcrud\s*application\b/i,
      /\bweb\s*development\b/i,
      /\brest\s*api\b/i,
      /\bfrontend\s*and\s*backend\b/i,
    ],
    penalty: 85,
    reason: 'Cross-domain collision: Banking software / app development collides with macroeconomic monetary policy',
  },
  {
    name: 'physics_laws_vs_jurisprudence',
    condition: (obj) =>
      obj.domain === 'physics' &&
      obj.primaryConcepts.some((c) => /\blaw(s)?\b/i.test(c)),
    collisionPatterns: [
      /\bjurisprudence\b/i,
      /\bconstitutional\s*law\b/i,
      /\bsupreme\s*court\b/i,
      /\bstatutory\s*interpretation\b/i,
      /\bcriminal\s*law\b/i,
      /\bpenal\s*code\b/i,
      /\bplaintiff\b/i,
    ],
    penalty: 85,
    reason: 'Cross-domain collision: Legal jurisprudence collides with physical scientific laws of motion/electromagnetism',
  },
  {
    name: 'programming_loop_vs_telecom_control_theory',
    condition: (obj) =>
      obj.domain === 'computer_science' &&
      obj.primaryConcepts.some((c) => /\b(loops?|while\s*loop|for\s*loop|iteration|iterator)\b/i.test(c)),
    collisionPatterns: [
      /\bsatellite\s*network\b/i,
      /\bcontrol\s*loop(s)?\b/i,
      /\bphase-locked\s*loop\b/i,
      /\bclosed-loop\b/i,
      /\bopen-loop\b/i,
      /\bdual-loop\b/i,
      /\bquantum\s*state(s)?\b/i,
      /\bdna\s*loop(ing)?\b/i,
      /\btimoshenko\s*beam\b/i,
      /\bspacecraft\b/i,
      /\brouting\s*in\s*leo\b/i,
    ],
    penalty: 85,
    reason: 'Cross-domain collision: Control theory / telecom / satellite / quantum "loop" collides with programming loops',
  },
  {
    name: 'rust_lang_vs_metallurgy',
    condition: (obj) =>
      obj.domain === 'computer_science' &&
      obj.primaryConcepts.some((c) => /\brust\b/i.test(c)),
    collisionPatterns: [
      /\bcorrosion\b/i,
      /\boxidation\b/i,
      /\biron\s*rust\b/i,
      /\brust\s*removal\b/i,
      /\bmetal\s*treatment\b/i,
      /\bmetallurgy\b/i,
    ],
    penalty: 85,
    reason: 'Cross-domain collision: Metal oxidation / corrosion collides with Rust programming language',
  },
  {
    name: 'beginner_python_vs_advanced_ml',
    condition: (obj) =>
      obj.domain === 'computer_science' &&
      (obj.academicLevel === 'beginner' || obj.academicLevel === 'elementary' || /\bfundamentals?\b/i.test(obj.rawTitle)) &&
      obj.primaryConcepts.some((c) => /\b(python|variables?|loops?|data\s*types?)\b/i.test(c)),
    collisionPatterns: [
      /\bdeep\s*learning\s*with\s*pytorch\b/i,
      /\btransformers?\s*from\s*scratch\b/i,
      /\bbuilding\s*llms?\b/i,
      /\badvanced\s*machine\s*learning\b/i,
      /\bconvolutional\s*neural\s*networks?\b/i,
    ],
    penalty: 55,
    reason: 'Curricular level mismatch: Advanced machine learning/deep learning resource does not teach beginner Python fundamentals',
  },
  {
    name: 'math_differentiation_vs_marketing',
    condition: (obj) =>
      obj.domain === 'mathematics' ||
      obj.primaryConcepts.some((c) => /\b(differentiat(e|ion)|derivative(s)?|calculus)\b/i.test(c)),
    collisionPatterns: [
      /\bproduct\s*differentiation\b/i,
      /\bbrand\s*differentiation\b/i,
      /\bmarketing\s*strategy\b/i,
      /\bmarket\s*positioning\b/i,
      /\bcompetitive\s*advantage\b/i,
    ],
    penalty: 85,
    reason: 'Cross-domain collision: Product/brand marketing differentiation collides with calculus differentiation',
  },
  {
    name: 'os_scheduling_vs_project_management',
    condition: (obj) =>
      obj.domain === 'computer_science' &&
      obj.primaryConcepts.some((c) => /\b(process\s*schedul|cpu\s*schedul|operating\s*system)\b/i.test(c)),
    collisionPatterns: [
      /\bagile\s*sprint\b/i,
      /\bscrum\s*master\b/i,
      /\bjira\b/i,
      /\bproject\s*management\b/i,
      /\bgantt\s*chart\b/i,
      /\bcalendar\s*scheduling\b/i,
    ],
    penalty: 85,
    reason: 'Cross-domain collision: Agile / project management scheduling collides with operating system CPU process scheduling',
  },
  {
    name: 'ml_model_evaluation_vs_hr',
    condition: (obj) =>
      (obj.domain === 'data_science_ai' || obj.domain === 'computer_science') &&
      obj.primaryConcepts.some((c) => /\b(model\s*evaluat|precision|recall|roc|confusion\s*matrix)\b/i.test(c)),
    collisionPatterns: [
      /\bemployee\s*performance\b/i,
      /\bannual\s*performance\s*review\b/i,
      /\bhr\s*evaluation\b/i,
      /\bhuman\s*resources\b/i,
      /\b360\s*degree\s*feedback\b/i,
    ],
    penalty: 85,
    reason: 'Cross-domain collision: HR / employee performance evaluation collides with machine learning model evaluation metrics',
  },
  {
    name: 'sql_beginner_vs_advanced_internals',
    condition: (obj) =>
      obj.domain === 'computer_science' &&
      (obj.academicLevel === 'beginner' || obj.academicLevel === 'foundation') &&
      obj.primaryConcepts.some((c) => /\b(sql|query|queries|select|join)\b/i.test(c)),
    collisionPatterns: [
      /\bwal\s*architecture\b/i,
      /\bwrite\s*ahead\s*log\b/i,
      /\bmvcc\s*internals\b/i,
      /\bb-?tree\s*storage\s*engine\b/i,
      /\bkernel\s*bypass\b/i,
    ],
    penalty: 60,
    reason: 'Curricular level mismatch: Advanced database engine internals inappropriate for beginner SQL querying',
  },
  {
    name: 'neural_net_ai_vs_biology',
    condition: (obj) =>
      obj.domain === 'data_science_ai' &&
      obj.primaryConcepts.some((c) => /\b(neural\s*network(s)?|perceptron|backprop(agation)?)\b/i.test(c)),
    collisionPatterns: [
      /\bneuroscience\b/i,
      /\bbrain\s*anatomy\b/i,
      /\baxon(s)?\s*and\s*dendrite(s)?\b/i,
      /\bsynapse\s*transmission\b/i,
      /\baction\s*potential\b/i,
    ],
    penalty: 80,
    reason: 'Cross-domain collision: Biological neuroscience neural pathways collide with artificial neural networks',
  },
];

const DOMAIN_POSITIVE_VOCABULARY: Record<EducationalDomain, string[]> = {
  mathematics: [
    'math', 'mathematics', 'calculus', 'algebra', 'linear algebra', 'matrix', 'matrices',
    'determinant', 'differential', 'integral', 'derivative', 'eigenvalue', 'vector', 'geometry',
  ],
  data_science_ai: [
    'machine learning', 'deep learning', 'neural network', 'artificial intelligence', 'transformer',
    'pytorch', 'tensorflow', 'model', 'weights', 'loss function', 'gradient descent', 'lora', 'peft',
  ],
  computer_science: [
    'programming', 'algorithm', 'data structure', 'code', 'function', 'syntax', 'debugging',
    'software', 'object oriented', 'runtime', 'complexity', 'developer',
  ],
  physics: [
    'physics', 'mechanics', 'force', 'energy', 'momentum', 'velocity', 'acceleration', 'quantum',
    'thermodynamics', 'optics', 'electromagnetism', 'motion', 'torque', 'inertia',
  ],
  chemistry: [
    'chemistry', 'molecule', 'reaction', 'atom', 'acid', 'base', 'organic chemistry', 'stoichiometry',
    'periodic table', 'bonding', 'solution', 'equilibrium',
  ],
  biology: [
    'biology', 'cell', 'dna', 'rna', 'gene', 'genetics', 'organism', 'physiology', 'protein',
    'enzyme', 'evolution', 'ecology',
  ],
  economics_commerce: [
    'economics', 'economy', 'macroeconomics', 'microeconomics', 'monetary', 'fiscal', 'central bank',
    'inflation', 'gdp', 'interest rate', 'finance', 'market',
  ],
  law: [
    'law', 'legal', 'statute', 'constitution', 'court', 'case law', 'jurisdiction', 'liability',
  ],
  medical_health: [
    'medicine', 'clinical', 'patient', 'disease', 'diagnosis', 'treatment', 'pathology', 'pharmacology',
  ],
  engineering: [
    'engineering', 'circuits', 'mechanical', 'electrical', 'structural', 'thermodynamics',
    'signals', 'systems', 'design', 'control systems', 'cad', 'robotics',
  ],
  humanities_social_sciences: [
    'history', 'sociology', 'philosophy', 'political', 'culture', 'literature', 'society',
  ],
  languages_linguistics: [
    'grammar', 'vocabulary', 'pronunciation', 'linguistics', 'syntax', 'phonetics', 'language learning',
  ],
  vocational_applied_skills: [
    'hands-on', 'technician', 'wiring', 'carpentry', 'plumbing', 'craft', 'practical skill',
  ],
  general_academic: [
    'academic', 'lecture', 'course', 'study', 'research', 'education', 'exam',
  ],
};

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function stemWord(word: string): string {
  const w = word.toLowerCase().trim();
  if (w.length <= 3) return w;

  // Specific irregular educational/mathematical forms
  if (w === 'matrices' || w === 'matrix') return 'matrix';
  if (w === 'vertices' || w === 'vertex') return 'vertex';
  if (w === 'indices' || w === 'index') return 'index';
  if (w === 'differentiation' || w === 'derivatives' || w === 'derivative') return 'deriv';
  if (w === 'multiplication' || w === 'multiplying' || w === 'multiply') return 'multipli';
  if (w === 'integration' || w === 'integrals' || w === 'integral') return 'integr';
  if (w === 'solution' || w === 'solutions' || w === 'solving' || w === 'solve') return 'solv';
  if (w === 'programming' || w === 'programs' || w === 'program') return 'program';
  if (w === 'implementation' || w === 'implementing' || w === 'implement') return 'implement';

  // Suffix patterns
  if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y';
  if (w.endsWith('ing') && w.length > 5) return w.slice(0, -3);
  if (w.endsWith('tions') && w.length > 6) return w.slice(0, -5);
  if (w.endsWith('tion') && w.length > 5) return w.slice(0, -4);
  if (w.endsWith('sses')) return w.slice(0, -2);
  if (w.endsWith('ses') && w.length > 4) return w.slice(0, -2);
  if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) return w.slice(0, -1);
  return w;
}

export function tokenizeAndStem(text: string): string[] {
  return normalizeText(text)
    .split(' ')
    .filter((w) => w.length > 2)
    .map(stemWord);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export class ExplainableRelevanceScorer {
  /**
   * Deterministically scores a NormalizedResourceCandidate against an AnalyzedObjective.
   * Produces an explainable breakdown and enforces cross-domain collision gating.
   */
  score(
    objective: AnalyzedObjective,
    candidate: NormalizedResourceCandidate,
    query?: SearchQueryItem
  ): RelevanceEvaluation {
    const titleNorm = normalizeText(candidate.title);
    const descNorm = normalizeText(candidate.description || '');
    const combinedText = `${titleNorm} ${descNorm}`;
    const creatorNorm = normalizeText(candidate.creator?.name || '');

    const positiveEvidence: string[] = [];
    const negativeEvidence: string[] = [];
    const missingEvidence: string[] = [];
    const rejectionReasons: string[] = [];

    // 1. Primary Concept Scoring (0 to 35)
    let primaryConceptScore = 0;
    let titleConceptMatched = false;
    let descConceptMatched = false;

    for (const concept of objective.primaryConcepts) {
      const cNorm = normalizeText(concept);
      if (!cNorm) continue;

      // Exact phrase match
      const phraseRegex = new RegExp(`\\b${escapeRegex(cNorm)}\\b`, 'i');
      if (phraseRegex.test(titleNorm)) {
        titleConceptMatched = true;
        primaryConceptScore = Math.max(primaryConceptScore, 30);
        positiveEvidence.push(`Exact primary concept match in title: "${concept}"`);
      } else if (phraseRegex.test(descNorm)) {
        descConceptMatched = true;
        primaryConceptScore = Math.max(primaryConceptScore, 18);
        positiveEvidence.push(`Primary concept match in description: "${concept}"`);
      } else {
        // Token and morphological stem matching
        const conceptStems = tokenizeAndStem(cNorm);
        const titleStems = new Set(tokenizeAndStem(titleNorm));
        const descStems = new Set(tokenizeAndStem(descNorm));

        if (conceptStems.length > 0) {
          const matchedTitle = conceptStems.filter((s) => titleStems.has(s));
          const matchedDesc = conceptStems.filter((s) => descStems.has(s));

          if (matchedTitle.length === conceptStems.length) {
            titleConceptMatched = true;
            primaryConceptScore = Math.max(primaryConceptScore, 28);
            positiveEvidence.push(`All morphological stems of primary concept "${concept}" matched in title`);
          } else if (matchedTitle.length >= Math.ceil(conceptStems.length * 0.75)) {
            titleConceptMatched = true;
            primaryConceptScore = Math.max(primaryConceptScore, 24);
            positiveEvidence.push(`High stem overlap (${matchedTitle.length}/${conceptStems.length}) of concept "${concept}" in title`);
          } else if (matchedTitle.length >= Math.ceil(conceptStems.length * 0.5)) {
            titleConceptMatched = true;
            const boost = matchedDesc.length === conceptStems.length ? 24 : 18;
            primaryConceptScore = Math.max(primaryConceptScore, boost);
            positiveEvidence.push(`Partial morphological stems (${matchedTitle.length}/${conceptStems.length}) of concept "${concept}" in title`);
          } else if (matchedDesc.length === conceptStems.length) {
            descConceptMatched = true;
            primaryConceptScore = Math.max(primaryConceptScore, 18);
            positiveEvidence.push(`All morphological stems of concept "${concept}" matched in description`);
          }
        }
      }
    }

    // Secondary boost if multiple primary concepts match
    if (objective.primaryConcepts.length > 1) {
      const allMatched = objective.primaryConcepts.filter((c) =>
        new RegExp(`\\b${escapeRegex(normalizeText(c))}\\b`, 'i').test(combinedText)
      );
      if (allMatched.length > 1) {
        primaryConceptScore = Math.min(35, primaryConceptScore + 5);
        positiveEvidence.push(`Multiple primary concepts matched (${allMatched.length}/${objective.primaryConcepts.length})`);
      }
    }

    // Supporting concepts boost
    for (const supp of objective.supportingConcepts) {
      const sNorm = normalizeText(supp);
      if (sNorm && new RegExp(`\\b${escapeRegex(sNorm)}\\b`, 'i').test(combinedText)) {
        primaryConceptScore = Math.min(35, primaryConceptScore + 2);
        positiveEvidence.push(`Supporting concept matched: "${supp}"`);
      }
    }

    primaryConceptScore = Math.min(35, Math.max(0, primaryConceptScore));
    if (primaryConceptScore === 0) {
      missingEvidence.push('No primary or supporting concepts detected in title or description');
    }

    // 2. Domain Alignment Score (0 to 20)
    let domainAlignmentScore = 8; // baseline neutral
    const domainVocab = DOMAIN_POSITIVE_VOCABULARY[objective.domain] || [];
    let domainHits = 0;

    for (const term of domainVocab) {
      if (new RegExp(`\\b${escapeRegex(term)}\\b`, 'i').test(combinedText)) {
        domainHits++;
      }
    }

    if (domainHits >= 3) {
      domainAlignmentScore = 20;
      positiveEvidence.push(`Strong domain alignment for ${objective.domain} (${domainHits} domain terms observed)`);
    } else if (domainHits >= 1) {
      domainAlignmentScore = 14;
      positiveEvidence.push(`Moderate domain alignment for ${objective.domain}`);
    } else {
      domainAlignmentScore = 7;
      missingEvidence.push(`Weak domain-specific vocabulary for ${objective.domain}`);
    }

    // 3. Outcome & Pedagogical Coverage Score (0 to 15)
    let outcomeCoverageScore = 0;
    const pedagogicalKeywords = [
      'tutorial', 'explained', 'lecture', 'derivation', 'proof', 'guide',
      'course', 'introduction', 'walkthrough', 'step by step', 'masterclass',
      'lesson', 'fundamentals', 'deep dive', 'foundations', 'theory', 'principles', 'algorithm',
    ];

    let pedHits = 0;
    for (const kw of pedagogicalKeywords) {
      if (new RegExp(`\\b${escapeRegex(kw)}\\b`, 'i').test(combinedText)) {
        pedHits++;
      }
    }

    outcomeCoverageScore += Math.min(8, pedHits * 2);

    // Check explicit outcomes
    for (const outcome of objective.explicitOutcomes) {
      const oNorm = normalizeText(outcome);
      const oTokens = oNorm.split(' ').filter((t) => t.length > 3);
      const matches = oTokens.filter((t) =>
        new RegExp(`\\b${escapeRegex(t)}\\b`, 'i').test(combinedText)
      );
      if (matches.length >= 2) {
        outcomeCoverageScore = Math.min(15, outcomeCoverageScore + 4);
        positiveEvidence.push(`Learning outcome keywords matched: "${outcome}"`);
      }
    }

    outcomeCoverageScore = Math.min(15, Math.max(0, outcomeCoverageScore));

    // 4. Intent & Modality Score (0 to 15)
    let intentModalityScore = 10; // Baseline
    const modality = candidate.modality;
    const intent = objective.cognitiveIntent;

    switch (intent) {
      case 'coding_walkthrough':
      case 'project_implementation':
        if (modality === 'video' || modality === 'project') {
          intentModalityScore = 15;
          positiveEvidence.push(`Modality '${modality}' directly supports hands-on intent '${intent}'`);
        } else if (modality === 'documentation') {
          intentModalityScore = 12;
        } else if (modality === 'paper' && (objective.academicLevel === 'advanced' || objective.academicLevel === 'undergraduate')) {
          intentModalityScore = 14;
          positiveEvidence.push(`Academic paper provides foundational theory for advanced ${intent}`);
        } else {
          intentModalityScore = 7;
        }
        break;
      case 'in_depth_conceptual':
        if (modality === 'paper' || modality === 'monograph' || modality === 'video') {
          intentModalityScore = 15;
          positiveEvidence.push(`Modality '${modality}' supports in-depth theoretical study`);
        } else {
          intentModalityScore = 10;
        }
        break;
      case 'worked_examples':
        if (modality === 'video' || modality === 'practice') {
          intentModalityScore = 15;
        } else {
          intentModalityScore = 10;
        }
        break;
      case 'authoritative_documentation':
        if (modality === 'documentation') {
          intentModalityScore = 15;
        } else {
          intentModalityScore = 8;
        }
        break;
      default:
        intentModalityScore = 12;
        break;
    }

    // 5. Curricular Context Score (0 to 15)
    let curricularContextScore = 5; // Baseline

    // Check target exam (e.g. JEE, NEET, CBSE, GATE)
    if (objective.targetExam) {
      const examNorm = normalizeText(objective.targetExam);
      if (examNorm && new RegExp(`\\b${escapeRegex(examNorm)}\\b`, 'i').test(combinedText)) {
        curricularContextScore += 6;
        positiveEvidence.push(`Target exam "${objective.targetExam}" explicitly matched`);
      }
    }

    // Check subject match
    if (objective.subject) {
      const subNorm = normalizeText(objective.subject);
      if (subNorm && new RegExp(`\\b${escapeRegex(subNorm)}\\b`, 'i').test(combinedText)) {
        curricularContextScore += 4;
        positiveEvidence.push(`Subject "${objective.subject}" verified in resource text`);
      }
    }

    // Check academic level compatibility
    if (objective.academicLevel) {
      const lvl = objective.academicLevel.toLowerCase();
      if (lvl === 'beginner' || lvl === 'elementary') {
        if (/\b(beginner|basics|fundamentals|for beginners|101|introduction)\b/i.test(combinedText)) {
          curricularContextScore += 3;
          positiveEvidence.push(`Beginner-friendly pedagogy detected`);
        }
      }
    }

    curricularContextScore = Math.min(15, Math.max(0, curricularContextScore));

    // 6. Cross-Domain Anti-Collision Penalty (0 to 100)
    let negativeCollisionPenalty = 0;

    for (const rule of COLLISION_RULES) {
      if (rule.condition(objective, combinedText)) {
        for (const pattern of rule.collisionPatterns) {
          if (pattern.test(combinedText)) {
            negativeCollisionPenalty = Math.max(negativeCollisionPenalty, rule.penalty);
            negativeEvidence.push(rule.reason);
            rejectionReasons.push(rule.reason);
            break;
          }
        }
      }
    }

    // Explicit negative constraints configured in AnalyzedObjective
    for (const neg of objective.negativeConstraints) {
      const negNorm = normalizeText(neg);
      if (negNorm && new RegExp(`\\b${escapeRegex(negNorm)}\\b`, 'i').test(combinedText)) {
        negativeCollisionPenalty = Math.max(negativeCollisionPenalty, 75);
        negativeEvidence.push(`Violates objective negative constraint: "${neg}"`);
        rejectionReasons.push(`Resource matches negative constraint "${neg}"`);
      }
    }

    for (const exc of objective.domainExclusions) {
      const excNorm = normalizeText(exc);
      if (excNorm && new RegExp(`\\b${escapeRegex(excNorm)}\\b`, 'i').test(combinedText)) {
        negativeCollisionPenalty = Math.max(negativeCollisionPenalty, 75);
        negativeEvidence.push(`Matches domain exclusion: "${exc}"`);
        rejectionReasons.push(`Resource matches domain exclusion "${exc}"`);
      }
    }

    // 7. Calculate Raw & Normalized Scores
    const rawScore =
      primaryConceptScore +
      domainAlignmentScore +
      outcomeCoverageScore +
      intentModalityScore +
      curricularContextScore -
      negativeCollisionPenalty;

    const normalizedScore = Math.max(0, Math.min(100, Math.round(rawScore)));

    // 8. Eligibility Gating
    let isEligible = true;

    // Strict Rule A: Collision penalty >= 50 rejects candidate
    if (negativeCollisionPenalty >= 50) {
      isEligible = false;
    }

    // Strict Rule B: Overall score must meet the gate (50)
    if (normalizedScore < 50) {
      isEligible = false;
      if (!rejectionReasons.length) {
        rejectionReasons.push(`Relevance score (${normalizedScore}/100) falls below minimum eligibility threshold (50)`);
      }
    }

    // Strict Rule C: Primary concept match is mandatory
    if (primaryConceptScore < 10 && !titleConceptMatched && !descConceptMatched) {
      isEligible = false;
      rejectionReasons.push('Resource lacks demonstrable match for module primary learning concepts in title or description');
    }

    const breakdown: RelevanceScoreBreakdown = {
      primaryConceptScore,
      domainAlignmentScore,
      outcomeCoverageScore,
      intentModalityScore,
      curricularContextScore,
      negativeCollisionPenalty,
      rawScore,
      normalizedScore,
    };

    // Confidence indicator: higher when description is present and primary concepts matched in title
    const confidence = candidate.description
      ? (titleConceptMatched ? 0.95 : 0.8)
      : (titleConceptMatched ? 0.75 : 0.5);

    return {
      score: normalizedScore,
      confidence,
      isEligible,
      breakdown,
      positiveEvidence,
      negativeEvidence,
      missingEvidence,
      rejectionReasons,
    };
  }
}
