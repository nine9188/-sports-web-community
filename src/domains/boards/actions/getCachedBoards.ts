'use server';

import { cache } from 'react';
import { getSupabaseServer } from '@/shared/lib/supabase/server';

/**
 * 캐시된 모든 게시판 데이터 조회
 *
 * 같은 요청 내에서 여러 번 호출되어도 1번만 DB 쿼리 실행
 * - getBoardPageData()
 * - getHoverMenuData()
 * - getBoardPopularPosts()
 * - getAllChildBoardIds()
 * 등에서 공유하여 사용
 */
export const getCachedAllBoards = cache(async () => {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('boards')
    .select('id, name, slug, parent_id, display_order, team_id, league_id, description, access_level, logo, views, view_type')
    .order('display_order', { ascending: true })
    .order('name');

  if (error) {
    console.error('getCachedAllBoards error:', error);
    return [];
  }

  return data || [];
});

/**
 * 캐시된 게시판 데이터에서 slug로 찾기
 */
export const getCachedBoardBySlug = cache(async (slug: string) => {
  const allBoards = await getCachedAllBoards();
  return allBoards.find(board => board.slug === slug) || null;
});

/**
 * 캐시된 게시판 데이터에서 ID로 찾기
 */
export const getCachedBoardById = cache(async (id: string) => {
  const allBoards = await getCachedAllBoards();
  return allBoards.find(board => board.id === id) || null;
});

/**
 * 캐시된 게시판 데이터에서 slug 또는 ID로 찾기
 */
export const getCachedBoardBySlugOrId = cache(async (slugOrId: string) => {
  const allBoards = await getCachedAllBoards();

  // slug가 숫자로만 구성된 경우 ID로 처리
  if (/^\d+$/.test(slugOrId)) {
    return allBoards.find(board => board.id === slugOrId) || null;
  }

  return allBoards.find(board => board.slug === slugOrId) || null;
});

/**
 * 게시판의 모든 하위 게시판 ID를 재귀적으로 가져오기 (캐시된 데이터 사용)
 *
 * 기존: 재귀적으로 DB 조회 → N번 쿼리
 * 개선: 캐시된 데이터에서 계산 → 0번 쿼리 (getCachedAllBoards 제외)
 */
export const getCachedChildBoardIds = cache(async (boardId: string): Promise<string[]> => {
  const allBoards = await getCachedAllBoards();

  const findChildren = (parentId: string): string[] => {
    const children = allBoards.filter(b => b.parent_id === parentId);
    return [
      parentId,
      ...children.flatMap(c => findChildren(c.id))
    ];
  };

  return findChildren(boardId);
});

/**
 * 게시판 계층 구조 맵 생성 (캐시)
 */
export const getCachedBoardMaps = cache(async () => {
  const allBoards = await getCachedAllBoards();

  const boardsMap: Record<string, typeof allBoards[0]> = {};
  const childBoardsMap: Record<string, typeof allBoards> = {};
  const boardNameMap: Record<string, string> = {};

  allBoards.forEach(board => {
    const safeBoard = {
      ...board,
      slug: board.slug || board.id,
      display_order: board.display_order || 0
    };

    boardsMap[board.id] = safeBoard;
    boardNameMap[board.id] = board.name;

    if (board.parent_id) {
      if (!childBoardsMap[board.parent_id]) {
        childBoardsMap[board.parent_id] = [];
      }
      childBoardsMap[board.parent_id].push(safeBoard);
    }
  });

  return { boardsMap, childBoardsMap, boardNameMap, allBoards };
});
