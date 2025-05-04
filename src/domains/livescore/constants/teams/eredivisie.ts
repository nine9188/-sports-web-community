// 팀 매핑 인터페이스
import { TeamMapping } from './index';

// 에레디비시 ID
export const EREDIVISIE_ID = 88;

// 에레디비시 팀 매핑 데이터
export const EREDIVISIE_TEAMS: TeamMapping[] = [
  {
    id: 194,
    name_ko: '아약스',
    name_en: 'Ajax',
    country_ko: '네덜란드',
    country_en: 'Netherlands',
    code: 'AJA'
  },
  {
    id: 197,
    name_ko: 'PSV',
    name_en: 'PSV Eindhoven',
    country_ko: '네덜란드',
    country_en: 'Netherlands',
    code: 'PSV'
  },
  {
    id: 209,
    name_ko: '페예노르트',
    name_en: 'Feyenoord',
    country_ko: '네덜란드',
    country_en: 'Netherlands',
    code: 'FEY'
  },
  {
    id: 207,
    name_ko: '위트레흐트',
    name_en: 'Utrecht',
    country_ko: '네덜란드',
    country_en: 'Netherlands',
    code: 'UTR'
  },
  {
    id: 415,
    name_ko: '트벤터',
    name_en: 'Twente',
    country_ko: '네덜란드',
    country_en: 'Netherlands',
    code: 'TWE'
  },
  {
    id: 201,
    name_ko: 'AZ',
    name_en: 'AZ Alkmaar',
    country_ko: '네덜란드',
    country_en: 'Netherlands',
    code: 'ALK'
  },
  {
    id: 410,
    name_ko: '고 어헤드 이글스',
    name_en: 'GO Ahead Eagles',
    country_ko: '네덜란드',
    country_en: 'Netherlands',
    code: 'EAG'
  },
  {
    id: 206,
    name_ko: '헤라클레스',
    name_en: 'Heracles',
    country_ko: '네덜란드',
    country_en: 'Netherlands',
    code: 'HER'
  },
  {
    id: 426,
    name_ko: '스파르타',
    name_en: 'Sparta Rotterdam',
    country_ko: '네덜란드',
    country_en: 'Netherlands',
    code: 'SPA'
  },
  {
    id: 210,
    name_ko: '히렌빈',
    name_en: 'Heerenveen',
    country_ko: '네덜란드',
    country_en: 'Netherlands',
    code: 'HEE'
  },
  {
    id: 413,
    name_ko: 'NEC',
    name_en: 'NEC Nijmegen',
    country_ko: '네덜란드',
    country_en: 'Netherlands',
    code: 'NIJ'
  },
  {
    id: 205,
    name_ko: '시타르트',
    name_en: 'Fortuna Sittard',
    country_ko: '네덜란드',
    country_en: 'Netherlands',
    code: 'SIT'
  },
  {
    id: 202,
    name_ko: '흐로닝언',
    name_en: 'Groningen',
    country_ko: '네덜란드',
    country_en: 'Netherlands',
    code: 'GRO'
  },
  {
    id: 193,
    name_ko: '즈볼레',
    name_en: 'PEC Zwolle',
    country_ko: '네덜란드',
    country_en: 'Netherlands',
    code: 'ZWO'
  },
  {
    id: 203,
    name_ko: 'NAC 브레다',
    name_en: 'NAC Breda',
    country_ko: '네덜란드',
    country_en: 'Netherlands',
    code: 'BRE'
  },
  {
    id: 195,
    name_ko: '빌럼 II',
    name_en: 'Willem II',
    country_ko: '네덜란드',
    country_en: 'Netherlands',
    code: 'WIL'
  },
  {
    id: 417,
    name_ko: '발베이크',
    name_en: 'Waalwijk',
    country_ko: '네덜란드',
    country_en: 'Netherlands',
    code: 'WAA'
  },
  {
    id: 419,
    name_ko: '알메러',
    name_en: 'Almere City FC',
    country_ko: '네덜란드',
    country_en: 'Netherlands',
    code: 'ALM'
  }
];

// 팀 ID로 에레디비시 팀 정보 가져오기
export function getEredivisieTeamById(id: number): TeamMapping | undefined {
  return EREDIVISIE_TEAMS.find(team => team.id === id);
}

// 팀 이름으로 에레디비시 팀 검색하기 (한글/영문 모두 검색 가능)
export function searchEredivisieTeamsByName(name: string): TeamMapping[] {
  const lowercaseName = name.toLowerCase();
  return EREDIVISIE_TEAMS.filter(team => 
    team.name_ko.includes(name) || 
    team.name_en.toLowerCase().includes(lowercaseName)
  );
} 