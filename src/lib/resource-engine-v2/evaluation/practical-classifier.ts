import {
  NormalizedResourceCandidate,
  ResourceCategory,
  ResourceCategorySchema,
  AnalyzedObjective,
} from '../types';

export interface PracticalEvidenceBreakdown {
  hasLiveCoding: boolean;
  hasCodeRepository: boolean;
  hasStepByStepImplementation: boolean;
  hasProjectBuilding: boolean;
  hasExerciseOrProblemSolving: boolean;
  hasCircuitOrLabExperiment: boolean;
  hasRealWorldCaseStudy: boolean;
  hasConceptualExposition: boolean;
  hasAdvancedOptimization: boolean;
  hasToolMention: boolean;
  hasChapterPracticalSteps: boolean;
  observedTools: string[];
}

export interface PracticalClassificationResult {
  primaryCategory: ResourceCategory;
  categoryScores: Record<ResourceCategory, number>; // 0 to 100
  confidence: number;                               // 0 to 1
  evidenceSignals: string[];
  uncertaintyReasons: string[];
  isSuperficialBuzzwordOnly: boolean;               // Buzzword in title without corroborating evidence
  practicalQualityScore: number;                    // 0 to 100 measure of practical rigor
  demonstrationFidelity: 'none' | 'low' | 'medium' | 'high';
  breakdown: PracticalEvidenceBreakdown;
}

