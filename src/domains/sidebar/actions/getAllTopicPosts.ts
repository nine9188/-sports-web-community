'use server';

import { getSupabaseAdmin } from '@/shared/lib/supabase/server';
import { unstable_cache } from 'next/cache';
import { TopicPost } from '../types';
import { HOTDEAL_BOARD_SLUGS } from '@/domains/boards/types/hotdeal';
import { getTeamLogoUrls, getLeagueLogoUrls } from '@/domains/livescore/actions/images';

interface AllTopicPostsData {
  views: TopicPost[];
  likes: TopicPost[];
  comments: TopicPost[];
  hot: TopicPost[];
  windowDays: number;
  stats: {
    totalPosts: number;
    avgScore: number;
  };
}

/**
 * 모든 인기글 탭 데이터를 한 번에 조회
 * 기존: views, likes, comments, hot 각각 별도 쿼리 (4회)
 * 최적화: 한 번의 쿼리로 가져와서 서버에서 정렬별로 분리
 *
 * unstable_cache로 요청 간 캐시 적용 (120초)
 */
export async function getAllTopicPosts(limit = 20): Promise<AllTopicPostsData> {
  const getCached = unstable_cache(
    async () => fetchAllTopicPosts(limit),
    ['sidebar', 'all-topic-posts', String(limit)],
    { revalidate: 120 } // 2분
  );

  return getCached();
}

/**
 * 실제 DB 조회 로직 (캐시 래퍼에서 분리)
 */
async function fetchAllTopicPosts(limit: number): Promise<AllTopicPostsData> {
  const windowDays = 7;
  const emptyResult: AllTopicPostsData = {
    views: [],
    likes: [],
    comments: [],
    hot: [],
    windowDays,
    stats: { totalPosts: 0, avgScore: 0 }
  };

  try {
    const supabase = getSupabaseAdmin();
    const windowStart = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

    // Step 1: 모든 게시글을 한 번에 가져오기
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
      .limit(100);

    if (error || !postsData || postsData.length === 0) {
      return emptyResult;
    }

    // Step 2: 게시판 정보 가져오기
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

    // 핫딜 게시판 제외
    const hotdealBoardIds = new Set(
      (boardsData || [])
        .filter((board) =>
          board.slug !== null &&
          (HOTDEAL_BOARD_SLUGS as readonly string[]).includes(board.slug)
        )
        .map((board) => board.id)
    );
    const filteredPostsData = postsData.filter(post =>
      post.board_id !== null && !hotdealBoardIds.has(post.board_id)
    );

    if (filteredPostsData.length === 0) {
      return emptyResult;
    }

    // Step 3: 팀/리그 로고 URL 조회 (한 번만)
    const teamIds = (boardsData || [])
      .filter((b) => b.team_id)
      .map((b) => b.team_id)
      .filter(Boolean) as number[];

    const leagueIds = (boardsData || [])
      .filter((b) => b.league_id)
      .map((b) => b.league_id)
      .filter(Boolean) as number[];

    const [teamLogoMap, leagueLogoMap, leagueLogoDarkMap] = await Promise.all([
      teamIds.length > 0 ? getTeamLogoUrls(teamIds) : Promise.resolve({}),
      leagueIds.length > 0 ? getLeagueLogoUrls(leagueIds) : Promise.resolve({}),
      leagueIds.length > 0 ? getLeagueLogoUrls(leagueIds, true) : Promise.resolve({})
    ]);

    // Step 4: 댓글 수 구하기 (한 번만)
    const commentCounts: Record<string, number> = {};
    const postIds = filteredPostsData.map(post => post.id);

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

      filteredPostsData.forEach(post => {
        if (!(post.id in commentCounts)) {
          commentCounts[post.id] = 0;
        }
      });
    }

    // Step 5: 모든 게시글을 TopicPost 형태로 변환 + HOT 점수 계산
    const now = Date.now();
    const allPosts: (TopicPost & { hot_score: number })[] = filteredPostsData.map(post => {
      const boardInfo = post.board_id && boardMap[post.board_id]
        ? boardMap[post.board_id]
        : { name: '알 수 없음', slug: post.board_id || '', team_id: null, league_id: null };

      const teamId = boardInfo.team_id;
      const leagueId = boardInfo.league_id;

      const teamLogo = teamId !== null ? teamLogoMap[teamId] || null : null;
      const leagueLogo = leagueId !== null ? leagueLogoMap[leagueId] || null : null;
      const leagueLogoDark = leagueId !== null ? leagueLogoDarkMap[leagueId] || null : null;

      // HOT 점수 계산
      const postTime = new Date(post.created_at || Date.now()).getTime();
      const hoursSince = (now - postTime) / (1000 * 60 * 60);
      const maxHours = windowDays * 24;
      const timeDecay = Math.max(0, 1 - (hoursSince / maxHours));

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
        league_logo_dark: leagueLogoDark,
        content: typeof post.content === 'string' ? post.content : (post.content ? JSON.stringify(post.content) : undefined),
        hot_score: hotScore
      };
    });

    // Step 6: 각 정렬 기준별로 상위 N개 추출
    const viewsSorted = [...allPosts]
      .sort((a, b) => b.views - a.views)
      .slice(0, limit)
      .map(({ hot_score: _, ...post }) => post);

    const likesSorted = [...allPosts]
      .sort((a, b) => b.likes - a.likes)
      .slice(0, limit)
      .map(({ hot_score: _, ...post }) => post);

    const commentsSorted = [...allPosts]
      .sort((a, b) => b.comment_count - a.comment_count)
      .slice(0, limit)
      .map(({ hot_score: _, ...post }) => post);

    const hotSorted = [...allPosts]
      .sort((a, b) => b.hot_score - a.hot_score)
      .slice(0, limit)
      .map(({ hot_score: _, ...post }) => post);

    // 통계 계산
    const avgScore = allPosts.length > 0
      ? allPosts.reduce((sum, p) => sum + p.hot_score, 0) / allPosts.length
      : 0;

    return {
      views: viewsSorted,
      likes: likesSorted,
      comments: commentsSorted,
      hot: hotSorted,
      windowDays,
      stats: {
        totalPosts: filteredPostsData.length,
        avgScore
      }
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!errorMessage.includes('DYNAMIC_SERVER_USAGE') && !errorMessage.includes('cookies')) {
      console.error('[getAllTopicPosts] 오류:', error);
    }
    return emptyResult;
  }
}
