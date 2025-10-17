/**
 * 축구 주요 리그 ID 매핑 상수
 * API-Football 기준 리그 ID 값을 정의합니다.
 */

// 메이저 리그 ID 
export const MAJOR_LEAGUE_IDS = {
  // 유럽 주요 리그 (Top 5)
  PREMIER_LEAGUE: 39, // 잉글랜드 프리미어 리그
  LA_LIGA: 140,       // 스페인 라리가
  BUNDESLIGA: 78,     // 독일 분데스리가
  SERIE_A: 135,       // 이탈리아 세리에 A
  LIGUE_1: 61,        // 프랑스 리그앙

  // 유럽 2군 리그
  CHAMPIONSHIP: 40,   // 잉글랜드 챔피언십
  SCOTTISH_PREMIERSHIP: 179, // 스코틀랜드 프리미어십
  EREDIVISIE: 88,     // 네덜란드 에레디비지에
  PRIMEIRA_LIGA: 94,  // 포르투갈 프리메이라 리가

  // 유럽 컵 대회
  CHAMPIONS_LEAGUE: 2, // UEFA 챔피언스 리그
  EUROPA_LEAGUE: 3,    // UEFA 유로파 리그
  CONFERENCE_LEAGUE: 848, // UEFA 컨퍼런스 리그
  UEFA_SUPER_CUP: 531, // UEFA 슈퍼컵

  // 국제 대회
  WORLD_CUP_QUALIFIERS_EUROPE: 32, // 월드컵 유럽예선
  WORLD_CUP_QUALIFIERS_ASIA: 30,   // 월드컵 아시아예선
  INTERNATIONAL_FRIENDLY: 10, // 국가대표친선
  NATIONS_LEAGUE: 5,   // UEFA 네이션스리그
  EURO: 9,            // 유럽선수권대회
  COPA_AMERICA: 13,   // 코파 아메리카
  CLUB_WORLD_CUP: 15, // FIFA 클럽 월드컵

  // 국내 컵 대회
  FA_CUP: 45,         // FA컵 (잉글랜드)
  EFL_CUP: 48,        // EFL컵 (잉글랜드)
  COPA_DEL_REY: 143,  // 코파 델 레이 (스페인)
  COPPA_ITALIA: 137,  // 코파 이탈리아 (이탈리아)
  COUPE_DE_FRANCE: 66, // 쿠프 드 프랑스 (프랑스)
  DFB_POKAL: 81,      // DFB 포칼 (독일)

  // 아시아
  K_LEAGUE_1: 292,    // 한국 K리그1
  J1_LEAGUE: 98,      // 일본 J1 리그
  CSL: 169,           // 중국 슈퍼리그
  AFC_CHAMPIONS: 17,  // AFC 챔피언스 리그
  SAUDI_PRO_LEAGUE: 307, // 사우디 프로리그

  // 아메리카
  MLS: 253,           // 미국 MLS
  BRASILEIRAO: 71,    // 브라질 세리에 A
  LIGA_MX: 262,       // 멕시코 리가 MX

  // 기타 유럽 리그
  DANISH_SUPERLIGA: 119, // 덴마크 수페르리가
};

