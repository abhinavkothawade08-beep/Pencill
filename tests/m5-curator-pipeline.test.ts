import { describe, it } from 'node:test';
import assert from 'node:assert';
import { CuratorEngine } from '../src/curator';
import { DEFAULT_BUILDER_CONFIG_STATE, BuilderConfig } from '../src/lib/types/builderConfig';

describe('Milestone 5: Curator Pipeline & Curriculum Synthesis', () => {
  it('CuratorEngine runs all 5 stages cleanly with real telemetry increments', async () => {
    const stageEvents: number[] = [];
    const stateUpdates: string[] = [];

    const engine = new CuratorEngine({
      onStateChange: (state) => stateUpdates.push(state),
      onStageUpdate: (update) => {
        if (!stageEvents.includes(update.stageNumber)) {
          stageEvents.push(update.stageNumber);
        }
      },
    });

    const result = await engine.run(DEFAULT_BUILDER_CONFIG_STATE);

    // 1. Verify all 5 stages executed in order
    assert.strictEqual(stageEvents.length, 5, 'All 5 curation stages must execute in order');
    assert.deepStrictEqual(stageEvents, [1, 2, 3, 4, 5]);

    // 2. State transition
    assert.ok(stateUpdates.includes('RUNNING'));
    assert.ok(stateUpdates.includes('COMPLETE') || stateUpdates.includes('PARTIAL'));

    // 3. Output structure
    assert.ok(result.id, 'Synthesized path must receive an ID');
    assert.ok(result.modules.length >= 3, 'Must produce at least 3 modules');

    // 4. Pedagogical checkpoint and flashcard integrity
    for (const mod of result.modules) {
      assert.ok(mod.checkpointQuestions.length > 0, 'Every module must have diagnostic questions');
      assert.ok(mod.flashcards.length > 0, 'Every module must have formula flashcards');
    }
  });

  it('Supports cancellation gracefully while running', async () => {
    const engine = new CuratorEngine();
    const runPromise = engine.run(DEFAULT_BUILDER_CONFIG_STATE);
    engine.cancel();

    try {
      await runPromise;
      assert.fail('Expected run to throw cancellation error');
    } catch (err: any) {
      assert.ok(err.message.includes('cancelled'), 'Error message should indicate cancellation');
      assert.strictEqual(engine.getState(), 'STANDBY');
    }
  });

  it('Honest reporting: Records coverage gaps honestly when query has gaps', async () => {
    const unindexedConfig: BuilderConfig = {
      ...DEFAULT_BUILDER_CONFIG_STATE,
      domainId: 'personal-practical',
      language: 'mr',
      selectedTopics: [{ id: 'custom-topic', label: 'Very Obscure Niche Topic 999', source: 'custom' }],
    };

    const engine = new CuratorEngine();
    const result = await engine.run(unindexedConfig);

    assert.ok(result.coverageGaps.length > 0, 'Coverage gaps must be recorded honestly');
    assert.strictEqual(engine.getState(), 'PARTIAL');
  });
});
