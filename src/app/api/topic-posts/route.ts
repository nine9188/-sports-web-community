import { NextResponse } from 'next/server';
import { createClient } from "@/app/lib/supabase.server";

export const dynamic = 'force-dynamic';
export const revalidate = 0; // 캐시 비활성화

export async function GET() {
  try {
    const supabase = await createClient();
    
    // 1. 인기 게시글 가져오기 (시간 제한 없이 조회수 기준으로 정렬)
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, title, post_number, board_id, content, created_at, views, likes, dislikes')
      .order('views', { ascending: false })
      .limit(100);
    
    if (postsError) {
      console.error('게시글 조회 오류:', postsError);
      return NextResponse.json({ error: '게시글 불러오기 실패' }, { status: 500 });
    }
    
    if (!posts || posts.length === 0) {
      return NextResponse.json(
        { views: [], likes: [], comments: [] },
        { status: 200 }
      );
    }
    
    // 2. 게시글별 댓글 수 조회
    const postIds = posts.map(post => post.id);
    
    // 각 게시물에 대해 개별적으로 댓글 수 조회
    const commentsPromises = postIds.map(postId => 
      supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId)
    );
    
    const commentsResults = await Promise.all(commentsPromises);
    
    const commentCountMap: Record<string, number> = {};
    postIds.forEach((postId, index) => {
      commentCountMap[postId] = commentsResults[index].count || 0;
    });
    
    // 3. 댓글 수 정보 추가
    const postsWithComments = posts.map(post => ({
      ...post,
      comment_count: commentCountMap[post.id] || 0
    }));
    
    // 4. 게시판 정보 가져오기
    const boardIds = [...new Set(posts.map(post => post.board_id))];
    
    const { data: boards, error: boardsError } = await supabase
      .from('boards')
      .select('id, name, slug, team_id, league_id')
      .in('id', boardIds);
    
    if (boardsError) {
      console.error('게시판 정보 조회 오류:', boardsError);
      // 게시판 정보 오류는 치명적이지 않으므로 계속 진행
    }
    
    // 게시판 정보 매핑
    interface BoardInfo {
      id: string;
      name: string;
      slug: string;
      team_id: number | null;
      league_id: number | null;
    }
    
    const boardMap: Record<string, BoardInfo> = {};
    if (boards) {
      boards.forEach(board => {
        boardMap[board.id] = board;
      });
    }
    
    // 5. 팀과 리그 정보 (로고) 가져오기
    const teamIds = boards
      ?.filter(board => board.team_id)
      .map(board => board.team_id)
      .filter(Boolean) || [];
      
    const leagueIds = boards
      ?.filter(board => board.league_id)
      .map(board => board.league_id)
      .filter(Boolean) || [];
      
    // 병렬로 팀과 리그 정보 가져오기
    const [teamsResult, leaguesResult] = await Promise.all([
      teamIds.length > 0
        ? supabase.from('teams').select('id, logo').in('id', teamIds)
        : Promise.resolve({ data: [] }),
        
      leagueIds.length > 0
        ? supabase.from('leagues').select('id, logo').in('id', leagueIds)
        : Promise.resolve({ data: [] })
    ]);
    
    // 로고 매핑
    const teamLogoMap: Record<number, string> = {};
    const leagueLogoMap: Record<number, string> = {};
    
    if (teamsResult.data) {
      teamsResult.data.forEach((team: { id: number; logo?: string }) => {
        if (team && team.id) {
          teamLogoMap[team.id] = team.logo || '';
        }
      });
    }
    
    if (leaguesResult.data) {
      leaguesResult.data.forEach((league: { id: number; logo?: string }) => {
        if (league && league.id) {
          leagueLogoMap[league.id] = league.logo || '';
        }
      });
    }
    
    // 6. 최종 데이터 생성
    const enrichedPosts = postsWithComments.map(post => {
      const boardInfo = boardMap[post.board_id] || { 
        name: '알 수 없음', 
        slug: post.board_id, 
        team_id: null, 
        league_id: null 
      };
      
      const teamId = boardInfo.team_id;
      const leagueId = boardInfo.league_id;
      
      return {
        ...post,
        board_name: boardInfo.name,
        board_slug: boardInfo.slug,
        team_id: teamId,
        league_id: leagueId,
        team_logo: teamId ? teamLogoMap[teamId] || null : null,
        league_logo: leagueId ? leagueLogoMap[leagueId] || null : null
      };
    });
    
    // 7. 다양한 정렬 기준으로 데이터 준비
    const result = {
      views: [...enrichedPosts].sort((a, b) => b.views - a.views).slice(0, 20),
      likes: [...enrichedPosts].sort((a, b) => b.likes - a.likes).slice(0, 20),
      comments: [...enrichedPosts].sort((a, b) => b.comment_count - a.comment_count).slice(0, 20)
    };
    
    return NextResponse.json(result, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, s-maxage=600' // 5분 캐시
      }
    });
    
  } catch {
    return NextResponse.json(
      { error: '인기 게시물을 가져오는데 실패했습니다.' },
      { status: 500 }
    );
  }
} 