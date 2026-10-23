import {
  EngineResource,
  EngineResourceType,
  ContentType,
  QualityWeights,
  DetailedQualityScore,
  QualityEvidence,
  QualityScoringConfig,
  LearningObjectiveIntent,
  DurationPreferenceMap,
  PracticalLearningSignals,
} from '../types';
import { clampScore, calculateSourceAuthorityScore, calculateFreshnessScore } from '../utils/scoring-utils';
import { tokenize } from '../utils/text-utils';
import { extractJsonFromText } from '../utils/text-utils';
import { callGemini } from '@/services/ai/gemini/client';
import {
  inferLearningIntent,
  calculateDurationSuitability,
  extractPracticalLearningSignals,
} from './duration-manager';
import { DEFAULT_DURATION_PREFERENCES } from '../config/engine-config';

export const DEFAULT_QUALITY_CONFIG: QualityScoringConfig = {
  // Baseline specification weights
  defaultWeights: {
    topicRelevance: 0.30,
    contentDepth: 0.20,
    publisherCredibility: 0.15,
    educationalValue: 0.15,
    audioVisualQuality: 0.10,
    recency: 0.10,
  },
  // Adaptive weights per content type
  contentTypeWeights: {
    educational: {
      topicRelevance: 0.30,
      contentDepth: 0.25,
      publisherCredibility: 0.15,
      educationalValue: 0.20,
      audioVisualQuality: 0.05,
      recency: 0.05,
    },
    academic: {
      topicRelevance: 0.35,
      contentDepth: 0.30,
      publisherCredibility: 0.20,
      educationalValue: 0.15,
      audioVisualQuality: 0.00,
      recency: 0.00,
    },
    current_news: {
      topicRelevance: 0.30,
      recency: 0.25,
      publisherCredibility: 0.25,
      contentDepth: 0.10,
      educationalValue: 0.05,
      audioVisualQuality: 0.05,
    },
    documentary: {
      topicRelevance: 0.25,
      contentDepth: 0.25,
      publisherCredibility: 0.20,
      educationalValue: 0.20,
      audioVisualQuality: 0.05,
      recency: 0.05,
    },
    entertainment: {
      topicRelevance: 0.35,
      contentDepth: 0.15,
      audioVisualQuality: 0.20,
      educationalValue: 0.10,
      publisherCredibility: 0.10,
      recency: 0.10,
    },
  },
  minQualityThreshold: 55,
  durationPreferences: DEFAULT_DURATION_PREFERENCES,
};

export class QualityScoringEngine {
  private config: QualityScoringConfig;

  constructor(customConfig?: Partial<QualityScoringConfig>) {
    this.config = {
      ...DEFAULT_QUALITY_CONFIG,
      ...customConfig,
    };
  }

  /**
   * Determine content type based on topic keywords and options
   */
  detectContentType(topic: string, explicitType?: ContentType): ContentType {
    if (explicitType) return explicitType;
    const lower = topic.toLowerCase();
    if (/\b(news|current events|breaking|today|updates|weekly report)\b/.test(lower)) {
      return 'current_news';
    }
    if (/\b(documentary|biography|history of|origins of|chronicle|war)\b/.test(lower)) {
      return 'documentary';
    }
    if (/\b(music|funny|comedy|gaming|vlog|chill|relaxation|entertainment)\b/.test(lower)) {
      return 'entertainment';
    }
    return 'educational';
  }

