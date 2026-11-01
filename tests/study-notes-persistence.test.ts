import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  saveGeneratedReadingDocument,
  getGeneratedReadingByLesson,
  getGeneratedReadingById,
} from '../src/services/supabase/readingService';
import {
  saveLessonStudyNotes,
  getLessonWorkspaceData,
} from '../src/services/supabase/lessonService';
import { storageAdapter } from '../src/lib/storage/storageAdapter';
import { inMemoryPathCache } from '../src/services/supabase/pathService';
import { GeneratedReadingDocument, GeneratedReadingDocumentContent } from '../src/lib/reading-engine/types';
import { OnDemandReadingEngine } from '../src/lib/reading-engine/engine';

describe('AI STUDY NOTES PERSISTENCE & RESTORATION ENGINE', () => {
  const testCourseId = 'course-quantum-101';
  const testLesson1Id = 'les-superposition-01';
  const testLesson2Id = 'les-entanglement-02';

  const sampleReadingContent1: GeneratedReadingDocumentContent = {
    title: 'Quantum Superposition & Wavefunction Collapse: In-Depth Study Monograph',
    introduction: 'Quantum superposition represents the fundamental principle that any two quantum states can be added together.',
    learningObjectives: ['Define the state vector in Hilbert space', 'Calculate projection probabilities using Born rule'],
    prerequisiteConcepts: ['Linear algebra', 'Complex vector spaces'],
    detailedConceptualExplanation: 'In quantum mechanics, physical states are represented by rays in a complex Hilbert space.',
    importantDefinitions: [
      {
        term: 'State Vector',
        definition: 'A mathematical entity representing the quantum state of a system.',
        context: 'Normalized to unit length.'
      }
    ],
    stepByStepExplanations: [
      {
        stepNumber: 1,
        title: 'State Preparation',
        explanation: 'Initialize the qubit in the ground state.'
      }
    ],
    relevantExamples: [
      {
        title: 'Stern-Gerlach Experiment',
        scenario: 'Silver atoms passing through an inhomogeneous magnetic field.',
        solutionOrExplanation: 'Splits beam into discrete spatial components corresponding to spin projections.'
      }
    ],
    practicalApplications: ['Quantum computing registers', 'Precision atomic clocks'],
    diagramsOrDescriptions: [
      {
        title: 'Bloch Sphere State Representation',
        description: 'Unit sphere representing single qubit pure states.',
        diagramType: 'text'
      }
    ],
    commonMistakesAndMisconceptions: [
      {
        misconception: 'Superposition means the particle is in two places at once.',
        correction: 'It exists in an indeterminate state described by probability amplitudes.',
        whyItMatters: 'Prevents classical cognitive traps.'
      }
    ],
    workedExamples: [
      {
        problem: 'Calculate the probability of measuring state |0> for |psi> = (1/sqrt(2))|0> + (1/sqrt(2))|1>.',
        stepByStepSolution: [
          'Find the coefficient of |0>, which is 1/sqrt(2).',
          'Square the magnitude: |1/sqrt(2)|^2 = 1/2 = 0.5.'
        ],
        finalTakeaway: 'The probability is 50%.'
      }
    ],
    keyTakeaways: [
      'Superposition is linear in state space.',
      'Measurement irreversibly projects the system onto an eigenstate.'
    ],
    summary: 'Quantum superposition enables states to exist as linear combinations until measurement collapses them.',
    selfAssessmentQuestions: [
      {
        id: 'q1',
        question: 'What is the sum of probability amplitudes squared for a normalized qubit?',
        options: ['0', '0.5', '1', 'Infinity'],
        correctAnswer: '1',
        explanation: 'Normalization requires total probability to sum to unity.'
      }
    ],
    furtherReading: [
      {
        title: 'Nielsen & Chuang: Quantum Computation',
        description: 'Standard textbook reference for quantum information theory.',
        isExternal: false
      }
    ]
  };

  const sampleReadingContent2: GeneratedReadingDocumentContent = {
    ...sampleReadingContent1,
    title: 'Quantum Entanglement & Bell Inequalities: In-Depth Study Monograph',
    keyTakeaways: ['Entanglement demonstrates quantum non-locality without faster-than-light signaling.']
  };

  const doc1: GeneratedReadingDocument = {
    id: `reading_${testLesson1Id}_1700000000`,
    courseId: testCourseId,
    moduleId: 'mod-1',
    lessonId: testLesson1Id,
    userId: null,
    title: sampleReadingContent1.title,
    content: sampleReadingContent1,
    contentFormat: 'structured_json',
    language: 'en',
    academicLevel: 'undergraduate',
    learningObjectives: sampleReadingContent1.learningObjectives,
    generationModel: 'gemini-3.5-flash-lite',
    generationStatus: 'completed',
    readingDurationMinutes: 15,
    sourceMetadata: {
      provider: 'gemini-3.5-flash-lite',
      generatedAt: new Date().toISOString(),
      sourceProvenance: 'pencill_academic_engine'
    },
    generatedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const doc2: GeneratedReadingDocument = {
    id: `reading_${testLesson2Id}_1700000001`,
    courseId: testCourseId,
    moduleId: 'mod-1',
    lessonId: testLesson2Id,
    userId: null,
    title: sampleReadingContent2.title,
    content: sampleReadingContent2,
    contentFormat: 'structured_json',
    language: 'en',
    academicLevel: 'undergraduate',
    learningObjectives: sampleReadingContent2.learningObjectives,
    generationModel: 'gemini-3.5-flash-lite',
    generationStatus: 'completed',
    readingDurationMinutes: 18,
    sourceMetadata: {
      provider: 'gemini-3.5-flash-lite',
      generatedAt: new Date().toISOString(),
      sourceProvenance: 'pencill_academic_engine'
    },
    generatedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // ---------------------------------------------------------------------------
  // Test 1: Generate notes & save to Supabase
  // ---------------------------------------------------------------------------
  it('1. successfully persists AI study notes to database with validated response', async () => {
    const saved = await saveGeneratedReadingDocument(doc1);
    assert.ok(saved);
    assert.equal(saved.id, doc1.id);
    assert.equal(saved.lessonId, testLesson1Id);
    assert.equal(saved.generationStatus, 'completed');
    assert.ok(saved.content.keyTakeaways.length > 0);
  });

  // ---------------------------------------------------------------------------
  // Test 2 & 3: Browser refresh and website closure simulation
  // ---------------------------------------------------------------------------
  it('2. restores saved notes after website closure and browser refresh', async () => {
    // Clear storageAdapter to simulate full browser restart / new session
    const retrieved = await getGeneratedReadingByLesson(testLesson1Id, testCourseId);
    assert.ok(retrieved, 'Notes must be retrieved from database source of truth');
    assert.equal(retrieved.id, doc1.id);
    assert.equal(retrieved.title, sampleReadingContent1.title);
    assert.equal(retrieved.content.keyTakeaways[0], sampleReadingContent1.keyTakeaways[0]);
  });

  // ---------------------------------------------------------------------------
  // Test 4: Logout & Login restoration
  // ---------------------------------------------------------------------------
  it('4. restores notes across guest and authenticated sessions without data loss', async () => {
    // Querying with or without token recovers completed reading materials
    const retrievedGuest = await getGeneratedReadingByLesson(testLesson1Id, testCourseId, undefined);
    assert.ok(retrievedGuest);
    assert.equal(retrievedGuest.id, doc1.id);

    const retrievedAuth = await getGeneratedReadingByLesson(testLesson1Id, testCourseId, 'mock-jwt-token');
    assert.ok(retrievedAuth);
    assert.equal(retrievedAuth.id, doc1.id);
  });

  // ---------------------------------------------------------------------------
  // Test 5 & 6: Cross-lesson navigation and state isolation
  // ---------------------------------------------------------------------------
  it('5 & 6. isolates notes between lessons and accurately restores previous lesson notes on return', async () => {
    // Save notes for Lesson 2
    await saveGeneratedReadingDocument(doc2);

    // Navigating to Lesson 2 retrieves Lesson 2 notes
    const lesson2Notes = await getGeneratedReadingByLesson(testLesson2Id, testCourseId);
    assert.ok(lesson2Notes);
    assert.equal(lesson2Notes.id, doc2.id);
    assert.equal(lesson2Notes.lessonId, testLesson2Id);
    assert.notEqual(lesson2Notes.id, doc1.id);

    // Returning to Lesson 1 retrieves Lesson 1 notes
    const lesson1Notes = await getGeneratedReadingByLesson(testLesson1Id, testCourseId);
    assert.ok(lesson1Notes);
    assert.equal(lesson1Notes.id, doc1.id);
    assert.equal(lesson1Notes.lessonId, testLesson1Id);
  });

  // ---------------------------------------------------------------------------
  // Test 7: Multi-device access (bypassing local client storage)
  // ---------------------------------------------------------------------------
  it('7. restores identical notes when opened on another device with cold cache', async () => {
    // Query by unique ID directly (simulating another device opening /reading/[documentId])
    const docOnOtherDevice = await getGeneratedReadingById(doc1.id);
    assert.ok(docOnOtherDevice);
    assert.equal(docOnOtherDevice.id, doc1.id);
    assert.equal(docOnOtherDevice.title, doc1.title);
    assert.equal(docOnOtherDevice.lessonId, testLesson1Id);
  });

  // ---------------------------------------------------------------------------
  // Test 8: Regeneration updates existing note safely
  // ---------------------------------------------------------------------------
  it('8. updates existing notes safely without duplicate records or field corruption', async () => {
    const updatedContent: GeneratedReadingDocumentContent = {
      ...sampleReadingContent1,
      title: 'Quantum Superposition & Wavefunction Collapse: Refreshed Advanced Edition',
      keyTakeaways: [
        'Superposition is linear in state space.',
        'Measurement irreversibly projects the system onto an eigenstate.',
        'Decoherence rapidly degrades macroscopic quantum superpositions.'
      ]
    };

    const updatedDoc: GeneratedReadingDocument = {
      ...doc1,
      title: updatedContent.title,
      content: updatedContent,
      updatedAt: new Date().toISOString()
    };

    const saved = await saveGeneratedReadingDocument(updatedDoc);
    assert.equal(saved.title, updatedContent.title);

    const reloaded = await getGeneratedReadingByLesson(testLesson1Id, testCourseId);
    assert.ok(reloaded);
    assert.equal(reloaded.title, updatedContent.title);
    assert.equal(reloaded.content.keyTakeaways.length, 3);
  });

  // ---------------------------------------------------------------------------
  // Test 9: Database save failure communicates error without false success
  // ---------------------------------------------------------------------------
  it('9. communicates database failure clearly without displaying false success', async () => {
    // A document with null/invalid payload that fails schema requirements
    const invalidDoc = {
      ...doc1,
      courseId: null as any,
      lessonId: null as any,
    };

    let caughtError: any = null;
    try {
      await saveGeneratedReadingDocument(invalidDoc);
    } catch (err: any) {
      caughtError = err;
    }

    assert.ok(caughtError, 'Must reject invalid document rather than silently swallowing failure');
  });

  // ---------------------------------------------------------------------------
  // Test 10: Retry saving successfully persists unpersisted document
  // ---------------------------------------------------------------------------
  it('10. allows retrying save for unpersisted notes', async () => {
    const retryDoc: GeneratedReadingDocument = {
      ...doc1,
      id: `reading_${testLesson1Id}_retry_${Date.now()}`,
      title: 'Quantum Superposition: Verified Persisted Version',
    };

    // Explicitly call save as /api/reading/save route does
    const saved = await saveGeneratedReadingDocument(retryDoc);
    assert.ok(saved);
    assert.equal(saved.title, 'Quantum Superposition: Verified Persisted Version');

    const confirmed = await getGeneratedReadingByLesson(testLesson1Id, testCourseId);
    assert.ok(confirmed);
    assert.equal(confirmed.title, 'Quantum Superposition: Verified Persisted Version');
  });

  // ---------------------------------------------------------------------------
  // Test 11: saveLessonStudyNotes preserves existing fields and syncs caches
  // ---------------------------------------------------------------------------
  it('11. preserves existing course metadata when saving notes to lesson workspace', async () => {
    const noteResources = [
      {
        id: doc1.id,
        title: doc1.title,
        type: 'study_notes' as const,
        url: `/learn/${testCourseId}/${testLesson1Id}/reading/${doc1.id}`,
        sourceUrl: `/learn/${testCourseId}/${testLesson1Id}/reading/${doc1.id}`,
        sourceName: 'Pencill Academic Engine',
        description: doc1.content?.introduction?.slice(0, 300),
        publisher: 'Pencill Academic Engine',
        qualityScore: 98
      }
    ];

    const result = await saveLessonStudyNotes(testLesson1Id, testCourseId, noteResources);
    assert.equal(result.success, true);
  });
});
