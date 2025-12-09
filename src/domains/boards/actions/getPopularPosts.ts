'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';

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
  author_icon_id?: number | null;
  author_icon_url?: string | null;
  created_at: string;
  formattedDate?: string;
  team_id?: string | number | null;
  league_id?: string | number | null;
}

/**
 * 게시판의 모든 하위 게시판 ID를 재귀적으로 가져오는 함수
 */
async function getAllChildBoardIds(supabase: any, boardId: string): Promise<string[]> {
  const boardIds = [boardId];

  // 직접 하위 게시판 가져오기
  const { data: childBoards } = await supabase
    .from('boards')
    .select('id')
    .eq('parent_id', boardId);

  if (childBoards && childBoards.length > 0) {
    for (const child of childBoards) {
      // 재귀적으로 하위의 하위 게시판도 가져오기
      const subChildIds = await getAllChildBoardIds(supabase, child.id);
      boardIds.push(...subChildIds);
    }
  }

  return boardIds;
}

/**
 * 게시판별 인기 게시글 조회 (하위 게시판 포함)
 */
export async function getBoardPopularPosts(boardId: string) {
  const supabase = await getSupabaseServer();
  const now = new Date();

  // 오늘 00:00:00
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 이번주 월요일 00:00:00
  const weekStart = new Date(now);
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 월요일 기준
  weekStart.setDate(now.getDate() - diff);
  weekStart.setHours(0, 0, 0, 0);

  // 현재 게시판과 모든 하위 게시판 ID 가져오기
  const allBoardIds = await getAllChildBoardIds(supabase, boardId);

  // 오늘 BEST (좋아요 기준) - 현재 게시판 + 모든 하위 게시판
  const { data: todayPosts, error: todayError } = await supabase
    .from('posts')
    .select(`
      id,
      title,
      post_number,
      likes,
      views,
      created_at,
      boards!inner(slug, name, team_id, league_id),
      profiles!inner(id, nickname, level, icon_id)
    `)
    .in('board_id', allBoardIds)
    .eq('is_deleted', false)
    .eq('is_hidden', false)
    .gte('created_at', todayStart.toISOString())
    .order('likes', { ascending: false })
    .limit(4);

  // 이번주 BEST - 현재 게시판 + 모든 하위 게시판
  const { data: weekPosts, error: weekError } = await supabase
    .from('posts')
    .select(`
      id,
      title,
      post_number,
      likes,
      views,
      created_at,
      boards!inner(slug, name, team_id, league_id),
      profiles!inner(id, nickname, level, icon_id)
    `)
    .in('board_id', allBoardIds)
    .eq('is_deleted', false)
    .eq('is_hidden', false)
    .gte('created_at', weekStart.toISOString())
    .order('likes', { ascending: false })
    .limit(4);

  if (todayError || weekError) {
    console.error('Popular posts fetch error:', todayError || weekError);
    return {
      todayPosts: [],
      weekPosts: []
    };
  }

  // 댓글 수 계산
  const allPosts = [...(todayPosts || []), ...(weekPosts || [])];
  const postIds = allPosts.map(post => post.id);

  const commentCounts: Record<string, number> = {};

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
          commentCounts[comment.post_id] = (commentCounts[comment.post_id] || 0) + 1;
        }
      });
    }
  }

  // 사용자 아이콘 URL 가져오기
  const userIconMap: Record<number, string> = {};
  const iconIds = allPosts
    .map(post => post.profiles?.icon_id)
    .filter(Boolean) as number[];

  if (iconIds.length > 0) {
    const { data: iconsData } = await supabase
      .from('user_icons')
      .select(`
        id,
        shop_items (
          image_url
        )
      `)
      .in('id', iconIds.map(String));

    if (iconsData) {
      iconsData.forEach((icon: any) => {
        if (icon.id && icon.shop_items?.image_url) {
          userIconMap[Number(icon.id)] = icon.shop_items.image_url;
        }
      });
    }
  }

  // 데이터 정규화
  const formatPosts = (posts: any[]): PopularPost[] => {
    return posts.map(post => {
      const createdAt = new Date(post.created_at);
      const formattedDate = `${String(createdAt.getMonth() + 1).padStart(2, '0')}-${String(createdAt.getDate()).padStart(2, '0')}`;

      const iconId = post.profiles?.icon_id;
      const iconUrl = iconId ? userIconMap[iconId] : null;

      return {
        id: post.id,
        title: post.title,
        board_slug: post.boards.slug,
        board_name: post.boards.name,
        post_number: post.post_number,
        likes: post.likes || 0,
        views: post.views || 0,
        comment_count: commentCounts[post.id] || 0,
        author_nickname: post.profiles.nickname,
        author_id: post.profiles.id,
        author_level: post.profiles.level,
        author_icon_id: iconId,
        author_icon_url: iconUrl,
        created_at: post.created_at,
        formattedDate: formattedDate,
        team_id: post.boards.team_id,
        league_id: post.boards.league_id
      };
    });
  };

  return {
    todayPosts: formatPosts(todayPosts || []),
    weekPosts: formatPosts(weekPosts || [])
  };
}
