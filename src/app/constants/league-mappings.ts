// 리그 매핑 인터페이스
export interface LeagueMapping {
  id: number;        // API-Football ID
  name_ko: string;   // 한국어 이름
  name_en: string;   // 영어 이름
  country_ko?: string; // 국가 (한국어)
  country_en?: string; // 국가 (영어)
  category: string;  // 카테고리
}

// 리그 카테고리 
export enum LeagueCategory {
  TOP5 = '주요 유럽 리그 (Top 5)',
  TIER2 = '유럽 2군 리그',
  EURO_CUP = '유럽 컵 대회',
  INTL = '국제 대회',
  DOMESTIC_CUP = '국내 컵 대회',
  OTHER = '기타 리그'
}

// 리그 ID별 매핑 정보
export const LEAGUE_MAPPINGS: LeagueMapping[] = [
  // 주요 유럽 리그 (Top 5)
  { 
    id: 39, 
    name_ko: '프리미어리그', 
    name_en: 'Premier League',
    country_ko: '잉글랜드',
    country_en: 'England',
    category: LeagueCategory.TOP5 
  },
  { 
    id: 140, 
    name_ko: '라리가', 
    name_en: 'La Liga',
    country_ko: '스페인',
    country_en: 'Spain',
    category: LeagueCategory.TOP5 
  },
  { 
    id: 78, 
    name_ko: '분데스리가', 
    name_en: 'Bundesliga',
    country_ko: '독일',
    country_en: 'Germany',
    category: LeagueCategory.TOP5 
  },
  { 
    id: 61, 
    name_ko: '리그1', 
    name_en: 'Ligue 1',
    country_ko: '프랑스',
    country_en: 'France',
    category: LeagueCategory.TOP5 
  },
  { 
    id: 135, 
    name_ko: '세리에A', 
    name_en: 'Serie A',
    country_ko: '이탈리아',
    country_en: 'Italy',
    category: LeagueCategory.TOP5 
  },

  // 유럽 2군 리그
  { 
    id: 40, 
    name_ko: '챔피언십', 
    name_en: 'Championship',
    country_ko: '잉글랜드',
    country_en: 'England',
    category: LeagueCategory.TIER2 
  },
  { 
    id: 179, 
    name_ko: '스코틀랜드 프리미어십', 
    name_en: 'Scottish Premiership',
    country_ko: '스코틀랜드',
    country_en: 'Scotland',
    category: LeagueCategory.TIER2 
  },
  { 
    id: 88, 
    name_ko: '에레디비시', 
    name_en: 'Eredivisie',
    country_ko: '네덜란드',
    country_en: 'Netherlands',
    category: LeagueCategory.TIER2 
  },
  { 
    id: 94, 
    name_ko: '프리메이라 리가', 
    name_en: 'Primeira Liga',
    country_ko: '포르투갈',
    country_en: 'Portugal',
    category: LeagueCategory.TIER2 
  },

  // 유럽 컵 대회
  { 
    id: 2, 
    name_ko: 'UEFA 챔피언스 리그', 
    name_en: 'UEFA Champions League',
    category: LeagueCategory.EURO_CUP 
  },
  { 
    id: 3, 
    name_ko: 'UEFA 유로파 리그', 
    name_en: 'UEFA Europa League',
    category: LeagueCategory.EURO_CUP 
  },
  { 
    id: 848, 
    name_ko: 'UEFA 컨퍼런스 리그', 
    name_en: 'UEFA Conference League',
    category: LeagueCategory.EURO_CUP 
  },
  { 
    id: 531, 
    name_ko: 'UEFA 슈퍼컵', 
    name_en: 'UEFA Super Cup',
    category: LeagueCategory.EURO_CUP 
  },

  // 국제 대회
  { 
    id: 32, 
    name_ko: '월드컵 유럽예선', 
    name_en: 'World Cup Qualifiers - Europe',
    category: LeagueCategory.INTL 
  },
  { 
    id: 10, 
    name_ko: '국가대표 친선경기', 
    name_en: 'International Friendly',
    category: LeagueCategory.INTL 
  },
  { 
    id: 5, 
    name_ko: 'UEFA 네이션스 리그', 
    name_en: 'UEFA Nations League',
    category: LeagueCategory.INTL 
  },
  { 
    id: 9, 
    name_ko: '코파 아메리카', 
    name_en: 'Copa America',
    category: LeagueCategory.INTL 
  },
  { 
    id: 15, 
    name_ko: 'FIFA 클럽 월드컵', 
    name_en: 'FIFA Club World Cup',
    category: LeagueCategory.INTL 
  },
  { 
    id: 4, 
    name_ko: 'UEFA 유로', 
    name_en: 'Euro Championship',
    category: LeagueCategory.INTL 
  },

  // 국내 컵 대회
  { 
    id: 45, 
    name_ko: 'FA컵', 
    name_en: 'FA Cup',
    country_ko: '잉글랜드',
    country_en: 'England',
    category: LeagueCategory.DOMESTIC_CUP 
  },
  { 
    id: 48, 
    name_ko: 'EFL컵', 
    name_en: 'EFL Cup',
    country_ko: '잉글랜드',
    country_en: 'England',
    category: LeagueCategory.DOMESTIC_CUP 
  },
  { 
    id: 143, 
    name_ko: '코파 델 레이', 
    name_en: 'Copa del Rey',
    country_ko: '스페인',
    country_en: 'Spain',
    category: LeagueCategory.DOMESTIC_CUP 
  },
  { 
    id: 137, 
    name_ko: '코파 이탈리아', 
    name_en: 'Coppa Italia',
    country_ko: '이탈리아',
    country_en: 'Italy',
    category: LeagueCategory.DOMESTIC_CUP 
  },
  { 
    id: 66, 
    name_ko: '쿠프 드 프랑스', 
    name_en: 'Coupe de France',
    country_ko: '프랑스',
    country_en: 'France',
    category: LeagueCategory.DOMESTIC_CUP 
  },
  { 
    id: 81, 
    name_ko: 'DFB 포칼', 
    name_en: 'DFB-Pokal',
    country_ko: '독일',
    country_en: 'Germany',
    category: LeagueCategory.DOMESTIC_CUP 
  },

  // 미국 및 기타 리그
  { 
    id: 253, 
    name_ko: 'MLS', 
    name_en: 'Major League Soccer',
    country_ko: '미국',
    country_en: 'USA',
    category: LeagueCategory.OTHER 
  },
  { 
    id: 292, 
    name_ko: 'K리그1', 
    name_en: 'K League 1',
    country_ko: '한국',
    country_en: 'South Korea',
    category: LeagueCategory.OTHER 
  },
  { 
    id: 119, 
    name_ko: '수페르리가', 
    name_en: 'Superliga',
    country_ko: '덴마크',
    country_en: 'Denmark',
    category: LeagueCategory.OTHER 
  },
  { 
    id: 307, 
    name_ko: '사우디 프로리그', 
    name_en: 'Saudi Pro League',
    country_ko: '사우디아라비아',
    country_en: 'Saudi Arabia',
    category: LeagueCategory.OTHER 
  }
];

