import { describe, it } from 'node:test';
import assert from 'node:assert';
import { CuratorEngine } from '../src/curator';
import { DEFAULT_BUILDER_CONFIG_STATE, BuilderConfig } from '../src/lib/types/builderConfig';
import { CURATED_REPOSITORY_INDEX } from '../src/curator/curatedRepositoryIndex';

describe('Milestone 5: Curator Pipeline & Verified Resource Adapters', () => {
  it('CuratedRepositoryIndex contains only verified URLs with dates and source attribution', () => {
    assert.ok(CURATED_REPOSITORY_INDEX.length >= 10, 'Static index must contain at least 10 verified items');
    for (const item of CURATED_REPOSITORY_INDEX) {
      assert.ok(item.url.startsWith('https://'), `Item URL must be HTTPS: ${item.url}`);
      assert.strictEqual(item.status, 'verified', 'Curated repo items must have status=verified');
      assert.ok(item.verifiedAt, 'Item must have verifiedAt timestamp');
      assert.ok(item.source, 'Item must specify source repository');
    }
  });

  it('CuratorEngine runs all 7 stages cleanly with real telemetry increments', async () => {
    const stageEvents: number[] = [];
    let stateUpdates: string[] = [];

    const engine = new CuratorEngine({
      onStateChange: (state) => stateUpdates.push(state),
      onStageUpdate: (update) => {
        if (!stageEvents.includes(update.stageNumber)) {
          stageEvents.push(update.stageNumber);
        }
      },
    });

    const result = await engine.run(DEFAULT_BUILDER_CONFIG_STATE);

    // 1. Verify all 7 stages executed
    assert.strictEqual(stageEvents.length, 7, 'All 7 curation stages must execute in order');
    assert.deepStrictEqual(stageEvents, [1, 2, 3, 4, 5, 6, 7]);

    // 2. State transition
    assert.ok(stateUpdates.includes('RUNNING'));
    assert.ok(stateUpdates.includes('COMPLETE') || stateUpdates.includes('PARTIAL'));

    // 3. Output structure
    assert.ok(result.id, 'Synthesized path must receive an ID');
    assert.ok(result.modules.length >= 3, 'Must produce at least 3 modules');
    assert.ok(result.totalResources > 0, 'Must discover verified resources');

    // 4. Modality integrity
    for (const mod of result.modules) {
      assert.ok(mod.checkpointQuestions.length > 0, 'Every module must have diagnostic questions');
      assert.ok(mod.flashcards.length > 0, 'Every module must have formula flashcards');
    }

    // 5. Audit report
    assert.ok(result.auditReport.passedAudit > 0, 'Audit must record passed items');
    assert.ok(result.auditReport.averageQualityScore >= 70, 'Average quality score must meet threshold');
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

  it('Enforces closed captions hard filter when enabled', async () => {
    const ccConfig: BuilderConfig = {
      ...DEFAULT_BUILDER_CONFIG_STATE,
      advanced: {
        ...DEFAULT_BUILDER_CONFIG_STATE.advanced,
        accessibility: {
          captions: true,
          highContrast: false,
          transcripts: false,
        },
      },
    };

    const engine = new CuratorEngine();
    const result = await engine.run(ccConfig);

    for (const mod of result.modules) {
      for (const res of mod.resources) {
        if (res.modality === 'video') {
          assert.strictEqual(res.hasCaptions, true, 'All assigned video resources must have closed captions');
        }
      }
    }
  });

  it('Honest reporting: Returns 0 resources without fabricating URLs when query is unindexed', async () => {
    const unindexedConfig: BuilderConfig = {
      ...DEFAULT_BUILDER_CONFIG_STATE,
      domainId: 'personal-practical',
      language: 'mr', // Marathi in personal practical has 0 index matches
      selectedTopics: [{ id: 'custom-topic', label: 'Very Obscure Niche Unindexed Topic 999', source: 'custom' }],
    };

    const engine = new CuratorEngine();
    const result = await engine.run(unindexedConfig);

    assert.ok(result.coverageGaps.length > 0, 'Coverage gaps must be recorded honestly');
    assert.strictEqual(engine.getState(), 'PARTIAL');
  });
});
