'use server';

import { cache } from 'react';
import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { BoardMap, ChildBoardsMap } from '../types/board';
import { getBoardLevel, getFilteredBoardIds, findRootBoard, generateBoardBreadcrumbs } from '../utils/board/boardHierarchy';
import { BoardsResponse, Board, HierarchicalBoard } from '@/domains/boards/types';
import { getCachedAllBoards, getCachedBoardBySlugOrId, getCachedBoardMaps } from './getCachedBoards';

/**
 * 모든 게시판 목록을 가져옵니다.
 * @deprecated getCachedAllBoards() 사용 권장
 */
export const getAllBoards = cache(async () => {
  return getCachedAllBoards();
});

/**
 * 게시판 정보를 슬러그 또는 ID로 가져옵니다.
 * @deprecated getCachedBoardBySlugOrId() 사용 권장
 */
export const getBoardBySlugOrId = cache(async (slugOrId: string) => {
  const board = await getCachedBoardBySlugOrId(slugOrId);
  if (!board) {
    throw new Error('게시판을 찾을 수 없습니다.');
  }
  return board;
});

/**
 * 게시판 페이지에 필요한 모든 데이터를 가져옵니다.
 *
 * 최적화: getCachedBoardMaps()를 사용하여 boards 테이블 중복 조회 제거
 * - Before: boards 테이블 2회 조회 (slug 조회 + 전체 조회)
 * - After: 캐시된 데이터에서 조회 (같은 요청 내 재사용)
 */
export async function getBoardPageData(slug: string, currentPage: number, fromParam?: string) {
  try {
    const supabase = await getSupabaseServer();

    // 병렬로 데이터 요청 처리
    const [userResult, cachedMaps] = await Promise.all([
      // 1. 사용자 인증 확인 (로그인 상태)
      supabase.auth.getUser(),
      // 2. 캐시된 게시판 맵 데이터 조회 (중복 DB 조회 제거)
      getCachedBoardMaps()
    ]);

    const isLoggedIn = !!userResult.data?.user;
    const { boardsMap, childBoardsMap, boardNameMap, allBoards } = cachedMaps;

    // 캐시된 데이터에서 slug로 게시판 찾기
    const boardData = allBoards.find(b => b.slug === slug);

    // 게시판 검증
    if (!boardData) {
      return {
        success: false,
        error: '게시판을 찾을 수 없습니다.'
      };
    }
    
    // 4. 브레드크럼 생성
    const safeBoardData = {
      ...boardData,
      slug: boardData.slug || boardData.id
    };
    const breadcrumbs = generateBoardBreadcrumbs(safeBoardData, boardsMap);
    
    // 현재 게시판의 레벨 결정 (최상위, 상위, 하위)
    const boardLevel = getBoardLevel(boardData.id, boardsMap, childBoardsMap);
    
    // fromParam 처리: 
    // - from=boards인 경우 현재 게시판만 표시
    // - fromParam이 유효한 게시판 ID인 경우 해당 게시판 필터링
    // - 그 외의 경우 기본 필터링 적용
    let filteredBoardIds: string[] = [];
    
    if (fromParam === 'boards') {
      // 현재 게시판만 표시
      filteredBoardIds = [boardData.id];
    } else if (fromParam && boardsMap[fromParam]) {
      // fromParam이 유효한 게시판 ID인 경우 해당 게시판 관련 게시글 표시
      const fromBoardLevel = getBoardLevel(fromParam, boardsMap, childBoardsMap);
      filteredBoardIds = getFilteredBoardIds(fromParam, fromBoardLevel, boardsMap, childBoardsMap);
    } else {
      // 기본 필터링 적용
      filteredBoardIds = getFilteredBoardIds(boardData.id, boardLevel, boardsMap, childBoardsMap);
    }
    
    // 최상위 게시판의 ID 및 slug 확인
    const rootBoardId = findRootBoard(boardData.id, boardsMap);
    const rootBoardSlug = boardsMap[rootBoardId]?.slug || rootBoardId;
    
    // 팀/리그 데이터 처리
    let teamData = null;
    let leagueData = null;

    // 팀 데이터: boards 테이블의 logo를 직접 사용
    if (boardData.team_id && boardData.logo) {
      teamData = {
        team: {
          id: boardData.team_id,
          name: boardData.name,
          country: '',
          founded: 0,
          logo: boardData.logo
        },
        venue: {
          name: '',
          city: '',
          capacity: 0
        }
      };
    }

    // 리그 데이터 처리
    if (boardData.league_id) {
      const { data: leagueResult } = await supabase
        .from('leagues')
        .select('*')
        .eq('id', boardData.league_id)
        .single();

      if (leagueResult) {
        leagueData = {
          id: leagueResult.id,
          name: leagueResult.name,
          country: leagueResult.country || '',
          logo: leagueResult.logo || 'https://via.placeholder.com/80'
        };
      }
    }
    
    return {
      success: true,
      boardData,
      breadcrumbs,
      filteredBoardIds,
      teamData,
      leagueData,
      isLoggedIn,
      childBoardsMap,
      rootBoardId,
      rootBoardSlug
    };
  } catch (error) {
    console.error("getBoardPageData Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '게시판 정보를 불러오는 중 오류가 발생했습니다.'
    };
  }
}

/**
 * boards 배열을 계층 구조(hierarchical)로 변환하는 함수
 */
function buildHierarchicalBoards(boards: Board[]): HierarchicalBoard[] {
  const boardMap: Record<string, HierarchicalBoard> = {};
  const roots: HierarchicalBoard[] = [];

  boards.forEach((board) => {
    boardMap[board.id] = { ...board };
  });

  boards.forEach((board) => {
    if (board.parent_id && boardMap[board.parent_id]) {
      const parent = boardMap[board.parent_id];
      if (!parent.children) parent.children = [];
      parent.children.push(boardMap[board.id]);
    } else {
      roots.push(boardMap[board.id]);
    }
  });

  return roots;
}

/**
 * 게시판 목록 조회
 *
 * 최적화: getCachedAllBoards()를 사용하여 캐시된 데이터 활용
 * - 같은 요청 내에서 여러 번 호출되어도 1번만 DB 조회
 */
export const getBoards = cache(async (): Promise<BoardsResponse> => {
  try {
    const boards = await getCachedAllBoards() as Board[];
    const hierarchical = buildHierarchicalBoards(boards);
    return { boards, hierarchical };
  } catch (error) {
    console.error('게시판 데이터 불러오기 오류:', error);
    return { boards: [], hierarchical: [] };
  }
}); 