import { describe, it } from 'node:test';
import assert from 'node:assert';
import { storageAdapter } from '../src/lib/storage/storageAdapter';
import taxonomyData from '../src/data/taxonomy.json';
import { LEVEL_LADDER_12, getLevelsForDomain } from '../src/lib/catalogs/levelCatalog';
import { DEFAULT_BUILDER_CONFIG_STATE, toLegacyLearningPathConfig } from '../src/lib/types/builderConfig';

describe('Milestone 1: Store, StorageAdapter & Data Layer Contracts', () => {
  it('StorageAdapter saves and retrieves drafts in memory/IndexedDB cleanly', async () => {
    const testDraft = {
      ...DEFAULT_BUILDER_CONFIG_STATE,
      domainId: 'engineering-technology',
      subjectId: 'computer-science',
    };

    await storageAdapter.saveDraft('test_draft_key', testDraft);
    const retrieved = await storageAdapter.getDraft<typeof testDraft>('test_draft_key');
    assert.ok(retrieved, 'Draft should be retrieved successfully');
    assert.strictEqual(retrieved.domainId, 'engineering-technology');
    assert.strictEqual(retrieved.subjectId, 'computer-science');

    await storageAdapter.clearDraft('test_draft_key');
    const cleared = await storageAdapter.getDraft('test_draft_key');
    assert.strictEqual(cleared, null, 'Draft should be cleared');
  });

  it('StorageAdapter handles notifications, recents, bookmarks, and progress', async () => {
    // 1. Notifications
    const notif = await storageAdapter.addNotification({
      type: 'draft_saved',
      title: 'Unit Test Draft Saved',
      message: 'Draft persisted successfully in unit test harness.',
      read: false,
    });
    assert.ok(notif.id, 'Notification should receive an ID');
    const allNotifs = await storageAdapter.getNotifications();
    assert.ok(allNotifs.some(n => n.id === notif.id), 'Notification should exist in collection');

    // 2. Recents
    await storageAdapter.addRecent({
      type: 'topic',
      label: 'Class 11 Rotational Dynamics',
      domainId: 'school-education',
    });
    const recents = await storageAdapter.getRecents();
    assert.ok(recents.some(r => r.label === 'Class 11 Rotational Dynamics'), 'Recent topic should be recorded');

    // 3. Bookmarks
    const bmark = await storageAdapter.addBookmark({
      type: 'resource',
      title: 'Walter Lewin Lecture 1',
      pathId: 'path-test-123',
    });
    assert.ok(bmark.id, 'Bookmark should be created');
    const isBookmarked = await storageAdapter.isBookmarked('path-test-123');
    assert.strictEqual(isBookmarked, true, 'isBookmarked should return true');

    // 4. Progress
    const progress = await storageAdapter.updateProgress('path-test-123', {
      completedLessonIds: ['lesson-1', 'lesson-2'],
      hoursLogged: 4.5,
    });
    assert.strictEqual(progress.completedLessonIds.length, 2);
    assert.strictEqual(progress.hoursLogged, 4.5);
  });

  it('Taxonomy JSON accurately covers all 12 domains with hierarchical subjects and topics', () => {
    assert.strictEqual(taxonomyData.domains.length, 12, 'Taxonomy must cover exactly 12 domains');

    const expectedDomains = [
      'school-education',
      'engineering-technology',
      'medical-health',
      'business-management',
      'science-mathematics',
      'arts-humanities',
      'law-government',
      'finance-qualifications',
      'vocational-professional',
      'languages-communication',
      'research-academic',
      'personal-practical',
    ];

    for (const expectedId of expectedDomains) {
      const match = taxonomyData.domains.find(d => d.id === expectedId);
      assert.ok(match, `Domain ${expectedId} must be present in taxonomy.json`);
      assert.ok(match.categories.length > 0, `Domain ${expectedId} must contain categories`);
    }

    // Inspect topics
    let totalTopics = 0;
    for (const domain of taxonomyData.domains) {
      for (const cat of domain.categories) {
        for (const sub of cat.subjects) {
          for (const topic of sub.topics) {
            totalTopics++;
            assert.ok(topic.id, 'Topic must have id');
            assert.ok(topic.label, 'Topic must have label');
            assert.ok(Array.isArray(topic.synonyms), 'Topic must have synonyms array');
            assert.ok(topic.complexity >= 1 && topic.complexity <= 5, 'Topic complexity must be 1-5');
            assert.ok(Array.isArray(topic.prereqs), 'Topic must have prereqs array');
            assert.strictEqual(typeof topic.popular, 'boolean', 'Topic must have boolean popular flag');
          }
        }
      }
    }
    assert.ok(totalTopics >= 150, `Taxonomy must contain comprehensive topic coverage, found ${totalTopics}`);
  });

  it('Level Ladder covers all 12 levels with domain-aware filtering', () => {
    assert.strictEqual(LEVEL_LADDER_12.length, 12, 'Level ladder must have 12 tiers');

    const schoolLevels = getLevelsForDomain('school-education');
    assert.ok(schoolLevels.some(l => l.id === 'class-11'), 'School education must include Class 11');
    assert.ok(schoolLevels.some(l => l.id === 'class-12'), 'School education must include Class 12');

    const engLevels = getLevelsForDomain('engineering-technology');
    assert.ok(engLevels.some(l => l.id === 'undergraduate-intro'), 'Engineering must include Undergraduate Intro');
  });

  it('DEFAULT_BUILDER_CONFIG_STATE accurately reflects screenshot values and converts to legacy format', () => {
    const def = DEFAULT_BUILDER_CONFIG_STATE;
    assert.strictEqual(def.domainId, 'school-education');
    assert.strictEqual(def.subjectId, 'school-physics');
    assert.strictEqual(def.selectedTopics[0].label, 'Class 11 Mechanics & Rotational Dynamics');
    assert.strictEqual(def.depthLevelId, 'class-11');
    assert.strictEqual(def.difficulty, 'intermediate');
    assert.strictEqual(def.language, 'en');
    assert.strictEqual(def.weeklyHours, 6);
    assert.strictEqual(def.modalities.video, true);
    assert.strictEqual(def.modalities.reading, true);
    assert.strictEqual(def.modalities.coding, false);

    const legacy = toLegacyLearningPathConfig(def, 'School Education', 'Physics');
    assert.strictEqual(legacy.domainName, 'School Education');
    assert.strictEqual(legacy.subject, 'Physics');
    assert.strictEqual(legacy.topics[0], 'Class 11 Mechanics & Rotational Dynamics');
    assert.strictEqual(legacy.modalities.videos, true);
    assert.strictEqual(legacy.modalities.codingExercises, false);
  });
});
