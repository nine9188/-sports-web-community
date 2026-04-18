'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { Notification, NotificationsResponse } from '../types/notification';

/**
 * 알림 목록 조회
 * - 알림 목록과 unreadCount를 단일 쿼리 + JS 카운트로 처리
 * - limit이 충분히 크면 별도 count 쿼리 불필요
 */
export async function getNotifications(limit: number = 20): Promise<NotificationsResponse> {
  try {
    const supabase = await getSupabaseServer();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    const [listResult, countResult] = await Promise.all([
      supabase
        .from('notifications')
        .select(`
          *,
          actor:profiles!notifications_actor_id_fkey(
            nickname,
            icon_id,
            level
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit),
      supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
    ]);

    if (listResult.error) {
      console.error('알림 조회 오류:', listResult.error);
      return { success: false, error: listResult.error.message };
    }

    const notifications = await addActorIconUrls(listResult.data as Notification[] || [], supabase);

    return {
      success: true,
      notifications,
      unreadCount: countResult.count || 0
    };
  } catch (error) {
    console.error('알림 목록 조회 중 예외:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알림 목록을 불러오는 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 안 읽은 알림 개수만 조회
 */
export async function getUnreadNotificationCount(): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const supabase = await getSupabaseServer();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }
    
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, count: count || 0 };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '알림 개수 조회 중 오류가 발생했습니다.' 
    };
  }
}

// 액터 아이콘 URL 추가
async function addActorIconUrls(
  notifications: Notification[],
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>
): Promise<Notification[]> {
  const iconIds = notifications
    .map(n => n.actor?.icon_id)
    .filter((id): id is number => id !== null && id !== undefined);

  if (iconIds.length === 0) return notifications;

  const { data: icons } = await supabase
    .from('shop_items')
    .select('id, image_url')
    .in('id', iconIds);

  const iconMap: Record<number, string> = {};
  icons?.forEach((icon: { id: number | null; image_url: string | null }) => {
    if (icon.id && icon.image_url) {
      iconMap[icon.id] = icon.image_url;
    }
  });
  
  return notifications.map(notification => {
    if (notification.actor?.icon_id && iconMap[notification.actor.icon_id]) {
      return {
        ...notification,
        actor: {
          ...notification.actor,
          icon_url: iconMap[notification.actor.icon_id]
        }
      };
    }
    return notification;
  });
}








































