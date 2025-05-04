// 리그 매핑 상수 파일
// 주요 축구 리그 ID 및 매핑 정보

// 리그 ID 타입 정의
export type LeagueId = number;

// 리그 정보 인터페이스
export interface LeagueInfo {
  id: LeagueId;
  name: string;
  country: string;
  logo: string;
  flag: string;
  slug: string;
  nameKo?: string; // 한국어 리그명 (선택)
  priority: number; // 정렬 우선순위 (낮을수록 먼저 표시)
}

// 주요 리그 ID 맵 (리그별 정적 정보)
const LEAGUES_MAP: Record<string, LeagueInfo> = {
  // 주요 리그 (Tier 1)
  'premier-league': {
    id: 39,
    name: 'Premier League',
    country: 'England',
    logo: 'https://media.api-sports.io/football/leagues/39.png',
    flag: 'https://media.api-sports.io/flags/gb.svg',
    slug: 'premier-league',
    nameKo: '프리미어리그',
    priority: 10
  },
  'la-liga': { 
    id: 140,
    name: 'La Liga',
    country: 'Spain',
    logo: 'https://media.api-sports.io/football/leagues/140.png',
    flag: 'https://media.api-sports.io/flags/es.svg',
    slug: 'la-liga',
    nameKo: '라리가',
    priority: 11
  },
  'bundesliga': {
    id: 78,
    name: 'Bundesliga',
    country: 'Germany',
    logo: 'https://media.api-sports.io/football/leagues/78.png',
    flag: 'https://media.api-sports.io/flags/de.svg',
    slug: 'bundesliga',
    nameKo: '분데스리가',
    priority: 12
  },
  'serie-a': {
    id: 135,
    name: 'Serie A',
    country: 'Italy',
    logo: 'https://media.api-sports.io/football/leagues/135.png',
    flag: 'https://media.api-sports.io/flags/it.svg',
    slug: 'serie-a',
    nameKo: '세리에 A',
    priority: 13
  },
  'ligue-1': {
    id: 61,
    name: 'Ligue 1',
    country: 'France',
    logo: 'https://media.api-sports.io/football/leagues/61.png',
    flag: 'https://media.api-sports.io/flags/fr.svg',
    slug: 'ligue-1',
    nameKo: '리그 1',
    priority: 14
  },
  
  // 주요 컵대회 (Tier 1)
  'champions-league': {
    id: 2,
    name: 'UEFA Champions League',
    country: 'World',
    logo: 'https://media.api-sports.io/football/leagues/2.png',
    flag: 'https://media.api-sports.io/flags/eu.svg',
    slug: 'champions-league',
    nameKo: '챔피언스리그',
    priority: 1
  },
  'europa-league': {
    id: 3,
    name: 'UEFA Europa League',
    country: 'World',
    logo: 'https://media.api-sports.io/football/leagues/3.png',
    flag: 'https://media.api-sports.io/flags/eu.svg',
    slug: 'europa-league',
    nameKo: '유로파리그',
    priority: 2
  },
  'fa-cup': {
    id: 45,
    name: 'FA Cup',
    country: 'England',
    logo: 'https://media.api-sports.io/football/leagues/45.png',
    flag: 'https://media.api-sports.io/flags/gb.svg',
    slug: 'fa-cup',
    nameKo: 'FA컵',
    priority: 20
  },
  
  // 2부 리그 (Tier 2)
  'championship': {
    id: 40,
    name: 'Championship',
    country: 'England',
    logo: 'https://media.api-sports.io/football/leagues/40.png',
    flag: 'https://media.api-sports.io/flags/gb.svg',
    slug: 'championship',
    nameKo: '챔피언십',
    priority: 30
  },
  'serie-b': {
    id: 136,
    name: 'Serie B',
    country: 'Italy',
    logo: 'https://media.api-sports.io/football/leagues/136.png',
    flag: 'https://media.api-sports.io/flags/it.svg',
    slug: 'serie-b',
    nameKo: '세리에 B',
    priority: 31
  },
  'laliga2': {
    id: 141,
    name: 'LaLiga 2',
    country: 'Spain',
    logo: 'https://media.api-sports.io/football/leagues/141.png',
    flag: 'https://media.api-sports.io/flags/es.svg',
    slug: 'laliga2',
    nameKo: '라리가2',
    priority: 32
  },
  
  // 주요 컵대회 (Tier 2)
  'conference-league': {
    id: 848,
    name: 'UEFA Conference League',
    country: 'World',
    logo: 'https://media.api-sports.io/football/leagues/848.png',
    flag: 'https://media.api-sports.io/flags/eu.svg',
    slug: 'conference-league',
    nameKo: '컨퍼런스리그',
    priority: 3
  },
  'copa-del-rey': {
    id: 143,
    name: 'Copa del Rey',
    country: 'Spain',
    logo: 'https://media.api-sports.io/football/leagues/143.png',
    flag: 'https://media.api-sports.io/flags/es.svg',
    slug: 'copa-del-rey',
    nameKo: '국왕컵',
    priority: 21
  },
  'coppa-italia': {
    id: 137,
    name: 'Coppa Italia',
    country: 'Italy',
    logo: 'https://media.api-sports.io/football/leagues/137.png',
    flag: 'https://media.api-sports.io/flags/it.svg',
    slug: 'coppa-italia',
    nameKo: '코파 이탈리아',
    priority: 22
  },
  'dfb-pokal': {
    id: 81,
    name: 'DFB Pokal',
    country: 'Germany',
    logo: 'https://media.api-sports.io/football/leagues/81.png',
    flag: 'https://media.api-sports.io/flags/de.svg',
    slug: 'dfb-pokal',
    nameKo: 'DFB 포칼',
    priority: 23
  },

  // 한국 리그 (Tier 3)
  'k-league': {
    id: 292,
    name: 'K League 1',
    country: 'South Korea',
    logo: 'https://media.api-sports.io/football/leagues/292.png',
    flag: 'https://media.api-sports.io/flags/kr.svg',
    slug: 'k-league',
    nameKo: 'K리그1',
    priority: 50
  },
  'k-league-2': {
    id: 293,
    name: 'K League 2',
    country: 'South Korea',
    logo: 'https://media.api-sports.io/football/leagues/293.png',
    flag: 'https://media.api-sports.io/flags/kr.svg',
    slug: 'k-league-2',
    nameKo: 'K리그2',
    priority: 51
  },
  
  // 기타 인기 리그 및 컵대회 (Tier 4)
  'eredivisie': {
    id: 88,
    name: 'Eredivisie',
    country: 'Netherlands',
    logo: 'https://media.api-sports.io/football/leagues/88.png',
    flag: 'https://media.api-sports.io/flags/nl.svg',
    slug: 'eredivisie',
    nameKo: '에레디비지',
    priority: 40
  },
  'primeira-liga': {
    id: 94,
    name: 'Primeira Liga',
    country: 'Portugal',
    logo: 'https://media.api-sports.io/football/leagues/94.png',
    flag: 'https://media.api-sports.io/flags/pt.svg',
    slug: 'primeira-liga',
    nameKo: '프리메이라리가',
    priority: 41
  },
  'mls': {
    id: 253,
    name: 'Major League Soccer',
    country: 'USA',
    logo: 'https://media.api-sports.io/football/leagues/253.png',
    flag: 'https://media.api-sports.io/flags/us.svg',
    slug: 'mls',
    nameKo: 'MLS',
    priority: 60
  },
  
  // 국제 토너먼트 (Tier 5)
  'world-cup': {
    id: 1,
    name: 'World Cup',
    country: 'World',
    logo: 'https://media.api-sports.io/football/leagues/1.png',
    flag: 'https://media.api-sports.io/flags/int.svg',
    slug: 'world-cup',
    nameKo: '월드컵',
    priority: 5
  },
  'euro-cup': {
    id: 4,
    name: 'European Championship',
    country: 'World',
    logo: 'https://media.api-sports.io/football/leagues/4.png',
    flag: 'https://media.api-sports.io/flags/eu.svg',
    slug: 'euro-cup',
    nameKo: '유로',
    priority: 6
  },
  'copa-america': {
    id: 13,
    name: 'Copa America',
    country: 'World',
    logo: 'https://media.api-sports.io/football/leagues/13.png',
    flag: 'https://media.api-sports.io/flags/sa.svg',
    slug: 'copa-america',
    nameKo: '코파 아메리카',
    priority: 7
  },
  
  // 친선 매치 (Tier 6)
  'friendly': {
    id: 667,
    name: 'International Friendlies',
    country: 'World',
    logo: 'https://media.api-sports.io/football/leagues/667.png',
    flag: 'https://media.api-sports.io/flags/int.svg',
    slug: 'friendly',
    nameKo: '국제 친선경기',
    priority: 70
  },
  'club-friendly': {
    id: 667,
    name: 'Club Friendlies',
    country: 'World',
    logo: 'https://media.api-sports.io/football/leagues/667.png',
    flag: 'https://media.api-sports.io/flags/int.svg',
    slug: 'club-friendly',
    nameKo: '클럽 친선경기',
    priority: 71
  },
};

