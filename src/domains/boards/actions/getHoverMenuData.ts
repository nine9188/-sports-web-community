'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { cache } from 'react';

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
 * 기존 page.tsx의 200-253줄 로직을 분리
 */
export const getHoverMenuData = cache(async (rootBoardId: string): Promise<HoverMenuData> => {
  const supabase = await getSupabaseServer();

  const { data: boardsData } = await supabase
    .from('boards')
    .select('id, name, display_order, slug, parent_id')
    .order('display_order', { ascending: true });

  const topBoards: HoverMenuBoard[] = [];
  const childBoardsMap: Record<string, HoverMenuBoard[]> = {};

  if (!boardsData) {
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
