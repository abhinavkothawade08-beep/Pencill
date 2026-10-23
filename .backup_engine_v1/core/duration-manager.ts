import {
  LearningObjectiveIntent,
  DurationPreferenceMap,
  PracticalLearningSignals,
} from '../types';
import { DEFAULT_DURATION_PREFERENCES } from '../config/engine-config';
import { clampScore } from '../utils/scoring-utils';

export interface LearningIntentInferenceParams {
  topic: string;
  moduleTitle?: string;
  moduleObjective?: string;
  moduleDescription?: string;
  difficulty?: string;
  subtopics?: string[];
  lessons?: Array<{ title: string; type?: string; keyConcepts?: string[] }>;
}

/**
 * Distinguishes between:
 * A. A narrow concept that can be taught effectively in a short video (concept_quick: 5–15 min).
 * B. A broad topic requiring detailed instruction (concept_detailed: 15–30 min).
 * C. A practical skill that benefits from demonstrations (hands_on_tutorial: 20–60 min).
 * D. A practical project requiring substantial implementation time (practical_project: 30–120 min).
 * E. A comprehensive learning objective requiring multiple lessons or a full course (comprehensive_course: 60–240+ min).
 */
export function inferLearningIntent(params: LearningIntentInferenceParams): LearningObjectiveIntent {
  const combinedText = [
    params.moduleObjective || '',
    params.moduleTitle || '',
    params.topic || '',
    params.moduleDescription || '',
    ...(params.subtopics || []),
    ...(params.lessons || []).map((l) => `${l.title} ${(l.keyConcepts || []).join(' ')}`),
  ]
    .join(' ')
    .toLowerCase();

  const titleLower = (params.moduleTitle || params.topic).toLowerCase();

  // 1. Practical Project: Building, creating, deploying an application or end-to-end system
  const projectRegex = /\b(build|building|builds|project|projects|create\s+(a\s+)?(complete|full|working|real[\s-]?world)?|clone|full[\s-]?stack|end[\s-]?to[\s-]?end\s+application|portfolio\s+project|web\s+app|mobile\s+app|rest\s+api\s+from\s+scratch)\b/i;
  if (projectRegex.test(combinedText)) {
    // If the objective explicitly mentions building/implementing an application or project
    if (
      params.moduleObjective &&
      /\b(build|create|develop|deploy|implement\s+(an?|the)\s+(application|project|system|app|service|model))\b/i.test(params.moduleObjective)
    ) {
      return 'practical_project';
    }
    if (/\b(project|portfolio|full[\s-]?stack|clone)\b/i.test(titleLower)) {
      return 'practical_project';
    }
    // If module has project/hands-on lessons
    if (params.lessons?.some((l) => /\b(project|build|implementation|capstone)\b/i.test(l.title))) {
      return 'practical_project';
    }
  }

  // 2. Narrow Focused Concept: isolated language syntax, specific built-in method, operators, small utility
  const narrowRegex = /\b(string\s+methods?|list\s+comprehensions?|dict\s+comprehensions?|decorator|decorators|generator|generators|regular\s+expressions?|regex|git\s+rebase|git\s+cherry[\s-]?pick|flexbox\s+align[\s-]?items|flexbox\s+justify[\s-]?content|css\s+grid\s+template|usestate|useeffect|usememo|usecallback|array\s+(methods?|reduce|map|filter)|arrow\s+functions?|ternary\s+operator|bitwise\s+operators?|binary\s+search\s+implementation|bubble\s+sort|insertion\s+sort|slice\s+method|split\s+and\s+join)\b/i;
  const isNarrowTitle = narrowRegex.test(titleLower) || narrowRegex.test(params.topic.toLowerCase());

  // Check if topic is a very narrow concept without broad course requirements
  const wordCount = titleLower.replace(/^(module\s*\d+[:.-]?\s*)/i, '').trim().split(/\s+/).length;
  if (isNarrowTitle && wordCount <= 5 && !combinedText.includes('full course') && !combinedText.includes('complete course')) {
    // If beginner/quick explanation
    if (
      /\b(methods?|syntax|operator|function|definition|rule|formula|trick|snippet)\b/i.test(titleLower) &&
      !/\b(deep\s+dive|advanced|framework|architecture|system)\b/i.test(combinedText)
    ) {
      return 'concept_quick';
    }
    return 'concept_detailed';
  }

  // 3. Hands-on Tutorial: Practical demonstrations, coding walkthroughs, experiments, step-by-step exercises
  const handsOnRegex = /\b(hands[\s-]?on|code[\s-]?along|walkthrough|step[\s-]?by[\s-]?step|coding\s+tutorial|exercises?|practical\s+(examples?|guide|demonstration|implementation)|how\s+to\s+(use|implement|setup|configure|debug|test|train|fine[\s-]?tune)|practice\s+problems?|lab\s+work|solved\s+examples?)\b/i;
  if (handsOnRegex.test(combinedText)) {
    return 'hands_on_tutorial';
  }

  // 4. Comprehensive Course / Full Tutorial: Broad foundational tracks, multi-module masterclasses, full chapters
  const comprehensiveRegex = /\b(full\s+course|complete\s+course|complete\s+tutorial|masterclass|bootcamp|fundamentals|all[\s-]?in[\s-]?one|complete\s+chapter|one[\s-]?shot|comprehensive\s+guide|from\s+scratch\s+to\s+advanced)\b/i;
  const isBroadTopic = /\b(programming|machine\s+learning|deep\s+learning|artificial\s+intelligence|data\s+structures|algorithms|web\s+development|calculus|organic\s+chemistry|physics|economics)\b/i.test(params.topic);

  if (comprehensiveRegex.test(combinedText) || (isBroadTopic && (!params.moduleTitle || params.moduleTitle.toLowerCase().includes('introduction') || params.moduleTitle.toLowerCase().includes('foundations')))) {
    // If specific module is part of broad topic but has detailed scope
    if (params.moduleTitle && !params.moduleTitle.toLowerCase().includes('complete course') && !params.moduleTitle.toLowerCase().includes('one shot')) {
      return 'concept_detailed';
    }
    return 'comprehensive_course';
  }

  // 5. Default by difficulty and structure
  const diff = (params.difficulty || '').toLowerCase();
  if (diff.includes('advanced') || diff.includes('undergraduate') || diff.includes('jee')) {
    return 'concept_detailed';
  }

  return 'hands_on_tutorial';
}

