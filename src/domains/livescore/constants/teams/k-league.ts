// 팀 매핑 인터페이스
import { TeamMapping } from './index';

// K리그 ID
export const K_LEAGUE_ID = 292;

// K리그1 2026 시즌 팀 매핑 데이터 (12팀)
export const K_LEAGUE_TEAMS: TeamMapping[] = [
  {
    id: 2745,
    name_ko: '부천',
    name_en: 'Bucheon FC 1995',
    country_ko: '한국',
    country_en: 'South-Korea',
    code: 'BCH'
  },
  {
    id: 2746,
    name_ko: '강원',
    name_en: 'Gangwon FC',
    country_ko: '한국',
    country_en: 'South-Korea',
    code: 'GAN'
  },
  {
    id: 2748,
    name_ko: '안양',
    name_en: 'FC Anyang',
    country_ko: '한국',
    country_en: 'South-Korea',
    code: 'ANY'
  },
  {
    id: 2750,
    name_ko: '대전',
    name_en: 'Daejeon Citizen',
    country_ko: '한국',
    country_en: 'South-Korea',
    code: 'DAE'
  },
  {
    id: 2759,
    name_ko: '광주',
    name_en: 'Gwangju FC',
    country_ko: '한국',
    country_en: 'South-Korea',
    code: 'GWA'
  },
  {
    id: 2761,
    name_ko: '제주',
    name_en: 'Jeju United FC',
    country_ko: '한국',
    country_en: 'South-Korea',
    code: 'JEJ'
  },
  {
    id: 2762,
    name_ko: '전북',
    name_en: 'Jeonbuk Motors',
    country_ko: '한국',
    country_en: 'South-Korea',
    code: 'JEO'
  },
  {
    id: 2763,
    name_ko: '인천',
    name_en: 'Incheon United',
    country_ko: '한국',
    country_en: 'South-Korea',
    code: 'ICN'
  },
  {
    id: 2764,
    name_ko: '포항',
    name_en: 'Pohang Steelers',
    country_ko: '한국',
    country_en: 'South-Korea',
    code: 'POH'
  },
  {
    id: 2766,
    name_ko: '서울',
    name_en: 'FC Seoul',
    country_ko: '한국',
    country_en: 'South-Korea',
    code: 'SEO'
  },
  {
    id: 2767,
    name_ko: '울산',
    name_en: 'Ulsan Hyundai FC',
    country_ko: '한국',
    country_en: 'South-Korea',
    code: 'ULS'
  },
  {
    id: 2768,
    name_ko: '김천',
    name_en: 'Gimcheon Sangmu FC',
    country_ko: '한국',
    country_en: 'South-Korea',
    code: 'GIM'
  }
];

// 팀 ID로 K리그 팀 정보 가져오기
export function getKLeagueTeamById(id: number): TeamMapping | undefined {
  return K_LEAGUE_TEAMS.find(team => team.id === id);
}

// 팀 이름으로 K리그 팀 검색하기 (한글/영문 모두 검색 가능)
export function searchKLeagueTeamsByName(name: string): TeamMapping[] {
  const lowercaseName = name.toLowerCase();
  return K_LEAGUE_TEAMS.filter(team =>
    team.name_ko.includes(name) ||
    team.name_en.toLowerCase().includes(lowercaseName)
  );
}
