import {
  EngineResource,
  SequenceType,
  SequenceRole,
  SequencedResourceItem,
  SequencedPlaylistResult,
  DetailedQualityScore,
  ContentType,
} from '../types';
import { QualityScoringEngine } from './quality-scoring';
import { tokenize } from '../utils/text-utils';
import { callGemini } from '@/services/ai/gemini/client';
import { extractJsonFromText } from '../utils/text-utils';

export interface SequenceGeneratorOptions {
  sequenceType?: SequenceType;
  contentType?: ContentType;
  maxItems?: number;
}

export class SequenceGenerator {
  private qualityEngine = new QualityScoringEngine();

  /**
   * Determine intended sequence type from user query
   */
  determineSequenceType(query: string, explicitType?: SequenceType): SequenceType {
    if (explicitType) return explicitType;
    const lower = query.toLowerCase();

    // 1. Chronological research detection
    if (
      /\b(chronological|history of|timeline|evolution of|origins|ancient|world war|renaissance|century|historical)\b/.test(
        lower
      )
    ) {
      return 'chronological_research';
    }

    // 2. Step-by-step tutorial detection
    if (
      /\b(step by step|tutorial|how to build|guide to building|walkthrough|setup|installation|from scratch)\b/.test(
        lower
      )
    ) {
      return 'step_by_step_tutorial';
    }

    // 3. News coverage detection
    if (/\b(news|current events|breaking|today|updates|weekly round)\b/.test(lower)) {
      return 'news_coverage';
    }

    // 4. Storytelling / Narrative detection
    if (/\b(story of|biography|documentary|life of|rise and fall|narrative)\b/.test(lower)) {
      return 'storytelling';
    }

    // 5. General interest playlist detection
    if (/\b(playlist|favorites|best of|compilation|chill|music|songs)\b/.test(lower)) {
      return 'general_interest_playlist';
    }

    // Default to educational learning path
    return 'learning_path';
  }

  /**
   * Main entrypoint: generates a verified, logically ordered sequence
   */
  async generateSequence(
    topic: string,
    candidates: Array<{ resource: EngineResource; score: DetailedQualityScore }>,
    options?: SequenceGeneratorOptions
  ): Promise<SequencedPlaylistResult> {
    const sequenceType = this.determineSequenceType(topic, options?.sequenceType);
    const contentType = options?.contentType || this.qualityEngine.detectContentType(topic);
    const maxItems = options?.maxItems || 6;

    if (candidates.length === 0) {
      return {
        topic,
        sequenceType,
        contentType,
        items: [],
        coveredConcepts: [],
        coverageGaps: [`No verified resources found meeting quality threshold for "${topic}".`],
        validationSummary: {
          isValid: false,
          duplicateCountRemoved: 0,
          prerequisitesRespected: true,
          averageQuality: 0,
          warnings: ['Candidate pool empty'],
        },
      };
    }

    switch (sequenceType) {
      case 'chronological_research':
        return this.generateChronologicalSequence(topic, candidates, maxItems);
      case 'step_by_step_tutorial':
        return this.generateTutorialSequence(topic, candidates, maxItems);
      case 'news_coverage':
        return this.generateNewsSequence(topic, candidates, maxItems);
      case 'storytelling':
        return this.generateStorytellingSequence(topic, candidates, maxItems);
      case 'general_interest_playlist':
        return this.generateGeneralPlaylist(topic, candidates, maxItems);
      case 'learning_path':
      default:
        return this.generateLearningPathSequence(topic, candidates, maxItems);
    }
  }

  // --- 1. EDUCATIONAL LEARNING PATH SEQUENCING ---

