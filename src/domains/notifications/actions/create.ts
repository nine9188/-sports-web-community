'use server';

import { getSupabaseAdmin, getSupabaseServer } from '@/shared/lib/supabase/server';
import { CreateNotificationParams, NotificationActionResponse } from '../types/notification';

async function requireAdmin(): Promise<{ userId: string } | { error: string }> {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) return { error: '관리자 권한이 필요합니다.' };
  return { userId: user.id };
}

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

    // Realtime Broadcast로 즉시 전송
    const channel = supabase.channel(`notifications:${userId}`);
    await channel.send({
      type: 'broadcast',
      event: 'new_notification',
      payload: data
    });
    supabase.removeChannel(channel);

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
  commentContent,
  commentNumber
}: {
  postOwnerId: string;
  actorId: string;
  actorNickname: string;
  postId: string;
  postTitle: string;
  postNumber: number;
  boardSlug: string;
  commentContent: string;
  commentNumber?: number;
}): Promise<NotificationActionResponse> {
  const hash = commentNumber ? `#comment-${commentNumber}` : '';
  return createNotification({
    userId: postOwnerId,
    actorId,
    type: 'comment',
    title: `${actorNickname}님이 댓글을 남겼습니다`,
    message: commentContent.length > 50 ? commentContent.substring(0, 50) + '...' : commentContent,
    link: `/boards/${boardSlug}/${postNumber}${hash}`,
    metadata: {
      post_id: postId,
      post_title: postTitle,
      post_number: postNumber,
      board_slug: boardSlug,
      comment_number: commentNumber
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
  commentContent,
  commentNumber
}: {
  parentCommentOwnerId: string;
  actorId: string;
  actorNickname: string;
  postId: string;
  postNumber: number;
  boardSlug: string;
  commentContent: string;
  commentNumber?: number;
}): Promise<NotificationActionResponse> {
  const hash = commentNumber ? `#comment-${commentNumber}` : '';
  return createNotification({
    userId: parentCommentOwnerId,
    actorId,
    type: 'reply',
    title: `${actorNickname}님이 답글을 남겼습니다`,
    message: commentContent.length > 50 ? commentContent.substring(0, 50) + '...' : commentContent,
    link: `/boards/${boardSlug}/${postNumber}${hash}`,
    metadata: {
      post_id: postId,
      post_number: postNumber,
      board_slug: boardSlug,
      comment_number: commentNumber
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
  commentNumber,
  commentContent,
  postNumber,
  boardSlug
}: {
  commentOwnerId: string;
  actorId: string;
  actorNickname: string;
  commentId: string;
  commentNumber?: number;
  commentContent: string;
  postNumber: number;
  boardSlug: string;
}): Promise<NotificationActionResponse> {
  const hash = commentNumber ? `#comment-${commentNumber}` : '';
  return createNotification({
    userId: commentOwnerId,
    actorId,
    type: 'comment_like',
    title: `${actorNickname}님이 댓글을 좋아합니다`,
    message: commentContent.length > 50 ? commentContent.substring(0, 50) + '...' : commentContent,
    link: `/boards/${boardSlug}/${postNumber}${hash}`,
    metadata: {
      comment_id: commentId,
      comment_number: commentNumber,
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
    actorId: undefined, // 시스템 알림
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
    actorId: undefined, // 시스템/관리자 알림
    type: 'report_result',
    title: titles[result],
    message: reason || messages[result],
    link: undefined, // 신고 상세는 링크 없음
    metadata: {
      target_type: targetType,
      target_id: targetId,
      result,
      reason
    }
  });
}

/**
 * 관리자 공지 알림 생성 (배치 INSERT)
 */
export async function createAdminNoticeNotification({
  userIds,
  title,
  message,
  link
}: {
  userIds: string[];
  title: string;
  message: string;
  link?: string;
}): Promise<{ success: boolean; sent: number; failed: number; errors?: string[] }> {
  const supabase = getSupabaseAdmin();
  const BATCH_SIZE = 500;
  let totalSent = 0;
  let totalFailed = 0;
  const errors: string[] = [];

  const rows = userIds.map(userId => ({
    user_id: userId,
    actor_id: null,
    type: 'admin_notice' as const,
    title,
    message,
    link: link || null,
    metadata: { is_admin_notice: true }
  }));

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase
      .from('notifications')
      .insert(batch)
      .select('id');

    if (error) {
      totalFailed += batch.length;
      errors.push(error.message);
    } else {
      totalSent += data?.length ?? 0;
    }
  }

  return {
    success: totalFailed === 0,
    sent: totalSent,
    failed: totalFailed,
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
  const adminCheck = await requireAdmin();
  if ('error' in adminCheck) {
    return { success: false, sent: 0, failed: 0 };
  }

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

  const userIds = users.map((u: { id: string }) => u.id);
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
  const adminCheck = await requireAdmin();
  if ('error' in adminCheck) {
    return { success: false, sent: 0, failed: 0, errors: [adminCheck.error] };
  }

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
 * 회원가입 환영 알림 생성
 *
 * TODO: 나중에 공지사항 게시글 작성 후 해당 게시글 링크로 변경 필요
 * 예: link: '/boards/notice/1' (초보자 가이드 공지글)
 */
export async function createWelcomeNotification({
  userId
}: {
  userId: string;
}): Promise<NotificationActionResponse> {
  return createNotification({
    userId,
    actorId: undefined, // 시스템 알림
    type: 'welcome',
    title: '환영합니다! 4590 Football에 오신 것을 환영합니다! 👋',
    message: '커뮤니티 가이드와 인기 게시판을 둘러보세요!',
    // TODO: 공지사항 게시글 작성 후 해당 링크로 변경 (예: '/boards/notice/1')
    link: '/boards/popular',
    metadata: {
      is_welcome: true,
      popular_link: '/boards/popular'
    }
  });
}

/**
 * HOT 게시글 진입 알림 생성
 */
export async function createHotPostNotification({
  userId,
  postId,
  postTitle,
  boardSlug,
  postNumber,
  hotRank,
  hotScore
}: {
  userId: string;
  postId: string;
  postTitle: string;
  boardSlug: string;
  postNumber: number;
  hotRank: number;
  hotScore: number;
}): Promise<NotificationActionResponse> {
  return createNotification({
    userId,
    actorId: undefined, // 시스템 알림
    type: 'hot_post',
    title: `🔥 내 게시글이 HOT 게시글 ${hotRank}위에 진입했어요!`,
    message: postTitle.length > 50 ? postTitle.substring(0, 50) + '...' : postTitle,
    link: `/boards/${boardSlug}/${postNumber}`,
    metadata: {
      post_id: postId,
      post_title: postTitle,
      post_number: postNumber,
      board_slug: boardSlug,
      hot_rank: hotRank,
      hot_score: hotScore
    }
  });
}

/**
 * 프로필 변경 알림 생성 (자기 자신에게)
 */
export async function createProfileUpdateNotification({
  userId,
  changeType,
  oldValue,
  newValue,
  ipAddress,
  userAgent
}: {
  userId: string;
  changeType: 'nickname' | 'profile_icon' | 'password';
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<NotificationActionResponse> {
  // 변경 타입별 알림 내용 생성
  let title: string;
  let message: string | undefined;

  switch (changeType) {
    case 'nickname':
      title = '닉네임이 변경되었습니다';
      message = oldValue && newValue ? `"${oldValue}" → "${newValue}"` : undefined;
      break;
    case 'profile_icon':
      title = '프로필 아이콘이 변경되었습니다';
      message = oldValue && newValue ? `아이콘 ${oldValue} → ${newValue}` : undefined;
      break;
    case 'password':
      title = '비밀번호가 변경되었습니다';
      message = ipAddress
        ? `본인이 아닌 경우 즉시 비밀번호를 재변경하세요. (${ipAddress})`
        : '본인이 아닌 경우 즉시 비밀번호를 재변경하세요.';
      break;
  }

  // 프로필 변경 알림은 자기 자신에게 보내므로 actorId = userId
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        actor_id: userId, // 자기 자신
        type: 'profile_update',
        title,
        message: message || null,
        link: '/settings/profile',
        metadata: {
          changeType,
          oldValue,
          newValue,
          changedAt: new Date().toISOString(),
          ipAddress: changeType === 'password' ? ipAddress : undefined,
          userAgent: changeType === 'password' ? userAgent : undefined
        }
      })
      .select()
      .single();

    if (error) {
      console.error('프로필 변경 알림 생성 오류:', error);
      return { success: false, error: error.message };
    }

    return { success: true, notification: data };
  } catch (error) {
    console.error('프로필 변경 알림 생성 중 예외:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '프로필 변경 알림 생성 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 계정 정지 알림 생성
 */
export async function createSuspensionNotification({
  userId,
  reason,
  suspendedUntil,
  days
}: {
  userId: string;
  reason: string;
  suspendedUntil: string;
  days: number;
}): Promise<NotificationActionResponse> {
  const untilDate = new Date(suspendedUntil);
  const formattedDate = untilDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Seoul'
  });

  return createNotification({
    userId,
    actorId: undefined, // 시스템/관리자 알림
    type: 'suspension',
    title: `⚠️ 계정이 ${days}일간 정지되었습니다`,
    message: `사유: ${reason}\n해제일: ${formattedDate}`,
    link: '/settings/profile',
    metadata: {
      suspension_reason: reason,
      suspended_until: suspendedUntil,
      suspension_days: days
    }
  });
}

/**
 * 계정 정지 해제 알림 생성
 */
export async function createUnsuspensionNotification({
  userId
}: {
  userId: string;
}): Promise<NotificationActionResponse> {
  return createNotification({
    userId,
    actorId: undefined, // 시스템/관리자 알림
    type: 'suspension',
    title: `✅ 계정 정지가 해제되었습니다`,
    message: '이제 모든 서비스를 정상적으로 이용할 수 있습니다.',
    link: '/settings/profile',
    metadata: {
      is_unsuspension: true
    }
  });
}

/**
 * 관리자 공지 발송용 사용자 목록 조회
 */
export async function getUsersForAdminNotification(): Promise<{
  success: boolean;
  users?: Array<{
    id: string;
    nickname: string;
    email: string;
    level: number;
  }>;
  error?: string;
}> {
  try {
    const adminCheck = await requireAdmin();
    if ('error' in adminCheck) {
      return { success: false, error: adminCheck.error };
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('profiles')
      .select('id, nickname, email, level')
      .or('is_suspended.is.null,is_suspended.eq.false')
      .order('level', { ascending: false })
      .limit(100);

    if (error) {
      console.error('사용자 목록 조회 실패:', error);
      return { success: false, error: error.message };
    }

    return { success: true, users: data || [] };
  } catch (error) {
    console.error('사용자 목록 조회 중 예외:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '사용자 목록 조회 중 오류가 발생했습니다.'
    };
  }
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
    const adminCheck = await requireAdmin();
    if ('error' in adminCheck) {
      return { success: false, error: adminCheck.error };
    }

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

    return { success: true, logs: data as Array<{
      id: string;
      admin: { nickname: string; email: string };
      send_mode: string;
      title: string;
      message: string;
      link: string | null;
      total_sent: number;
      total_failed: number;
      created_at: string;
    }> };
  } catch (error) {
    console.error('알림 발송 기록 조회 중 예외:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알림 발송 기록 조회 중 오류가 발생했습니다.'
    };
  }
}






