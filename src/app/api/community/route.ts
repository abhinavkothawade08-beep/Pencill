import { NextRequest, NextResponse } from 'next/server';
import {
  getDiscussions,
  createDiscussion,
  toggleDiscussionUpvote,
  addReply,
  toggleReplyUpvote,
  toggleAcceptedAnswer,
  updateDiscussion,
  deleteDiscussion,
  deleteReply,
  reportDiscussion,
} from '@/services/supabase/communityService';
import { getAuthenticatedSupabaseClient } from '@/services/supabase/client';

export const dynamic = 'force-dynamic';

function extractAuthToken(req: NextRequest): string | undefined {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.split('Bearer ')[1]?.trim();
  }
  return undefined;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get('domain') || 'all';
    const status = (searchParams.get('status') as any) || 'all';
    const searchQuery = searchParams.get('search') || searchParams.get('q') || '';
    const sortBy = (searchParams.get('sortBy') as any) || 'recent';
    const currentUserId = searchParams.get('userId') || undefined;

    const token = extractAuthToken(req);
    const discussions = await getDiscussions(
      {
        domain,
        status,
        searchQuery,
        sortBy,
        currentUserId,
      },
      token
    );

    return NextResponse.json({
      success: true,
      data: discussions,
      total: discussions.length,
    });
  } catch (error: any) {
    console.error('[API /api/community GET] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch discussions',
        data: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = extractAuthToken(req);

    let authUserId: string | null = null;
    let authUserName: string | null = null;

    if (token) {
      try {
        const client = getAuthenticatedSupabaseClient(token);
        const { data } = await client.auth.getUser();
        if (data?.user?.id) {
          authUserId = data.user.id;
          authUserName = data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || null;
        }
      } catch {
        // guest mode
      }
    }

    const { title, content, domain, tags, authorName, authorAvatar, courseId, lessonId } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: 'Validation Error: Title and content are required.' },
        { status: 400 }
      );
    }

    const created = await createDiscussion(
      {
        title,
        content,
        domain: domain || 'General',
        tags: Array.isArray(tags) ? tags : [],
        userId: authUserId || body.userId || null,
        authorName: authUserName || authorName || 'Scholar',
        authorAvatar: authorAvatar || '/avatars/default-avatar.svg',
        courseId,
        lessonId,
      },
      token
    );

    return NextResponse.json({
      success: true,
      data: created,
    });
  } catch (error: any) {
    console.error('[API /api/community POST] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create discussion.' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const token = extractAuthToken(req);
    const { action, discussionId, replyId, userId, reason, updates } = body;

    if (!discussionId) {
      return NextResponse.json(
        { success: false, error: 'Discussion ID is required.' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'upvote': {
        if (!userId) {
          return NextResponse.json({ success: false, error: 'User ID is required for voting.' }, { status: 400 });
        }
        const updated = await toggleDiscussionUpvote(discussionId, userId, token);
        return NextResponse.json({ success: true, data: updated });
      }

      case 'reply': {
        const { content, authorName, authorAvatar } = body;
        if (!content) {
          return NextResponse.json({ success: false, error: 'Reply content is required.' }, { status: 400 });
        }
        const reply = await addReply(
          {
            discussionId,
            content,
            userId,
            authorName,
            authorAvatar,
          },
          token
        );
        return NextResponse.json({ success: true, data: reply });
      }

      case 'reply_upvote': {
        if (!replyId || !userId) {
          return NextResponse.json({ success: false, error: 'Reply ID and User ID are required.' }, { status: 400 });
        }
        const updated = await toggleReplyUpvote(discussionId, replyId, userId, token);
        return NextResponse.json({ success: true, data: updated });
      }

      case 'toggle_solved': {
        const updated = await toggleAcceptedAnswer(discussionId, replyId, token);
        return NextResponse.json({ success: true, data: updated });
      }

      case 'edit': {
        if (!updates?.title && !updates?.content) {
          return NextResponse.json({ success: false, error: 'Updates must include title or content.' }, { status: 400 });
        }
        const updated = await updateDiscussion(discussionId, updates, token);
        return NextResponse.json({ success: true, data: updated });
      }

      case 'report': {
        if (!reason) {
          return NextResponse.json({ success: false, error: 'Report reason is required.' }, { status: 400 });
        }
        await reportDiscussion(discussionId, reason, token);
        return NextResponse.json({ success: true, message: 'Discussion flagged for academic moderation.' });
      }

      default:
        return NextResponse.json({ success: false, error: `Unsupported action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[API /api/community PATCH] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Operation failed.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const discussionId = searchParams.get('discussionId');
    const replyId = searchParams.get('replyId');
    const token = extractAuthToken(req);

    if (!discussionId) {
      return NextResponse.json({ success: false, error: 'Discussion ID is required.' }, { status: 400 });
    }

    if (replyId) {
      const updated = await deleteReply(discussionId, replyId, token);
      return NextResponse.json({ success: true, data: updated });
    } else {
      await deleteDiscussion(discussionId, token);
      return NextResponse.json({ success: true, message: 'Discussion permanently deleted.' });
    }
  } catch (error: any) {
    console.error('[API /api/community DELETE] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Deletion failed.' },
      { status: 500 }
    );
  }
}
