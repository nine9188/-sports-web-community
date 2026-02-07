'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { getBoardsForNavigation } from '@/domains/layout/actions';
import { Board } from '@/domains/layout/types/board';

/**
 * 계층 구조의 게시판을 flat 배열로 변환
 */
function flattenBoards(boards: Board[]): Board[] {
  const result: Board[] = [];
  for (const board of boards) {
    result.push(board);
    if (board.children && board.children.length > 0) {
      result.push(...flattenBoards(board.children));
    }
  }
  return result;
}

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
      .select('*, profiles(nickname), board:board_id(name), deal_info')
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
 * getBoardsForNavigation을 재사용하여 중복 쿼리 방지 (layout.tsx와 공유)
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

    // getBoardsForNavigation은 cache()로 래핑되어 있어 같은 요청 내 중복 호출 방지
    // layout.tsx에서 이미 호출했다면 캐시된 결과 재사용
    const [boardResult, navigationData] = await Promise.all([
      // 현재 게시판 정보 가져오기
      supabase
        .from('boards')
        .select('*')
        .eq('slug', slug)
        .single(),
      // 모든 게시판 정보 (캐시된 getBoardsForNavigation 사용)
      getBoardsForNavigation()
    ]);

    const { data: board, error: boardError } = boardResult;

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

    // 계층 구조를 flat 배열로 변환 (BoardSelector가 flat 배열 기대)
    const allBoards = flattenBoards(navigationData.boardData);

    // 성공적으로 데이터를 가져온 경우
    return {
      success: true,
      board,
      allBoards
    };
  } catch (error) {
    console.error('게시글 작성 데이터 로드 오류:', error instanceof Error ? error.message : String(error));
    return {
      success: false,
      error: error instanceof Error ? error.message : '게시판 정보를 불러오는 중 오류가 발생했습니다.'
    };
  }
} 