/**
 * Calculates a duration suitability score (0–100) based on the target learning intent.
 * Evaluates whether the candidate's length provides sufficient pedagogical depth
 * without unnecessarily rewarding superficial clips or bloated content.
 */
export function calculateDurationSuitability(
  durationMinutes: number,
  intent: LearningObjectiveIntent = 'concept_detailed',
  preferences: DurationPreferenceMap = DEFAULT_DURATION_PREFERENCES
): number {
  if (typeof durationMinutes !== 'number' || durationMinutes <= 0 || isNaN(durationMinutes)) {
    return 50; // Neutral baseline for unmeasured or missing duration
  }

  const range = preferences[intent] || DEFAULT_DURATION_PREFERENCES[intent];
  const dur = durationMinutes;

  // 1. Within target sweet spot: Optimal learning duration
  if (dur >= range.targetMinMinutes && dur <= range.targetMaxMinutes) {
    return 98;
  }

  // 2. Below targetMinMinutes
  if (dur < range.targetMinMinutes) {
    if (dur >= range.minMinutes) {
      // Linear scale between 75 and 95
      const span = Math.max(range.targetMinMinutes - range.minMinutes, 1);
      const ratio = (dur - range.minMinutes) / span;
      return clampScore(75 + ratio * 20);
    }
    // Below minimum threshold: scale down to 30
    const ratio = Math.max(0, dur / Math.max(range.minMinutes, 1));
    return clampScore(30 + ratio * 40);
  }

  // 3. Above targetMaxMinutes
  if (dur > range.targetMaxMinutes) {
    if (dur <= range.maxMinutes) {
      // Linear gentle taper between 95 and 82
      const span = Math.max(range.maxMinutes - range.targetMaxMinutes, 1);
      const ratio = (dur - range.targetMaxMinutes) / span;
      return clampScore(95 - ratio * 13);
    }
    // Above max threshold
    // For quick concepts, an excessively long video is counter-productive (decay down to 40)
    if (intent === 'concept_quick') {
      const overageRatio = Math.min((dur - range.maxMinutes) / 60, 2);
      return clampScore(75 - overageRatio * 20);
    }
    // For comprehensive courses or practical projects, longer videos retain respectable value
    const overageRatio = Math.min((dur - range.maxMinutes) / 180, 1);
    return clampScore(80 - overageRatio * 15);
  }

  return 85;
}

