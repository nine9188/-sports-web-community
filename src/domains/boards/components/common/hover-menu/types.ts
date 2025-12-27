/**
 * HoverMenu 관련 타입 정의
 */

export interface ChildBoard {
  id: string;
  name: string;
  display_order: number;
  slug?: string;
}

export interface TopBoard {
  id: string;
  name: string;
  display_order: number;
  slug?: string;
}

export interface HoverMenuProps {
  currentBoardId: string;
  topBoards: TopBoard[];
  childBoardsMap: Record<string, ChildBoard[]>;
  rootBoardId: string;
  rootBoardSlug?: string;
}

export interface PrefetchedData {
  topBoards: TopBoard[];
  childBoardsMap: Record<string, ChildBoard[]>;
  isServerFetched: boolean;
}
