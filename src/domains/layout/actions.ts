'use server';

import { cache } from 'react';
import { getCachedAllBoards } from '@/domains/boards/actions/getCachedBoards';
import { Board } from './types/board';

interface GetBoardsResult {
  boardData: Board[];
}

/**
 * 헤더/사이드바 네비게이션용 게시판 계층 구조 조회
 *
 * getCachedAllBoards()를 재사용하여 DB 왕복을 제거했습니다.
 * - 캐시 히트: 메모리 조회 (< 1ms)
 * - 캐시 미스: DB 1회 + 이후 7일간 캐시
 * - 게시판 추가/수정 시 revalidateTag('boards')로 자동 무효화
 *
 * NOTE: 전체 글 개수(totalPostCount)는 별도 서버 컴포넌트에서
 *       Suspense 스트리밍으로 분리되었습니다. (getTotalPostCount.ts)
 */
export const getBoardsForNavigation = cache(async (): Promise<GetBoardsResult> => {
  try {
    const boards = await getCachedAllBoards();

    if (!boards || boards.length === 0) {
      return { boardData: [] };
    }

    // 계층 구조로 변환
    const boardMap = new Map<string, Board>();
    const rootBoards: Board[] = [];

    // 1단계: 모든 게시판을 맵에 저장 (네비게이션용 필드만 pick)
    boards.forEach(board => {
      boardMap.set(board.id, {
        id: board.id,
        name: board.name,
        slug: board.slug,
        parent_id: board.parent_id,
        display_order: board.display_order || 0,
        team_id: board.team_id,
        league_id: board.league_id,
        children: [],
      });
    });

    // 2단계: 부모-자식 관계 설정
    boards.forEach(board => {
      const boardWithChildren = boardMap.get(board.id)!;

      if (board.parent_id) {
        const parent = boardMap.get(board.parent_id);
        if (parent && parent.children) {
          parent.children.push(boardWithChildren);
        }
      } else {
        rootBoards.push(boardWithChildren);
      }
    });

    // 3단계: 각 레벨에서 정렬
    const sortBoards = (list: Board[]) => {
      list.sort((a, b) => a.display_order - b.display_order);
      list.forEach(board => {
        if (board.children && board.children.length > 0) {
          sortBoards(board.children);
        }
      });
    };

    sortBoards(rootBoards);

    return { boardData: rootBoards };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!errorMessage.includes('DYNAMIC_SERVER_USAGE') && !errorMessage.includes('cookies')) {
      console.error('게시판 데이터 로드 오류:', error);
    }
    return { boardData: [] };
  }
});
