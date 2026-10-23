import { EngineResource } from './resource';
import { DetailedQualityScore, ContentType } from './quality';

export type SequenceType =
  | 'learning_path'
  | 'step_by_step_tutorial'
  | 'chronological_research'
  | 'storytelling'
  | 'news_coverage'
  | 'general_interest_playlist';

export type SequenceRole =
  | 'foundation'
  | 'core_concept'
  | 'deep_dive'
  | 'practical_demonstration'
  | 'advanced_synthesis'
  | 'chronological_milestone'
  | 'tutorial_step';

export interface SequencedResourceItem {
  sequenceNumber: number;
  resource: EngineResource;
  conceptsCovered: string[];
  prerequisitesNeeded: string[];
  roleInSequence: SequenceRole;
  positionReason: string;
  selectionReason: string;
  qualityScore: DetailedQualityScore;
  eventDate?: string; // For chronological research
  verifiedPublicationDate?: string;
}

export interface SequenceValidationSummary {
  isValid: boolean;
  duplicateCountRemoved: number;
  prerequisitesRespected: boolean;
  averageQuality: number;
  warnings: string[];
}

export interface SequencedPlaylistResult {
  topic: string;
  sequenceType: SequenceType;
  contentType: ContentType;
  items: SequencedResourceItem[];
  coveredConcepts: string[];
  coverageGaps: string[];
  validationSummary: SequenceValidationSummary;
}