  /**
   * Evaluates a single resource using verifiable evidence
   */
  evaluateResource(
    resource: EngineResource,
    topic: string,
    contentType: ContentType = 'educational',
    customWeights?: Partial<QualityWeights>,
    evaluationContext?: {
      intent?: LearningObjectiveIntent;
      objective?: string;
      difficulty?: string;
      moduleTitle?: string;
    }
  ): DetailedQualityScore {
    const isDoc = isDocumentResource(resource.type);
    const weights: QualityWeights = isDoc
      ? {
          topicRelevance: 0.35,
          educationalValue: 0.25,
          publisherCredibility: 0.20,
          contentDepth: 0.15,
          recency: 0.05,
          audioVisualQuality: 0.0,
          ...customWeights,
        }
      : {
          ...(this.config.contentTypeWeights[contentType] || this.config.defaultWeights),
          ...customWeights,
        };

    const evidence = this.extractEvidence(resource);

    // Inferred or provided learning intent for duration calibration
    const intent = evaluationContext?.intent || inferLearningIntent({
      topic,
      moduleTitle: evaluationContext?.moduleTitle,
      moduleObjective: evaluationContext?.objective,
      difficulty: evaluationContext?.difficulty,
    });

    // Practical learning signals (hands-on code walkthrough, projects, step-by-step)
    const practicalSignals = extractPracticalLearningSignals(
      resource.title,
      resource.description,
      resource.tags
    );

    // Duration suitability against pedagogical objective
    const durationSuitability = calculateDurationSuitability(
      resource.durationMinutes,
      intent,
      this.config.durationPreferences
    );

    resource.durationSuitabilityScore = durationSuitability;
    resource.practicalDepthScore = practicalSignals.signalScore;
    resource.learningIntent = intent;

    // 1. Topic Relevance (30-35%)
    const topicRelevance = this.computeTopicRelevance(resource, topic, evidence);

    // 2. Content Depth and Usefulness (15-25%)
    const contentDepth = this.computeContentDepth(
      resource,
      evidence,
      contentType,
      intent,
      practicalSignals,
      durationSuitability
    );

    // 3. Publisher Credibility Indicators (15-20%)
    const publisherCredibility = this.computePublisherCredibility(resource);

    // 4. Educational / Informational Value (15%)
    const educationalValue = this.computeEducationalValue(
      resource,
      evidence,
      topicRelevance,
      practicalSignals
    );

    // 5. Verifiable Audio and Visual Quality (10%)
    const audioVisualQuality = this.computeAudioVisualQuality(resource, evidence);

    // 6. Recency when relevant (10%)
    const recency = this.computeRecency(resource, contentType, topic);

    // Composite weighted score calculation
    const overall = clampScore(
      topicRelevance * weights.topicRelevance +
      contentDepth * weights.contentDepth +
      publisherCredibility * weights.publisherCredibility +
      educationalValue * weights.educationalValue +
      audioVisualQuality * weights.audioVisualQuality +
      recency * weights.recency
    );

    const explanation = this.formulateExplanation({
      resource,
      contentType,
      overall,
      topicRelevance,
      publisherCredibility,
      contentDepth,
      evidence,
      practicalSignals,
    });

    return {
      overall,
      topicRelevance,
      contentDepth,
      publisherCredibility,
      educationalValue,
      audioVisualQuality,
      recency,
      durationSuitability,
      practicalDepth: practicalSignals.signalScore,
      practicalSignals,
      weightsUsed: weights,
      evidence,
      explanation,
      contentType,
    };
  }

  /**
   * Filters and sorts candidate resources against the acceptance threshold
   */
  filterAndScoreBatch(
    resources: EngineResource[],
    topic: string,
    contentType: ContentType = 'educational',
    minThreshold = this.config.minQualityThreshold,
    evaluationContext?: {
      intent?: LearningObjectiveIntent;
      objective?: string;
      difficulty?: string;
      moduleTitle?: string;
    }
  ): Array<{ resource: EngineResource; score: DetailedQualityScore }> {
    const scoredList: Array<{ resource: EngineResource; score: DetailedQualityScore }> = [];

    for (const res of resources) {
      const score = this.evaluateResource(res, topic, contentType, undefined, evaluationContext);
      // Synchronize back onto EngineResource score object
      res.score = {
        overall: score.overall,
        relevance: score.topicRelevance,
        educationalValue: score.educationalValue,
        structureCompleteness: score.contentDepth,
        freshness: score.recency,
        durationSuitability: score.durationSuitability,
        practicalDepth: score.practicalDepth,
        explanation: score.explanation,
      };

      // Reject resources below acceptance threshold or off-topic (relevance < 45)
      if (score.overall >= minThreshold && score.topicRelevance >= 45) {
        scoredList.push({ resource: res, score });
      } else {
        const itemKind = isDocumentResource(res.type) ? 'document' : 'video';
        console.info(
          `[QualityScoringEngine] Rejected ${itemKind} "${res.title}" (Score: ${score.overall}/${minThreshold}, Relevance: ${score.topicRelevance})`
        );
      }
    }

    // Sort descending by overall quality score
    return scoredList.sort((a, b) => b.score.overall - a.score.overall);
  }