// 확장된 메이저 리그 ID 배열 (필터링 용도)
export const getMajorLeagueIds = (): number[] => {
  return [
    // 주요 유럽 리그 (Top 5)
    39,  // 프리미어리그 (잉글랜드) - Premier League
    140, // 라리가 (스페인) - La Liga
    78,  // 분데스리가 (독일) - Bundesliga
    61,  // 리그1 (프랑스) - Ligue 1
    135, // 세리에A (이탈리아) - Serie A
    
    // 유럽 2군 리그
    40,  // 잉글랜드 챔피언십 - Championship
    179, // 스코틀랜드 프리미어십 - Scottish Premiership
    88,  // 에레디비지에 (네덜란드) - Eredivisie
    94,  // 포르투갈 리그 - Primeira Liga
    
    // 유럽 컵 대회
    2,   // 챔피언스리그 - UEFA Champions League
    3,   // 유로파리그 - UEFA Europa League
    848, // 컨퍼런스리그 - UEFA Conference League
    531, // UEFA 슈퍼컵 - UEFA Super Cup
    
    // 국제 대회
    32,  // 월드컵 유럽예선 - World Cup Qualifiers Europe
    30,  // 월드컵 아시아예선 - World Cup Qualifiers Asia
    10,  // 국가대표친선 - International Friendly
    5,   // 네이션스리그 - UEFA Nations League
    9,   // 유로 - European Championship
    13,  // 코파아메리카 - Copa America
    15,  // 클럽 월드컵 - FIFA Club World Cup
    
    // 국내 컵 대회
    45,  // FA컵 (잉글랜드) - FA Cup
    48,  // EFL컵 (잉글랜드) - EFL Cup
    143, // 코파델레이 (스페인) - Copa del Rey
    137, // 코파이탈리아 (이탈리아) - Coppa Italia
    66,  // 쿠프드프랑스 (프랑스) - Coupe de France
    81,  // DFB-포칼 (독일) - DFB-Pokal
    
    // 아시아
    292, // K리그1 (한국) - K League 1
    98,  // J1리그 (일본) - J1 League
    169, // 중국 슈퍼리그 - Chinese Super League
    17,  // AFC 챔피언스리그 - AFC Champions League
    307, // 사우디 프로리그 - Saudi Pro League
    
    // 아메리카
    253, // 메이저리그사커 (MLS) - Major League Soccer
    71,  // 브라질레이로 - Brasileirao
    262, // 리가 MX (멕시코) - Liga MX
    
    // 기타
    119, // 덴마크 수페르리가 - Danish Superliga
  ];
};

