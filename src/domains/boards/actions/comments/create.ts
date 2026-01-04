'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { CommentType } from '../../types/post/comment';
import { rewardUserActivity, getActivityTypeValues } from '@/shared/actions/activity-actions';
import { checkReferralMilestone } from '@/shared/actions/referral-actions';
import { checkSuspensionGuard } from '@/shared/utils/suspension-guard';
import { logUserAction } from '@/shared/actions/log-actions';
import { CommentActionResponse } from './utils';
import { createCommentNotification, createReplyNotification } from '@/domains/notifications/actions';

/**
 * 댓글 작성 (대댓글 지원)
 */
export async function createComment({
  postId,
  content,
  parentId
}: {
  postId: string;
  content: string;
  parentId?: string | null;
}): Promise<CommentActionResponse> {
  const supabase = await getSupabaseServer();
  
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
    
    // 3. 부모 댓글 존재 여부 확인 (대댓글인 경우)
    let parentCommentOwnerId: string | null = null;
    if (parentId) {
      const { data: parentComment, error: parentError } = await supabase
        .from('comments')
        .select('id, post_id, user_id')
        .eq('id', parentId)
        .single();
      
      if (parentError || !parentComment) {
        return { success: false, error: '원본 댓글을 찾을 수 없습니다.' };
      }
      
      // 부모 댓글이 같은 게시글에 속하는지 확인
      if (parentComment.post_id !== postId) {
        return { success: false, error: '잘못된 요청입니다.' };
      }
      
      parentCommentOwnerId = parentComment.user_id;
    }
    
    // 4. 댓글 작성
    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content,
        parent_id: parentId || null
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
    
    // 5. 댓글 작성 로그 기록
    await logUserAction(
      'COMMENT_CREATE',
      parentId ? `대댓글 작성 (게시글 ID: ${postId})` : `댓글 작성 (게시글 ID: ${postId})`,
      user.id,
      {
        commentId: data.id,
        postId,
        parentId: parentId || null,
        content: content.substring(0, 50) + (content.length > 50 ? '...' : '')
      }
    );
    
    // 6. 댓글 작성 보상 지급 (비동기로 처리하여 메인 로직에 영향 없도록)
    try {
      const activityTypes = await getActivityTypeValues();
      await rewardUserActivity(user.id, activityTypes.COMMENT_CREATION, data.id);

      // 첫 댓글 마일스톤 체크 (추천 시스템)
      const { count: commentCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (commentCount === 1) {
        // 첫 댓글이면 마일스톤 체크
        await checkReferralMilestone(user.id, 'first_comment');
      }
    } catch (rewardError) {
      console.error('댓글 작성 보상 지급 오류:', rewardError);
    }
    
    // 7. 알림 생성 (비동기로 처리)
    try {
      // 게시글 정보 조회 (알림용)
      const { data: postData } = await supabase
        .from('posts')
        .select(`
          user_id,
          title,
          post_number,
          board:boards(slug)
        `)
        .eq('id', postId)
        .single();

      if (postData) {
        const boardSlug = (postData.board as { slug: string } | null)?.slug || '';
        const actorNickname = newComment.profiles?.nickname || '알 수 없음';

        if (parentId && parentCommentOwnerId) {
          // 대댓글인 경우: 부모 댓글 작성자에게 알림
          await createReplyNotification({
            parentCommentOwnerId,
            actorId: user.id,
            actorNickname,
            postId,
            postNumber: postData.post_number,
            boardSlug,
            commentContent: content
          });
        } else {
          // 일반 댓글인 경우: 게시글 작성자에게 알림
          await createCommentNotification({
            postOwnerId: postData.user_id,
            actorId: user.id,
            actorNickname,
            postId,
            postTitle: postData.title,
            postNumber: postData.post_number,
            boardSlug,
            commentContent: content
          });
        }
      }
    } catch (notificationError) {
      console.error('알림 생성 오류:', notificationError);
      // 알림 생성 실패해도 댓글 작성은 성공으로 처리
    }
    
    return { success: true, comment: newComment };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '댓글 작성 중 오류가 발생했습니다.' 
    };
  }
} 