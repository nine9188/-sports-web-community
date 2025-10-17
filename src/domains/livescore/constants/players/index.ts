// 선수 매핑 공통 인터페이스
export interface PlayerMapping {
  id: number;           // API-Football 선수 ID
  name: string;         // 영문 이름
  korean_name: string | null;  // 한글 이름
  team_id?: number;     // 소속 팀 ID (선택)
  position?: string | null;    // 포지션 (선택)
  number?: number | null;  // 등번호 (선택)
  age?: number | null;  // 나이 (선택)
}

// 프리미어리그 선수 모듈 내보내기
export * from './premier-league';
// 라리가 선수 모듈 내보내기
export * from './laliga';
export * from './laliga-part2';
// 분데스리가 선수 모듈 내보내기
export * from './bundesliga';
// 세리에 A 선수 모듈 내보내기
export * from './serie-a';
export * from './serie-a-part2';
// 리그 1 선수 모듈 내보내기
export * from './ligue-1';
// K리그1 선수 모듈 내보내기
export * from './k-league1';
export * from './k-league1-part2';
// 사우디 프로리그 선수 모듈 내보내기
export * from './saudi-pro-league';
// 프리메이라 리가 선수 모듈 내보내기
export * from './primeira-liga';
// 에레디비시 선수 모듈 내보내기
export * from './eredivisie';
// J1리그 선수 모듈 내보내기
export * from './j1-league';
// MLS 선수 모듈 내보내기
export * from './mls';
export * from './mls-part2';
// 슈퍼리가 선수 모듈 내보내기
export * from './superliga';

// 모든 선수 데이터에 접근하기 위한 함수
import { ALL_PREMIER_LEAGUE_PLAYERS as PREMIER_LEAGUE_PLAYERS } from './premier-league';
import { LALIGA_PLAYERS } from './laliga';
import { LALIGA_PART2_PLAYERS } from './laliga-part2';
import { BUNDESLIGA_PLAYERS } from './bundesliga';
import { SERIE_A_PLAYERS } from './serie-a';
import { SERIE_A_PART2_PLAYERS } from './serie-a-part2';
import { LIGUE1_PLAYERS } from './ligue-1';
import { K_LEAGUE1_PLAYERS } from './k-league1';
import { K_LEAGUE1_PART2_PLAYERS } from './k-league1-part2';
import { SAUDI_PRO_LEAGUE_PLAYERS } from './saudi-pro-league';
import { PRIMEIRA_LIGA_PLAYERS } from './primeira-liga';
import { EREDIVISIE_PLAYERS } from './eredivisie';
import { J1_LEAGUE_PLAYERS } from './j1-league';
import { MLS_PLAYERS } from './mls';
import { MLS_PART2_PLAYERS } from './mls-part2';
import { SUPERLIGA_PLAYERS } from './superliga';

// 모든 리그의 모든 선수 통합 배열
export const ALL_PLAYERS: PlayerMapping[] = [
  ...PREMIER_LEAGUE_PLAYERS,
  ...LALIGA_PLAYERS,
  ...LALIGA_PART2_PLAYERS,
  ...BUNDESLIGA_PLAYERS,
  ...SERIE_A_PLAYERS,
  ...SERIE_A_PART2_PLAYERS,
  ...LIGUE1_PLAYERS,
  ...K_LEAGUE1_PLAYERS,
  ...K_LEAGUE1_PART2_PLAYERS,
  ...SAUDI_PRO_LEAGUE_PLAYERS,
  ...PRIMEIRA_LIGA_PLAYERS,
  ...EREDIVISIE_PLAYERS,
  ...J1_LEAGUE_PLAYERS,
  ...MLS_PLAYERS,
  ...MLS_PART2_PLAYERS,
  ...SUPERLIGA_PLAYERS,
];

// 선수 ID로 한글명 찾기
export function getPlayerKoreanName(playerId: number): string | null {
  const player = ALL_PLAYERS.find(p => p.id === playerId);
  return player?.korean_name || null;
}

// 팀 ID로 선수 목록 필터링
export function getPlayersByTeam(teamId: number): PlayerMapping[] {
  return ALL_PLAYERS.filter(p => p.team_id === teamId);
}

// 리그 ID와 선수 매핑 정보를 제공하는 객체
export const LEAGUE_PLAYER_MAPPINGS = {
  // 프리미어리그 (39)
  39: PREMIER_LEAGUE_PLAYERS,
  // 라리가 (140)
  140: [...LALIGA_PLAYERS, ...LALIGA_PART2_PLAYERS],
  // 분데스리가 (78)
  78: BUNDESLIGA_PLAYERS,
  // 세리에 A (135)
  135: [...SERIE_A_PLAYERS, ...SERIE_A_PART2_PLAYERS],
  // 리그 1 (61)
  61: LIGUE1_PLAYERS,
  // K리그1 (292)
  292: [...K_LEAGUE1_PLAYERS, ...K_LEAGUE1_PART2_PLAYERS],
  // 사우디 프로리그 (307)
  307: SAUDI_PRO_LEAGUE_PLAYERS,
  // 프리메이라 리가 (94)
  94: PRIMEIRA_LIGA_PLAYERS,
  // 에레디비시 (88)
  88: EREDIVISIE_PLAYERS,
  // J1리그 (98)
  98: J1_LEAGUE_PLAYERS,
  // MLS (253)
  253: [...MLS_PLAYERS, ...MLS_PART2_PLAYERS],
  // 덴마크 슈퍼리가 (119)
  119: SUPERLIGA_PLAYERS,
};

