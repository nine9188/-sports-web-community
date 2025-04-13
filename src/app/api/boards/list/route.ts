import { createClient } from '@/app/lib/supabase.server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // 이 API는 항상 동적으로 실행

// 게시판 타입 정의
interface Board {
  id: string;
  name: string;
  parent_id: string | null;
  display_order: number;
  slug: string;
  team_id?: string | null;
  league_id?: string | null;
  team_logo?: string | null;
  league_logo?: string | null;
  children?: Board[];
}

export const revalidate = 300; // 5분마다 재검증

export async function GET() {
  try {
    const supabase = await createClient();
    
    // 1. 모든 게시판 가져오기 (한 번의 쿼리로)
    const { data, error } = await supabase
      .from('boards')
      .select('id, name, parent_id, display_order, slug, team_id, league_id')
      .order('display_order', { ascending: true })
      .order('name');
      
    if (error) {
      return NextResponse.json(
        { error: '게시판 목록을 가져오는데 실패했습니다.' }, 
        { status: 500 }
      );
    }
    
    // 2. 팀 및 리그 로고 가져오기 (필요한 경우)
    const teamIds = data
      .filter(board => board.team_id)
      .map(board => board.team_id);
      
    const leagueIds = data
      .filter(board => board.league_id)
      .map(board => board.league_id);
    
    const [teamsResult, leaguesResult] = await Promise.all([
      // 팀 로고 가져오기
      teamIds.length > 0
        ? supabase
            .from('teams')
            .select('id, logo')
            .in('id', teamIds)
        : Promise.resolve({ data: [] }),
        
      // 리그 로고 가져오기
      leagueIds.length > 0
        ? supabase
            .from('leagues')
            .select('id, logo')
            .in('id', leagueIds)
        : Promise.resolve({ data: [] })
    ]);
    
    // 3. 로고 맵 생성
    const teamLogoMap: Record<string, string> = {};
    const leagueLogoMap: Record<string, string> = {};
    
    (teamsResult.data || []).forEach(team => {
      if (team && team.id) {
        teamLogoMap[team.id] = team.logo || '';
      }
    });
    
    (leaguesResult.data || []).forEach(league => {
      if (league && league.id) {
        leagueLogoMap[league.id] = league.logo || '';
      }
    });
    
    // 4. 게시판 데이터 강화 (로고 정보 추가)
    const enrichedBoards = data.map(board => ({
      ...board,
      team_logo: board.team_id ? teamLogoMap[board.team_id] : null,
      league_logo: board.league_id ? leagueLogoMap[board.league_id] : null
    }));
    
    // 5. 계층 구조로 변환
    const boardsMap: Record<string, Board> = {};
    const rootBoards: Board[] = [];
    
    // 모든 게시판을 맵에 추가
    enrichedBoards.forEach(board => {
      boardsMap[board.id] = { ...board, children: [] };
    });
    
    // 부모-자식 관계 설정
    Object.values(boardsMap).forEach(board => {
      if (board.parent_id && boardsMap[board.parent_id]) {
        boardsMap[board.parent_id].children!.push(board);
      } else if (!board.parent_id) {
        rootBoards.push(board);
      }
    });
    
    // 최상위 게시판 정렬
    rootBoards.sort((a, b) => {
      if (a.display_order !== b.display_order) {
        return a.display_order - b.display_order;
      }
      return a.name.localeCompare(b.name);
    });
    
    // 6. 결과 반환
    const result = {
      rootBoards,
      boardsMap,
      allBoards: enrichedBoards
    };
    
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: '게시판 목록을 가져오는데 실패했습니다.' }, 
      { status: 500 }
    );
  }
} 