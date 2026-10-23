import { EngineResource, EngineResourceType } from './resource';

export interface RankingWeights {
  relevance: number; // default 0.40
  educationalValue: number; // default 0.25
  structureCompleteness: number; // default 0.15
  freshness: number; // default 0.10
  sourceAuthority: number; // default 0.10
}

export interface RankedItem {
  resource: EngineResource;
  finalScore: number; // 0 - 100
  rank: number;
  reason: string;
}

export interface DiversitySlotTarget {
  type: EngineResourceType;
  min: number;
  max: number;
}

export interface DiversityConfig {
  slots: DiversitySlotTarget[];
  maxPerDomainOrChannel: number;
}
