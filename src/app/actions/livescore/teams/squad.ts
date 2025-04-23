'use server';

import { cache } from 'react';

// 선수 정보 인터페이스
export interface Player {
  id: number;
  name: string;
  age: number;
  number?: number;
  position: string;
  photo: string;
}

// 코치 정보 인터페이스
export interface Coach {
  id: number;
  name: string;
  age: number;
  photo: string;
  position: 'Coach';
}

interface SquadResponse {
  success: boolean;
  data?: (Player | Coach)[];
  message: string;
}

// 원본 API 응답의 선수 타입 정의
interface ApiPlayer {
  id: number;
  name: string;
  age: number;
  number?: number;
  position: string;
  photo: string;
}

/**
 * 특정 팀의 스쿼드(선수단) 정보를 가져오는 서버 액션
 * @param teamId 팀 ID
 * @returns 선수단 정보
 */
export async function fetchTeamSquad(teamId: string): Promise<SquadResponse> {
  try {
    if (!teamId) {
      throw new Error('팀 ID는 필수입니다');
    }

    // 팀 스쿼드 정보 가져오기
    const squadResponse = await fetch(
      `https://v3.football.api-sports.io/players/squads?team=${teamId}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        cache: 'no-store'
      }
    );

    if (!squadResponse.ok) {
      throw new Error(`API 응답 오류: ${squadResponse.status}`);
    }

    const squadData = await squadResponse.json();
    
    if (!squadData?.response?.[0]?.players) {
      return { 
        success: false,
        message: '스쿼드 데이터를 찾을 수 없습니다'
      };
    }
    
    // 선수 정보 매핑
    const players: Player[] = squadData.response[0].players.map((player: ApiPlayer) => ({
      id: player.id,
      name: player.name,
      age: player.age,
      number: player.number,
      position: player.position,
      photo: player.photo
    }));
    
    // 코치 정보 가져오기
    const coachResponse = await fetch(
      `https://v3.football.api-sports.io/coachs?team=${teamId}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        cache: 'no-store'
      }
    );
    
    let coach: Coach | null = null;
    
    if (coachResponse.ok) {
      const coachData = await coachResponse.json();
      
      if (coachData?.response?.[0]) {
        coach = {
          id: coachData.response[0].id,
          name: coachData.response[0].name,
          age: coachData.response[0].age,
          photo: coachData.response[0].photo,
          position: 'Coach'
        };
      }
    }
    
    // 코치 정보와 선수 정보 합치기
    const squad: (Player | Coach)[] = coach ? [coach, ...players] : players;
    
    return { 
      success: true,
      data: squad,
      message: '스쿼드 데이터를 성공적으로 가져왔습니다'
    };

  } catch (error) {
    console.error('스쿼드 정보 가져오기 오류:', error);
    return { 
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// 캐싱 적용 함수
export const fetchCachedTeamSquad = cache(fetchTeamSquad); 