import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * HOT 점수 계산 함수
 *
 * @param views 조회수
 * @param likes 좋아요 수
 * @param comments 댓글 수
 * @param createdAt 게시글 작성 시간
 * @param windowDays 슬라이딩 윈도우 기간 (일)
 * @returns HOT 점수
 */
function calculateHotScore(
  views: number,
  likes: number,
  comments: number,
  createdAt: string,
  windowDays: number
): number {
  const now = Date.now();
  const postTime = new Date(createdAt).getTime();
  const hoursSince = (now - postTime) / (1000 * 60 * 60);
  const maxHours = windowDays * 24;
  const timeDecay = Math.max(0, 1 - hoursSince / maxHours);

  // 기본 점수: 조회수 × 1 + 좋아요 × 10 + 댓글 × 20
  const rawScore = views * 1 + likes * 10 + comments * 20;

  // 시간 감쇠 적용
  return rawScore * timeDecay;
}

interface HotPost {
  id: string;
  title: string;
  board_id: string;
  board_slug: string;
  post_number: number;
  user_id: string;
  views: number;
  likes: number;
  comment_count: number;
  hot_score: number;
  hot_rank: number;
}

serve(async (req) => {
  try {
    // Supabase 클라이언트 생성 (Service Role Key 사용)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[HOT Posts] Starting check...');

    // 슬라이딩 윈도우: 최근 7일
    const windowDays = 7;
    const windowStart = new Date(
      Date.now() - windowDays * 24 * 60 * 60 * 1000
    ).toISOString();

    // 1. 최근 7일 게시글 조회
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select('id, title, created_at, board_id, views, likes, post_number, user_id, is_hidden, is_deleted')
      .gte('created_at', windowStart)
      .eq('is_deleted', false)
      .eq('is_hidden', false)
      .limit(100);

    if (postsError) {
      console.error('[HOT Posts] Posts error:', postsError);
      throw postsError;
    }

    if (!postsData || postsData.length === 0) {
      console.log('[HOT Posts] No posts found');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No posts found',
          processed: 0,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log(`[HOT Posts] Found ${postsData.length} posts`);

    // 2. 게시판 정보 조회
    const boardIds = [...new Set(postsData.map(p => p.board_id).filter(Boolean))];
    const { data: boardsData } = await supabase
      .from('boards')
      .select('id, slug')
      .in('id', boardIds);

    const boardMap: Record<string, string> = {};
    (boardsData || []).forEach(board => {
      if (board?.id) {
        boardMap[board.id] = board.slug || board.id;
      }
    });

    // 3. 댓글 수 집계
    const commentCounts: Record<string, number> = {};
    const postIds = postsData.map(p => p.id);

    if (postIds.length > 0) {
      const { data: commentsData } = await supabase
        .from('comments')
        .select('post_id')
        .in('post_id', postIds)
        .neq('is_hidden', true)
        .neq('is_deleted', true);

      if (commentsData) {
        commentsData.forEach(comment => {
          if (comment.post_id) {
            commentCounts[comment.post_id] = (commentCounts[comment.post_id] || 0) + 1;
          }
        });
      }
    }

    // 4. HOT 점수 계산 및 정렬
    const scoredPosts: HotPost[] = postsData
      .map(post => {
        const views = post.views || 0;
        const likes = post.likes || 0;
        const comments = commentCounts[post.id] || 0;

        return {
          id: post.id,
          title: post.title || '',
          board_id: post.board_id || '',
          board_slug: boardMap[post.board_id || ''] || '',
          post_number: post.post_number || 0,
          user_id: post.user_id || '',
          views,
          likes,
          comment_count: comments,
          hot_score: calculateHotScore(
            views,
            likes,
            comments,
            post.created_at,
            windowDays
          ),
          hot_rank: 0,
        };
      })
      .sort((a, b) => b.hot_score - a.hot_score)
      .slice(0, 20);

    // HOT 순위 할당
    scoredPosts.forEach((post, index) => {
      post.hot_rank = index + 1;
    });

    console.log(`[HOT Posts] Calculated scores for ${scoredPosts.length} posts`);

    // 5. 이미 알림 보낸 게시글 확인 (최근 24시간 내)
    const recentNotificationCheck = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: existingNotifications } = await supabase
      .from('notifications')
      .select('metadata')
      .eq('type', 'hot_post')
      .gte('created_at', recentNotificationCheck);

    const notifiedPostIds = new Set(
      (existingNotifications || [])
        .filter(n => n.metadata?.post_id)
        .map(n => n.metadata.post_id)
    );

    console.log(`[HOT Posts] ${notifiedPostIds.size} posts already notified in last 24h`);

    // 6. 상위 10위 이내 게시글에 알림 발송 (아직 알림 안 보낸 것만)
    const notificationsToSend = scoredPosts
      .filter(post => post.hot_rank <= 10 && !notifiedPostIds.has(post.id))
      .filter(post => post.user_id);

    console.log(`[HOT Posts] ${notificationsToSend.length} notifications to send`);

    let successCount = 0;
    let failCount = 0;

    for (const post of notificationsToSend) {
      try {
        const { error } = await supabase.from('notifications').insert({
          user_id: post.user_id,
          actor_id: null,
          type: 'hot_post',
          title: `🔥 내 게시글이 HOT 게시글 ${post.hot_rank}위에 진입했어요!`,
          message: post.title.length > 50
            ? post.title.substring(0, 50) + '...'
            : post.title,
          link: `/boards/${post.board_slug}/${post.post_number}`,
          metadata: {
            post_id: post.id,
            post_title: post.title,
            post_number: post.post_number,
            board_slug: post.board_slug,
            hot_rank: post.hot_rank,
            hot_score: post.hot_score,
          },
        });

        if (error) {
          console.error(`[HOT Posts] Failed to notify for post ${post.id}:`, error);
          failCount++;
        } else {
          console.log(`[HOT Posts] Notified user for post ${post.id} (Rank #${post.hot_rank})`);
          successCount++;
        }
      } catch (err) {
        console.error(`[HOT Posts] Error notifying for post ${post.id}:`, err);
        failCount++;
      }
    }

    const result = {
      success: true,
      message: 'HOT post notifications processed',
      totalHotPosts: scoredPosts.length,
      notificationsSent: successCount,
      notificationsFailed: failCount,
      topPosts: scoredPosts.slice(0, 5).map(p => ({
        rank: p.hot_rank,
        title: p.title,
        score: p.hot_score.toFixed(2),
      })),
    };

    console.log('[HOT Posts] Result:', JSON.stringify(result));

    return new Response(
      JSON.stringify(result),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('[HOT Posts] Fatal error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
