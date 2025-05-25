'use server';

import { createClient } from '@/shared/api/supabaseServer';
import { BoardMap, ChildBoardsMap } from '../types/board';
import { getBoardLevel, getFilteredBoardIds, findRootBoard, generateBoardBreadcrumbs } from '../utils/board/boardHierarchy';
import { BoardsResponse, Board, HierarchicalBoard } from '@/domains/boards/types';

/**
 * 모든 게시판 목록을 가져옵니다.
 */
export async function getAllBoards() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .order('name');
    
  if (error) {
    throw new Error('게시판 목록을 가져오는 중 오류가 발생했습니다.');
  }
  
  return data;
}

/**
 * 게시판 정보를 슬러그 또는 ID로 가져옵니다.
 */
export async function getBoardBySlugOrId(slugOrId: string) {
  const supabase = await createClient();
  let query = supabase.from('boards').select('*');
  
  // 슬러그가 숫자로만 구성된 경우 ID로 처리
  if (/^\d+$/.test(slugOrId)) {
    query = query.eq('id', slugOrId);
  } else {
    query = query.eq('slug', slugOrId);
  }
  
  const { data, error } = await query.single();
  
  if (error) {
    throw new Error('게시판을 찾을 수 없습니다.');
  }
  
  return data;
}

/**
 * 게시판 페이지에 필요한 모든 데이터를 가져옵니다.
 */
export async function getBoardPageData(slug: string, currentPage: number, fromParam?: string) {
  try {
    const supabase = await createClient();
    
    // 사용자 인증 확인 (로그인 상태)
    const { data: userData } = await supabase.auth.getUser();
    const isLoggedIn = !!userData?.user;
    
    // 병렬로 데이터 요청 처리
    const [boardResult, allBoardsResult] = await Promise.all([
      // 1. 현재 slug로 게시판 정보 조회
      supabase
        .from('boards')
        .select('*')
        .eq('slug', slug)
        .single(),
      
      // 2. 모든 게시판 조회 (계층 구조 파악을 위해)
      supabase
        .from('boards')
        .select('*')
    ]);
    
    // 게시판 검증
    if (boardResult.error) {
      return {
        success: false,
        error: '게시판을 찾을 수 없습니다.'
      };
    }
    
    const boardData = boardResult.data;
    const allBoardsData = allBoardsResult.data || [];
    
    // 3. 게시판 계층 구조 설정
    const boardsMap: BoardMap = {};
    const childBoardsMap: ChildBoardsMap = {};
    const boardNameMap: Record<string, string> = {};
    
    // 모든 게시판 정보 맵핑
    allBoardsData.forEach(board => {
      const safeBoard = {
        ...board,
        slug: board.slug || board.id,
        display_order: board.display_order || 0
      };
      boardsMap[board.id] = safeBoard;
      boardNameMap[board.id] = board.name;
      
      // 부모 ID 기준으로 자식 게시판 맵핑
      if (board.parent_id) {
        if (!childBoardsMap[board.parent_id]) {
          childBoardsMap[board.parent_id] = [];
        }
        childBoardsMap[board.parent_id].push(safeBoard);
      }
    });
    
    // 4. 브레드크럼 생성
    const safeBoardData = {
      ...boardData,
      slug: boardData.slug || boardData.id
    };
    const breadcrumbs = generateBoardBreadcrumbs(safeBoardData, boardsMap);
    
    // 현재 게시판의 레벨 결정 (최상위, 상위, 하위)
    const boardLevel = getBoardLevel(boardData.id, boardsMap, childBoardsMap);
    
    // fromParam 처리: 
    // - from=boards인 경우 현재 게시판만 표시
    // - fromParam이 유효한 게시판 ID인 경우 해당 게시판 필터링
    // - 그 외의 경우 기본 필터링 적용
    let filteredBoardIds: string[] = [];
    
    if (fromParam === 'boards') {
      // 현재 게시판만 표시
      filteredBoardIds = [boardData.id];
    } else if (fromParam && boardsMap[fromParam]) {
      // fromParam이 유효한 게시판 ID인 경우 해당 게시판 관련 게시글 표시
      const fromBoardLevel = getBoardLevel(fromParam, boardsMap, childBoardsMap);
      filteredBoardIds = getFilteredBoardIds(fromParam, fromBoardLevel, boardsMap, childBoardsMap);
    } else {
      // 기본 필터링 적용
      filteredBoardIds = getFilteredBoardIds(boardData.id, boardLevel, boardsMap, childBoardsMap);
    }
    
    // 최상위 게시판의 ID 및 slug 확인
    const rootBoardId = findRootBoard(boardData.id, boardsMap);
    const rootBoardSlug = boardsMap[rootBoardId]?.slug || rootBoardId;
    
    // 팀/리그 데이터 병렬 요청
    let teamData = null;
    let leagueData = null;
    
    if (boardData.team_id || boardData.league_id) {
      const [teamResult, leagueResult] = await Promise.all([
        boardData.team_id 
          ? supabase
              .from('teams')
              .select('*')
              .eq('id', boardData.team_id)
              .single()
          : Promise.resolve({ data: null }),
          
        boardData.league_id 
          ? supabase
              .from('leagues')
              .select('*')
              .eq('id', boardData.league_id)
              .single()
          : Promise.resolve({ data: null })
      ]);
      
      // 팀 데이터 처리
      if (teamResult.data) {
        const team = teamResult.data;
        teamData = {
          team: {
            id: team.id,
            name: team.name,
            country: team.country || '',
            founded: team.founded || 0,
            logo: team.logo || 'https://via.placeholder.com/80'
          },
          venue: {
            name: team.venue_name || 'Unknown',
            city: team.venue_city || '',
            capacity: team.venue_capacity || 0
          }
        };
      }
      
      // 리그 데이터 처리
      if (leagueResult.data) {
        const league = leagueResult.data;
        leagueData = {
          id: league.id,
          name: league.name,
          country: league.country || '',
          logo: league.logo || 'https://via.placeholder.com/80'
        };
      }
    }
    
    return {
      success: true,
      boardData,
      breadcrumbs,
      filteredBoardIds,
      teamData,
      leagueData,
      isLoggedIn,
      childBoardsMap,
      rootBoardId,
      rootBoardSlug
    };
  } catch (error) {
    console.error("getBoardPageData Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '게시판 정보를 불러오는 중 오류가 발생했습니다.'
    };
  }
}

