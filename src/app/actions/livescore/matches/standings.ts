'use server';

import { cache } from 'react';
import { getTeamById } from '@/app/constants';
import { getLeagueById } from '@/app/constants/league-mappings';

// 팀 정보 타입
interface StandingTeam {
  id: number;
  name: string;
  logo: string;
  name_ko?: string;  // 추가: 한국어 팀명
  name_en?: string;  // 추가: 영어 팀명
}

// 순위 정보 항목 타입
interface StandingItem {
  rank: number;
  team: StandingTeam;
  points: number;
  goalsDiff: number;
  group: string;
  form: string;
  status: string;
  description: string;
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
  home: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  away: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  update: string;
}

// 리그 정보 타입
interface StandingLeague {
  id: number;
  name: string;
  country: string;
  logo: string;
  flag: string;
  season: number;
  name_ko?: string;  // 추가: 한국어 리그명
  standings: StandingItem[][];
}

// 순위표 응답 타입 - TabContent에서 예상하는 형식으로 수정
export interface StandingsData {
  standings: {
    league: {
      id: number;
      name: string;
      logo: string;
      name_ko?: string;  // 추가: 한국어 리그명
      standings: StandingItem[][];
    };
  };
}

// 순위표 응답 타입
export interface StandingsResponse {
  success: boolean;
  response: Array<{ league: StandingLeague }>;
  message: string;
}

/**
 * 특정 경기의 리그 순위표 정보를 가져오는 서버 액션
 * @param matchId 경기 ID 또는 리그 ID
 * @param isLeagueId matchId 파라미터가 리그 ID인지 여부
 * @returns 리그 순위표 정보
 */
export async function fetchMatchStandings(
  matchId: string,
  isLeagueId: boolean = false
): Promise<StandingsData | null> {
  try {
    if (!matchId) {
      throw new Error('ID is required');
    }

    let leagueId: number | null = null;
    let season: number | null = null;

    // 리그 ID가 직접 제공된 경우
    if (isLeagueId) {
      leagueId = parseInt(matchId, 10);
      
      // 현재 날짜에 따라 시즌 결정
      const currentDate = new Date();
      // 7월 이전이면 이전 연도, 이후면 현재 연도를 시즌으로 사용
      season = currentDate.getMonth() < 6 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();
    } else {
      // 매치 ID가 제공된 경우, 먼저 경기 기본 정보를 가져와 리그 ID 및 시즌 확인
      const matchResponse = await fetch(
        `https://v3.football.api-sports.io/fixtures?id=${matchId}`,
        {
          headers: {
            'x-rapidapi-host': 'v3.football.api-sports.io',
            'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
          },
          cache: 'no-store'
        }
      );

      if (!matchResponse.ok) {
        throw new Error(`경기 정보 API 응답 오류: ${matchResponse.status}`);
      }

      const matchData = await matchResponse.json();
      
      if (!matchData?.response?.[0]?.league) {
        return null;
      }
      
      leagueId = matchData.response[0].league.id;
      season = matchData.response[0].league.season;
    }
    
    if (!leagueId || !season) {
      console.error('리그 ID 또는 시즌 정보를 찾을 수 없습니다.');
      return null;
    }
    
    console.log(`순위표 가져오기: 리그 ID=${leagueId}, 시즌=${season}`);
    
    // 리그 ID와 시즌으로 순위표 가져오기
    const standingsResponse = await fetch(
      `https://v3.football.api-sports.io/standings?league=${leagueId}&season=${season}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        cache: 'no-store'
      }
    );

    if (!standingsResponse.ok) {
      throw new Error(`순위표 API 응답 오류: ${standingsResponse.status}`);
    }

    const standingsData = await standingsResponse.json();
    
    if (!standingsData?.response || standingsData.response.length === 0) {
      console.error('순위표 데이터가 비어있습니다.');
      return null;
    }
    
    // 리그 정보에 한국어 이름 매핑
    const leagueMapping = getLeagueById(leagueId);
    const firstLeague = standingsData.response[0].league;
    
    // 각 팀에 한국어 및 영어 이름 매핑
    const enhancedStandings = firstLeague.standings.map((group: StandingItem[]) => 
      group.map((item: StandingItem) => {
        const teamMapping = getTeamById(item.team.id);
        if (teamMapping) {
          return {
            ...item,
            team: {
              ...item.team,
              name_ko: teamMapping.name_ko,
              name_en: teamMapping.name_en
            }
          };
        }
        return item;
      })
    );
    
    // TabContent에서 기대하는 형식으로 변환
    return {
      standings: {
        league: {
          id: firstLeague.id,
          name: firstLeague.name,
          logo: firstLeague.logo,
          name_ko: leagueMapping?.name_ko,
          standings: enhancedStandings
        }
      }
    };

  } catch (error) {
    console.error('순위표 정보 가져오기 오류:', error);
    return null;
  }
}

// 캐싱 적용 함수
export const fetchCachedMatchStandings = cache(fetchMatchStandings); 