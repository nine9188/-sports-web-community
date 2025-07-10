'use server';

import { createClient } from '@/shared/api/supabaseServer';
import { CommentType } from '../../types/post/comment';
import { rewardUserActivity, getActivityTypeValues } from '@/shared/actions/activity-actions';
import { checkSuspensionGuard } from '@/shared/utils/suspension-guard';
import { logUserAction } from '@/shared/actions/log-actions';
import { CommentActionResponse } from './utils';

/**
 * 댓글 작성
 */
export async function createComment({
  postId,
  content
}: {
  postId: string;
  content: string;
}): Promise<CommentActionResponse> {
  const supabase = await createClient();
  
  try {
    // 1. 현재 사용자 정보 확인
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }
    
    // 2. 계정 정지 상태 확인
    const suspensionCheck = await checkSuspensionGuard(user.id);
    if (suspensionCheck.isSuspended) {
      return { 
        success: false, 
        error: suspensionCheck.message || '계정이 정지되어 댓글을 작성할 수 없습니다.' 
      };
    }
    
    // 2. 댓글 작성
    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content
      })
      .select('*, profiles(nickname, icon_id, level)')
      .single();
      
    if (error) {
      return { success: false, error: error.message };
    }
    
    // 새로 작성된 댓글에 아이콘 URL 정보 추가
    const newComment = data as CommentType;
    if (newComment.profiles?.icon_id) {
      // 커스텀 아이콘 정보 조회
      const { data: iconData } = await supabase
        .from('shop_items')
        .select('image_url')
        .eq('id', newComment.profiles.icon_id)
        .single();
      
      if (iconData?.image_url && newComment.profiles) {
        newComment.profiles.icon_url = iconData.image_url;
      }
    }
    
    // 3. 댓글 작성 로그 기록
    await logUserAction(
      'COMMENT_CREATE',
      `댓글 작성 (게시글 ID: ${postId})`,
      user.id,
      {
        commentId: data.id,
        postId,
        content: content.substring(0, 50) + (content.length > 50 ? '...' : '')
      }
    );
    
    // 4. 댓글 작성 보상 지급 (비동기로 처리하여 메인 로직에 영향 없도록)
    try {
      const activityTypes = await getActivityTypeValues();
      await rewardUserActivity(user.id, activityTypes.COMMENT_CREATION, data.id);
    } catch (rewardError) {
      console.error('댓글 작성 보상 지급 오류:', rewardError);
    }
    
    return { success: true, comment: newComment };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '댓글 작성 중 오류가 발생했습니다.' 
    };
  }
} 