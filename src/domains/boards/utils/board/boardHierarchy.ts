// 게시판 계층 구조 관련 유틸리티 함수
import { Board, BoardMap, ChildBoardsMap } from '../../types/board';
import { Breadcrumb } from '../../types/board/data';

/**
 * 현재 게시판의 상위 계층 구조를 포함한 경로를 생성합니다.
 * @param currentBoard 현재 게시판 정보
 * @param boardsMap 모든 게시판 맵
 * @returns 브레드크럼 경로 배열
 */
export function generateBoardBreadcrumbs(currentBoard: Board, boardsMap: BoardMap): Breadcrumb[] {
  const boardPath: Breadcrumb[] = [];
  
  // 현재 게시판 추가
  boardPath.push({
    id: currentBoard.id,
    name: currentBoard.name,
    slug: currentBoard.slug || currentBoard.id
  });
  
  // 상위 게시판들 추적
  let parentId = currentBoard.parent_id;
  while (parentId) {
    const parentBoard = boardsMap[parentId];
    if (parentBoard) {
      boardPath.unshift({
        id: parentBoard.id,
        name: parentBoard.name,
        slug: parentBoard.slug || parentBoard.id
      });
      parentId = parentBoard.parent_id;
    } else {
      break;
    }
  }
  
  return boardPath;
}

/**
 * 최상위 게시판을 찾습니다.
 * @param boardId 현재 게시판 ID
 * @param boardsMap 모든 게시판 맵
 * @returns 최상위 게시판 ID
 */
export function findRootBoard(boardId: string, boardsMap: BoardMap): string {
  let currentId = boardId;
  while (boardsMap[currentId]?.parent_id) {
    currentId = boardsMap[currentId].parent_id || '';
    if (!currentId) break;
  }
  return currentId;
}

/**
 * 게시판의 레벨을 결정합니다(최상위/상위/하위).
 * @param boardId 게시판 ID
 * @param boardsMap 모든 게시판 맵
 * @param childBoardsMap 자식 게시판 맵
 * @returns 게시판 레벨 (top, mid, bottom)
 */
export function getBoardLevel(
  boardId: string, 
  boardsMap: BoardMap, 
  childBoardsMap: ChildBoardsMap
): 'top' | 'mid' | 'bottom' {
  // 부모가 없으면 최상위 게시판
  if (!boardsMap[boardId]?.parent_id) {
    return 'top';
  }
  
  // 부모가 있고 자식이 있으면 상위 게시판
  if (boardsMap[boardId]?.parent_id && childBoardsMap[boardId]?.length > 0) {
    return 'mid';
  }
  
  // 부모가 있고 자식이 없으면 하위 게시판
  return 'bottom';
}

/**
 * 게시판 계층에 따른 필터링할 게시판 ID 목록을 가져옵니다.
 * @param boardId 게시판 ID
 * @param boardLevel 게시판 레벨
 * @param boardsMap 모든 게시판 맵
 * @param childBoardsMap 자식 게시판 맵
 * @returns 필터링된 게시판 ID 배열
 */
export function getFilteredBoardIds(
  boardId: string, 
  boardLevel: string, 
  boardsMap: BoardMap, 
  childBoardsMap: ChildBoardsMap
): string[] {
  const result = new Set<string>();
  
  // 최상위 게시판: 모든 하위 게시판 포함
  if (boardLevel === 'top') {
    // 자신 추가
    result.add(boardId);
    
    // 직접 하위 게시판 추가
    if (childBoardsMap[boardId]) {
      for (const child of childBoardsMap[boardId]) {
        result.add(child.id);
        
        // 하위 게시판의 하위 게시판 추가 (손자)
        if (childBoardsMap[child.id]) {
          for (const grandChild of childBoardsMap[child.id]) {
            result.add(grandChild.id);
          }
        }
      }
    }
  } 
  // 상위 게시판: 자신과 직접 하위 게시판
  else if (boardLevel === 'mid') {
    // 자신 추가
    result.add(boardId);
    
    // 직접 하위 게시판 추가
    if (childBoardsMap[boardId]) {
      for (const child of childBoardsMap[boardId]) {
        result.add(child.id);
      }
    }
  } 
  // 하위 게시판: 자신만 포함
  else {
    result.add(boardId);
  }
  
  return Array.from(result);
}

/**
 * 브레드크럼 생성 함수 - 게시글용
 * @param board 게시판 정보
 * @param postTitle 게시글 제목
 * @param postNumber 게시글 번호
 * @param boardsMap 모든 게시판 맵
 * @returns 브레드크럼 배열
 */
export function createBreadcrumbs(
  board: Board, 
  postTitle: string, 
  postNumber: string,
  boardsMap: BoardMap
): Breadcrumb[] {
  // 게시판 계층 구조를 따라 브레드크럼 생성
  const boardBreadcrumbs = generateBoardBreadcrumbs(board, boardsMap);
  
  // 게시글 번호 추가
  const breadcrumbs = [
    ...boardBreadcrumbs,
    {
      id: 'post',
      name: `#${postNumber}`,
      slug: '#'
    }
  ];
  
  return breadcrumbs;
} 