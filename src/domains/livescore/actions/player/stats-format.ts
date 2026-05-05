import { PlayerStatistic } from '@/domains/livescore/types/player';

export interface ApiStatisticResponse {
  team?: {
    id?: number;
    name?: string;
    logo?: string;
  };
  league?: {
    id?: number;
    name?: string;
    country?: string;
    logo?: string;
    flag?: string;
    season?: number;
  };
  games?: {
    appearences?: number;
    lineups?: number;
    minutes?: number;
    number?: number;
    position?: string;
    rating?: string;
    captain?: boolean;
  };
  substitutes?: {
    in?: number;
    out?: number;
    bench?: number;
  };
  shots?: {
    total?: number;
    on?: number;
  };
  goals?: {
    total?: number;
    conceded?: number;
    assists?: number;
    saves?: number;
    cleansheets?: number;
  };
  passes?: {
    total?: number;
    key?: number;
    accuracy?: string;
  };
  tackles?: {
    total?: number;
    blocks?: number;
    interceptions?: number;
    clearances?: number;
  };
  duels?: {
    total?: number;
    won?: number;
  };
  dribbles?: {
    attempts?: number;
    success?: number;
    past?: number;
  };
  fouls?: {
    drawn?: number;
    committed?: number;
  };
  cards?: {
    yellow?: number;
    yellowred?: number;
    red?: number;
  };
  penalty?: {
    won?: number;
    commited?: number;
    scored?: number;
    missed?: number;
    saved?: number;
  };
}

function getLeaguePriority(leagueId: number): number {
  const majorLeagues = [39, 140, 78, 135, 61];
  if (majorLeagues.includes(leagueId)) return 1;

  const secondTierLeagues = [40, 179, 88, 94, 119];
  if (secondTierLeagues.includes(leagueId)) return 2;

  const otherMajorLeagues = [292, 98, 253, 307, 71, 262, 169];
  if (otherMajorLeagues.includes(leagueId)) return 3;

  const europeanCups = [2, 3, 848];
  if (europeanCups.includes(leagueId)) return 4;

  return 5;
}

export function formatPlayerStatistics(
  statistics: ApiStatisticResponse[] | undefined,
  season: number
): PlayerStatistic[] {
  if (!statistics?.length) return [];

  const stats = statistics.map((stat: ApiStatisticResponse) => ({
    team: {
      id: stat.team?.id || 0,
      name: stat.team?.name || '',
      logo: stat.team?.logo || '',
    },
    league: {
      id: stat.league?.id || 0,
      name: stat.league?.name || '',
      country: stat.league?.country || '',
      logo: stat.league?.logo || '',
      flag: stat.league?.flag || '',
      season: stat.league?.season || season,
    },
    games: {
      appearences: stat.games?.appearences || 0,
      lineups: stat.games?.lineups || 0,
      minutes: stat.games?.minutes || 0,
      number: stat.games?.number,
      position: stat.games?.position || '',
      rating: stat.games?.rating || '',
      captain: stat.games?.captain || false,
    },
    substitutes: {
      in: stat.substitutes?.in || 0,
      out: stat.substitutes?.out || 0,
      bench: stat.substitutes?.bench || 0,
    },
    shots: {
      total: stat.shots?.total,
      on: stat.shots?.on,
    },
    goals: {
      total: stat.goals?.total,
      conceded: stat.goals?.conceded,
      assists: stat.goals?.assists,
      saves: stat.goals?.saves,
      cleansheets: stat.goals?.cleansheets,
    },
    passes: {
      total: stat.passes?.total,
      key: stat.passes?.key,
      accuracy: stat.passes?.accuracy,
      cross: 0,
    },
    tackles: {
      total: stat.tackles?.total,
      blocks: stat.tackles?.blocks,
      interceptions: stat.tackles?.interceptions,
      clearances: 0,
    },
    duels: {
      total: stat.duels?.total,
      won: stat.duels?.won,
    },
    dribbles: {
      attempts: stat.dribbles?.attempts,
      success: stat.dribbles?.success,
      past: stat.dribbles?.past,
    },
    fouls: {
      drawn: stat.fouls?.drawn,
      committed: stat.fouls?.committed,
    },
    cards: {
      yellow: stat.cards?.yellow || 0,
      yellowred: stat.cards?.yellowred || 0,
      red: stat.cards?.red || 0,
    },
    penalty: {
      won: stat.penalty?.won,
      commited: stat.penalty?.commited,
      scored: stat.penalty?.scored,
      missed: stat.penalty?.missed,
      saved: stat.penalty?.saved,
    },
  }));

  return stats.sort((a: PlayerStatistic, b: PlayerStatistic) => {
    const priorityA = getLeaguePriority(a.league.id);
    const priorityB = getLeaguePriority(b.league.id);

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    return (b.games.appearences || 0) - (a.games.appearences || 0);
  });
}
