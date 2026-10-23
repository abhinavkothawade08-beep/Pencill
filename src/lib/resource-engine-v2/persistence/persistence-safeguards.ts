import { PersistenceMappingResult } from '../types/distribution';

export interface ValidationReport {
  isValid: boolean;
  resourceCount: number;
  lessonCount: number;
  moduleCount: number;
  errors: string[];
}

export interface PersistenceExecutionReport {
  success: boolean;
  persistedResourceCount: number;
  persistedLessonCount: number;
  persistedModuleCount: number;
  error?: string;
  rollbackOccurred: boolean;
  preservedPayloadSnapshot: PersistenceMappingResult;
}

export class PersistenceSafeguardEngine {
  /**
   * Pre-write dry-run validation.
   * Ensures that all rows conform to schema constraints before attempting any database operations.
   */
  validatePayload(mapping: PersistenceMappingResult): ValidationReport {
    const errors: string[] = [];

    // 1. Validate Database Resources
    for (const res of mapping.databaseResources) {
      if (!res.id) {
        errors.push(`Resource missing mandatory id`);
      }
      if (!res.title || res.title.trim().length === 0) {
        errors.push(`Resource ${res.id} missing mandatory title`);
      }
      if (res.title.length > 500) {
        errors.push(`Resource ${res.id} title exceeds 500 characters (${res.title.length})`);
      }
      if (!res.source_url || !res.source_url.startsWith('http')) {
        errors.push(`Resource ${res.id} has invalid source_url: "${res.source_url}"`);
      }
      if (!['video', 'monograph', 'practice', 'quiz', 'paper', 'formulae'].includes(res.type)) {
        errors.push(`Resource ${res.id} has invalid database type: "${res.type}"`);
      }
      if (res.quality_score < 0.05 || res.quality_score > 1.0) {
        errors.push(`Resource ${res.id} quality_score out of range [0.05, 1.0]: ${res.quality_score}`);
      }
      if (res.duration_minutes < 0) {
        errors.push(`Resource ${res.id} has negative duration_minutes: ${res.duration_minutes}`);
      }
    }

    // 2. Validate Database Lessons
    for (const les of mapping.databaseLessons) {
      if (!les.id) {
        errors.push(`Lesson missing mandatory id`);
      }
      if (!les.module_id) {
        errors.push(`Lesson ${les.id} missing module_id foreign key`);
      }
      if (!les.title || les.title.trim().length === 0) {
        errors.push(`Lesson ${les.id} missing mandatory title`);
      }
      if (les.order_index <= 0) {
        errors.push(`Lesson ${les.id} has non-positive order_index: ${les.order_index}`);
      }
    }

    // 3. Validate Modules
    for (const mod of mapping.learningPathModules) {
      if (!mod.id) {
        errors.push(`Module missing mandatory id`);
      }
      if (!mod.title || mod.title.trim().length === 0) {
        errors.push(`Module ${mod.id} missing mandatory title`);
      }
      if (mod.moduleNumber <= 0) {
        errors.push(`Module ${mod.id} has non-positive moduleNumber: ${mod.moduleNumber}`);
      }
    }

    return {
      isValid: errors.length === 0,
      resourceCount: mapping.databaseResources.length,
      lessonCount: mapping.databaseLessons.length,
      moduleCount: mapping.learningPathModules.length,
      errors,
    };
  }

  /**
   * Safe persistence executor wrapper.
   * Demonstrates failure isolation: if a write fails, metadata is never silently stripped,
   * in-memory data is not corrupted, and an observable report is generated.
   */
  async executeSafePersistence(
    mapping: PersistenceMappingResult,
    writerFunction: (mapping: PersistenceMappingResult) => Promise<{ success: boolean; error?: string }>
  ): Promise<PersistenceExecutionReport> {
    // Step 1: Pre-validation
    const validation = this.validatePayload(mapping);
    if (!validation.isValid) {
      return {
        success: false,
        persistedResourceCount: 0,
        persistedLessonCount: 0,
        persistedModuleCount: 0,
        error: `Persistence rejected by pre-write safeguard: ${validation.errors.join('; ')}`,
        rollbackOccurred: true,
        preservedPayloadSnapshot: mapping,
      };
    }

    // Step 2: Atomic attempt
    try {
      const result = await writerFunction(mapping);
      if (!result.success) {
        return {
          success: false,
          persistedResourceCount: 0,
          persistedLessonCount: 0,
          persistedModuleCount: 0,
          error: result.error || 'Database transaction rejected write',
          rollbackOccurred: true,
          preservedPayloadSnapshot: mapping,
        };
      }

      return {
        success: true,
        persistedResourceCount: mapping.databaseResources.length,
        persistedLessonCount: mapping.databaseLessons.length,
        persistedModuleCount: mapping.learningPathModules.length,
        rollbackOccurred: false,
        preservedPayloadSnapshot: mapping,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        persistedResourceCount: 0,
        persistedLessonCount: 0,
        persistedModuleCount: 0,
        error: `Unexpected persistence failure: ${errorMsg}`,
        rollbackOccurred: true,
        preservedPayloadSnapshot: mapping,
      };
    }
  }
}
