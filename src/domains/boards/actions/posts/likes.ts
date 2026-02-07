'use server';

import { rewardUserActivity, getActivityTypeValues } from '@/shared/actions/activity-actions';
import { checkSuspensionGuard } from '@/shared/utils/suspension-guard';
import { logUserAction } from '@/shared/actions/log-actions';
import { getSupabaseAction } from '@/shared/lib/supabase/server';
import { LikeActionResponse } from './utils';
import { createPostLikeNotification } from '@/domains/notifications/actions';

type LikeType = 'like' | 'dislike';

/**
 * 좋아요/싫어요 토글 공통 로직
 */
async function togglePostReaction(
  postId: string,
  reactionType: LikeType
): Promise<LikeActionResponse> {
  try {
    const supabase = await getSupabaseAction();

    if (!supabase) {
      return { success: false, error: 'Supabase 클라이언트 초기화 실패' };
    }

    // 인증 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    const userId = user.id;

    // 계정 정지 상태 확인
    const suspensionCheck = await checkSuspensionGuard(userId);
    if (suspensionCheck.isSuspended) {
      return {
        success: false,
        error: suspensionCheck.message || `계정이 정지되어 ${reactionType === 'like' ? '좋아요' : '싫어요'}를 누를 수 없습니다.`
      };
    }

    // 게시글 정보 조회
    const { data: currentPost, error: fetchError } = await supabase
      .from('posts')
      .select('likes, dislikes, user_id')
      .eq('id', postId)
      .single();

    if (fetchError || !currentPost) {
      return { success: false, error: '게시글 정보를 조회할 수 없습니다.' };
    }

    // 현재 리액션 확인
    const { data: existingRecord, error: checkError } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .eq('type', reactionType);

    if (checkError) {
      return { success: false, error: `${reactionType === 'like' ? '좋아요' : '싫어요'} 기록을 확인할 수 없습니다.` };
    }

    const alreadyReacted = existingRecord && existingRecord.length > 0;
    let newLikes = currentPost.likes;
    let newDislikes = currentPost.dislikes;
    let newUserAction: LikeType | null = null;
    const oppositeType: LikeType = reactionType === 'like' ? 'dislike' : 'like';

    if (alreadyReacted) {
      // 리액션 취소
      const { error: deleteError } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId)
        .eq('type', reactionType);

      if (deleteError) {
        return { success: false, error: `${reactionType === 'like' ? '좋아요' : '싫어요'} 취소 중 오류가 발생했습니다.` };
      }

      // 카운트 감소
      if (reactionType === 'like') {
        newLikes = Math.max(0, (currentPost.likes || 0) - 1);
      } else {
        newDislikes = Math.max(0, (currentPost.dislikes || 0) - 1);
      }

      const { error: updateError } = await supabase
        .from('posts')
        .update(reactionType === 'like' ? { likes: newLikes } : { dislikes: newDislikes })
        .eq('id', postId);

      if (updateError) {
        return { success: false, error: `${reactionType === 'like' ? '좋아요' : '싫어요'} 수 갱신 중 오류가 발생했습니다.` };
      }

      newUserAction = null;
    } else {
      // 반대 리액션 제거
      const { data: oppositeRecord } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .eq('type', oppositeType);

      if (oppositeRecord && oppositeRecord.length > 0) {
        const { error: deleteOppositeError } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId)
          .eq('type', oppositeType);

        if (!deleteOppositeError) {
          if (oppositeType === 'like') {
            newLikes = Math.max(0, (currentPost.likes || 0) - 1);
          } else {
            newDislikes = Math.max(0, (currentPost.dislikes || 0) - 1);
          }
        }
      }

      // 새 리액션 추가
      const { error: insertError } = await supabase
        .from('post_likes')
        .insert([{ post_id: postId, user_id: userId, type: reactionType }]);

      if (insertError) {
        return { success: false, error: `${reactionType === 'like' ? '좋아요' : '싫어요'} 추가 중 오류가 발생했습니다.` };
      }

      // 카운트 증가
      if (reactionType === 'like') {
        newLikes = (currentPost.likes || 0) + 1;
      } else {
        newDislikes = (currentPost.dislikes || 0) + 1;
      }

      const { error: updateError } = await supabase
        .from('posts')
        .update({ likes: newLikes, dislikes: newDislikes })
        .eq('id', postId);

      if (updateError) {
        return { success: false, error: `${reactionType === 'like' ? '좋아요' : '싫어요'} 수 갱신 중 오류가 발생했습니다.` };
      }

      newUserAction = reactionType;

      // 좋아요인 경우 추가 처리
      if (reactionType === 'like') {
        await logUserAction('POST_LIKE', `게시글 좋아요 (ID: ${postId})`, userId, { postId });

        // 게시글 작성자에게 알림 및 보상
        if (currentPost.user_id && currentPost.user_id !== userId) {
          await handleLikeNotification(supabase, postId, userId, currentPost.user_id);
        }
      }
    }

    return {
      success: true,
      likes: newLikes || 0,
      dislikes: newDislikes || 0,
      userAction: newUserAction
    };
  } catch (error) {
    console.error(`${reactionType} 처리 중 오류:`, error);
    return { success: false, error: `${reactionType === 'like' ? '좋아요' : '싫어요'} 처리 중 오류가 발생했습니다.` };
  }
}

