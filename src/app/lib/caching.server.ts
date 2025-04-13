import { createClient } from './supabase.server';
import { cache } from 'react';
import { revalidateTag } from 'next/cache';
import { HierarchicalBoard } from '../hooks/useBoards';
import { Database } from './database.types';

// 캐시 태그 정의
export const CACHE_TAGS = {
  BOARDS: 'boards',
};

/**
 * 서버 컴포넌트에서 게시판 데이터를 가져오는 함수 - ISR 적용
 */
export const getCachedBoardsData = cache(async () => {
  try {
    const supabase = await createClient();
    
    // 게시판 데이터 쿼리
    const { data: boards, error } = await supabase
      .from('boards')
      .select('*')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true })
      .abortSignal(AbortSignal.timeout(5000)); // 5초 타임아웃
      
    if (error) {
      console.error('게시판 데이터 불러오기 오류:', error.message);
      return { rootBoards: [] };
    }

    // 계층형 구조 변환
    const boardMap = new Map<string, HierarchicalBoard>();
    boards?.forEach((board: Database['public']['Tables']['boards']['Row']) => {
      boardMap.set(board.id, {
        ...board,
        children: []
      });
    });

    const rootBoards: HierarchicalBoard[] = [];
    
    // 부모-자식 관계 구성
    boards?.forEach((board: Database['public']['Tables']['boards']['Row']) => {
      const mappedBoard = boardMap.get(board.id);
      if (!mappedBoard) return;

      if (board.parent_id) {
        const parentBoard = boardMap.get(board.parent_id);
        if (parentBoard) {
          parentBoard.children = parentBoard.children || [];
          parentBoard.children.push(mappedBoard);
        } else {
          rootBoards.push(mappedBoard);
        }
      } else {
        rootBoards.push(mappedBoard);
      }
    });
    
    // 게시판 데이터 정렬
    const sortBoards = (boards: HierarchicalBoard[]) => {
      return boards.sort((a, b) => {
        if (a.display_order !== b.display_order) {
          return a.display_order - b.display_order;
        }
        return a.name.localeCompare(b.name);
      }).map(board => {
        if (board.children && board.children.length > 0) {
          board.children = sortBoards(board.children);
        }
        return board;
      });
    };
    
    return { rootBoards: sortBoards(rootBoards) };
  } catch (error) {
    console.error('게시판 데이터 처리 오류:', error);
    return { rootBoards: [] };
  }
});

/**
 * 게시판 데이터 캐시를 무효화하는 함수
 */
export const invalidateBoardsCache = () => {
  try {
    revalidateTag(CACHE_TAGS.BOARDS);
    return true;
  } catch (error) {
    console.error('캐시 무효화 오류:', error);
    return false;
  }
};

/**
 * 모든 캐시를 무효화하는 유틸리티 함수
 */
export const invalidateAllCache = () => {
  try {
    // 모든 캐시 태그에 대해 무효화 실행
    Object.values(CACHE_TAGS).forEach(tag => {
      revalidateTag(tag);
    });
    return true;
  } catch (error) {
    console.error('전체 캐시 무효화 오류:', error);
    return false;
  }
}; 