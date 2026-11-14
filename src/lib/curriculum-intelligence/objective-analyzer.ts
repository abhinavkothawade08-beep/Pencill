import { LearnerGoalInput, EducationalDomain, AcademicLevel } from '../resource-engine/types';
import { ObjectiveAnalysis, TopicComplexity } from './types';
import { sanitizeInputObjectives, sanitizeInputSubtopics } from './topic-consistency-validator';

/**
 * Curated list of narrow, focused skills or single concepts that must NOT
 * be fragmented into artificial multiple modules.
 */
const NARROW_FOCUSED_TOPICS: readonly string[] = [
  'binary search',
  'linear search',
  'bubble sort',
  'quicksort',
  'quick sort',
  'merge sort',
  'heap sort',
  'breadth first search',
  'bfs',
  'depth first search',
  'dfs',
  'dijkstra',
  'dijkstra algorithm',
  'git rebase',
  'git interactive rebase',
  'interactive rebase',
  'rebase',
  'git merge',
  'git stash',
  'git cherry-pick',
  'python decorator',
  'python decorators',
  'decorator',
  'decorators',
  'generator',
  'generators',
  'list comprehension',
  'list comprehensions',
  'regex',
  'regular expression',
  'regular expressions',
  'docker compose',
  'dockerfile',
  'flexbox',
  'css flexbox',
  'css grid',
  'jwt',
  'json web token',
  'recursion',
  'two pointers',
  'sliding window',
  'sql joins',
  'database indexing',
  'b-tree index',
  'useeffect',
  'usestate',
  'react hook',
  'react hooks',
  'backpropagation',
  'gradient descent',
  'python loops',
  'for loop',
  'while loop',
  'python file handling',
  'file handling',
  'python exception handling',
  'exception handling',
  'python fundamentals',
  'python file i/o and exception handling',
];

/**
 * Keywords indicating a broad subject, full course, or multi-stage curriculum.
 * When present, a topic is NEVER classified as a narrow focused single concept.
 */
const BROAD_CURRICULUM_INDICATORS = [
  'masterclass',
  'complete',
  'full stack',
  'full-stack',
  'curriculum',
  'degree',
  'architecture',
  'engineering',
  'development',
  'systems',
  'comprehensive',
  'overview',
  'pipeline',
  'from scratch',
  'to advanced',
  'to production',
  'foundations and',
  'fundamentals and',
  'programming in',
  'programming with',
  'mastery',
];

/**
 * Determines whether a given topic represents a narrow, focused single concept.
 */
