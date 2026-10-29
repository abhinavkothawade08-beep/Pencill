import {
  CurriculumPlan,
  ModuleResourceAssignment,
  CurriculumCoverageAudit,
} from './types';

export function validateCurriculumCoverage(
  plan: CurriculumPlan,
  assignments: ModuleResourceAssignment[],
  diagnostics: string[] = []
): CurriculumCoverageAudit {
  const moduleAudits = assignments.map((mod) => {
    const hasVideo = mod.videos.length > 0;
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
      ? Math.round(moduleAudits.reduce((acc, m) => acc + m.objectiveCoveragePercent, 0) / totalModules)
      : 0;

  const isComplete = totalModules >= 2 && totalNotes >= totalModules && totalQuizzes >= totalModules;

  const finalDiagnostics = [...diagnostics];
  if (totalVideos === 0) {
    finalDiagnostics.push('Notice: No video resources discovered for this path. Theoretical and reading modalities active.');
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
    moduleAudits,
    diagnosticMessages: finalDiagnostics,
  };
}
