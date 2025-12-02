// 팀 매핑 인터페이스
import { TeamMapping } from './index';

// 라리가 ID
export const LALIGA_ID = 140;

// 라리가 팀 매핑 데이터
export const LALIGA_TEAMS: TeamMapping[] = [
  {
    id: 529,
    name_ko: '바르셀로나',
    name_en: 'Barcelona',
    country_ko: '스페인',
    country_en: 'Spain',
    code: 'BAR'
  },
  {
    id: 541,
    name_ko: '레알 마드리드',
    name_en: 'Real Madrid',
    country_ko: '스페인',
    country_en: 'Spain',
    code: 'REA'
  },
  {
    id: 530,
    name_ko: '아틀레티코 마드리드',
    name_en: 'Atletico Madrid',
    country_ko: '스페인',
    country_en: 'Spain',
    code: 'MAD'
  },
  {
    id: 531,
    name_ko: '아틀레틱 클럽',
    name_en: 'Athletic Club',
    country_ko: '스페인',
    country_en: 'Spain',
    code: 'BIL'
  },
  {
    id: 533,
    name_ko: '비야레알',
    name_en: 'Villarreal',
    country_ko: '스페인',
    country_en: 'Spain',
    code: 'VIL'
  },
  {
    id: 543,
    name_ko: '레알 베티스',
    name_en: 'Real Betis',
    country_ko: '스페인',
    country_en: 'Spain',
    code: 'BET'
  },
  {
    id: 538,
    name_ko: '셀타 비고',
    name_en: 'Celta Vigo',
    country_ko: '스페인',
    country_en: 'Spain',
    code: 'CEL'
  },
  {
    id: 798,
    name_ko: '마요르카',
    name_en: 'Mallorca',
    country_ko: '스페인',
    country_en: 'Spain',
    code: 'MAL'
  },
  {
    id: 548,
    name_ko: '레알 소시에다드',
    name_en: 'Real Sociedad',
    country_ko: '스페인',
    country_en: 'Spain',
    code: 'RSO'
  },
  {
    id: 728,
    name_ko: '라요 바예카노',
    name_en: 'Rayo Vallecano',
    country_ko: '스페인',
    country_en: 'Spain',
    code: 'RAY'
  },
  {
    id: 546,
    name_ko: '헤타페',
    name_en: 'Getafe',
    country_ko: '스페인',
    country_en: 'Spain',
    code: 'GET'
  },
  {
    id: 532,
    name_ko: '발렌시아',
    name_en: 'Valencia',
    country_ko: '스페인',
    country_en: 'Spain',
    code: 'VAL'
  },
  {
    id: 536,
    name_ko: '세비야',
    name_en: 'Sevilla',
    country_ko: '스페인',
    country_en: 'Spain',
    code: 'SEV'
  },
  {
    id: 540,
    name_ko: '에스파뇰',
    name_en: 'Espanyol',
    country_ko: '스페인',
    country_en: 'Spain',
    code: 'ESP'
  },
  {
    id: 727,
    name_ko: '오사수나',
    name_en: 'Osasuna',
    country_ko: '스페인',
    country_en: 'Spain',
    code: 'OSA'
  },
  {
    id: 547,
    name_ko: '지로나',
    name_en: 'Girona',
    country_ko: '스페인',
    country_en: 'Spain',
    code: 'GIR'
  },
  {
    id: 542,
    name_ko: '알라베스',
    name_en: 'Alaves',
    country_ko: '스페인',
    country_en: 'Spain',
    code: 'ALA'
  },
  {
    id: 534,
    name_ko: '라스 팔마스',
    name_en: 'Las Palmas',
    country_ko: '스페인',
    country_en: 'Spain',
    code: 'PAL'
  },
  {
    id: 537,
    name_ko: '레가네스',
    name_en: 'Leganes',
    country_ko: '스페인',
    country_en: 'Spain',
    code: 'LEG'
  },
  {
    id: 720,
    name_ko: '바야돌리드',
    name_en: 'Valladolid',
    country_ko: '스페인',
    country_en: 'Spain',
    code: 'VAL'
  },
  {
    id: 797,
    name_ko: '엘체',
    name_en: 'Elche',
    country_ko: '스페인',
    country_en: 'Spain',
    code: 'ELC'
  },
  {
    id: 539,
    name_ko: '레반테',
    name_en: 'Levante',
    country_ko: '스페인',
    country_en: 'Spain',
    code: 'LEV'
  },
  {
    id: 718,
    name_ko: '오비에도',
    name_en: 'Oviedo',
    country_ko: '스페인',
    country_en: 'Spain',
    code: 'OVI'
  }
];

// 팀 ID로 라리가 팀 정보 가져오기
export function getLaLigaTeamById(id: number): TeamMapping | undefined {
  return LALIGA_TEAMS.find(team => team.id === id);
}

// 팀 이름으로 라리가 팀 검색하기 (한글/영문 모두 검색 가능)
export function searchLaLigaTeamsByName(name: string): TeamMapping[] {
  const lowercaseName = name.toLowerCase();
  return LALIGA_TEAMS.filter(team => 
    team.name_ko.includes(name) || 
    team.name_en.toLowerCase().includes(lowercaseName)
  );
} 