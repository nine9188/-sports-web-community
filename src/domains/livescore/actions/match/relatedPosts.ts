'use server';

import { cache } from 'react';
import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { getTeamLogoUrls, getLeagueLogoUrls } from '@/domains/livescore/actions/images';

export interface RelatedPost {
  id: string;
  title: string;
  post_number: number;
  created_at: string;
  view_count: number;
  comment_count: number;
  content: string;
  board_slug: string;
  board_name: string;
  board_team_id: number | null;
  board_league_id: number | null;
  card_type: 'match' | 'team' | 'player' | 'board';
  // 4590 표준: 서버에서 미리 조회한 보드 로고 URL
  boardLogoUrl?: string;
}

/**
 * 통합 관련 게시글 조회
 *
 * 매치/팀/선수 페이지에서 공통으로 사용
 * - 매치: { matchId, teamIds: [홈, 원정] }
 * - 팀:   { teamIds: [팀ID] }
 * - 선수: { playerIds: [선수ID], teamIds: [소속팀ID] }
 */
export interface RelatedPostsParams {
  matchId?: string;
  teamIds?: number[];
  playerIds?: number[];
  limit?: number;
}

export const getRelatedPosts = cache(async (
  params: RelatedPostsParams | string,
  homeTeamId?: number,
  awayTeamId?: number,
  legacyLimit?: number
): Promise<RelatedPost[]> => {
  // 하위 호환: 기존 (matchId, homeTeamId, awayTeamId, limit) 호출 지원
  const p: RelatedPostsParams = typeof params === 'string'
    ? {
        matchId: params,
        teamIds: [homeTeamId, awayTeamId].filter(Boolean) as number[],
        limit: legacyLimit,
      }
    : params;

  const { matchId, teamIds = [], playerIds = [], limit = 10 } = p;

  try {
    const supabase = await getSupabaseServer();

    // .or() 필터 조건 생성
    const orConditions: string[] = [];
    if (matchId) orConditions.push(`match_id.eq.${matchId}`);
    if (teamIds.length > 0) orConditions.push(`team_id.in.(${teamIds.join(',')})`);
    if (playerIds.length > 0) orConditions.push(`player_id.in.(${playerIds.join(',')})`);

    // 조건이 없으면 빈 배열 반환
    if (orConditions.length === 0) return [];

    // 카드 링크 기반 조회 + 팀 게시판 게시글 조회를 병렬 실행
    const [cardResult, boardResult] = await Promise.all([
      // 1) 카드 링크 기반 (매치/팀/선수 카드가 삽입된 게시글)
      supabase
        .from('post_card_links')
        .select(`
          card_type,
          match_id,
          team_id,
          posts!inner (
            id,
            title,
            content,
            post_number,
            created_at,
            views,
            boards!inner (
              slug,
              name,
              team_id,
              league_id
            ),
            comments(count)
          )
        `)
        .or(orConditions.join(','))
        .limit(50),

      // 2) 팀 게시판 게시글 (boards.team_id 매칭)
      teamIds.length > 0
        ? supabase
            .from('posts')
            .select(`
              id,
              title,
              content,
              post_number,
              created_at,
              views,
              boards!inner (
                slug,
                name,
                team_id,
                league_id
              ),
              comments(count)
            `)
            .in('boards.team_id', teamIds)
            .order('created_at', { ascending: false })
            .limit(20)
        : Promise.resolve({ data: null, error: null }),
    ]);

    // 중복 게시글 제거
    const postMap = new Map<string, RelatedPost & { priority: number }>();

    // 카드 링크 결과 처리
    if (cardResult.error) {
      console.error('카드 링크 조회 오류:', cardResult.error.message, cardResult.error.code, cardResult.error.details);
    } else if (cardResult.data) {
      for (const row of cardResult.data) {
        const post = row.posts as unknown as {
          id: string;
          title: string;
          content: string;
          post_number: number;
          created_at: string;
          views: number;
          boards: { slug: string; name: string; team_id: number | null; league_id: number | null };
          comments: { count: number }[];
        };

        if (!post?.id) continue;

        const priority = matchId && row.match_id === matchId && row.card_type === 'match' ? 0 : 1;
        const contentStr = typeof post.content === 'object' ? JSON.stringify(post.content) : String(post.content || '');

        const existing = postMap.get(post.id);
        if (!existing || priority < existing.priority) {
          postMap.set(post.id, {
            id: post.id,
            title: post.title,
            content: contentStr,
            post_number: post.post_number,
            created_at: post.created_at,
            view_count: post.views || 0,
            comment_count: post.comments?.[0]?.count || 0,
            board_slug: post.boards.slug,
            board_name: post.boards.name,
            board_team_id: post.boards.team_id,
            board_league_id: post.boards.league_id,
            card_type: row.card_type as 'match' | 'team' | 'player',
            priority,
          });
        }
      }
    }

    // 팀 게시판 결과 처리
    if (boardResult.error) {
      console.error('팀 게시판 조회 오류:', boardResult.error.message, boardResult.error.code, boardResult.error.details);
    } else if (boardResult.data) {
      for (const post of boardResult.data) {
        const p = post as unknown as {
          id: string;
          title: string;
          content: string;
          post_number: number;
          created_at: string;
          views: number;
          boards: { slug: string; name: string; team_id: number | null; league_id: number | null };
          comments: { count: number }[];
        };

        if (!p?.id) continue;

        const priority = 2;
        const contentStr = typeof p.content === 'object' ? JSON.stringify(p.content) : String(p.content || '');

        const existing = postMap.get(p.id);
        if (!existing || priority < existing.priority) {
          postMap.set(p.id, {
            id: p.id,
            title: p.title,
            content: contentStr,
            post_number: p.post_number,
            created_at: p.created_at,
            view_count: p.views || 0,
            comment_count: p.comments?.[0]?.count || 0,
            board_slug: p.boards.slug,
            board_name: p.boards.name,
            board_team_id: p.boards.team_id,
            board_league_id: p.boards.league_id,
            card_type: 'board',
            priority,
          });
        }
      }
    }

    if (postMap.size === 0) return [];

    // 최신순 정렬
    const sortedPosts = Array.from(postMap.values())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)
      .map(({ priority: _, ...rest }) => rest);

    // 4590 표준: 보드 로고 URL 배치 조회
    const teamIdsForLogo = [...new Set(sortedPosts.filter(p => p.board_team_id).map(p => p.board_team_id!))];
    const leagueIdsForLogo = [...new Set(sortedPosts.filter(p => p.board_league_id && !p.board_team_id).map(p => p.board_league_id!))];

    const [teamLogoMap, leagueLogoMap] = await Promise.all([
      teamIdsForLogo.length > 0 ? getTeamLogoUrls(teamIdsForLogo) : Promise.resolve({}),
      leagueIdsForLogo.length > 0 ? getLeagueLogoUrls(leagueIdsForLogo) : Promise.resolve({}),
    ]);

    // boardLogoUrl 채우기
    return sortedPosts.map(post => ({
      ...post,
      boardLogoUrl: post.board_team_id
        ? teamLogoMap[post.board_team_id]
        : post.board_league_id
          ? leagueLogoMap[post.board_league_id]
          : undefined,
    }));
  } catch (error) {
    console.error('관련 게시글 조회 실패:', error);
    return [];
  }
});
