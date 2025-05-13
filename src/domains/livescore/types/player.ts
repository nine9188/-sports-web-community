// 선수 기본 정보 타입
export interface PlayerInfo {
  id: number;
  name: string;
  firstname: string;
  lastname: string;
  age: number;
  birth: {
    date: string;
    place: string;
    country: string;
  };
  nationality: string;
  height: string;
  weight: string;
  injured: boolean;
  photo: string;
}

// 선수의 팀 및 리그 정보
export interface TeamInfo {
  id: number;
  name: string;
  logo: string;
}

export interface LeagueInfo {
  id: number;
  name: string;
  country: string;
  logo: string;
  season?: number;
}

// 선수 통계 타입
export interface PlayerStatistic {
  team: {
    id: number;
    name: string;
    logo: string;
  };
  league: {
    id: number;
    name: string;
    logo: string;
    country: string;
    flag?: string;
    season: number;
  };
  games: {
    appearences: number;
    lineups: number;
    minutes: number;
    number?: number;
    position: string;
    rating?: string;
    captain: boolean;
  };
  substitutes: {
    in: number;
    out: number;
    bench: number;
  };
  shots: {
    total?: number;
    on?: number;
  };
  goals: {
    total?: number;
    conceded?: number;
    assists?: number;
    saves?: number;
    cleansheets?: number;
  };
  passes: {
    total?: number;
    key?: number;
    accuracy?: string;
    cross?: number;
  };
  tackles: {
    total?: number;
    blocks?: number;
    interceptions?: number;
    clearances?: number;
  };
  duels: {
    total?: number;
    won?: number;
  };
  dribbles: {
    attempts?: number;
    success?: number;
    past?: number;
  };
  fouls: {
    drawn?: number;
    committed?: number;
  };
  cards: {
    yellow: number;
    yellowred: number;
    red: number;
  };
  penalty: {
    won?: number;
    commited?: number;
    scored?: number;
    missed?: number;
    saved?: number;
  };
}

// 경기 데이터 타입
export interface FixtureData {
  fixture: {
    id: number;
    date: string;
    timestamp?: number;
  };
  league: LeagueInfo;
  teams: {
    home: TeamInfo;
    away: TeamInfo;
    playerTeamId: number | null;
  };
  goals: {
    home: string;
    away: string;
  };
  statistics?: {
    games?: {
      minutes?: number;
      rating?: string;
    };
    goals?: {
      total?: number;
      assists?: number;
    };
    shots?: {
      total?: number;
      on?: number;
    };
    passes?: {
      total?: number;
      key?: number;
    };
  };
}

// 이적 기록 타입
export interface TransferData {
  date: string;
  type: string;
  teams: {
    from: TeamInfo;
    to: TeamInfo;
  };
}

// 부상 기록 타입
export interface InjuryData {
  fixture: {
    date: string;
  };
  league: {
    name: string;
    season: string;
  };
  team: {
    name: string;
    logo: string;
  };
  type: string;
  reason: string;
}

// 트로피 데이터 타입
export interface TrophyData {
  league: string;
  country: string;
  place: string;
  season: string;
  leagueLogo: string | null;
}

// 랭킹 데이터 타입
export interface PlayerRanking {
  player: {
    id: number;
    name: string;
    photo: string;
  };
  statistics: Array<{
    team: TeamInfo;
    goals: {
      total?: number;
      assists?: number;
    };
    games: {
      appearences?: number;
      minutes?: number;
    };
    cards: {
      yellow?: number;
      red?: number;
    };
  }>;
}

export interface RankingsData {
  topScorers?: PlayerRanking[];
  topAssists?: PlayerRanking[];
  mostGamesScored?: PlayerRanking[];
  leastPlayTime?: PlayerRanking[];
  topRedCards?: PlayerRanking[];
  topYellowCards?: PlayerRanking[];
}

// 선수 데이터 통합 타입
export interface PlayerData {
  info: PlayerInfo;
  statistics: PlayerStatistic[];
} 