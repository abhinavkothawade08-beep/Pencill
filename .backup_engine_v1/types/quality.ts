import { PracticalLearningSignals, DurationPreferenceMap } from './resource';

export type ContentType =
  | 'educational'
  | 'current_news'
  | 'documentary'
  | 'entertainment'
  | 'academic';

export interface QualityWeights {
  topicRelevance: number; // Initial: 0.30 (30%)
  contentDepth: number; // Initial: 0.20 (20%)
  publisherCredibility: number; // Initial: 0.15 (15%)
  educationalValue: number; // Initial: 0.15 (15%)
  audioVisualQuality: number; // Initial: 0.10 (10%)
  recency: number; // Initial: 0.10 (10%)
}

export interface QualityEvidence {
  hasCaptionsOrTranscript: boolean;
  hasHighDefinition: boolean;
  hasDetailedDescription: boolean;
  isEmbeddable: boolean;
  hasTimestampsOrChapters: boolean;
  durationMinutes: number;
  evidenceConfidence: 'high' | 'medium' | 'low';
  uncertaintyReasons: string[];
}

export interface DetailedQualityScore {
  overall: number; // 0 - 100
  topicRelevance: number; // 0 - 100
  contentDepth: number; // 0 - 100
  publisherCredibility: number; // 0 - 100
  educationalValue: number; // 0 - 100
  audioVisualQuality: number; // 0 - 100
  recency: number; // 0 - 100
  weightsUsed: QualityWeights;
  evidence: QualityEvidence;
  explanation: string;
  contentType: ContentType;
  durationSuitability?: number;
  practicalDepth?: number;
  practicalSignals?: PracticalLearningSignals;
}

export interface QualityScoringConfig {
  defaultWeights: QualityWeights;
  contentTypeWeights: Record<ContentType, QualityWeights>;
  minQualityThreshold: number; // Default: 60
  durationPreferences?: DurationPreferenceMap;
}
