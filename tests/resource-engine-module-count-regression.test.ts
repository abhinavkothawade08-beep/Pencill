import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  planIntelligentCurriculum,
  buildDeterministicProposal,
  calculateRecommendedModuleCount,
  isNarrowFocusedTopic,
  isComprehensiveSubject,
} from '../src/lib/curriculum-intelligence';

import { ResourceEngineOrchestrator } from '../src/lib/resource-engine/orchestrator';
import { LearnerGoalInput } from '../src/lib/resource-engine/types';

describe('PENCILL RESOURCE ENGINE: Module Count & Curriculum Intelligence Regressions', () => {
  const orchestrator = new ResourceEngineOrchestrator();

  describe('1. Module Count Decision Engine (calculateRecommendedModuleCount)', () => {
    it('allocates 4-5 modules for broad comprehensive domains even when explicit topics array has 1 item', () => {
      // Replicating the bug where /new-goal sends `topics: config.selectedTopics.map(t => t.label)` with 1 item
      const mlCount = calculateRecommendedModuleCount('Machine Learning', 'intermediate', 20, ['Machine Learning']);
      assert.ok(mlCount >= 4 && mlCount <= 6, `Machine Learning with 1-topic array must get 4-6 modules, got ${mlCount}`);

      const osCount = calculateRecommendedModuleCount('Operating Systems', 'intermediate', 20, ['Operating Systems']);
      assert.ok(osCount >= 4 && osCount <= 6, `Operating Systems with 1-topic array must get 4-6 modules, got ${osCount}`);

      const dsaCount = calculateRecommendedModuleCount('Data Structures and Algorithms', 'intermediate', 25, ['Data Structures and Algorithms']);
      assert.ok(dsaCount >= 4 && dsaCount <= 6, `DSA with 1-topic array must get 4-6 modules, got ${dsaCount}`);

      const netCount = calculateRecommendedModuleCount('Computer Networks', 'intermediate', 20, ['Computer Networks']);
      assert.ok(netCount >= 4 && netCount <= 5, `Computer Networks with 1-topic array must get 4-5 modules, got ${netCount}`);

      const dbCount = calculateRecommendedModuleCount('Database Management Systems', 'intermediate', 20, ['Database Management Systems']);
      assert.ok(dbCount >= 4 && dbCount <= 5, `DBMS with 1-topic array must get 4-5 modules, got ${dbCount}`);
    });

    it('allocates exactly 1 module for truly narrow focused topics', () => {
      const binarySearchCount = calculateRecommendedModuleCount('Binary Search Algorithm', 'beginner', 4, ['Binary Search Algorithm']);
      assert.equal(binarySearchCount, 1, `Binary Search must get exactly 1 module, got ${binarySearchCount}`);

      const gitRebaseCount = calculateRecommendedModuleCount('Git Interactive Rebase', 'intermediate', 3, ['Git Interactive Rebase']);
      assert.equal(gitRebaseCount, 1, `Git Rebase must get exactly 1 module, got ${gitRebaseCount}`);

      const flexboxCount = calculateRecommendedModuleCount('CSS Flexbox Layout', 'beginner', 4, ['CSS Flexbox Layout']);
      assert.equal(flexboxCount, 1, `CSS Flexbox must get exactly 1 module, got ${flexboxCount}`);

      const decoratorsCount = calculateRecommendedModuleCount('Python Decorators', 'intermediate', 4, ['Python Decorators']);
      assert.equal(decoratorsCount, 1, `Python Decorators must get exactly 1 module, got ${decoratorsCount}`);

      const jwtCount = calculateRecommendedModuleCount('JWT Authentication Flow', 'intermediate', 4, ['JWT Authentication Flow']);
      assert.equal(jwtCount, 1, `JWT Authentication must get exactly 1 module, got ${jwtCount}`);
    });

    it('correctly classifies narrow topics vs comprehensive subjects without false positives', () => {
      assert.equal(isNarrowFocusedTopic('Binary Search'), true);
      assert.equal(isNarrowFocusedTopic('Git Rebase'), true);
      assert.equal(isNarrowFocusedTopic('CSS Grid'), true);

      // Broad disciplines must NEVER be flagged as narrow
      assert.equal(isNarrowFocusedTopic('Machine Learning'), false);
      assert.equal(isNarrowFocusedTopic('Operating Systems Architecture'), false);
      assert.equal(isNarrowFocusedTopic('Computer Networks and Protocols'), false);
      assert.equal(isNarrowFocusedTopic('Full Stack Web Development'), false);
      assert.equal(isNarrowFocusedTopic('Data Structures & Algorithms Masterclass'), false);

      // Comprehensive subjects detection
      assert.equal(isComprehensiveSubject('Machine Learning', 10), true);
      assert.equal(isComprehensiveSubject('Operating Systems', 10), true);
      assert.equal(isComprehensiveSubject('Calculus and Differential Equations', 10), true);
      assert.equal(isComprehensiveSubject('Arbitrary Subject', 40), true); // > 30h
      assert.equal(isComprehensiveSubject('Binary Search', 4), false);
    });
  });

  describe('2. Multi-Module Curriculum Planning (planIntelligentCurriculum)', () => {
    it('generates 5 progressive modules for Machine Learning requested as single topic', async () => {
      const plan = await planIntelligentCurriculum({
        topic: 'Machine Learning',
        topics: ['Machine Learning'],
        level: 'intermediate',
        depth: 'comprehensive',
        weeklyStudyHours: 10,
        targetWeeks: 4,
      });

      assert.ok(plan.modules.length >= 4 && plan.modules.length <= 6, `Expected 4-6 modules for Machine Learning, got ${plan.modules.length}`);
      assert.equal(plan.domain, 'ai_and_data');

      // Check pedagogical sequence
      const titles = plan.modules.map(m => m.title);
      assert.ok(titles.some(t => /Foundation|Math|Prerequisite|Core Principles/i.test(t)), 'Module 1 must cover foundations');
      assert.ok(titles.some(t => /Supervised|Regression|Classification/i.test(t)), 'Module must cover supervised learning');
      assert.ok(titles.some(t => /Unsupervised|Clustering|Dimensionality/i.test(t)), 'Module must cover unsupervised learning');
      assert.ok(titles.some(t => /Deep Learning|Neural Networks/i.test(t)), 'Module must cover deep learning');
      assert.ok(titles.some(t => /Production|Deployment|MLOps|Evaluation/i.test(t)), 'Module must cover MLOps/production');

      // Verify no duplicate module titles or self-concatenated "Topic & Topic"
      for (const m of plan.modules) {
        assert.ok(!m.title.includes('Machine Learning & Machine Learning'), `Title was corrupted: ${m.title}`);
        assert.ok(m.learningObjectives.length >= 1, `Module ${m.title} must have learning objectives`);
      }
    });

    it('generates 5 progressive modules for Operating Systems requested as single topic', async () => {
      const plan = await planIntelligentCurriculum({
        topic: 'Operating Systems',
        topics: ['Operating Systems'],
        level: 'intermediate',
        depth: 'comprehensive',
        weeklyStudyHours: 10,
        targetWeeks: 4,
      });

      assert.ok(plan.modules.length >= 4 && plan.modules.length <= 6, `Expected 4-6 modules for Operating Systems, got ${plan.modules.length}`);
      assert.equal(plan.domain, 'computer_science');

      const titles = plan.modules.map(m => m.title);
      assert.ok(titles.some(t => /Architecture|Kernel|Structure/i.test(t)), 'Module must cover OS architecture/kernel');
      assert.ok(titles.some(t => /Process|Thread|Scheduling|Concurrency/i.test(t)), 'Module must cover processes/scheduling');
      assert.ok(titles.some(t => /Memory|Virtual Memory|Paging/i.test(t)), 'Module must cover memory management');
      assert.ok(titles.some(t => /File Systems?|Storage|I\/O/i.test(t)), 'Module must cover file systems/storage');
      assert.ok(titles.some(t => /Synchronization|Mutex|Deadlock|Concurrency/i.test(t)), 'Module must cover synchronization/deadlock');
    });

    it('generates 4 progressive modules for Computer Networks', async () => {
      const plan = await planIntelligentCurriculum({
        topic: 'Computer Networks',
        topics: ['Computer Networks'],
        level: 'intermediate',
        depth: 'comprehensive',
        weeklyStudyHours: 8,
        targetWeeks: 4,
      });

      assert.ok(plan.modules.length >= 4, `Expected at least 4 modules for Computer Networks, got ${plan.modules.length}`);
      assert.equal(plan.domain, 'computer_science');
    });

    it('generates exactly 1 focused module for Binary Search', async () => {
      const plan = await planIntelligentCurriculum({
        topic: 'Binary Search',
        topics: ['Binary Search'],
        level: 'beginner',
        depth: 'introductory',
        weeklyStudyHours: 4,
        targetWeeks: 1,
      });

      assert.equal(plan.modules.length, 1, `Binary Search must generate exactly 1 module, got ${plan.modules.length}`);
      assert.match(plan.modules[0].title, /Binary Search/i);
      assert.ok(plan.modules[0].learningObjectives.length >= 1);
    });

    it('generates 4 progressive modules for unlisted broad subject via dynamic pedagogical fallback without title collision', async () => {
      const plan = await planIntelligentCurriculum({
        topic: 'Quantum Computing and Quantum Information',
        level: 'advanced',
        depth: 'comprehensive',
        weeklyStudyHours: 12,
        targetWeeks: 4,
      });

      assert.ok(plan.modules.length >= 3, `Expected at least 3 modules for Quantum Computing, got ${plan.modules.length}`);

      // Verify no duplicate titles or "Quantum & Quantum"
      const titles = plan.modules.map(m => m.title);
      for (const t of titles) {
        assert.ok(!t.includes('Quantum Computing and Quantum Information & Quantum Computing'), `Corrupted title: ${t}`);
      }
      const uniqueTitles = new Set(titles);
      assert.equal(uniqueTitles.size, titles.length, 'All module titles must be unique');
    });
  });

  describe('3. End-to-End Orchestrator Execution & Resource Allocation', () => {
    it('executes full course generation for Operating Systems with distinct multi-module resources and no video duplicates', async () => {
      const input: LearnerGoalInput = {
        topic: 'Operating Systems',
        topics: ['Operating Systems'],
        level: 'intermediate',
        depth: 'comprehensive',
        learningGoal: 'master_subject',
        learningStyle: 'balanced',
        language: 'en',
        weeklyStudyHours: 10,
        targetWeeks: 4,
      };

      const result = await orchestrator.execute(input, 'test-os-regression-user');
      assert.equal(result.success, true, 'Generation must succeed');
      assert.ok(result.course, 'Course must be defined');
      assert.ok(result.course.modules, 'Course modules must be defined');
      assert.ok(result.course.modules.length >= 4, `Expected at least 4 modules in generated course, got ${result.course.modules.length}`);

      // Verify all modules have distinct assignments
      assert.equal(result.assignments.length, result.course.modules.length);

      const allVideoIds = new Set<string>();
      let totalAssignedVideos = 0;

      for (const assignment of result.assignments) {
        assert.ok(assignment.moduleId, 'Assignment must have moduleId');
        assert.ok(assignment.videos.length > 0, `Module ${assignment.moduleId} must have at least one video`);
        assert.ok(assignment.readings.length > 0, `Module ${assignment.moduleId} must have at least one reading`);

        for (const v of assignment.videos) {
          totalAssignedVideos++;
          assert.ok(!allVideoIds.has(v.id), `Video ${v.id} was duplicated across modules!`);
          allVideoIds.add(v.id);
        }
      }

      assert.equal(allVideoIds.size, totalAssignedVideos, 'Zero duplicate videos across all modules');
    });

    it('executes full course generation for narrow topic (Binary Search) with exactly 1 module and focused resources', async () => {
      const input: LearnerGoalInput = {
        topic: 'Binary Search',
        topics: ['Binary Search'],
        level: 'beginner',
        depth: 'introductory',
        learningGoal: 'master_subject',
        learningStyle: 'balanced',
        language: 'en',
        weeklyStudyHours: 3,
        targetWeeks: 1,
      };

      const result = await orchestrator.execute(input, 'test-binary-search-user');
      assert.equal(result.success, true);
      assert.ok(result.course);
      assert.ok(result.course.modules);
      assert.equal(result.course.modules.length, 1, `Expected exactly 1 module for Binary Search, got ${result.course.modules.length}`);
      assert.equal(result.assignments.length, 1);
      assert.ok(result.assignments[0].videos.length > 0);
    });
  });
});
