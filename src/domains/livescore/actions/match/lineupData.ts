'use server';

import { cache } from 'react';
import { getTeamById } from '@/domains/livescore/constants/teams';

interface Player {
  id: number;
  name: string;
  number: number;
  pos: string;
  grid: string | null;
  captain?: boolean;
  photo?: string;
}

interface Coach {
  id: number;
  name: string;
  photo: string;
}

export interface TeamLineup {
  team: {
    id: number;
    name: string;
    logo: string;
    name_ko?: string;
    name_en?: string;
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
  startXI: Array<{ player: Player }>;
  substitutes: Array<{ player: Player }>;
  coach: Coach;
}

export interface LineupsResponse {
  success: boolean;
  response: {
    home: TeamLineup;
    away: TeamLineup;
  } | null;
  message: string;
}

export async function fetchMatchLineups(matchId: string): Promise<LineupsResponse> {
  try {
    if (!matchId) {
      return {
        success: false,
        response: null,
        message: 'Match ID is required'
      };
    }

    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures/lineups?fixture=${matchId}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        cache: 'no-store'
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

    if (!data?.response || data.response.length < 2) {
      return {
        success: false,
        response: null,
        message: '라인업 데이터를 찾을 수 없습니다'
      };
    }

    const homeTeamData = data.response[0];
    const awayTeamData = data.response[1];

    // 주장 찾기 (라인업 데이터에서) - truthy 체크로 변경
    // 참고: lineup API는 captain 데이터를 제공하지 않는 경우가 많음
    // 대신 player stats API (/fixtures/players)에서 games.captain 정보 사용
    const findCaptainId = (teamData: any): number | null => {
      const captainInStartXI = teamData.startXI?.find((item: any) => item.player.captain);
      return captainInStartXI?.player.id || null;
    };

    const homeCaptainId = findCaptainId(homeTeamData);
    const awayCaptainId = findCaptainId(awayTeamData);

    // 팀 라인업 변환
    const enhanceTeamLineup = (teamData: any, captainId: number | null): TeamLineup => {
      const teamMapping = getTeamById(teamData.team.id);

      const enhancePlayer = (item: any) => ({
        player: {
          id: item.player.id,
          name: item.player.name,
          number: item.player.number,
          pos: item.player.pos,
          grid: item.player.grid || null,
          // truthy 체크로 변경 (true, 1, "true" 등 모두 처리)
          captain: Boolean(item.player.captain) || item.player.id === captainId,
          photo: `https://media.api-sports.io/football/players/${item.player.id}.png`
        }
      });

      return {
        team: {
          id: teamData.team.id,
          name: teamData.team.name,
          logo: teamData.team.logo,
          name_ko: teamMapping?.name_ko,
          name_en: teamMapping?.name_en,
          colors: teamData.team.colors || {
            player: {
              primary: '1a5f35',
              number: 'ffffff',
              border: '1a5f35'
            },
            goalkeeper: {
              primary: 'ffd700',
              number: '000000',
              border: 'ffd700'
            }
          }
        },
        formation: teamData.formation,
        startXI: teamData.startXI.map(enhancePlayer),
        substitutes: teamData.substitutes.map(enhancePlayer),
        coach: {
          id: teamData.coach.id,
          name: teamData.coach.name,
          photo: `https://media.api-sports.io/football/coachs/${teamData.coach.id}.png`
        }
      };
    };

    return {
      success: true,
      response: {
        home: enhanceTeamLineup(homeTeamData, homeCaptainId),
        away: enhanceTeamLineup(awayTeamData, awayCaptainId)
      },
      message: '라인업 데이터를 성공적으로 가져왔습니다'
    };

  } catch (error) {
    return {
      success: false,
      response: null,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export const fetchCachedMatchLineups = cache(fetchMatchLineups);
