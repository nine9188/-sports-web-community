'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllBoards,
  createBoard,
  updateBoard,
  deleteBoard,
  swapBoardOrder,
  type Board,
} from '../actions/boards';
import { adminKeys } from '@/shared/constants/queryKeys';

// 계층 구조로 게시판 데이터 변환
function createBoardStructure(boardsData: Board[]): Board[] {
  const processedBoards = boardsData.map((board) => ({
    ...board,
    level: 0,
    children: [] as Board[],
  }));

  const boardMap: Record<string, Board> = {};
  processedBoards.forEach((board) => {
    boardMap[board.id] = board;
  });

  const rootBoards: Board[] = [];

  processedBoards.forEach((board) => {
    if (board.parent_id && boardMap[board.parent_id]) {
      if (!boardMap[board.parent_id].children) {
        boardMap[board.parent_id].children = [];
      }
      board.level = 1;
      boardMap[board.parent_id].children!.push(board);
    } else if (!board.parent_id) {
      rootBoards.push(board);
    }
  });

  rootBoards.sort((a, b) => a.display_order - b.display_order);

  processedBoards.forEach((board) => {
    if (board.children && board.children.length > 0) {
      (board.children as Board[]).sort((a, b) => a.display_order - b.display_order);

      (board.children as Board[]).forEach((child) => {
        child.level = (board.level || 0) + 1;

        if (child.children && child.children.length > 0) {
          const setChildLevels = (children: Board[], parentLevel: number) => {
            children.forEach((grandChild) => {
              grandChild.level = parentLevel + 1;
              if (grandChild.children && grandChild.children.length > 0) {
                setChildLevels(grandChild.children, grandChild.level);
              }
            });
          };

          setChildLevels(child.children as Board[], child.level);
        }
      });
    }
  });

  return rootBoards;
}

// 계층 구조를 평면화
function flattenStructuredBoards(structuredBoards: Board[]): Board[] {
  const result: Board[] = [];

  const addBoardToResult = (board: Board) => {
    result.push(board);
    if (board.children && board.children.length > 0) {
      board.children.forEach((child) => addBoardToResult(child));
    }
  };

  structuredBoards.forEach((board) => addBoardToResult(board));
  return result;
}

export function useAdminBoards() {
  const query = useQuery({
    queryKey: adminKeys.boards(),
    queryFn: async () => {
      const result = await getAllBoards();
      if (!result.success) {
        throw new Error(result.error || '게시판 목록을 불러오는데 실패했습니다.');
      }
      return result.data!;
    },
    staleTime: 1000 * 60 * 2, // 2분
  });

  // 계층 구조 데이터 계산
  const structuredBoards = query.data ? createBoardStructure(query.data) : [];
  const flatBoards = flattenStructuredBoards(structuredBoards);

  return {
    ...query,
    boards: query.data || [],
    structuredBoards,
    flatBoards,
  };
}

export function useCreateBoardMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBoard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.boards() });
    },
  });
}

export function useUpdateBoardMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: Parameters<typeof updateBoard>[1] }) =>
      updateBoard(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.boards() });
    },
  });
}

export function useDeleteBoardMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBoard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.boards() });
    },
  });
}

export function useSwapBoardOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      boardId,
      targetId,
      boardOrder,
      targetOrder,
    }: {
      boardId: string;
      targetId: string;
      boardOrder: number;
      targetOrder: number;
    }) => swapBoardOrder(boardId, targetId, boardOrder, targetOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.boards() });
    },
  });
}
