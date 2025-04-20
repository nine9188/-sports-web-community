'use client';

import { createClient } from '@/app/lib/supabase-browser';
import { 
  UserIconInfo,
  getDefaultIconInfo,
  getLevelIconUrl
} from './level-icons';

// 캐싱 설정
const CACHE_DURATION = 5 * 60 * 1000; // 5분 캐시
const cachedIconInfo: Record<string, { data: UserIconInfo; timestamp: number }> = {};
// 구매한 아이콘 URL 캐시
const purchasedIconUrlCache: Record<number, { url: string | null; timestamp: number }> = {};
// 아이콘 이름 캐시
const iconNameCache: Record<number, { name: string | null; timestamp: number }> = {};

// 구매한 아이콘 URL 가져오기 (캐싱 적용)
export async function getPurchasedIconUrl(iconId: number): Promise<string | null> {
  if (!iconId) return null;
  
  // 캐시 확인
  const cached = purchasedIconUrlCache[iconId];
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.url;
  }
  
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('shop_items')
      .select('image_url')
      .eq('id', iconId)
      .single();
      
    if (error || !data) {
      console.error('구매한 아이콘 URL 가져오기 오류:', error);
      return null;
    }
    
    // 캐시에 저장
    purchasedIconUrlCache[iconId] = {
      url: data.image_url,
      timestamp: Date.now()
    };
    
    return data.image_url;
  } catch (error) {
    console.error('아이콘 URL 가져오기 예외:', error);
    return null;
  }
}

// 아이콘 이름 가져오기 (캐싱 적용)
export async function getIconName(iconId: number): Promise<string | null> {
  if (!iconId) return null;
  
  // 캐시 확인
  const cached = iconNameCache[iconId];
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.name;
  }
  
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('shop_items')
      .select('name')
      .eq('id', iconId)
      .single();
      
    if (error || !data) {
      console.error('아이콘 이름 가져오기 오류:', error);
      return null;
    }
    
    // 캐시에 저장
    iconNameCache[iconId] = {
      name: data.name,
      timestamp: Date.now()
    };
    
    return data.name;
  } catch (error) {
    console.error('아이콘 이름 가져오기 예외:', error);
    return null;
  }
}

// 사용자의 아이콘 정보 가져오기 (캐싱 적용) - 클라이언트 전용 버전
export async function getUserIconInfo(userId: string): Promise<UserIconInfo> {
  if (!userId) {
    console.warn('프로필 정보 가져오기 실패: 사용자 ID가 제공되지 않았습니다.');
    return getDefaultIconInfo();
  }
  
  // 캐시 확인
  const cached = cachedIconInfo[userId];
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }
  
  try {
    const supabase = createClient();
    
    // 프로필 정보와 사용자 메타데이터를 병렬로 가져오기
    const [profileResult, userResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('level, exp, icon_id')
        .eq('id', userId)
        .single(),
      supabase.auth.getUser()
    ]);
    
    const profileData = profileResult.data;
    const profileError = profileResult.error;
    const userData = userResult.data;
    const userDataError = userResult.error;
    
    if (profileError || !profileData) {
      console.error('사용자 프로필 정보 가져오기 오류:', profileError?.message || '데이터 없음');
      return cached ? cached.data : saveToCache(userId, getDefaultIconInfo());
    }
    
    // 안전하게 값 추출
    const level = profileData.level || 1;
    const exp = profileData.exp || 0;
    const iconId = profileData.icon_id;
    
    // 레벨 아이콘 URL
    const levelIconUrl = getLevelIconUrl(level);
    
    // 사용자 메타데이터가 없는 경우 기본 레벨 아이콘 사용
    if (userDataError || !userData.user) {
      const iconInfo: UserIconInfo = {
        level,
        exp,
        iconId: null,
        isUsingLevelIcon: true,
        levelIconUrl,
        purchasedIconUrl: null,
        iconName: null,
        currentIconUrl: levelIconUrl,
        currentIconName: `레벨 ${level}`
      };
      return saveToCache(userId, iconInfo);
    }
    
    // 메타데이터에서 아이콘 설정 확인 (명시적으로 false가 아니면 기본적으로 레벨 아이콘 사용)
    const isUsingLevelIcon = userData.user.user_metadata?.using_level_icon !== false;
    
    // 구매한 아이콘 정보 (필요한 경우에만 로드)
    let purchasedIconUrl = null;
    let iconName = null;
    
    if (!isUsingLevelIcon && iconId) {
      try {
        // 병렬로 데이터 로드
        [purchasedIconUrl, iconName] = await Promise.all([
          getPurchasedIconUrl(iconId),
          getIconName(iconId)
        ]);
      } catch (iconError) {
        console.error('아이콘 정보 가져오기 실패:', iconError);
        // 오류 시 기본값 사용
      }
    }
    
    // 최종 사용 아이콘 정보
    const iconInfo: UserIconInfo = {
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
    
    // 캐시에 저장 후 반환
    return saveToCache(userId, iconInfo);
  } catch (error) {
    console.error('사용자 아이콘 정보 가져오기 오류:', error instanceof Error ? error.message : String(error));
    // 캐시된 데이터가 있으면 사용, 없으면 기본값 반환
    return cached ? cached.data : saveToCache(userId, getDefaultIconInfo());
  }
}

