'use server';

import { createClient } from '../../../lib/supabase.server';

export interface TeamData {
  id: number;
  name: string;
  code?: string;
  country?: string;
  founded?: number;
  national?: boolean;
  logo?: string;
}

export interface VenueData {
  id?: number;
  name?: string;
  address?: string;
  city?: string;
  capacity?: number;
  surface?: string;
  image?: string;
}

export interface TeamStats {
  league?: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
  };
  team?: {
    id: number;
    name: string;
    logo: string;
  };
  form?: string;
  fixtures?: {
    played: { home: number; away: number; total: number };
    wins: { home: number; away: number; total: number };
    draws: { home: number; away: number; total: number };
    loses: { home: number; away: number; total: number };
  };
}

export interface TeamResponse {
  success: boolean;
  team: {
    team: TeamData;
    venue: VenueData;
  };
  stats?: TeamStats;
  message?: string;
}

/**
 * Supabase에서 팀 정보를 가져오는 서버 액션
 */
export async function getTeamById(teamId: string): Promise<TeamResponse> {
  try {
    // Supabase 클라이언트 생성
    const supabase = await createClient();

    // 팀 기본 정보 조회
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', parseInt(teamId))
      .single();

    if (teamError) {
      console.error('팀 정보 조회 오류:', teamError);
      throw new Error('팀 정보를 가져오는데 실패했습니다.');
    }

    if (!teamData) {
      throw new Error('존재하지 않는 팀입니다.');
    }

    // 팀 정보를 응답 형식에 맞게 변환
    const team: TeamData = {
      id: teamData.id,
      name: teamData.name,
      country: teamData.country,
      founded: teamData.founded,
      logo: teamData.logo,
      code: teamData.code || undefined,
    };

    // 경기장 정보 구성
    // API 실제 응답과 동일한 형식으로 변환
    const venue: VenueData = {
      id: teamData.venue_id || team.id,
      name: teamData.venue_name || "Unknown Stadium",
      address: teamData.venue_address || "",
      city: teamData.venue_city || "",
      capacity: teamData.venue_capacity || 0,
      surface: "grass", // 기본값
      image: `https://media.api-sports.io/football/venues/${teamData.venue_id}.png`,
    };

    return {
      success: true,
      team: {
        team,
        venue,
      },
      message: '팀 정보를 성공적으로 가져왔습니다'
    };
  } catch (error) {
    console.error('팀 정보 조회 중 오류 발생:', error);
    return {
      success: false,
      team: {
        team: {} as TeamData,
        venue: {} as VenueData
      },
      message: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
}

/**
 * API-Sports에서 직접 팀 정보를 가져오는 서버 액션
 */
export async function getTeamFromAPI(teamId: string): Promise<TeamResponse> {
  try {
    // API 키 확인
    const apiKey = process.env.FOOTBALL_API_KEY;
    if (!apiKey) {
      throw new Error('API 키가 설정되지 않았습니다');
    }

    // API-Sports에서 팀 정보 가져오기
    const response = await fetch(
      `https://v3.football.api-sports.io/teams?id=${teamId}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': apiKey,
        },
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      throw new Error(`API 응답 오류: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data?.response || data.response.length === 0) {
      throw new Error('팀 정보를 찾을 수 없습니다');
    }

    const teamData = data.response[0];
    
    // 팀 정보와 경기장 정보 구성
    const team: TeamData = {
      id: teamData.team.id,
      name: teamData.team.name,
      country: teamData.team.country,
      founded: teamData.team.founded,
      logo: teamData.team.logo,
      code: teamData.team.code || undefined,
      national: teamData.team.national,
    };

    const venue: VenueData = {
      id: teamData.venue?.id,
      name: teamData.venue?.name,
      address: teamData.venue?.address,
      city: teamData.venue?.city,
      capacity: teamData.venue?.capacity,
      surface: teamData.venue?.surface,
      image: teamData.venue?.id 
        ? `https://media.api-sports.io/football/venues/${teamData.venue.id}.png`
        : undefined,
    };

    return {
      success: true,
      team: {
        team,
        venue,
      },
      message: '팀 정보를 성공적으로 가져왔습니다'
    };
  } catch (error) {
    console.error('API에서 팀 정보 가져오기 오류:', error);
    return {
      success: false,
      team: {
        team: {} as TeamData,
        venue: {} as VenueData
      },
      message: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
}