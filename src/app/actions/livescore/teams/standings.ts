'use server';

import { cache } from 'react';
import { getTeamById } from '@/app/constants';

// API 응답에 나타나는 리그 정보 인터페이스
interface LeagueInfo {
  id: number;
  name: string;
  type: string;
  logo: string;
  country?: string;
  flag?: string;
  season?: number;
}

// API 응답에 나타나는 팀 정보 인터페이스
interface TeamInfo {
  id: number;
  name: string;
  logo: string;
}

// API 응답에 나타나는 스탠딩 항목 인터페이스
interface StandingItem {
  rank: number;
  team: TeamInfo;
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
  goalsDiff: number;
  points: number;
  form: string;
  description?: string;
}

// 스탠딩 정보 인터페이스
export interface Standing {
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
    type?: string;
    standings: StandingItem[][];
  };
}

interface StandingsResponse {
  success: boolean;
  data?: Standing[];
  message: string;
}

// API 응답 인터페이스
interface ApiLeagueResponse {
  league: LeagueInfo;
  country?: {
    name: string;
    code: string;
    flag: string;
  };
  seasons?: Array<{
    year: number;
    start: string;
    end: string;
    current: boolean;
  }>;
}

/**
 * 특정 팀이 속한 리그의 순위표 정보를 가져오는 서버 액션
 * @param teamId 팀 ID
 * @returns 리그 순위표 정보
 */
export async function fetchTeamStandings(teamId: string): Promise<StandingsResponse> {
  try {
    if (!teamId) {
      throw new Error('팀 ID는 필수입니다');
    }

    // 현재 날짜가 7월 이전이면 이전 연도, 이후면 현재 연도를 시즌으로 사용
    const currentDate = new Date();
    const season = currentDate.getMonth() < 6 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();

    // 팀의 리그 정보를 가져옵니다
    const leaguesResponse = await fetch(
      `https://v3.football.api-sports.io/leagues?team=${teamId}&season=${season}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        cache: 'no-store'
      }
    );

    const leaguesData = await leaguesResponse.json();

    // 모든 관련 리그 찾기
    const relevantLeagues = leaguesData.response?.filter((league: ApiLeagueResponse) => {
      // 리그 타입이나 이름으로 필터링
      const isRelevant = (
        league.league.type === 'League' || // 정규 리그
        league.league.type === 'Cup' ||    // 국내 컵 대회
        league.league.name.includes('Champions') || // 챔피언스리그
        league.league.name.includes('Europa') ||    // 유로파리그
        league.league.name.includes('League Cup') || // 리그컵(카라바오컵)
        league.league.name.includes('FA Cup')       // FA컵
      ) && 
      !league.league.name.includes('Qualification') && // 예선 제외
      !league.league.name.includes('Friendlies');     // 친선경기 제외

      return isRelevant;
    }) || [];

    // 각 리그의 순위 정보를 가져옵니다
    const standingsPromises = relevantLeagues.map(async (league: ApiLeagueResponse) => {
      const standingsResponse = await fetch(
        `https://v3.football.api-sports.io/standings?league=${league.league.id}&season=${season}`,
        {
          headers: {
            'x-rapidapi-host': 'v3.football.api-sports.io',
            'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
          },
          cache: 'no-store'
        }
      );

      if (!standingsResponse.ok) {
        return null;
      }

      const standingsData = await standingsResponse.json();
      
      // 유효한 순위 데이터가 있는 경우만 반환
      if (standingsData.response?.[0]?.league?.standings) {
        // 팀 이름을 한국어로 변환
        standingsData.response[0].league.standings.forEach((standingGroup: StandingItem[]) => {
          if (Array.isArray(standingGroup)) {
            standingGroup.forEach((item: StandingItem) => {
              const teamMapping = getTeamById(item.team.id);
              if (teamMapping) {
                item.team.name = teamMapping.name_ko || item.team.name;
              }
            });
          }
        });
        
        return standingsData.response[0];
      }
      return null;
    });

    const allStandings = (await Promise.all(standingsPromises))
      .filter(standing => standing !== null);

    // 메인 리그를 먼저 정렬하고, 그 다음에 컵 대회 순으로 정렬
    allStandings.sort((a, b) => {
      if (!a || !b) return 0;
      const aIsMainLeague = a.league.type === 'League' && 
        !a.league.name.includes('Champions') && 
        !a.league.name.includes('Europa');
      const bIsMainLeague = b.league.type === 'League' && 
        !b.league.name.includes('Champions') && 
        !b.league.name.includes('Europa');

      if (aIsMainLeague && !bIsMainLeague) return -1;
      if (!aIsMainLeague && bIsMainLeague) return 1;
      return 0;
    });
    
    if (allStandings.length === 0) {
      return { 
        success: false,
        message: '순위표 데이터를 찾을 수 없습니다'
      };
    }
    
    return { 
      success: true,
      data: allStandings as Standing[],
      message: '순위표 데이터를 성공적으로 가져왔습니다'
    };

  } catch (error) {
    return { 
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// 캐싱 적용 함수
export const fetchCachedTeamStandings = cache(fetchTeamStandings); 