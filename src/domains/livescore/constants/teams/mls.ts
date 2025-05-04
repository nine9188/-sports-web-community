// 팀 매핑 인터페이스
import { TeamMapping } from './index';

/**
 * MLS 리그 ID
 */
export const MLS_ID = 253;

/**
 * MLS 컨퍼런스 정의
 */
export enum MLSConference {
  EAST = 'EAST',
  WEST = 'WEST',
}

/**
 * MLS 팀 목록
 */
export const MLS_TEAMS: (TeamMapping & { conference: MLSConference })[] = [
  {
    id: 1595,
    name_ko: '시애틀 사운더스',
    name_en: 'Seattle Sounders',
    country_ko: '미국',
    country_en: 'USA',
    code: 'SEA',
    conference: MLSConference.WEST
  },
  {
    id: 1596,
    name_ko: '샌호세 어스퀘이크',
    name_en: 'San Jose Earthquakes',
    country_ko: '미국',
    country_en: 'USA',
    code: 'JOS',
    conference: MLSConference.WEST
  },
  {
    id: 1597,
    name_ko: 'FC 달라스',
    name_en: 'FC Dallas',
    country_ko: '미국',
    country_en: 'USA',
    code: 'DAL',
    conference: MLSConference.WEST
  },
  {
    id: 1598,
    name_ko: '올랜도 시티 SC',
    name_en: 'Orlando City SC',
    country_ko: '미국',
    country_en: 'USA',
    code: undefined,
    conference: MLSConference.EAST
  },
  {
    id: 1599,
    name_ko: '필라델피아 유니온',
    name_en: 'Philadelphia Union',
    country_ko: '미국',
    country_en: 'USA',
    code: 'PHI',
    conference: MLSConference.EAST
  },
  {
    id: 1600,
    name_ko: '휴스턴 다이나모',
    name_en: 'Houston Dynamo',
    country_ko: '미국',
    country_en: 'USA',
    code: 'HOU',
    conference: MLSConference.WEST
  },
  {
    id: 1601,
    name_ko: '토론토 FC',
    name_en: 'Toronto FC',
    country_ko: '캐나다',
    country_en: 'Canada',
    code: 'TOR',
    conference: MLSConference.EAST
  },
  {
    id: 1602,
    name_ko: '뉴욕 레드불스',
    name_en: 'New York Red Bulls',
    country_ko: '미국',
    country_en: 'USA',
    code: 'YOR',
    conference: MLSConference.EAST
  },
  {
    id: 1603,
    name_ko: '밴쿠버 화이트캡스',
    name_en: 'Vancouver Whitecaps',
    country_ko: '캐나다',
    country_en: 'Canada',
    code: undefined,
    conference: MLSConference.WEST
  },
  {
    id: 1604,
    name_ko: '뉴욕 시티 FC',
    name_en: 'New York City FC',
    country_ko: '미국',
    country_en: 'USA',
    code: undefined,
    conference: MLSConference.EAST
  },
  {
    id: 1605,
    name_ko: 'LA 갤럭시',
    name_en: 'Los Angeles Galaxy',
    country_ko: '미국',
    country_en: 'USA',
    code: 'ANG',
    conference: MLSConference.WEST
  },
  {
    id: 1606,
    name_ko: '레알 솔트레이크',
    name_en: 'Real Salt Lake',
    country_ko: '미국',
    country_en: 'USA',
    code: 'SAL',
    conference: MLSConference.WEST
  },
  {
    id: 1607,
    name_ko: '시카고 파이어',
    name_en: 'Chicago Fire',
    country_ko: '미국',
    country_en: 'USA',
    code: 'CHI',
    conference: MLSConference.EAST
  },
  {
    id: 1608,
    name_ko: '애틀란타 유나이티드 FC',
    name_en: 'Atlanta United FC',
    country_ko: '미국',
    country_en: 'USA',
    code: undefined,
    conference: MLSConference.EAST
  },
  {
    id: 1609,
    name_ko: '뉴잉글랜드 레볼루션',
    name_en: 'New England Revolution',
    country_ko: '미국',
    country_en: 'USA',
    code: 'ENG',
    conference: MLSConference.EAST
  },
  {
    id: 1610,
    name_ko: '콜로라도 래피즈',
    name_en: 'Colorado Rapids',
    country_ko: '미국',
    country_en: 'USA',
    code: 'COL',
    conference: MLSConference.WEST
  },
  {
    id: 1611,
    name_ko: '스포팅 캔자스시티',
    name_en: 'Sporting Kansas City',
    country_ko: '미국',
    country_en: 'USA',
    code: 'KAN',
    conference: MLSConference.WEST
  },
  {
    id: 1612,
    name_ko: '미네소타 유나이티드 FC',
    name_en: 'Minnesota United FC',
    country_ko: '미국',
    country_en: 'USA',
    code: 'MIN',
    conference: MLSConference.WEST
  },
  {
    id: 1613,
    name_ko: '콜럼버스 크루',
    name_en: 'Columbus Crew',
    country_ko: '미국',
    country_en: 'USA',
    code: 'COL',
    conference: MLSConference.EAST
  },
  {
    id: 1614,
    name_ko: 'CF 몬트리올',
    name_en: 'CF Montreal',
    country_ko: '캐나다',
    country_en: 'Canada',
    code: 'MON',
    conference: MLSConference.EAST
  },
  {
    id: 1615,
    name_ko: 'DC 유나이티드',
    name_en: 'DC United',
    country_ko: '미국',
    country_en: 'USA',
    code: 'UNI',
    conference: MLSConference.EAST
  },
  {
    id: 1616,
    name_ko: 'LA FC',
    name_en: 'Los Angeles FC',
    country_ko: '미국',
    country_en: 'USA',
    code: undefined,
    conference: MLSConference.WEST
  },
  {
    id: 1617,
    name_ko: '포틀랜드 팀버스',
    name_en: 'Portland Timbers',
    country_ko: '미국',
    country_en: 'USA',
    code: 'POR',
    conference: MLSConference.WEST
  },
  {
    id: 2242,
    name_ko: 'FC 신시내티',
    name_en: 'FC Cincinnati',
    country_ko: '미국',
    country_en: 'USA',
    code: undefined,
    conference: MLSConference.EAST
  },
  {
    id: 9568,
    name_ko: '인터 마이애미',
    name_en: 'Inter Miami',
    country_ko: '미국',
    country_en: 'USA',
    code: undefined,
    conference: MLSConference.EAST
  },
  {
    id: 9569,
    name_ko: '내슈빌 SC',
    name_en: 'Nashville SC',
    country_ko: '미국',
    country_en: 'USA',
    code: undefined,
    conference: MLSConference.EAST
  },
  {
    id: 16489,
    name_ko: '오스틴 FC',
    name_en: 'Austin',
    country_ko: '미국',
    country_en: 'USA',
    code: undefined,
    conference: MLSConference.WEST
  },
  {
    id: 18310,
    name_ko: '샬럿 FC',
    name_en: 'Charlotte',
    country_ko: '미국',
    country_en: 'USA',
    code: undefined,
    conference: MLSConference.EAST
  },
  {
    id: 20787,
    name_ko: '세인트루이스 시티',
    name_en: 'St. Louis City',
    country_ko: '미국',
    country_en: 'USA',
    code: undefined,
    conference: MLSConference.WEST
  },
];

/**
 * ID로 MLS 팀 정보 조회
 * @param id 팀 ID
 * @returns 팀 정보 또는 undefined
 */
export function getMLSTeamById(id: number) {
  return MLS_TEAMS.find(team => team.id === id);
}

/**
 * 이름으로 MLS 팀 검색 (한글/영문)
 * @param name 검색할 팀 이름
 * @returns 검색 결과 팀 배열
 */
export function searchMLSTeamsByName(name: string) {
  const lowercaseName = name.toLowerCase();
  return MLS_TEAMS.filter(
    team => 
      team.name_ko.includes(name) || 
      team.name_en.toLowerCase().includes(lowercaseName)
  );
}

/**
 * 컨퍼런스별 MLS 팀 목록 조회
 * @param conference 조회할 컨퍼런스
 * @returns 해당 컨퍼런스의 팀 배열
 */
export function getMLSTeamsByConference(conference: MLSConference) {
  return MLS_TEAMS.filter(team => team.conference === conference);
} 