// 캐시에 저장하는 헬퍼 함수
function saveToCache(userId: string, iconInfo: UserIconInfo): UserIconInfo {
  cachedIconInfo[userId] = {
    data: iconInfo,
    timestamp: Date.now()
  };
  return iconInfo;
}

// 아이콘 설정 저장 함수
export async function saveIconSetting(
  userId: string, 
  { iconId, usingLevelIcon }: { iconId: number | null, usingLevelIcon: boolean }
): Promise<boolean> {
  if (!userId) return false;
  
  try {
    const supabase = createClient();
    
    // 레벨 아이콘 사용 시 iconId는 null, 아닐 경우 선택한 아이콘 ID
    const finalIconId = usingLevelIcon ? null : iconId;
    
    // 프로필 테이블 업데이트
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        icon_id: finalIconId,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
      
    if (profileError) {
      console.error('프로필 업데이트 오류:', profileError);
      return false;
    }
    
    // 메타데이터 업데이트를 위한 정보 준비
    let iconUrl = null;
    
    if (usingLevelIcon) {
      // 레벨 정보 가져오기
      const { data: profileData } = await supabase
        .from('profiles')
        .select('level')
        .eq('id', userId)
        .single();
        
      const level = profileData?.level || 1;
      iconUrl = getLevelIconUrl(level);
    } else if (iconId) {
      // 구매한 아이콘 URL 가져오기
      iconUrl = await getPurchasedIconUrl(iconId);
    }
    
    // 메타데이터 업데이트
    const { data: userData } = await supabase.auth.getUser();
    const currentMetadata = userData.user?.user_metadata || {};
    
    const { error: authError } = await supabase.auth.updateUser({
      data: { 
        ...currentMetadata,
        icon_id: finalIconId,
        icon_url: iconUrl,
        using_level_icon: usingLevelIcon
      }
    });
    
    if (authError) {
      console.error('메타데이터 업데이트 오류:', authError);
      return false;
    }
    
    // 캐시 무효화 (새로운 아이콘 정보를 강제로 다시 가져오게 함)
    if (cachedIconInfo[userId]) {
      delete cachedIconInfo[userId];
    }
    
    // 아이콘 업데이트 이벤트 발생
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('icon-updated', { 
        detail: { 
          iconId: finalIconId,
          usingLevelIcon
        } 
      }));
    }
    
    return true;
  } catch (error) {
    console.error('아이콘 설정 저장 중 오류:', error);
    return false;
  }
} 