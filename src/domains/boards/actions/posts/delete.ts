'use server';

import { logUserAction } from '@/shared/actions/log-actions';
import { getSupabaseAction } from '@/shared/lib/supabase/server';
import { PostActionResponse } from './utils';

/**
 * 게시글 삭제 서버 액션
 */
export async function deletePost(
  postId: string,
  userId: string
): Promise<PostActionResponse> {
  if (!postId || !userId) {
    return {
      success: false,
      error: '필수 입력값이 누락되었습니다.'
    };
  }
  
  try {
    const supabase = await getSupabaseAction();
    
    if (!supabase) {
      return {
        success: false,
        error: 'Supabase 클라이언트 초기화 오류'
      };
    }
    
    // 게시글이 존재하는지 확인 & 작성자 일치 확인
    const { data: existingPost, error: existingPostError } = await supabase
      .from('posts')
      .select('user_id, board_id, boards(slug)')
      .eq('id', postId)
      .single();
      
    if (existingPostError) {
      return {
        success: false,
        error: `게시글을 찾을 수 없습니다: ${existingPostError.message}`
      };
    }
    
    if (!existingPost) {
      return {
        success: false,
        error: '해당 게시글이 존재하지 않습니다.'
      };
    }
    
    if (existingPost.user_id !== userId) {
      return {
        success: false,
        error: '본인이 작성한 게시글만 삭제할 수 있습니다.'
      };
    }
    
    // 게시판 정보 가져오기
    const { data: boardData, error: boardError } = await supabase
      .from('boards')
      .select('slug')
      .eq('id', existingPost.board_id || '')
      .single();
    
    if (boardError) {
      return {
        success: false,
        error: `게시판 정보 조회 실패: ${boardError.message}`
      };
    }
    
    // 관련 댓글 삭제
    const { error: commentsError } = await supabase
      .from('comments')
      .delete()
      .eq('post_id', postId);
    
    if (commentsError) {
      return {
        success: false,
        error: `댓글 삭제 실패: ${commentsError.message}`
      };
    }
    
    // 관련 좋아요/싫어요 삭제
    const { error: likesError } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId);
    
    if (likesError) {
      return {
        success: false,
        error: `좋아요/싫어요 삭제 실패: ${likesError.message}`
      };
    }
    
    // 게시글 삭제
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);
    
    if (deleteError) {
      return {
        success: false,
        error: `게시글 삭제 실패: ${deleteError.message}`
      };
    }
    
    // 게시글 삭제 성공 로그 기록
    await logUserAction(
      'POST_DELETE',
      `게시글 삭제 (ID: ${postId})`,
      userId,
      {
        postId,
        boardId: existingPost.board_id,
        boardSlug: boardData.slug
      }
    );
    
    return {
      success: true,
      boardSlug: boardData.slug || undefined
    };
  } catch (error) {
    console.error('[서버] 게시글 삭제 예외 발생:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '게시글 삭제 중 오류가 발생했습니다.'
    };
  }
} 