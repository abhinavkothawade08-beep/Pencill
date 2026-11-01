import {
  ModulePlan,
  ScoredResource,
  GeneratedStudyNote,
  GeneratedQuiz,
  ModuleResourceAssignment,
  EducationalDomain,
} from './types';

export function distributeAndSequenceModuleResources(
  modulePlan: ModulePlan,
  candidateVideos: ScoredResource[],
  candidateReadings: ScoredResource[],
  studyNotes: GeneratedStudyNote[],
  quiz?: GeneratedQuiz
): ModuleResourceAssignment {
  // 1. Filter only resources that passed relevance gate
  const validVideos = candidateVideos.filter((v) => v.passedRelevanceGate);
  const validReadings = candidateReadings.filter((r) => r.passedRelevanceGate);

  // 2. Sort by combined score descending
  validVideos.sort((a, b) => b.combinedScore - a.combinedScore);
  validReadings.sort((a, b) => b.combinedScore - a.combinedScore);

  // 3. Select top video resources (up to 2 per module to maintain high cognitive focus)
  const selectedVideos = validVideos.slice(0, 2);

  // 4. Select top reading materials (1-2 per module)
  const selectedReadings = validReadings.slice(0, 2);

  // 5. Evaluate Objective Coverage
  const metObjectives = new Set<string>();
  for (const v of selectedVideos) {
    for (const obj of v.matchedObjectives) metObjectives.add(obj);
  }
  for (const r of selectedReadings) {
    for (const obj of r.matchedObjectives) metObjectives.add(obj);
  }
  if (quiz && Array.isArray(quiz.questions)) {
    for (const q of quiz.questions) {
      if (q.learningObjectiveReference) {
        metObjectives.add(q.learningObjectiveReference);
      }
    }
  }

  const unmetObjectives: string[] = [];
  for (const obj of modulePlan.learningObjectives) {
    if (!metObjectives.has(obj.statement)) {
      unmetObjectives.push(obj.statement);
    }
  }

  const totalObjectives = modulePlan.learningObjectives.length || 1;
  const coveragePercent = Math.round(
    ((totalObjectives - unmetObjectives.length) / totalObjectives) * 100
  );

  return {
    moduleId: modulePlan.id,
    moduleTitle: modulePlan.title,
    videos: selectedVideos,
    readings: selectedReadings,
    studyNotes,
    quiz,
    coverageScore: coveragePercent,
    unmetObjectives: unmetObjectives.length > 0 ? unmetObjectives : [],
  };
}
