/**
 * 축구 주요 리그 ID 매핑 상수
 * API-Football 기준 리그 ID 값을 정의합니다.
 */

// 메이저 리그 ID 
export const MAJOR_LEAGUE_IDS = {
  // 유럽 주요 리그 
  PREMIER_LEAGUE: 39, // 잉글랜드 프리미어 리그
  LA_LIGA: 140,       // 스페인 라리가
  BUNDESLIGA: 78,     // 독일 분데스리가
  SERIE_A: 135,       // 이탈리아 세리에 A
  LIGUE_1: 61,        // 프랑스 리그앙

  // 유럽 컵 대회
  CHAMPIONS_LEAGUE: 2, // UEFA 챔피언스 리그
  EUROPA_LEAGUE: 3,    // UEFA 유로파 리그
  CONFERENCE_LEAGUE: 848, // UEFA 컨퍼런스 리그

  // 기타 유럽 리그
  EREDIVISIE: 88,     // 네덜란드 에레디비지에
  PRIMEIRA_LIGA: 94,  // 포르투갈 프리메이라 리가

  // 아시아
  K_LEAGUE_1: 292,    // 한국 K리그1
  J1_LEAGUE: 98,      // 일본 J1 리그
  CSL: 169,           // 중국 슈퍼리그

  // 아메리카
  MLS: 253,           // 미국 MLS
  BRASILEIRAO: 71,    // 브라질 세리에 A
  LIGA_MX: 262,       // 멕시코 리가 MX
  
  // 국제 대회
  WORLD_CUP: 1,       // FIFA 월드컵
  EURO: 4,            // UEFA 유로
  COPA_AMERICA: 13,   // 코파 아메리카
  AFC_CHAMPIONS: 17,  // AFC 챔피언스 리그
};

// 메이저 리그 ID 배열 반환 (필터링 용도)
export const getMajorLeagueIds = (): number[] => {
  return Object.values(MAJOR_LEAGUE_IDS);
};

// 리그 이름 - ID 매핑
export const LEAGUE_NAMES_MAP: Record<number, string> = {
  [MAJOR_LEAGUE_IDS.PREMIER_LEAGUE]: '프리미어 리그',
  [MAJOR_LEAGUE_IDS.LA_LIGA]: '라리가',
  [MAJOR_LEAGUE_IDS.BUNDESLIGA]: '분데스리가',
  [MAJOR_LEAGUE_IDS.SERIE_A]: '세리에 A',
  [MAJOR_LEAGUE_IDS.LIGUE_1]: '리그앙',
  [MAJOR_LEAGUE_IDS.CHAMPIONS_LEAGUE]: '챔피언스 리그',
  [MAJOR_LEAGUE_IDS.EUROPA_LEAGUE]: '유로파 리그',
  [MAJOR_LEAGUE_IDS.CONFERENCE_LEAGUE]: '컨퍼런스 리그',
  [MAJOR_LEAGUE_IDS.EREDIVISIE]: '에레디비지에',
  [MAJOR_LEAGUE_IDS.PRIMEIRA_LIGA]: '프리메이라 리가',
  [MAJOR_LEAGUE_IDS.K_LEAGUE_1]: 'K리그1',
  [MAJOR_LEAGUE_IDS.J1_LEAGUE]: 'J1 리그',
  [MAJOR_LEAGUE_IDS.CSL]: '중국 슈퍼리그',
  [MAJOR_LEAGUE_IDS.MLS]: 'MLS',
  [MAJOR_LEAGUE_IDS.BRASILEIRAO]: '브라질레이로',
  [MAJOR_LEAGUE_IDS.LIGA_MX]: '리가 MX',
  [MAJOR_LEAGUE_IDS.WORLD_CUP]: '월드컵',
  [MAJOR_LEAGUE_IDS.EURO]: '유로',
  [MAJOR_LEAGUE_IDS.COPA_AMERICA]: '코파 아메리카',
  [MAJOR_LEAGUE_IDS.AFC_CHAMPIONS]: 'AFC 챔피언스 리그',
};

// 리그 ID로 이름 가져오기
export const getLeagueName = (leagueId: number): string => {
  return LEAGUE_NAMES_MAP[leagueId] || '알 수 없는 리그';
};

// 리그 ID로 리그 정보 가져오기
export const getLeagueById = (leagueId: number): { id: number; nameKo: string } | null => {
  if (!leagueId) return null;
  
  const nameKo = LEAGUE_NAMES_MAP[leagueId];
  if (!nameKo) return null;
  
  return {
    id: leagueId,
    nameKo
  };
}; 