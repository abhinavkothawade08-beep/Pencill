import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  getDiscussions,
  getDiscussionById,
  createDiscussion,
  toggleDiscussionUpvote,
  addReply,
  toggleReplyUpvote,
  toggleAcceptedAnswer,
  updateDiscussion,
  deleteDiscussion,
  deleteReply,
  reportDiscussion,
} from '../src/services/supabase/communityService';
import {
  storageAdapter,
  isMockOrSeedDiscussion,
  DiscussionRecord,
} from '../src/lib/storage/storageAdapter';
import { GET, POST, PATCH, DELETE } from '../src/app/api/community/route';
import { NextRequest } from 'next/server';

describe('Community Q&A Real-Data Transformation Suite', () => {
  beforeEach(async () => {
    // Clear in-memory / IDB discussions before each test
    const all = await storageAdapter.getDiscussions();
    for (const d of all) {
      await storageAdapter.deleteDiscussion(d.id);
    }
  });

  describe('1. Mock Data Elimination & Legacy Seed Purging', () => {
    it('isMockOrSeedDiscussion correctly identifies legacy seed and fake persona records', () => {
      // Legacy seed IDs
      assert.strictEqual(isMockOrSeedDiscussion({ id: 'disc-seed-1', authorName: 'Aarav Sharma', title: 'Calculus' }), true);
      assert.strictEqual(isMockOrSeedDiscussion({ id: 'mock-123', authorName: 'Student', title: 'Physics' }), true);
      assert.strictEqual(isMockOrSeedDiscussion({ id: 'disc-456', authorName: 'Priya Nair', title: 'Biology' }), true);
      assert.strictEqual(isMockOrSeedDiscussion({ id: 'disc-789', authorName: 'Dr. Elena Rostova', title: 'AI' }), true);
      assert.strictEqual(isMockOrSeedDiscussion({ id: 'disc-999', authorName: 'Scholar', title: 'Deriving Schrödinger Equation' }), true);
      assert.strictEqual(isMockOrSeedDiscussion({ id: 'demo-100', authorName: 'Demo Scholar', title: 'General' }), true);

      // Genuine records
      assert.strictEqual(isMockOrSeedDiscussion({ id: 'disc-1730000000-xyz', authorName: 'Abhinav', title: 'Eigenvalues in Linear Algebra' }), false);
      assert.strictEqual(isMockOrSeedDiscussion({ id: 'disc-1730000001-abc', authorName: 'Prof. Miller', title: 'Thermodynamics Partition Functions' }), false);
    });

    it('getDiscussions returns genuine empty array when no user discussions exist (Zero Mock Data)', async () => {
      const discussions = await getDiscussions();
      assert.strictEqual(Array.isArray(discussions), true);
      assert.strictEqual(discussions.length, 0);
    });

    it('purgeMockDiscussions permanently deletes legacy mock records from storage', async () => {
      // Inject synthetic mock seed records
      const mockRec1: DiscussionRecord = {
        id: 'disc-seed-1',
        userId: 'fake-user-1',
        authorName: 'Aarav Sharma',
        domain: 'Science & Mathematics',
        title: 'Deriving Schrödinger Equation from First Principles',
        content: 'Can someone provide a rigorous mathematical intuition?',
        tags: ['Quantum Mechanics', 'Wave Function'],
        upvotes: 14,
        replyCount: 1,
        isSolved: false,
        createdAt: '2026-09-01T00:00:00Z',
      };

      const mockRec2: DiscussionRecord = {
        id: 'disc-seed-2',
        userId: 'fake-user-2',
        authorName: 'Priya Nair',
        domain: 'Engineering & Technology',
        title: 'Graph Neural Networks Pruning',
        content: 'What is the optimal sparsity ratio?',
        tags: ['GNN', 'Deep Learning'],
        upvotes: 9,
        replyCount: 0,
        isSolved: false,
        createdAt: '2026-09-02T00:00:00Z',
      };

      await storageAdapter.saveDiscussion(mockRec1);
      await storageAdapter.saveDiscussion(mockRec2);

      // Purge and verify
      const purged = await storageAdapter.purgeMockDiscussions();
      assert.strictEqual(purged >= 2, true);

      const remaining = await getDiscussions();
      assert.strictEqual(remaining.length, 0);
    });
  });

  describe('2. Genuine Discussion Creation, Retrieval & Persistence', () => {
    it('creates and persists a genuine academic discussion with authentic metadata', async () => {
      const created = await createDiscussion({
        title: 'Intuitive proof of Cauchy-Schwarz inequality for inner product spaces',
        content: 'How can we visualize the Cauchy-Schwarz inequality geometrically without using the quadratic discriminant proof?',
        domain: 'Science & Mathematics',
        tags: ['Linear Algebra', 'Inequalities', 'Inner Product'],
        userId: 'user-scholar-101',
        authorName: 'Marcus Aurelius',
      });

      assert.ok(created.id.startsWith('disc-'));
      assert.strictEqual(created.title, 'Intuitive proof of Cauchy-Schwarz inequality for inner product spaces');
      assert.strictEqual(created.domain, 'Science & Mathematics');
      assert.strictEqual(created.upvotes, 0);
      assert.strictEqual(created.replyCount, 0);
      assert.strictEqual(created.isSolved, false);
      assert.ok(created.createdAt);

      // Verify retrieval
      const fetched = await getDiscussionById(created.id);
      assert.ok(fetched);
      assert.strictEqual(fetched.id, created.id);
      assert.strictEqual(fetched.authorName, 'Marcus Aurelius');
    });

    it('rejects creation of invalid discussions with empty title or content', async () => {
      await assert.rejects(
        async () => {
          await createDiscussion({
            title: '',
            content: 'Valid content',
            domain: 'Science & Mathematics',
          });
        },
        /Discussion title and content are required/
      );

      await assert.rejects(
        async () => {
          await createDiscussion({
            title: 'Valid Title',
            content: '   ',
            domain: 'Science & Mathematics',
          });
        },
        /Discussion title and content are required/
      );
    });
  });

  describe('3. Duplicate-Vote Prevention & Engagement Mechanics', () => {
    it('toggles upvotes cleanly and prevents duplicate votes from the same user', async () => {
      const created = await createDiscussion({
        title: 'Question on Maxwell Equations Gauge Invariance',
        content: 'Why is Lorenz gauge preferred in relativistic electrodynamics?',
        domain: 'Science & Mathematics',
        userId: 'scholar-original-author',
        authorName: 'Maxwell Fan',
      });

      // User A upvotes
      const afterVote1 = await toggleDiscussionUpvote(created.id, 'scholar-user-A');
      assert.ok(afterVote1);
      assert.strictEqual(afterVote1.upvotes, 1);
      assert.deepStrictEqual(afterVote1.upvoterUserIds, ['scholar-user-A']);

      // User A upvotes again (should toggle OFF)
      const afterVote2 = await toggleDiscussionUpvote(created.id, 'scholar-user-A');
      assert.ok(afterVote2);
      assert.strictEqual(afterVote2.upvotes, 0);
      assert.strictEqual(afterVote2.upvoterUserIds?.length, 0);

      // User A and User B both upvote
      await toggleDiscussionUpvote(created.id, 'scholar-user-A');
      const afterBoth = await toggleDiscussionUpvote(created.id, 'scholar-user-B');
      assert.ok(afterBoth);
      assert.strictEqual(afterBoth.upvotes, 2);
      assert.strictEqual(afterBoth.upvoterUserIds?.includes('scholar-user-A'), true);
      assert.strictEqual(afterBoth.upvoterUserIds?.includes('scholar-user-B'), true);
    });
  });

  describe('4. Genuine Replies, Upvoting & Solution Verification', () => {
    it('submits genuine replies, increments replyCount, and supports accepted answer marking', async () => {
      const disc = await createDiscussion({
        title: 'Resolving Divergence in Path Integrals',
        content: 'How does dimensional regularization cure ultraviolet divergences?',
        domain: 'Science & Mathematics',
        userId: 'qft-student',
        authorName: 'QFT Student',
      });

      // Add Reply 1
      const reply = await addReply({
        discussionId: disc.id,
        content: 'Dimensional regularization continues spacetime dimension d into the complex plane, turning poles into Gamma function residues.',
        userId: 'physicist-pro',
        authorName: 'Dr. Feynman Fan',
      });

      assert.ok(reply);
      assert.ok(reply.id.startsWith('rep-'));
      assert.strictEqual(reply.discussionId, disc.id);
      assert.strictEqual(reply.authorName, 'Dr. Feynman Fan');

      // Check discussion reflection
      const discAfterReply = await getDiscussionById(disc.id);
      assert.ok(discAfterReply);
      assert.strictEqual(discAfterReply.replyCount, 1);
      assert.strictEqual(discAfterReply.replies?.length, 1);
      assert.strictEqual(discAfterReply.isSolved, false);

      // Upvote Reply
      const upvoted = await toggleReplyUpvote(disc.id, reply.id, 'voter-123');
      assert.ok(upvoted);
      const repInList = upvoted.replies?.find((r) => r.id === reply.id);
      assert.strictEqual(repInList?.upvotes, 1);

      // Mark Reply as Accepted Answer
      const solved = await toggleAcceptedAnswer(disc.id, reply.id);
      assert.ok(solved);
      assert.strictEqual(solved.isSolved, true);
      const acceptedRep = solved.replies?.find((r) => r.id === reply.id);
      assert.strictEqual(acceptedRep?.isAcceptedAnswer, true);

      // Unmark Accepted Answer
      const unverified = await toggleAcceptedAnswer(disc.id, reply.id);
      assert.ok(unverified);
      assert.strictEqual(unverified.isSolved, false);
      const unacceptedRep = unverified.replies?.find((r) => r.id === reply.id);
      assert.strictEqual(unacceptedRep?.isAcceptedAnswer, false);
    });
  });

  describe('5. Discussion Editing, Deletion & Reporting', () => {
    it('updates discussion title and content accurately', async () => {
      const disc = await createDiscussion({
        title: 'Initial Title with Typo',
        content: 'Initial description content',
        domain: 'Engineering & Technology',
        userId: 'author-editor',
      });

      const updated = await updateDiscussion(disc.id, {
        title: 'Corrected Title: Fourier Transform Intuition',
        content: 'Updated detailed mathematical breakdown.',
      });

      assert.ok(updated);
      assert.strictEqual(updated.title, 'Corrected Title: Fourier Transform Intuition');
      assert.strictEqual(updated.content, 'Updated detailed mathematical breakdown.');
    });

    it('deletes replies and discussions completely', async () => {
      const disc = await createDiscussion({
        title: 'Temporary Question to Delete',
        content: 'Will be deleted immediately',
        domain: 'Medical & Health Sciences',
      });

      const rep = await addReply({
        discussionId: disc.id,
        content: 'Temporary response',
      });
      assert.ok(rep);

      // Delete reply
      const afterRepDelete = await deleteReply(disc.id, rep.id);
      assert.ok(afterRepDelete);
      assert.strictEqual(afterRepDelete.replyCount, 0);

      // Delete discussion
      const deleted = await deleteDiscussion(disc.id);
      assert.strictEqual(deleted, true);

      const notFound = await getDiscussionById(disc.id);
      assert.strictEqual(notFound, null);
    });

    it('reports discussion and marks isReported flag with reason', async () => {
      const disc = await createDiscussion({
        title: 'Question for Moderation Test',
        content: 'Testing moderation flag functionality.',
        domain: 'Law & Government',
      });

      const reported = await reportDiscussion(disc.id, 'Commercial promotion / off-topic');
      assert.strictEqual(reported, true);

      const refreshed = await getDiscussionById(disc.id);
      assert.ok(refreshed);
      assert.strictEqual(refreshed.isReported, true);
      assert.strictEqual(refreshed.reportReason, 'Commercial promotion / off-topic');
    });
  });

  describe('6. Filtering, Domain Partitioning & Search', () => {
    it('filters discussions accurately by domain, status, and search query', async () => {
      // Create 3 discussions across different domains
      const d1 = await createDiscussion({
        title: 'Solving Navier-Stokes Boundary Layer Separation',
        content: 'Fluid mechanics boundary layer turbulent transition.',
        domain: 'Engineering & Technology',
      });

      const d2 = await createDiscussion({
        title: 'Enzyme Kinetics Michaelis-Menten Derivation',
        content: 'Biochemistry steady-state approximation derivation.',
        domain: 'Medical & Health Sciences',
      });

      const d3 = await createDiscussion({
        title: 'Real Analysis Compact Sets in Metric Spaces',
        content: 'Heine-Borel theorem proof nuances.',
        domain: 'Science & Mathematics',
      });

      // Filter by domain
      const mathOnly = await getDiscussions({ domain: 'Science & Mathematics' });
      assert.strictEqual(mathOnly.length, 1);
      assert.strictEqual(mathOnly[0].id, d3.id);

      const engOnly = await getDiscussions({ domain: 'Engineering & Technology' });
      assert.strictEqual(engOnly.length, 1);
      assert.strictEqual(engOnly[0].id, d1.id);

      // Search query
      const searchKinetics = await getDiscussions({ searchQuery: 'Michaelis-Menten' });
      assert.strictEqual(searchKinetics.length, 1);
      assert.strictEqual(searchKinetics[0].id, d2.id);

      // Solved vs Unsolved filter
      await toggleAcceptedAnswer(d1.id);
      const solvedList = await getDiscussions({ status: 'solved' });
      assert.strictEqual(solvedList.length, 1);
      assert.strictEqual(solvedList[0].id, d1.id);

      const unsolvedList = await getDiscussions({ status: 'unsolved' });
      assert.strictEqual(unsolvedList.length, 2);
    });

    it('supports pagination boundaries (6 items per page) and all 12 taxonomy disciplines', async () => {
      const disciplines = [
        "School Education",
        "Engineering & Technology",
        "Medical & Health Sciences",
        "Business, Management & Commerce",
        "Science & Mathematics",
        "Arts, Humanities & Social Sciences",
        "Law & Government",
        "Finance, Accounting & Professional Qualifications",
        "Vocational & Applied Technical Skills",
        "Languages & Communication",
        "Research & Academic Development",
        "Personal & Practical Learning",
      ];

      // Create one question per discipline (12 items total)
      for (let i = 0; i < disciplines.length; i++) {
        await createDiscussion({
          title: `Question in ${disciplines[i]} - Topic ${i + 1}`,
          content: `In-depth exploration of core curriculum for ${disciplines[i]}`,
          domain: disciplines[i],
        });
      }

      const all = await getDiscussions();
      assert.strictEqual(all.length, 12);

      // Verify pagination logic (6 items per page)
      const ITEMS_PER_PAGE = 6;
      const totalPages = Math.ceil(all.length / ITEMS_PER_PAGE);
      assert.strictEqual(totalPages, 2);

      const page1 = all.slice(0, ITEMS_PER_PAGE);
      const page2 = all.slice(ITEMS_PER_PAGE, ITEMS_PER_PAGE * 2);
      assert.strictEqual(page1.length, 6);
      assert.strictEqual(page2.length, 6);

      // Verify each discipline is individually filterable
      for (const disc of disciplines) {
        const filtered = await getDiscussions({ domain: disc });
        assert.strictEqual(filtered.length, 1);
        assert.strictEqual(filtered[0].domain, disc);
      }
    });
  });

  describe('7. API Route Endpoints (/api/community)', () => {
    it('GET /api/community returns genuine discussions list', async () => {
      await createDiscussion({
        title: 'API Test Discussion',
        content: 'Testing through NextRequest endpoint',
        domain: 'Engineering & Technology',
      });

      const req = new NextRequest('http://localhost:3000/api/community?domain=all');
      const res = await GET(req);
      assert.strictEqual(res.status, 200);

      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.strictEqual(Array.isArray(json.data), true);
      assert.strictEqual(json.total >= 1, true);
    });

    it('POST /api/community creates discussion via HTTP endpoint', async () => {
      const payload = {
        title: 'Endpoint Created Thread',
        content: 'Created via HTTP POST /api/community',
        domain: 'Languages & Communication',
        tags: ['Linguistics', 'Syntax'],
        authorName: 'Linguist Scholar',
      };

      const req = new NextRequest('http://localhost:3000/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await POST(req);
      assert.strictEqual(res.status, 200);

      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.data.title, payload.title);
      assert.strictEqual(json.data.authorName, 'Linguist Scholar');
    });

    it('PATCH /api/community handles upvote action', async () => {
      const disc = await createDiscussion({
        title: 'Patch Test Thread',
        content: 'Testing PATCH actions',
        domain: 'School Education',
      });

      const req = new NextRequest('http://localhost:3000/api/community', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upvote',
          discussionId: disc.id,
          userId: 'test-patch-voter',
        }),
      });

      const res = await PATCH(req);
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.data.upvotes, 1);
    });

    it('PATCH /api/community handles reply and reply_upvote actions', async () => {
      const disc = await createDiscussion({
        title: 'Thread For Reply Via API',
        content: 'Testing PATCH reply action',
        domain: 'Engineering & Technology',
      });

      // Add reply via PATCH
      const replyReq = new NextRequest('http://localhost:3000/api/community', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reply',
          discussionId: disc.id,
          content: 'This is an authoritative reply via PATCH.',
          userId: 'expert-responder',
          authorName: 'Domain Expert',
        }),
      });

      const replyRes = await PATCH(replyReq);
      assert.strictEqual(replyRes.status, 200);
      const replyJson = await replyRes.json();
      assert.strictEqual(replyJson.success, true);
      assert.strictEqual(replyJson.data.content, 'This is an authoritative reply via PATCH.');
      assert.strictEqual(replyJson.data.authorName, 'Domain Expert');

      const replyId = replyJson.data.id;

      // Upvote reply via PATCH
      const upvoteReq = new NextRequest('http://localhost:3000/api/community', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reply_upvote',
          discussionId: disc.id,
          replyId,
          userId: 'peer-reviewer-9',
        }),
      });

      const upvoteRes = await PATCH(upvoteReq);
      assert.strictEqual(upvoteRes.status, 200);
      const upvoteJson = await upvoteRes.json();
      assert.strictEqual(upvoteJson.success, true);
      const repInDisc = upvoteJson.data.replies.find((r: any) => r.id === replyId);
      assert.strictEqual(repInDisc.upvotes, 1);
    });

    it('PATCH /api/community handles toggle_solved, edit, and report actions', async () => {
      const disc = await createDiscussion({
        title: 'Discussion To Resolve and Moderate',
        content: 'Initial question body',
        domain: 'Science & Mathematics',
      });

      // Add reply first
      const rep = await addReply({
        discussionId: disc.id,
        content: 'Correct proof solution',
        userId: 'solver-1',
      });
      assert.ok(rep);

      // Toggle solved with replyId
      const solveReq = new NextRequest('http://localhost:3000/api/community', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_solved',
          discussionId: disc.id,
          replyId: rep.id,
        }),
      });

      const solveRes = await PATCH(solveReq);
      assert.strictEqual(solveRes.status, 200);
      const solveJson = await solveRes.json();
      assert.strictEqual(solveJson.success, true);
      assert.strictEqual(solveJson.data.isSolved, true);

      // Edit discussion title and content
      const editReq = new NextRequest('http://localhost:3000/api/community', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit',
          discussionId: disc.id,
          updates: {
            title: 'Polished Discussion Title',
            content: 'Enhanced question description',
          },
        }),
      });

      const editRes = await PATCH(editReq);
      assert.strictEqual(editRes.status, 200);
      const editJson = await editRes.json();
      assert.strictEqual(editJson.success, true);
      assert.strictEqual(editJson.data.title, 'Polished Discussion Title');
      assert.strictEqual(editJson.data.content, 'Enhanced question description');

      // Report discussion for academic moderation
      const reportReq = new NextRequest('http://localhost:3000/api/community', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'report',
          discussionId: disc.id,
          reason: 'Inaccurate mathematical premise',
        }),
      });

      const reportRes = await PATCH(reportReq);
      assert.strictEqual(reportRes.status, 200);
      const reportJson = await reportRes.json();
      assert.strictEqual(reportJson.success, true);
      assert.strictEqual(reportJson.message, 'Discussion flagged for academic moderation.');
    });

    it('DELETE /api/community deletes replies and discussions', async () => {
      const disc = await createDiscussion({
        title: 'To Be Deleted Via API',
        content: 'Temporary content',
        domain: 'School Education',
      });

      const rep = await addReply({
        discussionId: disc.id,
        content: 'Reply to delete via API',
      });
      assert.ok(rep);

      // Delete reply via API
      const delRepReq = new NextRequest(`http://localhost:3000/api/community?discussionId=${disc.id}&replyId=${rep.id}`, {
        method: 'DELETE',
      });
      const delRepRes = await DELETE(delRepReq);
      assert.strictEqual(delRepRes.status, 200);
      const delRepJson = await delRepRes.json();
      assert.strictEqual(delRepJson.success, true);
      assert.strictEqual(delRepJson.data.replyCount, 0);

      // Delete discussion via API
      const req = new NextRequest(`http://localhost:3000/api/community?discussionId=${disc.id}`, {
        method: 'DELETE',
      });

      const res = await DELETE(req);
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);

      const check = await getDiscussionById(disc.id);
      assert.strictEqual(check, null);
    });
  });
});
