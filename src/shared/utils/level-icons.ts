'use client';

/**
 * 레벨 아이콘 유틸리티 (클라이언트용)
 *
 * 공통 로직은 level-icons-shared.ts에서 re-export
 * 클라이언트 전용 기능만 이 파일에 추가
 */

import { getSupabaseBrowser } from '@/shared/lib/supabase';

// 공통 상수 및 함수 re-export
export {
  LEVEL_ICON_BASE_URL,
  LEVEL_EXP_REQUIREMENTS,
  getLevelIconUrl,
  calculateLevelFromExp,
  getExpForNextLevel,
  calculateLevelProgress,
  getExpToNextLevel,
} from './level-icons-shared';

// 공통 타입/상수 import (내부 사용용)
import {
  getLevelIconUrl,
  calculateLevelFromExp,
  LEVEL_ICON_BASE_URL,
} from './level-icons-shared';

// 서버 액션 호환용 별칭 (기존 코드 호환성)
export const calculateLevelFromExpServer = calculateLevelFromExp;

// 기본 아이콘 데이터
const DEFAULT_ICON = {
  id: 1,
  name: '기본 아이콘',
  url: `${LEVEL_ICON_BASE_URL}level-1.png`
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
    const supabase = getSupabaseBrowser();

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
