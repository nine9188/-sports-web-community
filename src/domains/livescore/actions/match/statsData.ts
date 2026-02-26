'use server';

import { cache } from 'react';
import { getTeamById } from '@/domains/livescore/constants/teams';
import { fetchFromFootballApi } from '@/domains/livescore/actions/footballApi';

// 통계 항목 타입 정의
export interface StatisticItem {
  type: string;
  value: string | number | null;
}

// 팀 통계 타입 정의
export interface TeamStats {
  team: {
    id: number;
    name: string;
    logo: string;
    name_ko?: string;
    name_en?: string;
  };
  statistics: StatisticItem[];
}

// 통계 응답 인터페이스
export interface StatsResponse {
  success: boolean;
  response: TeamStats[];
  data?: TeamStats[]; // matchData.ts에서 사용하는 키
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
      throw new Error('경기 ID가 필요합니다');
    }

    // API 요청 - fetchFromFootballApi 사용
    const data = await fetchFromFootballApi('fixtures/statistics', { fixture: matchId });
    
    if (!data?.response || data.response.length === 0) {
      return { 
        success: false,
        response: [],
        data: [],
        message: '통계 데이터를 찾을 수 없습니다'
      };
    }
    
    // 팀 정보 보강 (한국어/영어 이름 추가)
    const enhancedResponse = data.response.map((teamStats: TeamStats) => {
      if (teamStats.team && teamStats.team.id) {
        const teamMapping = getTeamById(teamStats.team.id);
        if (teamMapping) {
          return {
            ...teamStats,
            team: {
              ...teamStats.team,
              name_ko: teamMapping.name_ko,
              name_en: teamMapping.name_en
            }
          };
        }
      }
      return teamStats;
    });
    
    return { 
      success: true,
      response: enhancedResponse,
      data: enhancedResponse, // matchData.ts와의 호환성을 위해 추가
      message: '통계 데이터를 성공적으로 가져왔습니다'
    };

  } catch (error) {
    console.error('통계 정보 가져오기 오류:', error);
    return { 
      success: false,
      response: [],
      data: [],
      message: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
}

/**
 * 캐싱을 적용한 경기 통계 정보 가져오기
 * 참고: 실시간 데이터이기 때문에 실제로는 캐싱이 제한적으로 적용됩니다.
 */
export const fetchCachedMatchStats = cache(fetchMatchStats);
