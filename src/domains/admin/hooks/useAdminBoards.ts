'use client';

import { useEffect } from 'react';
import {
  getAllBoards,
  createBoard,
  updateBoard,
  deleteBoard,
  swapBoardOrder,
  type Board,
} from '../actions/boards';
import { useAsyncData, useAsyncMutation } from './useLocalAsync';

const listeners = new Set<() => void>();

function notifyBoardsChanged() {
  listeners.forEach((listener) => listener());
}

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
      boardMap[board.parent_id].children ||= [];
      board.level = 1;
      boardMap[board.parent_id].children!.push(board);
    } else if (!board.parent_id) {
      rootBoards.push(board);
    }
  });

  rootBoards.sort((a, b) => a.display_order - b.display_order);

  const setChildLevels = (children: Board[], parentLevel: number) => {
    children.sort((a, b) => a.display_order - b.display_order);
    children.forEach((child) => {
      child.level = parentLevel + 1;
      if (child.children && child.children.length > 0) {
        setChildLevels(child.children as Board[], child.level);
      }
    });
  };

  rootBoards.forEach((board) => {
    if (board.children && board.children.length > 0) {
      setChildLevels(board.children as Board[], board.level || 0);
    }
  });

  return rootBoards;
}

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
  const query = useAsyncData(async () => {
    const result = await getAllBoards();
    if (!result.success) {
      throw new Error(result.error || '게시판 목록을 불러오지 못했습니다.');
    }
    return result.data!;
  });

  useEffect(() => {
    listeners.add(query.refetch);
    return () => {
      listeners.delete(query.refetch);
    };
  }, [query.refetch]);

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
  return useAsyncMutation(createBoard, notifyBoardsChanged);
}

export function useUpdateBoardMutation() {
  return useAsyncMutation(
    ({ id, formData }: { id: string; formData: Parameters<typeof updateBoard>[1] }) =>
      updateBoard(id, formData),
    notifyBoardsChanged
  );
}

export function useDeleteBoardMutation() {
  return useAsyncMutation((id: string) => deleteBoard(id), notifyBoardsChanged);
}

export function useSwapBoardOrderMutation() {
  return useAsyncMutation(
    ({
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
    notifyBoardsChanged
  );
}