/**
 * Extracts verifiable practical learning signals from video title, description, and tags.
 */
export function extractPracticalLearningSignals(
  title: string,
  description?: string,
  tags?: string[]
): PracticalLearningSignals {
  const normTitle = (title || '').toLowerCase();
  const normDesc = (description || '').toLowerCase();
  const normTags = (tags || []).map((t) => t.toLowerCase()).join(' ');
  const combined = `${normTitle} ${normDesc} ${normTags}`;

  // Individual signals
  const hasProject =
    /\b(project|projects|portfolio|real[\s-]?world\s+app|build\s+(a|an)|building\s+(a|an)|clone|from\s+scratch\s+app|capstone)\b/i.test(combined);

  const hasCodeWalkthrough =
    /\b(code[\s-]?along|live\s+coding|coding|walkthrough|source\s+code|github|git\s+repo|sample\s+code|syntax\s+breakdown)\b/i.test(combined);

  const hasHandsOn =
    /\b(hands[\s-]?on|handson|interactive|lab|practical|exercise|demonstration)\b/i.test(combined);

  const hasStepByStep =
    /\b(step[\s-]?by[\s-]?step|from\s+scratch|zero\s+to\s+hero|beginner\s+to\s+advanced|complete\s+guide|tutorial\s+guide)\b/i.test(combined);

  const hasExercises =
    /\b(exercises?|practice\s+problems?|quizzes?|challenges?|solved\s+problems?|drills?|worked\s+examples?|code\s+challenge)\b/i.test(combined);

  const hasRealWorld =
    /\b(real[\s-]?world|production|industry|enterprise|case\s+study|practical\s+use|production[\s-]?ready)\b/i.test(combined);

  const hasCompleteImplementation =
    /\b(complete\s+implementation|end[\s-]?to[\s-]?end|full\s+implementation|working\s+example|fully\s+functional)\b/i.test(combined);

  // Compute composite practical learning score (0–100)
  // Title occurrences indicate primary focus (+18 pts each), description mentions indicate supporting content (+8 pts each)
  let score = 40; // Baseline for valid educational content

  const checkSignal = (regex: RegExp): number => {
    let pts = 0;
    if (regex.test(normTitle)) pts += 16;
    else if (regex.test(normDesc)) pts += 8;
    return pts;
  };

  score += checkSignal(/\b(project|portfolio|capstone|real[\s-]?world\s+app)\b/i);
  score += checkSignal(/\b(build\s+(a|an)|building\s+(a|an)|clone)\b/i);
  score += checkSignal(/\b(code[\s-]?along|live\s+coding|walkthrough)\b/i);
  score += checkSignal(/\b(hands[\s-]?on|handson|practical)\b/i);
  score += checkSignal(/\b(step[\s-]?by[\s-]?step|from\s+scratch)\b/i);
  score += checkSignal(/\b(complete\s+implementation|end[\s-]?to[\s-]?end)\b/i);
  score += checkSignal(/\b(exercises?|practice\s+problems?|worked\s+examples?)\b/i);
  score += checkSignal(/\b(real[\s-]?world|production|industry)\b/i);

  // Chapter markers / timestamps reinforce practical step-by-step walkthroughs
  if (/(?:\d{1,2}:\d{2})/g.test(normDesc)) {
    score += 8;
  }

  const signalScore = clampScore(score);

  return {
    hasProject,
    hasCodeWalkthrough,
    hasHandsOn,
    hasStepByStep,
    hasExercises,
    hasRealWorld,
    hasCompleteImplementation,
    signalScore,
  };
}

/**
 * Returns human-readable label and description for an intent.
 */
export function getIntentDescription(intent: LearningObjectiveIntent): string {
  switch (intent) {
    case 'concept_quick':
      return 'Quick concept explanation (5–15 min target)';
    case 'concept_detailed':
      return 'Detailed concept tutorial (15–30 min target)';
    case 'hands_on_tutorial':
      return 'Hands-on practical tutorial (20–60 min target)';
    case 'practical_project':
      return 'Practical project implementation (30–120 min target)';
    case 'comprehensive_course':
      return 'Comprehensive tutorial or full course (60–240+ min target)';
  }
}
