'use server';

import { createClient } from '@/app/lib/supabase.server';

// Board 타입 정의
export type Board = {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  parent_id: string | null;
  children?: Board[];
};

/**
 * 헤더 네비게이션에 표시할 게시판 데이터를 가져오는 서버 액션
 */
export async function getBoardsForNavigation(): Promise<{
  boardData: Board[];
  isAdmin: boolean;
  success: boolean;
}> {
  try {
    // 서버 컴포넌트에서 직접 데이터 가져오기
    const supabase = await createClient();
    
    // 사용자 정보 가져오기 (관리자 여부 확인용)
    const { data: { user } } = await supabase.auth.getUser();
    const isAdmin = user?.user_metadata?.is_admin === true;
    
    // 최상위 게시판 가져오기
    let rootBoards: Board[] = [];
    
    // 모든 게시판 가져오기
    const { data: allBoards, error } = await supabase
      .from('boards')
      .select('*')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });
    
    if (error) {
      console.error('게시판 데이터 가져오기 오류:', error);
      throw error;
    }
    
    if (allBoards && allBoards.length > 0) {
      // 최상위 게시판만 필터링
      const parentBoards = allBoards.filter(board => !board.parent_id);
      
      // 하위 게시판 찾아서 연결
      rootBoards = parentBoards.map(parent => {
        const children = allBoards.filter(board => board.parent_id === parent.id);
        
        return {
          ...parent,
          children: children.map(child => {
            // 2단계 하위 게시판 찾기
            const subChildren = allBoards.filter(board => board.parent_id === child.id);
            
            return {
              ...child,
              children: subChildren.length > 0 ? subChildren : undefined
            };
          })
        };
      });
    }
    
    return {
      boardData: rootBoards,
      isAdmin,
      success: true
    };
  } catch (error) {
    console.error('게시판 데이터 처리 오류:', error);
    // 오류가 발생해도 빈 배열 반환하여 UI가 깨지지 않도록 함
    return {
      boardData: [],
      isAdmin: false,
      success: false
    };
  }
} 