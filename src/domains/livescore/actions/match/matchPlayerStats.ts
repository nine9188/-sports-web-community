'use server';

import { cache } from 'react';

/**
 * 경기의 모든 선수 통계를 한 번에 가져오는 통합 액션
 * Stats 탭에서 사용하기 위한 최적화된 함수
 */

export interface PlayerStatsForMatch {
  homeTeam: {
    id: number;
    name: string;
    logo: string;
    players: Array<{
      playerId: number;
      playerName: string;
      playerNumber?: number;
      position?: string;
      minutes?: number;
      rating?: string | number;
      goals?: number;
      assists?: number;
      shotsTotal?: number;
      shotsOn?: number;
      passesTotal?: number;
      passesKey?: number;
      passesAccuracy?: number | string;
      dribblesAttempts?: number;
      dribblesSuccess?: number;
      duelsTotal?: number;
      duelsWon?: number;
      foulsCommitted?: number;
      yellowCards?: number;
      redCards?: number;
    }>;
  } | null;
  awayTeam: {
    id: number;
    name: string;
    logo: string;
    players: Array<{
      playerId: number;
      playerName: string;
      playerNumber?: number;
      position?: string;
      minutes?: number;
      rating?: string | number;
      goals?: number;
      assists?: number;
      shotsTotal?: number;
      shotsOn?: number;
      passesTotal?: number;
      passesKey?: number;
      passesAccuracy?: number | string;
      dribblesAttempts?: number;
      dribblesSuccess?: number;
      duelsTotal?: number;
      duelsWon?: number;
      foulsCommitted?: number;
      yellowCards?: number;
      redCards?: number;
    }>;
  } | null;
}

export interface MatchPlayerStatsResponse {
  success: boolean;
  data: PlayerStatsForMatch | null;
  message: string;
}

async function fetchMatchPlayerStatsInternal(matchId: string): Promise<MatchPlayerStatsResponse> {
  try {
    if (!matchId) {
      return {
        success: false,
        data: null,
        message: '매치 ID가 필요합니다'
      };
    }

    if (!process.env.FOOTBALL_API_KEY) {
      return {
        success: false,
        data: null,
        message: 'API 키가 설정되지 않았습니다'
      };
    }

    // 경기 선수 통계 API 호출
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
        data: null,
        message: `API 응답 오류: ${response.status}`
      };
    }

    const data = await response.json();

    // 응답 검증
    if (!data?.response?.length) {
      return {
        success: false,
        data: null,
        message: '선수 통계 데이터를 찾을 수 없습니다'
      };
    }

    // 두 팀의 데이터 추출
    const homeTeamData = data.response[0];
    const awayTeamData = data.response[1];

    if (!homeTeamData || !awayTeamData) {
      return {
        success: false,
        data: null,
        message: '팀 데이터가 불완전합니다'
      };
    }

    // 홈팀 선수 데이터 변환
    const homeTeam = {
      id: homeTeamData.team.id,
      name: homeTeamData.team.name,
      logo: homeTeamData.team.logo,
      players: (homeTeamData.players || []).map((player: any) => {
        const stats = player.statistics?.[0] || {};
        return {
          playerId: player.player?.id || 0,
          playerName: player.player?.name || '',
          playerNumber: stats.games?.number,
          position: stats.games?.position,
          minutes: stats.games?.minutes ?? 0,
          rating: stats.games?.rating,
          goals: stats.goals?.total ?? 0,
          assists: stats.goals?.assists ?? 0,
          shotsTotal: stats.shots?.total ?? 0,
          shotsOn: stats.shots?.on ?? 0,
          passesTotal: stats.passes?.total ?? 0,
          passesKey: stats.passes?.key ?? 0,
          passesAccuracy: stats.passes?.accuracy ?? 0,
          dribblesAttempts: stats.dribbles?.attempts ?? 0,
          dribblesSuccess: stats.dribbles?.success ?? 0,
          duelsTotal: stats.duels?.total ?? 0,
          duelsWon: stats.duels?.won ?? 0,
          foulsCommitted: stats.fouls?.committed ?? 0,
          yellowCards: stats.cards?.yellow ?? 0,
          redCards: stats.cards?.red ?? 0,
        };
      })
    };

    // 원정팀 선수 데이터 변환
    const awayTeam = {
      id: awayTeamData.team.id,
      name: awayTeamData.team.name,
      logo: awayTeamData.team.logo,
      players: (awayTeamData.players || []).map((player: any) => {
        const stats = player.statistics?.[0] || {};
        return {
          playerId: player.player?.id || 0,
          playerName: player.player?.name || '',
          playerNumber: stats.games?.number,
          position: stats.games?.position,
          minutes: stats.games?.minutes ?? 0,
          rating: stats.games?.rating,
          goals: stats.goals?.total ?? 0,
          assists: stats.goals?.assists ?? 0,
          shotsTotal: stats.shots?.total ?? 0,
          shotsOn: stats.shots?.on ?? 0,
          passesTotal: stats.passes?.total ?? 0,
          passesKey: stats.passes?.key ?? 0,
          passesAccuracy: stats.passes?.accuracy ?? 0,
          dribblesAttempts: stats.dribbles?.attempts ?? 0,
          dribblesSuccess: stats.dribbles?.success ?? 0,
          duelsTotal: stats.duels?.total ?? 0,
          duelsWon: stats.duels?.won ?? 0,
          foulsCommitted: stats.fouls?.committed ?? 0,
          yellowCards: stats.cards?.yellow ?? 0,
          redCards: stats.cards?.red ?? 0,
        };
      })
    };

    return {
      success: true,
      data: {
        homeTeam,
        awayTeam
      },
      message: '선수 통계를 성공적으로 가져왔습니다'
    };

  } catch (error) {
    console.error('Error fetching match player stats:', error);
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    };
  }
}

export const fetchMatchPlayerStats = cache(fetchMatchPlayerStatsInternal);

