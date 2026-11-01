import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ResourceEngineOrchestrator } from '../src/lib/resource-engine/orchestrator';
import { LearnerGoalInput } from '../src/lib/resource-engine/types';

describe('PENCILL RESOURCE ENGINE 3.0: RAG Regression & Verification Suite', () => {
  it('generates a 4-module Advanced RAG course with zero duplicate videos and functional quizzes', async () => {
    const input: LearnerGoalInput = {
      topic: 'Advanced Retrieval-Augmented Generation (RAG) Architectures',
      level: 'advanced',
      learningGoal: 'master_subject',
      learningStyle: 'balanced',
      weeklyStudyHours: 10,
      targetWeeks: 4,
      language: 'en',
      depth: 'rigorous',
    };

    const orchestrator = new ResourceEngineOrchestrator();
    const result = await orchestrator.execute(input, 'test-user-rag');

    // 1. Course Generation & Curriculum Structure
    assert.equal(result.success, true, 'Synthesis must succeed');
    assert.ok(result.courseId, 'Course ID must be generated');
    assert.equal(
      result.curriculum.modules.length,
      4,
      'Advanced RAG syllabus must contain exactly 4 distinct cohesive modules'
    );

    const [mod1, mod2, mod3, mod4] = result.curriculum.modules;
    assert.match(mod1.title, /Vector Search|Embedding/i, 'Module 1 must focus on vector search');
    assert.match(mod2.title, /Chunking|Hybrid/i, 'Module 2 must focus on chunking and hybrid search');
    assert.match(mod3.title, /Re-ranking|Query Transformation|Routing/i, 'Module 3 must focus on re-ranking');
    assert.match(mod4.title, /Evaluation|Guardrails|Observability/i, 'Module 4 must focus on evaluation');

    // 2. Strict Cross-Module Video Deduplication (REGRESSION CHECK)
    // The previous bug showed identical introductory videos across all 4 modules.
    const allAssignedVideoUrls: string[] = [];
    const allAssignedVideoIds: string[] = [];

    result.assignments.forEach((assignment, index) => {
      assert.ok(
        assignment.videos.length > 0,
        `Module ${index + 1} (${assignment.moduleTitle}) must have at least one verified video lecture`
      );

      for (const video of assignment.videos) {
        const videoUrl = video.canonicalUrl || video.url;
        assert.ok(videoUrl, 'Video must have a valid URL');
        assert.ok(video.durationSeconds > 0, 'Video must have positive duration');
        assert.equal(video.passedRelevanceGate, true, 'Assigned video must pass relevance gate');

        // Check against duplicate video URL
        const canonicalUrl = videoUrl.toLowerCase().split('&')[0];
        assert.ok(
          !allAssignedVideoUrls.includes(canonicalUrl),
          `REGRESSION DETECTED: Video URL "${videoUrl}" in Module ${index + 1} was already assigned in a previous module!`
        );
        allAssignedVideoUrls.push(canonicalUrl);

        // Check against duplicate external ID
        assert.ok(
          !allAssignedVideoIds.includes(video.externalId),
          `REGRESSION DETECTED: Video ID "${video.externalId}" in Module ${index + 1} was already assigned in a previous module!`
        );
        allAssignedVideoIds.push(video.externalId);
      }
    });

    // 3. Module-Specific Topic Relevance Verification
    const mod1Videos = result.assignments[0].videos.map((v) => v.title.toLowerCase()).join(' ');
    assert.ok(
      mod1Videos.includes('vector') || mod1Videos.includes('faiss') || mod1Videos.includes('ann') || mod1Videos.includes('embedding'),
      'Module 1 videos must specifically cover Vector Search, ANN, or Embeddings'
    );

    const mod2Videos = result.assignments[1].videos.map((v) => v.title.toLowerCase()).join(' ');
    assert.ok(
      mod2Videos.includes('chunk') || mod2Videos.includes('hybrid') || mod2Videos.includes('bm25'),
      'Module 2 videos must specifically cover Chunking or Hybrid Search'
    );

    const mod3Videos = result.assignments[2].videos.map((v) => v.title.toLowerCase()).join(' ');
    assert.ok(
      mod3Videos.includes('rerank') || mod3Videos.includes('cross-encoder') || mod3Videos.includes('query') || mod3Videos.includes('routing'),
      'Module 3 videos must specifically cover Re-ranking, Cross-Encoders, or Query Transformation'
    );

    const mod4Videos = result.assignments[3].videos.map((v) => v.title.toLowerCase()).join(' ');
    assert.ok(
      mod4Videos.includes('eval') || mod4Videos.includes('ragas') || mod4Videos.includes('trulens') || mod4Videos.includes('guardrail') || mod4Videos.includes('observability'),
      'Module 4 videos must specifically cover Evaluation, Observability, or Guardrails'
    );

    // 4. Substantive Reading Material
    result.assignments.forEach((assignment, index) => {
      assert.ok(
        assignment.readings.length > 0,
        `Module ${index + 1} must have authoritative reading documentation`
      );
      for (const reading of assignment.readings) {
        const readingUrl = reading.canonicalUrl || reading.url;
        assert.ok(readingUrl && readingUrl.startsWith('https://'), 'Reading must link to HTTPS documentation');
        assert.ok(reading.title.length > 10, 'Reading must have descriptive title');
      }
    });

    // 5. Functional Diagnostic Formative Quizzes (REGRESSION CHECK)
    // The previous bug showed quiz placeholders or missing quiz sessions.
    assert.ok(result.quizzes && result.quizzes.length >= 4, 'Engine must return at least 4 generated quizzes');

    result.assignments.forEach((assignment, index) => {
      const quiz = assignment.quiz;
      assert.ok(quiz, `Module ${index + 1} must contain a generated quiz`);
      assert.ok(
        quiz.questions.length >= 4,
        `Module ${index + 1} quiz must contain at least 4-5 rigorous questions (got ${quiz.questions.length})`
      );

      quiz.questions.forEach((q, qIdx) => {
        assert.ok(q.prompt && q.prompt.length > 15, `Question ${qIdx + 1} must have a detailed prompt`);
        assert.equal(q.options.length, 4, `Question ${qIdx + 1} must have exactly 4 answer options`);
        assert.ok(
          typeof q.correctOptionIndex === 'number' &&
            q.correctOptionIndex >= 0 &&
            q.correctOptionIndex < 4,
          `Question ${qIdx + 1} must have a valid correctOptionIndex between 0 and 3 (got ${q.correctOptionIndex})`
        );
        assert.ok(
          q.explanation && q.explanation.length > 20,
          `Question ${qIdx + 1} must have an in-depth pedagogical explanation`
        );
        assert.ok(
          q.learningObjectiveReference,
          `Question ${qIdx + 1} must be tied to a learning objective`
        );

        // Ensure distinct options (no placeholders or duplicate options)
        const uniqueOptions = new Set(q.options);
        assert.equal(
          uniqueOptions.size,
          4,
          `Question ${qIdx + 1} in Module ${index + 1} must have 4 distinct options`
        );
      });
    });

    // 6. Persistence & Module Checkpoint Attachment
    assert.ok(result.course, 'Persisted course object must be returned');
    assert.ok(result.course.modules, 'Persisted course modules must exist');
    assert.equal(result.course.modules.length, 4, 'Persisted course must have 4 modules');

    result.course.modules.forEach((mod, idx) => {
      assert.ok(
        (mod as any).checkpointQuestions && (mod as any).checkpointQuestions.length >= 4,
        `Persisted Module ${idx + 1} must have checkpointQuestions populated with real questions`
      );
    });

    // 7. Course Quality Gates Validation
    assert.ok(result.qualityGates, 'Course Quality Gates must be present on execution result');
    assert.equal(result.qualityGates.allPassed, true, 'All 6 Course Quality Gates must PASS');
    assert.equal(
      result.qualityGates.resourceValidity.status,
      'PASSED',
      'Resource Validity Gate must PASS (0 duplicate videos)'
    );
    assert.equal(
      result.qualityGates.assessmentValidity.status,
      'PASSED',
      'Assessment Validity Gate must PASS (100% functional quizzes)'
    );
    assert.equal(
      result.qualityGates.curriculumQuality.status,
      'PASSED',
      'Curriculum Quality Gate must PASS'
    );
    assert.equal(
      result.qualityGates.topicCoverage.status,
      'PASSED',
      'Topic Coverage Gate must PASS'
    );
  });
});
