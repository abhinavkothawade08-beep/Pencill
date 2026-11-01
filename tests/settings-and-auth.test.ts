import test from 'node:test';
import assert from 'node:assert/strict';
import { storageAdapter } from '../src/lib/storage/storageAdapter';

test('Scholar Settings, Preferences & Customization Suite', async (t) => {
  await t.test('storageAdapter: saves and retrieves scholar profile without data loss', async () => {
    const testProfile = {
      id: 'scholar-audit-01',
      name: 'Dr. Vikram Sarabhai',
      email: 'vikram@isro.org',
      grade: 'Graduate · Advanced Research & Master\'s',
      tier: 'Pro Path',
      avatarUrl: '/avatars/default-avatar.svg',
    };

    await storageAdapter.saveProfile(testProfile);
    const retrieved = await storageAdapter.getProfile();

    assert.equal(retrieved.name, testProfile.name);
    assert.equal(retrieved.grade, testProfile.grade);
    assert.equal(retrieved.email, testProfile.email);
  });

  await t.test('storageAdapter: persists and retrieves learning preferences draft', async () => {
    const prefs = {
      learningStyle: 'theory_focused',
      weeklyHours: 15,
      updatedAt: new Date().toISOString(),
    };

    await storageAdapter.saveDraft('learning_preferences', prefs);
    const retrieved = await storageAdapter.getDraft<typeof prefs>('learning_preferences');

    assert.ok(retrieved);
    assert.equal(retrieved?.learningStyle, 'theory_focused');
    assert.equal(retrieved?.weeklyHours, 15);
  });

  await t.test('storageAdapter: adds and deletes custom course modules dynamically', async () => {
    const mockCourse = {
      id: 'course-test-custom-topics',
      title: 'Advanced Machine Learning & Vector Search',
      domain: 'Computer Science',
      modules: [
        {
          id: 'mod-1',
          moduleNumber: 1,
          title: 'Foundations of Embeddings',
          description: 'Vector spaces and cosine distances',
          lessons: [],
        },
      ],
    };

    await storageAdapter.savePath(mockCourse as any);

    // Append custom topic module
    const customMod = {
      id: 'mod-custom-attention',
      moduleNumber: 2,
      title: 'Self-Attention Mechanisms & Transformers',
      description: 'Scaled dot-product and multi-head attention formulation',
      lessons: [
        { id: 'les-custom-1', title: 'Attention Is All You Need', type: 'reading', durationMinutes: 20 },
      ],
    };

    const updated = {
      ...mockCourse,
      modules: [...mockCourse.modules, customMod],
    };

    await storageAdapter.savePath(updated as any);
    const fetched = await storageAdapter.getSavedPathById('course-test-custom-topics');

    assert.ok(fetched);
    assert.equal(fetched?.modules?.length, 2);
    assert.equal(fetched?.modules?.[1].title, 'Self-Attention Mechanisms & Transformers');

    // Clean up
    await storageAdapter.deletePath('course-test-custom-topics');
  });
});