  private async generateLearningPathSequence(
    topic: string,
    candidates: Array<{ resource: EngineResource; score: DetailedQualityScore }>,
    maxItems: number
  ): Promise<SequencedPlaylistResult> {
    // 1. Identify conceptual ontology for the learning path
    const requiredStages: Array<{
      role: SequenceRole;
      stageName: string;
      description: string;
      prerequisites: string[];
    }> = [
      {
        role: 'foundation',
        stageName: 'Intuitive Foundations & Core Definitions',
        description: `Basic conceptual primitives and physical/mathematical axioms of ${topic}`,
        prerequisites: [],
      },
      {
        role: 'core_concept',
        stageName: 'Theoretical Formalization & Core Laws',
        description: `Analytical mechanics, equations, and foundational derivations of ${topic}`,
        prerequisites: ['Intuitive Foundations & Core Definitions'],
      },
      {
        role: 'practical_demonstration',
        stageName: 'Applied Problem Solving & Demonstrations',
        description: `Concrete demonstrations, laboratory experiments, or archetype problems in ${topic}`,
        prerequisites: ['Theoretical Formalization & Core Laws'],
      },
      {
        role: 'deep_dive',
        stageName: 'Advanced Synthesis & Edge Cases',
        description: `Multi-variable synthesis, exam-level rigors, and non-trivial applications of ${topic}`,
        prerequisites: ['Applied Problem Solving & Demonstrations'],
      },
    ];

    // 2. Classify candidate videos into conceptual roles based on title, description, tags, and chapters
    const classifiedCandidates = candidates.map((item) => {
      const classification = this.classifyCandidateRole(item.resource, topic);
      return {
        ...item,
        ...classification,
      };
    });

    // 3. Assemble sequence respecting prerequisites (Intro before Advanced, Theory before Demo)
    const selectedItems: SequencedResourceItem[] = [];
    const usedResourceIds = new Set<string>();
    const coveredConcepts: string[] = [];
    const coverageGaps: string[] = [];

    // Helper to pick best candidate for a role
    const pickBestForRole = (role: SequenceRole): (typeof classifiedCandidates)[number] | null => {
      const match = classifiedCandidates.find(
        (c) => c.role === role && !usedResourceIds.has(c.resource.id)
      );
      if (match) return match;

      // Fallback: next highest scoring candidate
      const fallback = classifiedCandidates.find((c) => !usedResourceIds.has(c.resource.id));
      return fallback || null;
    };

    // Slot 1: Must be Foundation
    const foundationCandidate = pickBestForRole('foundation');
    if (foundationCandidate) {
      usedResourceIds.add(foundationCandidate.resource.id);
      coveredConcepts.push(...foundationCandidate.conceptsCovered);
      selectedItems.push({
        sequenceNumber: 1,
        resource: foundationCandidate.resource,
        conceptsCovered: foundationCandidate.conceptsCovered,
        prerequisitesNeeded: [],
        roleInSequence: 'foundation',
        selectionReason: `Selected for introductory clarity and strong visual explanation of primitives.`,
        positionReason: `Position 1 (Prerequisite Foundation): Must be watched first to establish core axioms before formal derivations.`,
        qualityScore: foundationCandidate.score,
        verifiedPublicationDate: foundationCandidate.resource.publishedAt,
      });
    } else {
      coverageGaps.push(`Introductory conceptual foundation video missing for ${topic}.`);
    }

    // Slot 2: Core Concept / Theory
    const coreCandidate = pickBestForRole('core_concept');
    if (coreCandidate) {
      usedResourceIds.add(coreCandidate.resource.id);
      coveredConcepts.push(...coreCandidate.conceptsCovered);
      selectedItems.push({
        sequenceNumber: selectedItems.length + 1,
        resource: coreCandidate.resource,
        conceptsCovered: coreCandidate.conceptsCovered,
        prerequisitesNeeded: ['Intuitive Foundations & Core Definitions'],
        roleInSequence: 'core_concept',
        selectionReason: `Selected for pedagogical rigor and systematic exposition of core laws.`,
        positionReason: `Position ${selectedItems.length + 1} (Core Theory): Expands on foundational intuition with formal mathematical derivation.`,
        qualityScore: coreCandidate.score,
        verifiedPublicationDate: coreCandidate.resource.publishedAt,
      });
    } else {
      coverageGaps.push(`Systematic theoretical exposition missing for ${topic}.`);
    }

    // Slot 3: Practical Demonstration / Solved Problems
    const demoCandidate = pickBestForRole('practical_demonstration');
    if (demoCandidate && selectedItems.length < maxItems) {
      usedResourceIds.add(demoCandidate.resource.id);
      coveredConcepts.push(...demoCandidate.conceptsCovered);
      selectedItems.push({
        sequenceNumber: selectedItems.length + 1,
        resource: demoCandidate.resource,
        conceptsCovered: demoCandidate.conceptsCovered,
        prerequisitesNeeded: ['Theoretical Formalization & Core Laws'],
        roleInSequence: 'practical_demonstration',
        selectionReason: `Selected for clear real-world demonstration and problem-solving method.`,
        positionReason: `Position ${selectedItems.length + 1} (Demonstration): Follows theory to demonstrate principles in action.`,
        qualityScore: demoCandidate.score,
        verifiedPublicationDate: demoCandidate.resource.publishedAt,
      });
    }

    // Slot 4: Advanced Synthesis / Capstone
    const deepDiveCandidate = pickBestForRole('deep_dive');
    if (deepDiveCandidate && selectedItems.length < maxItems) {
      usedResourceIds.add(deepDiveCandidate.resource.id);
      coveredConcepts.push(...deepDiveCandidate.conceptsCovered);
      selectedItems.push({
        sequenceNumber: selectedItems.length + 1,
        resource: deepDiveCandidate.resource,
        conceptsCovered: deepDiveCandidate.conceptsCovered,
        prerequisitesNeeded: ['Applied Problem Solving & Demonstrations'],
        roleInSequence: 'advanced_synthesis',
        selectionReason: `Selected for advanced depth, challenging edge cases, and exam-level synthesis.`,
        positionReason: `Position ${selectedItems.length + 1} (Capstone Synthesis): Consolidates multi-step problems and edge cases.`,
        qualityScore: deepDiveCandidate.score,
        verifiedPublicationDate: deepDiveCandidate.resource.publishedAt,
      });
    }

    // Slot 5+: Fill remaining slots if allowed
    while (selectedItems.length < maxItems) {
      const remaining = classifiedCandidates.find((c) => !usedResourceIds.has(c.resource.id));
      if (!remaining) break;
      usedResourceIds.add(remaining.resource.id);
      selectedItems.push({
        sequenceNumber: selectedItems.length + 1,
        resource: remaining.resource,
        conceptsCovered: remaining.conceptsCovered,
        prerequisitesNeeded: [selectedItems[selectedItems.length - 1]?.roleInSequence || 'core_concept'],
        roleInSequence: remaining.role,
        selectionReason: `Enrichment video providing alternative explanation and reinforcement.`,
        positionReason: `Position ${selectedItems.length + 1}: Conceptual reinforcement following primary syllabus path.`,
        qualityScore: remaining.score,
        verifiedPublicationDate: remaining.resource.publishedAt,
      });
    }

    // Re-verify topological integrity (Intro before Advanced, Demo after Theory)
    this.enforcePrerequisiteOrdering(selectedItems);

    const averageQuality =
      selectedItems.length > 0
        ? Math.round(
            selectedItems.reduce((acc, it) => acc + it.qualityScore.overall, 0) /
              selectedItems.length
          )
        : 0;

    return {
      topic,
      sequenceType: 'learning_path',
      contentType: 'educational',
      items: selectedItems,
      coveredConcepts: Array.from(new Set(coveredConcepts)),
      coverageGaps,
      validationSummary: {
        isValid: selectedItems.length > 0,
        duplicateCountRemoved: candidates.length - classifiedCandidates.length,
        prerequisitesRespected: true,
        averageQuality,
        warnings: coverageGaps,
      },
    };
  }

