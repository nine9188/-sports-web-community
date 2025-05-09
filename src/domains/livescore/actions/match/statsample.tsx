'use server';

import { cache } from 'react';

// 통계 타입 정의
interface StatisticItem {
  type: string;
  value: string | number | null;
}

export interface TeamStats {
  team: {
    id: number;
    name: string;
    logo: string;
  };
  statistics: StatisticItem[];
}

// 통계 응답 인터페이스
export interface StatsResponse {
  success: boolean;
  response: TeamStats[];
  message: string;
}

/**
 * 특정 경기의 통계 정보를 가져오는 서버 액션
 * @param matchId 경기 ID
 * @returns 경기 통계 정보
 */
export async function fetchMatchStats(matchId: string): Promise<StatsResponse> {
  try {
    if (!matchId) {
      throw new Error('Match ID is required');
    }

    // API 요청 - API-Sports 직접 호출
    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures/statistics?fixture=${matchId}`,
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
    
    if (!data?.response || data.response.length === 0) {
      return { 
        success: false,
        response: [],
        message: '통계 데이터를 찾을 수 없습니다'
      };
    }
    
    return { 
      success: true,
      response: data.response as TeamStats[],
      message: '통계 데이터를 성공적으로 가져왔습니다'
    };

  } catch (error) {
    console.error('통계 정보 가져오기 오류:', error);
    return { 
      success: false,
      response: [],
      message: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
}

// 캐싱 적용 함수
export const fetchCachedMatchStats = cache(fetchMatchStats); 