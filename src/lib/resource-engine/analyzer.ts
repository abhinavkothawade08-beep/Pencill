import {
  LearnerGoalInput,
  AnalyzedObjective,
  EducationalDomain,
  AcademicLevel,
  LearningStyle,
} from './types';

export function analyzeLearningGoal(input: Partial<LearnerGoalInput> & { topic: string }): AnalyzedObjective {
  const topic = input.topic.trim();
  const topicLower = topic.toLowerCase();

  // 1. Detect Domain
  const detectedDomain = detectDomain(topicLower, input.domain);

  // 2. Normalize Level
  const normalizedLevel = (input.level || 'intermediate') as AcademicLevel;

  // 3. Learning Style calibrated to teachingStyle preference if provided
  let effectiveStyle: LearningStyle = (input.learningStyle || 'balanced') as LearningStyle;
  if (input.teachingStyle === 'theory_first') {
    effectiveStyle = 'theory_focused';
  } else if (input.teachingStyle === 'practice_first') {
    effectiveStyle = 'practical_projects';
  } else if (input.teachingStyle === 'balanced') {
    effectiveStyle = 'balanced';
  }

  // 4. Derive Pedagogical Strategy based on Domain & Style
  const pedagogicalStrategy = derivePedagogicalStrategy(detectedDomain, effectiveStyle);

  // 5. Extract Core Concepts & Prerequisites
  const { coreConcepts: baseConcepts, prerequisites: basePrereqs } = extractConceptsAndPrerequisites(topicLower, detectedDomain);

  // Merge user-specified prerequisites if provided
  const prerequisites = Array.from(new Set([...(input.prerequisites || []), ...basePrereqs]));

  // Merge concepts from learning objectives if provided
  const objectiveWords = (input.learningObjectives || [])
    .map((o) => o.text.toLowerCase().split(/\s+/))
    .flat()
    .filter((w) => w.length > 3 && !['about', 'using', 'master', 'learn', 'understand', 'explain', 'apply'].includes(w));
  const coreConcepts = Array.from(new Set([...baseConcepts, ...objectiveWords]));

  return {
    primaryTopic: topic,
    detectedDomain,
    normalizedLevel,
    learningStyle: effectiveStyle,
    targetExam: input.targetExam || undefined,
    coreConcepts,
    prerequisites,
    pedagogicalStrategy,
  };
}

function detectDomain(topicLower: string, userSpecifiedDomain?: string): EducationalDomain {
  if (userSpecifiedDomain) {
    const d = userSpecifiedDomain.toLowerCase();
    if (d.includes('computer') || d.includes('programming') || d.includes('software')) return 'computer_science';
    if (d.includes('math')) return 'mathematics';
    if (d.includes('ai') || d.includes('data') || d.includes('machine learning')) return 'ai_and_data';
    if (d.includes('physic') || d.includes('chem') || d.includes('bio') || d.includes('science')) return 'natural_sciences';
    if (d.includes('engineer')) return 'engineering';
    if (d.includes('business') || d.includes('econ') || d.includes('finance')) return 'business_and_economics';
    if (d.includes('med') || d.includes('health') || d.includes('nurs')) return 'medicine_and_health';
  }

  // Keywords heuristics
  if (
    topicLower.includes('python') ||
    topicLower.includes('javascript') ||
    topicLower.includes('typescript') ||
    topicLower.includes('react') ||
    topicLower.includes('node') ||
    topicLower.includes('web dev') ||
    topicLower.includes('css') ||
    topicLower.includes('html') ||
    topicLower.includes('algorithm') ||
    topicLower.includes('data structure') ||
    topicLower.includes('sql') ||
    topicLower.includes('docker') ||
    topicLower.includes('git')
  ) {
    return 'computer_science';
  }

  if (
    topicLower.includes('machine learning') ||
    topicLower.includes('deep learning') ||
    topicLower.includes('large language model') ||
    topicLower.includes('llm') ||
    topicLower.includes('transformer') ||
    topicLower.includes('rag') ||
    topicLower.includes('retrieval-augmented') ||
    topicLower.includes('retrieval augmented') ||
    topicLower.includes('vector search') ||
    topicLower.includes('embedding') ||
    topicLower.includes('nlp') ||
    topicLower.includes('neural network') ||
    topicLower.includes('computer vision') ||
    topicLower.includes('data science')
  ) {
    return 'ai_and_data';
  }

  if (
    topicLower.includes('differential equation') ||
    topicLower.includes('calculus') ||
    topicLower.includes('linear algebra') ||
    topicLower.includes('matrix') ||
    topicLower.includes('probability') ||
    topicLower.includes('statistics') ||
    topicLower.includes('geometry') ||
    topicLower.includes('discrete math') ||
    topicLower.includes('trigonometry')
  ) {
    return 'mathematics';
  }

  if (
    topicLower.includes('physics') ||
    topicLower.includes('mechanics') ||
    topicLower.includes('thermodynamics') ||
    topicLower.includes('electromagnetism') ||
    topicLower.includes('chemistry') ||
    topicLower.includes('biology') ||
    topicLower.includes('organic chemistry') ||
    topicLower.includes('genetics') ||
    topicLower.includes('kinematics')
  ) {
    return 'natural_sciences';
  }

  if (
    topicLower.includes('circuits') ||
    topicLower.includes('signal processing') ||
    topicLower.includes('mechanical') ||
    topicLower.includes('aerospace') ||
    topicLower.includes('robotics') ||
    topicLower.includes('control system')
  ) {
    return 'engineering';
  }

  if (
    topicLower.includes('finance') ||
    topicLower.includes('accounting') ||
    topicLower.includes('macroeconomics') ||
    topicLower.includes('microeconomics') ||
    topicLower.includes('investing')
  ) {
    return 'business_and_economics';
  }

  return 'general';
}

