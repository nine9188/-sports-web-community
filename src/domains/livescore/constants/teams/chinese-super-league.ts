// 팀 매핑 인터페이스
import { TeamMapping } from './index';

// 중국 슈퍼리그 리그 ID
export const CHINESE_SUPER_LEAGUE_ID = 169;

// 중국 슈퍼리그 팀 매핑 데이터
export const CHINESE_SUPER_LEAGUE_TEAMS: TeamMapping[] = [
  {
    id: 5648,
    name_ko: '청두 베터 시티',
    name_en: 'Chengdu Better City',
    country_ko: '중국',
    country_en: 'China',
    code: 'CDB'
  },
  {
    id: 836,
    name_ko: '상하이 SIPG',
    name_en: 'SHANGHAI SIPG',
    country_ko: '중국',
    country_en: 'China',
    code: 'SIP'
  },
  {
    id: 833,
    name_ko: '상하이 선화',
    name_en: 'Shanghai Shenhua',
    country_ko: '중국',
    country_en: 'China',
    code: 'SHN'
  },
  {
    id: 830,
    name_ko: '베이징 궈안',
    name_en: 'Beijing Guoan',
    country_ko: '중국',
    country_en: 'China',
    code: 'BEI'
  },
  {
    id: 844,
    name_ko: '산둥 루넝',
    name_en: 'Shandong Luneng',
    country_ko: '중국',
    country_en: 'China',
    code: 'SDL'
  },
  {
    id: 848,
    name_ko: '항저우 그린타운',
    name_en: 'Hangzhou Greentown',
    country_ko: '중국',
    country_en: 'China',
    code: 'HNG'
  },
  {
    id: 837,
    name_ko: '텐진 테다',
    name_en: 'Tianjin Teda',
    country_ko: '중국',
    country_en: 'China',
    code: 'TED'
  },
  {
    id: 21263,
    name_ko: '다롄 즈싱',
    name_en: 'Dalian Zhixing',
    country_ko: '중국',
    country_en: 'China',
    code: 'DLZ'
  },
  {
    id: 21265,
    name_ko: '윈난 위쿤',
    name_en: 'Yunnan Yukun',
    country_ko: '중국',
    country_en: 'China',
    code: 'YUK'
  },
  {
    id: 17265,
    name_ko: '칭다오 유스 아일랜드',
    name_en: 'Qingdao Youth Island',
    country_ko: '중국',
    country_en: 'China',
    code: 'QYI'
  },
  {
    id: 840,
    name_ko: '허난 지앤예',
    name_en: 'Henan Jianye',
    country_ko: '중국',
    country_en: 'China',
    code: 'HEN'
  },
  {
    id: 5695,
    name_ko: '우한 쓰리 타운즈',
    name_en: 'Wuhan Three Towns',
    country_ko: '중국',
    country_en: 'China',
    code: 'WTT'
  },
  {
    id: 5686,
    name_ko: '쓰촨 지우니우',
    name_en: 'Sichuan Jiuniu',
    country_ko: '중국',
    country_en: 'China',
    code: 'SCJ'
  },
  {
    id: 1439,
    name_ko: '메이저우 커자',
    name_en: 'Meizhou Kejia',
    country_ko: '중국',
    country_en: 'China',
    code: 'MEI'
  },
  {
    id: 1431,
    name_ko: '칭다오 중넝',
    name_en: 'Qingdao Jonoon',
    country_ko: '중국',
    country_en: 'China',
    code: 'QDJ'
  },
  {
    id: 834,
    name_ko: '창춘 야타이',
    name_en: 'Changchun Yatai',
    country_ko: '중국',
    country_en: 'China',
    code: 'CHY'
  }
];

// 팀 ID로 중국 슈퍼리그 팀 정보 가져오기
export function getChineseSuperLeagueTeamById(id: number): TeamMapping | undefined {
  return CHINESE_SUPER_LEAGUE_TEAMS.find(team => team.id === id);
}

// 팀 이름으로 중국 슈퍼리그 팀 검색하기 (한글/영문 모두 검색 가능)
export function searchChineseSuperLeagueTeamsByName(name: string): TeamMapping[] {
  const lowercaseName = name.toLowerCase();
  return CHINESE_SUPER_LEAGUE_TEAMS.filter(team => 
    team.name_ko.includes(name) || 
    team.name_en.toLowerCase().includes(lowercaseName)
  );
}
