'use server'

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { cache } from 'react';
import { TopicPost } from '../types';

/**
 * 슬라이딩 윈도우 방식 HOT 인기글 조회
 *
 * 🔄 슬라이딩 윈도우: 고정 7일 (초보 커뮤니티 특성)
 *
 * 🔥 HOT 점수 계산:
 * - 기본점수 = (조회수 × 1) + (좋아요 × 10) + (댓글 × 20)
 * - 시간감쇠 = max(0, 1 - (경과시간 / 168시간))
 * - HOT점수 = 기본점수 × 시간감쇠
 *
 * 📖 상세 문서:
 * - src/domains/sidebar/SIDEBAR_POPULAR_POSTS.md
 * - src/domains/sidebar/HOT_SCORE_GUIDE.md
 */
export const getHotPosts = cache(async (
  options?: {
    limit?: number;
    minScore?: number; // 최소 인기 점수
  }
): Promise<{
  posts: TopicPost[];
  windowDays: number; // 실제 적용된 윈도우 크기
  stats: {
    totalPosts: number;
    avgScore: number;
  };
}> => {
  try {
    const supabase = await getSupabaseServer();
    const limit = options?.limit || 20;

    // Step 1: 슬라이딩 윈도우 크기 설정 (초보 커뮤니티 특성 반영)
    const windowDays = 7;

    const windowStart = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

    // Step 2: 윈도우 내 모든 게시글 가져오기
    const { data: postsData, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        created_at,
        board_id,
        views,
        likes,
        post_number,
        content,
        is_hidden,
        is_deleted
      `)
      .gte('created_at', windowStart)
      .eq('is_deleted', false)
      .eq('is_hidden', false)
      .limit(100); // 충분히 가져와서 점수 계산 후 정렬

    if (error || !postsData || postsData.length === 0) {
      return { posts: [], windowDays, stats: { totalPosts: 0, avgScore: 0 } };
    }

    // Step 3: 게시판 정보 가져오기
    const boardIds = [...new Set(postsData.map(post => post.board_id).filter(Boolean))] as string[];

    const { data: boardsData } = await supabase
      .from('boards')
      .select('id, name, slug, team_id, league_id')
      .in('id', boardIds);

    const boardMap: Record<string, {
      name: string,
      slug: string,
      team_id: number | null,
      league_id: number | null
    }> = {};

    (boardsData || []).forEach((board) => {
      if (board && board.id) {
        boardMap[board.id] = {
          name: board.name || '',
          slug: board.slug || board.id,
          team_id: board.team_id || null,
          league_id: board.league_id || null
        };
      }
    });

    // Step 4: 팀/리그 정보 가져오기
    const teamIds = (boardsData || [])
      .filter((b) => b.team_id)
      .map((b) => b.team_id)
      .filter(Boolean) as number[];

    const leagueIds = (boardsData || [])
      .filter((b) => b.league_id)
      .map((b) => b.league_id)
      .filter(Boolean) as number[];

    const [teamsResult, leaguesResult] = await Promise.all([
      teamIds.length > 0
        ? supabase.from('teams').select('id, logo').in('id', teamIds)
        : Promise.resolve({ data: [] }),
      leagueIds.length > 0
        ? supabase.from('leagues').select('id, logo').in('id', leagueIds)
        : Promise.resolve({ data: [] })
    ]);

    const teamLogoMap: Record<number, string> = {};
    (teamsResult.data || []).forEach((team: { id: number; logo: string | null }) => {
      if (team.id) teamLogoMap[team.id] = team.logo || '';
    });

    const leagueLogoMap: Record<number, string> = {};
    (leaguesResult.data || []).forEach((league: { id: number; logo: string | null }) => {
      if (league.id) leagueLogoMap[league.id] = league.logo || '';
    });

    // Step 5: 댓글 수 구하기
    const commentCounts: Record<string, number> = {};
    const postIds = postsData.map(post => post.id);

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

      postsData.forEach(post => {
        if (!(post.id in commentCounts)) {
          commentCounts[post.id] = 0;
        }
      });
    }

    // Step 6: 복합 점수 계산 및 정렬
    const now = Date.now();
    const scoredPosts = postsData.map(post => {
      const boardInfo = post.board_id && boardMap[post.board_id]
        ? boardMap[post.board_id]
        : { name: '알 수 없음', slug: post.board_id || '', team_id: null, league_id: null };

      const teamId = boardInfo.team_id;
      const leagueId = boardInfo.league_id;

      const teamLogo = teamId !== null ? teamLogoMap[teamId] || null : null;
      const leagueLogo = leagueId !== null ? leagueLogoMap[leagueId] || null : null;

      // 시간 감쇠 계산
      const postTime = new Date(post.created_at || Date.now()).getTime();
      const hoursSince = (now - postTime) / (1000 * 60 * 60);
      const maxHours = windowDays * 24;
      const timeDecay = Math.max(0, 1 - (hoursSince / maxHours));

      // 복합 점수 계산 (가중치: 조회수 1, 좋아요 10, 댓글 20)
      const views = post.views || 0;
      const likes = post.likes || 0;
      const comments = commentCounts[post.id] || 0;

      const rawScore = (views * 1) + (likes * 10) + (comments * 20);
      const hotScore = rawScore * timeDecay;

      return {
        id: post.id,
        title: post.title || '',
        created_at: post.created_at || '',
        board_id: post.board_id || '',
        board_name: boardInfo.name,
        board_slug: boardInfo.slug,
        post_number: post.post_number || 0,
        comment_count: comments,
        views,
        likes,
        team_id: teamId,
        league_id: leagueId,
        team_logo: teamLogo,
        league_logo: leagueLogo,
        content: typeof post.content === 'string' ? post.content : (post.content ? JSON.stringify(post.content) : undefined),
        hot_score: hotScore
      };
    });

    // 최소 점수 필터링 (옵션)
    let filtered = scoredPosts;
    const minScore = options?.minScore;
    if (minScore !== undefined && minScore > 0) {
      filtered = scoredPosts.filter(p => p.hot_score >= minScore);
    }

    // 점수순 정렬 및 상위 N개만
    const sorted = filtered
      .sort((a, b) => b.hot_score - a.hot_score)
      .slice(0, limit);

    // hot_score 제거 (클라이언트에 노출 불필요)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const result = sorted.map(({ hot_score, ...post }) => post);

    // 통계 계산
    const avgScore = scoredPosts.length > 0
      ? scoredPosts.reduce((sum, p) => sum + p.hot_score, 0) / scoredPosts.length
      : 0;

    return {
      posts: result,
      windowDays,
      stats: {
        totalPosts: postsData.length,
        avgScore
      }
    };
  } catch (error) {
    console.error('인기글 조회 오류:', error);
    return { posts: [], windowDays: 1, stats: { totalPosts: 0, avgScore: 0 } };
  }
});
