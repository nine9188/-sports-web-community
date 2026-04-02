'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { getLevelIconUrl } from '@/shared/utils/level-icons-server';
import { formatDate } from '@/shared/utils/dateUtils';

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
  author_exp?: number;
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

type TimePeriod = 'week' | 'month' | 'all';

interface GetAllPopularPostsParams {
  period?: TimePeriod;
  page?: number;
  limit?: number;
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
 * 전체 게시판의 인기 게시글 조회 (HOT 점수 기반)
 *
 * HOT 점수 = (조회×1 + 좋아요×10 + 댓글×20) × 시간감쇠
 * 사이드바 인기글과 동일한 공식 사용
 */
export async function getAllPopularPosts({
  period = 'week',
  page = 1,
  limit = 20
}: GetAllPopularPostsParams = {}): Promise<PopularPostsResponse> {
  try {
    const supabase = await getSupabaseServer();
    const now = new Date();

    // 기간별 시작 날짜 계산
    let startDate: Date;
    let windowDays: number;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        windowDays = 7;
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        windowDays = 30;
        break;
      case 'all':
      default:
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        windowDays = 365;
        break;
    }

    const maxHours = windowDays * 24;

    // 기간 내 모든 게시글 가져오기 (HOT 점수는 서버에서 계산해야 하므로)
    const { data: postsData, error: postsError } = await supabase
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
        profiles!left(id, nickname, level, exp, icon_id, public_id)
      `)
      .eq('is_deleted', false)
      .eq('is_hidden', false)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(500);

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

    // HOT 점수 계산 후 정렬
    const nowMs = now.getTime();
    const scoredPosts = postsData.map(post => ({
      post,
      hotScore: calculateHotScore(
        post.views || 0,
        post.likes || 0,
        commentCounts[post.id] || 0,
        post.created_at,
        nowMs,
        maxHours
      )
    }));

    scoredPosts.sort((a, b) => b.hotScore - a.hotScore);

    // 페이지네이션 적용
    const totalItems = scoredPosts.length;
    const offset = (page - 1) * limit;
    const pagedPosts = scoredPosts.slice(offset, offset + limit);

    // 팀/리그 로고 가져오기
    const teamIds = [...new Set(
      pagedPosts.map(({ post }) => post.boards?.team_id).filter(Boolean)
    )] as number[];

    const leagueIds = [...new Set(
      pagedPosts.map(({ post }) => post.boards?.league_id).filter(Boolean)
    )] as number[];

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
    const iconIds = [...new Set(
      pagedPosts.map(({ post }) => post.profiles?.icon_id).filter(Boolean)
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

    // 데이터 포맷팅
    const formattedPosts: PopularPost[] = pagedPosts.map(({ post }) => {
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
        author_exp: post.profiles?.exp || 0,
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
