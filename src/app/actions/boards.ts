'use server';

import { createClient } from '../lib/supabase.server';
import { revalidatePath } from 'next/cache';
import { HierarchicalBoard } from '../lib/types';
import { Database } from '../lib/database.types';

// 서버 액션 - 게시판 데이터 직접 호출 함수
export async function fetchBoardsDirectly(): Promise<{ rootBoards: HierarchicalBoard[] }> {
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
      throw new Error(error.message);
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
    throw error;
  }
}

// 캐시 무효화 함수
export async function invalidateBoardsCache() {
  revalidatePath('/'); // 메인 경로 재검증 (모든 게시판 관련 페이지에 영향)
  return { success: true };
} 