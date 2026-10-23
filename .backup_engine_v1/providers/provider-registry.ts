import { ResourceProvider, ProviderSearchOptions } from './base-provider';
import { GoogleSearchProvider } from './googleSearchProvider';
import { YouTubeProvider } from './youtubeProvider';
import { QuizProvider } from './quiz/quiz-provider';
import { AcademicNotesProvider } from './academicNotesProvider';
import { EngineResource } from '../types';

export interface ProviderExecutionMetric {
  providerId: string;
  providerName: string;
  durationMs: number;
  itemCount: number;
  error?: string;
}

export class ProviderRegistry {
  private providers = new Map<string, ResourceProvider>();

  constructor() {
    this.register(new GoogleSearchProvider());
    this.register(new AcademicNotesProvider());
    this.register(new YouTubeProvider());
    this.register(new QuizProvider());
  }

  register(provider: ResourceProvider): void {
    this.providers.set(provider.id, provider);
    if (provider.providerType) {
      this.providers.set(provider.providerType, provider);
    }
  }

  unregister(providerId: string): boolean {
    return this.providers.delete(providerId);
  }

  get(providerId: string): ResourceProvider | undefined {
    if (
      providerId === 'google' ||
      providerId === 'google-search-provider' ||
      providerId === 'web' ||
      providerId === 'practice'
    ) {
      return this.providers.get('google-search-provider') || this.providers.get('google');
    }
    if (
      providerId === 'notes' ||
      providerId === 'academic_notes' ||
      providerId === 'academic-notes-provider' ||
      providerId === 'openalex' ||
      providerId === 'arxiv' ||
      providerId === 'wikimedia'
    ) {
      return this.providers.get('academic-notes-provider') || this.providers.get('academic_notes');
    }
    if (
      providerId === 'youtube' ||
      providerId === 'youtube-provider' ||
      providerId === 'youtube-v3'
    ) {
      return this.providers.get('youtube-provider') || this.providers.get('youtube');
    }
    if (providerId === 'quiz' || providerId === 'ai-quiz-engine') {
      return this.providers.get('ai-quiz-engine') || this.providers.get('quiz');
    }
    return this.providers.get(providerId);
  }

  getAll(): ResourceProvider[] {
    return Array.from(this.providers.values());
  }

  getAvailable(): ResourceProvider[] {
    return this.getAll().filter((p) => p.isAvailable());
  }

  async executeParallel(
    query: string,
    options?: ProviderSearchOptions & { selectedProviderIds?: string[] }
  ): Promise<{
    resources: EngineResource[];
    metrics: ProviderExecutionMetric[];
  }> {
    const candidates = this.getAll().filter((p) => {
      if (options?.selectedProviderIds && options.selectedProviderIds.length > 0) {
        if (!options.selectedProviderIds.includes(p.id) && !options.selectedProviderIds.includes(p.providerType)) {
          return false;
        }
      }
      return p.isAvailable();
    });

    const metrics: ProviderExecutionMetric[] = [];
    const timeoutMs = options?.timeoutMs || 8000;

    const tasks = candidates.map(async (provider) => {
      const startTime = Date.now();
      try {
        const results = await provider.search(query, { ...options, timeoutMs });
        const durationMs = Date.now() - startTime;
        metrics.push({
          providerId: provider.id,
          providerName: provider.name,
          durationMs,
          itemCount: results.length,
        });
        return results;
      } catch (err) {
        const durationMs = Date.now() - startTime;
        const msg = err instanceof Error ? err.message : String(err);
        metrics.push({
          providerId: provider.id,
          providerName: provider.name,
          durationMs,
          itemCount: 0,
          error: msg,
        });
        return [];
      }
    });

    const settled = await Promise.all(tasks);
    const combinedResources = settled.flat();

    return {
      resources: combinedResources,
      metrics,
    };
  }
}
