// 컵 대회 ID
export const CUP_LEAGUE_IDS = [
  1,   // FIFA World Cup
  // 유럽 컵 대회
  2,   // UEFA 챔피언스 리그
  3,   // UEFA 유로파 리그
  848, // UEFA 컨퍼런스 리그
  531, // UEFA 슈퍼컵

  // 국내 컵 대회
  45,  // FA컵
  48,  // EFL컵

  // 아시아 컵
  17,  // AFC 챔피언스 리그
]

// 친선 경기 ID
export const CLUB_FRIENDLY_LEAGUE_IDS = [
  667, // Club Friendlies
]

// 리그 ID
export const LEAGUE_IDS = [
  // 주요 유럽 리그 (Top 5)
  39,  // 프리미어 리그
  140, // 라리가
  78,  // 분데스리가
  61,  // 리그앙
  135, // 세리에 A

  // 유럽 2군 리그
  40,  // 챔피언십
  179, // 스코틀랜드 프리미어십
  88,  // 에레디비지에
  94,  // 프리메이라 리가

  // 아시아 리그
  292, // K리그1
  293, // K리그2
  98,  // J1 리그
  169, // 중국 슈퍼리그
  307, // 사우디 프로리그

  // 아메리카 리그
  253, // MLS
  71,  // 브라질레이로
  262, // 리가 MX

  // 기타 리그
  119, // 덴마크 수페르리가
]

// 전체 허용 리그 (검색 필터용)
export const ALLOWED_LEAGUE_IDS = [...CUP_LEAGUE_IDS, ...LEAGUE_IDS]

// 경기 일정/매치 페이지 허용 리그
export const MATCH_LEAGUE_IDS = [...ALLOWED_LEAGUE_IDS, ...CLUB_FRIENDLY_LEAGUE_IDS]
