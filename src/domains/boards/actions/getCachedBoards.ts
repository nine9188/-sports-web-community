'use server';

import { unstable_cache } from 'next/cache';
import { getSupabaseAdmin } from '@/shared/lib/supabase/server';

type BoardRow = {
  id: string;
  name: string;
  slug: string | null;
  parent_id: string | null;
  display_order: number | null;
  team_id: number | null;
  league_id: number | null;
  view_type: string | null;
  content_type: string | null;
  description?: string | null;
  access_level?: string | null;
  logo?: string | null;
  views?: number | null;
};

/**
 * 캐시된 모든 게시판 데이터 조회
 *
 * Next.js unstable_cache 기반 서버 레벨 캐싱 (7일)
 * - 모든 요청이 캐시 공유 → DB 호출 최소화
 * - 게시판 추가/수정 시 revalidateTag('boards', 'default')로 즉시 무효화
 * - revalidate: 7일 안전장치 (tag 호출 누락 시 자동 갱신)
 *
 * 사용처: 사이드바, 호버메뉴, 게시판 페이지, 게시글 페이지 등
 */
const _getCachedAllBoardsImpl = unstable_cache(
  async (): Promise<BoardRow[]> => {
    // unstable_cache 내부에서는 cookies()를 사용하지 않는 Admin 클라이언트 사용
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('boards')
      .select('id, name, slug, parent_id, display_order, team_id, league_id, description, access_level, logo, views, view_type, content_type')
      .order('display_order', { ascending: true })
      .order('name');

    if (error) {
      console.error('getCachedAllBoards error:', error);
      return [];
    }

    return (data || []) as BoardRow[];
  },
  ['all-boards-v2'],
  { revalidate: 604800, tags: ['boards'] } // 7일
);

export async function getCachedAllBoards() {
  return _getCachedAllBoardsImpl();
}

/**
 * 캐시된 게시판 데이터에서 slug로 찾기
 */
export async function getCachedBoardBySlug(slug: string) {
  const allBoards = (await getCachedAllBoards()) as BoardRow[];
  return allBoards.find((board: BoardRow) => board.slug === slug) || null;
}

/**
 * 캐시된 게시판 데이터에서 ID로 찾기
 */
export async function getCachedBoardById(id: string) {
  const allBoards = (await getCachedAllBoards()) as BoardRow[];
  return allBoards.find((board: BoardRow) => board.id === id) || null;
}

/**
 * 캐시된 게시판 데이터에서 slug 또는 ID로 찾기
 */
export async function getCachedBoardBySlugOrId(slugOrId: string) {
  const allBoards = (await getCachedAllBoards()) as BoardRow[];

  // slug가 숫자로만 구성된 경우 ID로 처리
  if (/^\d+$/.test(slugOrId)) {
    return allBoards.find((board: BoardRow) => board.id === slugOrId) || null;
  }

  return allBoards.find((board: BoardRow) => board.slug === slugOrId) || null;
}

/**
 * 게시판의 모든 하위 게시판 ID를 재귀적으로 가져오기 (캐시된 데이터 사용)
 */
export async function getCachedChildBoardIds(boardId: string): Promise<string[]> {
  const allBoards = (await getCachedAllBoards()) as BoardRow[];

  const findChildren = (parentId: string): string[] => {
    const children = allBoards.filter((b: BoardRow) => b.parent_id === parentId);
    return [
      parentId,
      ...children.flatMap((c: BoardRow) => findChildren(c.id))
    ];
  };

  return findChildren(boardId);
}

/**
 * 게시판 계층 구조 맵 생성 (캐시)
 */
export async function getCachedBoardMaps() {
  const allBoards = (await getCachedAllBoards()) as BoardRow[];

  const boardsMap: Record<string, BoardRow> = {};
  const childBoardsMap: Record<string, BoardRow[]> = {};
  const boardNameMap: Record<string, string> = {};

  allBoards.forEach((board: BoardRow) => {
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
}