export function isNarrowFocusedTopic(topic: string): boolean {
  const t = topic.toLowerCase().trim();
  if (!t) return false;

  // Never narrow if topic explicitly signals broad scope or masterclass
  if (BROAD_CURRICULUM_INDICATORS.some((kw) => t.includes(kw))) {
    return false;
  }

  // Broad disciplines are never narrow
  if (
    /machine learning|deep learning|operating system|computer network|data structures and algorithms|artificial intelligence|web development|software engineering|organic chemistry|differential equation|real analysis|linear algebra|classical mechanics/i.test(
      t
    )
  ) {
    return false;
  }

  return NARROW_FOCUSED_TOPICS.some((kw) => {
    if (t === kw) return true;
    if (t === `${kw} in python` || t === `${kw} tutorial` || t === `learn ${kw}`) return true;
    // Word boundary match only if topic is short (<= 4 words)
    const words = t.split(/\s+/);
    if (words.length <= 4) {
      const regex = new RegExp(`\\b${kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
      return regex.test(t);
    }
    return false;
  });
}

/**
 * Determines whether a given topic represents a broad, comprehensive academic discipline.
 */
export function isComprehensiveSubject(topic: string, totalHours: number): boolean {
  const t = topic.toLowerCase().trim();
  if (isNarrowFocusedTopic(t)) return false;

  // Specific 4-module syllabi that should remain focused rather than expansive
  if (
    t.includes('ca final') ||
    t.includes('ind as') ||
    t.includes('financial reporting') ||
    t.includes('rag') ||
    t.includes('retrieval-augmented') ||
    t.includes('retrieval augmented')
  ) {
    return false;
  }

  return (
    totalHours >= 30 ||
    t.includes('computer science') ||
    t.includes('full stack') ||
    t.includes('full-stack') ||
    t.includes('machine learning') ||
    t.includes('deep learning') ||
    t.includes('artificial intelligence') ||
    t.includes('frontier ai') ||
    t.includes('data structures and algorithms') ||
    t.includes('dsa') ||
    t.includes('operating system') ||
    t.includes('computer network') ||
    t.includes('database management') ||
    t.includes('database system') ||
    t.includes('chartered accountancy') ||
    t.includes('mechanical engineering') ||
    t.includes('electrical engineering') ||
    t.includes('analog circuit') ||
    t.includes('classical mechanics') ||
    t.includes('organic chemistry') ||
    t.includes('differential equation') ||
    t.includes('real analysis') ||
    t.includes('calculus') ||
    t.includes('linear algebra') ||
    t.includes('jee advanced') ||
    t.includes('neet biology') ||
    t.includes('macroeconomics') ||
    t.includes('microeconomics') ||
    t.includes('cybersecurity') ||
    t.includes('cloud computing')
  );
}

/**
 * Evaluates the topic complexity level.
 */
export function evaluateTopicComplexity(topic: string, totalHours: number): TopicComplexity {
  if (isNarrowFocusedTopic(topic)) {
    return 'narrow_focused';
  }
  if (isComprehensiveSubject(topic, totalHours)) {
    return 'comprehensive';
  }
  return 'moderate';
}

/**
 * Determines domain from topic or explicit input with semantic priority.
 */
export function detectEducationalDomain(topic: string, explicitDomain?: string): EducationalDomain {
  const t = topic.toLowerCase();

  // Specific domain signatures take precedence over generic/mismatched container IDs
  if (/python|javascript|typescript|react|next\.?js|html|css|c\+\+|java|docker|kubernetes|git|sql|algorithm|data structure|web dev|operating system|os internals|kernel|computer network|networking|distributed system|dbms/i.test(t)) {
    return 'computer_science';
  }
  if (/machine learning|deep learning|neural network|nlp|llm|large language model|transformer|computer vision|data science|rag|retrieval/i.test(t)) {
    return 'ai_and_data';
  }
  if (/calculus|linear algebra|differential equation|real analysis|probability|statistics|discrete math|geometry|trigonometry|matrix|vector/i.test(t)) {
    return 'mathematics';
  }
  if (/physics|mechanics|quantum|optics|electromagnetism|thermodynamics|relativity|astrophysics|chemistry|organic|inorganic|biochemistry|molecular/i.test(t)) {
    return 'natural_sciences';
  }
  if (/circuit|analog|digital electronics|signal processing|embedded|vlsi|semiconductor|op-amp|transistor|mechanical|civil|robotics/i.test(t)) {
    return 'engineering';
  }
  if (/biology|genetics|cell|evolution|anatomy|physiology|neet/i.test(t)) {
    return 'medicine_and_health';
  }
  if (/finance|accounting|economics|financial reporting|ca final|ind as|investment|macroeconomics/i.test(t)) {
    return 'business_and_economics';
  }
  if (/public speaking|presentation|speech|rhetoric|debate|communication|oratory|storytelling|toastmaster|vocal/i.test(t)) {
    return 'general';
  }

  if (explicitDomain && explicitDomain !== 'general' && explicitDomain !== 'school-education') {
    return explicitDomain as EducationalDomain;
  }

  return 'general';
}

/**
 * Calculates target module count adhering to the core principle:
 * ONE COHERENT LEARNING UNIT = ONE MODULE.
 * 
 * Accurately scales module count according to the actual educational scope:
 * - Narrow focused single concepts / algorithms: exactly 1 module (or 2 if advanced depth or >10h)
 * - Focused single-skill topics: 1-2 modules
 * - Standard multi-concept topics: 3-5 modules
 * - Comprehensive academic subjects / disciplines: 4-6+ modules (up to 7-12 for large curricula)
 * - Never forces 1 module on broad subjects just because the user provided 1 topic tag.
 */
export function calculateRecommendedModuleCount(
  topic: string,
  academicLevel: AcademicLevel,
  totalHours: number,
  explicitTopics?: readonly string[]
): number {
  const topicLower = topic.toLowerCase().trim();

  // 1. Narrow focused single concept
  if (isNarrowFocusedTopic(topicLower)) {
    if (academicLevel === 'beginner' || totalHours <= 10) {
      return 1;
    }
    return 2;
  }

  // 2. Dedicated single-module focused skills
  if (
    /python loops|loops in python|for loop|while loop/i.test(topicLower) ||
    /file i\/o and exception|file handling and exception/i.test(topicLower)
  ) {
    return 1;
  }

  // 3. Dedicated established 4-module curricula
  if (
    topicLower.includes('rag') ||
    topicLower.includes('retrieval-augmented') ||
    topicLower.includes('retrieval augmented') ||
    topicLower.includes('financial reporting') ||
    topicLower.includes('ca final') ||
    topicLower.includes('ind as')
  ) {
    return 4;
  }

  // 4. Handle Explicit Topics if provided
  if (explicitTopics && explicitTopics.length > 0) {
    const unique = Array.from(new Set(explicitTopics.map((s) => s.trim()).filter(Boolean)));
    // If the explicit topic list is simply a single item matching the main topic or a broad discipline,
    // do NOT collapse to 1 module!
    const isSingleSelfReference =
      unique.length === 1 &&
      (unique[0].toLowerCase() === topicLower ||
        topicLower.includes(unique[0].toLowerCase()) ||
        unique[0].toLowerCase().includes(topicLower));

    if (!isSingleSelfReference) {
      const allAreNarrow = unique.length > 0 && unique.every((t) => isNarrowFocusedTopic(t));

      if (allAreNarrow) {
        if (unique.length <= 2) return 1;
        if (unique.length <= 6 && (topicLower.includes('fundamentals') || academicLevel === 'beginner')) {
          return totalHours <= 10 ? 1 : 2;
        }
        return Math.min(4, Math.max(1, Math.ceil(unique.length / 3)));
      }

      if (unique.length >= 3) {
        return Math.min(6, Math.max(3, Math.ceil(unique.length / 2)));
      }
    }
  }

  // 5. Comprehensive academic subjects
  if (isComprehensiveSubject(topicLower, totalHours)) {
    if (totalHours >= 60) return Math.min(12, Math.max(7, Math.round(totalHours / 8)));
    if (totalHours >= 40) return Math.min(8, Math.max(5, Math.round(totalHours / 7)));
    return Math.min(6, Math.max(4, Math.round(totalHours / 7)));
  }

  // 6. Moderate topics (3-5 modules)
  if (totalHours <= 10) {
    return Math.min(3, Math.max(2, Math.round(totalHours / 5)));
  }

  return Math.min(5, Math.max(3, Math.round(totalHours / 8)));
}

/**
 * Objective Analyzer: extracts learner objectives, classifies topic scope,
 * determines domain and prerequisite foundation.
 */
export function analyzeCurriculumObjective(input: LearnerGoalInput): ObjectiveAnalysis {
  const sanitizedTopic = input.topic.trim();
  const sanitizedObjectives = sanitizeInputObjectives(input.learningObjectives, sanitizedTopic);
  const sanitizedTopics = sanitizeInputSubtopics(input.topics, sanitizedTopic);

  const totalTargetHours = (input.weeklyStudyHours || 10) * (input.targetWeeks || 4);
  const detectedDomain = detectEducationalDomain(sanitizedTopic, input.domain);
  const normalizedLevel: AcademicLevel =
    input.level ||
    (input.depth === 'introductory'
      ? 'beginner'
      : input.depth === 'rigorous'
      ? 'advanced'
      : 'intermediate');

  const complexity = evaluateTopicComplexity(sanitizedTopic, totalTargetHours);
  const recommendedModuleCount = calculateRecommendedModuleCount(
    sanitizedTopic,
    normalizedLevel,
    totalTargetHours,
    sanitizedTopics
  );

  // Inferred prerequisites based on domain and topic
  const prerequisites: string[] = [];
  if (normalizedLevel === 'intermediate' || normalizedLevel === 'advanced') {
    prerequisites.push(`Foundational principles of ${sanitizedTopic}`);
  } else {
    prerequisites.push('Basic literacy in the discipline and general problem-solving ability');
  }

  const coreConcepts = sanitizedTopics.length > 0
    ? [...sanitizedTopics]
    : [sanitizedTopic];

  const targetAudienceSummary = `${normalizedLevel.toUpperCase()} learner focusing on ${sanitizedTopic} within ${detectedDomain}.`;

  return {
    topic: sanitizedTopic,
    detectedDomain,
    normalizedLevel,
    complexity,
    recommendedModuleCount,
    recommendedTotalHours: totalTargetHours,
    coreConcepts,
    prerequisites,
    targetAudienceSummary,
  };
}
