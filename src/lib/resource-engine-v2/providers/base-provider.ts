import { EngineResource, ResourceProviderType, EngineResourceType, ResourceDifficulty } from '../types/legacy-contracts';

export interface ProviderSearchOptions {
  limit?: number;
  targetTypes?: EngineResourceType[];
  difficulty?: ResourceDifficulty;
  examContext?: string;
  timeoutMs?: number;
  channelId?: string;
  channelHandle?: string;
  educatorId?: string;
  targetEducator?: import('../educators/types').MasterEducatorRecord;
  discoverySource?: 'curated_directory' | 'fallback_search';
  excludeVideoIds?: Set<string>;
  excludeUrls?: Set<string>;
}

export interface ResourceProvider {
  readonly id: string;
  readonly name: string;
  readonly providerType: ResourceProviderType;
  readonly supportedTypes: EngineResourceType[];
  
  isAvailable(): boolean;
  getAvailabilityStatus(): { available: boolean; reason?: string };
  search(query: string, options?: ProviderSearchOptions): Promise<EngineResource[]>;
}
