'use server';

import { cache } from 'react';
import { getTeamById } from '@/domains/livescore/constants/teams';
import { getLeagueById } from '@/domains/livescore/constants/league-mappings';

// 선수 타입 정의
interface Player {
  id: number;
  name: string;
  number: number;
  pos: string;
  grid: string;
  captain?: boolean;
  photo?: string;
}

// 매치 데이터 인터페이스
export interface MatchData {
  fixture: {
    id: number;
    referee?: string;
    timezone?: string;
    date: string;
    timestamp: number;
    periods?: {
      first?: number;
      second?: number;
    };
    venue?: {
      id?: number;
      name?: string;
      city?: string;
    };
    status: {
      long: string;
      short: string;
      elapsed: number | null;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    name_ko?: string;  // 추가: 한국어 리그명
    season?: number;
    round?: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
      name_ko?: string;  // 추가: 한국어 팀명
      name_en?: string;  // 추가: 영어 팀명
      winner: boolean | null;
    };
    away: {
      id: number;
      name: string;
      logo: string;
      name_ko?: string;  // 추가: 한국어 팀명
      name_en?: string;  // 추가: 영어 팀명
      winner: boolean | null;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime: {
      home: number | null;
      away: number | null;
    };
    fulltime: {
      home: number | null;
      away: number | null;
    };
    extratime?: {
      home: number | null;
      away: number | null;
    };
    penalty?: {
      home: number | null;
      away: number | null;
    };
  };
  lineups?: Array<{
    team: {
      id: number;
      name: string;
      logo: string;
      name_ko?: string;  // 추가: 한국어 팀명
      name_en?: string;  // 추가: 영어 팀명
    };
    formation: string;
    startXI: Array<{
      player: Player;
    }>;
    substitutes: Array<{
      player: Player;
    }>;
    coach: {
      id: number;
      name: string;
      photo?: string;
    };
  }>;
}

// 매치 데이터 응답 인터페이스
export interface MatchResponse {
  success: boolean;
  data?: MatchData;
  message?: string;
  error?: string;
}

/**
 * 특정 경기의 기본 정보를 가져오는 서버 액션
 * @param matchId 경기 ID
 * @returns 경기 기본 정보 및 상태
 */
export async function fetchMatchData(matchId: string): Promise<MatchResponse> {
  try {
    if (!matchId) {
      throw new Error('Match ID is required');
    }

    // API 요청 - API-Sports 직접 호출
    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures?id=${matchId}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      throw new Error(`API 응답 오류: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data?.response?.[0]) {
      return { 
        success: false,
        error: '경기 데이터를 찾을 수 없습니다'
      };
    }
    
    // 경기 데이터에 팀, 리그 매핑 정보 추가
    const matchData = data.response[0] as MatchData;
    
    // 리그 매핑 적용
    if (matchData.league?.id) {
      const leagueMapping = getLeagueById(matchData.league.id);
      if (leagueMapping) {
        matchData.league.name_ko = leagueMapping.nameKo;
      }
    }
    
    // 홈팀 매핑 적용
    if (matchData.teams?.home?.id) {
      const homeTeamMapping = getTeamById(matchData.teams.home.id);
      if (homeTeamMapping) {
        matchData.teams.home.name_ko = homeTeamMapping.name_ko;
        matchData.teams.home.name_en = homeTeamMapping.name_en;
      }
    }
    
    // 원정팀 매핑 적용
    if (matchData.teams?.away?.id) {
      const awayTeamMapping = getTeamById(matchData.teams.away.id);
      if (awayTeamMapping) {
        matchData.teams.away.name_ko = awayTeamMapping.name_ko;
        matchData.teams.away.name_en = awayTeamMapping.name_en;
      }
    }
    
    // 라인업이 있는 경우 팀 매핑 적용
    if (matchData.lineups && matchData.lineups.length > 0) {
      matchData.lineups = matchData.lineups.map(lineup => {
        const teamMapping = getTeamById(lineup.team.id);
        if (teamMapping) {
          return {
            ...lineup,
            team: {
              ...lineup.team,
              name_ko: teamMapping.name_ko,
              name_en: teamMapping.name_en
            }
          };
        }
        return lineup;
      });
    }
    
    return { 
      success: true,
      data: matchData,
      message: '경기 데이터를 성공적으로 가져왔습니다'
    };

  } catch (error) {
    console.error('경기 기본 정보 가져오기 오류:', error);
    return { 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// 캐싱 적용 함수
export const fetchCachedMatchData = cache(fetchMatchData); 