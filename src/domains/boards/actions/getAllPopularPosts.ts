'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { getLevelIconUrl } from '@/shared/utils/level-icons-server';
import { formatDate } from '@/shared/utils/date';

export interface PopularPost {
  id: string;
  title: string;
  board_id: string;
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
  author_public_id?: string | null;
  created_at: string;
  formattedDate: string;
  team_id?: string | number | null;
  league_id?: string | number | null;
  team_logo?: string | null;
  league_logo?: string | null;
  content?: string;
}

export interface PopularPostsResponse {
  data: PopularPost[];
  meta: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
    period: string;
  };
}

type TimePeriod = 'today' | 'week' | 'month' | 'all';

interface GetAllPopularPostsParams {
  period?: TimePeriod;
  page?: number;
  limit?: number;
}

/**
 * 전체 게시판의 인기 게시글 조회
 * @param period - 기간 필터 (today, week, month, all)
 * @param page - 페이지 번호
 * @param limit - 페이지당 게시글 수
 */
export async function getAllPopularPosts({
  period = 'week',
  page = 1,
  limit = 20
}: GetAllPopularPostsParams = {}): Promise<PopularPostsResponse> {
  try {
    const supabase = await getSupabaseServer();
    const now = new Date();
    const offset = (page - 1) * limit;

    // 기간별 시작 날짜 계산
    let startDate: Date;

    switch (period) {
      case 'today':
        // 오늘 00:00:00
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        // 이번주 월요일 00:00:00
        startDate = new Date(now);
        const dayOfWeek = now.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startDate.setDate(now.getDate() - diff);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        // 이번달 1일 00:00:00
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'all':
      default:
        // 1년 전
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // 인기 게시글 쿼리 (좋아요 + 조회수 + 댓글 수 기반)
    let postsQuery = supabase
      .from('posts')
      .select(`
        id,
        title,
        post_number,
        likes,
        views,
        created_at,
        board_id,
        content,
        user_id,
        boards!inner(id, slug, name, team_id, league_id),
        profiles!inner(id, nickname, level, icon_id, public_id)
      `, { count: 'exact' })
      .eq('is_deleted', false)
      .eq('is_hidden', false)
      .gte('created_at', startDate.toISOString())
      .order('likes', { ascending: false });

    // 총 개수 가져오기
    const { count } = await postsQuery;
    const totalItems = count || 0;

    // 실제 데이터 가져오기
    const { data: postsData, error: postsError } = await postsQuery
      .range(offset, offset + limit - 1)
      .limit(limit);

    if (postsError) {
      console.error('인기 게시글 조회 오류:', postsError);
      throw new Error('인기 게시글 조회 실패');
    }

    if (!postsData || postsData.length === 0) {
      return {
        data: [],
        meta: {
          totalItems: 0,
          totalPages: 1,
          currentPage: page,
          itemsPerPage: limit,
          period
        }
      };
    }

    // 댓글 수 계산
    const postIds = postsData.map(post => post.id);
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

    // 팀/리그 로고 가져오기
    const teamIds = postsData
      .map(post => post.boards?.team_id)
      .filter(Boolean) as number[];

    const leagueIds = postsData
      .map(post => post.boards?.league_id)
      .filter(Boolean) as number[];

    const teamLogoMap: Record<string, string> = {};
    const leagueLogoMap: Record<string, string> = {};

    if (teamIds.length > 0) {
      const { data: teamsData } = await supabase
        .from('teams')
        .select('id, logo')
        .in('id', teamIds);

      if (teamsData) {
        teamsData.forEach(team => {
          if (team.id && team.logo) {
            teamLogoMap[team.id] = team.logo;
          }
        });
      }
    }

    if (leagueIds.length > 0) {
      const { data: leaguesData } = await supabase
        .from('leagues')
        .select('id, logo')
        .in('id', leagueIds);

      if (leaguesData) {
        leaguesData.forEach(league => {
          if (league.id && league.logo) {
            leagueLogoMap[league.id] = league.logo;
          }
        });
      }
    }

    // 사용자 아이콘 정보 가져오기
    const userIconMap: Record<number, string> = {};
    const iconIds = postsData
      .map(post => post.profiles?.icon_id)
      .filter(Boolean) as number[];

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

    // 데이터 포맷팅
    const formattedPosts: PopularPost[] = postsData.map(post => {
      const iconId = post.profiles?.icon_id;
      const iconUrl = iconId && userIconMap[iconId]
        ? userIconMap[iconId]
        : getLevelIconUrl(post.profiles?.level || 1);

      const teamLogo = post.boards?.team_id ? teamLogoMap[post.boards.team_id] : null;
      const leagueLogo = post.boards?.league_id ? leagueLogoMap[post.boards.league_id] : null;

      return {
        id: post.id,
        title: post.title,
        board_id: post.board_id,
        board_slug: post.boards?.slug || '',
        board_name: post.boards?.name || '알 수 없음',
        post_number: post.post_number,
        likes: post.likes || 0,
        views: post.views || 0,
        comment_count: commentCounts[post.id] || 0,
        author_nickname: post.profiles?.nickname || '익명',
        author_id: post.profiles?.id,
        author_level: post.profiles?.level || 1,
        author_icon_id: iconId,
        author_icon_url: iconUrl,
        author_public_id: post.profiles?.public_id || null,
        created_at: post.created_at,
        formattedDate: formatDate(post.created_at),
        team_id: post.boards?.team_id,
        league_id: post.boards?.league_id,
        team_logo: teamLogo,
        league_logo: leagueLogo,
        content: typeof post.content === 'string' ? post.content : JSON.stringify(post.content || '')
      };
    });

    return {
      data: formattedPosts,
      meta: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        itemsPerPage: limit,
        period
      }
    };
  } catch (error) {
    console.error('전체 인기 게시글 조회 오류:', error);
    return {
      data: [],
      meta: {
        totalItems: 0,
        totalPages: 1,
        currentPage: 1,
        itemsPerPage: limit,
        period: period || 'week'
      }
    };
  }
}