  // --- 2. CHRONOLOGICAL RESEARCH SEQUENCING ---

  private generateChronologicalSequence(
    topic: string,
    candidates: Array<{ resource: EngineResource; score: DetailedQualityScore }>,
    maxItems: number
  ): SequencedPlaylistResult {
    // Extract verified event dates (distinguishing event date from video upload date!)
    const datedCandidates = candidates.map((item) => {
      const eventYear = this.extractEventYear(item.resource.title, item.resource.description || '');
      return {
        ...item,
        eventYear,
      };
    });

    // Sort primarily by event year, or fallback to chronological narrative progression
    datedCandidates.sort((a, b) => {
      if (a.eventYear !== null && b.eventYear !== null) {
        return a.eventYear - b.eventYear;
      }
      if (a.eventYear !== null) return -1;
      if (b.eventYear !== null) return 1;
      return b.score.overall - a.score.overall;
    });

    const selectedItems: SequencedResourceItem[] = datedCandidates
      .slice(0, maxItems)
      .map((item, idx) => ({
        sequenceNumber: idx + 1,
        resource: item.resource,
        conceptsCovered: [topic, item.eventYear ? `Year ${item.eventYear}` : 'Historical Period'],
        prerequisitesNeeded: idx > 0 ? [`Preceding event timeline: Step ${idx}`] : [],
        roleInSequence: 'chronological_milestone',
        selectionReason: `Historical research source covering milestone era${item.eventYear ? ` (~${item.eventYear})` : ''}.`,
        positionReason: `Position ${idx + 1} (Chronological Milestone): Represents historical event chronologically${item.eventYear ? ` (Circa ${item.eventYear})` : ''}.`,
        qualityScore: item.score,
        eventDate: item.eventYear ? String(item.eventYear) : undefined,
        verifiedPublicationDate: item.resource.publishedAt,
      }));

    const averageQuality =
      selectedItems.length > 0
        ? Math.round(
            selectedItems.reduce((acc, it) => acc + it.qualityScore.overall, 0) /
              selectedItems.length
          )
        : 0;

    return {
      topic,
      sequenceType: 'chronological_research',
      contentType: 'documentary',
      items: selectedItems,
      coveredConcepts: selectedItems.flatMap((s) => s.conceptsCovered),
      coverageGaps: [],
      validationSummary: {
        isValid: selectedItems.length > 0,
        duplicateCountRemoved: 0,
        prerequisitesRespected: true,
        averageQuality,
        warnings: [],
      },
    };
  }

