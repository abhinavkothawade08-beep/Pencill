import {
  CognitiveIntent,
  EducationalDomain,
  EvidenceStatus,
  ResourceCategory,
  PracticalEmphasis,
  LearningIntentProfile,
  CategoryTargetMix,
} from '../types';

export interface IntentClassificationResult {
  cognitiveIntent: CognitiveIntent;
  provenance: EvidenceStatus;
  confidence: number;
  rationale: string;
}

/**
 * Classifies the cognitive intent of a learning module based on textual, domain, and exam signals.
 */
export function classifyCognitiveIntent(context: {
  moduleTitle: string;
  moduleDescription?: string;
  domain: EducationalDomain;
  targetExam?: string;
  learnerDifficulty?: string;
  academicLevel?: string;
}): IntentClassificationResult {
  const { moduleTitle, moduleDescription, domain, targetExam } = context;

  const combinedText = `${moduleTitle} ${moduleDescription || ''}`.toLowerCase();

  // 1. Project Implementation Signals
  const projectPatterns = [
    /\b(build|building|create|creating|develop|developing)\b.*(app|application|project|system|tool|clone|from scratch)/i,
    /\b(mini[- ]?project|capstone|hands-on project|full[- ]?stack project)\b/i,
    /\bfrom scratch\b/i,
  ];
  for (const pattern of projectPatterns) {
    if (pattern.test(combinedText)) {
      return {
        cognitiveIntent: 'project_implementation',
        provenance: 'inferred_high',
        confidence: 0.9,
        rationale: 'Detected project construction terminology targeting end-to-end implementation',
      };
    }
  }

  // 2. Exam-Oriented Practice Signals
  const examKeywords = [
    'past paper', 'previous year', 'pyq', 'pyqs', 'sample paper',
    'marking scheme', 'board exam preparation', 'model questions',
    'exam questions', 'important questions',
  ];
  if (targetExam || examKeywords.some((kw) => combinedText.includes(kw))) {
    if (
      combinedText.includes('solve') ||
      combinedText.includes('questions') ||
      combinedText.includes('problems') ||
      combinedText.includes('pyq') ||
      combinedText.includes('exercises')
    ) {
      return {
        cognitiveIntent: 'exam_practice',
        provenance: 'inferred_high',
        confidence: 0.88,
        rationale: `Detected examination problem-solving intent aligned with ${targetExam || 'exam'} requirements`,
      };
    }
  }

  // 3. Worked Examples & Problem Solving Signals
  const workedExampleKeywords = [
    'worked example', 'worked examples', 'solved problems', 'step-by-step solutions',
    'practice problems', 'numerical problems', 'exercise solutions', 'problem solving',
  ];
  if (workedExampleKeywords.some((kw) => combinedText.includes(kw))) {
    return {
      cognitiveIntent: 'worked_examples',
      provenance: 'inferred_high',
      confidence: 0.85,
      rationale: 'Identified problem-solving exercises and worked demonstration patterns',
    };
  }

  // 4. Practical Demonstration & Lab Experiments
  const demoKeywords = [
    'experiment', 'lab demo', 'laboratory', 'practical demonstration',
    'simulation', 'apparatus', 'visual demonstration',
  ];
  if (demoKeywords.some((kw) => combinedText.includes(kw))) {
    return {
      cognitiveIntent: 'practical_demonstration',
      provenance: 'inferred_high',
      confidence: 0.85,
      rationale: 'Detected laboratory experiment or physical simulation context',
    };
  }

  // 5. In-Depth Conceptual & Derivations
  const inDepthKeywords = [
    'derivation', 'proof', 'mathematical formulation', 'rigorous',
    'deep dive', 'architecture', 'backpropagation', 'rotational dynamics',
    'laws of motion', 'theoretical foundations', 'in-depth',
  ];
  if (inDepthKeywords.some((kw) => combinedText.includes(kw))) {
    return {
      cognitiveIntent: 'in_depth_conceptual',
      provenance: 'inferred_high',
      confidence: 0.85,
      rationale: 'Detected theoretical derivation or deep structural mechanics terminology',
    };
  }

  // 6. Coding Walkthrough & Programming Implementation
  const codingKeywords = [
    'code-along', 'coding tutorial', 'syntax', 'implementation', 'hands-on',
    'script', 'programming in', 'pytorch', 'tensorflow', 'peft', 'lora', 'qlora',
  ];
  const isCodeDomain = domain === 'computer_science' || domain === 'data_science_ai';
  if (isCodeDomain && (codingKeywords.some((kw) => combinedText.includes(kw)) || combinedText.includes('variables') || combinedText.includes('loop'))) {
    return {
      cognitiveIntent: 'coding_walkthrough',
      provenance: 'inferred_high',
      confidence: 0.85,
      rationale: 'Identified programming code-along walkthrough for software/AI concepts',
    };
  }

  // 7. Foundational Explanation (Default baseline for introductory material)
  const introKeywords = [
    'introduction', 'basics', 'fundamentals', 'overview', 'core concepts',
    'principles of', 'what is', 'getting started',
  ];
  if (introKeywords.some((kw) => combinedText.includes(kw))) {
    return {
      cognitiveIntent: 'conceptual_foundations',
      provenance: 'inferred_high',
      confidence: 0.85,
      rationale: 'Detected introductory or foundational concept explanation markers',
    };
  }

  // Domain-based default: Math / Physics leans toward in_depth_conceptual; CS toward coding_walkthrough; General toward conceptual_foundations
  if (domain === 'mathematics' || domain === 'physics') {
    return {
      cognitiveIntent: 'in_depth_conceptual',
      provenance: 'inferred_medium',
      confidence: 0.7,
      rationale: 'Defaulted to in-depth conceptual understanding based on analytical domain',
    };
  }

  if (domain === 'computer_science') {
    return {
      cognitiveIntent: 'coding_walkthrough',
      provenance: 'inferred_medium',
      confidence: 0.7,
      rationale: 'Defaulted to coding walkthrough based on computer science domain',
    };
  }

  return {
    cognitiveIntent: 'conceptual_foundations',
    provenance: 'fallback_default',
    confidence: 0.6,
    rationale: 'Defaulted to foundational conceptual explanation',
  };
}

