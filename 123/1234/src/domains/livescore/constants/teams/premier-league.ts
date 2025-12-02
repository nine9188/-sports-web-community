// 팀 매핑 인터페이스
export interface TeamMapping {
  id: number;         // API-Football ID
  name_ko: string;    // 한국어 이름
  name_en: string;    // 영어 이름
  country_ko?: string;  // 국가 (한국어)
  country_en?: string;  // 국가 (영어)
  code?: string;      // 팀 코드 (짧은 약자)
  logo?: string;      // 로고 URL (없을 경우 기본 이미지 사용)
}

// 프리미어리그 ID
export const PREMIER_LEAGUE_ID = 39;

// 프리미어리그 팀 매핑 데이터
export const PREMIER_LEAGUE_TEAMS: TeamMapping[] = [
  {
    id: 40,
    name_ko: '리버풀',
    name_en: 'Liverpool',
    country_ko: '잉글랜드',
    country_en: 'England',
    code: 'LIV'
  },
  {
    id: 42,
    name_ko: '아스널',
    name_en: 'Arsenal',
    country_ko: '잉글랜드',
    country_en: 'England',
    code: 'ARS'
  },
  {
    id: 65,
    name_ko: '노팅엄 포레스트',
    name_en: 'Nottingham Forest',
    country_ko: '잉글랜드',
    country_en: 'England',
    code: 'NOT'
  },
  {
    id: 34,
    name_ko: '뉴캐슬',
    name_en: 'Newcastle',
    country_ko: '잉글랜드',
    country_en: 'England',
    code: 'NEW'
  },
  {
    id: 50,
    name_ko: '맨체스터 시티',
    name_en: 'Manchester City',
    country_ko: '잉글랜드',
    country_en: 'England',
    code: 'MAC'
  },
  {
    id: 49,
    name_ko: '첼시',
    name_en: 'Chelsea',
    country_ko: '잉글랜드',
    country_en: 'England',
    code: 'CHE'
  },
  {
    id: 66,
    name_ko: '애스턴 빌라',
    name_en: 'Aston Villa',
    country_ko: '잉글랜드',
    country_en: 'England',
    code: 'AST'
  },
  {
    id: 51,
    name_ko: '브라이튼',
    name_en: 'Brighton',
    country_ko: '잉글랜드',
    country_en: 'England',
    code: 'BRI'
  },
  {
    id: 55,
    name_ko: '브렌트포드',
    name_en: 'Brentford',
    country_ko: '잉글랜드',
    country_en: 'England',
    code: 'BRE'
  },
  {
    id: 52,
    name_ko: '크리스탈 팰리스',
    name_en: 'Crystal Palace',
    country_ko: '잉글랜드',
    country_en: 'England',
    code: 'CRY'
  },
  {
    id: 45,
    name_ko: '에버튼',
    name_en: 'Everton',
    country_ko: '잉글랜드',
    country_en: 'England',
    code: 'EVE'
  },
  {
    id: 33,
    name_ko: '맨체스터 유나이티드',
    name_en: 'Manchester United',
    country_ko: '잉글랜드',
    country_en: 'England',
    code: 'MUN'
  },
  {
    id: 47,
    name_ko: '토트넘 홋스퍼',
    name_en: 'Tottenham',
    country_ko: '잉글랜드',
    country_en: 'England',
    code: 'TOT'
  },
  {
    id: 39,
    name_ko: '울버햄튼',
    name_en: 'Wolves',
    country_ko: '잉글랜드',
    country_en: 'England',
    code: 'WOL'
  },
  {
    id: 48,
    name_ko: '웨스트햄',
    name_en: 'West Ham',
    country_ko: '잉글랜드',
    country_en: 'England',
    code: 'WES'
  },
  {
    id: 46,
    name_ko: '레스터 시티',
    name_en: 'Leicester',
    country_ko: '잉글랜드',
    country_en: 'England',
    code: 'LEI'
  },
  {
    id: 41,
    name_ko: '사우샘프턴',
    name_en: 'Southampton',
    country_ko: '잉글랜드',
    country_en: 'England',
    code: 'SOU'
  },
  {
    id: 35,
    name_ko: '본머스',
    name_en: 'Bournemouth',
    country_ko: '잉글랜드',
    country_en: 'England',
    code: 'BOU'
  },
  {
    id: 36,
    name_ko: '풀럼',
    name_en: 'Fulham',
    country_ko: '잉글랜드',
    country_en: 'England',
    code: 'FUL'
  },
  {
    id: 57,
    name_ko: '입스위치 타운',
    name_en: 'Ipswich',
    country_ko: '잉글랜드',
    country_en: 'England',
    code: 'IPS'
  },
  {
    id: 44,
    name_ko: '번리',
    name_en: 'Burnley',
    country_ko: '잉글랜드',
    country_en: 'England',
    code: 'BUR'
  },
  {
    id: 63,
    name_ko: '리즈 유나이티드',
    name_en: 'Leeds',
    country_ko: '잉글랜드',
    country_en: 'England',
    code: 'LEE'
  },
  {
    id: 746,
    name_ko: '선덜랜드',
    name_en: 'Sunderland',
    country_ko: '잉글랜드',
    country_en: 'England',
    code: 'SUN'
  }
];

// 팀 ID로 프리미어리그 팀 정보 가져오기
export function getPremierLeagueTeamById(id: number): TeamMapping | undefined {
  return PREMIER_LEAGUE_TEAMS.find(team => team.id === id);
}

// 팀 이름으로 프리미어리그 팀 검색하기 (한글/영문 모두 검색 가능)
export function searchPremierLeagueTeamsByName(name: string): TeamMapping[] {
  const lowercaseName = name.toLowerCase();
  return PREMIER_LEAGUE_TEAMS.filter(team => 
    team.name_ko.includes(name) || 
    team.name_en.toLowerCase().includes(lowercaseName)
  );
} 