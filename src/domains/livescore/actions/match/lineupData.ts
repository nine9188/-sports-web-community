'use server';

import { cache } from 'react';
import { getTeamById } from '@/domains/livescore/constants/teams';


// 선수 타입 정의
interface Player {
  id: number;
  name: string;
  number: number;
  pos: string;
  grid: string | null;
  captain?: boolean;
  photo?: string;
}

// 감독 타입 정의
interface Coach {
  id: number;
  name: string;
  photo: string;
}

// 팀 라인업 타입 정의
export interface TeamLineup {
  team: {
    id: number;
    name: string;
    logo: string;
    name_ko?: string;  // 추가: 한국어 팀명
    name_en?: string;  // 추가: 영어 팀명
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
    player: Player;
  }>;
  substitutes: Array<{
    player: Player;
  }>;
  coach: Coach;
}

// 라인업 응답 타입 정의
export interface LineupsResponse {
  success: boolean;
  response: {
    home: TeamLineup;
    away: TeamLineup;
  } | null;
  message: string;
}

// API 응답의 팀 데이터 타입 정의
interface ApiTeamData {
  team: {
    id: number;
    name: string;
    logo: string;
    colors?: {
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
      grid?: string | null;
      captain?: boolean;
    }
  }>;
  substitutes: Array<{
    player: {
      id: number;
      name: string;
      number: number;
      pos: string;
      grid?: string | null;
      captain?: boolean;
    }
  }>;
  coach: {
    id: number;
    name: string;
    photo?: string;
  };
}

// 경기 세부 정보 관련 타입 정의
interface MatchPlayerStatistics {
  statistics: Array<{
    games?: {
      minutes?: number;
      number?: number;
      position?: string;
      rating?: string;
      captain?: boolean;
      substitute?: boolean;
    }
  }>;
  player: {
    id: number;
    name: string;
  };
}

interface MatchTeamPlayers {
  team: {
    id: number;
    name: string;
    logo: string;
  };
  players: MatchPlayerStatistics[];
}

/**
 * 특정 경기의 라인업 정보를 가져오는 서버 액션
 * @param matchId 경기 ID
 * @returns 양 팀의 라인업 정보
 */
