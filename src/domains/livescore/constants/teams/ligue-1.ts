// 팀 매핑 인터페이스
import { TeamMapping } from './index';

// 리그 1 ID
export const LIGUE_1_ID = 61;

// 리그 1 팀 매핑 데이터
export const LIGUE_1_TEAMS: TeamMapping[] = [
  {
    id: 85,
    name_ko: '파리 생제르맹',
    name_en: 'Paris Saint Germain',
    country_ko: '프랑스',
    country_en: 'France',
    code: 'PAR'
  },
  {
    id: 91,
    name_ko: '모나코',
    name_en: 'Monaco',
    country_ko: '프랑스',
    country_en: 'France',
    code: 'MON'
  },
  {
    id: 81,
    name_ko: '마르세유',
    name_en: 'Marseille',
    country_ko: '프랑스',
    country_en: 'France',
    code: 'MAR'
  },
  {
    id: 79,
    name_ko: '릴',
    name_en: 'Lille',
    country_ko: '프랑스',
    country_en: 'France',
    code: 'LIL'
  },
  {
    id: 95,
    name_ko: '스트라스부르',
    name_en: 'Strasbourg',
    country_ko: '프랑스',
    country_en: 'France',
    code: 'STR'
  },
  {
    id: 84,
    name_ko: '니스',
    name_en: 'Nice',
    country_ko: '프랑스',
    country_en: 'France',
    code: 'NIC'
  },
  {
    id: 80,
    name_ko: '리옹',
    name_en: 'Lyon',
    country_ko: '프랑스',
    country_en: 'France',
    code: 'LYO'
  },
  {
    id: 106,
    name_ko: '스타드 브레스트 29',
    name_en: 'Stade Brestois 29',
    country_ko: '프랑스',
    country_en: 'France',
    code: 'BRE'
  },
  {
    id: 116,
    name_ko: '랑스',
    name_en: 'Lens',
    country_ko: '프랑스',
    country_en: 'France',
    code: 'LEN'
  },
  {
    id: 108,
    name_ko: '오세르',
    name_en: 'Auxerre',
    country_ko: '프랑스',
    country_en: 'France',
    code: 'AUX'
  },
  {
    id: 96,
    name_ko: '툴루즈',
    name_en: 'Toulouse',
    country_ko: '프랑스',
    country_en: 'France',
    code: 'TOU'
  },
  {
    id: 94,
    name_ko: '렌',
    name_en: 'Rennes',
    country_ko: '프랑스',
    country_en: 'France',
    code: 'REN'
  },
  {
    id: 83,
    name_ko: '낭트',
    name_en: 'Nantes',
    country_ko: '프랑스',
    country_en: 'France',
    code: 'NAN'
  },
  {
    id: 93,
    name_ko: '랭스',
    name_en: 'Reims',
    country_ko: '프랑스',
    country_en: 'France',
    code: 'REI'
  },
  {
    id: 77,
    name_ko: '앙제',
    name_en: 'Angers',
    country_ko: '프랑스',
    country_en: 'France',
    code: 'ANG'
  },
  {
    id: 111,
    name_ko: '르 아브르',
    name_en: 'LE Havre',
    country_ko: '프랑스',
    country_en: 'France',
    code: 'HAV'
  },
  {
    id: 1063,
    name_ko: '생테티엔',
    name_en: 'Saint Etienne',
    country_ko: '프랑스',
    country_en: 'France',
    code: 'ETI'
  },
  {
    id: 82,
    name_ko: '몽펠리에',
    name_en: 'Montpellier',
    country_ko: '프랑스',
    country_en: 'France',
    code: 'MON'
  }
];

// 팀 ID로 리그 1 팀 정보 가져오기
export function getLigue1TeamById(id: number): TeamMapping | undefined {
  return LIGUE_1_TEAMS.find(team => team.id === id);
}

// 팀 이름으로 리그 1 팀 검색하기 (한글/영문 모두 검색 가능)
export function searchLigue1TeamsByName(name: string): TeamMapping[] {
  const lowercaseName = name.toLowerCase();
  return LIGUE_1_TEAMS.filter(team => 
    team.name_ko.includes(name) || 
    team.name_en.toLowerCase().includes(lowercaseName)
  );
} 