  /**
   * Batch evaluate with optional Gemini enrichment when API key is available
   */
  async evaluateBatchWithAi(
    resources: EngineResource[],
    topic: string,
    contentType: ContentType = 'educational'
  ): Promise<Array<{ resource: EngineResource; score: DetailedQualityScore }>> {
    // 1. Perform deterministic evidence evaluation first
    const evaluated = this.filterAndScoreBatch(resources, topic, contentType);

    if (!process.env.GEMINI_API_KEY || evaluated.length === 0) {
      return evaluated;
    }

    try {
      const prompt = `
You are the Senior Academic Video Sourcing & Quality Auditor at Pencill.
Evaluate the following candidate videos for the topic "${topic}" (${contentType} context).

Evidence available per candidate:
${JSON.stringify(
  evaluated.slice(0, 10).map((item) => ({
    id: item.resource.id,
    title: item.resource.title,
    author: item.resource.authorOrChannel,
    durationMinutes: item.resource.durationMinutes,
    descriptionExcerpt: (item.resource.description || '').slice(0, 280),
    hasCaptions: item.score.evidence.hasCaptionsOrTranscript,
    hasHd: item.score.evidence.hasHighDefinition,
    hasChapters: item.score.evidence.hasTimestampsOrChapters,
  })),
  null,
  2
)}

CRITICAL INSTRUCTIONS:
- Do not fabricate video statistics, transcripts, or claim to have watched the video.
- Rate Topic Relevance (0-100) based strictly on topic alignment and depth.
- Rate Content Depth (0-100) based on duration, presence of chapters/subtopics, and conceptual scope.
- Rate Educational Value (0-100) based on pedagogical structure and clarity.
- Output ONLY valid JSON array with matching IDs:
[
  {
    "id": "resource_id",
    "topicRelevance": 85,
    "contentDepth": 80,
    "educationalValue": 85,
    "conciseRationale": "Why this video is suited for this topic"
  }
]
`.trim();

      const aiResponse = await callGemini(prompt, undefined, {
        temperature: 0.1,
        timeoutMs: 12000,
        jsonMode: true,
      });

      const parsed = extractJsonFromText<
        Array<{
          id: string;
          topicRelevance: number;
          contentDepth: number;
          educationalValue: number;
          conciseRationale: string;
        }>
      >(aiResponse);

      if (Array.isArray(parsed)) {
        const aiMap = new Map(parsed.map((p) => [p.id, p]));
        for (const item of evaluated) {
          const aiData = aiMap.get(item.resource.id);
          if (aiData) {
            // Blend AI judgment (60%) with deterministic evidence (40%)
            item.score.topicRelevance = clampScore(
              item.score.topicRelevance * 0.4 + clampScore(aiData.topicRelevance) * 0.6
            );
            item.score.contentDepth = clampScore(
              item.score.contentDepth * 0.4 + clampScore(aiData.contentDepth) * 0.6
            );
            item.score.educationalValue = clampScore(
              item.score.educationalValue * 0.4 + clampScore(aiData.educationalValue) * 0.6
            );

            // Recompute overall
            const w = item.score.weightsUsed;
            item.score.overall = clampScore(
              item.score.topicRelevance * w.topicRelevance +
              item.score.contentDepth * w.contentDepth +
              item.score.publisherCredibility * w.publisherCredibility +
              item.score.educationalValue * w.educationalValue +
              item.score.audioVisualQuality * w.audioVisualQuality +
              item.score.recency * w.recency
            );

            if (aiData.conciseRationale) {
              item.score.explanation = aiData.conciseRationale;
            }

            // Update resource score
            item.resource.score.overall = item.score.overall;
            item.resource.score.relevance = item.score.topicRelevance;
            item.resource.score.educationalValue = item.score.educationalValue;
            item.resource.score.structureCompleteness = item.score.contentDepth;
            item.resource.score.explanation = item.score.explanation;
          }
        }
      }
    } catch {
      // Fallback cleanly to evidence-based deterministic scoring
    }

    // Re-filter candidates after AI evaluation so candidates scored low by AI are rejected
    const minThreshold = this.config.minQualityThreshold;
    const finalFiltered = evaluated.filter((item) => {
      const passes = item.score.overall >= minThreshold && item.score.topicRelevance >= 45;
      if (!passes) {
        console.info(
          `[QualityScoringEngine] Rejected candidate "${item.resource.title}" (Score: ${item.score.overall}/${minThreshold}, Relevance: ${item.score.topicRelevance})`
        );
      }
      return passes;
    });

    return finalFiltered.sort((a, b) => b.score.overall - a.score.overall);
  }

