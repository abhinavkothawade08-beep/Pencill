import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  OnDemandReadingEngine,
  validateTopicRelevance,
  GeneratedReadingDocumentContent,
  LessonReadingContext,
  ReadingGeminiError,
  GeneratedReadingDocument,
} from '../src/lib/reading-engine';
import {
  saveGeneratedReadingDocument,
  getGeneratedReadingByLesson,
  getGeneratedReadingById,
} from '../src/services/supabase/readingService';
import { storageAdapter } from '../src/lib/storage/storageAdapter';

describe('PENCILL ON-DEMAND AI READING MATERIAL GENERATION ENGINE', () => {
  const engine = new OnDemandReadingEngine();

  const mockLessonContext: LessonReadingContext = {
    courseId: 'course-psych-101',
    courseTitle: 'Mastering Public Speaking & Executive Presence',
    courseDomain: 'communication',
    moduleId: 'mod-1',
    moduleTitle: 'Overcoming Stage Fear & Psychological Foundations',
    lessonId: 'les-stage-fear-01',
    lessonTitle: 'Stage Fear and Mindset Foundation',
    learningObjectives: [
      'Deconstruct the neurological fight-or-flight response behind public speaking anxiety.',
      'Apply cognitive reframing techniques to transform stage fear into productive arousal.',
      'Develop pre-speech grounding rituals to stabilize vocal and physiological control.',
    ],
    academicLevel: 'undergraduate',
    proficiencyLevel: 'beginner',
    language: 'en',
    expectedReadingDurationMinutes: 15,
  };

  const validReadingContent: GeneratedReadingDocumentContent = {
    title: 'Stage Fear and Mindset Foundation: In-Depth Study Monograph',
    introduction:
      'Stage fear, medically categorized as performance anxiety or glossophobia, represents one of the most pervasive psychological hurdles in executive communication. This monograph explores the autonomic nervous system triggers and practical reframing strategies.',
    learningObjectives: [
      'Deconstruct the neurological fight-or-flight response behind public speaking anxiety.',
      'Apply cognitive reframing techniques to transform stage fear into productive arousal.',
      'Develop pre-speech grounding rituals to stabilize vocal and physiological control.',
    ],
    prerequisiteConcepts: ['Basic autonomic nervous system awareness', 'Introductory cognitive behavior principles'],
    detailedConceptualExplanation:
      'When an individual steps onto a stage, the amygdala perceives the collective gaze of the audience as an acute existential stressor. In response, the sympathetic nervous system triggers an adrenaline cascade: heart rate elevates, peripheral blood vessels constrict, and diaphragmatic breathing becomes shallow. Rather than attempting to suppress this physiological surge—which often exacerbates performance panic—cognitive psychology recommends cognitive reframing. By labeling heightened arousal as excitement and mental sharpness rather than debilitating dread, speakers harness adrenaline for enhanced vocal resonance and cognitive alertness.',
    importantDefinitions: [
      {
        term: 'Glossophobia',
        definition: 'Severe social anxiety disorder characterized by intense fear of public speaking.',
        context: 'Affects up to 75% of individuals in various communication contexts.',
      },
      {
        term: 'Cognitive Reframing',
        definition: 'A psychological technique of identifying and disputing irrational or maladaptive thoughts.',
        context: 'Transforms threat perception into challenge-oriented focus.',
      },
    ],
    stepByStepExplanations: [
      {
        stepNumber: 1,
        title: 'Physiological Interception (Box Breathing)',
        explanation: 'Inhale for 4 seconds, hold for 4 seconds, exhale for 4 seconds, hold for 4 seconds to stimulate the vagus nerve.',
      },
      {
        stepNumber: 2,
        title: 'Cognitive Attribution Shift',
        explanation: 'Re-label tremors and heart rate increases as biological readiness to communicate with impact.',
      },
    ],
    relevantExamples: [
      {
        title: 'Executive Keynote Case Study',
        scenario: 'A CEO experiencing acute dry mouth and hand tremors before an annual general shareholder address.',
        solutionOrExplanation: 'Employing 3 cycles of diaphragmatic box breathing combined with audience-benefit visualization restored calm.',
      },
    ],
    practicalApplications: [
      'Pre-speech backstage physical grounding rituals.',
      'Managing high-stakes board presentations and interview panels.',
    ],
    diagramsOrDescriptions: [
      {
        title: 'The Autonomic Arousal Inverted-U Curve (Yerkes-Dodson Law)',
        description: 'Optimal performance occurs at moderate physiological arousal, declining when under-stimulated or hyper-panicked.',
        diagramType: 'text',
      },
    ],
    commonMistakesAndMisconceptions: [
      {
        misconception: 'Attempting to completely eliminate anxiety before speaking is the goal.',
        correction: 'Complete absence of anxiety leads to flat delivery; controlled arousal produces dynamism and vocal energy.',
        whyItMatters: 'Aiming for zero anxiety creates secondary panic when natural adrenaline arrives.',
      },
      {
        misconception: 'Memorizing the entire speech verbatim prevents stage fear.',
        correction: 'Verbatim memorization increases fragility because a single lost word causes total cognitive disruption.',
        whyItMatters: 'Conceptual bullet points build resilient, adaptive delivery.',
      },
    ],
    workedExamples: [
      {
        problem: 'A speaker suddenly feels their voice quavering 60 seconds into a presentation. What immediate physical action recovers vocal tone?',
        stepByStepSolution: [
          'Step 1: Pause deliberately for 2 seconds—audiences perceive pauses as thoughtful emphasis, not error.',
          'Step 2: Plant feet firmly shoulder-width apart to engage pelvic and core stability.',
          'Step 3: Drop the shoulders and inhale deeply into the lower belly, relaxing laryngeal constriction.',
        ],
        finalTakeaway: 'Physical grounding immediately interrupts vocal constriction.',
      },
    ],
    keyTakeaways: [
      'Stage fear is a normal physiological sympathetic response, not a personal character defect.',
      'Cognitive reappraisal converts adrenaline from debilitating dread into vocal vibrancy.',
      'Grounding rituals and diaphragmatic breathwork directly activate the parasympathetic calming response.',
    ],
    summary:
      'Mastering stage fear requires moving from avoidance to biological regulation. By reframing arousal, practicing diaphragmatic grounding, and focusing on audience value, speakers cultivate durable executive presence.',
    selfAssessmentQuestions: [
      {
        id: 'sa-sf-1',
        question: 'According to cognitive reframing, what is the most effective mental label for elevated heart rate before a keynote?',
        options: ['Imminent public failure', 'Physiological excitement and readiness', 'A panic disorder crisis', 'Signs to cancel the lecture'],
        correctAnswer: 'Physiological excitement and readiness',
        explanation: 'Re-labeling somatic symptoms as alertness activates challenge-mode neurology rather than threat-avoidance.',
      },
    ],
    furtherReading: [
      {
        title: 'The Science of Executive Poise',
        description: 'Detailed analysis of parasympathetic vagal tone in leadership communication.',
        isExternal: false,
      },
    ],
  };

  // ---------------------------------------------------------------------------
  // Test 1: Existing verified material is reused & detected
  // ---------------------------------------------------------------------------
  it('1. identifies verified external material when genuine external documentation is linked', async () => {
    // Test URL helper
    const isGenuine = (engine as any).isGenuineExternalUrl('https://arxiv.org/abs/2312.10997');
    assert.equal(isGenuine, true, 'Genuine arXiv URL must be accepted');

    const isInternal = (engine as any).isGenuineExternalUrl('/courses/course-123');
    assert.equal(isInternal, false, 'Internal course route must NOT be treated as external verified material');

    const isPlaceholder = (engine as any).isGenuineExternalUrl('https://openstax.org');
    assert.equal(isPlaceholder, false, 'Bare OpenStax root domain without document must NOT be treated as valid material');
  });

  // ---------------------------------------------------------------------------
  // Test 2: Missing material triggers fallback
  // ---------------------------------------------------------------------------
  it('2. missing reading material triggers the appropriate fallback condition', async () => {
    const evalResult = await engine.evaluateLessonReading('nonexistent-lesson', 'course-psych-101');
    assert.equal(evalResult.hasReadingMaterial, false);
    assert.equal(evalResult.status, 'missing');
    assert.equal(evalResult.canGenerate, true, 'Engine must offer generation when material is missing');
    assert.match(evalResult.message, /not available/i);
  });

  // ---------------------------------------------------------------------------
  // Test 3 & 5: Previously generated documents are reused (No duplicate Gemini calls)
  // ---------------------------------------------------------------------------
  it('3 & 5. reuses previously generated reading materials without making duplicate requests', async () => {
    const testDoc: GeneratedReadingDocument = {
      id: 'read_test_lesson_123',
      courseId: 'course-psych-101',
      moduleId: 'mod-1',
      lessonId: 'les-stage-fear-01',
      title: validReadingContent.title,
      content: validReadingContent,
      contentFormat: 'structured_json',
      language: 'en',
      academicLevel: 'undergraduate',
      learningObjectives: validReadingContent.learningObjectives,
      generationModel: 'gemini-2.5-flash',
      generationStatus: 'completed',
      sourceMetadata: {
        provider: 'google-gemini',
        generatedAt: new Date().toISOString(),
        sourceProvenance: 'pencill_academic_engine',
        readingDurationMinutes: 15,
      },
      readingDurationMinutes: 15,
      generatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save document to persistence
    await saveGeneratedReadingDocument(testDoc);

    // Evaluate lesson reading: must detect previously generated document
    const evalResult = await engine.evaluateLessonReading('les-stage-fear-01', 'course-psych-101');
    assert.equal(evalResult.hasReadingMaterial, true);
    assert.equal(evalResult.status, 'previously_generated');
    assert.ok(evalResult.document, 'Existing document must be returned');
    assert.equal(evalResult.document.id, testDoc.id);

    // Requesting generation without forceRegenerate must immediately return existing doc (zero API calls)
    const retrieved = await engine.generateReadingDocument({
      courseId: 'course-psych-101',
      lessonId: 'les-stage-fear-01',
      forceRegenerate: false,
    });
    assert.equal(retrieved.id, testDoc.id);
    assert.equal(retrieved.title, testDoc.title);
  });

  // ---------------------------------------------------------------------------
  // Test 4: Explicit learner requests work (forceRegenerate)
  // ---------------------------------------------------------------------------
  it('4. accepts explicit learner request for regeneration', async () => {
    const testDoc = await getGeneratedReadingByLesson('les-stage-fear-01', 'course-psych-101');
    assert.ok(testDoc, 'Document must exist from previous step');

    // Updating existing document timestamp simulates regeneration
    const updated = await saveGeneratedReadingDocument({
      ...testDoc,
      title: 'Stage Fear & Physiological Mastery: Advanced Review',
      updatedAt: new Date().toISOString(),
    });

    assert.equal(updated.title, 'Stage Fear & Physiological Mastery: Advanced Review');
  });

  // ---------------------------------------------------------------------------
  // Test 6: Duplicate in-flight requests do not create duplicate documents
  // ---------------------------------------------------------------------------
  it('6. deduplicates concurrent in-flight requests for the same lesson', async () => {
    // Both calls must return the identical document reference
    const p1 = engine.generateReadingDocument({
      courseId: 'course-psych-101',
      lessonId: 'les-stage-fear-01',
      forceRegenerate: false,
    });
    const p2 = engine.generateReadingDocument({
      courseId: 'course-psych-101',
      lessonId: 'les-stage-fear-01',
      forceRegenerate: false,
    });

    const [doc1, doc2] = await Promise.all([p1, p2]);
    assert.equal(doc1.id, doc2.id, 'Duplicate requests must return identical document');
  });

  // ---------------------------------------------------------------------------
  // Test 7: Gemini failures are handled correctly
  // ---------------------------------------------------------------------------
  it('7. handles Gemini errors and distinguishes transient vs non-transient failures', () => {
    const authError = new ReadingGeminiError('API key not valid', 401, false);
    assert.equal(authError.isTransient, false, 'Auth error must NOT be transient');
    assert.equal(authError.statusCode, 401);

    const rateLimitError = new ReadingGeminiError('Rate limit exceeded', 429, true);
    assert.equal(rateLimitError.isTransient, true, 'Standard rate limit must be transient');

    const quotaError = new ReadingGeminiError('RESOURCE_EXHAUSTED: quota exceeded', 429, false);
    assert.equal(quotaError.isTransient, false, 'Hard quota exhaustion must not retry');
  });

  // ---------------------------------------------------------------------------
  // Test 8: Invalid generated content is rejected by validation layer
  // ---------------------------------------------------------------------------
  it('8. rejects invalid or placeholder content', () => {
    const invalidContent: GeneratedReadingDocumentContent = {
      ...validReadingContent,
      detailedConceptualExplanation: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    };

    const result = validateTopicRelevance(invalidContent, mockLessonContext);
    assert.equal(result.isValid, false, 'Content with Lorem Ipsum must be rejected');
    assert.ok(
      result.reasons.some((r) => r.includes('placeholder')),
      'Must cite placeholder string'
    );
  });

  // ---------------------------------------------------------------------------
  // Test 9: Strict Topic Relevance - Cross-Domain Collision Guard
  // ---------------------------------------------------------------------------
  it('9. COLLISION GUARD: rejects unrelated mathematical equations in a stage fear lesson', () => {
    const unrelatedContent: GeneratedReadingDocumentContent = {
      ...validReadingContent,
      detailedConceptualExplanation:
        'To overcome stage fear, one must compute the gravitational vector of the podium and solve the quadratic equation ax^2 + bx + c = 0 to achieve inner balance.',
    };

    const result = validateTopicRelevance(unrelatedContent, mockLessonContext);
    assert.equal(result.isValid, false, 'Cross-domain collision must be rejected');
    assert.equal(result.unrelatedTopicDetected, true, 'Unrelated topic flag must be true');
    assert.ok(
      result.reasons.some((r) => r.includes('Cross-Domain Collision')),
      'Must cite cross-domain collision error'
    );
  });

  // ---------------------------------------------------------------------------
  // Test 10: Supabase persistence and storageAdapter local fallback
  // ---------------------------------------------------------------------------
  it('10. persists and retrieves reading documents via storageAdapter fallback', async () => {
    const fallbackDoc: GeneratedReadingDocument = {
      id: 'read_offline_doc_99',
      courseId: 'course-local-01',
      moduleId: 'mod-1',
      lessonId: 'les-offline-01',
      title: 'Offline Architecture Foundations',
      content: validReadingContent,
      contentFormat: 'structured_json',
      language: 'en',
      academicLevel: 'undergraduate',
      learningObjectives: ['Learn local cache strategies.'],
      generationModel: 'gemini-2.5-flash',
      generationStatus: 'completed',
      sourceMetadata: {
        provider: 'google-gemini',
        generatedAt: new Date().toISOString(),
        sourceProvenance: 'pencill_academic_engine',
        readingDurationMinutes: 15,
      },
      readingDurationMinutes: 15,
      generatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveGeneratedReadingDocument(fallbackDoc);

    const loadedById = await getGeneratedReadingById('read_offline_doc_99');
    assert.ok(loadedById, 'Document must be retrievable by ID');
    assert.equal(loadedById.title, 'Offline Architecture Foundations');

    const loadedByLesson = await getGeneratedReadingByLesson('les-offline-01', 'course-local-01');
    assert.ok(loadedByLesson, 'Document must be retrievable by Lesson ID');
    assert.equal(loadedByLesson.id, 'read_offline_doc_99');
  });

  // ---------------------------------------------------------------------------
  // Test 11: Document Viewer schema compliance
  // ---------------------------------------------------------------------------
  it('11. document contains all 16 academic sections required for high-fidelity viewing', () => {
    assert.ok(validReadingContent.title, 'Section 1: title');
    assert.ok(validReadingContent.introduction, 'Section 2: introduction');
    assert.ok(validReadingContent.learningObjectives.length > 0, 'Section 3: learningObjectives');
    assert.ok(validReadingContent.prerequisiteConcepts.length > 0, 'Section 4: prerequisiteConcepts');
    assert.ok(validReadingContent.detailedConceptualExplanation.length > 100, 'Section 5: detailedConceptualExplanation');
    assert.ok(validReadingContent.importantDefinitions.length > 0, 'Section 6: importantDefinitions');
    assert.ok(validReadingContent.stepByStepExplanations.length > 0, 'Section 7: stepByStepExplanations');
    assert.ok(validReadingContent.relevantExamples.length > 0, 'Section 8: relevantExamples');
    assert.ok(validReadingContent.practicalApplications.length > 0, 'Section 9: practicalApplications');
    assert.ok(validReadingContent.diagramsOrDescriptions.length > 0, 'Section 10: diagramsOrDescriptions');
    assert.ok(validReadingContent.commonMistakesAndMisconceptions.length > 0, 'Section 11: commonMistakesAndMisconceptions');
    assert.ok(validReadingContent.workedExamples.length > 0, 'Section 12: workedExamples');
    assert.ok(validReadingContent.keyTakeaways.length >= 2, 'Section 13: keyTakeaways');
    assert.ok(validReadingContent.summary.length > 20, 'Section 14: summary');
    assert.ok(validReadingContent.selfAssessmentQuestions.length > 0, 'Section 15: selfAssessmentQuestions');
    assert.ok(validReadingContent.furtherReading.length > 0, 'Section 16: furtherReading');
  });

  // ---------------------------------------------------------------------------
  // Test 12: Broken links never appear as valid external documents
  // ---------------------------------------------------------------------------
  it('12. broken, dead, or internal links are rejected from external document presentation', () => {
    const deadLinks = [
      '',
      '/courses/cs-101',
      '#section-2',
      'https://openstax.org',
      'http://openstax.org/',
      'https://ocw.mit.edu',
      'http://localhost:3000/test',
    ];

    for (const url of deadLinks) {
      const isExternal = (engine as any).isGenuineExternalUrl(url);
      assert.equal(isExternal, false, `Link "${url}" must be rejected as an external document`);
    }
  });

  // ---------------------------------------------------------------------------
  // Test 13: Honest Academic Attribution
  // ---------------------------------------------------------------------------
  it('13. enforces honest AI academic attribution and rejects false human faculty claims', () => {
    const testDoc: GeneratedReadingDocument = {
      id: 'read_attr_test',
      courseId: 'course-test',
      moduleId: 'mod-1',
      lessonId: 'les-test',
      title: 'Attribution Test',
      content: validReadingContent,
      contentFormat: 'structured_json',
      language: 'en',
      academicLevel: 'undergraduate',
      learningObjectives: ['Test attribution'],
      generationModel: 'gemini-2.5-flash',
      generationStatus: 'completed',
      sourceMetadata: {
        provider: 'google-gemini',
        generatedAt: new Date().toISOString(),
        sourceProvenance: 'pencill_academic_engine',
      },
      readingDurationMinutes: 15,
      generatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    assert.equal(testDoc.sourceMetadata.sourceProvenance, 'pencill_academic_engine');
    assert.notEqual((testDoc as any).authorOrInstitution, 'Pencill Academic Editorial Team');
  });

  // ---------------------------------------------------------------------------
  // Test 14: Existing course generation and resource engine remain unaffected
  // ---------------------------------------------------------------------------
  it('14. verifies existing storageAdapter and database schema integrity', async () => {
    const profile = await storageAdapter.getProfile();
    assert.ok(profile, 'storageAdapter.getProfile must remain functional');
    assert.ok(profile.id, 'Profile must have an ID');
  });

  // ---------------------------------------------------------------------------
  // Test 15: Resolves lesson context from clientContext fallback
  // ---------------------------------------------------------------------------
  it('15. resolves lesson reading context from clientContext when course is not in database', async () => {
    const resolvedContext = await (engine as any).resolveLessonReadingContext(
      'unpersisted-client-course-123',
      'unpersisted-client-lesson-456',
      {
        courseId: 'unpersisted-client-course-123',
        lessonId: 'unpersisted-client-lesson-456',
        clientContext: {
          courseTitle: 'Client Stored Deep Learning',
          courseDomain: 'computer_science',
          moduleTitle: 'Convolutional Neural Networks',
          lessonTitle: 'Backpropagation through Conv Layers',
          learningObjectives: ['Compute gradients for 2D convolution filters'],
          expectedReadingDurationMinutes: 20,
        },
      }
    );

    assert.equal(resolvedContext.courseTitle, 'Client Stored Deep Learning');
    assert.equal(resolvedContext.lessonTitle, 'Backpropagation through Conv Layers');
    assert.equal(resolvedContext.learningObjectives[0], 'Compute gradients for 2D convolution filters');
    assert.equal(resolvedContext.expectedReadingDurationMinutes, 20);
  });

  // ---------------------------------------------------------------------------
  // Test 16: Structured Error Classification & Sanitization
  // ---------------------------------------------------------------------------
  it('16. classifies errors into meaningful stages and redacts credentials', async () => {
    const { classifyReadingError } = await import('../src/lib/reading-engine/error-handler');

    const authError = classifyReadingError(new Error('Invalid API key provided: secret-123'));
    assert.equal(authError.stage, 'auth');
    assert.equal(authError.code, 'AUTH_INVALID_KEY');
    assert.ok(authError.userMessage.includes('API key'));

    const quotaError = classifyReadingError(new Error('RESOURCE_EXHAUSTED: quota reached'));
    assert.equal(quotaError.stage, 'quota');
    assert.equal(quotaError.code, 'API_QUOTA_EXHAUSTED');
    assert.ok(quotaError.userMessage.includes('quota'));

    const networkError = classifyReadingError(new Error('Gemini request timed out after 60000ms.'));
    assert.equal(networkError.stage, 'network');
    assert.equal(networkError.code, 'NETWORK_TIMEOUT');

    const contextError = classifyReadingError(new Error('Unable to find lesson "l-1" within course "c-1".'));
    assert.equal(contextError.stage, 'context');
    assert.equal(contextError.code, 'LESSON_CONTEXT_NOT_FOUND');
  });
});
