'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { Notification, NotificationsResponse } from '../types/notification';

/**
 * 알림 목록 조회
 */
export async function getNotifications(limit: number = 20): Promise<NotificationsResponse> {
  try {
    const supabase = await getSupabaseServer();
    
    // 현재 사용자 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }
    
    // 알림 목록 조회
    const { data, error } = await supabase
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
      .limit(limit);
    
    if (error) {
      console.error('알림 조회 오류:', error);
      return { success: false, error: error.message };
    }
    
    // 아이콘 URL 추가
    const notifications = await addActorIconUrls(data as Notification[] || [], supabase);
    
    // 안 읽은 알림 개수
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    
    return { 
      success: true, 
      notifications,
      unreadCount: unreadCount || 0
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




















