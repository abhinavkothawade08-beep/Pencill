import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CuratorEngine } from '../src/curator';
import { DEFAULT_BUILDER_CONFIG_STATE, BuilderConfig } from '../src/lib/types/builderConfig';

describe('RAG Course Generation Diagnostic Test', () => {
  it('Generates a course on Retrieval-Augmented Generation (RAG)', async () => {
    const config: BuilderConfig = {
      ...DEFAULT_BUILDER_CONFIG_STATE,
      domainId: 'data-ai',
      subjectId: 'artificial-intelligence',
      depthLevelId: 'undergraduate',
      selectedTopics: [{ id: 'rag-topic', label: 'Retrieval-Augmented Generation (RAG)', source: 'custom' }],
    };

    const engine = new CuratorEngine();
    const result = await engine.run(config);

    console.log('Result Title:', result.title);
    console.log('Total Modules:', result.modules.length);
    for (const m of result.modules) {
      console.log(`Module ${m.moduleIndex}: "${m.title}"`);
      console.log(`  Objectives:`, m.objectives);
      console.log(`  Resources (${m.resources.length}):`, m.resources.map(r => ({ title: r.title, modality: r.modality, url: r.url })));
      console.log(`  Quizzes (${m.checkpointQuestions.length}):`, m.checkpointQuestions.map(q => q.prompt));
    }

    assert.ok(result.title.includes('Retrieval-Augmented Generation') || result.title.includes('RAG'));
  });
});