// 리그 이름 - ID 매핑 (확장)
export const LEAGUE_NAMES_MAP: Record<number, string> = {
  // 유럽 주요 리그
  [MAJOR_LEAGUE_IDS.PREMIER_LEAGUE]: '프리미어 리그',
  [MAJOR_LEAGUE_IDS.LA_LIGA]: '라리가',
  [MAJOR_LEAGUE_IDS.BUNDESLIGA]: '분데스리가',
  [MAJOR_LEAGUE_IDS.SERIE_A]: '세리에 A',
  [MAJOR_LEAGUE_IDS.LIGUE_1]: '리그앙',
  
  // 유럽 2군 리그
  [MAJOR_LEAGUE_IDS.CHAMPIONSHIP]: '챔피언십',
  [MAJOR_LEAGUE_IDS.SCOTTISH_PREMIERSHIP]: '스코틀랜드 프리미어십',
  [MAJOR_LEAGUE_IDS.EREDIVISIE]: '에레디비지에',
  [MAJOR_LEAGUE_IDS.PRIMEIRA_LIGA]: '프리메이라 리가',
  
  // 유럽 컵 대회
  [MAJOR_LEAGUE_IDS.CHAMPIONS_LEAGUE]: '챔피언스 리그',
  [MAJOR_LEAGUE_IDS.EUROPA_LEAGUE]: '유로파 리그',
  [MAJOR_LEAGUE_IDS.CONFERENCE_LEAGUE]: '컨퍼런스 리그',
  [MAJOR_LEAGUE_IDS.UEFA_SUPER_CUP]: 'UEFA 슈퍼컵',
  
  // 국제 대회
  [MAJOR_LEAGUE_IDS.WORLD_CUP_QUALIFIERS_EUROPE]: '월드컵 유럽예선',
  [MAJOR_LEAGUE_IDS.WORLD_CUP_QUALIFIERS_ASIA]: '월드컵 아시아예선',
  [MAJOR_LEAGUE_IDS.INTERNATIONAL_FRIENDLY]: '국가대표 친선경기',
  [MAJOR_LEAGUE_IDS.NATIONS_LEAGUE]: 'UEFA 네이션스리그',
  [MAJOR_LEAGUE_IDS.EURO]: '유럽선수권대회',
  [MAJOR_LEAGUE_IDS.COPA_AMERICA]: '코파 아메리카',
  [MAJOR_LEAGUE_IDS.CLUB_WORLD_CUP]: 'FIFA 클럽 월드컵',
  
  // 국내 컵 대회
  [MAJOR_LEAGUE_IDS.FA_CUP]: 'FA컵',
  [MAJOR_LEAGUE_IDS.EFL_CUP]: 'EFL컵',
  [MAJOR_LEAGUE_IDS.COPA_DEL_REY]: '코파 델 레이',
  [MAJOR_LEAGUE_IDS.COPPA_ITALIA]: '코파 이탈리아',
  [MAJOR_LEAGUE_IDS.COUPE_DE_FRANCE]: '쿠프 드 프랑스',
  [MAJOR_LEAGUE_IDS.DFB_POKAL]: 'DFB 포칼',
  
  // 아시아
  [MAJOR_LEAGUE_IDS.K_LEAGUE_1]: 'K리그1',
  [MAJOR_LEAGUE_IDS.J1_LEAGUE]: 'J1 리그',
  [MAJOR_LEAGUE_IDS.CSL]: '중국 슈퍼리그',
  [MAJOR_LEAGUE_IDS.AFC_CHAMPIONS]: 'AFC 챔피언스 리그',
  [MAJOR_LEAGUE_IDS.SAUDI_PRO_LEAGUE]: '사우디 프로리그',
  
  // 아메리카
  [MAJOR_LEAGUE_IDS.MLS]: 'MLS',
  [MAJOR_LEAGUE_IDS.BRASILEIRAO]: '브라질레이로',
  [MAJOR_LEAGUE_IDS.LIGA_MX]: '리가 MX',
  
  // 기타
  [MAJOR_LEAGUE_IDS.DANISH_SUPERLIGA]: '덴마크 수페르리가',
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

// 영어 리그 이름 -> 한글 매핑 (역매핑)
const ENGLISH_TO_KOREAN_LEAGUE_MAP: Record<string, string> = {
  'Premier League': '프리미어 리그',
  'La Liga': '라리가',
  'LaLiga': '라리가',
  'Bundesliga': '분데스리가',
  'Serie A': '세리에 A',
  'Ligue 1': '리그앙',
  'Championship': '챔피언십',
  'Scottish Premiership': '스코틀랜드 프리미어십',
  'Eredivisie': '에레디비지에',
  'Primeira Liga': '프리메이라 리가',
  'UEFA Champions League': '챔피언스 리그',
  'UEFA Europa League': '유로파 리그',
  'UEFA Europa Conference League': '컨퍼런스 리그',
  'UEFA Conference League': '컨퍼런스 리그',
  'UEFA Super Cup': 'UEFA 슈퍼컵',
  'Super Cup': '슈퍼컵',
  'World Cup - Qualification Europe': '월드컵 유럽예선',
  'World Cup - Qualification Asia': '월드컵 아시아예선',
  'Friendlies': '국가대표 친선경기',
  'International Friendly': '국가대표 친선경기',
  'Friendlies Clubs': '클럽 친선경기',
  'Club Friendlies': '클럽 친선경기',
  'Emirates Cup': '에미레이트 컵',
  'MLS All-Star': 'MLS 올스타',
  'Florida Cup': '플로리다 컵',
  'UEFA Nations League': 'UEFA 네이션스리그',
  'European Championship': '유럽선수권대회',
  'Copa America': '코파 아메리카',
  'FIFA Club World Cup': 'FIFA 클럽 월드컵',
  'FIFA Intercontinental Cup': 'FIFA 인터컨티넨털컵',
  'Community Shield': '커뮤니티 실드',
  'FA Community Shield': '커뮤니티 실드',
  'Premier League 2': '프리미어 리그 2',
  'FA Cup': 'FA컵',
  'EFL Cup': 'EFL컵',
  'League Cup': 'EFL컵',
  'Copa del Rey': '코파 델 레이',
  'Coppa Italia': '코파 이탈리아',
  'Coupe de France': '쿠프 드 프랑스',
  'DFB Pokal': 'DFB 포칼',
  'K League 1': 'K리그1',
  'J1 League': 'J1 리그',
  'Chinese Super League': '중국 슈퍼리그',
  'AFC Champions League': 'AFC 챔피언스 리그',
  'Saudi Pro League': '사우디 프로리그',
  'Saudi Professional League': '사우디 프로리그',
  'MLS': 'MLS',
  'Major League Soccer': 'MLS',
  'Brasileirao': '브라질레이로',
  'Serie A - Brazil': '브라질레이로',
  'Liga MX': '리가 MX',
  'Danish Superliga': '덴마크 수페르리가',
};

// 영어 리그 이름으로 한글 이름 찾기
export const getLeagueKoreanName = (englishName: string | undefined): string => {
  if (!englishName) return '';
  return ENGLISH_TO_KOREAN_LEAGUE_MAP[englishName] || englishName;
}; 