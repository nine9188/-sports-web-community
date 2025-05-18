'use server';

import { createClient } from '@/app/lib/supabase.server';
import { cache } from 'react';
import { HierarchicalBoard, BoardNavigationData } from '../types';
import { Database } from '@/app/lib/database.types';
import { revalidatePath } from 'next/cache';

// 서버 측에서 게시판 데이터를 가져오는 함수 (캐싱 적용)
export const getBoardsData = cache(async (): Promise<BoardNavigationData> => {
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
      // 필요한 필드만 추출하여 HierarchicalBoard 타입에 맞게 생성
      const hierarchicalBoard: HierarchicalBoard = {
        id: board.id,
        name: board.name,
        slug: board.slug,
        parent_id: board.parent_id,
        display_order: board.display_order,
        team_id: board.team_id || null,
        league_id: board.league_id || null,
        children: []
      };
      
      boardMap.set(board.id, hierarchicalBoard);
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

// 게시판 캐시 무효화 함수
export async function invalidateBoardsCache() {
  try {
    // 상위 라우트 및 하위 라우트 모두 재검증
    revalidatePath('/', 'layout');
    
    return { success: true };
  } catch (error) {
    console.error('게시판 캐시 무효화 오류:', error);
    return { success: false, error: '캐시 무효화 중 오류가 발생했습니다.' };
  }
} 