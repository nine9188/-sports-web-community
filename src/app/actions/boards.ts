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

/**
 * 게시판 정보를 슬러그나 ID로 조회하는 서버 액션
 */
export async function getBoardBySlugOrId(slugOrId: string) {
  try {
    const supabase = await createClient();
    const isUUID = /^[0-9a-fA-F-]{36}$/.test(slugOrId);

    let data;
    let error;

    if (isUUID) {
      // UUID로 조회
      const result = await supabase
        .from('boards')
        .select('*')
        .eq('id', slugOrId)
        .single();
      
      data = result.data;
      error = result.error;
    } else {
      // 슬러그로 조회
      const result = await supabase
        .from('boards')
        .select('*')
        .eq('slug', slugOrId)
        .single();
      
      data = result.data;
      error = result.error;
    }

    if (error) throw new Error('게시판 정보를 가져오지 못했습니다.');
    return data;
  } catch (error) {
    console.error('게시판 정보 조회 오류:', error);
    throw error;
  }
}

/**
 * 모든 게시판 목록을 가져오는 서버 액션
 */
export async function getAllBoards() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw new Error('게시판 목록 조회 실패');
    return data;
  } catch (error) {
    console.error('게시판 목록 조회 오류:', error);
    throw error;
  }
}

/**
 * 게시글 생성 서버 액션
 */
export async function createPost(
  title: string,
  content: string,
  boardId: string,
  userId: string
) {
  try {
    const supabase = await createClient();
    
    // 게시판 정보 가져오기
    const { data: boardData } = await supabase
      .from('boards')
      .select('name, slug')
      .eq('id', boardId)
      .single();
    
    if (!boardData) {
      throw new Error('게시판 정보를 찾을 수 없습니다.');
    }
    
    // 게시글 생성
    const { data, error } = await supabase
      .from('posts')
      .insert({
        title: title.trim(),
        content,
        user_id: userId,
        board_id: boardId,
        category: boardData.name || null,
        views: 0,
        likes: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'published'
      })
      .select();
    
    if (error) throw error;
    
    // 생성된 게시글의 post_number 가져오기
    if (data && data.length > 0) {
      const { data: createdPost } = await supabase
        .from('posts')
        .select('post_number')
        .eq('id', data[0].id)
        .single();
      
      return {
        success: true,
        postId: data[0].id,
        postNumber: createdPost?.post_number,
        boardSlug: boardData.slug
      };
    }
    
    throw new Error('게시글 생성 중 오류가 발생했습니다.');
  } catch (error) {
    console.error('게시글 생성 오류:', error);
    throw error;
  }
}

/**
 * 게시글 수정 서버 액션
 */
export async function updatePost(
  postId: string, 
  title: string, 
  content: string, 
  userId: string
) {
  try {
    const supabase = await createClient();
    
    // 게시글 업데이트 쿼리
    const { error, data } = await supabase
      .from('posts')
      .update({
        title: title.trim(),
        content,
        updated_at: new Date().toISOString()
      })
      .match({ id: postId, user_id: userId })
      .select('board_id, post_number')
      .single();
    
    if (error) {
      return {
        success: false,
        error: `게시글 수정 실패: ${error.message}`
      };
    }
    
    // 게시판 슬러그 가져오기
    const { data: boardData, error: boardError } = await supabase
      .from('boards')
      .select('slug')
      .eq('id', data.board_id)
      .single();
    
    if (boardError) {
      return {
        success: false,
        error: `게시판 정보 조회 실패: ${boardError.message}`
      };
    }
    
    return {
      success: true,
      boardSlug: boardData?.slug,
      postNumber: data.post_number,
      error: null
    };
  } catch (error) {
    console.error('게시글 수정 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '게시글 수정 중 오류가 발생했습니다.'
    };
  }
} 