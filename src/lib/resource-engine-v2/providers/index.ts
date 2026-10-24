import { QueryProviderTarget } from '../types';
import { ResourceProviderAdapter } from './base-adapter';
import { YouTubeAdapterV2, YouTubeAdapterConfig } from './youtube-adapter';
import { OpenAlexAdapterV2, OpenAlexAdapterConfig } from './openalex-adapter';
import { ArXivAdapterV2, ArXivAdapterConfig } from './arxiv-adapter';

export * from './base-adapter';
export * from './youtube-adapter';
export * from './openalex-adapter';
export * from './arxiv-adapter';
export * from './base-provider';
export * from './academic-notes-provider';
export * from './google-search-provider';
export * from './legacy-youtube-provider';


/**
 * Registry container managing active provider adapters in Resource Engine 2.0.
 */
export class ProviderRegistry {
  private readonly adapters = new Map<QueryProviderTarget, ResourceProviderAdapter>();

  constructor(options?: {
    empty?: boolean;
    youtubeConfig?: YouTubeAdapterConfig;
    openAlexConfig?: OpenAlexAdapterConfig;
    arxivConfig?: ArXivAdapterConfig;
  }) {
    if (!options?.empty) {
      this.register(new YouTubeAdapterV2(options?.youtubeConfig));
      this.register(new OpenAlexAdapterV2(options?.openAlexConfig));
      this.register(new ArXivAdapterV2(options?.arxivConfig));
    }
  }

  public register(adapter: ResourceProviderAdapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  public get(id: QueryProviderTarget): ResourceProviderAdapter | undefined {
    return this.adapters.get(id);
  }

  public getAll(): ResourceProviderAdapter[] {
    return Array.from(this.adapters.values());
  }

  public getAvailable(): ResourceProviderAdapter[] {
    return Array.from(this.adapters.values()).filter((a) => a.getHealthStatus().available);
  }
}
