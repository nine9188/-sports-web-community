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