'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ProfileUpdateData } from '../types';
import { createProfileUpdateNotification } from '@/domains/notifications/actions/create';

/**
 * 사용자 프로필 정보 조회 서버 액션
 */
export async function getUserProfile(userId: string) {
  try {
    const supabase = await getSupabaseServer();
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nickname, email, full_name, username, icon_id, updated_at')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('프로필 조회 오류:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('프로필 조회 중 오류 발생:', error);
    return null;
  }
}

/**
 * 프로필 정보 업데이트 서버 액션
 */
export async function updateProfile(
  userId: string,
  data: ProfileUpdateData
): Promise<{ success: boolean; error?: string }> {
  try {
    // 필드 검증
    if (!data.nickname || data.nickname.trim().length < 2) {
      return { success: false, error: '닉네임은 최소 2자 이상이어야 합니다.' };
    }

    if (data.username && data.username.trim().length > 0) {
      const usernameRegex = /^[a-zA-Z0-9_]+$/;
      if (!usernameRegex.test(data.username)) {
        return { 
          success: false, 
          error: '사용자 이름은 영문자, 숫자, 언더스코어(_)만 사용할 수 있습니다.' 
        };
      }
    }

    // Supabase 클라이언트 생성
    const supabase = await getSupabaseServer();

    // 사용자 정보 확인
    const { data: { user }, error } = await supabase.auth.getUser();

    // 권한 확인
    if (!user || error || user.id !== userId) {
      return { success: false, error: '권한이 없습니다.' };
    }

    // 기존 프로필 정보 조회 (변경 감지용)
    const { data: oldProfile } = await supabase
      .from('profiles')
      .select('nickname, icon_id')
      .eq('id', userId)
      .single();

    // 프로필 업데이트
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        nickname: data.nickname,
        full_name: data.full_name || null,
        username: data.username || null,
        icon_id: data.icon_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    // 닉네임 변경 알림
    if (oldProfile && oldProfile.nickname !== data.nickname) {
      await createProfileUpdateNotification({
        userId,
        changeType: 'nickname',
        oldValue: oldProfile.nickname || undefined,
        newValue: data.nickname
      });
    }

    // 아이콘 변경 알림 (icon_id가 명시적으로 제공되고 변경된 경우)
    if (
      oldProfile &&
      data.icon_id !== undefined &&
      oldProfile.icon_id !== data.icon_id
    ) {
      await createProfileUpdateNotification({
        userId,
        changeType: 'profile_icon',
        oldValue: oldProfile.icon_id?.toString() || undefined,
        newValue: data.icon_id?.toString() || undefined
      });
    }

    // 페이지 캐시 갱신
    revalidatePath('/settings/profile');

    return { success: true };
  } catch (error: unknown) {
    console.error('프로필 업데이트 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '프로필 업데이트에 실패했습니다. 다시 시도해주세요.';
    return { 
      success: false, 
      error: errorMessage 
    };
  }
}

/**
 * 프로필 아이콘 업데이트 서버 액션
 */
export async function updateProfileIcon(
  userId: string,
  iconId: number | null
): Promise<{ success: boolean; error?: string }> {
  try {
    // Supabase 클라이언트 생성
    const supabase = await getSupabaseServer();

    // 사용자 정보 확인
    const { data: { user }, error } = await supabase.auth.getUser();

    // 권한 확인
    if (!user || error || user.id !== userId) {
      return { success: false, error: '권한이 없습니다.' };
    }

    // 기존 아이콘 정보 조회
    const { data: oldProfile } = await supabase
      .from('profiles')
      .select('icon_id')
      .eq('id', userId)
      .single();

    // 아이콘 업데이트
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        icon_id: iconId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    // 아이콘 변경 알림
    if (oldProfile && oldProfile.icon_id !== iconId) {
      await createProfileUpdateNotification({
        userId,
        changeType: 'profile_icon',
        oldValue: oldProfile.icon_id?.toString() || undefined,
        newValue: iconId?.toString() || undefined
      });
    }

    // 페이지 캐시 갱신
    revalidatePath('/settings/icons');

    return { success: true };
  } catch (error: unknown) {
    console.error('프로필 아이콘 업데이트 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '아이콘 업데이트에 실패했습니다. 다시 시도해주세요.';
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * 사용자 아이콘 목록 조회 서버 액션
 */
export async function getUserIcons(userId: string) {
  try {
    // Supabase 클라이언트 생성
    const supabase = await getSupabaseServer();
    
    // 사용자가 보유한 아이콘 목록 조회
    const { data, error } = await supabase
      .from('user_icons')
      .select(`
        shop_items (
          id,
          name,
          image_url
        )
      `)
      .eq('user_id', userId);
    
    if (error) {
      throw error;
    }
    
    // 데이터 형식 변환
    const icons = data.map(item => item.shop_items);
    
    return { success: true, data: icons };
  } catch (error) {
    console.error('아이콘 조회 오류:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '아이콘 목록을 불러오는데 실패했습니다.', 
      data: [] 
    };
  }
}

/**
 * 현재 사용자의 아이콘 정보 조회 서버 액션
 */
export async function getCurrentUserIcon(userId: string) {
  try {
    // Supabase 클라이언트 생성
    const supabase = await getSupabaseServer();
    
    // 사용자의 현재 아이콘 ID 조회
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('icon_id')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      throw profileError;
    }
    
    // 아이콘 ID가 null이면 기본 아이콘을 사용 중
    if (!profileData.icon_id) {
      return { success: true, data: null };
    }
    
    // 아이콘 정보 조회
    const { data: iconData, error: iconError } = await supabase
      .from('shop_items')
      .select('id, name, image_url')
      .eq('id', profileData.icon_id)
      .single();
    
    if (iconError) {
      throw iconError;
    }
    
    return { success: true, data: iconData };
  } catch (error) {
    console.error('현재 아이콘 조회 오류:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '현재 아이콘 정보를 불러오는데 실패했습니다.', 
      data: null 
    };
  }
}
