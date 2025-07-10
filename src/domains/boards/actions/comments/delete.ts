'use server';

import { createClient } from '@/shared/api/supabaseServer';
import { logUserAction } from '@/shared/actions/log-actions';
import { CommentDeleteResponse } from './utils';

/**
 * 댓글 삭제
 */
export async function deleteComment(commentId: string): Promise<CommentDeleteResponse> {
  const supabase = await createClient();
  
  try {
    // 1. 현재 사용자 정보 확인
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }
    
    // 2. 댓글 조회
    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', commentId)
      .single();
      
    if (fetchError) {
      return { success: false, error: fetchError.message };
    }
    
    // 3. 권한 확인 (자신의 댓글만 삭제 가능)
    if (comment.user_id !== user.id) {
      return { success: false, error: '자신의 댓글만 삭제할 수 있습니다.' };
    }
    
    // 4. 댓글 삭제
    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);
      
    if (deleteError) {
      return { success: false, error: deleteError.message };
    }
    
    // 댓글 삭제 로그 기록
    await logUserAction(
      'COMMENT_DELETE',
      `댓글 삭제 (댓글 ID: ${commentId})`,
      user.id,
      {
        commentId
      }
    );
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '댓글 삭제 중 오류가 발생했습니다.' 
    };
  }
} 