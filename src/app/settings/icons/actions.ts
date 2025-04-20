'use server';

import { createClient } from '@/app/lib/supabase.server';
import { revalidatePath } from 'next/cache';

// 아이콘 정보 인터페이스
interface ShopItem {
  id: number;
  name: string;
  image_url: string;
}

// Supabase 응답 데이터 타입
interface UserItem {
  item_id: number;
  shop_items: ShopItem;
}

/**
 * 사용자 보유 아이콘 목록 조회
 */
export async function getUserIcons(userId: string) {
  try {
    // Supabase 클라이언트 생성
    const supabase = await createClient();
    
    // 사용자 정보 확인 (getUser 사용 - 보안 강화)
    const { data: { user }, error } = await supabase.auth.getUser();
    
    // 권한 확인
    if (!user || error || user.id !== userId) {
      return { success: false, error: '권한이 없습니다.' };
    }
    
    // 사용자가 구매한 아이콘 목록 조회
    const { data: userItems, error: itemsError } = await supabase
      .from('user_items')
      .select(`
        item_id,
        shop_items(id, name, image_url)
      `)
      .eq('user_id', userId);
      
    if (itemsError) throw itemsError;
    
    // 데이터 형식 변환
    if (userItems) {
      const icons = (userItems as unknown as UserItem[])
        .filter(item => item.shop_items) // null 체크
        .map(item => ({
          id: item.item_id,
          name: item.shop_items.name,
          image_url: item.shop_items.image_url
        }));
        
      return { success: true, data: icons };
    }
    
    return { success: true, data: [] };
  } catch (error: unknown) {
    console.error('아이콘 목록 조회 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '아이콘 목록을 불러오는 중 오류가 발생했습니다.';
    return { 
      success: false, 
      error: errorMessage 
    };
  }
}

/**
 * 현재 사용자 아이콘 정보 조회
 */
export async function getCurrentUserIcon(userId: string) {
  try {
    // Supabase 클라이언트 생성
    const supabase = await createClient();
    
    // 사용자 정보 확인 (getUser 사용 - 보안 강화)
    const { data: { user }, error } = await supabase.auth.getUser();
    
    // 권한 확인
    if (!user || error || user.id !== userId) {
      return { success: false, error: '권한이 없습니다.' };
    }
    
    // 프로필 정보 조회
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('icon_id')
      .eq('id', userId)
      .single();
      
    if (profileError) throw profileError;
    
    // 아이콘 ID가 없는 경우
    if (!profile || !profile.icon_id) {
      return { success: true, data: null };
    }
    
    try {
      // 아이콘 정보 조회
      const { data: iconData, error: iconError } = await supabase
        .from('shop_items')
        .select('id, name, image_url')
        .eq('id', profile.icon_id)
        .single();
        
      if (iconError) throw iconError;
      
      return { success: true, data: iconData };
    } catch (iconError) {
      console.error('아이콘 정보 조회 오류:', iconError);
      return { success: true, data: null };
    }
  } catch (error: unknown) {
    console.error('현재 아이콘 정보 조회 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '아이콘 정보를 불러오는 중 오류가 발생했습니다.';
    return { 
      success: false, 
      error: errorMessage 
    };
  }
}

/**
 * 사용자 아이콘 변경
 * @param userId 사용자 ID
 * @param iconId 아이콘 ID (null인 경우 기본 아이콘 사용)
 */
export async function updateUserIcon(userId: string, iconId: number | null) {
  try {
    // Supabase 클라이언트 생성
    const supabase = await createClient();
    
    // 사용자 정보 확인 (getUser 사용 - 보안 강화)
    const { data: { user }, error } = await supabase.auth.getUser();
    
    // 권한 확인
    if (!user || error || user.id !== userId) {
      return { success: false, error: '권한이 없습니다.' };
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
      throw updateError;
    }
    
    // 페이지 캐시 갱신
    revalidatePath('/settings/icons');
    revalidatePath('/settings/profile');
    
    return { success: true };
  } catch (error: unknown) {
    console.error('아이콘 변경 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '아이콘 변경에 실패했습니다. 다시 시도해주세요.';
    return { 
      success: false, 
      error: errorMessage 
    };
  }
} 