/**
 * boards 배열을 계층 구조(hierarchical)로 변환하는 함수
 */
function buildHierarchicalBoards(boards: Board[]): HierarchicalBoard[] {
  const boardMap: Record<string, HierarchicalBoard> = {};
  const roots: HierarchicalBoard[] = [];

  boards.forEach((board) => {
    boardMap[board.id] = { ...board };
  });

  boards.forEach((board) => {
    if (board.parent_id && boardMap[board.parent_id]) {
      const parent = boardMap[board.parent_id];
      if (!parent.children) parent.children = [];
      parent.children.push(boardMap[board.id]);
    } else {
      roots.push(boardMap[board.id]);
    }
  });

  return roots;
}

/**
 * 게시판 목록 조회
 */
export async function getBoards(): Promise<BoardsResponse> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('boards')
      .select('id, name, parent_id, display_order, slug, team_id, league_id, description, access_level, logo, views')
      .order('display_order', { ascending: true })
      .order('name');

    if (error) {
      console.error('게시판 목록 조회 오류:', error);
      throw new Error('게시판 목록 조회 실패');
    }

    const boards = (data || []) as Board[];
    const hierarchical = buildHierarchicalBoards(boards);
    return { boards, hierarchical };
  } catch (error) {
    console.error('게시판 데이터 불러오기 오류:', error);
    return { boards: [], hierarchical: [] };
  }
} 