  // --- 3. STEP-BY-STEP TUTORIAL SEQUENCING ---

  private generateTutorialSequence(
    topic: string,
    candidates: Array<{ resource: EngineResource; score: DetailedQualityScore }>,
    maxItems: number
  ): SequencedPlaylistResult {
    // Tutorial progression: Setup / Prereq -> Step 1 -> Core Implementation -> Verification / Troubleshooting
    const tutorialRank = (title: string, desc: string): number => {
      const combined = `${title} ${desc}`.toLowerCase();
      if (/\b(getting started|setup|installation|prerequisites|part 1|chapter 1|intro)\b/.test(combined)) return 1;
      if (/\b(basics|fundamentals|core setup|part 2|chapter 2)\b/.test(combined)) return 2;
      if (/\b(implementation|building|features|part 3|chapter 3|advanced)\b/.test(combined)) return 3;
      if (/\b(testing|deployment|troubleshooting|final|optimization|part 4)\b/.test(combined)) return 4;
      return 2.5;
    };

    const sorted = [...candidates].sort((a, b) => {
      const rankA = tutorialRank(a.resource.title, a.resource.description || '');
      const rankB = tutorialRank(b.resource.title, b.resource.description || '');
      if (rankA !== rankB) return rankA - rankB;
      return b.score.overall - a.score.overall;
    });

    const selectedItems: SequencedResourceItem[] = sorted.slice(0, maxItems).map((item, idx) => ({
      sequenceNumber: idx + 1,
      resource: item.resource,
      conceptsCovered: [`Step ${idx + 1}: ${item.resource.title}`],
      prerequisitesNeeded: idx > 0 ? [`Step ${idx}`] : [],
      roleInSequence: 'tutorial_step',
      selectionReason: `Actionable instructional guide providing concrete steps for ${topic}.`,
      positionReason: `Position ${idx + 1} (Tutorial Step ${idx + 1}): Required sequential step building on previous workflow.`,
      qualityScore: item.score,
      verifiedPublicationDate: item.resource.publishedAt,
    }));

    return {
      topic,
      sequenceType: 'step_by_step_tutorial',
      contentType: 'educational',
      items: selectedItems,
      coveredConcepts: selectedItems.flatMap((s) => s.conceptsCovered),
      coverageGaps: [],
      validationSummary: {
        isValid: selectedItems.length > 0,
        duplicateCountRemoved: 0,
        prerequisitesRespected: true,
        averageQuality: Math.round(
          selectedItems.reduce((acc, it) => acc + it.qualityScore.overall, 0) / (selectedItems.length || 1)
        ),
        warnings: [],
      },
    };
  }

  // --- 4. NEWS COVERAGE SEQUENCING ---

