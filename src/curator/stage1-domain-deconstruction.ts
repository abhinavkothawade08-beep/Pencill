/**
 * Stage 1: Domain & Syllabus Deconstruction
 * 
 * Maps learner topics to taxonomy nodes and subtopics, and loads exam syllabus units if aligned.
 */

import taxonomyData from '@/data/taxonomy.json';
import { getExamById } from '@/lib/catalogs/examCatalog';
import { BuilderConfig } from '@/lib/types/builderConfig';

export interface DeconstructionResult {
  domainId: string;
  domainName: string;
  identifiedSubtopics: string[];
  syllabusUnits: string[];
  prerequisiteDependencies: string[];
  summary: string;
}

export async function runStage1Deconstruction(config: BuilderConfig): Promise<DeconstructionResult> {
  const domain =
    taxonomyData.domains.find((d) => d.id === config.domainId) || taxonomyData.domains[0];

  const subtopics = new Set<string>();
  const prereqs = new Set<string>();

  // Map each selected topic to taxonomy nodes
  for (const selected of config.selectedTopics) {
    const clean = selected.label.toLowerCase();
    let foundInTaxonomy = false;

    for (const cat of domain.categories) {
      for (const sub of cat.subjects) {
        for (const topic of sub.topics) {
          if (
            topic.label.toLowerCase() === clean ||
            topic.synonyms.some((s) => s.toLowerCase() === clean) ||
            clean.includes(topic.label.toLowerCase())
          ) {
            foundInTaxonomy = true;
            subtopics.add(topic.label);
            (topic.subtopics || []).forEach((st) => subtopics.add(st.label));
            (topic.prereqs || []).forEach((p) => prereqs.add(p));
          }
        }
      }
    }

    if (!foundInTaxonomy) {
      subtopics.add(selected.label);
    }
  }

  // Load exam syllabus units if exam alignment is enabled
  const syllabusUnits: string[] = [];
  if (config.examAlign.enabled && config.examAlign.examId) {
    const exam = getExamById(config.examAlign.examId);
    if (exam && exam.typicalSubjects) {
      syllabusUnits.push(...exam.typicalSubjects);
      exam.typicalSubjects.forEach((u) => subtopics.add(`${exam.acronym}: ${u}`));
    }
  }

  const subtopicsArray = Array.from(subtopics);
  const prereqsArray = Array.from(prereqs);

  const summary = `Classified ${subtopicsArray.length} core concepts across ${domain.label}${
    syllabusUnits.length > 0 ? ` grounded in ${config.examAlign.examName}` : ""
  }.`;

  return {
    domainId: domain.id,
    domainName: domain.label,
    identifiedSubtopics: subtopicsArray,
    syllabusUnits,
    prerequisiteDependencies: prereqsArray,
    summary,
  };
}
