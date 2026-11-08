import {
  ModulePlan,
  ScoredResource,
  GeneratedStudyNote,
  GeneratedQuiz,
  ModuleResourceAssignment,
  EducationalDomain,
  PlaylistResource,
  PlaylistCoverageMap,
  SyllabusSubtopic,
  SyllabusCoverageMatrix,
} from './types';
import { syllabusCoverageEngine } from './syllabus-coverage-engine';
import { deduplicateModuleVideosAgainstPlaylist } from './playlist-deduplication';

export function calculateDynamicResourceLimits(
  modulePlan: ModulePlan,
  level: string = 'intermediate',
  hasPrimaryPlaylist: boolean = false
): { maxVideos: number; maxReadings: number } {
  const objCount = Math.max(1, modulePlan.learningObjectives?.length || 3);
  const hours = Math.max(2, modulePlan.estimatedHours || 4);

  let baseVideos = Math.min(5, Math.max(2, Math.round(objCount * 0.75)));
  let baseReadings = Math.min(4, Math.max(2, Math.round(objCount * 0.5)));

  // If advanced level or competitive examination
  if (level === 'advanced' || level === 'competitive_exam' || level === 'undergraduate') {
    baseVideos = Math.min(6, baseVideos + 1);
    baseReadings = Math.min(4, baseReadings + 1);
  }

  // If long duration module (> 5 hours)
  if (hours >= 6) {
    baseVideos = Math.min(6, baseVideos + 1);
  }

  // If a complete primary playlist is present, reduce individual video clutter
  if (hasPrimaryPlaylist) {
    baseVideos = Math.min(3, Math.max(1, Math.round(baseVideos / 2)));
  }

  return {
    maxVideos: baseVideos,
    maxReadings: baseReadings,
  };
}

export function distributeAndSequenceModuleResources(
  modulePlan: ModulePlan,
  candidateVideos: ScoredResource[],
  candidateReadings: ScoredResource[],
  studyNotes: GeneratedStudyNote[],
  quiz?: GeneratedQuiz,
  primaryPlaylist?: PlaylistResource,
  subtopics?: SyllabusSubtopic[],
  level: string = 'intermediate'
): ModuleResourceAssignment {
  // 1. Filter only resources that passed relevance gate
  const validVideos = candidateVideos.filter((v) => v.passedRelevanceGate);
  const validReadings = candidateReadings.filter((r) => r.passedRelevanceGate);

  // 2. Intelligent, playlist-aware deduplication
  let filteredVideos = validVideos;
  let removedDuplicateVideos: ScoredResource[] = [];
  let playlistCoverageMap: PlaylistCoverageMap | undefined;

  if (primaryPlaylist) {
    const dedup = deduplicateModuleVideosAgainstPlaylist(
      validVideos,
      primaryPlaylist,
      modulePlan,
      subtopics
    );
    filteredVideos = dedup.supplementaryVideos;
    removedDuplicateVideos = dedup.removedVideos;
    playlistCoverageMap = dedup.coverageMap;
  }

  // 3. Sort by combined score descending
  filteredVideos.sort((a, b) => b.combinedScore - a.combinedScore);
  validReadings.sort((a, b) => b.combinedScore - a.combinedScore);

  // 4. Dynamic resource bounds based on module depth, objectives, and playlist availability
  const { maxVideos, maxReadings } = calculateDynamicResourceLimits(
    modulePlan,
    level,
    Boolean(primaryPlaylist)
  );

  const selectedVideos = filteredVideos.slice(0, maxVideos);
  const selectedReadings = validReadings.slice(0, maxReadings);

  // 4. Build Syllabus Coverage Matrix
  const activeSubtopics = subtopics && subtopics.length > 0
    ? subtopics
    : syllabusCoverageEngine.decomposeSubtopics(modulePlan, 'general', modulePlan.title);

  const syllabusMatrix: SyllabusCoverageMatrix = syllabusCoverageEngine.buildCoverageMatrix(
    modulePlan,
    activeSubtopics,
    selectedVideos,
    selectedReadings,
    studyNotes,
    quiz,
    primaryPlaylist
  );

  // 5. Evaluate Objective Coverage (Harmonize Matrix & Invariants)
  const metObjectives = new Set<string>();
  for (const v of selectedVideos) {
    for (const obj of v.matchedObjectives || []) metObjectives.add(obj);
  }
  for (const r of selectedReadings) {
    for (const obj of r.matchedObjectives || []) metObjectives.add(obj);
  }
  if (quiz && Array.isArray(quiz.questions)) {
    for (const q of quiz.questions) {
      if (q.learningObjectiveReference) metObjectives.add(q.learningObjectiveReference);
    }
  }

  // Account for objectives covered by primary playlist
  if (playlistCoverageMap?.coveredLearningObjectives) {
    for (const obj of playlistCoverageMap.coveredLearningObjectives) {
      metObjectives.add(obj);
    }
  }

  const unmetLegacy: string[] = [];
  for (const obj of modulePlan.learningObjectives || []) {
    const isMet =
      metObjectives.has(obj.statement) ||
      (obj.id && metObjectives.has(obj.id)) ||
      Boolean(playlistCoverageMap?.coveredLearningObjectives?.some((c) =>
        c.toLowerCase() === obj.statement.toLowerCase() || (obj.id && c.toLowerCase() === obj.id.toLowerCase())
      ));
    if (!isMet) unmetLegacy.push(obj.statement);
  }

  const totalObjectives = modulePlan.learningObjectives?.length || 1;
  const legacyCoveragePercent = Math.round(
    ((totalObjectives - unmetLegacy.length) / totalObjectives) * 100
  );

  const playlistCoverage = playlistCoverageMap?.coveragePercent || 0;
  const finalCoverageScore = Math.max(legacyCoveragePercent, syllabusMatrix.overallCoveragePercent, playlistCoverage);

  const unmetObjectives: string[] = syllabusMatrix.subtopics
    .filter((s) => s.coverageStatus === 'Missing Resources')
    .map((s) => s.learningObjective);

  return {
    moduleId: modulePlan.id,
    moduleTitle: modulePlan.title,
    videos: selectedVideos,
    readings: selectedReadings,
    studyNotes,
    quiz,
    coverageScore: finalCoverageScore,
    unmetObjectives,
    primaryPlaylist,
    syllabusMatrix,
    subtopics: syllabusMatrix.subtopics,
    removedDuplicateVideos,
    playlistCoverageMap,
  };
}
