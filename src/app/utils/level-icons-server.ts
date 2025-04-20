'use server';

import { createClient } from '@/app/lib/supabase.server';
import { UserIconInfo, getDefaultIconInfo, getLevelIconUrl } from './level-icons';

/**
 * 서버에서 아이콘 정보 가져오기 (최적화된 버전)
 */
export async function getUserIconInfoServer(userId: string): Promise<UserIconInfo> {
  if (!userId) {
    return getDefaultIconInfo();
  }
  
  try {
    const supabase = await createClient();
    
    // 프로필과 사용자 정보를 한번에 가져오기
    const [profileResult, userResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('level, exp, icon_id')
        .eq('id', userId)
        .single(),
      supabase.auth.getUser()
    ]);
    
    const profileData = profileResult.data;
    const user = userResult.data.user;
    
    if (!profileData || profileResult.error) {
      return getDefaultIconInfo();
    }
    
    // 안전하게 값 추출
    const level = profileData.level || 1;
    const exp = profileData.exp || 0;
    const iconId = profileData.icon_id;
    
    // 메타데이터에서 아이콘 설정 확인
    const isUsingLevelIcon = user?.user_metadata?.using_level_icon !== false;
    
    // 레벨 아이콘 URL
    const levelIconUrl = getLevelIconUrl(level);
    
    // 구매한 아이콘 URL과 이름
    let purchasedIconUrl = null;
    let iconName = null;
    
    if (!isUsingLevelIcon && iconId) {
      const shopItemResult = await supabase
        .from('shop_items')
        .select('name, image_url')
        .eq('id', iconId)
        .single();
        
      if (shopItemResult.data) {
        purchasedIconUrl = shopItemResult.data.image_url;
        iconName = shopItemResult.data.name;
      }
    }
    
    // 최종 사용 아이콘 정보
    return {
      level,
      exp,
      iconId,
      isUsingLevelIcon,
      levelIconUrl,
      purchasedIconUrl,
      iconName,
      currentIconUrl: isUsingLevelIcon ? levelIconUrl : (purchasedIconUrl || levelIconUrl),
      currentIconName: isUsingLevelIcon ? `레벨 ${level}` : (iconName || '기본 아이콘')
    };
  } catch (error) {
    console.error('서버 사용자 아이콘 정보 가져오기 오류:', error instanceof Error ? error.message : String(error));
    return getDefaultIconInfo();
  }
} 