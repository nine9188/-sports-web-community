// 팀 매핑 인터페이스
import { TeamMapping } from './index';

// 사우디 프로리그 ID
export const SAUDI_PRO_LEAGUE_ID = 307;

// 사우디 프로리그 팀 매핑 데이터
export const SAUDI_PRO_LEAGUE_TEAMS: TeamMapping[] = [
  {
    id: 2932,
    name_ko: '알 힐랄',
    name_en: 'Al-Hilal Saudi FC',
    country_ko: '사우디아라비아',
    country_en: 'Saudi-Arabia',
    code: 'HIL'
  },
  {
    id: 2939,
    name_ko: '알 나스르',
    name_en: 'Al-Nassr',
    country_ko: '사우디아라비아',
    country_en: 'Saudi-Arabia',
    code: 'NAS'
  },
  {
    id: 2929,
    name_ko: '알 아흘리',
    name_en: 'Al-Ahli Jeddah',
    country_ko: '사우디아라비아',
    country_en: 'Saudi-Arabia',
    code: 'AHL'
  },
  {
    id: 2938,
    name_ko: '알 이티하드',
    name_en: 'Al-Ittihad FC',
    country_ko: '사우디아라비아',
    country_en: 'Saudi-Arabia',
    code: 'ITT'
  },
  {
    id: 2934,
    name_ko: '알 이티팍',
    name_en: 'Al-Ettifaq',
    country_ko: '사우디아라비아',
    country_en: 'Saudi-Arabia',
    code: 'ETT'
  },
  {
    id: 2944,
    name_ko: '알 파이하',
    name_en: 'Al-Fayha',
    country_ko: '사우디아라비아',
    country_en: 'Saudi-Arabia',
    code: undefined
  },
  {
    id: 2936,
    name_ko: '알 타아원',
    name_en: 'Al Taawon',
    country_ko: '사우디아라비아',
    country_en: 'Saudi-Arabia',
    code: undefined
  },
  {
    id: 2956,
    name_ko: '다마크',
    name_en: 'Damac',
    country_ko: '사우디아라비아',
    country_en: 'Saudi-Arabia',
    code: undefined
  },
  {
    id: 2940,
    name_ko: '알 샤밥',
    name_en: 'Al Shabab',
    country_ko: '사우디아라비아',
    country_en: 'Saudi-Arabia',
    code: 'SHA'
  },
  {
    id: 2935,
    name_ko: '알 라에드',
    name_en: 'Al-Raed',
    country_ko: '사우디아라비아',
    country_en: 'Saudi-Arabia',
    code: 'RAE'
  },
  {
    id: 2961,
    name_ko: '알 오로바',
    name_en: 'Al Orubah',
    country_ko: '사우디아라비아',
    country_en: 'Saudi-Arabia',
    code: undefined
  },
  {
    id: 2933,
    name_ko: '알 카디시야',
    name_en: 'Al-Qadisiyah FC',
    country_ko: '사우디아라비아',
    country_en: 'Saudi-Arabia',
    code: undefined
  },
  {
    id: 2937,
    name_ko: '알 와흐다',
    name_en: 'Al Wehda Club',
    country_ko: '사우디아라비아',
    country_en: 'Saudi-Arabia',
    code: 'WAH'
  },
  {
    id: 2931,
    name_ko: '알 파테',
    name_en: 'Al-Fateh',
    country_ko: '사우디아라비아',
    country_en: 'Saudi-Arabia',
    code: 'FAT'
  },
  {
    id: 2977,
    name_ko: '알 아크두드',
    name_en: 'Al Akhdoud',
    country_ko: '사우디아라비아',
    country_en: 'Saudi-Arabia',
    code: undefined
  },
  {
    id: 2928,
    name_ko: '알 칼리즈',
    name_en: 'Al Khaleej Saihat',
    country_ko: '사우디아라비아',
    country_en: 'Saudi-Arabia',
    code: undefined
  },
  {
    id: 10511,
    name_ko: '알 리야드',
    name_en: 'Al Riyadh',
    country_ko: '사우디아라비아',
    country_en: 'Saudi-Arabia',
    code: 'RIY'
  },
  {
    id: 10509,
    name_ko: '알 콜루드',
    name_en: 'Al Kholood',
    country_ko: '사우디아라비아',
    country_en: 'Saudi-Arabia',
    code: undefined
  },
  {
    id: 2945,
    name_ko: '알 하즘',
    name_en: 'Al-Hazm',
    country_ko: '사우디아라비아',
    country_en: 'Saudi-Arabia',
    code: 'HAZ'
  },
  {
    id: 2992,
    name_ko: '알 나즈마',
    name_en: 'Al Najma',
    country_ko: '사우디아라비아',
    country_en: 'Saudi-Arabia',
    code: 'NAJ'
  },
  {
    id: 10513,
    name_ko: '네옴',
    name_en: 'NEOM',
    country_ko: '사우디아라비아',
    country_en: 'Saudi-Arabia',
    code: 'NEO'
  }
  
];

// 팀 ID로 사우디 프로리그 팀 정보 가져오기
export function getSaudiProLeagueTeamById(id: number): TeamMapping | undefined {
  return SAUDI_PRO_LEAGUE_TEAMS.find(team => team.id === id);
}

// 팀 이름으로 사우디 프로리그 팀 검색하기 (한글/영문 모두 검색 가능)
export function searchSaudiProLeagueTeamsByName(name: string): TeamMapping[] {
  const lowercaseName = name.toLowerCase();
  return SAUDI_PRO_LEAGUE_TEAMS.filter(team => 
    team.name_ko.includes(name) || 
    team.name_en.toLowerCase().includes(lowercaseName)
  );
} 