function derivePedagogicalStrategy(
  domain: EducationalDomain,
  style: LearningStyle
): AnalyzedObjective['pedagogicalStrategy'] {
  if (domain === 'computer_science') {
    return {
      videoEmphasis: style === 'theory_focused' ? 'comprehensive_tutorials' : 'practical_coding',
      readingEmphasis: 'official_docs',
      practiceEmphasis: 'code_challenges',
    };
  }

  if (domain === 'mathematics') {
    return {
      videoEmphasis: 'worked_derivations',
      readingEmphasis: 'academic_textbooks',
      practiceEmphasis: 'numerical_problems',
    };
  }

  if (domain === 'ai_and_data') {
    return {
      videoEmphasis: style === 'practical_projects' ? 'practical_coding' : 'comprehensive_tutorials',
      readingEmphasis: style === 'theory_focused' ? 'research_papers' : 'official_docs',
      practiceEmphasis: style === 'theory_focused' ? 'conceptual_quizzes' : 'code_challenges',
    };
  }

  if (domain === 'natural_sciences') {
    return {
      videoEmphasis: 'foundational',
      readingEmphasis: 'academic_textbooks',
      practiceEmphasis: style === 'exam_preparation' ? 'exam_style_questions' : 'numerical_problems',
    };
  }

  return {
    videoEmphasis: 'foundational',
    readingEmphasis: 'general_handouts',
    practiceEmphasis: 'conceptual_quizzes',
  };
}

function extractConceptsAndPrerequisites(
  topicLower: string,
  domain: EducationalDomain
): { coreConcepts: string[]; prerequisites: string[] } {
  const words = topicLower.split(/\s+/).filter((w) => w.length > 2);
  const coreConcepts = Array.from(new Set(words));

  const prerequisites: string[] = [];
  if (domain === 'computer_science') {
    prerequisites.push('Basic computer literacy', 'Problem-solving logic');
  } else if (domain === 'ai_and_data') {
    prerequisites.push('Python programming basics', 'Introductory linear algebra and calculus');
  } else if (domain === 'mathematics') {
    prerequisites.push('Algebraic manipulation', 'Function notation and graphs');
  } else if (domain === 'natural_sciences') {
    prerequisites.push('High school mathematics', 'Scientific units and dimensional analysis');
  } else {
    prerequisites.push('General foundational knowledge in the domain');
  }

  return { coreConcepts, prerequisites };
}
