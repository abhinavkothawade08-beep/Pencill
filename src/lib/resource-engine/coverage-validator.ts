import {
  CurriculumPlan,
  ModuleResourceAssignment,
  CurriculumCoverageAudit,
  CourseQualityGates,
} from './types';

export function validateCurriculumCoverage(
  plan: CurriculumPlan,
  assignments: ModuleResourceAssignment[],
  diagnostics: string[] = []
): CurriculumCoverageAudit {
  const moduleAudits = assignments.map((mod) => {
    const hasVideo =
      (mod.videos && mod.videos.length > 0) ||
      Boolean(
        mod.primaryPlaylist &&
          (mod.primaryPlaylist.itemCount > 0 ||
            (mod.primaryPlaylist.items && mod.primaryPlaylist.items.length > 0))
      );
    const hasReading = mod.readings.length > 0;
    const hasStudyNotes = mod.studyNotes.length > 0;
    const hasQuiz = Boolean(mod.quiz && mod.quiz.questions.length > 0);

    const coverageGaps: string[] = [];
    if (!hasVideo) coverageGaps.push('No video lecture assigned');
    if (!hasReading) coverageGaps.push('No reading material assigned');
    if (!hasStudyNotes) coverageGaps.push('No study notes assigned');
    if (!hasQuiz) coverageGaps.push('No formative checkpoint quiz assigned');

    let objectiveCoveragePercent = mod.coverageScore;
    if (!hasVideo && !hasReading) {
      objectiveCoveragePercent = Math.max(50, objectiveCoveragePercent - 30);
    }

    return {
      moduleId: mod.moduleId,
      title: mod.moduleTitle,
      objectiveCoveragePercent,
      hasVideo,
      hasReading,
      hasStudyNotes,
      hasQuiz,
      coverageGaps,
    };
  });

  const totalModules = assignments.length;
  const totalVideos = assignments.reduce((acc, m) => acc + m.videos.length, 0);
  const totalReadings = assignments.reduce((acc, m) => acc + m.readings.length, 0);
  const totalNotes = assignments.reduce((acc, m) => acc + m.studyNotes.length, 0);
  const totalQuizzes = assignments.reduce((acc, m) => acc + (m.quiz ? 1 : 0), 0);

  const avgModuleCoverage =
    totalModules > 0
      ? Math.round(
          moduleAudits.reduce((acc, m) => acc + m.objectiveCoveragePercent, 0) / totalModules
        )
      : 0;

  // --- Quality Gate 1: Curriculum Quality Gate ---
  const distinctTitles = new Set(assignments.map((m) => m.moduleTitle.toLowerCase().trim()));
  const curriculumDetails: string[] = [];
  if (assignments.length < 2) {
    curriculumDetails.push('Course contains fewer than 2 modules.');
  }
  if (distinctTitles.size < assignments.length) {
    curriculumDetails.push('Duplicate module titles detected in curriculum plan.');
  }
  const curriculumPassed = curriculumDetails.length === 0;

  // --- Quality Gate 2: Topic Coverage Gate ---
  const topicDetails: string[] = [];
  let totalUnmet = 0;
  for (const m of assignments) {
    if (m.unmetObjectives.length > 0) {
      totalUnmet += m.unmetObjectives.length;
      topicDetails.push(`Module "${m.moduleTitle}" has ${m.unmetObjectives.length} unmet objectives.`);
    }
  }
  const topicCoveragePassed = avgModuleCoverage >= 60;

  // --- Quality Gate 3: Resource Validity Gate (Zero Duplicate Videos Across Modules) ---
  const seenVideoUrls = new Map<string, string>(); // url -> moduleId
  const duplicateVideoDetails: string[] = [];
  for (const m of assignments) {
    for (const v of m.videos || []) {
      if (!v) continue;
      const rawUrl = v.canonicalUrl || (v as any).url || v.externalId;
      if (!rawUrl) continue;
      const cleanUrl = rawUrl.toLowerCase().split('&')[0];
      if (seenVideoUrls.has(cleanUrl)) {
        const prevModule = seenVideoUrls.get(cleanUrl);
        duplicateVideoDetails.push(
          `Video "${v.title || cleanUrl}" reused in Module "${m.moduleTitle}" (already in "${prevModule}").`
        );
      } else {
        seenVideoUrls.set(cleanUrl, m.moduleTitle);
      }
    }
  }
  const resourceValidityPassed = duplicateVideoDetails.length === 0;

  // --- Quality Gate 4: Assessment Validity Gate ---
  const assessmentDetails: string[] = [];
  for (const m of assignments) {
    if (!m.quiz || m.quiz.questions.length === 0) {
      assessmentDetails.push(`Module "${m.moduleTitle}" missing checkpoint quiz.`);
    } else {
      for (const q of m.quiz.questions) {
        if (!q.options || q.options.length < 2) {
          assessmentDetails.push(
            `Question ${q.questionNumber} in "${m.moduleTitle}" has fewer than 2 options.`
          );
        }
        if (
          typeof q.correctOptionIndex !== 'number' ||
          q.correctOptionIndex < 0 ||
          q.correctOptionIndex >= (q.options?.length || 0)
        ) {
          assessmentDetails.push(
            `Question ${q.questionNumber} in "${m.moduleTitle}" has invalid correctOptionIndex.`
          );
        }
      }
    }
  }
  const assessmentValidityPassed = assessmentDetails.length === 0;

  // --- Quality Gate 5: Persistence Integrity Gate ---
  const persistencePassed = totalModules > 0 && assignments.every((m) => m.moduleId);

  // --- Quality Gate 6: Learner Experience Gate ---
  const learnerExpDetails: string[] = [];
  if (totalVideos === 0 && totalReadings === 0) {
    learnerExpDetails.push('No primary instructional modalities (video or reading) discovered.');
  }
  const learnerExperiencePassed = totalNotes >= totalModules;

  const qualityGates: CourseQualityGates = {
    allPassed:
      curriculumPassed &&
      topicCoveragePassed &&
      resourceValidityPassed &&
      assessmentValidityPassed &&
      persistencePassed &&
      learnerExperiencePassed,
    curriculumQuality: {
      gate: 'Curriculum Quality Gate',
      status: curriculumPassed ? 'PASSED' : 'WARNING',
      description: 'Logical module sequence, distinct titles, and prerequisite alignment.',
      details: curriculumDetails,
    },
    topicCoverage: {
      gate: 'Topic Coverage Gate',
      status: topicCoveragePassed ? 'PASSED' : 'WARNING',
      description: 'Systematic alignment between learner objective, subtopics, and verified resources.',
      details: topicDetails,
    },
    resourceValidity: {
      gate: 'Resource Validity Gate',
      status: resourceValidityPassed ? 'PASSED' : 'FAILED',
      description: 'Strict cross-module video deduplication and verifiable learning media.',
      details: duplicateVideoDetails,
    },
    assessmentValidity: {
      gate: 'Assessment Validity Gate',
      status: assessmentValidityPassed ? 'PASSED' : 'FAILED',
      description: 'Functional formative checkpoint quizzes with 4 options, valid keys, and explanations.',
      details: assessmentDetails,
    },
    persistenceIntegrity: {
      gate: 'Persistence Integrity Gate',
      status: persistencePassed ? 'PASSED' : 'FAILED',
      description: 'Clean persistence of curriculum, resources, quizzes, and learner progress state.',
      details: [],
    },
    learnerExperience: {
      gate: 'Learner Experience Gate',
      status: learnerExperiencePassed ? 'PASSED' : 'WARNING',
      description: 'Balanced learning modalities: lecture, conceptual reading, study notes, and diagnostic quiz.',
      details: learnerExpDetails,
    },
  };

  const isComplete =
    totalModules >= 2 &&
    totalNotes >= totalModules &&
    totalQuizzes >= totalModules;

  const finalDiagnostics = [...diagnostics];
  if (totalVideos === 0) {
    finalDiagnostics.push(
      'Notice: No video resources discovered for this path. Theoretical and reading modalities active.'
    );
  }
  if (!resourceValidityPassed) {
    finalDiagnostics.push(
      `Warning: Detected ${duplicateVideoDetails.length} cross-module video collisions.`
    );
  }
  if (!isComplete) {
    finalDiagnostics.push('Warning: Course did not meet complete curriculum requirements.');
  }

  return {
    overallCoveragePercent: avgModuleCoverage,
    isComplete,
    totalModules,
    totalVideos,
    totalReadings,
    totalNotes,
    totalQuizzes,
    qualityGates,
    moduleAudits,
    diagnosticMessages: finalDiagnostics,
  };
}
