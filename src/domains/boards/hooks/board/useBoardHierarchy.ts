// 게시판 계층 구조 관련 훅
import { useState, useEffect } from 'react';
import { Board, BoardMap, ChildBoardsMap } from '../../types/board';
import { getBoardLevel, getFilteredBoardIds, findRootBoard } from '../../utils/board/boardHierarchy';

/**
 * 게시판의 계층 구조 정보를 관리하는 커스텀 훅
 * @param boards 모든 게시판 배열
 * @param currentBoardId 현재 게시판 ID
 * @returns 게시판 계층 구조 정보와 관련 유틸리티 함수
 */
export function useBoardHierarchy(boards: Board[], currentBoardId: string) {
  // 게시판 맵 및 자식 게시판 맵 구성
  const [boardsMap, setBoardsMap] = useState<BoardMap>({});
  const [childBoardsMap, setChildBoardsMap] = useState<ChildBoardsMap>({});
  const [boardNameMap, setBoardNameMap] = useState<Record<string, string>>({});
  const [rootBoardId, setRootBoardId] = useState<string>('');
  const [filteredBoardIds, setFilteredBoardIds] = useState<string[]>([]);
  const [boardLevel, setBoardLevel] = useState<'top' | 'mid' | 'bottom'>('bottom');

  useEffect(() => {
    if (!boards || !currentBoardId) return;

    // 1. 게시판 맵 구성
    const boardsMapTemp: BoardMap = {};
    const childBoardsMapTemp: ChildBoardsMap = {};
    const boardNamesTemp: Record<string, string> = {};

    // 게시판 데이터 맵핑
    boards.forEach(board => {
      boardsMapTemp[board.id] = board;
      boardNamesTemp[board.id] = board.name;

      // 부모 ID 기준으로 자식 게시판 맵핑
      if (board.parent_id) {
        if (!childBoardsMapTemp[board.parent_id]) {
          childBoardsMapTemp[board.parent_id] = [];
        }
        childBoardsMapTemp[board.parent_id].push(board);
      }
    });

    // 2. 루트 게시판 ID 찾기
    const root = findRootBoard(currentBoardId, boardsMapTemp);

    // 3. 현재 게시판의 레벨 확인
    const level = getBoardLevel(currentBoardId, boardsMapTemp, childBoardsMapTemp);

    // 4. 필터링할 게시판 ID 목록 가져오기
    const filteredIds = getFilteredBoardIds(currentBoardId, level, boardsMapTemp, childBoardsMapTemp);

    // 상태 업데이트
    setBoardsMap(boardsMapTemp);
    setChildBoardsMap(childBoardsMapTemp);
    setBoardNameMap(boardNamesTemp);
    setRootBoardId(root);
    setBoardLevel(level);
    setFilteredBoardIds(filteredIds);
  }, [boards, currentBoardId]);

  return {
    boardsMap,
    childBoardsMap,
    boardNameMap,
    rootBoardId,
    boardLevel,
    filteredBoardIds
  };
} 