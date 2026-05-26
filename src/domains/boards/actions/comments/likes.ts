'use server';

import { after } from 'next/server';
import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { CommentLikeResponse } from './utils';
import { handleCommentLikeNotification } from './sideEffects';

type ReactionType = 'like' | 'dislike';

/**
 * 댓글 좋아요/싫어요 토글 공통 로직
 * 원자적 증감 연산으로 Race Condition 방지
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
      return { success: false, error: `리액션 조회 오류: ${checkError.message}` };
    }

    if (existingRecord) {
      // 리액션 취소
      const { error: deleteError } = await supabase
        .from('comment_likes')
        .delete()
        .eq('id', existingRecord.id);

      if (deleteError) {
        return { success: false, error: `리액션 삭제 오류: ${deleteError.message}` };
      }

      // 원자적 감소
      const column = reactionType === 'like' ? 'likes' : 'dislikes';
      await supabase.rpc('decrement_comment_count', {
        row_id: commentId,
        column_name: column,
      });

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
          // 반대 리액션 원자적 감소
          const oppositeColumn = oppositeType === 'like' ? 'likes' : 'dislikes';
          await supabase.rpc('decrement_comment_count', {
            row_id: commentId,
            column_name: oppositeColumn,
          });
        }
      }

      // 새 리액션 추가
      const { error: insertError } = await supabase
        .from('comment_likes')
        .insert({ comment_id: commentId, user_id: user.id, type: reactionType });

      if (insertError) {
        return { success: false, error: `리액션 추가 오류: ${insertError.message}` };
      }

      // 원자적 증가
      const column = reactionType === 'like' ? 'likes' : 'dislikes';
      await supabase.rpc('increment_comment_count', {
        row_id: commentId,
        column_name: column,
      });

      newUserAction = reactionType;
    }

    // 최종 카운트 조회 (원자적 연산 후 정확한 값)
    const { data: updatedComment } = await supabase
      .from('comments')
      .select('likes, dislikes')
      .eq('id', commentId)
      .single();

    const likes = updatedComment?.likes || 0;
    const dislikes = updatedComment?.dislikes || 0;

    // 좋아요가 새로 추가된 경우 알림 및 보상 처리
    if (reactionType === 'like' && newUserAction === 'like') {
      after(() => handleCommentLikeNotification(supabase, commentId, user.id));
    }

    return { success: true, likes, dislikes, userAction: newUserAction };
  } catch (error) {
    console.error(`[${reactionType}Comment] 처리 중 오류:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.'
    };
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