// 리그 정보 가져오기 (슬러그로)
export const getLeagueBySlug = (slug: string): LeagueInfo | undefined => {
  return LEAGUES_MAP[slug];
};

// 리그 정보 가져오기 (ID로)
export const getLeagueById = (id: LeagueId): LeagueInfo | undefined => {
  return Object.values(LEAGUES_MAP).find(league => league.id === id);
};

// 모든 리그 ID 목록 가져오기
export const getMajorLeagueIds = (): LeagueId[] => {
  return Object.values(LEAGUES_MAP).map(league => league.id);
};

// 리그 목록 가져오기 (우선순위 정렬)
export const getAllLeagues = (): LeagueInfo[] => {
  return Object.values(LEAGUES_MAP).sort((a, b) => a.priority - b.priority);
};

// 티어별 리그 필터링 유틸리티
export const getLeaguesByPriority = (maxPriority: number): LeagueInfo[] => {
  return Object.values(LEAGUES_MAP)
    .filter(league => league.priority <= maxPriority)
    .sort((a, b) => a.priority - b.priority);
};

// Tier 1 리그 (최우선 표시)
export const getTier1Leagues = (): LeagueInfo[] => {
  return getLeaguesByPriority(15);
};

// 모든 리그 & 대회가 포함된 맵 내보내기
export default LEAGUES_MAP; 