/**
 * 매치카드 공통 타입 정의
 *
 * 이 파일은 매치카드 관련 모든 타입의 단일 소스입니다.
 * 다른 곳에서 MatchData를 정의하지 마세요.
 */

/**
 * 팀 정보
 */
export interface MatchTeam {
  id?: number | string;
  name: string;
  logo?: string;
  winner?: boolean | null;
}

/**
 * 리그 정보
 */
export interface MatchLeague {
  id?: number | string;
  name: string;
  logo?: string;
  country?: string;
  flag?: string;
}

/**
 * 골 정보
 */
export interface MatchGoals {
  home: number | null;
  away: number | null;
}

/**
 * 경기 상태 코드
 * - NS: 경기 예정 (Not Started)
 * - 1H: 전반전 (First Half)
 * - HT: 하프타임 (Half Time)
 * - 2H: 후반전 (Second Half)
 * - FT: 경기 종료 (Full Time)
 * - LIVE: 진행 중
 * - PST: 연기됨 (Postponed)
 * - CANC: 취소됨 (Cancelled)
 * - ABD: 중단됨 (Abandoned)
 */
export type MatchStatusCode =
  | 'NS'
  | '1H'
  | 'HT'
  | '2H'
  | 'FT'
  | 'LIVE'
  | 'PST'
  | 'CANC'
  | 'ABD'
  | string;

/**
 * 경기 상태
 */
export interface MatchStatus {
  code: MatchStatusCode;
  elapsed?: number | null;
  name?: string;
}

/**
 * 매치카드 데이터 (통합 인터페이스)
 *
 * TipTap Extension, React Component, Renderer 모두 이 타입 사용
 */
export interface MatchCardData {
  /** 경기 ID (API Sports fixture ID) */
  id: string | number;

  /** 팀 정보 */
  teams: {
    home: MatchTeam;
    away: MatchTeam;
  };

  /** 골 정보 (경기 시작 전이면 null) */
  goals: MatchGoals;

  /** 리그 정보 */
  league: MatchLeague;

  /** 경기 상태 */
  status: MatchStatus;
}

/**
 * 매치카드 렌더링 Props
 */
export interface MatchCardProps {
  matchId: string | number;
  matchData: MatchCardData;
  isEditable?: boolean;
}

/**
 * TipTap 노드 속성
 */
export interface MatchCardNodeAttrs {
  matchId: string | number;
  matchData: MatchCardData;
}

/**
 * 상태 텍스트 정보
 */
export interface MatchStatusInfo {
  text: string;
  className: string;
  isLive: boolean;
}

/**
 * 이미지 URL 쌍 (라이트/다크 모드)
 */
export interface ImageUrlPair {
  light: string;
  dark: string;
}
