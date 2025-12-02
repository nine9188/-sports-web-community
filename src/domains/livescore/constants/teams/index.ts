// 팀 매핑 공통 인터페이스
export interface TeamMapping {
  id: number;         // API-Football ID
  name_ko: string;    // 한국어 이름
  name_en: string;    // 영어 이름
  country_ko?: string;  // 국가 (한국어)
  country_en?: string;  // 국가 (영어)
  code?: string;      // 팀 코드 (짧은 약자)
  logo?: string;      // 로고 URL (없을 경우 기본 이미지 사용)
  conference?: string; // MLS 컨퍼런스 (동부/서부)
}

// 프리미어리그 팀 모듈 내보내기
export * from './premier-league';
// 라리가 팀 모듈 내보내기
export * from './laliga';
// 분데스리가 팀 모듈 내보내기
export * from './bundesliga';
// 세리에 A 팀 모듈 내보내기
export * from './serie-a';
// 리그 1 팀 모듈 내보내기
export * from './ligue-1';
// 에레디비시 팀 모듈 내보내기
export * from './eredivisie';
// 잉글랜드 챔피언십 팀 모듈 내보내기
export * from './championship';
// 스코티시 프리미어십 팀 모듈 내보내기
export * from './scottish-premiership';
// 포르투갈 프리메이라 리가 팀 모듈 내보내기
export * from './primeira-liga';
// 한국 K리그 팀 모듈 내보내기
export * from './k-league';
// 일본 J리그 팀 모듈 내보내기
export * from './j-league';
// 덴마크 수페르리가 팀 모듈 내보내기
export * from './danish-superliga';
// MLS 팀 모듈 내보내기
export * from './mls';
// 사우디 프로리그 팀 모듈 내보내기
export * from './saudi-pro-league';
export * from './chinese-super-league';
export * from './brasileirao';
export * from './liga-mx';
// UEFA 컨퍼런스 리그 팀 모듈 내보내기
export * from './conference-league';
// UEFA 유로파리그 팀 모듈 내보내기
export * from './europa-league';
// UEFA 챔피언스 리그 팀 모듈 내보내기
export * from './champions-league';

// 모든 팀 데이터에 접근하기 위한 함수
import { PREMIER_LEAGUE_TEAMS } from './premier-league';
import { LALIGA_TEAMS } from './laliga';
import { BUNDESLIGA_TEAMS } from './bundesliga';
import { SERIE_A_TEAMS } from './serie-a';
import { LIGUE_1_TEAMS } from './ligue-1';
import { EREDIVISIE_TEAMS } from './eredivisie';
import { CHAMPIONSHIP_TEAMS } from './championship';
import { SCOTTISH_PREMIERSHIP_TEAMS } from './scottish-premiership';
import { PRIMEIRA_LIGA_TEAMS } from './primeira-liga';
import { K_LEAGUE_TEAMS } from './k-league';
import { J_LEAGUE_TEAMS } from './j-league';
import { DANISH_SUPERLIGA_TEAMS } from './danish-superliga';
import { MLS_TEAMS } from './mls';
import { SAUDI_PRO_LEAGUE_TEAMS } from './saudi-pro-league';
import { CHINESE_SUPER_LEAGUE_TEAMS } from './chinese-super-league';
import { BRASILEIRAO_TEAMS } from './brasileirao';
import { LIGA_MX_TEAMS } from './liga-mx';
import { CONFERENCE_LEAGUE_TEAMS } from './conference-league';
import { EUROPA_LEAGUE_TEAMS } from './europa-league';
import { CHAMPIONS_LEAGUE_TEAMS } from './champions-league';

// 모든 리그의 모든 팀 통합 배열
export const ALL_TEAMS: TeamMapping[] = [
  ...PREMIER_LEAGUE_TEAMS,
  ...LALIGA_TEAMS,
  ...BUNDESLIGA_TEAMS,
  ...SERIE_A_TEAMS,
  ...LIGUE_1_TEAMS,
  ...EREDIVISIE_TEAMS,
  ...CHAMPIONSHIP_TEAMS,
  ...SCOTTISH_PREMIERSHIP_TEAMS,
  ...PRIMEIRA_LIGA_TEAMS,
  ...K_LEAGUE_TEAMS,
  ...J_LEAGUE_TEAMS,
  ...DANISH_SUPERLIGA_TEAMS,
  ...MLS_TEAMS,
  ...SAUDI_PRO_LEAGUE_TEAMS,
  ...CHINESE_SUPER_LEAGUE_TEAMS,
  ...BRASILEIRAO_TEAMS,
  ...LIGA_MX_TEAMS,
  ...CONFERENCE_LEAGUE_TEAMS,
  ...EUROPA_LEAGUE_TEAMS,
  ...CHAMPIONS_LEAGUE_TEAMS
];

