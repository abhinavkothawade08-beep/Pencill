import {
  QueryProviderTarget,
  SearchQueryItem,
  ProviderCapabilities,
  ProviderExecutionOptions,
  ProviderHealthStatus,
  ProviderSearchResult,
} from '../types';

/**
 * Common Provider Adapter Interface for Pencill Resource Engine 2.0.
 * Decouples provider-specific APIs from search planning and selection logic.
 */
export interface ResourceProviderAdapter {
  readonly id: QueryProviderTarget;
  readonly name: string;
  readonly capabilities: ProviderCapabilities;

  /**
   * Determines if this provider can fulfill the given query item.
   */
  supportsQuery(query: SearchQueryItem): boolean;

  /**
   * Returns current operational health, quota status, and cooldown state.
   */
  getHealthStatus(): ProviderHealthStatus;

  /**
   * Executes resource retrieval and returns normalized candidate resources.
   */
  search(query: SearchQueryItem, options?: ProviderExecutionOptions): Promise<ProviderSearchResult>;
}
