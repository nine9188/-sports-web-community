'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { PostMetadata, BoardInfoDetail } from '../types';

/**
 * 게시글의 메타데이터를 조회합니다.
 * - 댓글 수
 * - 게시판 상세 정보 (slug, name, team_id, league_id)
 * - 팀/리그 로고
 *
 * 모든 쿼리를 병렬로 실행하여 성능 최적화
 */
export async function getPostsMetadata(
  postIds: string[],
  boardIds: string[]
): Promise<PostMetadata> {
  // 빈 결과 기본값
  const emptyResult: PostMetadata = {
    commentCounts: {},
    boardInfos: new Map(),
    teamLogos: new Map(),
    leagueLogos: new Map()
  };

  if (postIds.length === 0) {
    return emptyResult;
  }

  try {
    const supabase = await getSupabaseServer();

    // 1단계: 댓글 수 + 게시판 정보 병렬 조회
    const [commentResult, boardInfoResult] = await Promise.all([
      // 댓글 수 조회
      supabase
        .from('comments')
        .select('post_id')
        .in('post_id', postIds)
        .eq('is_hidden', false)
        .eq('is_deleted', false),

      // 게시판 상세 정보 조회
      supabase
        .from('boards')
        .select('id, slug, name, team_id, league_id')
        .in('id', boardIds)
    ]);

    // 댓글 수 집계
    const commentCounts: Record<string, number> = {};
    commentResult.data?.forEach(comment => {
      if (comment.post_id) {
        commentCounts[comment.post_id] = (commentCounts[comment.post_id] || 0) + 1;
      }
    });

    // 게시판 정보 매핑 + 팀/리그 ID 수집
    const boardInfos = new Map<string, BoardInfoDetail>();
    const teamIds: number[] = [];
    const leagueIds: number[] = [];

    boardInfoResult.data?.forEach(board => {
      boardInfos.set(board.id, {
        slug: board.slug || '',
        name: board.name || '',
        teamId: board.team_id,
        leagueId: board.league_id
      });
      if (board.team_id) teamIds.push(board.team_id);
      if (board.league_id) leagueIds.push(board.league_id);
    });

    // 2단계: 팀/리그 로고 병렬 조회 (필요한 경우만)
    const uniqueTeamIds = [...new Set(teamIds)];
    const uniqueLeagueIds = [...new Set(leagueIds)];

    const [teamResult, leagueResult] = await Promise.all([
      uniqueTeamIds.length > 0
        ? supabase.from('teams').select('id, logo').in('id', uniqueTeamIds)
        : Promise.resolve({ data: [] }),
      uniqueLeagueIds.length > 0
        ? supabase.from('leagues').select('id, logo').in('id', uniqueLeagueIds)
        : Promise.resolve({ data: [] })
    ]);

    // 로고 매핑
    const teamLogos = new Map<number, string>();
    const leagueLogos = new Map<number, string>();

    teamResult.data?.forEach(team => {
      if (team.logo) teamLogos.set(team.id, team.logo);
    });

    leagueResult.data?.forEach(league => {
      if (league.logo) leagueLogos.set(league.id, league.logo);
    });

    return {
      commentCounts,
      boardInfos,
      teamLogos,
      leagueLogos
    };
  } catch (error) {
    console.error('메타데이터 조회 오류:', error);
    return emptyResult;
  }
}
