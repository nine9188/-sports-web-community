'use client';

import { createClient } from '@/app/lib/supabase-browser';

export async function incrementBoardViewCount(boardId: string): Promise<boolean> {
  try {
    const supabase = createClient();
    
    // 세션 스토리지에서 조회 기록 확인
    const viewedBoards = JSON.parse(sessionStorage.getItem('viewedBoards') || '{}');
    if (viewedBoards[boardId]) return false;
    
    // 현재 조회수 가져오기
    const { data: board } = await supabase
      .from('boards')
      .select('views')
      .eq('id', boardId)
      .single();
    
    // 조회수 증가
    const { error } = await supabase
      .from('boards')
      .update({ views: (board?.views || 0) + 1 })
      .eq('id', boardId)
      .select();
      
    if (error) throw error;
    
    // 조회 기록 저장
    viewedBoards[boardId] = true;
    sessionStorage.setItem('viewedBoards', JSON.stringify(viewedBoards));
    
    return true;
  } catch (error) {
    console.error('게시판 조회수 증가 오류:', error);
    return false;
  }
} 