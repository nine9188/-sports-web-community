export interface Match {
  id: number;
  status: {
    code: string;
    name: string;
  };
  time: {
    date: string;
    time: number | null;
  };
  league: {
    id: number;
    name: string;
    country_name?: string;
    country_flag?: string;
    country?: string;
    logo?: string;
    flag?: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      img: string;
      score: number | null;
      form: string;
      formation?: string;
    };
    away: {
      id: number;
      name: string;
      img: string;
      score: number | null;
      form: string;
      formation?: string;
    };
  };
}

// 경기 상세 페이지의 탭 타입 정의
export type TabType = string;

// 경기 이벤트 관련 타입 정의
export interface MatchEvent {
  time: {
    elapsed: number;
    extra?: number | null;
  };
  team: {
    id: number;
    name: string;
    logo: string;
  };
  homeTeam?: {
    id: number;
    name: string;
    logo: string;
  };
  awayTeam?: {
    id: number;
    name: string;
    logo: string;
  };
  player: {
    id: number;
    name: string;
  };
  assist?: {
    id: number | null;
    name: string | null;
  };
  type: string;
  detail: string;
  comments?: string;
}

// 선수 타입 정의
export interface Player {
  id: number;
  name: string;
  photo: string;
  number?: number;
  pos?: string;
}

// 팀 정보 타입 정의
export interface Team {
  id: number;
  name: string;
  logo: string;
  update?: string;
}

// 팀 라인업 타입
export interface TeamLineup {
  team: {
    id: number;
    name: string;
    logo: string;
    colors: {
      player: {
        primary: string;
        number: string;
        border: string;
      };
      goalkeeper: {
        primary: string;
        number: string;
        border: string;
      };
    };
  };
  formation: string;
  startXI: Array<{
    player: {
      id: number;
      name: string;
      number: number;
      pos: string;
      grid: string;
      captain?: boolean;
      photo?: string;
    };
  }>;
  substitutes: Array<{
    player: {
      id: number;
      name: string;
      number: number;
      pos: string;
      grid: string;
      captain?: boolean;
      photo?: string;
    };
  }>;
  coach: {
    id: number;
    name: string;
    photo: string;
  };
}

// 팀 통계 타입
export interface TeamStats {
  team: {
    id: number;
    name: string;
    logo: string;
  };
  statistics: Array<{
    type: string;
    value: number | string | null;
  }>;
}

// matchData 타입 확장
export interface MatchDataExtended {
  id: number;
  status: {
    code: string;
    name: string;
    elapsed: number | null;
  };
  time: {
    timestamp: number;
    date: string;
    timezone: string;
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
    away: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
  };
  goals: {
    home: number;
    away: number;
  };
  displayDate?: string;
}

// 순위 관련 타입 정의
export interface StandingsData {
  standings: {
    league: {
      id: number;
      name: string;
      logo: string;
      name_ko?: string;
      season?: number;
      standings: Standing[][];
    };
  };
}

export interface Standing {
  rank: number;
  team: {
    id: number;
    name: string;
    logo: string;
  };
  points: number;
  goalsDiff: number;
  description?: string;
  form?: string;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
}

// 팀 통계 타입 정의
export interface TeamStat {
  type: string;
  value: string | number | null;
}

export interface TeamStatistics {
  team: {
    id: number;
    name: string;
  };
  statistics: TeamStat[];
}

// 매치 데이터 타입 정의
export interface MatchDataType {
  fixture?: {
    date?: string;
    status?: {
      short?: string;
      long?: string;
      elapsed?: number | null;
    };
    timestamp?: number;
  };
  league?: {
    name?: string;
    name_ko?: string;
    logo?: string;
    id?: number;
  };
  teams?: {
    home?: {
      id?: number;
      name?: string;
      name_ko?: string;
      logo?: string;
      formation?: string;
    };
    away?: {
      id?: number;
      name?: string;
      name_ko?: string;
      logo?: string;
      formation?: string;
    };
  };
  goals?: {
    home?: number | null;
    away?: number | null;
  };
  score?: {
    halftime?: {
      home?: number | null;
      away?: number | null;
    };
    fulltime?: {
      home?: number | null;
      away?: number | null;
    };
  };
  [key: string]: unknown;
} 