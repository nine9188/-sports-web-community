/**
 * 경기 상태 코드 상수 및 유틸리티
 * API-Football 상태 코드 기반
 */

// 라이브(진행 중) 경기 상태 코드
export const LIVE_STATUS_CODES = ['LIVE', 'IN_PLAY', '1H', '2H', 'HT'] as const;

// 경기 종료 상태 코드
export const FINISHED_STATUS_CODES = ['FT', 'AET', 'PEN', 'FT_PEN'] as const;

// 경기 시작 전 상태 코드
export const NOT_STARTED_STATUS_CODES = ['NS', 'TBD', 'SUSP', 'PST', 'CANC', 'ABD', 'AWD', 'WO'] as const;

// 타입 정의
export type LiveStatusCode = (typeof LIVE_STATUS_CODES)[number];
export type FinishedStatusCode = (typeof FINISHED_STATUS_CODES)[number];
export type NotStartedStatusCode = (typeof NOT_STARTED_STATUS_CODES)[number];

/**
 * 경기가 현재 진행 중인지 확인
 */
export function isLiveMatch(statusCode: string): boolean {
  return LIVE_STATUS_CODES.includes(statusCode as LiveStatusCode);
}

/**
 * 경기가 종료되었는지 확인
 */
export function isFinishedMatch(statusCode: string): boolean {
  return FINISHED_STATUS_CODES.includes(statusCode as FinishedStatusCode);
}

/**
 * 경기가 아직 시작되지 않았는지 확인
 */
export function isNotStartedMatch(statusCode: string): boolean {
  return NOT_STARTED_STATUS_CODES.includes(statusCode as NotStartedStatusCode);
}

/**
 * 배열에서 라이브 경기 수 계산
 */
export function countLiveMatches<T extends { status: { code: string } }>(matches: T[]): number {
  return matches.filter(match => isLiveMatch(match.status.code)).length;
}

/**
 * 배열에서 라이브 경기만 필터링
 */
export function filterLiveMatches<T extends { status: { code: string } }>(matches: T[]): T[] {
  return matches.filter(match => isLiveMatch(match.status.code));
}
