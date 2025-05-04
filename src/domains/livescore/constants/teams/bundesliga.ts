// 팀 매핑 인터페이스
import { TeamMapping } from './index';

// 분데스리가 ID
export const BUNDESLIGA_ID = 78;

// 분데스리가 팀 매핑 데이터
export const BUNDESLIGA_TEAMS: TeamMapping[] = [
  {
    id: 157,
    name_ko: '바이에른 뮌헨',
    name_en: 'Bayern München',
    country_ko: '독일',
    country_en: 'Germany',
    code: 'BAY'
  },
  {
    id: 168,
    name_ko: '바이어 레버쿠젠',
    name_en: 'Bayer Leverkusen',
    country_ko: '독일',
    country_en: 'Germany',
    code: 'LEV'
  },
  {
    id: 169,
    name_ko: '아인트라흐트 프랑크푸르트',
    name_en: 'Eintracht Frankfurt',
    country_ko: '독일',
    country_en: 'Germany',
    code: 'EIN'
  },
  {
    id: 173,
    name_ko: 'RB 라이프치히',
    name_en: 'RB Leipzig',
    country_ko: '독일',
    country_en: 'Germany',
    code: 'LEI'
  },
  {
    id: 164,
    name_ko: 'FSV 마인츠 05',
    name_en: 'FSV Mainz 05',
    country_ko: '독일',
    country_en: 'Germany',
    code: 'MAI'
  },
  {
    id: 160,
    name_ko: 'SC 프라이부르크',
    name_en: 'SC Freiburg',
    country_ko: '독일',
    country_en: 'Germany',
    code: 'FRE'
  },
  {
    id: 163,
    name_ko: '보루시아 묀헨글라트바흐',
    name_en: 'Borussia Mönchengladbach',
    country_ko: '독일',
    country_en: 'Germany',
    code: 'MOE'
  },
  {
    id: 165,
    name_ko: '보루시아 도르트문트',
    name_en: 'Borussia Dortmund',
    country_ko: '독일',
    country_en: 'Germany',
    code: 'DOR'
  },
  {
    id: 170,
    name_ko: 'FC 아우크스부르크',
    name_en: 'FC Augsburg',
    country_ko: '독일',
    country_en: 'Germany',
    code: 'AUG'
  },
  {
    id: 172,
    name_ko: 'VfB 슈투트가르트',
    name_en: 'VfB Stuttgart',
    country_ko: '독일',
    country_en: 'Germany',
    code: 'STU'
  },
  {
    id: 162,
    name_ko: '베르더 브레멘',
    name_en: 'Werder Bremen',
    country_ko: '독일',
    country_en: 'Germany',
    code: 'WER'
  },
  {
    id: 161,
    name_ko: 'VfL 볼프스부르크',
    name_en: 'VfL Wolfsburg',
    country_ko: '독일',
    country_en: 'Germany',
    code: 'WOL'
  },
  {
    id: 182,
    name_ko: '우니온 베를린',
    name_en: 'Union Berlin',
    country_ko: '독일',
    country_en: 'Germany',
    code: 'UNI'
  },
  {
    id: 167,
    name_ko: '1899 호펜하임',
    name_en: '1899 Hoffenheim',
    country_ko: '독일',
    country_en: 'Germany',
    code: 'HOF'
  },
  {
    id: 186,
    name_ko: 'FC 장크트 파울리',
    name_en: 'FC St. Pauli',
    country_ko: '독일',
    country_en: 'Germany',
    code: 'PAU'
  },
  {
    id: 180,
    name_ko: 'FC 하이덴하임',
    name_en: '1. FC Heidenheim',
    country_ko: '독일',
    country_en: 'Germany',
    code: 'HEI'
  },
  {
    id: 176,
    name_ko: 'VfL 보훔',
    name_en: 'VfL Bochum',
    country_ko: '독일',
    country_en: 'Germany',
    code: 'BOC'
  },
  {
    id: 191,
    name_ko: '홀슈타인 킬',
    name_en: 'Holstein Kiel',
    country_ko: '독일',
    country_en: 'Germany',
    code: 'HOL'
  }
];

// 팀 ID로 분데스리가 팀 정보 가져오기
export function getBundesligaTeamById(id: number): TeamMapping | undefined {
  return BUNDESLIGA_TEAMS.find(team => team.id === id);
}

// 팀 이름으로 분데스리가 팀 검색하기 (한글/영문 모두 검색 가능)
export function searchBundesligaTeamsByName(name: string): TeamMapping[] {
  const lowercaseName = name.toLowerCase();
  return BUNDESLIGA_TEAMS.filter(team => 
    team.name_ko.includes(name) || 
    team.name_en.toLowerCase().includes(lowercaseName)
  );
} 