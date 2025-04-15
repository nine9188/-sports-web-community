// 레벨 아이콘 경로 (Supabase 스토리지 URL)
export const LEVEL_ICON_BASE_URL = 'https://vnjjfhsuzoxcljqqwwvx.supabase.co/storage/v1/object/public/profile-icons/level-icons/';

import { createClient } from '@/app/lib/supabase-browser';

// 레벨별 필요 경험치 테이블
export const LEVEL_EXP_REQUIREMENTS = [
  0,     // 레벨 1
  50,    // 레벨 2
  500,   // 레벨 3
  1000,  // 레벨 4
  1500,  // 레벨 5
  2000,  // 레벨 6
  2500,  // 레벨 7
  3000,  // 레벨 8
  6000,  // 레벨 9
  9000,  // 레벨 10
  12000, // 레벨 11
  15000, // 레벨 12
  21000, // 레벨 13
  27000, // 레벨 14
  33000, // 레벨 15
  39000, // 레벨 16
  51000, // 레벨 17
  63000, // 레벨 18
  75000, // 레벨 19
  87000, // 레벨 20
  111000, // 레벨 21
  135000, // 레벨 22
  159000, // 레벨 23
  183000, // 레벨 24
  231000, // 레벨 25
  279000, // 레벨 26
  327000, // 레벨 27
  375000, // 레벨 28
  471000, // 레벨 29
  567000, // 레벨 30
  663000, // 레벨 31
  759000, // 레벨 32
  855000, // 레벨 33
  951000, // 레벨 34
  1047000, // 레벨 35
  1143000, // 레벨 36
  1239000, // 레벨 37
  1335000, // 레벨 38
  1431000, // 레벨 39
  1527000, // 레벨 40
  1623000, // 레벨 41
  1719000, // 레벨 42
  1815000, // 레벨 43
  1911000, // 레벨 44
  2007000, // 레벨 45
  2103000, // 레벨 46
  2199000, // 레벨 47
  2295000, // 레벨 48
  2391000, // 레벨 49
];

// 레벨에 따른 아이콘 파일명 생성 함수
export const getLevelIconUrl = (level: number): string => {
  if (level <= 0) level = 1;
  
  let iconIndex;
  
  if (level <= 40) {
    // 1~40레벨: 4레벨당 하나의 아이콘
    iconIndex = Math.ceil(level / 4);
  } else {
    // 41레벨 이상: 레벨당 하나의 아이콘
    iconIndex = 10 + (level - 40);
  }
  
  // 최대 19개의 아이콘으로 제한
  iconIndex = Math.min(iconIndex, 19);
  
  return `${LEVEL_ICON_BASE_URL}level-${iconIndex}.png`;
};

// 경험치를 바탕으로 레벨 계산 함수
export const calculateLevelFromExp = (exp: number): number => {
  if (exp < 0) return 1;
  
  for (let level = LEVEL_EXP_REQUIREMENTS.length; level > 0; level--) {
    if (exp >= LEVEL_EXP_REQUIREMENTS[level - 1]) {
      return level;
    }
  }
  
  return 1;
};

// 다음 레벨까지 필요한 경험치 계산 함수
export const getExpForNextLevel = (currentLevel: number): number => {
  if (currentLevel < 1) return 0;
  if (currentLevel >= LEVEL_EXP_REQUIREMENTS.length) return Infinity;
  
  return LEVEL_EXP_REQUIREMENTS[currentLevel];
};

// 레벨 진행률 계산 함수
export const calculateLevelProgress = (level: number, exp: number): number => {
  if (level < 1 || exp < 0) return 0;
  
  // 현재 레벨의 최소 경험치
  const currentLevelMinExp = LEVEL_EXP_REQUIREMENTS[level - 1] || 0;
  
  // 다음 레벨에 도달하기 위한 경험치
  const nextLevelExp = (level < LEVEL_EXP_REQUIREMENTS.length) 
    ? LEVEL_EXP_REQUIREMENTS[level] 
    : Infinity;
  
  // 현재 레벨 내에서의 경험치
  const expInLevel = exp - currentLevelMinExp;
  
  // 현재 레벨에서 다음 레벨까지 필요한 경험치
  const expNeededForNextLevel = nextLevelExp - currentLevelMinExp;
  
  // 진행률 계산
  return Math.min(Math.round((expInLevel / expNeededForNextLevel) * 100), 100);
};

