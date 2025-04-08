import { createClient } from '@/app/lib/supabase-server';
import { Board, BoardData, ChildBoard, TopBoard } from '@/app/types/board';

// 최상위까지의 모든 하위 게시판 ID 가져오기 (재귀)
export async function getAllSubBoardIds(parentId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data: directSubBoards, error } = await supabase
    .from('boards')
    .select('id')
    .eq('parent_id', parentId);
    
  if (error || !directSubBoards || directSubBoards.length === 0) {
    return [];
  }
  
  const allIds = directSubBoards.map(b => b.id);
  
  // 각 하위 게시판에 대해 재귀적으로 더 깊은 레벨의 하위 게시판 ID 가져오기
  const deeperLevelPromises = directSubBoards.map(subBoard => 
    getAllSubBoardIds(subBoard.id)
  );
  
  const deeperLevelIds = await Promise.all(deeperLevelPromises);
  
  // 모든 레벨의 ID를 합치기
  return [...allIds, ...deeperLevelIds.flat()];
}

// 게시판 정보 가져오기
export async function getBoardBySlug(slug: string) {
  const supabase = await createClient();
  const { data: board, error } = await supabase
    .from('boards')
    .select('*, parent:parent_id(*)')
    .eq('slug', slug)
    .single();
    
  if (error || !board) {
    throw new Error(error?.message || '게시판 데이터 없음');
  }
  
  return board;
}

// 루트 게시판 ID 찾기
export async function getRootBoardId(board: Board): Promise<string> {
  const supabase = await createClient();
  let rootBoardId = board.id;
  let currentBoard = board;
  
  // 현재 게시판이 하위 게시판인 경우 최상위까지 올라가기
  while (currentBoard.parent_id) {
    rootBoardId = currentBoard.parent_id;
    const { data: parentBoard } = await supabase
      .from('boards')
      .select('*, parent:parent_id(*)')
      .eq('id', currentBoard.parent_id)
      .single();
    
    if (!parentBoard) break;
    currentBoard = parentBoard;
  }
  
  return rootBoardId;
}

// 최상위 게시판의 직계 하위 게시판들 가져오기
export async function getTopLevelBoards(rootBoardId: string) {
  const supabase = await createClient();
  const { data: topLevelBoards } = await supabase
    .from('boards')
    .select('*')
    .eq('parent_id', rootBoardId)
    .order('name', { ascending: true });
    
  return topLevelBoards || [];
}

// 모든 게시판 데이터 맵 생성
export async function getBoardsDataMap(boardIds: string[]) {
  const supabase = await createClient();
  const { data: allBoards } = await supabase
    .from('boards')
    .select('id, name, parent_id, slug, team_id, league_id')
    .in('id', boardIds);
    
  const boardNameMap = (allBoards || []).reduce((map, board) => {
    map[board.id] = board.name;
    return map;
  }, {} as Record<string, string>);
  
  const boardsData = (allBoards || []).reduce((map, board) => {
    map[board.id] = { 
      team_id: board.team_id || null, 
      league_id: board.league_id || null,
      slug: board.slug || board.id
    };
    return map;
  }, {} as Record<string, BoardData>);
  
  return { boardNameMap, boardsData, allBoards: allBoards || [] };
}

// HoverMenu 데이터 준비
export async function prepareHoverMenuData(
  topLevelBoards: Board[], 
  rootBoardId: string,
  boardsData: Record<string, BoardData>
) {
  const supabase = await createClient();
  const allBoardsUnderRoot: Record<string, Board[]> = {};
  
  if (topLevelBoards && topLevelBoards.length > 0) {
    for (const topBoard of topLevelBoards) {
      const { data: childBoards } = await supabase
        .from('boards')
        .select('*')
        .eq('parent_id', topBoard.id)
        .order('name', { ascending: true });
      
      allBoardsUnderRoot[topBoard.id] = childBoards || [];
    }
  }
  
  // 현재 선택된 탭 식별 로직은 컴포넌트 레벨에서 처리
  
  // HoverMenu 데이터 변환 함수
  const getBoardSlug = (boardId: string) => boardsData[boardId]?.slug || boardId;
  
  const topLevelBoardsWithSlug = topLevelBoards.map(board => ({
    ...board,
    slug: board.slug || getBoardSlug(board.id) || board.id,
    display_order: board.display_order || 0
  })) as TopBoard[];
  
  const childBoardsMapWithSlug = Object.keys(allBoardsUnderRoot).reduce((acc, topBoardId) => {
    acc[topBoardId] = allBoardsUnderRoot[topBoardId].map(childBoard => ({
      ...childBoard,
      slug: childBoard.slug || getBoardSlug(childBoard.id) || childBoard.id,
      display_order: childBoard.display_order || 0
    }));
    return acc;
  }, {} as Record<string, ChildBoard[]>);
  
  return { topLevelBoardsWithSlug, childBoardsMapWithSlug, allBoardsUnderRoot };
}

// 브레드크럼 생성
export function createBreadcrumbs(board: Board, postTitle?: string, postNumber?: string) {
  // 최상위 게시판(게시판 목록)부터 시작
  const breadcrumbs = [
    {
      id: 'boards',
      name: '해외축구',
      slug: 'soccer'
    }
  ];
  
  // 부모 게시판 추가
  if (board.parent) {
    breadcrumbs.push({
      id: board.parent.id,
      name: board.parent.name,
      slug: board.parent.slug || board.parent.id
    });
  }
  
  // 현재 게시판 추가
  breadcrumbs.push({
    id: board.id,
    name: board.name,
    slug: board.slug || board.id
  });
  
  // 게시글 제목이 있는 경우 추가
  if (postTitle && postNumber) {
    breadcrumbs.push({
      id: `post-${postNumber}`,
      name: postTitle,
      slug: `${board.slug || board.id}/${postNumber}`
    });
  }
  
  return breadcrumbs;
}

// 현재 선택된 탭 식별
export function getActiveTabId(
  board: Board, 
  rootBoardId: string, 
  topLevelBoards: Board[], 
  allBoardsUnderRoot: Record<string, Board[]>
) {
  let activeTabId = rootBoardId; // 기본값은 루트
  
  if (board.parent_id) {
    // 현재 게시판이 최하위 게시판인 경우
    if (topLevelBoards && topLevelBoards.some(tb => tb.id === board.parent_id)) {
      activeTabId = board.parent_id;
    } 
    // 현재 게시판이 중간 레벨 게시판인 경우
    else {
      for (const topBoardId in allBoardsUnderRoot) {
        if (allBoardsUnderRoot[topBoardId].some(b => b.id === board.id)) {
          activeTabId = topBoardId;
          break;
        }
      }
    }
  }
  
  return activeTabId;
} 