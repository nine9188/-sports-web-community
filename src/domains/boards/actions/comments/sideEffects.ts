import 'server-only';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { rewardUserActivity, getActivityTypeValues } from '@/shared/actions/activity-actions';
import { checkReferralMilestone } from '@/shared/actions/referral-actions';
import { logUserAction } from '@/shared/actions/log-actions';
import {
  createCommentLikeNotification,
  createCommentNotification,
  createReplyNotification,
} from '@/domains/notifications/actions';
import { checkHotPostEntry } from '@/domains/notifications/actions/checkHotPostEntry';
import { oneOrNull } from '@/shared/utils/supabaseRelations';

type SupabaseServerClient = Awaited<ReturnType<typeof getSupabaseServer>>;

export async function runCommentCreateSideEffects({
  supabase,
  postId,
  commentId,
  actorId,
  actorNickname,
  parentId,
  parentCommentOwnerId,
  content,
}: {
  supabase: SupabaseServerClient;
  postId: string;
  commentId: string;
  actorId: string;
  actorNickname: string;
  parentId: string | null;
  parentCommentOwnerId: string | null;
  content: string;
}) {
  await Promise.allSettled([
    logUserAction(
      'COMMENT_CREATE',
      parentId ? `대댓글 작성 (게시글 ID: ${postId})` : `댓글 작성 (게시글 ID: ${postId})`,
      actorId,
      {
        commentId,
        postId,
        parentId,
        content: content.substring(0, 50) + (content.length > 50 ? '...' : '')
      }
    ),
    handleCommentCreateReward(supabase, actorId, commentId),
    handleCommentCreateNotification({
      supabase,
      postId,
      commentId,
      actorId,
      actorNickname,
      parentId,
      parentCommentOwnerId,
      content
    })
  ]);
}

export async function handleCommentLikeNotification(
  supabase: SupabaseServerClient,
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

    const { data: cnRow } = await supabase.rpc('get_single_comment_number', { p_comment_id: commentId }) as { data: { comment_number: number }[] | null; error: unknown };
    const commentNumber = cnRow?.[0]?.comment_number;

    const { data: profile } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('id', userId)
      .single();

    const postRow = oneOrNull(commentData.post);
    const post = postRow
      ? { ...postRow, board: oneOrNull(postRow.board) }
      : null;

    if (profile && post?.board?.slug) {
      await createCommentLikeNotification({
        commentOwnerId: commentData.user_id,
        actorId: userId,
        actorNickname: profile.nickname || '알 수 없음',
        commentId,
        commentNumber,
        commentContent: commentData.content,
        postNumber: post.post_number,
        boardSlug: post.board.slug
      });
    }

    const activityTypes = await getActivityTypeValues();
    await rewardUserActivity(commentData.user_id, activityTypes.RECEIVED_LIKE, commentId);
    await rewardUserActivity(userId, activityTypes.GIVE_LIKE, commentId);
  } catch (error) {
    console.error('댓글 좋아요 알림/보상 처리 오류:', error);
  }
}

async function handleCommentCreateReward(
  supabase: SupabaseServerClient,
  userId: string,
  commentId: string
) {
  try {
    const activityTypes = await getActivityTypeValues();
    await rewardUserActivity(userId, activityTypes.COMMENT_CREATION, commentId);

    const { count: commentCount } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (commentCount === 1) {
      await checkReferralMilestone(userId, 'first_comment');
    }
  } catch (rewardError) {
    console.error('댓글 작성 보상 지급 오류:', rewardError);
  }
}

async function handleCommentCreateNotification({
  supabase,
  postId,
  commentId,
  actorId,
  actorNickname,
  parentId,
  parentCommentOwnerId,
  content,
}: {
  supabase: SupabaseServerClient;
  postId: string;
  commentId: string;
  actorId: string;
  actorNickname: string;
  parentId: string | null;
  parentCommentOwnerId: string | null;
  content: string;
}) {
  try {
    const { data: cnRow } = await supabase.rpc('get_single_comment_number', { p_comment_id: commentId }) as { data: { comment_number: number }[] | null; error: unknown };
    const commentNumber = cnRow?.[0]?.comment_number;

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
      const boardSlug = oneOrNull(postData.board)?.slug || '';

      if (parentId && parentCommentOwnerId) {
        await createReplyNotification({
          parentCommentOwnerId,
          actorId,
          actorNickname,
          postId,
          postNumber: postData.post_number,
          boardSlug,
          commentContent: content,
          commentNumber
        });
      } else {
        await createCommentNotification({
          postOwnerId: postData.user_id,
          actorId,
          actorNickname,
          postId,
          postTitle: postData.title,
          postNumber: postData.post_number,
          boardSlug,
          commentContent: content,
          commentNumber
        });
      }
    }

    checkHotPostEntry(postId).catch(() => {});
  } catch (notificationError) {
    console.error('알림 생성 오류:', notificationError);
  }
}
