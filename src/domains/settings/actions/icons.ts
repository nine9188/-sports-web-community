'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { ActionResponse, IconItem, UserItem } from '../types';
import { createProfileUpdateNotification } from '@/domains/notifications/actions/create';
import { getLevelIconUrl } from '@/shared/utils/level-icons-server';

/**
 * 사용자가 보유한 아이콘 목록 조회
 * @param userId 사용자 ID
 * @returns 아이콘 목록 데이터
 */
export async function getUserIcons(userId: string): Promise<ActionResponse<IconItem[]>> {
  try {
    if (!userId) {
      return {
        success: false,
        error: '사용자 ID가 필요합니다.',
        data: []
      };
    }
    
    const supabase = await getSupabaseServer();
    
    // 사용자의 아이콘 목록 조회 (소모품 제외 - 닉네임 변경권 등)
    const { data, error } = await supabase
      .from('user_items')
      .select(`
        item_id,
        shop_items!inner(id, name, image_url, is_consumable)
      `)
      .eq('user_id', userId)
      .eq('shop_items.is_consumable', false);
    
    if (error) {
      console.error('아이콘 목록 조회 오류:', error);
      return { 
        success: false, 
        error: error.message || '아이콘 목록을 불러오는데 실패했습니다.',
        data: []
      };
    }
    
    // 데이터 변환 - UserItem 타입으로 먼저 캐스팅 후 IconItem 배열로 변환
    const userItems = data as unknown as UserItem[];
    
    // 데이터 유효성 검증 및 변환
    const icons: IconItem[] = userItems
      .filter(item => item?.shop_items?.id && item?.shop_items?.name && item?.shop_items?.image_url)
      .map(item => ({
        id: item.shop_items.id,
        name: item.shop_items.name,
        image_url: item.shop_items.image_url
      }));
    
    return {
      success: true,
      data: icons
    };
  } catch (error) {
    console.error('아이콘 목록 조회 처리 오류:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '아이콘 목록을 불러오는데 실패했습니다.',
      data: []
    };
  }
}

/**
 * 현재 사용자 아이콘 정보 조회
 * @param userId 사용자 ID
 * @returns 현재 사용중인 아이콘 정보
 */
export async function getCurrentUserIcon(userId: string): Promise<ActionResponse<IconItem | null>> {
  try {
    if (!userId) {
      return { 
        success: false, 
        error: '사용자 ID가 필요합니다.',
        data: null
      };
    }
    
    const supabase = await getSupabaseServer();
    
    // 프로필 정보 조회
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('icon_id')
      .eq('id', userId)
      .single();
      
    if (profileError) {
      console.error('프로필 조회 오류:', profileError);
      return { 
        success: false, 
        error: profileError.message || '프로필 정보를 불러오는데 실패했습니다.',
        data: null
      };
    }
    
    // 아이콘 ID가 없는 경우
    if (!profile || !profile.icon_id) {
      return { success: true, data: null };
    }
    
    // 아이콘 정보 조회
    const { data: iconData, error: iconError } = await supabase
      .from('shop_items')
      .select('id, name, image_url')
      .eq('id', profile.icon_id)
      .single();
      
    if (iconError) {
      console.error('아이콘 정보 조회 오류:', iconError);
      return { 
        success: false, 
        error: iconError.message || '아이콘 정보를 불러오는데 실패했습니다.',
        data: null
      };
    }
    
    // 데이터 유효성 검증
    if (!iconData?.id || !iconData?.name || !iconData?.image_url) {
      return {
        success: false,
        error: '아이콘 정보가 완전하지 않습니다.',
        data: null
      };
    }
    
    const icon: IconItem = {
      id: iconData.id,
      name: iconData.name,
      image_url: iconData.image_url
    };
    
    return { 
      success: true, 
      data: icon
    };
  } catch (error) {
    console.error('현재 아이콘 정보 조회 오류:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '아이콘 정보를 불러오는 중 오류가 발생했습니다.',
      data: null
    };
  }
}

/**
 * 아이콘 설정 페이지용 통합 데이터 조회
 * 기존 getUserIcons + getCurrentUserIcon을 하나로 합쳐 쿼리 수를 줄임
 *
 * 기존: profiles(level) + user_items/shop_items + profiles(icon_id) + shop_items = 4쿼리
 * 통합: profiles(level, icon_id) + user_items/shop_items = 1쿼리 (page에서 profile 조회 통합)
 */
export async function getIconSettingsData(userId: string, iconId: number | null): Promise<ActionResponse<{ userIcons: IconItem[]; currentIcon: IconItem | null }>> {
  try {
    if (!userId) {
      return { success: false, error: '사용자 ID가 필요합니다.', data: { userIcons: [], currentIcon: null } };
    }

    const supabase = await getSupabaseServer();

    // 보유 아이콘 목록 조회 (1회 쿼리)
    const { data, error } = await supabase
      .from('user_items')
      .select(`
        item_id,
        shop_items!inner(id, name, image_url, is_consumable)
      `)
      .eq('user_id', userId)
      .eq('shop_items.is_consumable', false);

    if (error) {
      console.error('아이콘 목록 조회 오류:', error);
      return { success: false, error: error.message, data: { userIcons: [], currentIcon: null } };
    }

    const userItems = data as unknown as UserItem[];
    const userIcons: IconItem[] = userItems
      .filter(item => item?.shop_items?.id && item?.shop_items?.name && item?.shop_items?.image_url)
      .map(item => ({
        id: item.shop_items.id,
        name: item.shop_items.name,
        image_url: item.shop_items.image_url
      }));

    // 현재 아이콘은 보유 목록에서 찾기 (추가 쿼리 불필요)
    const currentIcon = iconId ? userIcons.find(icon => icon.id === iconId) || null : null;

    return { success: true, data: { userIcons, currentIcon } };
  } catch (error) {
    console.error('아이콘 설정 데이터 조회 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '아이콘 데이터를 불러오는데 실패했습니다.',
      data: { userIcons: [], currentIcon: null }
    };
  }
}