/**
 * 좋아요 알림 처리
 */
async function handleLikeNotification(
  supabase: Awaited<ReturnType<typeof getSupabaseAction>>,
  postId: string,
  userId: string,
  postOwnerId: string
): Promise<void> {
  try {
    const { data: postData } = await supabase
      .from('posts')
      .select(`title, post_number, board:boards(slug)`)
      .eq('id', postId)
      .single();

    const { data: profile } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('id', userId)
      .single();

    if (postData && profile) {
      const boardSlug = (postData.board as { slug: string } | null)?.slug || '';

      await createPostLikeNotification({
        postOwnerId,
        actorId: userId,
        actorNickname: profile.nickname || '알 수 없음',
        postId,
        postTitle: postData.title,
        postNumber: postData.post_number,
        boardSlug
      });
    }

    const activityTypes = await getActivityTypeValues();
    // 게시글 작성자에게 추천 받기 보상
    await rewardUserActivity(postOwnerId, activityTypes.RECEIVED_LIKE, postId);
    // 추천한 사람에게 추천하기 보상 (Phase 3)
    await rewardUserActivity(userId, activityTypes.GIVE_LIKE, postId);
  } catch (error) {
    console.error('게시글 좋아요 알림/보상 처리 오류:', error);
  }
}

/**
 * 게시글 좋아요 액션
 */
export async function likePost(postId: string): Promise<LikeActionResponse> {
  return togglePostReaction(postId, 'like');
}

/**
 * 게시글 싫어요 액션
 */
export async function dislikePost(postId: string): Promise<LikeActionResponse> {
  return togglePostReaction(postId, 'dislike');
}

/**
 * 사용자가 게시글에 한 액션(좋아요/싫어요) 조회
 */
export async function getUserPostAction(postId: string): Promise<{ userAction: LikeType | null; error?: string }> {
  try {
    const supabase = await getSupabaseAction();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { userAction: null, error: '로그인이 필요합니다.' };
    }

    const userId = user.id;

    // 좋아요 확인
    const { data: likeRecord } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .eq('type', 'like')
      .maybeSingle();

    if (likeRecord) {
      return { userAction: 'like' };
    }

    // 싫어요 확인
    const { data: dislikeRecord } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .eq('type', 'dislike')
      .maybeSingle();

    if (dislikeRecord) {
      return { userAction: 'dislike' };
    }

    return { userAction: null };
  } catch (error) {
    console.error('사용자 액션 확인 중 오류:', error);
    return { userAction: null };
  }
}
