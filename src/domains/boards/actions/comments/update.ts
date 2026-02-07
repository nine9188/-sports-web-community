'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { CommentType } from '../../types/post/comment';
import { checkSuspensionGuard } from '@/shared/utils/suspension-guard';
import { logUserAction } from '@/shared/actions/log-actions';
import { CommentActionResponse } from './utils';

/**
 * 댓글 수정
 */
export async function updateComment(commentId: string, content: string): Promise<CommentActionResponse> {
  if (!content.trim()) {
    return {
      success: false,
      error: '댓글 내용을 입력해주세요.'
    };
  }
  
  try {
    const supabase = await getSupabaseServer();
    
    // 인증된 사용자 정보 확인
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        error: '로그인이 필요합니다.'
      };
    }
    
    // 계정 정지 상태 확인
    const suspensionCheck = await checkSuspensionGuard(user.id);
    if (suspensionCheck.isSuspended) {
      return {
        success: false,
        error: suspensionCheck.message || '계정이 정지되어 댓글을 수정할 수 없습니다.'
      };
    }
    
    // 댓글 조회
    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('id, user_id, post_id')
      .eq('id', commentId)
      .single();
    
    if (fetchError || !comment) {
      return {
        success: false,
        error: '댓글을 찾을 수 없습니다.'
      };
    }
    
    // 권한 확인 (자신의 댓글만 수정 가능)
    if (comment.user_id !== user.id) {
      return {
        success: false,
        error: '자신의 댓글만 수정할 수 있습니다.'
      };
    }
    
    // 댓글 수정
    const { data: updatedComment, error: updateError } = await supabase
      .from('comments')
      .update({ 
        content: content,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .select('*, profiles(nickname, icon_id, level, exp, public_id)')
      .single();
    
    if (updateError) {
      return {
        success: false,
        error: updateError.message
      };
    }
    
    // 수정된 댓글에 아이콘 URL 정보 추가
    const updatedCommentWithIcon = updatedComment as CommentType;
    if (updatedCommentWithIcon.profiles?.icon_id) {
      // 커스텀 아이콘 정보 조회
      const { data: iconData } = await supabase
        .from('shop_items')
        .select('image_url')
        .eq('id', updatedCommentWithIcon.profiles.icon_id)
        .single();
      
      if (iconData?.image_url && updatedCommentWithIcon.profiles) {
        updatedCommentWithIcon.profiles.icon_url = iconData.image_url;
      }
    }
    
    // 댓글 수정 로그 기록
    await logUserAction(
      'COMMENT_UPDATE',
      `댓글 수정 (댓글 ID: ${commentId})`,
      user.id,
      {
        commentId,
        postId: comment.post_id,
        content: content.substring(0, 50) + (content.length > 50 ? '...' : '')
      }
    );
    
    return {
      success: true,
      comment: updatedCommentWithIcon
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '댓글 수정 중 오류가 발생했습니다.' 
    };
  }
} 