import { EngineResource } from './resource';
import { ParsedQuery, SearchPlan } from './search';
import { RankedItem } from './ranking';
import { SequencedPlaylistResult } from './sequence';

export interface DiscoveryJobStatus {
  id: string;
  topic: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  foundCount: number;
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
}

export interface DiscoveryResult {
  jobId?: string;
  topic: string;
  parsedQuery: ParsedQuery;
  searchPlan: SearchPlan;
  totalFound: number;
  totalValid: number;
  rankedResources: RankedItem[];
  sequencedPlaylist?: SequencedPlaylistResult;
  groupedByType: Record<string, EngineResource[]>;
  executionMetrics: {
    durationMs: number;
    providerLatencies: Record<string, number>;
    countsByProvider: Record<string, number>;
    countsByType: Record<string, number>;
    evaluatedCount: number;
  };
}
