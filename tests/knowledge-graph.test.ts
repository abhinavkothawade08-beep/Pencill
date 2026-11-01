import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CANONICAL_KNOWLEDGE_NODES,
  identifyPrerequisiteGaps,
  buildKnowledgeGraphFromCourses,
} from '../src/lib/knowledge-graph/graph';

test('Knowledge Graph & Prerequisite Gap Detector Suite', async (t) => {
  await t.test('CANONICAL_KNOWLEDGE_NODES integrity: every prerequisite references a valid node in DAG', () => {
    const nodeIds = new Set(CANONICAL_KNOWLEDGE_NODES.map((n) => n.id));

    for (const node of CANONICAL_KNOWLEDGE_NODES) {
      assert.ok(node.id, 'Node must have an ID');
      assert.ok(node.label, 'Node must have a label');
      assert.ok(node.domain, 'Node must have a domain');
      assert.ok(node.tier, 'Node must have a tier');

      for (const prereqId of node.prerequisites) {
        assert.ok(
          nodeIds.has(prereqId),
          `Prerequisite "${prereqId}" of node "${node.id}" must exist in the knowledge graph`
        );
        assert.notEqual(
          prereqId,
          node.id,
          `Self-loop detected: node "${node.id}" cannot depend on itself`
        );
      }
    }
  });

  await t.test('identifyPrerequisiteGaps: identifies missing prerequisite gaps with low mastery score', () => {
    // ai-rag depends on ai-embeddings and ai-hnsw
    // ai-hnsw has masteryScore: 20 (< 70) and status 'gap'
    const gapAnalysis = identifyPrerequisiteGaps('ai-rag');

    assert.ok(gapAnalysis.targetNode, 'Target node must be found');
    assert.equal(gapAnalysis.targetNode?.id, 'ai-rag');

    const gapIds = gapAnalysis.missingPrerequisites.map((m) => m.id);
    assert.ok(
      gapIds.includes('ai-hnsw'),
      'ai-hnsw should be identified as a missing prerequisite gap for ai-rag'
    );
  });

  await t.test('identifyPrerequisiteGaps: returns empty array for nonexistent concept ID', () => {
    const gapAnalysis = identifyPrerequisiteGaps('non-existent-concept-xyz');
    assert.equal(gapAnalysis.targetNode, undefined);
    assert.equal(gapAnalysis.missingPrerequisites.length, 0);
    assert.equal(gapAnalysis.remediationRoadmap.length, 0);
  });

  await t.test('buildKnowledgeGraphFromCourses: returns empty array when given empty course list', () => {
    const nodes = buildKnowledgeGraphFromCourses([], []);
    assert.equal(nodes.length, 0);
  });

  await t.test('buildKnowledgeGraphFromCourses: correctly synthesizes DAG nodes from modules and lessons', () => {
    const mockCourses = [
      {
        id: 'course-calc-101',
        title: 'Single Variable Calculus',
        domain: 'Mathematics',
        modules: [
          {
            id: 'mod-1',
            title: 'Limits & Continuity',
            lessons: [
              { id: 'les-1', title: 'Epsilon-Delta Definition' },
              { id: 'les-2', title: 'Squeeze Theorem' },
            ],
          },
          {
            id: 'mod-2',
            title: 'Derivatives',
            lessons: [
              { id: 'les-3', title: 'Chain Rule' },
            ],
          },
        ],
      },
    ];

    // Case: First lesson completed
    const nodes = buildKnowledgeGraphFromCourses(mockCourses as any, ['les-1']);
    assert.equal(nodes.length, 2, 'Should generate 2 concept nodes (1 per module)');

    const node0 = nodes[0];
    const node1 = nodes[1];

    assert.equal(node0.id, 'course-calc-101-mod-0');
    assert.equal(node0.label, 'Limits & Continuity');
    assert.equal(node0.lessonCount, 2);
    assert.equal(node0.completedLessonCount, 1);
    assert.equal(node0.masteryScore, 50);
    assert.equal(node0.status, 'learning');
    assert.equal(node0.lessonId, 'les-2'); // Next up to study

    assert.equal(node1.id, 'course-calc-101-mod-1');
    assert.equal(node1.label, 'Derivatives');
    assert.deepEqual(node1.prerequisites, ['course-calc-101-mod-0']);
    assert.equal(node1.status, 'gap'); // Previous module not yet mastered
  });
});