/**
 * 사용자 아이콘 변경
 * @param userId 사용자 ID
 * @param iconId 아이콘 ID (null인 경우 기본 아이콘 사용)
 * @returns 성공 여부
 */
export async function updateUserIcon(userId: string, iconId: number | null): Promise<ActionResponse<null>> {
  try {
    if (!userId) {
      return { 
        success: false, 
        error: '사용자 ID가 필요합니다.',
        data: null
      };
    }
    
    const supabase = await getSupabaseServer();
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || user.id !== userId) {
      return { 
        success: false, 
        error: '권한이 없거나 인증에 실패했습니다.',
        data: null
      };
    }
    
    // 아이콘 ID가 제공된 경우 해당 아이콘이 실제로 존재하고 소모품이 아닌지 확인
    if (iconId !== null) {
      const { data: iconData, error: iconError } = await supabase
        .from('shop_items')
        .select('id, is_consumable')
        .eq('id', iconId)
        .single();

      if (iconError || !iconData) {
        return {
          success: false,
          error: '선택한 아이콘이 존재하지 않습니다.',
          data: null
        };
      }

      // 소모품은 아이콘으로 설정 불가
      if (iconData.is_consumable) {
        return {
          success: false,
          error: '해당 아이템은 아이콘으로 설정할 수 없습니다.',
          data: null
        };
      }
    }
    
    // 프로필 업데이트
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        icon_id: iconId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
    
    if (updateError) {
      console.error('프로필 업데이트 오류:', updateError);
      return { 
        success: false, 
        error: updateError.message || '아이콘 변경에 실패했습니다.',
        data: null
      };
    }
    
    // 페이지 캐시 갱신
    revalidatePath('/settings/icons');
    revalidatePath('/settings/profile');
    
    return { success: true, data: null };
  } catch (error) {
    console.error('아이콘 변경 오류:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '아이콘 변경에 실패했습니다. 다시 시도해주세요.',
      data: null
    };
  }
}

/**
 * 사용자 아이콘 업데이트 (서버 컴포넌트용)
 */
export async function updateUserIconServer(userId: string, iconId: number | null) {
  try {
    const supabase = await getSupabaseServer();

    // 아이콘 ID가 제공된 경우 소모품이 아닌지 확인
    if (iconId !== null) {
      const { data: iconData, error: iconError } = await supabase
        .from('shop_items')
        .select('id, is_consumable')
        .eq('id', iconId)
        .single();

      if (iconError || !iconData) {
        return { success: false, error: '선택한 아이콘이 존재하지 않습니다.' };
      }

      if (iconData.is_consumable) {
        return { success: false, error: '해당 아이템은 아이콘으로 설정할 수 없습니다.' };
      }
    }

    // 기존 아이콘 정보 조회 (변경 감지용)
    const { data: oldProfile } = await supabase
      .from('profiles')
      .select('icon_id')
      .eq('id', userId)
      .single();

    // 사용자 프로필 아이콘 업데이트
    const { error } = await supabase
      .from('profiles')
      .update({ icon_id: iconId })
      .eq('id', userId);

    if (error) throw error;

    // 아이콘 변경 알림 (변경된 경우에만)
    if (oldProfile && oldProfile.icon_id !== iconId) {
      await createProfileUpdateNotification({
        userId,
        changeType: 'profile_icon',
        oldValue: oldProfile.icon_id?.toString() || undefined,
        newValue: iconId?.toString() || undefined
      });
    }

    // 페이지 캐시 갱신
    revalidatePath('/settings/profile');
    revalidatePath('/settings/icons');
    revalidatePath('/'); // 홈페이지 (레이아웃 포함)

    return { success: true };
  } catch (error: unknown) {
    console.error('아이콘 업데이트 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다';
    return { success: false, error: errorMessage };
  }
}

/**
 * 사용자 아이콘 정보 조회
 */
export async function getUserIcon(userId: string) {
  try {
    const supabase = await getSupabaseServer();

    // 사용자 프로필에서 선택된 아이콘 ID와 레벨 가져오기
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('icon_id, level')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    const userLevel = profile?.level || 1;

    // 선택된 아이콘이 없으면 레벨 아이콘 정보 반환
    if (!profile?.icon_id) {
      return {
        iconUrl: getLevelIconUrl(userLevel),
        iconName: `레벨 ${userLevel} 아이콘`,
        success: true
      };
    }

    // 선택된 아이콘 정보 가져오기
    const { data: icon, error: iconError } = await supabase
      .from('shop_items')
      .select('name, image_url')
      .eq('id', profile.icon_id)
      .single();

    if (iconError || !icon?.image_url) {
      // 아이콘 조회 실패 시 레벨 아이콘으로 폴백
      return {
        iconUrl: getLevelIconUrl(userLevel),
        iconName: `레벨 ${userLevel} 아이콘`,
        success: true
      };
    }

    return {
      iconUrl: icon.image_url,
      iconName: icon.name,
      success: true
    };
  } catch (error: unknown) {
    console.error('아이콘 조회 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다';
    // 에러 시에도 기본 레벨 1 아이콘 제공
    return {
      iconUrl: getLevelIconUrl(1),
      iconName: `레벨 1 아이콘`,
      success: false,
      error: errorMessage
    };
  }
}
