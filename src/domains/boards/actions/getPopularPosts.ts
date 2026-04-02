'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import type { DealInfo } from '../types/hotdeal';
import { getCachedChildBoardIds } from './getCachedBoards';

export interface PopularPost {
  id: string;
  title: string;
  board_slug: string;
  board_name: string;
  post_number: number;
  likes: number;
  views: number;
  comment_count: number;
  author_nickname: string;
  author_id?: string;
  author_level?: number;
  author_exp?: number;
  author_icon_id?: number | null;
  author_icon_url?: string | null;
  author_public_id?: string | null;
  created_at: string;
  formattedDate?: string;
  team_id?: string | number | null;
  league_id?: string | number | null;
  deal_info?: DealInfo | null;
  content?: string;
}

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
  const supabase = await getSupabaseServer();
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
      content,
      deal_info,
      boards!inner(slug, name, team_id, league_id),
      profiles!left(id, nickname, level, exp, icon_id, public_id)
    `)
    .in('board_id', allBoardIds)
    .eq('is_deleted', false)
    .eq('is_hidden', false)
    .gte('created_at', monthStart.toISOString())
    .order('created_at', { ascending: false })
    .limit(100);

  if (error || !allPosts || allPosts.length === 0) {
    if (error) console.error('Popular posts fetch error:', error);
    return { weekPosts: [], monthPosts: [] };
  }

  // 댓글 수 계산
  const postIds = allPosts.map(post => post.id);
  const commentCounts: Record<string, number> = {};

  if (postIds.length > 0) {
    const { data: commentsData } = await supabase
      .from('comments')
      .select('post_id')
      .in('post_id', postIds)
      .eq('is_hidden', false)
      .eq('is_deleted', false);

    if (commentsData) {
      commentsData.forEach((comment: { post_id: string | null }) => {
        if (comment.post_id) {
          commentCounts[comment.post_id] = (commentCounts[comment.post_id] || 0) + 1;
        }
      });
    }
  }

  // 사용자 아이콘 URL 가져오기
  const userIconMap: Record<number, string> = {};
  const iconIds = [...new Set(
    allPosts.map(post => post.profiles?.icon_id).filter(Boolean)
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
    const createdAt = new Date(post.created_at);
    const formattedDate = `${String(createdAt.getMonth() + 1).padStart(2, '0')}-${String(createdAt.getDate()).padStart(2, '0')}`;

    const iconId = post.profiles?.icon_id;
    const iconUrl = iconId ? userIconMap[iconId] || null : null;

    return {
      id: post.id,
      title: post.title,
      board_slug: post.boards?.slug || '',
      board_name: post.boards?.name || '알 수 없음',
      post_number: post.post_number,
      likes: post.likes || 0,
      views: post.views || 0,
      comment_count: commentCounts[post.id] || 0,
      author_nickname: post.profiles?.nickname || '익명',
      author_id: post.profiles?.id,
      author_level: post.profiles?.level,
      author_exp: post.profiles?.exp || 0,
      author_icon_id: iconId,
      author_icon_url: iconUrl,
      author_public_id: post.profiles?.public_id || null,
      created_at: post.created_at,
      formattedDate,
      team_id: post.boards?.team_id,
      league_id: post.boards?.league_id,
      content: typeof post.content === 'string' ? post.content : JSON.stringify(post.content || ''),
      deal_info: post.deal_info || null
    };
  };

  // 이번주 게시글 필터 + HOT 점수 정렬
  const weekMaxHours = 7 * 24;
  const weekPostsScored = allPosts
    .filter(post => new Date(post.created_at) >= weekStart)
    .map(post => ({
      post,
      hotScore: calculateHotScore(
        post.views || 0, post.likes || 0,
        commentCounts[post.id] || 0,
        post.created_at, nowMs, weekMaxHours
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
        post.created_at, nowMs, monthMaxHours
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
