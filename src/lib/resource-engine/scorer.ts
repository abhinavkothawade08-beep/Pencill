import {
  NormalizedResource,
  ScoredResource,
  ModulePlan,
  EducationalDomain,
} from './types';

export const MIN_RELEVANCE_THRESHOLD = 45;

export function scoreResource(
  res: NormalizedResource,
  modulePlan: ModulePlan,
  domain: EducationalDomain,
  courseTopic: string
): ScoredResource {
  const resourceText = `${res.title} ${res.description}`.toLowerCase();
  const titleText = res.title.toLowerCase();

  const courseTopicTokens = tokenize(courseTopic);
  const moduleTitleTokens = tokenize(modulePlan.title);

  const objectiveTokens = new Set<string>();
  for (const obj of modulePlan.learningObjectives) {
    for (const t of tokenize(obj.statement)) objectiveTokens.add(t);
    for (const k of obj.keyTerms) {
      for (const t of tokenize(k)) objectiveTokens.add(t);
    }
  }

  // 1. Title Concept Match (up to 40 points)
  let titleMatches = 0;
  for (const token of courseTopicTokens) {
    if (titleText.includes(token)) titleMatches += 2;
  }
  for (const token of moduleTitleTokens) {
    if (titleText.includes(token)) titleMatches += 1.5;
  }
  for (const token of objectiveTokens) {
    if (titleText.includes(token)) titleMatches += 1;
  }
  const titleConceptMatch = Math.min(40, Math.round(titleMatches * 5));

  // 2. Description Match (up to 20 points)
  let descMatches = 0;
  for (const token of courseTopicTokens) {
    if (resourceText.includes(token)) descMatches += 1;
  }
  for (const token of objectiveTokens) {
    if (resourceText.includes(token)) descMatches += 0.8;
  }
  const descriptionMatch = Math.min(20, Math.round(descMatches * 3));

  // 3. Domain Alignment (up to 15 points)
  let domainAlignment = 0;
  if (domain === 'computer_science' && (resourceText.includes('code') || resourceText.includes('program') || resourceText.includes('developer') || res.providerId === 'official_docs')) {
    domainAlignment = 15;
  } else if (domain === 'mathematics' && (resourceText.includes('math') || resourceText.includes('equation') || resourceText.includes('calculus') || resourceText.includes('derivat'))) {
    domainAlignment = 15;
  } else if (domain === 'ai_and_data' && (resourceText.includes('ai') || resourceText.includes('model') || resourceText.includes('neural') || resourceText.includes('data') || res.providerId === 'arxiv')) {
    domainAlignment = 15;
  } else if (domain === 'natural_sciences' && (resourceText.includes('physic') || resourceText.includes('law') || resourceText.includes('experiment') || res.providerId === 'openstax')) {
    domainAlignment = 15;
  } else {
    domainAlignment = 8;
  }

  // 4. Educator Credibility Bonus (up to 15 points)
  let educatorBonus = 0;
  if (res.isVerifiedEducator) {
    educatorBonus = 15;
  } else if (res.providerId === 'official_docs' || res.providerId === 'openstax' || res.providerId === 'arxiv') {
    educatorBonus = 12;
  }

  // 5. Duration Penalty
  let durationPenalty = 0;
  if (res.modality === 'video') {
    if (res.durationSeconds < 180) {
      durationPenalty = 25; // Short clips (< 3m) are penalized for comprehensive lessons
    } else if (res.durationSeconds < 300) {
      durationPenalty = 10;
    }
  }

  // 6. Cross-Domain Collision Penalty (CRUCIAL GATING)
  let collisionPenalty = 0;
  let collisionReason: string | undefined;

  const topicLower = courseTopic.toLowerCase();
  const isCSTopic = topicLower.includes('python') || topicLower.includes('react') || topicLower.includes('javascript') || topicLower.includes('web');
  const isPhysicsResource = resourceText.includes('physics') || resourceText.includes('kinematics') || resourceText.includes('projectile motion') || resourceText.includes('newton') || resourceText.includes('ncert class 11 physics');

  if (isCSTopic && isPhysicsResource) {
    collisionPenalty = 60;
    collisionReason = 'Cross-domain collision: High school physics content rejected for programming course.';
  }

  const isMathTopic = topicLower.includes('differential equation') || topicLower.includes('calculus') || topicLower.includes('linear algebra');
  if (isMathTopic && (resourceText.includes('react.js') || resourceText.includes('frontend developer') || resourceText.includes('html css'))) {
    collisionPenalty = 60;
    collisionReason = 'Cross-domain collision: Web development tutorial rejected for mathematical derivation course.';
  }

  // Compute Relevance Score
  const rawRelevance = titleConceptMatch + descriptionMatch + domainAlignment - durationPenalty - collisionPenalty;
  const relevanceScore = Math.max(0, Math.min(100, rawRelevance));

  // Compute Quality Score
  let qualityBase = 70;
  if (res.isVerifiedEducator) qualityBase += 15;
  if (res.isEmbeddable) qualityBase += 5;
  if (res.publishedDate) qualityBase += 5;
  if (res.providerId === 'official_docs' || res.providerId === 'openstax') qualityBase += 10;
  const qualityScore = Math.min(100, qualityBase);

  const combinedScore = Math.round(relevanceScore * 0.7 + qualityScore * 0.3);

  const passedRelevanceGate = relevanceScore >= MIN_RELEVANCE_THRESHOLD && collisionPenalty === 0;
  const rejectionReason = !passedRelevanceGate
    ? collisionReason || `Relevance score (${relevanceScore}) below minimum threshold (${MIN_RELEVANCE_THRESHOLD}) for topic "${courseTopic}"`
    : undefined;

  const matchedObjectives: string[] = [];
  for (const obj of modulePlan.learningObjectives) {
    const objTokens = tokenize(obj.statement);
    let count = 0;
    for (const t of objTokens) {
      if (resourceText.includes(t)) count++;
    }
    if (count >= 2) {
      matchedObjectives.push(obj.statement);
    }
  }

  return {
    ...res,
    relevanceScore,
    qualityScore,
    combinedScore,
    matchedObjectives,
    scoringFactors: {
      titleConceptMatch,
      descriptionMatch,
      domainAlignment,
      educatorBonus,
      durationPenalty,
      collisionPenalty,
    },
    passedRelevanceGate,
    rejectionReason,
  };
}

function tokenize(text: string): Set<string> {
  const stopWords = new Set([
    'the', 'and', 'for', 'with', 'from', 'into', 'during', 'including',
    'course', 'lecture', 'video', 'tutorial', 'full', 'learn', 'beginner',
    'complete', 'guide', 'introduction', 'basics', 'how', 'to', 'what', 'is'
  ]);
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));
  return new Set(tokens);
}
