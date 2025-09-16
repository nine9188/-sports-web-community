// 팀 매핑 인터페이스
import { TeamMapping } from './index';

// 덴마크 수페르리가 ID
export const DANISH_SUPERLIGA_ID = 119;

// 덴마크 수페르리가 팀 매핑 데이터
export const DANISH_SUPERLIGA_TEAMS: TeamMapping[] = [
  {
    id: 400,
    name_ko: 'FC 코펜하겐',
    name_en: 'FC Copenhagen',
    country_ko: '덴마크',
    country_en: 'Denmark',
    code: 'COP'
  },
  {
    id: 397,
    name_ko: 'FC 미트윌란',
    name_en: 'FC Midtjylland',
    country_ko: '덴마크',
    country_en: 'Denmark',
    code: 'MID'
  },
  {
    id: 407,
    name_ko: '브뢴뷔',
    name_en: 'Brondby',
    country_ko: '덴마크',
    country_en: 'Denmark',
    code: 'BRO'
  },
  {
    id: 406,
    name_ko: '오르후스',
    name_en: 'Aarhus',
    country_ko: '덴마크',
    country_en: 'Denmark',
    code: 'AAR'
  },
  {
    id: 401,
    name_ko: '라네르스',
    name_en: 'Randers FC',
    country_ko: '덴마크',
    country_en: 'Denmark',
    code: 'RAN'
  },
  {
    id: 398,
    name_ko: '노르셸란',
    name_en: 'FC Nordsjaelland',
    country_ko: '덴마크',
    country_en: 'Denmark',
    code: 'NOR'
  },
  {
    id: 2070,
    name_ko: '비보르',
    name_en: 'Viborg',
    country_ko: '덴마크',
    country_en: 'Denmark',
    code: 'VIB'
  },
  {
    id: 2073,
    name_ko: '실케보르',
    name_en: 'Silkeborg',
    country_ko: '덴마크',
    country_en: 'Denmark',
    code: 'SIL'
  },
  {
    id: 402,
    name_ko: '알보르그',
    name_en: 'Aalborg',
    country_ko: '덴마크',
    country_en: 'Denmark',
    code: 'AAL'
  },
  {
    id: 396,
    name_ko: '쇠네르위스케',
    name_en: 'Sonderjyske',
    country_ko: '덴마크',
    country_en: 'Denmark',
    code: 'SON'
  },
  {
    id: 625,
    name_ko: '륑뷔',
    name_en: 'Lyngby',
    country_ko: '덴마크',
    country_en: 'Denmark',
    code: 'LYN'
  },
  {
    id: 395,
    name_ko: '바일레',
    name_en: 'Vejle',
    country_ko: '덴마크',
    country_en: 'Denmark',
    code: 'VEJ'
  },
  {
    id: 405,
    name_ko: '오덴세 BK',
    name_en: 'Odense',
    country_ko: '덴마크',
    country_en: 'Denmark',
    code: 'OBK'
  },
  {
    id: 2061,
    name_ko: 'FC 프레데리시아',
    name_en: 'FC Fredericia',
    country_ko: '덴마크',
    country_en: 'Denmark',
    code: 'FRE'
  }
  
];

// 팀 ID로 덴마크 수페르리가 팀 정보 가져오기
export function getDanishSuperligaTeamById(id: number): TeamMapping | undefined {
  return DANISH_SUPERLIGA_TEAMS.find(team => team.id === id);
}

// 팀 이름으로 덴마크 수페르리가 팀 검색하기 (한글/영문 모두 검색 가능)
export function searchDanishSuperligaTeamsByName(name: string): TeamMapping[] {
  const lowercaseName = name.toLowerCase();
  return DANISH_SUPERLIGA_TEAMS.filter(team => 
    team.name_ko.includes(name) || 
    team.name_en.toLowerCase().includes(lowercaseName)
  );
} 