// 골 데이터 인터페이스
export interface GoalValue {
  total: number | null;
  percentage: string | null;
}

// 카드 데이터 인터페이스
export interface CardData {
  total: number;
  percentage: string;
}

// 포메이션 데이터 인터페이스
export interface LineupData {
  formation: string;
  played: number;
}

// 리그 정보 인터페이스
export interface LeagueData {
  id: number;
  name: string;
  country: string;
  logo: string;
  flag: string;
  season: number;
}

// 팀 통계 데이터 인터페이스
export interface TeamStatsData {
  league?: LeagueData;
  form?: string;
  fixtures?: {
    wins: { total: number; home: number; away: number };
    draws: { total: number; home: number; away: number };
    loses: { total: number; home: number; away: number };
    played: { total: number; home: number; away: number };
  };
  goals?: {
    for: { 
      total: { total: number; home: number; away: number; minute?: Record<string, GoalValue> };
      average: { total: string; home: string; away: string };
      minute?: Record<string, GoalValue>;
    };
    against: { 
      total: { total: number; home: number; away: number; minute?: Record<string, GoalValue> };
      average: { total: string; home: string; away: string };
      minute?: Record<string, GoalValue>;
    };
  };
  clean_sheet?: { total: number; home: number; away: number };
  lineups?: LineupData[];
  cards?: {
    yellow: Record<string, CardData>;
    red: Record<string, CardData>;
  };
  penalty?: {
    total: number;
    scored: { total: number; percentage: string };
    missed: { total: number; percentage: string };
  };
  failed_to_score?: {
    home: number;
    away: number;
    total: number;
  };
  biggest?: {
    streak: { wins: number; draws: number; loses: number };
    wins: { home: string; away: string };
    loses: { home: string; away: string };
  };
} 