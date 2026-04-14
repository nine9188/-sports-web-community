'use server';

import { cache } from 'react';
import { getCachedAllBoards } from './getCachedBoards';

export interface HoverMenuBoard {
  id: string;
  name: string;
  display_order: number;
  slug?: string;
}

export interface HoverMenuData {
  topBoards: HoverMenuBoard[];
  childBoardsMap: Record<string, HoverMenuBoard[]>;
}

/**
 * HoverMenu용 게시판 데이터 조회
 * - getCachedAllBoards(7일 캐시) 재사용
 * - React cache()는 동일 요청 내 중복 방지용
 */
export const getHoverMenuData = cache(async (rootBoardId: string): Promise<HoverMenuData> => {
  const boardsData = await getCachedAllBoards();

  const topBoards: HoverMenuBoard[] = [];
  const childBoardsMap: Record<string, HoverMenuBoard[]> = {};

  if (!boardsData || boardsData.length === 0) {
    return { topBoards, childBoardsMap };
  }

  // 루트 게시판의 직접 하위 게시판들 (상위 게시판들)
  const rootChildBoards = boardsData.filter(board => board.parent_id === rootBoardId);

  topBoards.push(...rootChildBoards.map(board => ({
    id: board.id,
    name: board.name,
    display_order: board.display_order || 0,
    slug: board.slug || undefined
  })));

  // 모든 하위 게시판 관계 맵핑
  boardsData.forEach(board => {
    if (board.parent_id) {
      if (!childBoardsMap[board.parent_id]) {
        childBoardsMap[board.parent_id] = [];
      }
      childBoardsMap[board.parent_id].push({
        id: board.id,
        name: board.name,
        display_order: board.display_order || 0,
        slug: board.slug || undefined
      });
    }
  });

  return { topBoards, childBoardsMap };
});