  // --- PRIVATE EVALUATION HELPERS ---

  private extractEvidence(resource: EngineResource): QualityEvidence {
    const meta = resource.metadata || {};
    const uncertaintyReasons: string[] = [];

    const isEmbeddable = meta.isEmbeddable !== false;
    const hasHighDefinition = meta.definition === 'hd' || resource.title.toLowerCase().includes('[hd]') || resource.title.toLowerCase().includes('4k');
    const hasCaptionsOrTranscript = meta.hasCaptions === true || meta.hasCaptions === 'true';
    const desc = resource.description || '';
    const hasDetailedDescription = desc.trim().length >= 100;
    const hasTimestampsOrChapters = /(?:\d{1,2}:\d{2})/g.test(desc);

    let evidenceScore = 0;
    if (hasDetailedDescription) evidenceScore++;
    else uncertaintyReasons.push('Description is minimal or missing; syllabus alignment estimated from title and tags');

    if (hasCaptionsOrTranscript) evidenceScore++;
    else uncertaintyReasons.push('No verified captions or transcript detected; speech clarity unmeasured');

    if (hasTimestampsOrChapters) evidenceScore++;
    if (meta.definition) evidenceScore++;
    else uncertaintyReasons.push('Audio/visual bitrate unmeasured; visual fidelity estimated from platform baseline');

    let evidenceConfidence: 'high' | 'medium' | 'low' = 'medium';
    if (evidenceScore >= 3) evidenceConfidence = 'high';
    else if (evidenceScore <= 1) evidenceConfidence = 'low';

    return {
      hasCaptionsOrTranscript,
      hasHighDefinition,
      hasDetailedDescription,
      isEmbeddable,
      hasTimestampsOrChapters,
      durationMinutes: resource.durationMinutes || 20,
      evidenceConfidence,
      uncertaintyReasons,
    };
  }

