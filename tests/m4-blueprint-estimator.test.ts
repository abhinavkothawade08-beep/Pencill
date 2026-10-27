import { describe, it } from 'node:test';
import assert from 'node:assert';
import { estimateBlueprint } from '../src/lib/curriculum/blueprintEstimator';
import { DEFAULT_BUILDER_CONFIG_STATE, BuilderConfig } from '../src/lib/types/builderConfig';

describe('Milestone 4: Curriculum Blueprint Estimator Calibration', () => {
  it('Default configuration accurately reproduces exact specification blueprint values', () => {
    const estimate = estimateBlueprint(DEFAULT_BUILDER_CONFIG_STATE);

    // 1. Module scope
    assert.deepStrictEqual(estimate.moduleRange, [3, 5], 'Module range should be 3-5 modules');

    // 2. Duration
    assert.strictEqual(estimate.estimatedTotalHours, 23, 'Estimated total hours should be ~23h');

    // 3. Cadence weeks
    assert.strictEqual(estimate.estimatedWeeks, 4, 'Estimated cadence should be 4 weeks at 6h/week');

    // 4. Modality counts
    const videoCount = estimate.modalityCounts.find(m => m.name.includes('Video'));
    assert.ok(videoCount, 'Video modality should be present');
    assert.strictEqual(videoCount.countEstimate, '4–8 verified lectures');

    const readingCount = estimate.modalityCounts.find(m => m.name.includes('Reading'));
    assert.ok(readingCount, 'Reading modality should be present');
    assert.strictEqual(readingCount.countEstimate, '8 reading extracts');

    const practiceCount = estimate.modalityCounts.find(m => m.name.includes('Practice'));
    assert.ok(practiceCount, 'Practice modality should be present');
    assert.strictEqual(practiceCount.countEstimate, '24 questions');

    const quizCount = estimate.modalityCounts.find(m => m.name.includes('Diagnostic'));
    assert.ok(quizCount, 'Diagnostic checkpoint modality should be present');
    assert.strictEqual(quizCount.countEstimate, '4 checkpoints');

    const flashcardCount = estimate.modalityCounts.find(m => m.name.includes('Flashcards'));
    assert.ok(flashcardCount, 'Flashcard modality should be present');
    assert.strictEqual(flashcardCount.countEstimate, '16 flashcards');

    // 5. Unchecked modalities are hidden
    const codingCount = estimate.modalityCounts.find(m => m.name.includes('Coding'));
    assert.strictEqual(codingCount, undefined, 'Disabled coding modality should be hidden');

    const projectsCount = estimate.modalityCounts.find(m => m.name.includes('Projects'));
    assert.strictEqual(projectsCount, undefined, 'Disabled projects modality should be hidden');
  });

  it('Recomputes dynamically when weekly hours, difficulty or topics change', () => {
    const modified: BuilderConfig = {
      ...DEFAULT_BUILDER_CONFIG_STATE,
      weeklyHours: 12,
      difficulty: 'advanced',
    };

    const estimate = estimateBlueprint(modified);
    assert.ok(estimate.estimatedTotalHours > 23, 'Advanced difficulty should increase estimated hours');
    assert.ok(estimate.estimatedWeeks <= 3, '12 hours/week should compress weeks to 2-3');
    assert.ok(estimate.cadenceLabel.includes('12h / week'));
  });

  it('Prunes prerequisite chips when learner has Intermediate or Advanced knowledge', () => {
    const intermediateConfig: BuilderConfig = {
      ...DEFAULT_BUILDER_CONFIG_STATE,
      advanced: {
        ...DEFAULT_BUILDER_CONFIG_STATE.advanced,
        currentLevel: 'intermediate',
      },
    };

    const estimate = estimateBlueprint(intermediateConfig);
    assert.ok(estimate.prerequisiteChips.length <= 1, 'Prerequisites should be pruned for intermediate learner');
  });

  it('Detects impossible and tight deadlines accurately', () => {
    // Past deadline
    const pastConfig: BuilderConfig = {
      ...DEFAULT_BUILDER_CONFIG_STATE,
      deadline: '2020-01-01',
    };
    const pastEstimate = estimateBlueprint(pastConfig);
    assert.strictEqual(pastEstimate.feasibilityState.status, 'impossible');
    assert.strictEqual(pastEstimate.feasibilityState.isFeasible, false);

    // Tight deadline (due in 5 days for 23h total = requires 33h/wk -> impossible)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 5);
    const tightConfig: BuilderConfig = {
      ...DEFAULT_BUILDER_CONFIG_STATE,
      deadline: nextWeek.toISOString().split('T')[0],
      weeklyHours: 6,
    };
    const tightEstimate = estimateBlueprint(tightConfig);
    assert.strictEqual(tightEstimate.feasibilityState.isFeasible, false);
  });
});
