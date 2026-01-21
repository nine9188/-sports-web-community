// Predictions API 타입 (전체 데이터)
export interface MinuteStats {
  [key: string]: { total: number | null; percentage: string | null };
}

export interface UnderOverStats {
  [key: string]: { over: number; under: number };
}

export interface TeamLeagueData {
  form?: string;
  fixtures?: {
    played: { home: number; away: number; total: number };
    wins: { home: number; away: number; total: number };
    draws: { home: number; away: number; total: number };
    loses: { home: number; away: number; total: number };
  };
  goals?: {
    for: {
      total: { home: number; away: number; total: number };
      average: { home: string; away: string; total: string };
      minute?: MinuteStats;
      under_over?: UnderOverStats;
    };
    against: {
      total: { home: number; away: number; total: number };
      average: { home: string; away: string; total: string };
      minute?: MinuteStats;
      under_over?: UnderOverStats;
    };
  };
  biggest?: {
    streak: { wins: number; draws: number; loses: number };
    wins: { home: string | null; away: string | null };
    loses: { home: string | null; away: string | null };
    goals: { for: { home: number; away: number }; against: { home: number; away: number } };
  };
  clean_sheet?: { home: number; away: number; total: number };
  failed_to_score?: { home: number; away: number; total: number };
  penalty?: {
    scored: { total: number; percentage: string };
    missed: { total: number; percentage: string };
    total: number;
  };
  lineups?: Array<{ formation: string; played: number }>;
  cards?: {
    yellow: MinuteStats;
    red: MinuteStats;
  };
}

export interface TeamData {
  id: number;
  name: string;
  logo: string;
  last_5: {
    form: string;
    att: string;
    def: string;
    goals: { for: { total: number; average: number }; against: { total: number; average: number } };
  };
  league?: TeamLeagueData;
}

export interface PredictionApiData {
  predictions: {
    winner: { id: number | null; name: string | null; comment: string | null };
    win_or_draw: boolean;
    under_over: string | null;
    goals: { home: string; away: string };
    advice: string | null;
    percent: { home: string; draw: string; away: string };
  };
  comparison: {
    form: { home: string; away: string };
    att: { home: string; away: string };
    def: { home: string; away: string };
    poisson_distribution: { home: string; away: string };
    h2h: { home: string; away: string };
    goals: { home: string; away: string };
    total: { home: string; away: string };
  };
  teams: {
    home: TeamData;
    away: TeamData;
  };
  h2h: Array<{
    fixture: { id: number; date: string };
    league?: { name: string; round: string };
    teams: { home: { id: number; name: string; logo?: string; winner: boolean | null }; away: { id: number; name: string; logo?: string; winner: boolean | null } };
    goals: { home: number; away: number };
    score?: { halftime: { home: number; away: number }; fulltime: { home: number; away: number } };
  }>;
}

export interface UpcomingMatch {
  id: number;
  date: string;
  league: {
    id: number;
    name: string;
    logo: string;
  };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  status: string;
}

export interface PredictionLog {
  id: string;
  trigger_type: string;
  status: string;
  matches_processed: number;
  posts_created: number;
  error_message?: string;
  execution_time_ms?: number;
  created_at: string;
  details?: string;
}

export interface LeagueGroup {
  league: UpcomingMatch['league'];
  matches: UpcomingMatch[];
}
