import {
  LearningObjectiveIntent,
  DurationPreferenceMap,
  PracticalLearningSignals,
} from '../types/legacy-contracts';
import { DEFAULT_DURATION_PREFERENCES } from '../config';
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
    if (
      params.moduleObjective &&
      /\b(build|create|develop|deploy|implement\s+(an?|the)\s+(application|project|system|app|service|model))\b/i.test(params.moduleObjective)
    ) {
      return 'practical_project';
    }
    if (/\b(project|portfolio|full[\s-]?stack|clone)\b/i.test(titleLower)) {
      return 'practical_project';
    }
    if (params.lessons?.some((l) => /\b(project|build|implementation|capstone)\b/i.test(l.title))) {
      return 'practical_project';
    }
  }

  // 2. Narrow Focused Concept: isolated language syntax, specific built-in method, operators, small utility
  const quickRegex = /\b(syntax|operator|keyword|built[\s-]?in|slice|slicing|list\s+comprehension|dict\s+comprehension|decorator|generator|lambda|regex|regular\s+expression|type\s+casting|string\s+methods?|math\s+formula|unit\s+conversion|quick\s+tip|recap|summary|5\s+minutes?|10\s+minutes?)\b/i;
  if (quickRegex.test(combinedText)) {
    // Unless the topic is explicitly a full course or end-to-end framework
    if (!/\b(full\s+course|complete\s+course|from\s+scratch|masterclass|bootcamp)\b/i.test(combinedText)) {
      return 'concept_quick';
    }
  }

  // 3. Hands-on Tutorial / Practical Demonstration: code-along, lab, live coding, step-by-step
  const practicalRegex = /\b(tutorial|how\s+to|hands[\s-]?on|code[\s-]?along|live\s+coding|step[\s-]?by[\s-]?step|walkthrough|practical|implementation|exercise|lab|demonstration|guide)\b/i;
  if (practicalRegex.test(combinedText)) {
    return 'hands_on_tutorial';
  }

  // 4. Comprehensive Course / Frontier Domain: Broad full-stack or multi-module foundational subject
  const comprehensiveRegex = /\b(full\s+course|complete\s+course|bootcamp|masterclass|zero\s+to\s+hero|a\s+to\s+z|from\s+scratch|comprehensive|all[\s-]?in[\s-]?one|complete\s+guide|100\s+days|entire\s+syllabus)\b/i;
  if (comprehensiveRegex.test(combinedText)) {
    return 'comprehensive_course';
  }

  // 5. Default to Concept Detailed (theoretical derivation, in-depth lecture, academic foundation)
  return 'concept_detailed';
}

/**
 * Calculates a 0–100 suitability score for video duration based on the detected learning objective intent.
 */
export function calculateDurationSuitability(
  durationMinutes: number,
  intent: LearningObjectiveIntent,
  preferences: DurationPreferenceMap = DEFAULT_DURATION_PREFERENCES
): number {
  const range = preferences[intent] || DEFAULT_DURATION_PREFERENCES.concept_detailed;
  const dur = Math.max(1, durationMinutes);

  // 1. Sweet spot: within target range
  if (dur >= range.targetMinMinutes && dur <= range.targetMaxMinutes) {
    return 100;
  }

  // 2. Acceptable lower bound: between minMinutes and targetMinMinutes
  if (dur >= range.minMinutes && dur < range.targetMinMinutes) {
    const fraction = (dur - range.minMinutes) / (range.targetMinMinutes - range.minMinutes || 1);
    return clampScore(75 + fraction * 25);
  }

  // 3. Acceptable upper bound: between targetMaxMinutes and maxMinutes
  if (dur > range.targetMaxMinutes && dur <= range.maxMinutes) {
    const fraction = (dur - range.targetMaxMinutes) / (range.maxMinutes - range.targetMaxMinutes || 1);
    return clampScore(100 - fraction * 20);
  }

  // 4. Too short penalty: less than minMinutes
  if (dur < range.minMinutes) {
    const deficitRatio = (range.minMinutes - dur) / range.minMinutes;
    if (intent === 'comprehensive_course' || intent === 'practical_project') {
      return clampScore(35 - deficitRatio * 25);
    }
    return clampScore(60 - deficitRatio * 35);
  }

  // 5. Too long penalty: greater than maxMinutes
  if (dur > range.maxMinutes) {
    if (intent === 'concept_quick') {
      const overageRatio = Math.min((dur - range.maxMinutes) / 30, 2);
      return clampScore(45 - overageRatio * 25);
    }
    if (intent === 'concept_detailed' || intent === 'hands_on_tutorial') {
      const overageRatio = Math.min((dur - range.maxMinutes) / 60, 2);
      return clampScore(75 - overageRatio * 20);
    }
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

  let score = 40;

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
