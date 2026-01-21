import { SupabaseClient } from '@supabase/supabase-js';
import { getLevelIconUrl } from '@/shared/utils/level-icons-server';
import { formatDate } from '@/shared/utils/dateUtils';
import type { Json } from '@/shared/types/supabase';
import type { Post, PostsResponse } from '../getPosts';
import type { DealInfo } from '../../types/hotdeal';

/**
 * 안전한 fallback 게시물 데이터 생성
 */
export function createFallbackPost(index: number): Post {
  const now = new Date().toISOString();
  return {
    id: `fallback-${index}`,
    title: '게시물을 불러오는 중입니다...',
    created_at: now,
    formattedDate: formatDate(now),
    board_id: 'fallback',
    board_name: '로딩 중',
    board_slug: 'loading',
    post_number: index,
    author_nickname: '시스템',
    author_id: 'system',
    views: 0,
    likes: 0,
    comment_count: 0,
    content: '게시물 데이터를 불러오는 중 문제가 발생했습니다.',
    team_id: null,
    league_id: null,
    team_logo: null,
    league_logo: null
  };
}

/**
 * 빈 응답 생성
 */
export function createEmptyResponse(page: number, limit: number): PostsResponse {
  return {
    data: [],
    meta: {
      totalItems: 0,
      totalPages: 1,
      currentPage: page,
      itemsPerPage: limit
    }
  };
}

/**
 * 게시판 정보 조회
 */
export async function fetchBoardsInfo(
  supabase: SupabaseClient,
  boardIds: string[]
): Promise<Record<string, { name: string; team_id?: number | null; league_id?: number | null; slug: string }>> {
  if (boardIds.length === 0) return {};

  const { data: boards, error } = await supabase
    .from('boards')
    .select('id, name, team_id, league_id, slug')
    .in('id', boardIds);

  if (error || !boards) return {};

  return boards.reduce((acc, board) => {
    acc[board.id] = {
      name: board.name,
      team_id: board.team_id,
      league_id: board.league_id,
      slug: board.slug || board.id
    };
    return acc;
  }, {} as Record<string, { name: string; team_id?: number | null; league_id?: number | null; slug: string }>);
}

/**
 * 팀 로고 조회
 */
export async function fetchTeamLogos(
  supabase: SupabaseClient,
  teamIds: number[]
): Promise<Record<string, string>> {
  if (teamIds.length === 0) return {};

  try {
    const { data: teamsData } = await supabase
      .from('teams')
      .select('id, logo')
      .in('id', teamIds);

    if (!teamsData) return {};

    return teamsData.reduce((acc, team) => {
      if (team.id && team.logo) {
        acc[team.id] = team.logo;
      }
      return acc;
    }, {} as Record<string, string>);
  } catch {
    return {};
  }
}

/**
 * 리그 로고 조회
 */
export async function fetchLeagueLogos(
  supabase: SupabaseClient,
  leagueIds: number[]
): Promise<Record<string, string>> {
  if (leagueIds.length === 0) return {};

  try {
    const { data: leaguesData } = await supabase
      .from('leagues')
      .select('id, logo')
      .in('id', leagueIds);

    if (!leaguesData) return {};

    return leaguesData.reduce((acc, league) => {
      if (league.id && league.logo) {
        acc[league.id] = league.logo;
      }
      return acc;
    }, {} as Record<string, string>);
  } catch {
    return {};
  }
}

/**
 * 사용자 프로필 및 아이콘 정보 조회
 */
