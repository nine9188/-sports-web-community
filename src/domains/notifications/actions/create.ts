'use server';

import { getSupabaseAdmin } from '@/shared/lib/supabase/server';
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

    // Admin Client 사용 (RLS 우회하여 시스템 알림 생성)
    const supabase = getSupabaseAdmin();

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

/**
 * 게시글 좋아요 알림 생성
 */
export async function createPostLikeNotification({
  postOwnerId,
  actorId,
  actorNickname,
  postId,
  postTitle,
  postNumber,
  boardSlug
}: {
  postOwnerId: string;
  actorId: string;
  actorNickname: string;
  postId: string;
  postTitle: string;
  postNumber: number;
  boardSlug: string;
}): Promise<NotificationActionResponse> {
  return createNotification({
    userId: postOwnerId,
    actorId,
    type: 'post_like',
    title: `${actorNickname}님이 게시글을 좋아합니다`,
    message: postTitle,
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
 * 댓글 좋아요 알림 생성
 */
export async function createCommentLikeNotification({
  commentOwnerId,
  actorId,
  actorNickname,
  commentId,
  commentContent,
  postNumber,
  boardSlug
}: {
  commentOwnerId: string;
  actorId: string;
  actorNickname: string;
  commentId: string;
  commentContent: string;
  postNumber: number;
  boardSlug: string;
}): Promise<NotificationActionResponse> {
  return createNotification({
    userId: commentOwnerId,
    actorId,
    type: 'comment_like',
    title: `${actorNickname}님이 댓글을 좋아합니다`,
    message: commentContent.length > 50 ? commentContent.substring(0, 50) + '...' : commentContent,
    link: `/boards/${boardSlug}/${postNumber}`,
    metadata: {
      comment_id: commentId,
      comment_content: commentContent,
      post_number: postNumber,
      board_slug: boardSlug
    }
  });
}

/**
 * 레벨업 알림 생성
 */
export async function createLevelUpNotification({
  userId,
  newLevel
}: {
  userId: string;
  newLevel: number;
}): Promise<NotificationActionResponse> {
  return createNotification({
    userId,
    actorId: null, // 시스템 알림
    type: 'level_up',
    title: `축하합니다! 레벨 ${newLevel}이 되었습니다! 🎉`,
    message: `계속해서 활동하고 경험치를 쌓아보세요!`,
    link: `/settings/profile`,
    metadata: {
      new_level: newLevel
    }
  });
}

/**
 * 신고 처리 결과 알림 생성
 */
export async function createReportResultNotification({
  reporterId,
  targetType,
  targetId,
  result,
  reason
}: {
  reporterId: string;
  targetType: 'post' | 'comment' | 'user' | 'match_comment';
  targetId: string;
  result: 'resolved' | 'dismissed';
  reason?: string;
}): Promise<NotificationActionResponse> {
  const titles = {
    resolved: '신고하신 내용이 처리되었습니다',
    dismissed: '신고하신 내용이 기각되었습니다'
  };

  const messages = {
    resolved: '관리자가 신고 내용을 확인하고 적절한 조치를 취했습니다.',
    dismissed: '검토 결과 신고 내용이 기각되었습니다.'
  };

  return createNotification({
    userId: reporterId,
    actorId: null, // 시스템/관리자 알림
    type: 'report_result',
    title: titles[result],
    message: reason || messages[result],
    link: null, // 신고 상세는 링크 없음
    metadata: {
      target_type: targetType,
      target_id: targetId,
      result,
      reason
    }
  });
}

/**
 * 관리자 공지 알림 생성
 */
export async function createAdminNoticeNotification({
  userIds,
  title,
  message,
  link
}: {
  userIds: string[]; // 여러 사용자에게 동시 전송
  title: string;
  message: string;
  link?: string;
}): Promise<{ success: boolean; sent: number; failed: number; errors?: string[] }> {
  const results = await Promise.allSettled(
    userIds.map(userId =>
      createNotification({
        userId,
        actorId: null, // 관리자 알림
        type: 'admin_notice',
        title,
        message,
        link: link || null,
        metadata: {
          is_admin_notice: true
        }
      })
    )
  );

  const sent = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  const errors = results
    .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    .map(r => r.reason?.message || '알 수 없는 오류');

  return {
    success: failed === 0,
    sent,
    failed,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * 전체 사용자에게 공지 알림 전송
 */
export async function createBroadcastNotification({
  title,
  message,
  link,
  adminId
}: {
  title: string;
  message: string;
  link?: string;
  adminId?: string;
}): Promise<{ success: boolean; sent: number; failed: number }> {
  const supabase = getSupabaseAdmin();

  // 모든 활성 사용자 ID 조회
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id')
    .or('is_suspended.is.null,is_suspended.eq.false');

  if (error || !users) {
    console.error('사용자 목록 조회 실패:', error);
    return { success: false, sent: 0, failed: 0 };
  }

  const userIds = users.map(u => u.id);
  const result = await createAdminNoticeNotification({ userIds, title, message, link });

  // 로그 저장
  if (adminId) {
    try {
      await supabase.from('admin_notification_logs').insert({
        admin_id: adminId,
        send_mode: 'all',
        title,
        message,
        link: link || null,
        target_user_ids: userIds,
        total_sent: result.sent,
        total_failed: result.failed
      });
    } catch (logError) {
      console.error('알림 발송 로그 저장 실패:', logError);
    }
  }

  return result;
}

/**
 * 선택한 사용자들에게 공지 알림 전송 (로그 포함)
 */
export async function createAdminNoticeWithLog({
  userIds,
  title,
  message,
  link,
  adminId
}: {
  userIds: string[];
  title: string;
  message: string;
  link?: string;
  adminId: string;
}): Promise<{ success: boolean; sent: number; failed: number; errors?: string[] }> {
  const result = await createAdminNoticeNotification({ userIds, title, message, link });

  // 로그 저장
  const supabase = getSupabaseAdmin();
  try {
    await supabase.from('admin_notification_logs').insert({
      admin_id: adminId,
      send_mode: 'selected',
      title,
      message,
      link: link || null,
      target_user_ids: userIds,
      total_sent: result.sent,
      total_failed: result.failed
    });
  } catch (logError) {
    console.error('알림 발송 로그 저장 실패:', logError);
  }

  return result;
}

/**
 * 알림 발송 기록 조회
 */
export async function getNotificationLogs(limit: number = 50): Promise<{
  success: boolean;
  logs?: Array<{
    id: string;
    admin: { nickname: string; email: string };
    send_mode: string;
    title: string;
    message: string;
    link: string | null;
    total_sent: number;
    total_failed: number;
    created_at: string;
  }>;
  error?: string;
}> {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('admin_notification_logs')
      .select(`
        id,
        send_mode,
        title,
        message,
        link,
        total_sent,
        total_failed,
        created_at,
        admin:profiles!admin_notification_logs_admin_id_fkey(
          nickname,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('알림 발송 기록 조회 실패:', error);
      return { success: false, error: error.message };
    }

    return { success: true, logs: data as any };
  } catch (error) {
    console.error('알림 발송 기록 조회 중 예외:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알림 발송 기록 조회 중 오류가 발생했습니다.'
    };
  }
}





