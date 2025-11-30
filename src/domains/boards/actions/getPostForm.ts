'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';

/**
 * 게시글 수정 페이지에 필요한 데이터를 가져옵니다.
 */
export async function getPostEditData(slug: string, postNumber: string) {
  try {
    const supabase = await getSupabaseServer();
    
    // 세션 정보 가져오기
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    
    // 로그인 상태 확인
    if (!userId) {
      return {
        success: false,
        redirectToLogin: true
      };
    }
    
    // 게시판 정보 가져오기
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('*')
      .eq('slug', slug)
      .single();
      
    if (boardError || !board) {
      return {
        success: false,
        error: '게시판을 찾을 수 없습니다.'
      };
    }
    
    // 게시글 정보 가져오기
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('*, profiles(nickname), board:board_id(name)')
      .eq('board_id', board.id)
      .eq('post_number', parseInt(postNumber, 10))
      .single();
      
    if (postError || !post) {
      return {
        success: false,
        error: '게시글을 찾을 수 없습니다.'
      };
    }
    
    // 작성자 확인
    if (post.user_id !== userId) {
      return {
        success: false,
        redirectToPost: true
      };
    }
    
    // 성공적으로 데이터를 가져온 경우
    return {
      success: true,
      post,
      board
    };
  } catch (error) {
    console.error('게시글 수정 데이터 로드 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '게시글 정보를 불러오는 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 게시글 작성 페이지에 필요한 데이터를 가져옵니다.
 */
export async function getCreatePostData(slug: string) {
  if (!slug) {
    console.error('게시글 작성: 슬러그가 제공되지 않음');
    return {
      success: false,
      error: '게시판 정보가 올바르지 않습니다.'
    };
  }

  try {
    const supabase = await getSupabaseServer();
    
    // 게시판 정보 가져오기
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('*')
      .eq('slug', slug)
      .single();
      
    if (boardError) {
      console.error('게시판 정보 조회 오류:', boardError.message, boardError.details || '');
      return {
        success: false,
        error: '게시판을 찾을 수 없습니다.'
      };
    }
    
    if (!board) {
      console.error(`슬러그 "${slug}"에 해당하는 게시판이 없음`);
      return {
        success: false,
        error: '게시판을 찾을 수 없습니다.'
      };
    }
    
    // 모든 게시판 정보 가져오기 (모든 필드 포함)
    const { data: allBoards, error: allBoardsError } = await supabase
      .from('boards')
      .select('*')
      .order('display_order', { ascending: true })
      .order('name');
      
    if (allBoardsError) {
      console.error('게시판 목록 가져오기 오류:', allBoardsError.message, allBoardsError.details || '');
    }
    
    // 성공적으로 데이터를 가져온 경우
    return {
      success: true,
      board,
      allBoards: allBoards || []
    };
  } catch (error) {
    console.error('게시글 작성 데이터 로드 오류:', error instanceof Error ? error.message : String(error));
    return {
      success: false,
      error: error instanceof Error ? error.message : '게시판 정보를 불러오는 중 오류가 발생했습니다.'
    };
  }
} 