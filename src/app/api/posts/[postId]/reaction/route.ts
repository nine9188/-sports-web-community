import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { revalidatePostListCaches } from '@/domains/boards/actions/posts/cacheInvalidation';
import { oneOrNull } from '@/shared/utils/supabaseRelations';
import { getSupabaseAdmin, getSupabaseRouteHandler } from '@/shared/lib/supabase/server';

const POST_REACTION_VISITOR_COOKIE = 'post_reaction_visitor_id';
const POST_REACTION_VISITOR_MAX_AGE = 60 * 60 * 24 * 180;

type ReactionType = 'like' | 'dislike';

interface ReactionResponse {
  success?: boolean;
  likes?: number;
  dislikes?: number;
  userAction?: ReactionType | null;
  error?: string;
}

function hashValue(value: string | null): string | null {
  if (!value) return null;

  const salt = process.env.POST_REACTION_HASH_SECRET
    || process.env.POLL_HASH_SECRET
    || process.env.NEXTAUTH_SECRET
    || process.env.SUPABASE_SERVICE_ROLE_KEY
    || 'post-reaction';

  return crypto.createHash('sha256').update(`${salt}:${value}`).digest('hex');
}

function getClientIp(request: NextRequest): string | null {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  return forwardedFor?.split(',')[0]?.trim() || realIp || null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  const body = await request.json().catch(() => null) as { type?: ReactionType } | null;
  const reactionType = body?.type;

  if (!postId || (reactionType !== 'like' && reactionType !== 'dislike')) {
    return NextResponse.json({ success: false, error: '추천 정보를 확인할 수 없습니다.' }, { status: 400 });
  }

  const { supabase } = await getSupabaseRouteHandler(request);
  const { data: { user } } = await supabase.auth.getUser();

  const existingVisitorId = request.cookies.get(POST_REACTION_VISITOR_COOKIE)?.value;
  const visitorId = existingVisitorId || crypto.randomUUID();
  const ipHash = hashValue(getClientIp(request));
  const userAgentHash = hashValue(request.headers.get('user-agent'));

  const supabaseAdmin = getSupabaseAdmin();
  const supabaseRpc = supabaseAdmin as unknown as {
    rpc: (name: string, args: Record<string, unknown>) => Promise<{
      data: ReactionResponse | null;
      error: { message: string } | null;
    }>;
  };

  const { data, error } = await supabaseRpc.rpc('toggle_post_reaction', {
    p_post_id: postId,
    p_reaction_type: reactionType,
    p_user_id: user?.id ?? null,
    p_visitor_id: user ? null : visitorId,
    p_ip_hash: ipHash,
    p_user_agent_hash: userAgentHash,
  });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  if (!data?.success) {
    return NextResponse.json({ success: false, error: data?.error || '추천 처리에 실패했습니다.' }, { status: 400 });
  }

  // 캐시 무효화 (상세 페이지 캐시 + 목록/인기글 캐시)
  const { data: postInfo } = await supabaseAdmin
    .from('posts')
    .select('board_id, post_number, board:boards(slug)')
    .eq('id', postId)
    .single();

  if (postInfo) {
    revalidateTag(`post-${postInfo.board_id}-${postInfo.post_number}`, 'default');
    const boardSlug = oneOrNull(postInfo.board)?.slug;
    revalidatePostListCaches(boardSlug);
  }

  const response = NextResponse.json({
    success: true,
    likes: data.likes ?? 0,
    dislikes: data.dislikes ?? 0,
    userAction: data.userAction ?? null,
  });

  if (!user && !existingVisitorId) {
    response.cookies.set(POST_REACTION_VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: POST_REACTION_VISITOR_MAX_AGE,
    });
  }

  return response;
}
