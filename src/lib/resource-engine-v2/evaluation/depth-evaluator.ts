import {
  AnalyzedObjective,
  NormalizedResourceCandidate,
  DepthEvaluation,
  EducationalDepthTier,
} from '../types';

export class EducationalDepthEvaluator {
  /**
   * Deterministically evaluates the pedagogical depth tier and score of a resource candidate.
   * Leverages duration, structural markers (timestamps, exercises, proofs, repos), and modality.
   */
  evaluate(
    objective: AnalyzedObjective,
    candidate: NormalizedResourceCandidate
  ): DepthEvaluation {
    const signalsObserved: string[] = [];
    const evidence: string[] = [];

    const titleLower = candidate.title.toLowerCase();
    const descLower = (candidate.description || '').toLowerCase();
    const combined = `${titleLower} ${descLower}`;

    let score = 50;
    let tier: EducationalDepthTier = 'focused_concept';
    let confidence = 0.8;

    // 1. Modality-specific baseline evaluations
    if (candidate.modality === 'paper') {
      tier = 'in_depth_lecture';
      score = 78;
      signalsObserved.push('academic_peer_reviewed_or_preprint');
      evidence.push('Academic paper modality provides rigorous conceptual and methodological depth');
    } else if (candidate.modality === 'monograph') {
      tier = 'comprehensive_course';
      score = 88;
      signalsObserved.push('formal_textbook_or_monograph');
      evidence.push('Monograph modality provides comprehensive curriculum coverage');
    } else if (candidate.modality === 'project') {
      tier = 'comprehensive_course';
      score = 85;
      signalsObserved.push('practical_project_implementation');
      evidence.push('Project structure provides multi-unit implementation depth');
    } else if (candidate.modality === 'documentation') {
      tier = 'focused_concept';
      score = 68;
      signalsObserved.push('authoritative_api_specification');
      evidence.push('Technical documentation provides precise specification and usage depth');
    } else {
      // Modality: 'video', 'practice', 'quiz', 'formulae'
      if (candidate.durationSeconds !== undefined) {
        const d = candidate.durationSeconds;
        evidence.push(`Video duration observed: ${d} seconds (${Math.round(d / 60)} min)`);

        if (d < 180) {
          tier = 'superficial_overview';
          score = 25;
          signalsObserved.push('short_form_under_3_minutes');
          evidence.push('Resource is ultra-short (< 3 min); insufficient duration for deep pedagogical derivation');
        } else if (d < 1200) {
          // 3 to 20 minutes
          tier = 'focused_concept';
          score = 58;
          signalsObserved.push('focused_concept_duration');
          evidence.push('Resource duration (3-20 min) is ideal for a focused concept or single syntax primitive');
        } else if (d <= 4500) {
          // 20 to 75 minutes
          tier = 'in_depth_lecture';
          score = 78;
          signalsObserved.push('lecture_length_duration');
          evidence.push('Resource duration (20-75 min) supports comprehensive lecture derivation and worked problems');
        } else {
          // > 75 minutes
          tier = 'comprehensive_course';
          score = 90;
          signalsObserved.push('extended_course_or_masterclass_duration');
          evidence.push('Resource duration (> 75 min) represents an extensive course, bootcamp, or complete topic treatise');
        }
      } else {
        // Duration unknown
        confidence = 0.55;
        signalsObserved.push('unknown_duration_metadata');
        evidence.push('Duration metadata is unavailable; depth evaluated purely from title, description, and structural markers');

        // Check textual cues for courses
        if (/\b(full\s*course|complete\s*(guide|tutorial|masterclass)|bootcamp|1[0-9]\s*hours?)\b/i.test(titleLower)) {
          tier = 'comprehensive_course';
          score = 80;
        } else if (/\b(lecture|deep\s*dive|derivation|step\s*by\s*step)\b/i.test(titleLower)) {
          tier = 'in_depth_lecture';
          score = 72;
        } else {
          tier = 'focused_concept';
          score = 55;
        }
      }
    }

    // 2. Structural pedagogical markers in description & title
    // Timestamp chapter markers (e.g., 0:00, 12:34)
    const timestampRegex = /\b\d{1,2}:\d{2}(:\d{2})?\b/g;
    const timestampMatches = (candidate.description || '').match(timestampRegex);
    if (timestampMatches && timestampMatches.length >= 3) {
      score = Math.min(100, score + 8);
      signalsObserved.push('structured_chapter_timestamps');
      evidence.push(`Description includes structured chapter timestamps (${timestampMatches.length} markers observed)`);
    }

    // Worked exercises and step-by-step problem sets
    if (/\b(worked\s*examples?|practice\s*problems?|step\s*by\s*step\s*proof|problem\s*set|solutions?)\b/i.test(combined)) {
      score = Math.min(100, score + 6);
      signalsObserved.push('worked_problems_and_exercises');
      evidence.push('Observed explicit problem-solving and worked exercise pedagogy');
    }

    // GitHub repository link or code walkthrough indicators
    if (/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+/i.test(candidate.description || '')) {
      score = Math.min(100, score + 6);
      signalsObserved.push('code_repository_linked');
      evidence.push('Resource description links to an active GitHub code repository');
    }

    // Mathematical rigor indicators
    if (/\b(mathematical\s*derivation|formal\s*proof|rigorous|theorem\s*and\s*proof)\b/i.test(combined)) {
      score = Math.min(100, score + 6);
      signalsObserved.push('mathematical_rigor');
      evidence.push('Resource contains formal mathematical derivation or rigorous proof markers');
    }

    // Playlist indicators
    if (candidate.playlist?.isPlaylist) {
      signalsObserved.push('playlist_curriculum');
      if ((candidate.playlist.playlistItemCount || 0) > 3) {
        tier = 'comprehensive_course';
        score = Math.max(score, 88);
        evidence.push(`Candidate is part of a verified playlist series (${candidate.playlist.playlistItemCount} modules)`);
      }
    }

    // Superficial penalty (Shorts, teasers, promo clips)
    if (/\b(#shorts?|short\s*video|trailer|teaser|in\s*60\s*seconds?|in\s*1\s*minute)\b/i.test(combined)) {
      tier = 'superficial_overview';
      score = Math.min(score, 25);
      signalsObserved.push('promotional_or_teaser_marker');
      evidence.push('Resource metadata explicitly indicates short-form teaser, promo, or 60-second summary');
    }

    // Ensure score is strictly within 0-100
    score = Math.max(0, Math.min(100, Math.round(score)));

    // Reconcile tier with structural form factor (rather than pure score)
    if (candidate.playlist?.isPlaylist && (candidate.playlist.playlistItemCount || 0) > 3) {
      tier = 'comprehensive_course';
    } else if (candidate.modality === 'monograph') {
      tier = 'comprehensive_course';
    } else if (candidate.durationSeconds !== undefined) {
      if (candidate.durationSeconds < 180) {
        tier = 'superficial_overview';
      } else if (candidate.durationSeconds < 1200) {
        tier = 'focused_concept';
      } else if (candidate.durationSeconds <= 4500) {
        tier = 'in_depth_lecture';
      } else {
        tier = 'comprehensive_course';
      }
    } else if (candidate.modality === 'paper') {
      tier = 'in_depth_lecture';
    } else if (candidate.modality === 'documentation') {
      tier = 'focused_concept';
    } else if (score < 40) {
      tier = 'superficial_overview';
    }

    return {
      score,
      tier,
      confidence,
      signalsObserved,
      evidence,
    };
  }
}

export { EducationalDepthEvaluator as DepthEvaluator };
