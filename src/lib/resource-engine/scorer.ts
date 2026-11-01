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
  const keyTermsTokens = new Set<string>();
  for (const obj of modulePlan.learningObjectives) {
    for (const t of tokenize(obj.statement)) objectiveTokens.add(t);
    for (const k of obj.keyTerms) {
      for (const t of tokenize(k)) {
        objectiveTokens.add(t);
        keyTermsTokens.add(t);
      }
    }
  }

  // Module-specific tokens (tokens in module title or objectives that are not generic stopwords)
  const moduleSpecificTokens = new Set<string>();
  for (const t of moduleTitleTokens) moduleSpecificTokens.add(t);
  for (const t of objectiveTokens) moduleSpecificTokens.add(t);

  // Check how many module-specific tokens appear in the resource
  let moduleConceptMatchCount = 0;
  for (const token of moduleSpecificTokens) {
    if (resourceText.includes(token)) {
      moduleConceptMatchCount++;
    }
  }

  // 1. Module Objective Alignment (0–35 points)
  let objScore = 0;
  for (const obj of modulePlan.learningObjectives) {
    for (const kt of obj.keyTerms) {
      const ktLower = kt.toLowerCase();
      if (titleText.includes(ktLower)) objScore += 10;
      else if (resourceText.includes(ktLower)) objScore += 5;
    }
    for (const t of tokenize(obj.statement)) {
      if (titleText.includes(t)) objScore += 3;
      else if (resourceText.includes(t)) objScore += 1.5;
    }
  }
  const moduleObjectiveScore = Math.min(35, Math.round(objScore));

  // 2. Title & Module Concept Match (0–25 points)
  let titleConceptScore = 0;
  for (const token of moduleTitleTokens) {
    if (titleText.includes(token)) titleConceptScore += 8;
    else if (resourceText.includes(token)) titleConceptScore += 3;
  }
  for (const token of objectiveTokens) {
    if (titleText.includes(token)) titleConceptScore += 2;
  }
  const titleConceptMatch = Math.min(25, Math.round(titleConceptScore));

  // 3. Course Topic Match (0–15 points)
  let topicScore = 0;
  for (const token of courseTopicTokens) {
    if (titleText.includes(token)) topicScore += 5;
    else if (resourceText.includes(token)) topicScore += 2;
  }
  const topicMatch = Math.min(15, Math.round(topicScore));

  // 4. Description Depth & Educational Quality (0–15 points)
  let descScore = 0;
  if (res.description && res.description.length > 50) descScore += 5;
  if (res.description && res.description.length > 150) descScore += 5;
  if (
    res.description &&
    /(tutorial|lecture|implementation|architecture|framework|example|guide|walkthrough|explained|code|syntax|system)/i.test(
      res.description
    )
  ) {
    descScore += 5;
  }
  const descriptionMatch = Math.min(15, descScore);

  // 5. Domain Alignment (0–15 points)
  let domainAlignment = 0;
  if (
    domain === 'computer_science' &&
    (resourceText.includes('code') ||
      resourceText.includes('program') ||
      resourceText.includes('developer') ||
      resourceText.includes('software') ||
      resourceText.includes('algorithm') ||
      res.providerId === 'official_docs')
  ) {
    domainAlignment = 15;
  } else if (
    domain === 'mathematics' &&
    (resourceText.includes('math') ||
      resourceText.includes('equation') ||
      resourceText.includes('calculus') ||
      resourceText.includes('derivat') ||
      resourceText.includes('linear'))
  ) {
    domainAlignment = 15;
  } else if (
    domain === 'ai_and_data' &&
    (resourceText.includes('ai') ||
      resourceText.includes('model') ||
      resourceText.includes('neural') ||
      resourceText.includes('data') ||
      resourceText.includes('rag') ||
      resourceText.includes('retrieval') ||
      resourceText.includes('vector') ||
      resourceText.includes('embedding') ||
      resourceText.includes('prompt') ||
      resourceText.includes('llm') ||
      res.providerId === 'arxiv')
  ) {
    domainAlignment = 15;
  } else if (
    domain === 'natural_sciences' &&
    (resourceText.includes('physic') ||
      resourceText.includes('law') ||
      resourceText.includes('experiment') ||
      res.providerId === 'openstax')
  ) {
    domainAlignment = 15;
  } else {
    domainAlignment = 8;
  }

  // 6. Educator Credibility Bonus (0–10 points)
  let educatorBonus = 0;
  if (res.isVerifiedEducator) {
    educatorBonus = 10;
  } else if (
    res.providerId === 'official_docs' ||
    res.providerId === 'openstax' ||
    res.providerId === 'arxiv'
  ) {
    educatorBonus = 10;
  }

  // 7. Duration Penalty / Reward
  let durationPenalty = 0;
  let durationBonus = 0;
  if (res.modality === 'video') {
    if (res.durationSeconds < 180) {
      durationPenalty = 25; // Short clips (< 3m) are penalized
    } else if (res.durationSeconds < 480) {
      durationPenalty = 15; // Under 8m penalized
    } else if (res.durationSeconds >= 900 && res.durationSeconds <= 3600) {
      durationBonus = 10; // Comprehensive lectures (15-60m) rewarded
    }
  }

  // 8. Cross-Domain Collision Penalty (CRUCIAL GATING)
  let collisionPenalty = 0;
  let collisionReason: string | undefined;

  const topicLower = courseTopic.toLowerCase();
  const isCSTopic =
    topicLower.includes('python') ||
    topicLower.includes('react') ||
    topicLower.includes('javascript') ||
    topicLower.includes('web');
  const isPhysicsResource =
    resourceText.includes('physics') ||
    resourceText.includes('kinematics') ||
    resourceText.includes('projectile motion') ||
    resourceText.includes('newton') ||
    resourceText.includes('ncert class 11 physics');

  if (isCSTopic && isPhysicsResource) {
    collisionPenalty = 60;
    collisionReason =
      'Cross-domain collision: High school physics content rejected for programming course.';
  }

  const isMathTopic =
    topicLower.includes('differential equation') ||
    topicLower.includes('calculus') ||
    topicLower.includes('linear algebra');
  if (
    isMathTopic &&
    (resourceText.includes('react.js') ||
      resourceText.includes('frontend developer') ||
      resourceText.includes('html css'))
  ) {
    collisionPenalty = 60;
    collisionReason =
      'Cross-domain collision: Web development tutorial rejected for mathematical derivation course.';
  }

  // Compute Relevance Score
  const rawRelevance =
    moduleObjectiveScore +
    titleConceptMatch +
    topicMatch +
    descriptionMatch +
    domainAlignment +
    educatorBonus +
    durationBonus -
    durationPenalty -
    collisionPenalty;
  const relevanceScore = Math.max(0, Math.min(100, rawRelevance));

  // Compute Quality Score
  let qualityBase = 70;
  if (res.isVerifiedEducator) qualityBase += 15;
  if (res.isEmbeddable) qualityBase += 5;
  if (res.publishedDate) qualityBase += 5;
  if (res.providerId === 'official_docs' || res.providerId === 'openstax') qualityBase += 10;
  const qualityScore = Math.min(100, qualityBase);

  const combinedScore = Math.round(relevanceScore * 0.7 + qualityScore * 0.3);

  // Hard Relevance Gate:
  // Must achieve minimum relevance score AND zero cross-domain collision
  // AND must match at least one module-specific concept if the module specifies concept tokens
  let passedRelevanceGate =
    relevanceScore >= MIN_RELEVANCE_THRESHOLD && collisionPenalty === 0;
  let rejectionReason: string | undefined = collisionReason;

  if (passedRelevanceGate && moduleSpecificTokens.size > 0 && moduleConceptMatchCount === 0) {
    passedRelevanceGate = false;
    rejectionReason = `Resource does not cover any specific concepts or objectives for module "${modulePlan.title}".`;
  } else if (!passedRelevanceGate && !rejectionReason) {
    rejectionReason = `Relevance score (${relevanceScore}) below minimum threshold (${MIN_RELEVANCE_THRESHOLD}) for topic "${courseTopic}"`;
  }

  const matchedObjectives: string[] = [];
  for (const obj of modulePlan.learningObjectives) {
    const objTokens = tokenize(obj.statement);
    let count = 0;
    for (const t of objTokens) {
      if (resourceText.includes(t)) count++;
    }
    for (const kt of obj.keyTerms) {
      if (resourceText.includes(kt.toLowerCase())) count += 2;
    }
    if (count >= 2) {
      matchedObjectives.push(obj.statement);
    }
  }

  return {
    ...res,
    targetModuleId: modulePlan.id,
    relevanceScore,
    qualityScore,
    combinedScore,
    matchedObjectives,
    scoringFactors: {
      titleConceptMatch: moduleObjectiveScore + titleConceptMatch,
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
    'the',
    'and',
    'for',
    'with',
    'from',
    'into',
    'during',
    'including',
    'course',
    'lecture',
    'video',
    'tutorial',
    'full',
    'learn',
    'beginner',
    'complete',
    'guide',
    'introduction',
    'basics',
    'how',
    'to',
    'what',
    'is',
    'an',
    'of',
    'in',
    'on',
    'at',
    'by',
  ]);
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));
  return new Set(tokens);
}
