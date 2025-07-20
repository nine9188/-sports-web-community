'use server';

import { cache } from 'react';
import { getTeamById } from '@/domains/livescore/constants/teams';

// 경기 정보 인터페이스
export interface Match {
  fixture: {
    id: number;
    date: string;
    status: { short: string };
  };
  league: {
    id: number;
    name: string;
    logo: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
    away: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

interface MatchesResponse {
  success: boolean;
  data?: Match[];
  message: string;
}

/**
 * 특정 팀의 최근 경기 및 예정 경기 목록을 가져오는 서버 액션
 * @param teamId 팀 ID
 * @returns 경기 목록
 */
export async function fetchTeamMatches(teamId: string): Promise<MatchesResponse> {
  try {
    if (!teamId) {
      throw new Error('팀 ID는 필수입니다');
    }
    
    // 현재 월을 기준으로 시즌 계산 (7월 기준)
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const season = currentMonth < 7 ? currentYear - 1 : currentYear;
    
    // 최근 10경기와 다음 5경기를 병렬로 가져오기
    const [lastMatchesResponse, nextMatchesResponse] = await Promise.all([
      fetch(`https://v3.football.api-sports.io/fixtures?team=${teamId}&season=${season}&last=10`, {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        cache: 'no-store'
      }),
      fetch(`https://v3.football.api-sports.io/fixtures?team=${teamId}&next=5`, {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        cache: 'no-store'
      })
    ]);
    
    if (!lastMatchesResponse.ok || !nextMatchesResponse.ok) {
      throw new Error('경기 정보를 가져오는데 실패했습니다');
    }
    
    const lastMatches = await lastMatchesResponse.json();
    const nextMatches = await nextMatchesResponse.json();
    
    // 두 결과 합치기
    const matches = [
      ...(nextMatches.response || []),
      ...(lastMatches.response || [])
    ];
    
    // 팀 매핑 정보 적용
    const mappedMatches = matches.map(match => {
      // 홈팀 매핑 적용
      if (match.teams?.home?.id) {
        const homeTeamMapping = getTeamById(match.teams.home.id);
        if (homeTeamMapping) {
          match.teams.home.name = homeTeamMapping.name_ko || match.teams.home.name;
        }
      }
      
      // 원정팀 매핑 적용
      if (match.teams?.away?.id) {
        const awayTeamMapping = getTeamById(match.teams.away.id);
        if (awayTeamMapping) {
          match.teams.away.name = awayTeamMapping.name_ko || match.teams.away.name;
        }
      }
      
      return match;
    });
    
    // 날짜 순으로 정렬 (최신 경기가 먼저 나오도록)
    const sortedMatches = mappedMatches.sort((a, b) => {
      const dateA = new Date(a.fixture.date).getTime();
      const dateB = new Date(b.fixture.date).getTime();
      return dateB - dateA;
    });
    
    return { 
      success: true,
      data: sortedMatches,
      message: '경기 데이터를 성공적으로 가져왔습니다'
    };

  } catch (error) {
    console.error('팀 경기 목록 가져오기 오류:', error);
    return { 
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// 캐싱 적용 함수
export const fetchCachedTeamMatches = cache(fetchTeamMatches); 