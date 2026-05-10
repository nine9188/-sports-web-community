'use client';

import { BoardsResponse } from '@/domains/boards/types';

export type { HierarchicalBoard, Board, BoardsResponse } from '@/domains/boards/types';

interface UseBoardsOptions {
  initialData?: BoardsResponse;
}

const EMPTY_BOARDS_RESPONSE: BoardsResponse = {
  boards: [],
  hierarchical: [],
};

export function useBoards(options?: UseBoardsOptions) {
  return {
    data: options?.initialData ?? EMPTY_BOARDS_RESPONSE,
    isLoading: false,
    error: null,
  };
}
