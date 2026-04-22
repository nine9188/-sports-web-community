'use server';

import { getSupabaseAdmin } from '@/shared/lib/supabase/server';
import { createHotPostNotification } from './create';

type RecentPost = { id: string; views: number | null; likes: number | null; created_at: string };
type CommentRow = { post_id: string | null };
type ScoredPost = { id: string; score: number };

const WINDOW_DAYS = 7;
const HOT_TOP_N = 10;

/**
 * HOT 점수 계산 (getAllTopicPosts와 동일 공식)
 */
function calculateHotScore(
  views: number,
  likes: number,
  comments: number,
  createdAt: string
): number {
  const now = Date.now();
  const postTime = new Date(createdAt).getTime();
  const hoursSince = (now - postTime) / (1000 * 60 * 60);
  const maxHours = WINDOW_DAYS * 24;
  const timeDecay = Math.max(0, 1 - hoursSince / maxHours);

  const rawScore = (views * 1) + (likes * 10) + (comments * 20);
  return rawScore * timeDecay;
}

/**
 * 게시글이 HOT 상위 10위에 진입했는지 체크하고 알림 발송
 * - 좋아요/댓글 발생 시 호출
 * - 이미 24시간 내 알림 보냈으면 스킵
 */
export async function checkHotPostEntry(postId: string): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();

    // 1. 해당 게시글 정보 조회
    const { data: post } = await supabase
      .from('posts')
      .select('id, title, views, likes, created_at, user_id, post_number, board_id, is_hidden, is_deleted')
      .eq('id', postId)
      .single();

    if (!post || post.is_hidden || post.is_deleted || !post.user_id) return;

    // 7일 이내 게시글만
    const windowStart = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);
    if (new Date(post.created_at) < windowStart) return;

    // 2. 해당 게시글의 댓글 수
    const { count: commentCount } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    const myScore = calculateHotScore(
      post.views || 0,
      post.likes || 0,
      commentCount || 0,
      post.created_at
    );

    // 점수가 0이면 스킵
    if (myScore <= 0) return;

    // 3. 최근 7일 게시글 중 상위 N개의 최저 점수 확인 (경량 쿼리)
    const { data: recentPosts } = await supabase
      .from('posts')
      .select('id, views, likes, created_at')
      .gte('created_at', windowStart.toISOString())
      .eq('is_deleted', false)
      .eq('is_hidden', false)
      .order('views', { ascending: false })
      .limit(50);

    if (!recentPosts) return;

    // 댓글 수 배치 조회
    const postIds = (recentPosts as RecentPost[]).map((p: RecentPost) => p.id);
    const { data: commentsData } = await supabase
      .from('comments')
      .select('post_id')
      .in('post_id', postIds);

    const commentCounts: Record<string, number> = {};
    if (commentsData) {
      (commentsData as CommentRow[]).forEach((c: CommentRow) => {
        if (c.post_id) {
          commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1;
        }
      });
    }

    // 모든 게시글 점수 계산 후 정렬
    const scored: ScoredPost[] = (recentPosts as RecentPost[])
      .map((p: RecentPost) => ({
        id: p.id,
        score: calculateHotScore(
          p.views || 0,
          p.likes || 0,
          commentCounts[p.id] || 0,
          p.created_at
        )
      }))
      .sort((a: ScoredPost, b: ScoredPost) => b.score - a.score);

    // 4. 현재 게시글의 순위 확인
    const rank = scored.findIndex((s: ScoredPost) => s.id === postId) + 1;
    if (rank === 0 || rank > HOT_TOP_N) return;

    // 5. 24시간 내 이미 알림 보냈는지 확인
    const recentCheck = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('type', 'hot_post')
      .eq('user_id', post.user_id)
      .gte('created_at', recentCheck)
      .filter('metadata->>post_id', 'eq', postId)
      .limit(1);

    if (existing && existing.length > 0) return;

    // 6. 게시판 slug 조회
    const { data: board } = await supabase
      .from('boards')
      .select('slug')
      .eq('id', post.board_id)
      .single();

    // 7. 알림 발송
    await createHotPostNotification({
      userId: post.user_id,
      postId: post.id,
      postTitle: post.title,
      boardSlug: board?.slug || '',
      postNumber: post.post_number,
      hotRank: rank,
      hotScore: myScore
    });

  } catch (error) {
    console.error('[checkHotPostEntry] 오류:', error);
    // 알림 실패해도 메인 로직에 영향 없음
  }
}
