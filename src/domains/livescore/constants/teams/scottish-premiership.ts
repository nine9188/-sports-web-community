// 팀 매핑 인터페이스
import { TeamMapping } from './index';

// 스코티시 프리미어십 ID
export const SCOTTISH_PREMIERSHIP_ID = 179;

// 스코티시 프리미어십 팀 매핑 데이터
export const SCOTTISH_PREMIERSHIP_TEAMS: TeamMapping[] = [
  {
    id: 247,
    name_ko: '셀틱',
    name_en: 'Celtic',
    country_ko: '스코틀랜드',
    country_en: 'Scotland',
    code: 'CEL'
  },
  {
    id: 257,
    name_ko: '레인저스',
    name_en: 'Rangers',
    country_ko: '스코틀랜드',
    country_en: 'Scotland',
    code: 'RAN'
  },
  {
    id: 249,
    name_ko: '하이버니언',
    name_en: 'Hibernian',
    country_ko: '스코틀랜드',
    country_en: 'Scotland',
    code: 'HIB'
  },
  {
    id: 1386,
    name_ko: '던디 유나이티드',
    name_en: 'Dundee Utd',
    country_ko: '스코틀랜드',
    country_en: 'Scotland',
    code: 'DUN'
  },
  {
    id: 252,
    name_ko: '애버딘',
    name_en: 'Aberdeen',
    country_ko: '스코틀랜드',
    country_en: 'Scotland',
    code: 'ABE'
  },
  {
    id: 251,
    name_ko: '세인트 미렌',
    name_en: 'ST Mirren',
    country_ko: '스코틀랜드',
    country_en: 'Scotland',
    code: 'MIR'
  },
  {
    id: 254,
    name_ko: '하츠',
    name_en: 'Heart Of Midlothian',
    country_ko: '스코틀랜드',
    country_en: 'Scotland',
    code: 'HEA'
  },
  {
    id: 256,
    name_ko: '머더웰',
    name_en: 'Motherwell',
    country_ko: '스코틀랜드',
    country_en: 'Scotland',
    code: 'MOT'
  },
  {
    id: 250,
    name_ko: '킬마넉',
    name_en: 'Kilmarnock',
    country_ko: '스코틀랜드',
    country_en: 'Scotland',
    code: 'KIL'
  },
  {
    id: 902,
    name_ko: '로스 카운티',
    name_en: 'Ross County',
    country_ko: '스코틀랜드',
    country_en: 'Scotland',
    code: 'ROS'
  },
  {
    id: 253,
    name_ko: '던디',
    name_en: 'Dundee',
    country_ko: '스코틀랜드',
    country_en: 'Scotland',
    code: 'DUN'
  },
  {
    id: 258,
    name_ko: '세인트 존스턴',
    name_en: 'ST Johnstone',
    country_ko: '스코틀랜드',
    country_en: 'Scotland',
    code: 'JOH'
  },
  {
    id: 255,
    name_ko: '리빙스턴',
    name_en: 'Livingston',
    country_ko: '스코틀랜드',
    country_en: 'Scotland',
    code: 'LIV'
  },
  {
    id: 1389,
    name_ko: '폴커크',
    name_en: 'Falkirk',
    country_ko: '스코틀랜드',
    country_en: 'Scotland',
    code: 'FAL'
  }  
];

// 팀 ID로 스코티시 프리미어십 팀 정보 가져오기
export function getScottishPremiershipTeamById(id: number): TeamMapping | undefined {
  return SCOTTISH_PREMIERSHIP_TEAMS.find(team => team.id === id);
}

// 팀 이름으로 스코티시 프리미어십 팀 검색하기 (한글/영문 모두 검색 가능)
export function searchScottishPremiershipTeamsByName(name: string): TeamMapping[] {
  const lowercaseName = name.toLowerCase();
  return SCOTTISH_PREMIERSHIP_TEAMS.filter(team => 
    team.name_ko.includes(name) || 
    team.name_en.toLowerCase().includes(lowercaseName)
  );
} 