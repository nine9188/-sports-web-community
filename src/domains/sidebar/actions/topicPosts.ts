'use server'

import { createClient } from '@/shared/api/supabaseServer';
import { cache } from 'react';
import { TopicPost } from '../types';

/**
 * 인기글 목록을 유형별로 조회하는 서버 액션
 * React.cache로 래핑하여 중복 요청 방지
 */
export const getCachedTopicPosts = cache(async (type: 'views' | 'likes' | 'comments'): Promise<TopicPost[]> => {
  try {
    // 서버 컴포넌트에서 Supabase 클라이언트 생성
    const supabase = await createClient();
    
    // 1. 글 목록 가져오기 (정렬 기준에 따라)
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
        content
      `)
      .limit(200);
      
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
    
    const validPosts = (postsData || []) as {
      id: string;
      title?: string;
      created_at?: string;
      board_id?: string;
      views?: number;
      likes?: number;
      post_number?: number;
      content?: string;
    }[];
    
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
    
    // 6. 댓글 수 구하기
    const commentCounts: Record<string, number> = {};
    
    if (type === 'comments') {
      // 댓글 정렬 시에는 모든 게시물의 댓글 수를 먼저 계산
      // 각 게시물의 댓글 수를 개별적으로 가져오기
      await Promise.all(
        validPosts.map(async (post) => {
          const { count } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);
          
          commentCounts[post.id] = count || 0;
        })
      );
    } else {
      // 다른 정렬 방식에서는 게시물 20개로 제한하고 나서 댓글 수 가져오기
      // 우선 데이터 처리를 위해 0으로 초기화
      validPosts.forEach(post => {
        commentCounts[post.id] = 0;
      });
    }
    
    // 7. 처리된 데이터 생성
    const processedPosts: TopicPost[] = [];
    
    for (const post of validPosts) {
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
        content: post.content
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