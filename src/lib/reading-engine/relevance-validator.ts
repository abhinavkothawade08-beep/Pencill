/**
 * Strict Topic Relevance & Pedagogical Quality Validator
 *
 * Enforces:
 * 1. Semantic alignment between Course -> Module -> Lesson -> Learning Objectives.
 * 2. Cross-Domain Collision Detection (e.g., rejecting physics/math equations in a public speaking or psychology lesson).
 * 3. Elimination of placeholder, AI conversational fluff, or mock text.
 * 4. Structural completeness of core academic monograph sections.
 */

import {
  GeneratedReadingDocumentContent,
  LessonReadingContext,
  RelevanceValidationResult,
} from './types';

// Stop words to ignore during keyword extraction
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'for', 'with',
  'by', 'about', 'against', 'between', 'into', 'through', 'during', 'before',
  'after', 'above', 'below', 'from', 'up', 'down', 'is', 'are', 'was', 'were',
  'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'how',
  'what', 'why', 'when', 'where', 'which', 'who', 'this', 'that', 'these',
  'those', 'introduction', 'basics', 'fundamentals', 'overview', 'guide',
  'notes', 'study', 'chapter', 'unit', 'lesson', 'module', 'course', 'part'
]);

// Hallmarks of specific domains to detect cross-domain collisions
const DOMAIN_COLLISION_RULES: Array<{
  domainFilter: (domain: string, title: string) => boolean;
  forbiddenHallmarks: string[];
  reason: string;
}> = [
  {
    // If the topic is human skills, arts, communication, psychology, or mindset
    domainFilter: (domain, title) => {
      const combined = `${domain} ${title}`.toLowerCase();
      return (
        combined.includes('speech') ||
        combined.includes('fear') ||
        combined.includes('mindset') ||
        combined.includes('communication') ||
        combined.includes('presentation') ||
        combined.includes('psychology') ||
        combined.includes('soft_skills') ||
        combined.includes('arts')
      );
    },
    forbiddenHallmarks: [
      'quadratic equation',
      'gravitational vector',
      'gravitational vectors',
      'schrödinger',
      'schrodinger',
      'coulomb\'s law',
      'centripetal acceleration',
      'eigenvalues and eigenvectors',
      'laplace transform',
      'derivative of f(x)',
      'general relativity',
      'sql injection',
      'docker container',
      'kubernetes pod',
    ],
    reason: 'Unrelated technical/mathematical formulas detected in a soft-skills or mindset lesson.',
  },
  {
    // If topic is purely mathematical
    domainFilter: (domain, title) => {
      const combined = `${domain} ${title}`.toLowerCase();
      return (
        (domain === 'mathematics' || combined.includes('calculus') || combined.includes('linear algebra')) &&
        !combined.includes('psychology') &&
        !combined.includes('communication')
      );
    },
    forbiddenHallmarks: [
      'stage fear',
      'public speaking anxiety',
      'audience eye contact',
      'vocal inflection in speech',
      'photosynthesis in chloroplasts',
      'cardiopulmonary resuscitation',
    ],
    reason: 'Unrelated public-speaking or biological content detected in a mathematics lesson.',
  },
  {
    // If topic is biological or medical
    domainFilter: (domain, title) => {
      const combined = `${domain} ${title}`.toLowerCase();
      return (
        (domain === 'biology' || combined.includes('anatomy') || combined.includes('physiology')) &&
        !combined.includes('quantum') &&
        !combined.includes('algebra')
      );
    },
    forbiddenHallmarks: [
      'gravitational vector',
      'schrödinger equation',
      'linear regression gradient descent',
      'react virtual dom',
      'sql injection',
    ],
    reason: 'Unrelated software or theoretical physics content detected in a biological lesson.',
  },
];

const PLACEHOLDER_STRINGS = [
  'lorem ipsum',
  'todo:',
  '[insert',
  'sample text',
  'placeholder',
  'as an ai language model',
  'as a large language model',
  'i cannot fulfill',
  'i am unable to',
  'tbd',
];

/**
 * Extracts meaningful subject keywords from lesson and course metadata.
 */
function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

export function validateTopicRelevance(
  doc: GeneratedReadingDocumentContent,
  context: LessonReadingContext
): RelevanceValidationResult {
  const reasons: string[] = [];
  let unrelatedTopicDetected = false;

  // 1. Placeholder & AI boilerplate detection
  const fullDocumentText = `
    ${doc.title}
    ${doc.introduction}
    ${doc.detailedConceptualExplanation}
    ${doc.summary}
    ${doc.keyTakeaways.join(' ')}
    ${doc.importantDefinitions.map((d) => `${d.term} ${d.definition}`).join(' ')}
    ${doc.commonMistakesAndMisconceptions.map((m) => `${m.misconception} ${m.correction}`).join(' ')}
  `.toLowerCase();

  for (const placeholder of PLACEHOLDER_STRINGS) {
    if (fullDocumentText.includes(placeholder)) {
      reasons.push(`Contains invalid placeholder or boilerplate string: "${placeholder}".`);
    }
  }

  // 2. Minimum substance and completeness checks
  if (doc.detailedConceptualExplanation.trim().length < 100) {
    reasons.push('Detailed conceptual explanation is too brief (< 100 characters).');
  }
  if (doc.introduction.trim().length < 20) {
    reasons.push('Introduction is too brief (< 20 characters).');
  }
  if (doc.summary.trim().length < 20) {
    reasons.push('Summary is too brief (< 20 characters).');
  }
  if (!doc.keyTakeaways || doc.keyTakeaways.length < 2) {
    reasons.push('Must provide at least 2 key takeaways.');
  }
  if (!doc.learningObjectives || doc.learningObjectives.length === 0) {
    reasons.push('Learning objectives must be defined.');
  }
  if (!doc.selfAssessmentQuestions || doc.selfAssessmentQuestions.length === 0) {
    reasons.push('At least one self-assessment question is required.');
  }

  // 3. Cross-Domain Collision Guard
  const combinedContextDomain = `${context.courseDomain} ${context.courseTitle}`.toLowerCase();
  for (const rule of DOMAIN_COLLISION_RULES) {
    if (rule.domainFilter(context.courseDomain, context.lessonTitle)) {
      for (const forbidden of rule.forbiddenHallmarks) {
        if (fullDocumentText.includes(forbidden.toLowerCase())) {
          reasons.push(`Cross-Domain Collision: ${rule.reason} (Detected forbidden term: "${forbidden}")`);
          unrelatedTopicDetected = true;
          break;
        }
      }
    }
  }

  // 4. Topic Alignment & Keyword Overlap
  const targetKeywords = Array.from(
    new Set([
      ...extractKeywords(context.lessonTitle),
      ...extractKeywords(context.moduleTitle),
      ...context.learningObjectives.flatMap((o) => extractKeywords(o)),
    ])
  );

  let matchedKeywordCount = 0;
  for (const kw of targetKeywords) {
    if (fullDocumentText.includes(kw)) {
      matchedKeywordCount++;
    }
  }

  // If there are target keywords, at least 1 must match
  if (targetKeywords.length > 0 && matchedKeywordCount === 0) {
    reasons.push(
      `Zero topic keywords matched between lesson context and generated text. Target keywords: [${targetKeywords.slice(0, 6).join(', ')}]`
    );
  }

  return {
    isValid: reasons.length === 0,
    reasons,
    matchedKeywordCount,
    unrelatedTopicDetected,
  };
}