  private computeTopicRelevance(
    resource: EngineResource,
    topic: string,
    evidence: QualityEvidence
  ): number {
    const rawTopicTokens = Array.from(tokenize(topic));
    if (rawTopicTokens.length === 0) return 70;

    const GENERIC_STOP_WORDS = new Set([
      'the', 'and', 'for', 'with', 'from', 'into', 'about', 'module', 'lesson', 'chapter', 'unit',
      'course', 'lecture', 'tutorial', 'introduction', 'intro', 'basics', 'basic', 'advanced',
      'mastery', 'overview', 'principles', 'methods', 'foundations', 'understanding', 'guide',
      'explained', 'crash', 'review', 'part', 'full', 'complete', 'comprehensive', 'deep', 'dive',
      'learn', 'how', 'what', 'why', 'in', 'of', 'to', 'a', 'an', 'is', 'are', 'on', 'at', 'by',
      'using', 'applied', 'practical', 'study', 'video', 'class', 'series', 'system', 'systems'
    ]);

    const focalTokens = rawTopicTokens.filter((tok) => !GENERIC_STOP_WORDS.has(tok) && tok.length > 2);
    const effectiveTokens = focalTokens.length > 0 ? new Set(focalTokens) : tokenize(topic);
    const focalList = Array.from(effectiveTokens);
    // Identify primary anchor tokens (the main subject phrase, typically first 3-5 terms)
    const primaryAnchorTokens = new Set(focalList.slice(0, Math.min(5, focalList.length)));

    const titleTokens = tokenize(resource.title);
    const descTokens = tokenize(resource.description || '');
    const tagTokens = new Set(resource.tags?.map((t) => t.toLowerCase()) || []);

    let titleMatches = 0;
    let primaryTitleMatches = 0;
    let descMatches = 0;
    let tagMatches = 0;

    for (const tok of effectiveTokens) {
      if (titleTokens.has(tok)) {
        titleMatches++;
        if (primaryAnchorTokens.has(tok)) primaryTitleMatches++;
      }
      if (descTokens.has(tok)) descMatches++;
      if (tagTokens.has(tok)) tagMatches++;
    }

    // Effective title ratio handles both concise topics and multi-concept module strings
    const effectiveTitleRatio = Math.max(
      titleMatches / Math.max(Math.min(effectiveTokens.size, 5), 1),
      primaryTitleMatches / Math.max(primaryAnchorTokens.size, 1)
    );
    const descRatio = descMatches / Math.max(effectiveTokens.size, 1);
    const tagRatio = tagMatches / Math.max(effectiveTokens.size, 1);

    // Comprehensive domain subtopics for both foundational and emerging technical domains
    const DOMAIN_SUBTOPICS: Record<string, string[]> = {
      rotat: ['torque', 'angular', 'inertia', 'gyroscope', 'precession', 'rigid body', 'axis', 'flywheel'],
      kinemat: ['velocity', 'acceleration', 'displacement', 'trajectory', 'projectile', 'speed', 'vector'],
      thermo: ['entropy', 'enthalpy', 'carnot', 'heat', 'temperature', 'isothermal', 'adiabatic', 'kelvin'],
      electromag: ['coulomb', 'gauss', 'maxwell', 'faraday', 'lorentz', 'flux', 'solenoid', 'magnetic', 'electric'],
      calculus: ['derivative', 'integral', 'limit', 'continuity', 'differentiation', 'integration', 'leibniz', 'taylor'],
      organ: ['alkane', 'alkene', 'alcohol', 'isomer', 'reaction', 'nomenclature', 'iupac', 'functional group', 'carbonyl'],
      halo: ['haloalkane', 'haloarene', 'alkyl halide', 'aryl halide', 'sn1', 'sn2', 'nucleophilic substitution', 'elimination', 'saytzeff', 'grignard', 'sandmeyer', 'finkelstein', 'swarts', 'freon', 'chloroform', 'inversion', 'stereochemistry'],
      chem: ['haloalkane', 'haloarene', 'alkyl halide', 'aryl halide', 'sn1', 'sn2', 'nucleophilic', 'electrophilic', 'organic chemistry', 'mechanism', 'preparation', 'reagent'],
      diffus: ['diffusion', 'ddpm', 'denoising', 'score-based', 'latent diffusion', 'stable diffusion', 'unet', 'sde', 'noise schedule', 'markov'],
      peft: ['lora', 'qlora', 'peft', 'adapter', 'prefix tuning', 'prompt tuning', 'parameter efficient'],
      lora: ['low-rank', 'rank', 'alpha', 'qlora', 'nf4', 'quantization', 'adapter'],
      attention: ['transformer', 'self-attention', 'multi-head', 'encoder', 'decoder', 'residual', 'layernorm', 'kv-cache'],
      transformer: ['self-attention', 'multi-head', 'encoder', 'decoder', 'feed forward', 'bert', 'gpt', 'tokenization'],
      llm: ['large language model', 'prompt', 'context window', 'tokenizer', 'hallucination', 'instruction tuning', 'rag', 'vector database'],
      alignment: ['rlhf', 'dpo', 'reward model', 'ppo', 'preference optimization', 'constitutional ai', 'safety'],
      dsa: ['linked list', 'binary search', 'heap', 'stack', 'queue', 'graph', 'tree', 'dynamic programming', 'recursion', 'dijkstra', 'big-o'],
      machine_learning: ['regression', 'classification', 'gradient descent', 'neural network', 'backprop', 'loss', 'xgboost', 'svm', 'clustering', 'k-means'],
      deep_learning: ['backpropagation', 'activation function', 'convolution', 'recurrent', 'optimizer', 'adam', 'dropout', 'batchnorm'],
      computer_vision: ['convolution', 'cnn', 'resnet', 'yolo', 'segmentation', 'object detection', 'feature map'],
      quantum: ['qubit', 'superposition', 'entanglement', 'bloch sphere', 'hadamard', 'quantum circuit', 'quantum computing'],
      web: ['react', 'next.js', 'server components', 'api route', 'ssr', 'csr', 'typescript', 'tailwind'],
    };

    let subtopicMatches = 0;
    const combinedCandidateText = `${resource.title} ${resource.description}`.toLowerCase();
    for (const [key, subtopics] of Object.entries(DOMAIN_SUBTOPICS)) {
      const topicMatchesKey = Array.from(effectiveTokens).some((t) => t.includes(key) || key.includes(t));
      if (topicMatchesKey) {
        for (const sub of subtopics) {
          if (combinedCandidateText.includes(sub)) {
            subtopicMatches++;
          }
        }
      }
    }

    // Strict validation: if title has zero focal matches and description has zero or only 1 incidental match
    if (titleMatches === 0) {
      if (descMatches === 0 && tagMatches === 0) {
        if (subtopicMatches >= 2) {
          return clampScore(Math.min(75, 45 + subtopicMatches * 10));
        }
        return 15; // Clearly unrelated
      }
      if (descMatches <= 1 && tagMatches === 0) {
        if (subtopicMatches >= 1) {
          return clampScore(Math.min(75, 50 + subtopicMatches * 10));
        }
        return 20; // Incidental mention only
      }
      // Description overlap without title match is capped at 45 (or up to 70 with domain subtopics)
      const subtopicBoost = subtopicMatches * 8;
      return clampScore(Math.min(70, descRatio * 50 + tagRatio * 20 + subtopicBoost));
    }

    // Title match provides strong signaling
    let baseRelevance = effectiveTitleRatio * 65 + descRatio * 20 + tagRatio * 10;
    if (subtopicMatches > 0) {
      baseRelevance += Math.min(20, subtopicMatches * 5);
    }

    // Bonus for phrase match in title (handles both full topic and key phrases)
    const lowerTitle = resource.title.toLowerCase();
    const lowerTopic = topic.toLowerCase().trim();
    if (lowerTitle.includes(lowerTopic)) {
      baseRelevance += 30;
    } else {
      // Check multi-word phrase fragments (e.g. "diffusion models", "rotational motion", "markov chain")
      const phrases = topic
        .split(/[,:;&|\n-]/)
        .map((p) => p.trim().toLowerCase())
        .filter((p) => p.length >= 6 && p.split(' ').length >= 2);
      for (const phrase of phrases) {
        if (lowerTitle.includes(phrase)) {
          baseRelevance += 25;
          break;
        }
      }
    }

    // Boost verified authoritative educational channels
    const AUTHORITATIVE_CHANNELS = [
      'stanford', 'mit opencourseware', '3blue1brown', 'statquest', 'andrej karpathy',
      'deeplearning.ai', 'freecodecamp', 'cs50', 'harvard', 'khan academy', 'ibm technology'
    ];
    const author = (resource.authorOrChannel || resource.sourceName || '').toLowerCase();
    if (AUTHORITATIVE_CHANNELS.some((ch) => author.includes(ch))) {
      baseRelevance += 12;
    }

    // Check for 20th century era alignment if topic specifies century
    if (topic.toLowerCase().includes('20th century')) {
      const yearMatch = `${resource.title} ${resource.description}`.match(/\b(19[0-9]{2})\b/);
      if (yearMatch) {
        titleMatches += 2;
        baseRelevance += 30;
      }
    }

    return clampScore(Math.min(98, 25 + baseRelevance));
  }