// 리그 ID와 팀 ID 매핑 정보를 제공하는 객체
export const LEAGUE_TEAM_MAPPINGS = {
  // 프리미어리그 (39)
  39: PREMIER_LEAGUE_TEAMS,
  // 라리가 (140)
  140: LALIGA_TEAMS,
  // 분데스리가 (78)
  78: BUNDESLIGA_TEAMS,
  // 세리에 A (135)
  135: SERIE_A_TEAMS,
  // 리그 1 (61)
  61: LIGUE_1_TEAMS,
  // 에레디비시 (88)
  88: EREDIVISIE_TEAMS,
  // 챔피언십 (40)
  40: CHAMPIONSHIP_TEAMS,
  // 스코티시 프리미어십 (179)
  179: SCOTTISH_PREMIERSHIP_TEAMS,
  // 프리메이라 리가 (94)
  94: PRIMEIRA_LIGA_TEAMS,
  // K리그 (292)
  292: K_LEAGUE_TEAMS,
  // J리그 (98)
  98: J_LEAGUE_TEAMS,
  // 덴마크 수페르리가 (119)
  119: DANISH_SUPERLIGA_TEAMS,
  // MLS (253)
  253: MLS_TEAMS,
  // 사우디 프로리그 (307)
  307: SAUDI_PRO_LEAGUE_TEAMS,
  // 중국 슈퍼리그 (169)
  169: CHINESE_SUPER_LEAGUE_TEAMS,
  // 브라질 세리에 A (71)
  71: BRASILEIRAO_TEAMS,
  // 리가 MX (262)
  262: LIGA_MX_TEAMS,
  // UEFA 컨퍼런스 리그 (848)
  848: CONFERENCE_LEAGUE_TEAMS,
  // UEFA 유로파리그 (3)
  3: EUROPA_LEAGUE_TEAMS,
  // UEFA 챔피언스 리그 (2)
  2: CHAMPIONS_LEAGUE_TEAMS
};

// 팀 ID로 팀 정보 가져오기 (모든 리그 대상)
export function getTeamById(id: number): TeamMapping | undefined {
  return ALL_TEAMS.find(team => team.id === id);
}

// 팀 이름으로 팀 검색하기 (모든 리그 대상)
export function searchTeamsByName(name: string): TeamMapping[] {
  if (!name.trim()) return [];
  
  const searchTerm = name.trim().toLowerCase();
  
  return ALL_TEAMS.filter(team => {
    // 한국어 이름 검색 (대소문자 구분 없음)
    const koreanMatch = team.name_ko.toLowerCase().includes(searchTerm);
    
    // 영어 이름 검색 (대소문자 구분 없음)
    const englishMatch = team.name_en.toLowerCase().includes(searchTerm);
    
    // 국가명 검색 (한국어/영어)
    const countryKoMatch = team.country_ko?.toLowerCase().includes(searchTerm) || false;
    const countryEnMatch = team.country_en?.toLowerCase().includes(searchTerm) || false;
    
    // 팀 코드 검색
    const codeMatch = team.code?.toLowerCase().includes(searchTerm) || false;
    
    return koreanMatch || englishMatch || countryKoMatch || countryEnMatch || codeMatch;
  });
}

// 리그 ID로 해당 리그의 모든 팀 가져오기
export function getTeamsByLeagueId(leagueId: number): TeamMapping[] {
  return LEAGUE_TEAM_MAPPINGS[leagueId as keyof typeof LEAGUE_TEAM_MAPPINGS] || [];
}

// 리그 ID와 팀 ID로 팀 정보 가져오기
export function getTeamByLeagueAndTeamId(leagueId: number, teamId: number): TeamMapping | undefined {
  const leagueTeams = getTeamsByLeagueId(leagueId);
  return leagueTeams.find(team => team.id === teamId);
}

// 팀 이름 표시 함수 (국가 포함 여부 옵션)
export function getTeamDisplayName(id: number, options: {
  language?: 'ko' | 'en',
  includeCountry?: boolean
} = {}): string {
  const { language = 'ko', includeCountry = false } = options;
  const team = getTeamById(id);
  
  if (!team) return `팀 ${id}`;
  
  const name = language === 'ko' ? team.name_ko : team.name_en;
  const country = includeCountry && team.country_ko && language === 'ko' 
    ? `(${team.country_ko})` 
    : includeCountry && team.country_en && language === 'en'
      ? `(${team.country_en})`
      : '';
  
  return country ? `${name} ${country}` : name;
} 