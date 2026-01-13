/**
 * 레벨 아이콘 유틸리티 (서버용)
 *
 * 공통 로직은 level-icons-shared.ts에서 re-export
 * 서버 컴포넌트 및 서버 액션에서 사용
 *
 * 주의: 'use client' 지시어 없음 - 서버 전용
 */

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