  private computeContentDepth(
    resource: EngineResource,
    evidence: QualityEvidence,
    contentType: ContentType,
    intent: LearningObjectiveIntent = 'concept_detailed',
    practicalSignals?: PracticalLearningSignals,
    durationSuitability: number = 85
  ): number {
    // Document / Study Notes depth logic
    if (isDocumentResource(resource.type)) {
      let docDepth = 65;
      if (evidence.hasDetailedDescription) docDepth += 10;
      if (resource.metadata?.isDirectPdf) docDepth += 15;
      const text = `${resource.title} ${resource.description}`.toLowerCase();
      if (/\b(derivation|proof|worked examples|step-by-step|solved problems|comprehensive|handout|notes|theorem)\b/.test(text)) {
        docDepth += 15;
      }
      return clampScore(docDepth);
    }

    let depth = 50;

    // Duration-based depth assessment for videos
    const dur = evidence.durationMinutes;
    if (contentType === 'educational' || contentType === 'documentary') {
      if (dur < 3) {
        depth -= 20; // Superficial teaser or snippet
      } else {
        // Continuous, intent-grounded duration suitability scoring
        // Maps durationSuitability (0-100) into depth component
        const suitabilityBonus = (durationSuitability / 100) * 26;
        depth += Math.round(suitabilityBonus);

        // Long-form depth bonus for comprehensive/hands-on content
        if (dur >= 20 && (intent === 'hands_on_tutorial' || intent === 'practical_project' || intent === 'comprehensive_course')) {
          depth += 4;
        }
      }
    } else {
      if (dur >= 3 && dur <= 25) depth += 20;
    }

    // Chapters / timestamps indicate organized, structured content
    if (evidence.hasTimestampsOrChapters) {
      depth += 15;
    }

    // Detailed description provides content outline
    if (evidence.hasDetailedDescription) {
      depth += 10;
    }

    // Practical learning signals indicator (hands-on code walkthrough, step-by-step implementation)
    if (practicalSignals && practicalSignals.signalScore >= 60) {
      depth += Math.min(12, Math.round((practicalSignals.signalScore - 50) * 0.25));
    }

    // Playlist or full course bonus (covers broad curriculum breadth)
    if (resource.type === 'youtube_playlist' || resource.type === 'full_course' || resource.metadata?.isComprehensive) {
      depth += 15;
    }

    return clampScore(depth);
  }

