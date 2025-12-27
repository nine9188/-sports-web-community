'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { rewardUserActivity, getActivityTypeValues } from '@/shared/actions/activity-actions';
import { CommentLikeResponse } from './utils';
import { createCommentLikeNotification } from '@/domains/notifications/actions';

type ReactionType = 'like' | 'dislike';

/**
 * 댓글 좋아요/싫어요 토글 공통 로직
 */
async function toggleCommentReaction(
  commentId: string,
  reactionType: ReactionType
): Promise<CommentLikeResponse> {
  try {
    const supabase = await getSupabaseServer();
    const oppositeType: ReactionType = reactionType === 'like' ? 'dislike' : 'like';

    // 인증된 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    // 현재 댓글 정보 가져오기
    const { data: currentComment, error: commentFetchError } = await supabase
      .from('comments')
      .select('likes, dislikes')
      .eq('id', commentId)
      .single();

    if (commentFetchError) {
      return { success: false, error: `댓글 조회 오류: ${commentFetchError.message}` };
    }

    let likes = currentComment.likes || 0;
    let dislikes = currentComment.dislikes || 0;
    let newUserAction: ReactionType | null = null;

    // 현재 리액션 확인
    const { data: existingRecord, error: checkError } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .eq('type', reactionType)
      .maybeSingle();

    if (checkError) {
      return { success: false, error: `${reactionType === 'like' ? '좋아요' : '싫어요'} 조회 오류: ${checkError.message}` };
    }

    if (existingRecord) {
      // 리액션 취소
      const { error: deleteError } = await supabase
        .from('comment_likes')
        .delete()
        .eq('id', existingRecord.id);

      if (deleteError) {
        return { success: false, error: `${reactionType === 'like' ? '좋아요' : '싫어요'} 삭제 오류: ${deleteError.message}` };
      }

      if (reactionType === 'like') {
        likes -= 1;
      } else {
        dislikes -= 1;
      }
      newUserAction = null;
    } else {
      // 반대 리액션 확인 및 제거
      const { data: oppositeRecord } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .eq('type', oppositeType)
        .maybeSingle();

      if (oppositeRecord) {
        const { error: deleteError } = await supabase
          .from('comment_likes')
          .delete()
          .eq('id', oppositeRecord.id);

        if (!deleteError) {
          if (oppositeType === 'like') {
            likes -= 1;
          } else {
            dislikes -= 1;
          }
        }
      }

      // 새 리액션 추가
      const { error: insertError } = await supabase
        .from('comment_likes')
        .insert({ comment_id: commentId, user_id: user.id, type: reactionType });

      if (insertError) {
        return { success: false, error: `${reactionType === 'like' ? '좋아요' : '싫어요'} 추가 오류: ${insertError.message}` };
      }

      if (reactionType === 'like') {
        likes += 1;
      } else {
        dislikes += 1;
      }
      newUserAction = reactionType;
    }

    // 댓글 정보 업데이트
    const { error: updateError } = await supabase
      .from('comments')
      .update({ likes, dislikes })
      .eq('id', commentId);

    if (updateError) {
      return { success: false, error: `댓글 업데이트 오류: ${updateError.message}` };
    }

    // 좋아요가 새로 추가된 경우 알림 및 보상 처리
    if (reactionType === 'like' && newUserAction === 'like') {
      await handleCommentLikeNotification(supabase, commentId, user.id);
    }

    return { success: true, likes, dislikes, userAction: newUserAction };
  } catch (error) {
    console.error(`[${reactionType}Comment] 처리 중 오류:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : `${reactionType === 'like' ? '좋아요' : '싫어요'} 처리 중 오류가 발생했습니다.`
    };
  }
}

/**
 * 댓글 좋아요 알림 처리
 */
async function handleCommentLikeNotification(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  commentId: string,
  userId: string
): Promise<void> {
  try {
    const { data: commentData } = await supabase
      .from('comments')
      .select(`
        user_id,
        content,
        post:posts(post_number, board:boards(slug))
      `)
      .eq('id', commentId)
      .single();

    if (!commentData?.user_id || commentData.user_id === userId) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('id', userId)
      .single();

    const post = commentData.post as { post_number: number; board: { slug: string } } | null;

    if (profile && post?.board?.slug) {
      await createCommentLikeNotification({
        commentOwnerId: commentData.user_id,
        actorId: userId,
        actorNickname: profile.nickname || '알 수 없음',
        commentId,
        commentContent: commentData.content,
        postNumber: post.post_number,
        boardSlug: post.board.slug
      });
    }

    const activityTypes = await getActivityTypeValues();
    await rewardUserActivity(commentData.user_id, activityTypes.RECEIVED_LIKE, commentId);
  } catch (error) {
    console.error('댓글 좋아요 알림/보상 처리 오류:', error);
  }
}

/**
 * 댓글 좋아요
 */
export async function likeComment(commentId: string): Promise<CommentLikeResponse> {
  return toggleCommentReaction(commentId, 'like');
}

/**
 * 댓글 싫어요
 */
export async function dislikeComment(commentId: string): Promise<CommentLikeResponse> {
  return toggleCommentReaction(commentId, 'dislike');
}
