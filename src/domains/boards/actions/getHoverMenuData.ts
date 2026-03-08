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

  // 리그 게시판 ↔ 분석 게시판 연동
  // 분석 게시판(해외축구 분석 하위)을 각 리그 게시판의 하위에도 표시
  const ANALYSIS_SLUG_TO_LEAGUE_SLUG: Record<string, string> = {
    'foreign-analysis-premier': 'premier',
    'foreign-analysis-laliga': 'laliga',
    'foreign-analysis-ligue1': 'LIGUE1',
    'foreign-analysis-bundesliga': 'bundesliga',
    'foreign-analysis-serie-a': 'serie-a',
  };

  // slug → board id 매핑 생성
  const slugToId: Record<string, string> = {};
  boardsData.forEach(board => {
    if (board.slug) slugToId[board.slug] = board.id;
  });

  // 각 분석 게시판을 해당 리그 게시판의 children에 추가
  for (const [analysisSlug, leagueSlug] of Object.entries(ANALYSIS_SLUG_TO_LEAGUE_SLUG)) {
    const leagueBoardId = slugToId[leagueSlug];
    const analysisBoard = boardsData.find(b => b.slug === analysisSlug);
    if (leagueBoardId && analysisBoard) {
      if (!childBoardsMap[leagueBoardId]) {
        childBoardsMap[leagueBoardId] = [];
      }
      // 중복 방지
      const alreadyExists = childBoardsMap[leagueBoardId].some(b => b.id === analysisBoard.id);
      if (!alreadyExists) {
        childBoardsMap[leagueBoardId].push({
          id: analysisBoard.id,
          name: analysisBoard.name,
          display_order: analysisBoard.display_order || 0,
          slug: analysisBoard.slug || undefined
        });
      }
    }
  }

  return { topBoards, childBoardsMap };
});
