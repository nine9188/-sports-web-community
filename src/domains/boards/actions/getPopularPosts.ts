'use server';

import { getSupabaseClientNoCookies } from '@/shared/lib/supabase/server';
import { getCachedChildBoardIds } from './getCachedBoards';
import type { PopularPost } from '../types/post';
import type { DealInfo } from '../types/hotdeal/deal-info';
import { oneOrNull } from '@/shared/utils/supabaseRelations';

/**
 * HOT 점수 계산 (사이드바와 동일한 공식)
 * rawScore = (조회수 × 1) + (좋아요 × 10) + (댓글 × 20)
 * hotScore = rawScore × 시간감쇠 (기간 내 선형 감소)
 */
function calculateHotScore(
  views: number,
  likes: number,
  comments: number,
  createdAt: string,
  now: number,
  maxHours: number
): number {
  const postTime = new Date(createdAt).getTime();
  const hoursSince = (now - postTime) / (1000 * 60 * 60);
  const timeDecay = Math.max(0, 1 - (hoursSince / maxHours));

  const rawScore = (views * 1) + (likes * 10) + (comments * 20);
  return rawScore * timeDecay;
}

/**
 * 게시판별 인기 게시글 조회 (하위 게시판 포함, HOT 점수 기반)
 *
 * HOT 점수 = (조회×1 + 좋아요×10 + 댓글×20) × 시간감쇠
 * 사이드바 인기글과 동일한 공식 사용
 */
export async function getBoardPopularPosts(boardId: string) {
  const supabase = getSupabaseClientNoCookies();
  const now = new Date();
  const nowMs = now.getTime();

  // 최근 7일 (롤링)
  const weekStart = new Date(nowMs - 7 * 24 * 60 * 60 * 1000);

  // 최근 30일 (롤링)
  const monthStart = new Date(nowMs - 30 * 24 * 60 * 60 * 1000);

  // 현재 게시판과 모든 하위 게시판 ID 가져오기
  const allBoardIds = await getCachedChildBoardIds(boardId);

  // 이번달 기준으로 한 번만 가져오기 (이번주 데이터는 이번달에 포함)
  const { data: allPosts, error } = await supabase
    .from('posts')
    .select(`
      id,
      title,
      post_number,
      likes,
      views,
      created_at,
      deal_info,
      thumbnail_url,
      boards!inner(slug, name, team_id, league_id),
      profiles!left(id, nickname, level, exp, icon_id, public_id)
    `)
    .in('board_id', allBoardIds)
    .eq('is_deleted', false)
    .eq('is_hidden', false)
    .gte('created_at', monthStart.toISOString())
    .order('likes', { ascending: false })
    .limit(200);

  if (error || !allPosts || allPosts.length === 0) {
    if (error) console.error('Popular posts fetch error:', error);
    return { weekPosts: [], monthPosts: [] };
  }

  // 댓글 수 계산
  const postIds = allPosts.map(post => post.id);
  const commentCounts: Record<string, number> = {};

  if (postIds.length > 0) {
    const { data: commentsData, error } = await (supabase as any)
      .rpc('get_comment_counts', { p_post_ids: postIds });

    if (error) {
      console.error('get_comment_counts error:', error);
    }

    if (commentsData) {
      (commentsData as any[]).forEach((row: any) => {
        if (row.post_id) {
          commentCounts[row.post_id] = Number(row.comment_count);
        }
      });
    }
  }

  // 사용자 아이콘 URL 가져오기
  const userIconMap: Record<number, string> = {};
  const iconIds = [...new Set(
    allPosts.map(post => oneOrNull(post.profiles)?.icon_id).filter(Boolean)
  )] as number[];

  if (iconIds.length > 0) {
    const { data: iconsData } = await supabase
      .from('shop_items')
      .select('id, image_url')
      .in('id', iconIds);

    if (iconsData) {
      iconsData.forEach(icon => {
        if (icon.id && icon.image_url) {
          userIconMap[icon.id] = icon.image_url;
        }
      });
    }
  }

  // 포맷팅 함수
  const formatPost = (post: typeof allPosts[0]): PopularPost => {
    const createdAt = new Date(post.created_at || '');
    const formattedDate = `${String(createdAt.getMonth() + 1).padStart(2, '0')}-${String(createdAt.getDate()).padStart(2, '0')}`;
    const profile = oneOrNull(post.profiles);
    const board = oneOrNull(post.boards);

    const iconId = profile?.icon_id;
    const iconUrl = iconId ? userIconMap[iconId] || null : null;

    return {
      id: post.id,
      title: post.title,
      board_slug: board?.slug || '',
      board_name: board?.name || '알 수 없음',
      post_number: post.post_number,
      likes: post.likes || 0,
      views: post.views || 0,
      comment_count: commentCounts[post.id] || 0,
      author_nickname: profile?.nickname || '익명',
      author_id: profile?.id,
      author_level: profile?.level ?? undefined,
      author_exp: profile?.exp || 0,
      author_icon_id: iconId,
      author_icon_url: iconUrl,
      author_public_id: profile?.public_id || null,
      created_at: post.created_at || '',
      formattedDate,
      team_id: board?.team_id,
      league_id: board?.league_id,
      deal_info: (post.deal_info as unknown as DealInfo) || null,
      thumbnail_url: post.thumbnail_url ?? null,
    };
  };

  // 이번주 게시글 필터 + HOT 점수 정렬
  const weekMaxHours = 7 * 24;
  const weekPostsScored = allPosts
    .filter(post => new Date(post.created_at || '') >= weekStart)
    .map(post => ({
      post,
      hotScore: calculateHotScore(
        post.views || 0, post.likes || 0,
        commentCounts[post.id] || 0,
        post.created_at || '', nowMs, weekMaxHours
      )
    }))
    .sort((a, b) => b.hotScore - a.hotScore)
    .slice(0, 4)
    .map(({ post }) => formatPost(post));

  // 이번달 게시글 HOT 점수 정렬
  const monthMaxHours = 31 * 24;
  const monthPostsScored = allPosts
    .map(post => ({
      post,
      hotScore: calculateHotScore(
        post.views || 0, post.likes || 0,
        commentCounts[post.id] || 0,
        post.created_at || '', nowMs, monthMaxHours
      )
    }))
    .sort((a, b) => b.hotScore - a.hotScore)
    .slice(0, 4)
    .map(({ post }) => formatPost(post));

  return {
    weekPosts: weekPostsScored,
    monthPosts: monthPostsScored
  };
}