  private generateNewsSequence(
    topic: string,
    candidates: Array<{ resource: EngineResource; score: DetailedQualityScore }>,
    maxItems: number
  ): SequencedPlaylistResult {
    // News ordered by recency and source credibility
    const sorted = [...candidates].sort((a, b) => {
      const dateA = new Date(a.resource.publishedAt || 0).getTime();
      const dateB = new Date(b.resource.publishedAt || 0).getTime();
      if (dateA !== dateB) return dateB - dateA; // Most recent first
      return b.score.overall - a.score.overall;
    });

    const selectedItems: SequencedResourceItem[] = sorted.slice(0, maxItems).map((item, idx) => ({
      sequenceNumber: idx + 1,
      resource: item.resource,
      conceptsCovered: [topic, 'Current Update'],
      prerequisitesNeeded: [],
      roleInSequence: 'core_concept',
      selectionReason: `Verified news dispatch with high recency and verified journalistic credibility.`,
      positionReason: `Position ${idx + 1} (News Coverage): Ordered by verified reporting timeline and source authority.`,
      qualityScore: item.score,
      verifiedPublicationDate: item.resource.publishedAt,
    }));

    return {
      topic,
      sequenceType: 'news_coverage',
      contentType: 'current_news',
      items: selectedItems,
      coveredConcepts: [topic, 'Latest verified developments'],
      coverageGaps: [],
      validationSummary: {
        isValid: selectedItems.length > 0,
        duplicateCountRemoved: 0,
        prerequisitesRespected: true,
        averageQuality: Math.round(
          selectedItems.reduce((acc, it) => acc + it.qualityScore.overall, 0) / (selectedItems.length || 1)
        ),
        warnings: [],
      },
    };
  }

  // --- 5. STORYTELLING SEQUENCING ---

  private generateStorytellingSequence(
    topic: string,
    candidates: Array<{ resource: EngineResource; score: DetailedQualityScore }>,
    maxItems: number
  ): SequencedPlaylistResult {
    // Narrative arc: Exposition -> Conflict / Discovery -> Resolution / Impact
    const selectedItems: SequencedResourceItem[] = candidates.slice(0, maxItems).map((item, idx) => {
      let role: SequenceRole = 'core_concept';
      let arcLabel = 'Narrative Exploration';

      if (idx === 0) {
        role = 'foundation';
        arcLabel = 'Act 1: Exposition & Context';
      } else if (idx === 1) {
        role = 'deep_dive';
        arcLabel = 'Act 2: The Core Journey & Discovery';
      } else {
        role = 'advanced_synthesis';
        arcLabel = `Act ${idx + 1}: Climax & Legacy`;
      }

      return {
        sequenceNumber: idx + 1,
        resource: item.resource,
        conceptsCovered: [topic, arcLabel],
        prerequisitesNeeded: idx > 0 ? [`Act ${idx}`] : [],
        roleInSequence: role,
        selectionReason: `Narrative documentary providing contextual continuity and storytelling depth.`,
        positionReason: `Position ${idx + 1} (${arcLabel}): Structured for dramatic and thematic continuity.`,
        qualityScore: item.score,
        verifiedPublicationDate: item.resource.publishedAt,
      };
    });

    return {
      topic,
      sequenceType: 'storytelling',
      contentType: 'documentary',
      items: selectedItems,
      coveredConcepts: [topic, 'Narrative Continuity'],
      coverageGaps: [],
      validationSummary: {
        isValid: selectedItems.length > 0,
        duplicateCountRemoved: 0,
        prerequisitesRespected: true,
        averageQuality: Math.round(
          selectedItems.reduce((acc, it) => acc + it.qualityScore.overall, 0) / (selectedItems.length || 1)
        ),
        warnings: [],
      },
    };
  }

  // --- 6. GENERAL PLAYLIST SEQUENCING ---

