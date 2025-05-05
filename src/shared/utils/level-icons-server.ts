// 서버 컴포넌트용 레벨 아이콘 유틸리티
// 'use client' 지시어 없음

// 레벨 아이콘 경로 (Supabase 스토리지 URL)
export const LEVEL_ICON_BASE_URL = 'https://vnjjfhsuzoxcljqqwwvx.supabase.co/storage/v1/object/public/profile-icons/level-icons/';

/**
 * 레벨에 따른 아이콘 URL 생성 함수 (서버 컴포넌트용)
 */
export function getLevelIconUrl(level: number): string {
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
}

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
];

/**
 * 경험치를 바탕으로 레벨 계산 함수 (서버 컴포넌트용)
 */
export function calculateLevelFromExp(exp: number): number {
  if (exp < 0) return 1;
  
  for (let level = LEVEL_EXP_REQUIREMENTS.length; level > 0; level--) {
    if (exp >= LEVEL_EXP_REQUIREMENTS[level - 1]) {
      return level;
    }
  }
  
  return 1;
} 