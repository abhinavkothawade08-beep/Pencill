import { EngineDiscoveryOutput } from '../orchestrator';
import { DistributedModuleOutput, DistributedResourceItem } from '../types/distribution';
import { EvaluatedResourceCandidate, ResourceModality } from '../types';
import { GeneratedLearningPath, GeneratedModuleOutline, GeneratedLessonSummaryOutline } from '@/services/ai/types';
import { NormalizedPublicResource } from '../types/legacy-contracts';
import { VideoChapter } from '@/types';

/**
 * Maps V2 ResourceModality to the legacy public resource type string.
 */
export function mapModalityToPublicType(modality: ResourceModality): NormalizedPublicResource['type'] {
  switch (modality) {
    case 'video':
      return 'video';
    case 'paper':
      return 'article';
    case 'monograph':
    case 'documentation':
      return 'notes';
    case 'practice':
      return 'practice';
    case 'quiz':
      return 'quiz';
    default:
      return 'other';
  }
}

/**
 * Maps an evaluated candidate to a legacy NormalizedPublicResource format.
 */
export function mapEvaluatedCandidateToPublicResource(
  evalCand: EvaluatedResourceCandidate
): NormalizedPublicResource {
  const cand = evalCand.candidate;
  const directUrl = cand.canonicalUrl || cand.sourceUrl;
  const isDirectPdf = directUrl.toLowerCase().endsWith('.pdf');

  let provider: NormalizedPublicResource['provider'] = 'internal';
  if (cand.provider === 'youtube') {
    provider = 'youtube';
  } else if (cand.provider === 'openalex' || cand.provider === 'arxiv') {
    provider = 'internal';
  }

  const durationMin = cand.durationSeconds ? Math.round(cand.durationSeconds / 60) : undefined;
  const isVerified = cand.verificationStatus !== 'unverified_candidate';

  return {
    id: cand.id,
    title: cand.title,
    url: directUrl,
    description: cand.description || undefined,
    type: mapModalityToPublicType(cand.modality),
    provider,
    sourceName: cand.provider === 'youtube'
      ? 'YouTube'
      : cand.provider === 'openalex'
      ? 'OpenAlex Academic Index'
      : cand.provider === 'arxiv'
      ? 'arXiv e-Print Archive'
      : cand.provider,
    thumbnailUrl: cand.thumbnailUrl || undefined,
    author: cand.creator?.name || undefined,
    duration: durationMin ? `${durationMin} min` : undefined,
    publishedAt: cand.publishedAt || undefined,
    relevanceScore: Math.round(evalCand.relevance.score),
    educationalValueScore: Math.round(evalCand.depth.score),
    structureScore: Math.round(evalCand.coverage.coverageRatio * 100),
    freshnessScore: 85,
    authorityScore: isVerified ? 95 : 75,
    finalScore: Math.round(evalCand.overallScore),
    isDirectPdf,
    downloadUrl: isDirectPdf ? directUrl : undefined,
    educatorId: cand.creator?.authorId || cand.creator?.channelId,
    educatorName: cand.creator?.name,
    channelId: cand.creator?.channelId,
    discoverySource: 'curated_directory',
    verificationStatus: isVerified ? 'verified' : 'unverified',
    selectionExplanation: evalCand.rankingRationale || evalCand.relevance.positiveEvidence.join('; '),
    coverageAssessment: evalCand.coverage.evidence.join('; '),
    isCompleteCourse: false,
    resourceCategory: evalCand.detectedCategory,
    practicalEvidence: evalCand.categoryEvaluation?.breakdown as any,
  };
}

/**
 * Maps a single DistributedModuleOutput to the GeneratedModuleOutline contract.
 */