export class PracticalResourceClassifier {
  /**
   * Deterministically evaluates and classifies a resource candidate into one of the 6 canonical categories:
   * 1. Conceptual Explanation
   * 2. Practical Tutorial / Hands-on Implementation
   * 3. Guided Exercise / Problem Solving
   * 4. Project-Based Learning
   * 5. Real-World Application / Case Study
   * 6. Advanced Implementation / Optimization
   *
   * Operates entirely offline with zero external API calls or LLM dependencies.
   */
  public classify(
    candidate: NormalizedResourceCandidate,
    objective?: AnalyzedObjective
  ): PracticalClassificationResult {
    const titleLower = candidate.title.toLowerCase();
    const descLower = (candidate.description || '').toLowerCase();
    const combined = `${titleLower} ${descLower}`;
    const durationSec = candidate.durationSeconds;
    const isUltraShort = durationSec !== undefined && durationSec < 180;

    const evidenceSignals: string[] = [];
    const uncertaintyReasons: string[] = [];
    const observedTools: string[] = [];

    // -------------------------------------------------------------
    // 1. Tool, IDE, and Environment Detection
    // -------------------------------------------------------------
    const toolPatterns: Array<{ name: string; pattern: RegExp }> = [
      { name: 'VS Code', pattern: /\bvs\s*code|visual\s*studio\s*code\b/i },
      { name: 'PyCharm', pattern: /\bpycharm\b/i },
      { name: 'Jupyter', pattern: /\bjupyter|colab\b/i },
      { name: 'Terminal / CLI', pattern: /\bterminal|command\s*line|bash|zsh|powershell|cmd\b/i },
      { name: 'Postman', pattern: /\bpostman\b/i },
      { name: 'cURL', pattern: /\bcurl\b/i },
      { name: 'Git / GitHub', pattern: /\bgit(hub)?|gitlab|clone\b/i },
      { name: 'Docker', pattern: /\bdocker|container\b/i },
      { name: 'Breadboard', pattern: /\bbreadboard\b/i },
      { name: 'Oscilloscope', pattern: /\boscilloscope\b/i },
      { name: 'Multimeter', pattern: /\bmultimeter\b/i },
      { name: 'SPICE Simulator', pattern: /\b(lt)?spice|multisim|tinkercad|proteus|falstad\b/i },
      { name: 'Op-Amp IC', pattern: /\blm741|tl072|ne5532|op[- ]?amp\s*ic\b/i },
    ];

    for (const tp of toolPatterns) {
      if (tp.pattern.test(combined)) {
        observedTools.push(tp.name);
      }
    }

    const hasToolMention = observedTools.length > 0;
    if (hasToolMention) {
      evidenceSignals.push(`Observed practical tools/hardware: ${observedTools.join(', ')}`);
    }

    // -------------------------------------------------------------
    // 2. Feature Detection Across Canonical Categories
    // -------------------------------------------------------------

    // A. Code Repository link
    const hasCodeRepository = /github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+/i.test(descLower) ||
      /gitlab\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+/i.test(descLower) ||
      /replit\.com\/@/i.test(descLower) ||
      /codesandbox\.io\/s\//i.test(descLower);

    if (hasCodeRepository) {
      evidenceSignals.push('Links to an active public code repository');
    }

    // B. Live Coding / Code Walkthrough
    const liveCodingPatterns = [
      /\b(live\s*coding|code[- ]along|coding\s*tutorial|coding\s*walkthrough|let's\s*code|write\s*(the)?\s*code|writing\s*code)\b/i,
      /\b(step\s*by\s*step\s*(coding|code|implementation)|syntax\s*walkthrough|code\s*explanation)\b/i,
      /\b(implementing\s*in\s*(python|c\+\+|java|javascript|typescript|rust|go))\b/i,
    ];
    const hasLiveCodingKeywords = liveCodingPatterns.some((p) => p.test(combined));
    const hasCodeKeywordsInDesc = /\b(def\s+[a-z_]|import\s+[a-z_]|function\s+[a-z_]|const\s+[a-z_]|class\s+[a-z_]|npm\s*install|pip\s*install)\b/i.test(descLower);
    const hasLiveCoding = hasLiveCodingKeywords || (hasCodeRepository && hasCodeKeywordsInDesc);

    if (hasLiveCoding) {
      evidenceSignals.push('Contains live coding walkthrough and software implementation pedagogy');
    }

    // C. Step-by-Step Implementation
    const stepPatterns = [
      /\bstep\s*by\s*step\b/i,
      /\bwalkthrough\b/i,
      /\bhow\s*to\s*(build|implement|create|code|wire|simulate)\b/i,
      /\bfrom\s*scratch\b/i,
    ];
    const hasStepByStepImplementation = stepPatterns.some((p) => p.test(combined));

    // D. Project Building
    const projectPatterns = [
      /\b(build|building|create|creating|develop|developing)\b.*(app|application|project|system|tool|clone|bot|api|game)/i,
      /\b(mini[- ]?project|capstone|hands-on\s*project|full[- ]?stack\s*project|portfolio\s*project)\b/i,
      /\bcomplete\s*project\s*tutorial\b/i,
    ];
    const hasProjectBuilding = projectPatterns.some((p) => p.test(combined)) && !isUltraShort;
    if (hasProjectBuilding) {
      evidenceSignals.push('End-to-end practical project construction detected');
    }

    // E. Guided Exercise / Problem Solving
    const exercisePatterns = [
      /\b(solved\s*problems?|practice\s*problems?|coding\s*exercises?|exercise\s*solutions?)\b/i,
      /\b(leetcode|hackerrank|codeforces|interview\s*questions?|problem\s*walkthrough)\b/i,
      /\b(step\s*by\s*step\s*(solutions?|proof|derivations?)|problem\s*set\s*solutions?|numerical\s*problems?)\b/i,
      /\b(pyqs?|previous\s*years?\s*questions?|practice\s*questions?|board\s*exam\s*problems?)\b/i,
      /\b(circuit\s*analysis\s*problems?|calculating\s*(gain|voltage|resistance)|solved\s*examples?)\b/i,
    ];
    const hasExerciseOrProblemSolving = exercisePatterns.some((p) => p.test(combined));
    if (hasExerciseOrProblemSolving) {
      evidenceSignals.push('Explicit problem-solving pedagogy and exercise walkthrough detected');
    }

    // F. Circuit & Laboratory Experiment
    const circuitPatterns = [
      /\b(breadboard|circuit\s*hookup|oscilloscope\s*(measurement|demo|reading)|multimeter\s*test)\b/i,
      /\b(circuit\s*simulation|(lt)?spice\s*simulation|tinkercad\s*circuits?|wiring\s*diagram)\b/i,
      /\b(laboratory\s*experiment|hardware\s*demonstration|component\s*level\s*testing)\b/i,
      /\b(op[- ]?amp\s*(on\s*breadboard|inverting|non[- ]?inverting|gain\s*experiment))\b/i,
    ];
    const hasCircuitOrLabExperiment = circuitPatterns.some((p) => p.test(combined));
    if (hasCircuitOrLabExperiment) {
      evidenceSignals.push('Hardware breadboard, laboratory experiment, or circuit simulation detected');
    }

    // G. Real-World Application / Case Study
    const realWorldPatterns = [
      /\b(real[- ]world\s*(applications?|examples?|case\s*study|scenarios?))\b/i,
      /\b(industry\s*(use\s*case|applications?|standards?)|in\s*production|production\s*deployment)\b/i,
      /\b(automation\s*(script|project)|practical\s*use\s*cases?|telemetry|troubleshooting\s*in\s*production)\b/i,
      /\b(engineering\s*applications?|physical\s*applications?|modeling\s*real\s*systems)\b/i,
    ];
    const hasRealWorldCaseStudy = realWorldPatterns.some((p) => p.test(combined));
    if (hasRealWorldCaseStudy) {
      evidenceSignals.push('Real-world case study or industrial application context detected');
    }

    // H. Conceptual Exposition
    const conceptualPatterns = [
      /\b(what\s*is|how\s*does\s*it\s*work|concept(ual)?|theory|foundations?|principles?)\b/i,
      /\b(architecture\s*overview|mental\s*model|introduction|basics|deep\s*dive\s*theory|derivation|formal\s*proof)\b/i,
    ];
    const hasConceptualExposition = conceptualPatterns.some((p) => p.test(combined)) ||
      candidate.modality === 'monograph' ||
      candidate.modality === 'paper';

    // I. Advanced Optimization
    const optimizationPatterns = [
      /\b(optimization|performance\s*tuning|profiling|benchmarking|internals|under\s*the\s*hood)\b/i,
      /\b(bytecode|memory\s*leak|cache\s*locality|concurrency\s*pitfalls|big[- ]o\s*complexity)\b/i,
    ];
    const hasAdvancedOptimization = optimizationPatterns.some((p) => p.test(combined));
    if (hasAdvancedOptimization) {
      evidenceSignals.push('Advanced optimization, internals, or complexity analysis detected');
    }

    // J. Chapter Timestamp Semantic Steps
    let hasChapterPracticalSteps = false;
    const descLines = (candidate.description || '').split('\n');
    const timestampRegex = /\b\d{1,2}:\d{2}(:\d{2})?\b/;
    for (const line of descLines) {
      if (timestampRegex.test(line)) {
        if (/\b(setup|code|implement|function|loop|wiring|build|solve|problem|test|run|demo|simulation|benchmark)\b/i.test(line)) {
          hasChapterPracticalSteps = true;
          break;
        }
      }
    }
    if (hasChapterPracticalSteps) {
      evidenceSignals.push('Chapter timestamps include explicit implementation or exercise steps');
    }

    // -------------------------------------------------------------
    // 3. Buzzword Verification Guard
    // -------------------------------------------------------------
    const hasBuzzwordInTitle = /\b(practical|hands[- ]on|project)\b/i.test(titleLower);
    const hasSubstantiveEvidence = hasLiveCoding || hasCodeRepository || hasProjectBuilding ||
      hasCircuitOrLabExperiment || hasToolMention || hasChapterPracticalSteps ||
      (durationSec !== undefined && durationSec >= 600 && hasStepByStepImplementation);

    let isSuperficialBuzzwordOnly = false;
    if (hasBuzzwordInTitle && !hasSubstantiveEvidence) {
      isSuperficialBuzzwordOnly = true;
      uncertaintyReasons.push('Title contains practical buzzwords without corroborating structural evidence in description or chapters.');
    }
    if (isUltraShort && (hasLiveCodingKeywords || hasProjectBuilding)) {
      isSuperficialBuzzwordOnly = true;
      uncertaintyReasons.push(`Ultra-short duration (${durationSec}s) is insufficient for genuine hands-on tutorial or project construction.`);
    }

    // Missing description check
    if (!candidate.description || candidate.description.trim().length === 0) {
      uncertaintyReasons.push('Candidate lacks description metadata; classification relies entirely on title.');
    }

    // -------------------------------------------------------------
    // 4. Compute Category Evidence Scores (0-100 each)
    // -------------------------------------------------------------
    const categoryScores: Record<ResourceCategory, number> = {
      conceptual_explanation: 50,
      practical_tutorial: 20,
      guided_exercise: 20,
      project_based: 10,
      real_world_application: 15,
      advanced_optimization: 15,
    };

    // Conceptual Scoring
    if (hasConceptualExposition) categoryScores.conceptual_explanation += 35;
    if (/\b(explained|understanding|introduction|overview)\b/i.test(titleLower)) categoryScores.conceptual_explanation += 15;
    if (candidate.modality === 'monograph' || candidate.modality === 'paper') categoryScores.conceptual_explanation += 25;

    // Practical Tutorial Scoring
    if (!isSuperficialBuzzwordOnly) {
      if (hasLiveCoding) categoryScores.practical_tutorial += 40;
      if (hasCodeRepository) categoryScores.practical_tutorial += 25;
      if (hasCircuitOrLabExperiment) categoryScores.practical_tutorial += 45;
      if (hasToolMention) categoryScores.practical_tutorial += 15;
      if (hasChapterPracticalSteps) categoryScores.practical_tutorial += 15;
      if (hasStepByStepImplementation) categoryScores.practical_tutorial += 10;
      if (durationSec && durationSec >= 600 && durationSec <= 3600) categoryScores.practical_tutorial += 10;
    } else {
      categoryScores.practical_tutorial = Math.min(categoryScores.practical_tutorial, 30);
    }

    // Guided Exercise Scoring
    if (hasExerciseOrProblemSolving) {
      categoryScores.guided_exercise += 60;
      if (/\b(solved|solutions?|exercises?|practice\s*problems?|leetcode)\b/i.test(titleLower)) categoryScores.guided_exercise += 25;
      if (durationSec && durationSec >= 300 && durationSec <= 2400) categoryScores.guided_exercise += 15;
    }

    // Project-Based Scoring
    if (hasProjectBuilding && !isSuperficialBuzzwordOnly) {
      categoryScores.project_based += 65;
      if (hasCodeRepository) categoryScores.project_based += 15;
      if (durationSec && durationSec >= 1500) categoryScores.project_based += 15;
      if (/\b(full\s*stack|from\s*scratch|complete\s*project)\b/i.test(titleLower)) categoryScores.project_based += 15;
    }

    // Real-World Application Scoring
    if (hasRealWorldCaseStudy) {
      categoryScores.real_world_application += 65;
      if (/\b(real[- ]world|case\s*study|production|automation)\b/i.test(titleLower)) categoryScores.real_world_application += 20;
    }

    // Advanced Optimization Scoring
    if (hasAdvancedOptimization) {
      categoryScores.advanced_optimization += 65;
      if (/\b(optimization|internals|performance|profiling)\b/i.test(titleLower)) categoryScores.advanced_optimization += 20;
    }

    // Clamp all scores to 0-100
    for (const key of Object.keys(categoryScores) as ResourceCategory[]) {
      categoryScores[key] = Math.max(0, Math.min(100, Math.round(categoryScores[key])));
    }

    // -------------------------------------------------------------
    // 5. Select Primary Category
    // -------------------------------------------------------------
    let primaryCategory: ResourceCategory = 'conceptual_explanation';
    let highestScore = categoryScores.conceptual_explanation;

    // Ordered precedence if scores are close
    const categoryOrder: ResourceCategory[] = [
      'project_based',
      'guided_exercise',
      'practical_tutorial',
      'real_world_application',
      'advanced_optimization',
      'conceptual_explanation',
    ];

    for (const cat of categoryOrder) {
      if (categoryScores[cat] > highestScore && categoryScores[cat] >= 55) {
        highestScore = categoryScores[cat];
        primaryCategory = cat;
      }
    }

    // -------------------------------------------------------------
    // 6. Compute Practical Quality & Demonstration Fidelity
    // -------------------------------------------------------------
    let practicalQualityScore = 20;
    let demonstrationFidelity: PracticalClassificationResult['demonstrationFidelity'] = 'none';

    if (isSuperficialBuzzwordOnly) {
      practicalQualityScore = 25;
      demonstrationFidelity = 'low';
    } else if (hasLiveCoding && hasCodeRepository && hasChapterPracticalSteps) {
      practicalQualityScore = 95;
      demonstrationFidelity = 'high';
    } else if (hasCircuitOrLabExperiment && (hasToolMention || hasChapterPracticalSteps)) {
      practicalQualityScore = 95;
      demonstrationFidelity = 'high';
    } else if (hasProjectBuilding && hasCodeRepository) {
      practicalQualityScore = 92;
      demonstrationFidelity = 'high';
    } else if (hasLiveCoding || hasCircuitOrLabExperiment || (hasExerciseOrProblemSolving && hasCodeKeywordsInDesc)) {
      practicalQualityScore = 82;
      demonstrationFidelity = 'medium';
    } else if (hasExerciseOrProblemSolving || hasRealWorldCaseStudy || hasStepByStepImplementation) {
      practicalQualityScore = 70;
      demonstrationFidelity = 'medium';
    } else if (hasToolMention) {
      practicalQualityScore = 55;
      demonstrationFidelity = 'low';
    } else {
      practicalQualityScore = 30;
      demonstrationFidelity = 'none';
    }

    // Adjust confidence based on available metadata density
    let confidence = 0.85;
    if (uncertaintyReasons.length > 0) {
      confidence = Math.max(0.4, confidence - uncertaintyReasons.length * 0.15);
    }

    const breakdown: PracticalEvidenceBreakdown = {
      hasLiveCoding,
      hasCodeRepository,
      hasStepByStepImplementation,
      hasProjectBuilding,
      hasExerciseOrProblemSolving,
      hasCircuitOrLabExperiment,
      hasRealWorldCaseStudy,
      hasConceptualExposition,
      hasAdvancedOptimization,
      hasToolMention,
      hasChapterPracticalSteps,
      observedTools,
    };

    return {
      primaryCategory,
      categoryScores,
      confidence: Number(confidence.toFixed(2)),
      evidenceSignals,
      uncertaintyReasons,
      isSuperficialBuzzwordOnly,
      practicalQualityScore,
      demonstrationFidelity,
      breakdown,
    };
  }
}