export async function fetchMatchLineups(matchId: string): Promise<LineupsResponse> {
  try {
    if (!matchId) {
      throw new Error('Match ID is required');
    }

    // API 요청 - API-Sports 직접 호출
    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures/lineups?fixture=${matchId}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        // 실시간 데이터를 위해 캐싱 방지
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      throw new Error(`API 응답 오류: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data?.response || data.response.length < 2) {
      return { 
        success: false,
        response: null,
        message: '라인업 데이터를 찾을 수 없습니다'
      };
    }
    
    // 홈팀과 원정팀 라인업을 구조화하고 이미지 URL을 명시적으로 추가
    const homeTeamData = data.response[0] as ApiTeamData;
    const awayTeamData = data.response[1] as ApiTeamData;
    
    // 추가적인 경기 데이터를 통해 주장 정보 확인 시도
    let homeCaptainId: number | null = null;
    let awayCaptainId: number | null = null;
    
    try {
      // 경기 상세 정보에서 주장 확인 시도
      const matchDetailsResponse = await fetch(
        `https://v3.football.api-sports.io/fixtures?id=${matchId}`,
        {
          headers: {
            'x-rapidapi-host': 'v3.football.api-sports.io',
            'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
          },
          cache: 'no-store'
        }
      );
      
      if (matchDetailsResponse.ok) {
        const matchDetails = await matchDetailsResponse.json();
        if (matchDetails?.response?.[0]?.players) {
          const players = matchDetails.response[0].players;
          
          // 홈팀 ID와 원정팀 ID
          const homeTeamId = homeTeamData.team.id;
          const awayTeamId = awayTeamData.team.id;
          
          // 홈팀 주장 찾기
          const homeTeamPlayers = players.find((p: MatchTeamPlayers) => p.team.id === homeTeamId);
          if (homeTeamPlayers) {
            const homeCaptain = homeTeamPlayers.players?.find(
              (p: MatchPlayerStatistics) => p.statistics?.[0]?.games?.captain === true
            );
            if (homeCaptain) {
              homeCaptainId = homeCaptain.player.id;
            }
          }
          
          // 원정팀 주장 찾기
          const awayTeamPlayers = players.find((p: MatchTeamPlayers) => p.team.id === awayTeamId);
          if (awayTeamPlayers) {
            const awayCaptain = awayTeamPlayers.players?.find(
              (p: MatchPlayerStatistics) => p.statistics?.[0]?.games?.captain === true
            );
            if (awayCaptain) {
              awayCaptainId = awayCaptain.player.id;
            }
          }
        }
      }
    } catch {
      // 오류가 발생해도 계속 진행
    }
    
    // 라인업 데이터에서 직접 주장 확인 (backup)
    if (!homeCaptainId) {
      // 선발 라인업에서 캡틴 찾기
      const captainInStartXI = homeTeamData.startXI.find(item => 
        item.player.captain === true
      );
      
      if (captainInStartXI) {
        homeCaptainId = captainInStartXI.player.id;
      }
    }
    
    if (!awayCaptainId) {
      // 선발 라인업에서 캡틴 찾기
      const captainInStartXI = awayTeamData.startXI.find(item => 
        item.player.captain === true
      );
      
      if (captainInStartXI) {
        awayCaptainId = captainInStartXI.player.id;
      }
    }
    
    // API 응답 강화하여 이미지 URL 추가 및 팀 매핑 적용
    const enhanceTeamLineup = (teamData: ApiTeamData, captainId: number | null): TeamLineup => {
      // 팀 매핑 정보 가져오기
      const teamMapping = getTeamById(teamData.team.id);
      
      return {
        team: {
          id: teamData.team.id,
          name: teamData.team.name,
          logo: teamData.team.logo,
          // 한국어, 영어 팀명 추가
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
        startXI: teamData.startXI.map((item) => {
          // API에서 가져온 captain 정보와 찾은 captainId 둘 다 사용하여 명확히 처리
          // captainId가 있으면 해당 ID와 일치하는 선수를 주장으로 설정
          const apiCaptain = item.player.captain === true;
          const isIdCaptain = captainId ? item.player.id === captainId : false;
          const isCaptain = apiCaptain || isIdCaptain;
          
          return {
            player: {
              id: item.player.id,
              name: item.player.name,
              number: item.player.number,
              pos: item.player.pos,
              grid: item.player.grid || null,
              captain: isCaptain,
              photo: `https://media.api-sports.io/football/players/${item.player.id}.png`
            }
          };
        }),
        substitutes: teamData.substitutes.map((item) => {
          // API에서 가져온 captain 정보와 찾은 captainId 둘 다 사용하여 명확히 처리
          // captainId가 있으면 해당 ID와 일치하는 선수를 주장으로 설정
          const apiCaptain = item.player.captain === true;
          const isIdCaptain = captainId ? item.player.id === captainId : false;
          const isCaptain = apiCaptain || isIdCaptain;
          
          return {
            player: {
              id: item.player.id,
              name: item.player.name,
              number: item.player.number,
              pos: item.player.pos,
              grid: item.player.grid || null,
              captain: isCaptain,
              photo: `https://media.api-sports.io/football/players/${item.player.id}.png`
            }
          };
        }),
        coach: {
          id: teamData.coach.id,
          name: teamData.coach.name,
          photo: `https://media.api-sports.io/football/coachs/${teamData.coach.id}.png`
        }
      };
    };
    
    const enhancedHomeTeam = enhanceTeamLineup(homeTeamData, homeCaptainId);
    const enhancedAwayTeam = enhanceTeamLineup(awayTeamData, awayCaptainId);
    
    return { 
      success: true,
      response: {
        home: enhancedHomeTeam,
        away: enhancedAwayTeam
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

/**
 * 캐싱을 적용한 라인업 정보 가져오기
 * 참고: 실시간 데이터이기 때문에 실제로는 캐싱이 적용되지 않습니다.
 */
export const fetchCachedMatchLineups = cache(fetchMatchLineups); 