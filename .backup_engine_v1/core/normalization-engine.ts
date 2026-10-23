import { EngineResource } from '../types';
import { canonicalizeUrl } from '../utils/url-utils';
import { stripHtml, truncate } from '../utils/text-utils';
import { clampScore } from '../utils/scoring-utils';

export class NormalizationEngine {
  normalize(raw: Partial<EngineResource> & { title: string; sourceUrl: string }): EngineResource {
    const canonical = canonicalizeUrl(raw.sourceUrl);
    const cleanTitle = stripHtml(raw.title || '').replace(/\s+/g, ' ').trim();
    const cleanDesc = stripHtml(raw.description || '').replace(/\s+/g, ' ').trim();

    const score = raw.score || {
      overall: 80,
      relevance: 80,
      educationalValue: 80,
      structureCompleteness: 80,
      freshness: 75,
      explanation: 'Default initial quality score',
    };

    return {
      id: raw.id || `res_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: truncate(cleanTitle, 180),
      description: truncate(cleanDesc, 600),
      type: raw.type || 'reading_material',
      canonicalUrl: canonical,
      sourceUrl: raw.sourceUrl,
      sourceName: raw.sourceName || 'Pencill Resource Pool',
      provider: raw.provider || 'custom',
      externalId: raw.externalId,
      authorOrChannel: raw.authorOrChannel,
      thumbnailUrl: raw.thumbnailUrl,
      durationMinutes: Math.max(1, Math.round(raw.durationMinutes || 20)),
      difficulty: raw.difficulty || 'intermediate',
      language: raw.language || 'en',
      score: {
        overall: clampScore(score.overall),
        relevance: clampScore(score.relevance),
        educationalValue: clampScore(score.educationalValue),
        structureCompleteness: clampScore(score.structureCompleteness),
        freshness: clampScore(score.freshness),
        explanation: score.explanation,
      },
      tags: Array.isArray(raw.tags)
        ? raw.tags.map((t) => t.toLowerCase().trim()).filter(Boolean)
        : [],
      examCategory: raw.examCategory,
      metadata: {
        ...(raw.metadata || {}),
        isDirectPdf: raw.metadata?.isDirectPdf ?? (canonical.toLowerCase().endsWith('.pdf') || raw.sourceUrl.toLowerCase().endsWith('.pdf')),
        downloadUrl: raw.metadata?.downloadUrl || (canonical.toLowerCase().endsWith('.pdf') ? canonical : undefined),
      },
      discoveredAt: raw.discoveredAt || new Date().toISOString(),
    };
  }
}