export async function fetchUserProfiles(
  supabase: SupabaseClient,
  userIds: string[]
): Promise<{
  profileMap: Record<string, { level: number; icon_id: number | null }>;
  iconMap: Record<number, string>;
}> {
  const profileMap: Record<string, { level: number; icon_id: number | null }> = {};
  const iconMap: Record<number, string> = {};

  if (userIds.length === 0) return { profileMap, iconMap };

  try {
    // 프로필 정보 조회
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, level, icon_id')
      .in('id', userIds);

    if (profilesData) {
      profilesData.forEach(profile => {
        if (profile.id) {
          profileMap[profile.id] = {
            level: profile.level || 1,
            icon_id: profile.icon_id
          };
        }
      });

      // 커스텀 아이콘 조회
      const iconIds = profilesData
        .map(profile => profile.icon_id)
        .filter(Boolean) as number[];

      if (iconIds.length > 0) {
        const { data: iconsData } = await supabase
          .from('shop_items')
          .select('id, image_url')
          .in('id', iconIds);

        if (iconsData) {
          iconsData.forEach(icon => {
            if (icon.id && icon.image_url) {
              iconMap[icon.id] = icon.image_url;
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('프로필 정보 조회 오류:', error);
  }

  return { profileMap, iconMap };
}

/**
 * 댓글 수 조회
 */
export async function fetchCommentCounts(
  supabase: SupabaseClient,
  postIds: string[]
): Promise<Record<string, number>> {
  const countMap: Record<string, number> = {};

  if (postIds.length === 0) return countMap;

  try {
    const { data: commentCounts } = await supabase
      .from('comments')
      .select('post_id')
      .in('post_id', postIds)
      .eq('is_hidden', false)
      .eq('is_deleted', false);

    if (commentCounts) {
      commentCounts.forEach((comment) => {
        if (comment.post_id) {
          countMap[comment.post_id] = (countMap[comment.post_id] || 0) + 1;
        }
      });
    }
  } catch {
    // 댓글 수 조회 실패 시 무시
  }

  return countMap;
}

/**
 * 게시글 데이터 포맷팅
 */
export function formatPostData(
  post: {
    id: string;
    title?: string;
    created_at?: string;
    board_id?: string;
    views?: number;
    likes?: number;
    post_number?: number;
    user_id?: string;
    is_hidden?: boolean;
    is_deleted?: boolean;
    is_notice?: boolean;
    profiles?: { id?: string; nickname?: string; level?: number; icon_id?: number | null; public_id?: string | null } | null;
    content?: Json;
    deal_info?: DealInfo | null;
  },
  boardsData: Record<string, { name: string; team_id?: number | null; league_id?: number | null; slug: string }>,
  teamLogoMap: Record<string, string>,
  leagueLogoMap: Record<string, string>,
  userProfileMap: Record<string, { level: number; icon_id: number | null }>,
  userIconMap: Record<number, string>,
  commentCountMap: Record<string, number>
): Post {
  const boardInfo = post.board_id ? boardsData[post.board_id] : null;
  const safeBoardInfo = boardInfo || {
    name: '알 수 없는 게시판',
    slug: post.board_id || 'unknown',
    team_id: null,
    league_id: null
  };

  const teamLogo = safeBoardInfo.team_id ? teamLogoMap[safeBoardInfo.team_id] : null;
  const leagueLogo = safeBoardInfo.league_id ? leagueLogoMap[safeBoardInfo.league_id] : null;

  const profile = post.profiles;
  const userLevel = profile?.level || 1;

  // 아이콘 URL 생성
  let iconUrl: string | null = null;
  const userId = post.user_id;

  if (userId && userProfileMap[userId]) {
    const userProfile = userProfileMap[userId];
    if (userProfile.icon_id && userIconMap[userProfile.icon_id]) {
      iconUrl = userIconMap[userProfile.icon_id];
    } else {
      iconUrl = getLevelIconUrl(userProfile.level);
    }
  } else if (profile?.icon_id && userIconMap[profile.icon_id]) {
    iconUrl = userIconMap[profile.icon_id];
  } else {
    iconUrl = getLevelIconUrl(userLevel);
  }

  // 제목 처리
  let displayTitle = post.title || '';
  if (post.is_deleted) {
    displayTitle = '[삭제된 게시글]';
  } else if (post.is_hidden) {
    displayTitle = '[숨김 처리된 게시글]';
  }

  return {
    id: post.id,
    title: displayTitle,
    created_at: post.created_at || new Date().toISOString(),
    formattedDate: formatDate(post.created_at || new Date().toISOString()),
    board_id: post.board_id || '',
    board_name: safeBoardInfo.name,
    board_slug: safeBoardInfo.slug,
    post_number: post.post_number || 0,
    author_nickname: profile?.nickname || '익명',
    author_id: profile?.id || '',
    author_level: userLevel,
    author_icon_id: profile?.icon_id,
    author_icon_url: iconUrl,
    author_public_id: profile?.public_id || null,
    views: post.views || 0,
    likes: post.likes || 0,
    comment_count: commentCountMap[post.id] || 0,
    content: typeof post.content === 'string' ? post.content : JSON.stringify(post.content || ''),
    team_id: safeBoardInfo.team_id,
    league_id: safeBoardInfo.league_id,
    team_logo: teamLogo,
    league_logo: leagueLogo,
    is_hidden: post.is_hidden || false,
    is_deleted: post.is_deleted || false,
    is_notice: post.is_notice || false,
    deal_info: post.deal_info || null
  };
}