// ID로 리그 매핑 정보 가져오기
export function getLeagueMappingById(id: number): LeagueMapping | undefined {
  return LEAGUE_MAPPINGS.find(mapping => mapping.id === id);
}

// 주요 리그 ID 목록만 가져오기
export function getMajorLeagueIds(): number[] {
  return LEAGUE_MAPPINGS.map(league => league.id);
}

// 카테고리별로 리그 목록 가져오기
export function getLeaguesByCategory(category: LeagueCategory): LeagueMapping[] {
  return LEAGUE_MAPPINGS.filter(league => league.category === category);
}

// 리그 이름 표시 함수 (나라 이름 포함 여부 옵션)
export function getLeagueDisplayName(id: number, options: {
  language?: 'ko' | 'en',
  includeCountry?: boolean
} = {}): string {
  const { language = 'ko', includeCountry = true } = options;
  const league = getLeagueMappingById(id);
  
  if (!league) return `리그 ${id}`;
  
  const name = language === 'ko' ? league.name_ko : league.name_en;
  const country = includeCountry && league.country_ko && language === 'ko' 
    ? `(${league.country_ko})` 
    : includeCountry && league.country_en && language === 'en'
      ? `(${league.country_en})`
      : '';
  
  return country ? `${name} ${country}` : name;
} 