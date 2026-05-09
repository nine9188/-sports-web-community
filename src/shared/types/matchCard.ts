/**
 * Shared match card types.
 */

export interface MatchTeam {
  id?: number | string;
  name: string;
  name_en?: string | null;
  name_ko?: string | null;
  slug?: string | null;
  logo?: string;
  winner?: boolean | null;
}

export interface MatchLeague {
  id?: number | string;
  name: string;
  logo?: string;
  country?: string;
  flag?: string;
}

export interface MatchGoals {
  home: number | null;
  away: number | null;
}

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

export interface MatchStatus {
  code: MatchStatusCode;
  elapsed?: number | null;
  name?: string;
}

export interface MatchCardData {
  id: string | number;
  teams: {
    home: MatchTeam;
    away: MatchTeam;
  };
  goals: MatchGoals;
  league: MatchLeague;
  status: MatchStatus;
}

export interface MatchCardProps {
  matchId: string | number;
  matchData: MatchCardData;
  isEditable?: boolean;
}

export interface MatchCardNodeAttrs {
  matchId: string | number;
  matchData: MatchCardData;
}

export interface MatchStatusInfo {
  text: string;
  className: string;
  isLive: boolean;
}

export interface ImageUrlPair {
  light: string;
  dark: string;
}
