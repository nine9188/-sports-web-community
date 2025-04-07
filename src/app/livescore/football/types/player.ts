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
  season: number;
}

export interface Statistics {
  team: TeamInfo;
  league: LeagueInfo;
  games: {
    position: string;
    // ... 다른 게임 관련 필드들
  };
  // ... 다른 통계 필드들
}

export interface Transfer {
  date: string;
  type: string;
  teams: {
    from: {
      id: number;
      name: string;
      logo: string;
    };
    to: {
      id: number;
      name: string;
      logo: string;
    };
  };
  fee?: {
    amount: number;
    currency: string;
  };
}

export interface PlayerData {
  info: {
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
  };
  statistics: Statistics[];
  transfers: Transfer[];
  injuries: Array<{
    team: {
      id: number;
      name: string;
      logo: string;
    };
    fixture: {
      id: number;
      date: string;
    };
    league: {
      id: number;
      name: string;
      season: string;
    };
    type: string;
    reason: string;
  }>;
  trophies: Array<{
    league: string;
    country: string;
    season: string;
    place: string;
  }>;
  seasonHistory: Array<{
    season: string;
    team: {
      id: number;
      name: string;
      logo: string;
    };
    league: {
      id: number;
      name: string;
      country: string;
    };
    games: {
      appearances: number;
      minutes: number;
    };
    goals: {
      total: number;
      assists: number;
    };
    cards: {
      yellow: number;
      red: number;
    };
    rating: string;
  }>;
}

export function findMainTeam(statistics: Statistics[]): Statistics | null {
  if (!Array.isArray(statistics) || statistics.length === 0) {
    return null;
  }

  // 주요 리그 ID 목록 (우선순위 순서)
  const mainLeagues = [
    140,  // La Liga
    39,   // Premier League
    135,  // Serie A
    78,   // Bundesliga
    61,   // Ligue 1
    2,    // Champions League
    3,    // Europa League
    848,  // Conference League
  ];

  // 1. 주요 리그에서 찾기
  for (const leagueId of mainLeagues) {
    const mainTeam = statistics.find(stat => stat.league.id === leagueId);
    if (mainTeam) return mainTeam;
  }

  // 2. U17, U19, U21 등을 제외한 팀 찾기
  const seniorTeam = statistics.find(stat => 
    !stat.team.name.includes('U17') && 
    !stat.team.name.includes('U19') && 
    !stat.team.name.includes('U21')
  );
  if (seniorTeam) return seniorTeam;

  // 3. 첫 번째 팀 반환
  return statistics[0];
} 