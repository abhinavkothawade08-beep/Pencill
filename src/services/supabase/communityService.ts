import { supabase, isSupabaseConfigured, getAuthenticatedSupabaseClient } from './client';
import { storageAdapter, DiscussionRecord, isMockOrSeedDiscussion } from '@/lib/storage/storageAdapter';

export interface CommunityReply {
  id: string;
  discussionId: string;
  userId?: string | null;
  authorName: string;
  authorAvatar?: string;
  content: string;
  upvotes: number;
  upvoterUserIds?: string[];
  isAcceptedAnswer?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CommunityDiscussion {
  id: string;
  userId?: string | null;
  authorName: string;
  authorAvatar?: string;
  courseId?: string | null;
  lessonId?: string | null;
  domain: string;
  title: string;
  content: string;
  tags: string[];
  upvotes: number;
  upvoterUserIds?: string[];
  replyCount: number;
  isSolved: boolean;
  isPinned?: boolean;
  isReported?: boolean;
  reportReason?: string | null;
  replies?: CommunityReply[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreateDiscussionInput {
  title: string;
  content: string;
  domain: string;
  tags?: string[];
  userId?: string | null;
  authorName?: string;
  authorAvatar?: string;
  courseId?: string | null;
  lessonId?: string | null;
}

export interface CreateReplyInput {
  discussionId: string;
  content: string;
  userId?: string | null;
  authorName?: string;
  authorAvatar?: string;
}

export interface DiscussionFilterOptions {
  domain?: string;
  status?: 'all' | 'solved' | 'unsolved' | 'my_posts';
  currentUserId?: string;
  searchQuery?: string;
  sortBy?: 'recent' | 'upvotes';
}

function isValidUuid(id?: string | null): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

function mapRecordToDiscussion(rec: DiscussionRecord): CommunityDiscussion {
  return {
    id: rec.id,
    userId: rec.userId || null,
    authorName: rec.authorName,
    authorAvatar: rec.authorAvatar || '/avatars/default-avatar.svg',
    courseId: rec.courseId || null,
    lessonId: rec.lessonId || null,
    domain: rec.domain,
    title: rec.title,
    content: rec.content,
    tags: Array.isArray(rec.tags) ? rec.tags : [],
    upvotes: rec.upvotes || 0,
    upvoterUserIds: rec.upvoterUserIds || [],
    replyCount: rec.replyCount || (rec.replies ? rec.replies.length : 0),
    isSolved: !!rec.isSolved,
    isReported: !!rec.isReported,
    reportReason: rec.reportReason || null,
    replies: (rec.replies || []).map((r) => ({
      id: r.id,
      discussionId: rec.id,
      userId: r.userId || null,
      authorName: r.authorName,
      authorAvatar: r.authorAvatar || '/avatars/default-avatar.svg',
      content: r.content,
      upvotes: r.upvotes || 0,
      upvoterUserIds: r.upvoterUserIds || [],
      isAcceptedAnswer: !!r.isAcceptedAnswer,
      createdAt: r.createdAt,
    })),
    createdAt: rec.createdAt,
    updatedAt: rec.updatedAt,
  };
}

function mapDiscussionToRecord(disc: CommunityDiscussion): DiscussionRecord {
  return {
    id: disc.id,
    userId: disc.userId,
    authorName: disc.authorName,
    authorAvatar: disc.authorAvatar,
    courseId: disc.courseId || undefined,
    lessonId: disc.lessonId || undefined,
    domain: disc.domain,
    title: disc.title,
    content: disc.content,
    tags: disc.tags,
    upvotes: disc.upvotes,
    upvoterUserIds: disc.upvoterUserIds,
    replyCount: disc.replyCount,
    isSolved: disc.isSolved,
    isReported: disc.isReported,
    reportReason: disc.reportReason || undefined,
    replies: (disc.replies || []).map((r) => ({
      id: r.id,
      userId: r.userId,
      authorName: r.authorName,
      authorAvatar: r.authorAvatar,
      content: r.content,
      upvotes: r.upvotes,
      upvoterUserIds: r.upvoterUserIds,
      isAcceptedAnswer: r.isAcceptedAnswer,
      createdAt: r.createdAt,
    })),
    createdAt: disc.createdAt,
    updatedAt: disc.updatedAt,
  };
}

/**
 * Fetch discussions with search, filter, and sort options.
 * Tries Supabase first; if table not found or offline, uses sanitized storageAdapter.
 * NEVER returns or synthesizes fake/mock discussions.
 */
export async function getDiscussions(
  options: DiscussionFilterOptions = {},
  accessToken?: string
): Promise<CommunityDiscussion[]> {
  const {
    domain = 'all',
    status = 'all',
    currentUserId,
    searchQuery = '',
    sortBy = 'recent',
  } = options;

  let discussions: CommunityDiscussion[] = [];
  let fetchedFromRemote = false;

  if (isSupabaseConfigured) {
    try {
      const client = accessToken ? getAuthenticatedSupabaseClient(accessToken) : supabase;
      let query = client.from('community_discussions').select('*');

      if (domain && domain !== 'all') {
        query = query.eq('domain', domain);
      }
      if (status === 'solved') {
        query = query.eq('is_solved', true);
      } else if (status === 'unsolved') {
        query = query.eq('is_solved', false);
      } else if (status === 'my_posts' && currentUserId && isValidUuid(currentUserId)) {
        query = query.eq('user_id', currentUserId);
      }

      if (sortBy === 'upvotes') {
        query = query.order('upvotes', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (!error && data) {
        fetchedFromRemote = true;
        // Fetch replies for these discussions
        const discussionIds = data.map((d) => d.id);
        let repliesByDiscId: Record<string, CommunityReply[]> = {};

        if (discussionIds.length > 0) {
          const { data: repliesData } = await client
            .from('community_replies')
            .select('*')
            .in('discussion_id', discussionIds)
            .order('created_at', { ascending: true });

          if (repliesData) {
            for (const r of repliesData) {
              if (!repliesByDiscId[r.discussion_id]) {
                repliesByDiscId[r.discussion_id] = [];
              }
              repliesByDiscId[r.discussion_id].push({
                id: r.id,
                discussionId: r.discussion_id,
                userId: r.user_id,
                authorName: r.author_name,
                authorAvatar: r.author_avatar || '/avatars/default-avatar.svg',
                content: r.content,
                upvotes: r.upvotes || 0,
                upvoterUserIds: r.upvoter_user_ids || [],
                isAcceptedAnswer: !!r.is_accepted_answer,
                createdAt: r.created_at,
                updatedAt: r.updated_at,
              });
            }
          }
        }

        discussions = data
          .filter((row) => !isMockOrSeedDiscussion(row))
          .map((row) => ({
            id: row.id,
            userId: row.user_id,
            authorName: row.author_name,
            authorAvatar: row.author_avatar || '/avatars/default-avatar.svg',
            courseId: row.course_id,
            lessonId: row.lesson_id,
            domain: row.domain || 'General',
            title: row.title,
            content: row.content,
            tags: row.tags || [],
            upvotes: row.upvotes || 0,
            upvoterUserIds: row.upvoter_user_ids || [],
            replyCount: row.reply_count || (repliesByDiscId[row.id]?.length || 0),
            isSolved: !!row.is_solved,
            isPinned: !!row.is_pinned,
            isReported: !!row.is_reported,
            reportReason: row.report_reason,
            replies: repliesByDiscId[row.id] || [],
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }));

        // Sync genuine remote records into storageAdapter
        for (const disc of discussions) {
          await storageAdapter.saveDiscussion(mapDiscussionToRecord(disc));
        }
      }
    } catch (err) {
      // Supabase table may not exist yet or offline: fallback to local storage
      fetchedFromRemote = false;
    }
  }

  if (!fetchedFromRemote) {
    const local = await storageAdapter.getDiscussions();
    discussions = local.map(mapRecordToDiscussion);
  }

  // Filter in memory for any additional search or client filters
  return discussions
    .filter((d) => {
      if (isMockOrSeedDiscussion(d)) return false;

      if (domain !== 'all' && d.domain !== domain) return false;

      if (status === 'solved' && !d.isSolved) return false;
      if (status === 'unsolved' && d.isSolved) return false;
      if (status === 'my_posts' && currentUserId && d.userId !== currentUserId) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          d.title.toLowerCase().includes(q) ||
          d.content.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q)) ||
          d.authorName.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'upvotes') {
        return b.upvotes - a.upvotes;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
}

/**
 * Get single discussion by ID.
 */
export async function getDiscussionById(
  id: string,
  accessToken?: string
): Promise<CommunityDiscussion | null> {
  if (!id) return null;

  if (isSupabaseConfigured) {
    try {
      const client = accessToken ? getAuthenticatedSupabaseClient(accessToken) : supabase;
      const { data, error } = await client
        .from('community_discussions')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data && !isMockOrSeedDiscussion(data)) {
        const { data: repliesData } = await client
          .from('community_replies')
          .select('*')
          .eq('discussion_id', id)
          .order('created_at', { ascending: true });

        const replies: CommunityReply[] = (repliesData || []).map((r) => ({
          id: r.id,
          discussionId: r.discussion_id,
          userId: r.user_id,
          authorName: r.author_name,
          authorAvatar: r.author_avatar || '/avatars/default-avatar.svg',
          content: r.content,
          upvotes: r.upvotes || 0,
          upvoterUserIds: r.upvoter_user_ids || [],
          isAcceptedAnswer: !!r.is_accepted_answer,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));

        const discussion: CommunityDiscussion = {
          id: data.id,
          userId: data.user_id,
          authorName: data.author_name,
          authorAvatar: data.author_avatar || '/avatars/default-avatar.svg',
          courseId: data.course_id,
          lessonId: data.lesson_id,
          domain: data.domain || 'General',
          title: data.title,
          content: data.content,
          tags: data.tags || [],
          upvotes: data.upvotes || 0,
          upvoterUserIds: data.upvoter_user_ids || [],
          replyCount: data.reply_count || replies.length,
          isSolved: !!data.is_solved,
          isPinned: !!data.is_pinned,
          isReported: !!data.is_reported,
          reportReason: data.report_reason,
          replies,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        await storageAdapter.saveDiscussion(mapDiscussionToRecord(discussion));
        return discussion;
      }
    } catch {
      // fallback to local
    }
  }

  const local = await storageAdapter.getDiscussions();
  const found = local.find((d) => d.id === id);
  if (!found || isMockOrSeedDiscussion(found)) return null;
  return mapRecordToDiscussion(found);
}

/**
 * Create a genuine discussion.
 */
export async function createDiscussion(
  input: CreateDiscussionInput,
  accessToken?: string
): Promise<CommunityDiscussion> {
  const title = input.title?.trim();
  const content = input.content?.trim();
  if (!title || !content) {
    throw new Error('Discussion title and content are required.');
  }

  const id = `disc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const safeUserId = isValidUuid(input.userId) ? input.userId : null;

  const discussion: CommunityDiscussion = {
    id,
    userId: safeUserId,
    authorName: input.authorName?.trim() || 'Scholar',
    authorAvatar: input.authorAvatar || '/avatars/default-avatar.svg',
    courseId: input.courseId || null,
    lessonId: input.lessonId || null,
    domain: input.domain || 'General',
    title,
    content,
    tags: Array.isArray(input.tags) && input.tags.length > 0 ? input.tags : [input.domain || 'General'],
    upvotes: 0,
    upvoterUserIds: [],
    replyCount: 0,
    isSolved: false,
    isPinned: false,
    isReported: false,
    reportReason: null,
    replies: [],
    createdAt: now,
    updatedAt: now,
  };

  // Persist locally
  await storageAdapter.saveDiscussion(mapDiscussionToRecord(discussion));

  // Persist to Supabase if available
  if (isSupabaseConfigured) {
    try {
      const client = accessToken ? getAuthenticatedSupabaseClient(accessToken) : supabase;
      await client.from('community_discussions').insert({
        id: discussion.id,
        user_id: safeUserId,
        author_name: discussion.authorName,
        author_avatar: discussion.authorAvatar,
        course_id: discussion.courseId,
        lesson_id: discussion.lessonId,
        domain: discussion.domain,
        title: discussion.title,
        content: discussion.content,
        tags: discussion.tags,
        upvotes: 0,
        upvoter_user_ids: [],
        reply_count: 0,
        is_solved: false,
        is_pinned: false,
        is_reported: false,
        report_reason: null,
        created_at: now,
        updated_at: now,
      });
    } catch (err) {
      console.warn('[CommunityService] Supabase insert warning (offline/schema fallback):', err);
    }
  }

  return discussion;
}

/**
 * Toggle upvote on a discussion (deduplicates votes by user ID).
 */
export async function toggleDiscussionUpvote(
  id: string,
  userId: string,
  accessToken?: string
): Promise<CommunityDiscussion | null> {
  if (!id || !userId) return null;

  const updatedRec = await storageAdapter.toggleDiscussionUpvote(id, userId);
  if (!updatedRec) return null;

  const updated = mapRecordToDiscussion(updatedRec);

  if (isSupabaseConfigured) {
    try {
      const client = accessToken ? getAuthenticatedSupabaseClient(accessToken) : supabase;
      await client
        .from('community_discussions')
        .update({
          upvotes: updated.upvotes,
          upvoter_user_ids: updated.upvoterUserIds,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
    } catch (err) {
      console.warn('[CommunityService] Supabase upvote update error:', err);
    }
  }

  return updated;
}

/**
 * Add a reply to a discussion.
 */
export async function addReply(
  input: CreateReplyInput,
  accessToken?: string
): Promise<CommunityReply | null> {
  const content = input.content?.trim();
  if (!input.discussionId || !content) {
    throw new Error('Discussion ID and content are required.');
  }

  const replyId = `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  const safeUserId = isValidUuid(input.userId) ? input.userId : null;

  const newReply: CommunityReply = {
    id: replyId,
    discussionId: input.discussionId,
    userId: safeUserId,
    authorName: input.authorName?.trim() || 'Scholar',
    authorAvatar: input.authorAvatar || '/avatars/default-avatar.svg',
    content,
    upvotes: 0,
    upvoterUserIds: [],
    isAcceptedAnswer: false,
    createdAt: now,
    updatedAt: now,
  };

  // Persist locally
  await storageAdapter.addDiscussionReply(input.discussionId, {
    id: newReply.id,
    userId: newReply.userId,
    authorName: newReply.authorName,
    authorAvatar: newReply.authorAvatar,
    content: newReply.content,
    upvotes: 0,
    upvoterUserIds: [],
    isAcceptedAnswer: false,
    createdAt: now,
  });

  // Persist to Supabase if available
  if (isSupabaseConfigured) {
    try {
      const client = accessToken ? getAuthenticatedSupabaseClient(accessToken) : supabase;
      await client.from('community_replies').insert({
        id: newReply.id,
        discussion_id: newReply.discussionId,
        user_id: safeUserId,
        author_name: newReply.authorName,
        author_avatar: newReply.authorAvatar,
        content: newReply.content,
        upvotes: 0,
        upvoter_user_ids: [],
        is_accepted_answer: false,
        created_at: now,
        updated_at: now,
      });

      // Increment reply_count on parent
      const parent = await storageAdapter.getDiscussions().then((l) => l.find((d) => d.id === input.discussionId));
      if (parent) {
        await client
          .from('community_discussions')
          .update({
            reply_count: parent.replies?.length || 1,
            updated_at: now,
          })
          .eq('id', input.discussionId);
      }
    } catch (err) {
      console.warn('[CommunityService] Supabase reply insert warning:', err);
    }
  }

  return newReply;
}

/**
 * Toggle upvote on a reply.
 */
export async function toggleReplyUpvote(
  discussionId: string,
  replyId: string,
  userId: string,
  accessToken?: string
): Promise<CommunityDiscussion | null> {
  if (!discussionId || !replyId || !userId) return null;

  const updatedRec = await storageAdapter.toggleReplyUpvote(discussionId, replyId, userId);
  if (!updatedRec) return null;

  const updated = mapRecordToDiscussion(updatedRec);
  const targetReply = updated.replies?.find((r) => r.id === replyId);

  if (isSupabaseConfigured && targetReply) {
    try {
      const client = accessToken ? getAuthenticatedSupabaseClient(accessToken) : supabase;
      await client
        .from('community_replies')
        .update({
          upvotes: targetReply.upvotes,
          upvoter_user_ids: targetReply.upvoterUserIds,
          updated_at: new Date().toISOString(),
        })
        .eq('id', replyId);
    } catch (err) {
      console.warn('[CommunityService] Supabase reply upvote error:', err);
    }
  }

  return updated;
}

/**
 * Toggle accepted answer / solved status on a discussion.
 */
export async function toggleAcceptedAnswer(
  discussionId: string,
  replyId?: string,
  accessToken?: string
): Promise<CommunityDiscussion | null> {
  const disc = await storageAdapter.getDiscussions().then((l) => l.find((d) => d.id === discussionId));
  if (!disc) return null;

  const updatedReplies = replyId
    ? (disc.replies || []).map((r) => ({
        ...r,
        isAcceptedAnswer: r.id === replyId ? !r.isAcceptedAnswer : false,
      }))
    : disc.replies;

  const newSolved = replyId
    ? (updatedReplies?.some((r) => r.isAcceptedAnswer) ?? false)
    : !disc.isSolved;

  const updatedRec = await storageAdapter.updateDiscussion(discussionId, {
    isSolved: newSolved,
    replies: updatedReplies,
  });

  if (!updatedRec) return null;
  const updated = mapRecordToDiscussion(updatedRec);

  if (isSupabaseConfigured) {
    try {
      const client = accessToken ? getAuthenticatedSupabaseClient(accessToken) : supabase;
      await client
        .from('community_discussions')
        .update({
          is_solved: newSolved,
          updated_at: new Date().toISOString(),
        })
        .eq('id', discussionId);

      if (replyId && updatedReplies) {
        for (const rep of updatedReplies) {
          await client
            .from('community_replies')
            .update({
              is_accepted_answer: rep.isAcceptedAnswer,
              updated_at: new Date().toISOString(),
            })
            .eq('id', rep.id);
        }
      }
    } catch (err) {
      console.warn('[CommunityService] Supabase accepted status error:', err);
    }
  }

  return updated;
}

/**
 * Edit a discussion.
 */
export async function updateDiscussion(
  id: string,
  updates: { title?: string; content?: string },
  accessToken?: string
): Promise<CommunityDiscussion | null> {
  const updatedRec = await storageAdapter.updateDiscussion(id, {
    title: updates.title?.trim(),
    content: updates.content?.trim(),
  });

  if (!updatedRec) return null;
  const updated = mapRecordToDiscussion(updatedRec);

  if (isSupabaseConfigured) {
    try {
      const client = accessToken ? getAuthenticatedSupabaseClient(accessToken) : supabase;
      await client
        .from('community_discussions')
        .update({
          ...(updates.title ? { title: updates.title.trim() } : {}),
          ...(updates.content ? { content: updates.content.trim() } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
    } catch (err) {
      console.warn('[CommunityService] Supabase update discussion error:', err);
    }
  }

  return updated;
}

/**
 * Delete a discussion and its replies.
 */
export async function deleteDiscussion(
  id: string,
  accessToken?: string
): Promise<boolean> {
  await storageAdapter.deleteDiscussion(id);

  if (isSupabaseConfigured) {
    try {
      const client = accessToken ? getAuthenticatedSupabaseClient(accessToken) : supabase;
      await client.from('community_discussions').delete().eq('id', id);
    } catch (err) {
      console.warn('[CommunityService] Supabase delete discussion error:', err);
    }
  }

  return true;
}

/**
 * Delete a reply.
 */
export async function deleteReply(
  discussionId: string,
  replyId: string,
  accessToken?: string
): Promise<CommunityDiscussion | null> {
  const updatedRec = await storageAdapter.deleteDiscussionReply(discussionId, replyId);

  if (isSupabaseConfigured) {
    try {
      const client = accessToken ? getAuthenticatedSupabaseClient(accessToken) : supabase;
      await client.from('community_replies').delete().eq('id', replyId);
      if (updatedRec) {
        await client
          .from('community_discussions')
          .update({
            reply_count: updatedRec.replyCount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', discussionId);
      }
    } catch (err) {
      console.warn('[CommunityService] Supabase delete reply error:', err);
    }
  }

  return updatedRec ? mapRecordToDiscussion(updatedRec) : null;
}

/**
 * Report inappropriate content.
 */
export async function reportDiscussion(
  id: string,
  reason: string,
  accessToken?: string
): Promise<boolean> {
  await storageAdapter.reportDiscussion(id, reason);

  if (isSupabaseConfigured) {
    try {
      const client = accessToken ? getAuthenticatedSupabaseClient(accessToken) : supabase;
      await client
        .from('community_discussions')
        .update({
          is_reported: true,
          report_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
    } catch (err) {
      console.warn('[CommunityService] Supabase report error:', err);
    }
  }

  return true;
}