export function mapDistributedModuleToOutline(
  mod: DistributedModuleOutput
): GeneratedModuleOutline {
  // Extract reading/monograph/paper items as structured studyNotes
  const moduleStudyNotes = mod.resources
    .filter((r) => r.modality === 'paper' || r.modality === 'monograph' || r.modality === 'documentation')
    .map((r) => {
      const isPdf = (r.canonicalUrl || r.sourceUrl).toLowerCase().endsWith('.pdf');
      return {
        id: `note-${r.resourceId}`,
        title: r.title,
        type: (r.modality === 'paper' ? 'research_paper' : 'educational_article') as import('@/types').LessonNoteResource['type'],
        url: r.canonicalUrl || r.sourceUrl,
        sourceUrl: r.canonicalUrl || r.sourceUrl,
        sourceName: r.sourceName,
        description: r.selectionReason,
        qualityScore: Math.round(r.overallScore),
        isDirectPdf: isPdf,
        downloadUrl: isPdf ? (r.canonicalUrl || r.sourceUrl) : undefined,
        author: r.creator?.name,
        relevanceExplanation: r.selectionReason,
      };
    });

  const lessons: GeneratedLessonSummaryOutline[] = mod.resources.map((res: DistributedResourceItem) => {
    const chapters: VideoChapter[] = res.chapters.map((c) => ({
      timestamp: c.timestampFormatted,
      seconds: c.seconds,
      title: c.title,
    }));

    const isReading = res.modality === 'paper' || res.modality === 'monograph' || res.modality === 'documentation';
    const associatedNotes = isReading
      ? moduleStudyNotes.filter((n) => n.id === `note-${res.resourceId}`)
      : moduleStudyNotes;

    return {
      id: res.resourceId,
      title: res.title,
      type: res.modality === 'video' ? 'video' : res.modality === 'paper' ? 'paper' : 'monograph',
      estimatedMinutes: res.durationMinutes || 15,
      keyConcepts: mod.coverageSummary.coveredConcepts,
      sourceUrl: res.canonicalUrl || res.sourceUrl,
      sourceName: res.sourceName,
      selectionReason: res.selectionReason,
      positionReason: res.resourceCategory
        ? `${res.resourceCategory.replace(/_/g, ' ')} (${res.assignedRole})`
        : res.assignedRole,
      resourceCategory: res.resourceCategory,
      practicalEvidence: res.practicalEvidence,
      authorOrChannel: res.creator?.name,
      educatorId: res.creator?.authorId || res.creator?.channelId,
      educatorName: res.creator?.name,
      discoverySource: res.discoverySource,
      verificationStatus: res.isVerified ? 'verified' : 'unverified',
      chapters: chapters.length > 0 ? chapters : undefined,
      studyNotes: associatedNotes.length > 0 ? associatedNotes : undefined,
      qualityScore: Math.round(res.overallScore),
    };
  });

  return {
    title: mod.moduleTitle,
    moduleNumber: mod.moduleNumber,
    objective: mod.moduleTitle,
    description: mod.isEmptyState
      ? mod.emptyStateReason
      : `Covers ${mod.coverageSummary.coveredConcepts.length} primary concepts with ${Math.round(mod.coverageSummary.satisfiedRatio * 100)}% coverage.`,
    keySubtopics: mod.coverageSummary.coveredConcepts,
    lessons,
  };
}

/**
 * Transforms complete V2 engine discovery output into the legacy /api/resources/discover response contract.
 * Guarantees zero breaking changes for existing frontend components.
 */
export function adaptV2ToDiscoverResponse(
  v2Output: EngineDiscoveryOutput,
  requestOptions?: { pathId?: string; learningPathTemplate?: GeneratedLearningPath | null }
) {
  const publicResources: NormalizedPublicResource[] = v2Output.rankedPool.rankedCandidates.map(
    mapEvaluatedCandidateToPublicResource
  );

  const modules: GeneratedModuleOutline[] = v2Output.distributedModules.map(mapDistributedModuleToOutline);

  let learningPath: GeneratedLearningPath | null = null;

  if (v2Output.distributedModules.length > 0) {
    const totalMinutes = v2Output.distributedModules.reduce((s, m) => s + m.totalDurationMinutes, 0);

    learningPath = {
      id: requestOptions?.pathId || `lp-v2-${Date.now().toString(36)}`,
      title: requestOptions?.learningPathTemplate?.title || `${v2Output.query} Study Path`,
      description: requestOptions?.learningPathTemplate?.description || `Curated high-yield learning path covering ${v2Output.primaryConcepts.join(', ')}.`,
      domain: v2Output.domain,
      level: v2Output.academicLevel,
      durationHours: Math.ceil(totalMinutes / 60) || 4,
      moduleCount: modules.length,
      tags: [v2Output.domain, v2Output.academicLevel, ...v2Output.primaryConcepts.slice(0, 3)],
      modules,
    };
  }

  const flatDiscovered = v2Output.distributedModules.flatMap((m) =>
    m.resources.map((r) => ({
      id: r.resourceId,
      title: r.title,
      type: r.modality,
      resourceCategory: r.resourceCategory,
      sourceName: r.sourceName,
      sourceUrl: r.canonicalUrl || r.sourceUrl,
      durationMinutes: r.durationMinutes,
      description: r.selectionReason,
      externalId: r.externalId,
      qualityScore: Math.round(r.overallScore),
    }))
  );

  return {
    success: true,
    resources: publicResources,
    sequencedPlaylist: null,
    coverageGaps: v2Output.rankedPool.rankedCandidates.length === 0 ? [v2Output.query] : [],
    metadata: {
      query: v2Output.query,
      providers: ['youtube', 'openalex', 'arxiv'],
      total: publicResources.length,
      executionTimeMs: v2Output.executionMetrics.totalDurationMs,
      providerLatencies: v2Output.executionMetrics.providerLatencies,
      quotaExhausted: v2Output.executionMetrics.circuitBreakerTripped,
      isFallbackUsed: v2Output.executionMetrics.circuitBreakerTripped,
      engineVersion: 'v2',
    },
    learningPath,
    discoveredResources: flatDiscovered,
    v2Diagnostics: {
      queriesExecuted: v2Output.executionMetrics.queriesExecuted,
      partialFailures: v2Output.executionMetrics.partialFailures,
      totalDistributed: v2Output.executionMetrics.totalCandidatesDistributed,
      persistenceValid: v2Output.validationReport.isValid,
    },
  };
}
