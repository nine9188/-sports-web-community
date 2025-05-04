'use client';

import { createClient } from '@/shared/api/supabase';

// 레벨 아이콘 경로 (Supabase 스토리지 URL)
export const LEVEL_ICON_BASE_URL = 'https://vnjjfhsuzoxcljqqwwvx.supabase.co/storage/v1/object/public/profile-icons/level-icons/';

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

/**
 * 경험치를 바탕으로 레벨 계산하는 서버 함수 (서버 액션 호환용)
 * activity-actions.ts 등 서버 액션 파일에서 사용
 */
export function calculateLevelFromExpServer(exp: number): number {
  if (exp < 0) return 1;
  
  for (let level = LEVEL_EXP_REQUIREMENTS.length; level > 0; level--) {
    if (exp >= LEVEL_EXP_REQUIREMENTS[level - 1]) {
      return level;
    }
  }
  
  return 1;
}

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

// 기본 아이콘 데이터
const DEFAULT_ICON = {
  id: 1,
  name: '기본 아이콘',
  url: '/images/player.svg'
};

// 클라이언트용 아이콘 정보 인터페이스
export interface UserIconInfo {
  currentIconId: number | null;
  currentIconUrl: string | null;
  currentIconName: string | null;
  nextIconId: number | null;
  nextIconUrl: string | null;
  nextIconName: string | null;
  currentLevel: number;
  nextLevel: number;
  progress: number;
  totalPoints: number;
  pointsToNextLevel: number;
  isUsingLevelIcon?: boolean;
  levelIconUrl?: string;
  purchasedIconUrl?: string | null;
  level?: number;
  exp?: number;
  iconId?: number | null;
  iconName?: string | null;
}

/**
 * 기본 아이콘 정보를 반환합니다. (클라이언트 사용 버전)
 */
function getDefaultIconInfo(): UserIconInfo {
  return {
    currentIconId: DEFAULT_ICON.id,
    currentIconUrl: DEFAULT_ICON.url,
    currentIconName: DEFAULT_ICON.name,
    nextIconId: null,
    nextIconUrl: null,
    nextIconName: null,
    currentLevel: 1,
    nextLevel: 2,
    progress: 0,
    totalPoints: 0,
    pointsToNextLevel: 100,
    levelIconUrl: `${LEVEL_ICON_BASE_URL}level-1.png`,
    isUsingLevelIcon: true
  };
}

/**
 * 사용자의 아이콘 정보를 가져옵니다.
 * 클라이언트 컴포넌트에서 사용합니다.
 */
export async function getUserIconInfo(userId: string): Promise<UserIconInfo> {
  if (!userId) {
    return getDefaultIconInfo();
  }

  try {
    // 1. Supabase 클라이언트 생성
    const supabase = createClient();
    
    // 2. 사용자 프로필 정보 조회
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('points, icon_id, exp')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      return getDefaultIconInfo();
    }
    
    // 경험치 및 레벨 계산
    const exp = profile?.exp || 0;
    const level = calculateLevelFromExp(exp);
    const totalPoints = profile?.points || 0;
    const levelIconUrl = getLevelIconUrl(level);
    
    // 기본 정보 (레벨 및 경험치 포함)
    const baseIconInfo = {
      ...getDefaultIconInfo(),
      level,
      exp,
      totalPoints,
      levelIconUrl
    };
    
    // 사용자가 선택한 아이콘 ID
    const userIconId = profile?.icon_id || null;
    
    // 사용자가 선택한 아이콘이 있는 경우 해당 아이콘 정보 조회
    if (userIconId) {
      try {
        // shop_items 테이블에서 아이콘 정보 조회
        const { data: iconData, error: iconError } = await supabase
          .from('shop_items')
          .select('id, name, image_url, price')
          .eq('id', userIconId)
          .single();
        
        if (iconError || !iconData) {
          // 아이콘 정보를 찾을 수 없는 경우 레벨 아이콘 사용
          return {
            ...baseIconInfo,
            isUsingLevelIcon: true,
            currentIconUrl: levelIconUrl,
            currentIconName: `레벨 ${level} 아이콘`,
            currentIconId: null
          };
        }
        
        // 구매한 아이콘 정보 설정
        return {
          ...baseIconInfo,
          isUsingLevelIcon: false,
          currentIconId: iconData.id,
          currentIconUrl: iconData.image_url,
          currentIconName: iconData.name,
          purchasedIconUrl: iconData.image_url,
          iconId: iconData.id,
          iconName: iconData.name
        };
      } catch (error) {
        console.error('아이콘 정보 조회 오류:', error);
        return baseIconInfo;
      }
    }
    
    // 레벨 아이콘을 사용하는 경우
    return {
      ...baseIconInfo,
      isUsingLevelIcon: true,
      currentIconUrl: levelIconUrl,
      currentIconName: `레벨 ${level} 아이콘`,
      iconId: null
    };
  } catch (error) {
    console.error('사용자 아이콘 정보 조회 오류:', error);
    return getDefaultIconInfo();
  }
} 