  private computePublisherCredibility(resource: EngineResource): number {
    let authorityScore = calculateSourceAuthorityScore(
      resource.canonicalUrl,
      resource.authorOrChannel
    );

    // Master Educator Directory Credibility Integration (Requirement 9)
    if (
      resource.discoverySource === 'curated_directory' ||
      resource.metadata?.discoverySource === 'curated_directory' ||
      resource.verificationStatus === 'VERIFIED'
    ) {
      authorityScore = Math.max(authorityScore, 95);
    } else if (resource.educatorId) {
      authorityScore = Math.max(authorityScore, 92);
    }

    return clampScore(authorityScore);
  }

  private computeEducationalValue(
    resource: EngineResource,
    evidence: QualityEvidence,
    topicRelevance: number,
    practicalSignals?: PracticalLearningSignals
  ): number {
    if (isDocumentResource(resource.type)) {
      let docEdVal = 65;
      if (topicRelevance >= 75) docEdVal += 15;
      const lower = `${resource.title} ${resource.description}`.toLowerCase();
      if (/\b(notes|lecture|handout|documentation|reference|axioms|theorems|exercises|practice)\b/.test(lower)) {
        docEdVal += 12;
      }
      if (resource.metadata?.isDirectPdf) docEdVal += 8;
      return clampScore(docEdVal);
    }

    let edVal = 55;

    // High relevance and organized outline correlate with high learning value
    if (topicRelevance >= 75) edVal += 15;
    if (evidence.hasTimestampsOrChapters) edVal += 15;
    if (evidence.hasCaptionsOrTranscript) edVal += 10; // Accessibility aids retention

    // Comprehensive course or complete playlist covering breadth
    if (resource.type === 'full_course' || resource.type === 'youtube_playlist' || resource.metadata?.isComprehensive) {
      edVal += 12;
    }

    const lowerTitle = resource.title.toLowerCase();
    if (/\b(derivation|proof|experiment|analysis|walkthrough|step-by-step|solved examples|lecture|full course|tutorial|hands[\s-]?on|project|complete implementation)\b/.test(lowerTitle)) {
      edVal += 10;
    }

    // Practical learning signals boost educational value when topic alignment is strong
    if (practicalSignals && practicalSignals.signalScore >= 65 && topicRelevance >= 60) {
      edVal += 6;
    }

    return clampScore(edVal);
  }

