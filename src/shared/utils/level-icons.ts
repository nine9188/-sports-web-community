'use client';

/**
 * 레벨 아이콘 유틸리티 (클라이언트용)
 *
 * 공통 로직은 level-icons-shared.ts에서 re-export
 * 클라이언트 전용 기능만 이 파일에 추가
 */

import { getUserIconData } from '@/shared/actions/user';

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
    const data = await getUserIconData(userId);

    const level = data.level;
    const exp = data.exp;
    const totalPoints = data.points;
    const levelIconUrl = getLevelIconUrl(level);

    const baseIconInfo = {
      ...getDefaultIconInfo(),
      level,
      exp,
      totalPoints,
      levelIconUrl
    };

    if (data.iconId) {
      return {
        ...baseIconInfo,
        isUsingLevelIcon: false,
        currentIconId: data.iconId,
        currentIconUrl: data.iconUrl,
        currentIconName: data.iconName,
        purchasedIconUrl: data.iconUrl,
        iconId: data.iconId,
        iconName: data.iconName
      };
    }

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
