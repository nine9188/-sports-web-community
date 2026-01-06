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

// 레벨별 필요 경험치 테이블 (49레벨 시스템)
export const LEVEL_EXP_REQUIREMENTS = [
  0,        // 레벨 1 (시작)
  300,      // 레벨 2 (1~2일)
  600,      // 레벨 3
  1000,     // 레벨 4
  1500,     // 레벨 5 (약 1주)
  2100,     // 레벨 6
  2800,     // 레벨 7
  3600,     // 레벨 8
  4500,     // 레벨 9
  5500,     // 레벨 10 (약 2주)
  6600,     // 레벨 11
  7800,     // 레벨 12
  9100,     // 레벨 13
  10500,    // 레벨 14
  12000,    // 레벨 15 (약 1달)
  14000,    // 레벨 16
  16500,    // 레벨 17
  19500,    // 레벨 18
  23000,    // 레벨 19
  27000,    // 레벨 20 (약 2달)
  32000,    // 레벨 21
  38000,    // 레벨 22
  45000,    // 레벨 23
  53000,    // 레벨 24
  62000,    // 레벨 25 (약 3~4달)
  73000,    // 레벨 26
  86000,    // 레벨 27
  101000,   // 레벨 28
  118000,   // 레벨 29
  138000,   // 레벨 30 (약 6달)
  160000,   // 레벨 31
  185000,   // 레벨 32
  215000,   // 레벨 33
  250000,   // 레벨 34
  290000,   // 레벨 35 (약 1년)
  335000,   // 레벨 36
  385000,   // 레벨 37
  445000,   // 레벨 38
  510000,   // 레벨 39
  585000,   // 레벨 40 (약 1.5년)
  670000,   // 레벨 41
  765000,   // 레벨 42
  870000,   // 레벨 43
  990000,   // 레벨 44
  1130000,  // 레벨 45 (약 2.5년)
  1290000,  // 레벨 46
  1470000,  // 레벨 47
  1680000,  // 레벨 48
  1920000,  // 레벨 49 (전설)
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