'use server';

import { createClient } from '@supabase/supabase-js';

// Server Action용 Supabase 클라이언트 생성
function createSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
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

/**
 * HOT 게시글 점수 계산
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

  const rawScore = views * 1 + likes * 10 + comments * 20;
  const hotScore = rawScore * timeDecay;

  return hotScore;
}

/**
 * HOT 게시글 체크 및 알림 발송
 * 주기적으로 실행 (Vercel Cron 또는 수동 호출)
 */
export async function checkHotPosts() {
  try {
    const supabase = createSupabaseClient();

    // 슬라이딩 윈도우: 고정 7일
    const windowDays = 7;
    const windowStart = new Date(
      Date.now() - windowDays * 24 * 60 * 60 * 1000
    ).toISOString();

    // Step 1: 윈도우 내 모든 게시글 가져오기
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select(
        `
        id,
        title,
        created_at,
        board_id,
        views,
        likes,
        post_number,
        user_id,
        is_hidden,
        is_deleted
      `
      )
      .gte('created_at', windowStart)
      .eq('is_deleted', false)
      .eq('is_hidden', false)
      .limit(100);

    if (postsError || !postsData || postsData.length === 0) {
      return {
        success: true,
        message: 'No posts found',
        processed: 0,
      };
    }

    // Step 2: 게시판 정보 가져오기
    const boardIds = [
      ...new Set(postsData.map((post: { board_id: string }) => post.board_id).filter(Boolean)),
    ];

    const { data: boardsData } = await supabase
      .from('boards')
      .select('id, slug')
      .in('id', boardIds);

    const boardMap: Record<string, string> = {};
    (boardsData || []).forEach((board: { id: string; slug: string }) => {
      if (board && board.id) {
        boardMap[board.id] = board.slug || board.id;
      }
    });

    // Step 3: 댓글 수 구하기
    const commentCounts: Record<string, number> = {};
    const postIds = postsData.map((post: { id: string }) => post.id);

    if (postIds.length > 0) {
      const { data: commentsData } = await supabase
        .from('comments')
        .select('post_id')
        .in('post_id', postIds)
        .neq('is_hidden', true)
        .neq('is_deleted', true);

      if (commentsData) {
        commentsData.forEach((comment: { post_id: string | null }) => {
          if (comment.post_id) {
            commentCounts[comment.post_id] =
              (commentCounts[comment.post_id] || 0) + 1;
          }
        });
      }

      postsData.forEach((post: { id: string }) => {
        if (!(post.id in commentCounts)) {
          commentCounts[post.id] = 0;
        }
      });
    }

    // Step 4: HOT 점수 계산 및 정렬
    const scoredPosts = postsData
      .map((post: {
        id: string;
        title: string;
        board_id: string;
        post_number: number;
        user_id: string;
        views: number;
        likes: number;
        created_at: string;
      }) => {
        const views = post.views || 0;
        const likes = post.likes || 0;
        const comments = commentCounts[post.id] || 0;

        const hotScore = calculateHotScore(
          views,
          likes,
          comments,
          post.created_at,
          windowDays
        );

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
          hot_score: hotScore,
          hot_rank: 0, // Will be assigned after sorting
        };
      })
      .sort((a: HotPost, b: HotPost) => b.hot_score - a.hot_score)
      .slice(0, 20); // 상위 20개만

    // HOT 순위 할당
    scoredPosts.forEach((post: HotPost, index: number) => {
      post.hot_rank = index + 1;
    });

    // Step 5: 이미 알림 보낸 게시글 확인 (최근 24시간 내)
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
        .filter((n: { metadata: { post_id?: string } }) => n.metadata?.post_id)
        .map((n: { metadata: { post_id: string } }) => n.metadata.post_id)
    );

    // Step 6: 상위 10위 이내 게시글에 대해 알림 발송 (아직 알림 안 보낸 것만)
    const notificationsToSend: HotPost[] = scoredPosts
      .filter((post: HotPost) => post.hot_rank <= 10 && !notifiedPostIds.has(post.id))
      .filter((post: HotPost) => post.user_id); // user_id가 있는 것만

    let successCount = 0;
    let failCount = 0;

    for (const post of notificationsToSend) {
      try {
        const { error } = await supabase.from('notifications').insert({
          user_id: post.user_id,
          actor_id: null,
          type: 'hot_post',
          title: `🔥 내 게시글이 HOT 게시글 ${post.hot_rank}위에 진입했어요!`,
          message:
            post.title.length > 50
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
          console.error(
            `Failed to send notification for post ${post.id}:`,
            error
          );
          failCount++;
        } else {
          successCount++;
        }
      } catch (err) {
        console.error(`Error sending notification for post ${post.id}:`, err);
        failCount++;
      }
    }

    return {
      success: true,
      message: 'HOT post notifications processed',
      totalHotPosts: scoredPosts.length,
      notificationsSent: successCount,
      notificationsFailed: failCount,
      topPosts: scoredPosts.slice(0, 5).map((p: HotPost) => ({
        rank: p.hot_rank,
        title: p.title,
        score: p.hot_score.toFixed(2),
      })),
    };
  } catch (error) {
    console.error('Error in checkHotPosts:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
