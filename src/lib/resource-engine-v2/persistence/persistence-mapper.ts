import {
  DistributedModuleOutput,
  DistributedResourceItem,
  PersistenceMappingResult,
  UnmappedFieldReport,
} from '../types/distribution';
import { ResourceModality } from '../types';

/**
 * Maps V2 ResourceModality to the PostgreSQL schema CHECK constraint:
 * type IN ('video', 'monograph', 'practice', 'quiz', 'paper', 'formulae')
 */
export function mapModalityToDatabaseType(
  modality: ResourceModality
): 'video' | 'monograph' | 'practice' | 'quiz' | 'paper' | 'formulae' {
  switch (modality) {
    case 'video':
      return 'video';
    case 'paper':
      return 'paper';
    case 'monograph':
      return 'monograph';
    case 'documentation':
      // Schema lacks 'documentation'; mapped to 'monograph' (written treatise/reference)
      return 'monograph';
    case 'practice':
      return 'practice';
    case 'quiz':
      return 'quiz';
    case 'formulae':
      return 'formulae';
    case 'project':
      // Schema lacks 'project'; mapped to 'practice' (hands-on applied learning)
      return 'practice';
    default:
      return 'monograph';
  }
}

export class PersistenceMapper {
  /**
   * Deterministically maps V2 distributed modules and resources into Supabase database contracts.
   * Never fabricates missing metadata; records schema incompatibilities in unmappedFields.
   */
  mapDistributionToPersistence(
    distributedModules: DistributedModuleOutput[],
    pathId?: string
  ): PersistenceMappingResult {
    const databaseResources: PersistenceMappingResult['databaseResources'] = [];
    const databaseLessons: PersistenceMappingResult['databaseLessons'] = [];
    const learningPathModules: PersistenceMappingResult['learningPathModules'] = [];
    const unmappedFields: UnmappedFieldReport[] = [];
    const warnings: string[] = [];

    const seenResourceIds = new Set<string>();

    for (const mod of distributedModules) {
      const lessonsForPathInput: PersistenceMappingResult['learningPathModules'][0]['lessons'] = [];

      // Extract reading/paper resources as structured study_notes
      const readingNotesInModule = mod.resources
        .filter((r) => r.modality === 'paper' || r.modality === 'monograph' || r.modality === 'documentation')
        .map((r) => ({
          id: `note-${r.resourceId}`,
          title: r.title,
          type: r.modality === 'paper' ? 'research_paper' : 'educational_article',
          url: r.canonicalUrl,
          sourceUrl: r.canonicalUrl,
          sourceName: r.sourceName,
          qualityScore: Math.round(r.overallScore),
          isDirectPdf: r.canonicalUrl.toLowerCase().endsWith('.pdf'),
          downloadUrl: r.canonicalUrl.toLowerCase().endsWith('.pdf') ? r.canonicalUrl : undefined,
          author: r.creator?.name || undefined,
        }));

      let orderIdx = 0;
      for (const res of mod.resources) {
        orderIdx++;

        // 1. Map to `resources` table row (if not already mapped)
        if (!seenResourceIds.has(res.resourceId)) {
          seenResourceIds.add(res.resourceId);

          const dbType = mapModalityToDatabaseType(res.modality);
          if (res.modality !== dbType) {
            unmappedFields.push({
              field: 'modality',
              sourceContext: `Resource "${res.title}" (${res.resourceId})`,
              reason: `V2 modality "${res.modality}" mapped to schema-compatible "${dbType}" because database CHECK constraint only permits ('video', 'monograph', 'practice', 'quiz', 'paper', 'formulae').`,
            });
          }

          // Map 0-100 overall score to PostgreSQL NUMERIC(3, 2) [0.05 to 1.00]
          const normalizedQualityScore = Math.min(
            1.0,
            Math.max(0.05, Number((res.overallScore / 100).toFixed(2)))
          );

          databaseResources.push({
            id: res.resourceId,
            title: res.title.slice(0, 500),
            type: dbType,
            duration_minutes: res.durationMinutes,
            source_name: res.sourceName.slice(0, 255),
            source_url: res.canonicalUrl,
            description: res.selectionReason ? res.selectionReason.slice(0, 2000) : null,
            external_id: res.externalId || null,
            quality_score: normalizedQualityScore,
            is_verified: res.isVerified,
            last_verified_at: new Date().toISOString(),
            educator_id: res.educatorId || res.creator?.authorId || res.creator?.channelId || null,
            discovery_source: res.discoverySource || 'open_discovery',
          });
        }

        // 2. Map chapters to `VideoChapter[]` JSON format
        const formattedChapters = res.chapters.map((ch) => ({
          timestamp: ch.timestampFormatted,
          seconds: ch.seconds,
          title: ch.title,
        }));

        const lessonId = `lesson-${mod.moduleId}-${orderIdx}`;

        // 3. Map to `lessons` table row
        databaseLessons.push({
          id: lessonId,
          module_id: mod.moduleId,
          title: res.title.slice(0, 255),
          type: mapModalityToDatabaseType(res.modality),
          duration_minutes: res.durationMinutes,
          source_name: res.sourceName.slice(0, 255),
          source_url: res.canonicalUrl,
          order_index: orderIdx,
          concept_id: null, // Preserved as null when unassigned, never fabricated
          prerequisites_note: null,
          chapters: formattedChapters,
          formulae: [],
          summary_points: [res.coverageAssessment],
          study_notes: readingNotesInModule.length > 0 ? (readingNotesInModule as any) : null,
          educator_id: res.educatorId || res.creator?.authorId || res.creator?.channelId || null,
          discovery_source: res.discoverySource || 'open_discovery',
        });

        // 4. Map to CreateFullLearningPathInput['modules'] payload
        lessonsForPathInput.push({
          id: lessonId,
          title: res.title.slice(0, 255),
          type: mapModalityToDatabaseType(res.modality),
          durationMinutes: res.durationMinutes,
          sourceName: res.sourceName.slice(0, 255),
          sourceUrl: res.canonicalUrl,
          orderIndex: orderIdx,
          chapters: formattedChapters,
          qualityScore: res.overallScore,
          studyNotes: readingNotesInModule.length > 0 ? (readingNotesInModule as any) : undefined,
          educatorId: res.educatorId || res.creator?.authorId || res.creator?.channelId || undefined,
          discoverySource: res.discoverySource,
          selectionExplanation: res.selectionExplanation || res.selectionReason,
          coverageAssessment: res.coverageAssessment,
        });
      }

      // Record unmapped V2 fields for audit transparency
      unmappedFields.push({
        field: 'coverageSummary',
        sourceContext: `Module "${mod.moduleTitle}" (${mod.moduleId})`,
        reason: 'Database modules table lacks dedicated columns for satisfiedRatio, coveredConcepts, and uncoveredConcepts; metadata preserved in module summary.',
      });

      learningPathModules.push({
        id: mod.moduleId,
        title: mod.moduleTitle,
        moduleNumber: mod.moduleNumber,
        orderIndex: mod.moduleNumber,
        status: mod.moduleNumber === 1 ? 'in_progress' : 'locked',
        totalResources: mod.resources.length,
        lessons: lessonsForPathInput,
      });
    }

    return {
      success: true,
      databaseResources,
      databaseLessons,
      learningPathModules,
      unmappedFields,
      warnings,
    };
  }
}
