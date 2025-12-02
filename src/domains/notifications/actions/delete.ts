'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { NotificationActionResponse } from '../types/notification';

/**
 * 알림 삭제 (단일)
 */
export async function deleteNotification(id: string): Promise<NotificationActionResponse> {
  try {
    const supabase = await getSupabaseServer();

    // 현재 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: '인증되지 않은 사용자입니다.' };
    }

    // 알림 삭제 (본인의 알림만 삭제 가능)
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('알림 삭제 오류:', error);
      return { success: false, error: '알림 삭제에 실패했습니다.' };
    }

    return { success: true };
  } catch (error) {
    console.error('알림 삭제 중 오류:', error);
    return { success: false, error: '알림 삭제 중 오류가 발생했습니다.' };
  }
}

/**
 * 알림 일괄 삭제
 */
export async function deleteNotifications(ids: string[]): Promise<{ success: boolean; error?: string; deletedCount?: number }> {
  try {
    const supabase = await getSupabaseServer();

    // 현재 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: '인증되지 않은 사용자입니다.' };
    }

    if (!ids || ids.length === 0) {
      return { success: false, error: '삭제할 알림이 없습니다.' };
    }

    // 알림 일괄 삭제 (본인의 알림만 삭제 가능)
    const { error, count } = await supabase
      .from('notifications')
      .delete({ count: 'exact' })
      .in('id', ids)
      .eq('user_id', user.id);

    if (error) {
      console.error('알림 일괄 삭제 오류:', error);
      return { success: false, error: '알림 삭제에 실패했습니다.' };
    }

    return { success: true, deletedCount: count || 0 };
  } catch (error) {
    console.error('알림 일괄 삭제 중 오류:', error);
    return { success: false, error: '알림 삭제 중 오류가 발생했습니다.' };
  }
}
