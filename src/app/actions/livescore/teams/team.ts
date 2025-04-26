'use server';

import { cache } from 'react';
import { getTeamById } from '@/app/constants';

// 팀 정보 인터페이스
export interface TeamData {
  id: number;
  name: string;
  code?: string;
  country?: string;
  founded?: number;
  logo: string;
  venue?: {
    name: string;
    address: string;
    city: string;
    capacity: number;
    image: string;
  };
}

interface TeamInfo {
  team: TeamData;
  venue?: {
    id?: number;
    name: string;
    address: string;
    city: string;
    capacity: number;
    surface?: string;
    image: string;
  };
}

// 골 데이터 정의
interface GoalData {
  total: { 
    home: number; 
    away: number; 
    total: number;
  };
  average?: {
    home: string;
    away: string;
    total: string;
  };
  minute?: Record<string, { 
    total: number | null; 
    percentage: string | null; 
  }>;
}

// 팀 스탯 인터페이스
export interface TeamStats {
  league?: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
  };
  fixtures?: {
    played: { home: number; away: number; total: number };
    wins: { home: number; away: number; total: number };
    draws: { home: number; away: number; total: number };
    loses: { home: number; away: number; total: number };
  };
  goals?: {
    for: GoalData;
    against: GoalData;
  };
  clean_sheet?: { 
    total: number;
    home: number;
    away: number;
  };
  form?: string;
  lineups?: Array<{
    formation: string;
    played: number;
  }>;
  cards?: {
    yellow: Record<string, { total: number; percentage: string }>;
    red: Record<string, { total: number; percentage: string }>;
  };
  penalty?: {
    total: number;
    scored: { total: number; percentage: string };
    missed: { total: number; percentage: string };
  };
  failed_to_score?: {
    home: number;
    away: number;
    total: number;
  };
  biggest?: {
    streak: { wins: number; draws: number; loses: number };
    wins: { home: string; away: string };
    loses: { home: string; away: string };
  };
}

export interface TeamResponse {
  success: boolean;
  team?: TeamInfo;
  stats?: TeamStats;
  message: string;
}

/**
 * 특정 팀의 기본 정보를 가져오는 서버 액션
 * @param teamId 팀 ID
 * @returns 팀 기본 정보 및 스탯
 */
export async function fetchTeamData(teamId: string): Promise<TeamResponse> {
  try {
    if (!teamId) {
      throw new Error('팀 ID는 필수입니다');
    }

    // 팀 정보 API 요청 - API-Sports 직접 호출
    const teamResponse = await fetch(
      `https://v3.football.api-sports.io/teams?id=${teamId}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        cache: 'no-store'
      }
    );

    if (!teamResponse.ok) {
      throw new Error(`API 응답 오류: ${teamResponse.status}`);
    }

    const teamData = await teamResponse.json();
    
    if (!teamData?.response?.[0]) {
      return { 
        success: false,
        message: '팀 데이터를 찾을 수 없습니다'
      };
    }
    
    // 팀 정보와 스탯 데이터 병합
    const teamInfo = teamData.response[0] as TeamInfo;
    
    // API에서 팀 스탯 가져오기 (현재 시즌)
    const currentYear = new Date().getFullYear();
    const currentSeason = new Date().getMonth() > 6 ? currentYear : currentYear - 1;
    
    const statsResponse = await fetch(
      `https://v3.football.api-sports.io/teams/statistics?team=${teamId}&season=${currentSeason}&league=39`, // Premier League 기본값
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        cache: 'no-store'
      }
    );
    
    let statsData = null;
    
    if (statsResponse.ok) {
      const statsResult = await statsResponse.json();
      if (statsResult?.response) {
        statsData = statsResult.response as TeamStats;
      }
    }
    
    // 팀 매핑 정보 적용
    const teamMapping = getTeamById(Number(teamId));
    if (teamMapping && teamInfo.team) {
      teamInfo.team.name = teamMapping.name_ko || teamInfo.team.name;
    }
    
    return { 
      success: true,
      team: teamInfo,
      stats: statsData || {},
      message: '팀 데이터를 성공적으로 가져왔습니다'
    };

  } catch (error) {
    console.error('팀 정보 가져오기 오류:', error);
    return { 
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// 캐싱 적용 함수
export const fetchCachedTeamData = cache(fetchTeamData); 