// 다음 레벨까지 필요한 경험치 계산
export const getExpToNextLevel = (level: number, exp: number): number => {
  if (level < 1 || exp < 0) return 0;
  
  // 다음 레벨에 도달하기 위한 총 경험치
  const nextLevelTotalExp = (level < LEVEL_EXP_REQUIREMENTS.length) 
    ? LEVEL_EXP_REQUIREMENTS[level] 
    : Infinity;
  
  // 다음 레벨까지 남은 경험치
  return Math.max(0, nextLevelTotalExp - exp);
};

// 사용자 아이콘 정보 인터페이스
export type UserIconInfo = {
  level: number;
  exp: number;
  iconId: number | null;
  isUsingLevelIcon: boolean;
  levelIconUrl: string;
  purchasedIconUrl: string | null;
  iconName: string | null;
  currentIconUrl: string;
  currentIconName: string;
};

// 캐시 타입 정의
type IconInfoCache = {
  data: UserIconInfo;
  timestamp: number;
};

// 캐싱 설정
const CACHE_DURATION = 5 * 60 * 1000; // 5분 캐시
const cachedIconInfo: Record<string, IconInfoCache> = {};

// 구매한 아이콘 URL 캐시
const purchasedIconUrlCache: Record<number, { url: string | null; timestamp: number }> = {};
// 아이콘 이름 캐시
const iconNameCache: Record<number, { name: string | null; timestamp: number }> = {};

// 기본 아이콘 정보 생성
export function getDefaultIconInfo(): UserIconInfo {
  return {
    level: 1,
    exp: 0,
    iconId: null,
    isUsingLevelIcon: true,
    levelIconUrl: `${LEVEL_ICON_BASE_URL}level-1.png`,
    purchasedIconUrl: null,
    iconName: null,
    currentIconUrl: `${LEVEL_ICON_BASE_URL}level-1.png`,
    currentIconName: '기본 아이콘',
  };
}

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
    console.error('구매한 아이콘 URL 가져오기 예외:', error);
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

// 사용자의 아이콘 정보 가져오기 (캐싱 적용)
export async function getUserIconInfo(userId: string): Promise<UserIconInfo> {
  if (!userId) {
    return getDefaultIconInfo();
  }
  
  // 캐시 확인
  const cached = cachedIconInfo[userId];
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }
  
  try {
    const supabase = createClient();
    
    // 프로필 정보 가져오기
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('level, exp, icon_id')
      .eq('id', userId)
      .single();
    
    if (profileError || !profileData) {
      console.error('사용자 프로필 정보 가져오기 오류:', profileError);
      return saveToCache(userId, getDefaultIconInfo());
    }
    
    const level = profileData.level || 1;
    const exp = profileData.exp || 0;
    const iconId = profileData.icon_id;
    
    // 유저 메타데이터 가져오기
    const { data: userData } = await supabase.auth.getUser();
    const isUsingLevelIcon = userData.user?.user_metadata?.using_level_icon !== false;
    
    // 레벨 아이콘 URL
    const levelIconUrl = getLevelIconUrl(level);
    
    // 구매한 아이콘 URL (레벨 아이콘을 사용하지 않는 경우에만)
    const purchasedIconUrl = !isUsingLevelIcon && iconId 
      ? await getPurchasedIconUrl(iconId) 
      : null;
      
    // 아이콘 이름 (레벨 아이콘을 사용하지 않는 경우에만)
    const iconName = !isUsingLevelIcon && iconId 
      ? await getIconName(iconId) 
      : null;
    
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
    console.error('사용자 아이콘 정보 가져오기 오류:', error);
    return saveToCache(userId, getDefaultIconInfo());
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
    
    // 캐시 무효화
    delete cachedIconInfo[userId];
    
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
    console.error('아이콘 설정 저장 오류:', error);
    return false;
  }
} 