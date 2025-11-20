'use server';

import { cache } from 'react';

export interface Player {
  id: number;
  name: string;
  photo: string;
  number?: number;
  pos?: string;
}

export interface Team {
  id: number;
  name: string;
  logo: string;
}

export interface PlayerGames {
  minutes?: number;
  number?: number;
  position?: string;
  rating?: string;
  captain?: boolean;
  substitute?: boolean;
}

export interface PlayerShots {
  total?: number;
  on?: number;
}

export interface PlayerGoals {
  total?: number;
  conceded?: number;
  assists?: number;
  saves?: number;
}

export interface PlayerPasses {
  total?: number;
  key?: number;
  accuracy?: string;
}

export interface PlayerTackles {
  total?: number;
  blocks?: number;
  interceptions?: number;
}

export interface PlayerDuels {
  total?: number;
  won?: number;
}

export interface PlayerDribbles {
  attempts?: number;
  success?: number;
  past?: number;
}

export interface PlayerFouls {
  drawn?: number;
  committed?: number;
}

export interface PlayerCards {
  yellow?: number;
  red?: number;
}

export interface PlayerPenalty {
  won?: number;
  committed?: number;
  scored?: number;
  missed?: number;
  saved?: number;
}

export interface PlayerStatistics {
  team: Team;
  games: PlayerGames;
  offsides?: number;
  shots: PlayerShots;
  goals: PlayerGoals;
  passes: PlayerPasses;
  tackles: PlayerTackles;
  duels: PlayerDuels;
  dribbles: PlayerDribbles;
  fouls: PlayerFouls;
  cards: PlayerCards;
  penalty: PlayerPenalty;
  [key: string]: any;
}

export interface PlayerStats {
  player: Player;
  statistics: PlayerStatistics[];
}

export interface PlayerStatsResponse {
  success: boolean;
  response: PlayerStats | null;
  message: string;
}

async function fetchPlayerStats(matchId: string, playerId: number): Promise<PlayerStatsResponse> {
  try {
    if (!matchId || !playerId) {
      return {
        success: false,
        response: null,
        message: '매치 ID와 선수 ID가 필요합니다'
      };
    }

    if (!process.env.FOOTBALL_API_KEY) {
      return {
        success: false,
        response: null,
        message: 'API 키가 설정되지 않았습니다'
      };
    }

    // 전체 경기 선수 통계를 가져옵니다 (개별 선수 API보다 안정적)
    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures/players?fixture=${matchId}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY,
        },
        next: { revalidate: 120 }
      }
    );

    if (!response.ok) {
      return {
        success: false,
        response: null,
        message: `API 응답 오류: ${response.status}`
      };
    }

    const data = await response.json();

    // 응답 검증
    if (!data?.response?.length) {
      return {
        success: false,
        response: null,
        message: '경기 데이터를 찾을 수 없습니다'
      };
    }

    // 모든 팀에서 해당 선수 찾기
    let playerData = null;
    let teamData = null;

    for (const team of data.response) {
      if (!team?.players?.length) continue;
      
      const found = team.players.find((p: any) => p.player?.id === playerId);
      if (found) {
        playerData = found;
        teamData = team;
        break;
      }
    }

    if (!playerData) {
      return {
        success: false,
        response: null,
        message: '해당 선수의 통계를 찾을 수 없습니다'
      };
    }

    if (!playerData.statistics?.length) {
      return {
        success: false,
        response: null,
        message: '선수 통계 데이터가 없습니다'
      };
    }

    // 응답 구성
    const formattedPlayerStats: PlayerStats = {
      player: {
        id: playerData.player.id,
        name: playerData.player.name,
        photo: `https://media.api-sports.io/football/players/${playerData.player.id}.png`,
        number: playerData.statistics[0]?.games?.number,
        pos: playerData.statistics[0]?.games?.position
      },
      statistics: playerData.statistics.map((stat: any) => ({
        ...stat,
        team: stat?.team || {
          id: teamData.team.id,
          name: teamData.team.name,
          logo: teamData.team.logo
        }
      }))
    };

    return {
      success: true,
      response: formattedPlayerStats,
      message: '선수 통계 데이터를 성공적으로 가져왔습니다'
    };

  } catch (error) {
    return {
      success: false,
      response: null,
      message: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
}

export const fetchCachedPlayerStats = cache(fetchPlayerStats);

/**
 * 평점만 가져오는 경량 액션 (포메이션용)
 */
async function fetchPlayerRatingsInternal(matchId: string): Promise<Record<number, number>> {
  try {
    if (!matchId || !process.env.FOOTBALL_API_KEY) {
      return {};
    }

    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures/players?fixture=${matchId}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY,
        },
        next: { revalidate: 120 }
      }
    );

    if (!response.ok) return {};

    const data = await response.json();
    if (!data?.response?.length) return {};

    const ratings: Record<number, number> = {};

    for (const teamStats of data.response) {
      if (!teamStats?.players?.length) continue;

      for (const player of teamStats.players) {
        if (!player?.player?.id) continue;

        const rating = player.statistics?.[0]?.games?.rating;
        if (rating) {
          const ratingValue = typeof rating === 'string' ? parseFloat(rating) : Number(rating);
          if (!isNaN(ratingValue) && ratingValue > 0) {
            ratings[player.player.id] = ratingValue;
          }
        }
      }
    }

    return ratings;
  } catch {
    return {};
  }
}

export const fetchPlayerRatings = cache(fetchPlayerRatingsInternal);

/**
 * 여러 선수의 통계를 한 번에 가져오는 함수
 */
async function fetchMultiplePlayerStatsInternal(
  matchId: string,
  playerIds: number[]
): Promise<Record<number, any>> {
  try {
    if (!matchId || !playerIds.length || !process.env.FOOTBALL_API_KEY) {
      return {};
    }

    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures/players?fixture=${matchId}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY,
        },
        next: { revalidate: 120 }
      }
    );

    if (!response.ok) return {};

    const data = await response.json();
    if (!data?.response?.length) return {};

    const statsMap: Record<number, any> = {};

    for (const teamStats of data.response) {
      if (!teamStats?.players?.length) continue;

      for (const player of teamStats.players) {
        if (!player?.player?.id || !playerIds.includes(player.player.id)) continue;

        statsMap[player.player.id] = {
          response: [
            {
              player: player.player,
              statistics: player.statistics || []
            }
          ]
        };
      }
    }

    return statsMap;
  } catch {
    return {};
  }
}

export const fetchCachedMultiplePlayerStats = cache(fetchMultiplePlayerStatsInternal);
