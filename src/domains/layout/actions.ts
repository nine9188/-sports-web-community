'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { cache } from 'react';
import { Board } from './types/board';
import { getAuthenticatedUser, getUserAdminStatus } from '@/shared/actions/auth';

interface GetBoardsOptions {
  includeTotalPostCount?: boolean;
}

interface GetBoardsResult {
  boardData: Board[];
  isAdmin: boolean;
  totalPostCount?: number;
}

/**
 * 헤더/사이드바 네비게이션용 게시판 데이터를 서버에서 미리 로드
 * 캐싱을 적용하여 성능 최적화
 */
export const getBoardsForNavigation = cache(async (options?: GetBoardsOptions): Promise<GetBoardsResult> => {
  try {
    const supabase = await getSupabaseServer();

    // 현재 사용자의 관리자 권한 확인 (캐시된 함수 사용)
    let isAdmin = false;
    try {
      const { data: { user } } = await getAuthenticatedUser();
      if (user) {
        const { isAdmin: adminStatus } = await getUserAdminStatus(user.id);
        isAdmin = adminStatus;
      }
    } catch {
      // 관리자 권한 확인 실패해도 계속 진행
    }

    // 게시판 데이터와 전체 글 개수를 병렬로 가져오기
    const boardsPromise = supabase
      .from('boards')
      .select('id, name, parent_id, display_order, slug, team_id, league_id')
      .order('display_order', { ascending: true })
      .order('name');

    const postsCountPromise = options?.includeTotalPostCount
      ? supabase.from('posts').select('*', { count: 'exact', head: true })
      : Promise.resolve({ count: undefined });

    const [boardsResult, postsCountResult] = await Promise.all([boardsPromise, postsCountPromise]);

    const { data: boards, error } = boardsResult;
    const totalPostCount = postsCountResult.count ?? undefined;
    
    if (error) {
      // 빌드 단계 로그 오염 방지
      const errorMessage = error.message || String(error);
      if (!errorMessage.includes('DYNAMIC_SERVER_USAGE') && !errorMessage.includes('cookies')) {
        console.error('게시판 데이터 조회 오류:', error);
      }
      return { boardData: [], isAdmin };
    }
    
    // 계층 구조로 변환
    const boardMap = new Map<string, Board>();
    const rootBoards: Board[] = [];
    
    // 1단계: 모든 게시판을 맵에 저장
    boards.forEach(board => {
      boardMap.set(board.id, {
        ...board,
        display_order: board.display_order || 0,
        children: []
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
    const sortBoards = (boards: Board[]) => {
      boards.sort((a, b) => a.display_order - b.display_order);
      boards.forEach(board => {
        if (board.children && board.children.length > 0) {
          sortBoards(board.children);
        }
      });
    };
    
    sortBoards(rootBoards);
    
    return { boardData: rootBoards, isAdmin, totalPostCount };

  } catch (error) {
    // 빌드 단계 로그 오염 방지
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!errorMessage.includes('DYNAMIC_SERVER_USAGE') && !errorMessage.includes('cookies')) {
      console.error('게시판 데이터 로드 오류:', error);
    }
    return { boardData: [], isAdmin: false };
  }
}); 