/**
 * Classifies the full Learning-Intent Profile across the 6 canonical resource categories:
 * 1. Conceptual Explanation
 * 2. Practical Tutorial / Hands-on Implementation
 * 3. Guided Exercise / Problem Solving
 * 4. Project-Based Learning
 * 5. Real-World Application / Case Study
 * 6. Advanced Implementation / Optimization
 *
 * Dynamically adapts to topic domain and learning objectives without forcing every category onto every topic.
 */
export function classifyLearningIntentProfile(context: {
  moduleTitle?: string;
  moduleDescription?: string;
  rawTitle?: string;
  rawDescription?: string;
  primaryConcepts?: string[];
  domain: EducationalDomain;
  targetExam?: string;
  learnerDifficulty?: string;
  academicLevel?: string;
}): LearningIntentProfile {
  const { domain, targetExam } = context;
  const title = context.moduleTitle || context.rawTitle || '';
  const description = context.moduleDescription || context.rawDescription || '';
  const concepts = (context.primaryConcepts || []).join(' ');
  const combinedText = `${title} ${description} ${concepts}`.toLowerCase();

  // 1. Topic Nuance & Subject Identification
  const isPython = /\bpython\b/i.test(combinedText);
  const isWebDev = /\b(web\s*development|html|css|javascript|typescript|react|next\.?js|vue|angular|node\.?js|express|rest\s*api|graphql|crud|full\s*stack|backend|frontend)\b/i.test(combinedText);
  const isDSA = /\b(data\s*structures?|algorithms?|linked\s*lists?|binary\s*trees?|graphs?|dynamic\s*programming|recursion|sorting|hash\s*tables?|stack|queue|binary\s*search)\b/i.test(combinedText);
  const isElectronics = (domain === 'engineering' || domain === 'physics' || (domain as string).includes('electronic')) &&
    /\b(op[- ]?amp|operational\s*amplifier|transistor|bjt|mosfet|circuit|circuits|breadboard|oscilloscope|multimeter|resistor|capacitor|diode|logic\s*gates?|microcontroller|arduino|esp32|spice|tinkercad|analog\s*circuits?|digital\s*electronics)\b/i.test(combinedText);
  const isMathOrAnalytical = domain === 'mathematics' ||
    (domain === 'physics' && !isElectronics) ||
    ((domain === 'engineering' || domain === 'economics_commerce') && !isElectronics && /\b(differential\s*equations?|calculus|linear\s*algebra|derivatives?|integrals?|matrices|matrix|laplace|fourier|probability|statistics)\b/i.test(combinedText));
  const isAIorML = domain === 'data_science_ai' || /\b(machine\s*learning|deep\s*learning|neural\s*network|nlp|llm|transformers?|pytorch|tensorflow|fine[- ]tuning|lora|qlora)\b/i.test(combinedText);
  const isGeneralCS = domain === 'computer_science' && !isDSA && !isWebDev && !isPython;

  const isProjectRequested = /\b(build|building|create|creating|develop|developing)\b.*(app|application|project|system|tool|clone|from scratch)/i.test(combinedText) ||
    /\b(mini[- ]?project|capstone|hands-on project|full[- ]?stack project|portfolio project)\b/i.test(combinedText);
  const isExerciseRequested = /\b(exercises?|problems?|practice|solved|solutions?|pyq|exam prep|worked\s*examples?)\b/i.test(combinedText);
  const isRealWorldRequested = /\b(real[- ]world|case\s*study|production|industry|applications?|telemetry|automation)\b/i.test(combinedText);

  // 2. Identify Practical Tools & Technical Environment
  const technicalEnvironment: string[] = [];
  if (isPython) {
    technicalEnvironment.push('Python 3', 'VS Code', 'Python REPL / Terminal', 'Jupyter');
  } else if (isWebDev) {
    technicalEnvironment.push('JavaScript / TypeScript', 'VS Code', 'Browser DevTools', 'Postman / cURL');
  } else if (isDSA) {
    technicalEnvironment.push('Algorithm Visualizer', 'Code Implementation (Python/C++/Java)', 'LeetCode / Interview Drills');
  } else if (isElectronics) {
    technicalEnvironment.push('Circuit Simulation (SPICE / Tinkercad)', 'Breadboard Hardware', 'Oscilloscope / Multimeter', 'Op-Amp IC (LM741/TL072)');
  } else if (isAIorML) {
    technicalEnvironment.push('Python AI', 'PyTorch / HuggingFace', 'CUDA / GPU Environment', 'Jupyter Notebook');
  } else if (isMathOrAnalytical) {
    // Pure analytical modeling - zero forced coding!
    technicalEnvironment.push('Analytical Derivations', 'Step-by-Step Proofs', 'Solved Numerical Problems', 'Mathematical Modeling');
  } else if (isGeneralCS) {
    technicalEnvironment.push('Code Implementation', 'IDE / Terminal', 'Debugging Tools');
  } else {
    technicalEnvironment.push('Curriculum Conceptual Models', 'Worked Case Studies', 'Analytical Exercises');
  }

  // 3. Determine Practical Emphasis
  let practicalEmphasis: PracticalEmphasis = 'none';
  if (isProjectRequested) {
    practicalEmphasis = 'primary';
  } else if (isPython || isWebDev || isDSA || isElectronics || isAIorML || isGeneralCS) {
    practicalEmphasis = 'high';
  } else if (isMathOrAnalytical) {
    practicalEmphasis = 'none'; // Pure mathematical analysis, proofs, and derivations - zero forced programming
  } else if (domain === 'economics_commerce' || domain === 'chemistry' || domain === 'biology') {
    practicalEmphasis = 'moderate';
  } else {
    practicalEmphasis = 'none';
  }

  // 4. Construct Dynamic Category Mix
  const categoryMix: CategoryTargetMix[] = [];

  // Conceptual Explanation (Essential for pedagogical grounding across virtually all topics)
  categoryMix.push({
    category: 'conceptual_explanation',
    minCount: 1,
    preferredCount: 1,
    priority: 1,
    rationale: 'Core theoretical foundation, mental model, and pedagogical definition',
  });

  if (isPython) {
    categoryMix.push({
      category: 'practical_tutorial',
      minCount: 1,
      preferredCount: 1,
      priority: 1,
      rationale: 'Live coding walkthrough demonstrating syntax and execution in Python',
    });
    categoryMix.push({
      category: 'guided_exercise',
      minCount: 0,
      preferredCount: 1,
      priority: 2,
      rationale: 'Coding exercises and practice challenges with verified solutions',
    });
    categoryMix.push({
      category: 'project_based',
      minCount: 0,
      preferredCount: 1,
      priority: isProjectRequested ? 1 : 2,
      rationale: 'Practical project implementation (e.g. automation script, game, or mini-app)',
    });
    categoryMix.push({
      category: 'real_world_application',
      minCount: 0,
      preferredCount: 1,
      priority: 3,
      rationale: 'Real-world Python automation and industry applications',
    });
  } else if (isDSA) {
    categoryMix.push({
      category: 'practical_tutorial',
      minCount: 1,
      preferredCount: 1,
      priority: 1,
      rationale: 'Actual code implementation of data structure and operations in code',
    });
    categoryMix.push({
      category: 'guided_exercise',
      minCount: 1,
      preferredCount: 1,
      priority: 1,
      rationale: 'Coding interview problems and LeetCode problem walkthroughs',
    });
    categoryMix.push({
      category: 'advanced_optimization',
      minCount: 0,
      preferredCount: 1,
      priority: 2,
      rationale: 'Asymptotic complexity analysis (Big-O time/space) and memory trade-offs',
    });
  } else if (isElectronics) {
    categoryMix.push({
      category: 'practical_tutorial',
      minCount: 1,
      preferredCount: 1,
      priority: 1,
      rationale: 'Breadboard circuit construction, simulation demonstration, and oscilloscope measurement',
    });
    categoryMix.push({
      category: 'guided_exercise',
      minCount: 0,
      preferredCount: 1,
      priority: 2,
      rationale: 'Circuit analysis problems and step-by-step solved numericals',
    });
    categoryMix.push({
      category: 'real_world_application',
      minCount: 0,
      preferredCount: 1,
      priority: 2,
      rationale: 'Real-world audio pre-amplifier, sensor interfacing, and hardware case studies',
    });
  } else if (isMathOrAnalytical) {
    // Explicitly NO forced programming tutorials!
    categoryMix.push({
      category: 'guided_exercise',
      minCount: 1,
      preferredCount: 2,
      priority: 1,
      rationale: 'Step-by-step derivations, solved numerical problems, and analytical exercise walkthroughs',
    });
    categoryMix.push({
      category: 'real_world_application',
      minCount: 0,
      preferredCount: 1,
      priority: 2,
      rationale: 'Real-world engineering applications (mechanical vibrations, circuit modeling, physical systems)',
    });
  } else if (isWebDev) {
    categoryMix.push({
      category: 'practical_tutorial',
      minCount: 1,
      preferredCount: 1,
      priority: 1,
      rationale: 'Hands-on API implementation, request routing, and backend/frontend coding',
    });
    categoryMix.push({
      category: 'project_based',
      minCount: 0,
      preferredCount: 1,
      priority: isProjectRequested ? 1 : 2,
      rationale: 'Full application build from scratch including client, server, and database',
    });
    categoryMix.push({
      category: 'guided_exercise',
      minCount: 0,
      preferredCount: 1,
      priority: 2,
      rationale: 'API endpoint testing drills using Postman or cURL',
    });
    categoryMix.push({
      category: 'real_world_application',
      minCount: 0,
      preferredCount: 1,
      priority: 3,
      rationale: 'Production deployment, authentication middleware, and cloud hosting walkthrough',
    });
  } else if (isAIorML) {
    categoryMix.push({
      category: 'practical_tutorial',
      minCount: 1,
      preferredCount: 1,
      priority: 1,
      rationale: 'PyTorch / HuggingFace code walkthrough and hands-on model training/fine-tuning',
    });
    categoryMix.push({
      category: 'guided_exercise',
      minCount: 0,
      preferredCount: 1,
      priority: 2,
      rationale: 'Model evaluation drills, loss function tuning, and hyperparameter exercises',
    });
    categoryMix.push({
      category: 'real_world_application',
      minCount: 0,
      preferredCount: 1,
      priority: 2,
      rationale: 'Real-world production inference, deployment pipeline, and domain use case',
    });
  } else {
    // General academic / Humanities / Vocational
    categoryMix.push({
      category: 'guided_exercise',
      minCount: 0,
      preferredCount: 1,
      priority: 2,
      rationale: 'Applied problem-solving or analytical review questions',
    });
    categoryMix.push({
      category: 'real_world_application',
      minCount: 0,
      preferredCount: 1,
      priority: 2,
      rationale: 'Practical case study or empirical real-world example',
    });
  }

  // 5. Select Primary Category
  let primaryCategory: ResourceCategory = 'conceptual_explanation';
  if (isProjectRequested) {
    primaryCategory = 'project_based';
  } else if (isExerciseRequested) {
    primaryCategory = 'guided_exercise';
  } else if (isRealWorldRequested) {
    primaryCategory = 'real_world_application';
  } else if (isPython || isWebDev || isDSA || (isElectronics && !/\b(theory|derivation|principle)\b/i.test(combinedText))) {
    primaryCategory = 'practical_tutorial';
  } else {
    primaryCategory = 'conceptual_explanation';
  }

  const relevantCategories = Array.from(new Set(categoryMix.map((m) => m.category)));

  return {
    primaryCategory,
    relevantCategories,
    practicalEmphasis,
    categoryMix,
    technicalEnvironment,
    intentRationale: `Classified ${primaryCategory} with ${practicalEmphasis} practical emphasis across [${relevantCategories.join(', ')}]`,
  };
}