  private computeAudioVisualQuality(resource: EngineResource, evidence: QualityEvidence): number {
    if (isDocumentResource(resource.type)) {
      return 85; // Clean document legibility baseline (not penalized for lacking video)
    }

    // Only evaluate based on verifiable container signals
    let avScore = 65; // Baseline standard resolution
    if (evidence.hasHighDefinition) avScore += 25; // Verified 1080p / 4K
    if (evidence.hasCaptionsOrTranscript) avScore += 10; // Clear accompanying closed captions

    return clampScore(avScore);
  }

  private computeRecency(resource: EngineResource, contentType: ContentType, topic?: string): number {
    const publishedAt =
      (resource.metadata?.publishedAt as string) ||
      resource.publishedAt;

    const lowerTopic = (topic || '').toLowerCase();
    const isFastEvolving =
      /\b(ai|llm|machine learning|deep learning|fine-tuning|peft|lora|diffusion|transformer|neural|next\.?js|react|cloud|cybersecurity|software engineering|web dev|full stack)\b/.test(lowerTopic);

    const baseScore = calculateFreshnessScore(publishedAt, isFastEvolving);

    if (contentType === 'current_news') {
      // News requires immediate recency
      if (!publishedAt) return 40;
      const ageDays = (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (ageDays <= 3) return 98;
      if (ageDays <= 14) return 85;
      if (ageDays <= 60) return 60;
      return 35; // Stale for current news
    }

    return baseScore;
  }

  private formulateExplanation(params: {
    resource: EngineResource;
    contentType: ContentType;
    overall: number;
    topicRelevance: number;
    publisherCredibility: number;
    contentDepth: number;
    evidence: QualityEvidence;
    practicalSignals?: PracticalLearningSignals;
  }): string {
    const { resource, contentType, overall, topicRelevance, publisherCredibility, evidence, practicalSignals } = params;
    const author = resource.authorOrChannel || 'Curated source';

    const qualityLabel =
      overall >= 85 ? 'Exceptional' : overall >= 72 ? 'High Quality' : 'Adequate';

    const features: string[] = [];
    if (publisherCredibility >= 80) features.push('accredited educator');
    if (practicalSignals?.hasProject) features.push('hands-on project');
    else if (practicalSignals?.hasCodeWalkthrough) features.push('coding walkthrough');
    else if (practicalSignals?.hasStepByStep) features.push('step-by-step implementation');
    if (evidence.hasHighDefinition) features.push('HD production');
    if (evidence.hasCaptionsOrTranscript) features.push('verified captions');
    if (evidence.hasTimestampsOrChapters) features.push('chapter markers');
    const pubDate = (resource.metadata?.publishedAt as string) || resource.publishedAt;
    if (pubDate && typeof pubDate === 'string' && pubDate.length >= 4) {
      features.push(`published ${pubDate.slice(0, 4)}`);
    }

    const featureStr = features.length > 0 ? ` (${features.join(', ')})` : '';

    return `${qualityLabel} ${contentType} resource from ${author}${featureStr}. Verified topic relevance of ${topicRelevance}%.`;
  }
}

export function isDocumentResource(type: EngineResourceType): boolean {
  return [
    'study_notes',
    'pdf_lecture_notes',
    'lecture_handout',
    'official_documentation',
    'reference_guide',
    'reading_material',
    'textbook',
    'research_paper',
    'article',
    'educational_web_page',
  ].includes(type);
}

