'use server';

import { createClient } from '@/shared/api/supabaseServer';
import { CreateNotificationParams, NotificationActionResponse } from '../types/notification';

/**
 * 알림 생성
 * - 자기 자신에게는 알림을 보내지 않음
 */
export async function createNotification(params: CreateNotificationParams): Promise<NotificationActionResponse> {
  const { userId, actorId, type, title, message, link, metadata } = params;
  
  try {
    // 자기 자신에게 알림 보내지 않음
    if (actorId && userId === actorId) {
      return { success: true }; // 에러 아님, 그냥 알림 안 보냄
    }
    
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        actor_id: actorId || null,
        type,
        title,
        message: message || null,
        link: link || null,
        metadata: metadata || {}
      })
      .select()
      .single();
    
    if (error) {
      console.error('알림 생성 오류:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, notification: data };
  } catch (error) {
    console.error('알림 생성 중 예외:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '알림 생성 중 오류가 발생했습니다.' 
    };
  }
}

/**
 * 댓글 알림 생성 (게시글 작성자에게)
 */
export async function createCommentNotification({
  postOwnerId,
  actorId,
  actorNickname,
  postId,
  postTitle,
  postNumber,
  boardSlug,
  commentContent
}: {
  postOwnerId: string;
  actorId: string;
  actorNickname: string;
  postId: string;
  postTitle: string;
  postNumber: number;
  boardSlug: string;
  commentContent: string;
}): Promise<NotificationActionResponse> {
  return createNotification({
    userId: postOwnerId,
    actorId,
    type: 'comment',
    title: `${actorNickname}님이 댓글을 남겼습니다`,
    message: commentContent.length > 50 ? commentContent.substring(0, 50) + '...' : commentContent,
    link: `/boards/${boardSlug}/${postNumber}`,
    metadata: {
      post_id: postId,
      post_title: postTitle,
      post_number: postNumber,
      board_slug: boardSlug
    }
  });
}

/**
 * 대댓글 알림 생성 (부모 댓글 작성자에게)
 */
export async function createReplyNotification({
  parentCommentOwnerId,
  actorId,
  actorNickname,
  postId,
  postNumber,
  boardSlug,
  commentContent
}: {
  parentCommentOwnerId: string;
  actorId: string;
  actorNickname: string;
  postId: string;
  postNumber: number;
  boardSlug: string;
  commentContent: string;
}): Promise<NotificationActionResponse> {
  return createNotification({
    userId: parentCommentOwnerId,
    actorId,
    type: 'reply',
    title: `${actorNickname}님이 답글을 남겼습니다`,
    message: commentContent.length > 50 ? commentContent.substring(0, 50) + '...' : commentContent,
    link: `/boards/${boardSlug}/${postNumber}`,
    metadata: {
      post_id: postId,
      post_number: postNumber,
      board_slug: boardSlug
    }
  });
}

