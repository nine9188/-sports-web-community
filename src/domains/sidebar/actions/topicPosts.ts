'use server'

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { cache } from 'react';
import { TopicPost } from '../types';
import { getHotPosts } from './getHotPosts';
import { HOTDEAL_BOARD_SLUGS } from '@/domains/boards/types/hotdeal';

/**
 * 인기글 목록을 유형별로 조회하는 서버 액션
 * React.cache로 래핑하여 중복 요청 방지
 *
 * 🔄 슬라이딩 윈도우 적용:
 * - 고정 7일 윈도우 (초보 커뮤니티 특성)
 * - 향후 커뮤니티 활성화 시 동적 조정 가능
 *
 * 📖 상세 문서: src/domains/sidebar/SIDEBAR_POPULAR_POSTS.md
 */
export const getCachedTopicPosts = cache(async (type: 'views' | 'likes' | 'comments' | 'hot'): Promise<TopicPost[]> => {
  // 'hot' 타입일 경우 슬라이딩 윈도우 기반 인기글 반환
  if (type === 'hot') {
    const { posts } = await getHotPosts({ limit: 20 });
    return posts;
  }

  // 조회수/댓글/추천 탭도 슬라이딩 윈도우 적용
  try {
    const supabase = await getSupabaseServer();

    // 초보 커뮤니티 특성 반영: 기본 7일 윈도우
    const windowDays = 7;

    const windowStart = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

    // Step 3: 윈도우 내 글 목록 가져오기 (정렬 기준에 따라)
    let query = supabase
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

    // 정렬 기준 적용
    if (type === 'views') {
      query = query.order('views', { ascending: false });
    } else if (type === 'likes') {
      query = query.order('likes', { ascending: false });
    }
    
    const { data: postsData, error } = await query;
    
    if (error) {
      throw error;
    }
    
    const validPosts = (postsData as unknown) as Array<{
      id: string;
      title?: string;
      created_at?: string;
      board_id?: string;
      views?: number;
      likes?: number;
      post_number?: number;
      content?: string;
      is_hidden?: boolean;
      is_deleted?: boolean;
    }>;
    
    // 빈 배열인 경우 빠르게 반환
    if (validPosts.length === 0) {
      return [];
    }
    
    // 2. 게시판 정보 가져오기
    const boardIds = [...new Set(validPosts.map(post => post.board_id).filter(Boolean))] as string[];
    
    const { data: boardsData, error: boardsError } = await supabase
      .from('boards')
      .select('id, name, slug, team_id, league_id')
      .in('id', boardIds);
      
    if (boardsError) {
      throw boardsError;
    }
    
    const validBoards = (boardsData || []) as {
      id: string;
      name?: string;
      slug?: string;
      team_id?: number | null;
      league_id?: number | null;
    }[];
    
    // 3. 게시판 매핑 구성
    const boardMap: Record<string, { 
      name: string, 
      slug: string, 
      team_id: number | null, 
      league_id: number | null 
    }> = {};
    
    validBoards.forEach((board) => {
      if (board && board.id) {
        boardMap[board.id] = {
          name: board.name || '',
          slug: board.slug || board.id,
          team_id: board.team_id || null,
          league_id: board.league_id || null
        };
      }
    });

    // 핫딜 게시판 제외한 게시글만 필터링
    const hotdealBoardIds = new Set(
      validBoards
        .filter((board) => board.slug && HOTDEAL_BOARD_SLUGS.includes(board.slug as any))
        .map((board) => board.id)
    );
    const filteredValidPosts = validPosts.filter(post => !hotdealBoardIds.has(post.board_id));

    // 필터링 후 빈 배열인 경우 빠르게 반환
    if (filteredValidPosts.length === 0) {
      return [];
    }

    // 4. 팀 및 리그 정보 가져오기
    const teamIds = validBoards
      .filter((b) => b.team_id)
      .map((b) => b.team_id)
      .filter(Boolean) as number[];
      
    const leagueIds = validBoards
      .filter((b) => b.league_id)
      .map((b) => b.league_id)
      .filter(Boolean) as number[];
      
    // 모든 필요한 정보를 병렬로 가져오기
    const [teamsResult, leaguesResult] = await Promise.all([
      // 팀 로고 가져오기
      teamIds.length > 0
        ? supabase.from('teams').select('id, logo').in('id', teamIds)
        : Promise.resolve({ data: [] }),
        
      // 리그 로고 가져오기
      leagueIds.length > 0
        ? supabase.from('leagues').select('id, logo').in('id', leagueIds)
        : Promise.resolve({ data: [] })
    ]);
    
    // 5. 로고 맵핑 구성
    const teamLogoMap: Record<number, string> = {};
    (teamsResult.data || []).forEach((team: { id: number; logo: string | null }) => { 
      if (team.id) teamLogoMap[team.id] = team.logo || '';
    });
    
    const leagueLogoMap: Record<number, string> = {};
    (leaguesResult.data || []).forEach((league: { id: number; logo: string | null }) => { 
      if (league.id) leagueLogoMap[league.id] = league.logo || '';
    });
    
    // 6. 댓글 수 구하기 - 최적화된 단일 쿼리
    const commentCounts: Record<string, number> = {};
    const postIds = filteredValidPosts.map(post => post.id);

    if (postIds.length > 0) {
      // 모든 게시물의 댓글을 한 번에 가져와서 그룹화
      const { data: commentsData } = await supabase
        .from('comments')
        .select('post_id')
        .in('post_id', postIds)
        .neq('is_hidden', true)
        .neq('is_deleted', true);

      // 게시물별 댓글 수 계산
      if (commentsData) {
        commentsData.forEach((comment: { post_id: string | null }) => {
          if (comment.post_id) {
            commentCounts[comment.post_id] = (commentCounts[comment.post_id] || 0) + 1;
          }
        });
      }

      // 댓글이 없는 게시물은 0으로 초기화
      filteredValidPosts.forEach(post => {
        if (!(post.id in commentCounts)) {
          commentCounts[post.id] = 0;
        }
      });
    }

    // 7. 처리된 데이터 생성
    const processedPosts: TopicPost[] = [];

    for (const post of filteredValidPosts) {
      if (!post || !post.id) continue;
      
      const boardInfo = post.board_id && boardMap[post.board_id]
        ? boardMap[post.board_id]
        : { name: '알 수 없음', slug: post.board_id || '', team_id: null, league_id: null };
        
      const teamId = boardInfo.team_id;
      const leagueId = boardInfo.league_id;
      
      const teamLogo = teamId !== null ? teamLogoMap[teamId] || null : null;
      const leagueLogo = leagueId !== null ? leagueLogoMap[leagueId] || null : null;
      
      processedPosts.push({
        id: post.id,
        title: post.title || '',
        created_at: post.created_at || '',
        board_id: post.board_id || '',
        board_name: boardInfo.name,
        board_slug: boardInfo.slug,
        post_number: post.post_number || 0,
        comment_count: commentCounts[post.id] || 0,
        views: post.views || 0,
        likes: post.likes || 0,
        team_id: teamId,
        league_id: leagueId,
        team_logo: teamLogo,
        league_logo: leagueLogo,
        content: typeof post.content === 'string' ? post.content : (post.content ? JSON.stringify(post.content) : undefined)
      });
    }
    
    // 8. 결과 정렬 및 상위 20개만 반환
    let result: TopicPost[];
    
    if (type === 'views') {
      result = [...processedPosts].sort((a, b) => b.views - a.views).slice(0, 20);
    } else if (type === 'likes') {
      result = [...processedPosts].sort((a, b) => b.likes - a.likes).slice(0, 20);
    } else { // comments
      result = [...processedPosts]
        .sort((a, b) => b.comment_count - a.comment_count)
        .slice(0, 20);
    }
    
    return result;
  } catch {
    // 오류 발생 시 빈 배열 반환
    return [];
  }
}); 