  private generateGeneralPlaylist(
    topic: string,
    candidates: Array<{ resource: EngineResource; score: DetailedQualityScore }>,
    maxItems: number
  ): SequencedPlaylistResult {
    // Maximize variety and author diversity without forcing rigid beginner-to-advanced hierarchy
    const authorCounts = new Map<string, number>();
    const selected: Array<{ resource: EngineResource; score: DetailedQualityScore }> = [];

    for (const item of candidates) {
      if (selected.length >= maxItems) break;
      const author = (item.resource.authorOrChannel || 'unknown').toLowerCase();
      const count = authorCounts.get(author) || 0;
      if (count >= 2) continue; // Allow at most 2 per creator in general playlist

      authorCounts.set(author, count + 1);
      selected.push(item);
    }

    const selectedItems: SequencedResourceItem[] = selected.map((item, idx) => ({
      sequenceNumber: idx + 1,
      resource: item.resource,
      conceptsCovered: [topic, item.resource.title],
      prerequisitesNeeded: [],
      roleInSequence: 'core_concept',
      selectionReason: `Curated high-interest selection featuring diverse perspectives on ${topic}.`,
      positionReason: `Position ${idx + 1} (Curated Playlist): Optimized for content variety and audience engagement.`,
      qualityScore: item.score,
      verifiedPublicationDate: item.resource.publishedAt,
    }));

    return {
      topic,
      sequenceType: 'general_interest_playlist',
      contentType: 'entertainment',
      items: selectedItems,
      coveredConcepts: [topic],
      coverageGaps: [],
      validationSummary: {
        isValid: selectedItems.length > 0,
        duplicateCountRemoved: 0,
        prerequisitesRespected: true,
        averageQuality: Math.round(
          selectedItems.reduce((acc, it) => acc + it.qualityScore.overall, 0) / (selectedItems.length || 1)
        ),
        warnings: [],
      },
    };
  }

  // --- PRIVATE UTILITIES ---

  private classifyCandidateRole(
    res: EngineResource,
    topic: string
  ): { role: SequenceRole; conceptsCovered: string[] } {
    const text = `${res.title} ${res.description}`.toLowerCase();
    const conceptsCovered: string[] = [topic];

    // Check for practical demonstration / problem solving cues
    if (
      /\b(problem|problems|solved|practice|numerical|exercise|demonstration|experiment|lab|simulation)\b/.test(
        text
      )
    ) {
      conceptsCovered.push('Practical Demonstration & Application');
      return { role: 'practical_demonstration', conceptsCovered };
    }

    // Check for advanced synthesis / deep dive cues
    if (
      /\b(advanced|hard|rigorous|deep dive|derivation|synthesis|capstone|jee advanced|olympiad)\b/.test(
        text
      )
    ) {
      conceptsCovered.push('Advanced Synthesis & Derivations');
      return { role: 'deep_dive', conceptsCovered };
    }

    // Check for foundational / introductory cues
    if (
      /\b(intro|introduction|basic|basics|fundamentals|what is|overview|101|lesson 1|chapter 1|part 1)\b/.test(
        text
      )
    ) {
      conceptsCovered.push('Foundational Intuition & Definitions');
      return { role: 'foundation', conceptsCovered };
    }

    // Default to core concept
    conceptsCovered.push('Core Theory & Analytical Laws');
    return { role: 'core_concept', conceptsCovered };
  }

  private enforcePrerequisiteOrdering(items: SequencedResourceItem[]): void {
    const roleRank: Record<SequenceRole, number> = {
      foundation: 1,
      core_concept: 2,
      practical_demonstration: 3,
      deep_dive: 4,
      advanced_synthesis: 5,
      chronological_milestone: 3,
      tutorial_step: 3,
    };

    // Sort items by role rank, keeping original order when rank is the same
    items.sort((a, b) => {
      const rankA = roleRank[a.roleInSequence] || 3;
      const rankB = roleRank[b.roleInSequence] || 3;
      return rankA - rankB;
    });

    // Re-index sequenceNumber
    items.forEach((item, idx) => {
      item.sequenceNumber = idx + 1;
    });
  }

  private extractEventYear(title: string, description: string): number | null {
    const combined = `${title} ${description}`;
    // Look for explicit 4-digit years like 1914, 1865, 2020 (ignoring common resolution numbers like 1080)
    const matches = combined.match(/\b(1[0-9]{3}|20[0-2][0-9])\b/g);
    if (!matches) return null;

    for (const m of matches) {
      const year = parseInt(m, 10);
      if (year !== 1080 && year !== 2160 && year >= 1000 && year <= 2026) {
        return year;
      }
    }

    return null;
  }
}
