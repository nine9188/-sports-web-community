'use server';

import { cache } from 'react';

// 선수 통계 인터페이스
export interface PlayerStats {
  appearances: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
}

interface PlayerStatsResponse {
  success: boolean;
  data?: Record<number, PlayerStats>;
  message: string;
}

// API 응답 타입 정의
interface ApiPlayerData {
  player: {
    id: number;
    name: string;
  };
  statistics: Array<{
    games?: {
      appearences?: number;
    };
    goals?: {
      total?: number;
      assists?: number;
    };
    cards?: {
      yellow?: number;
      red?: number;
    };
  }>;
}

/**
 * 팀의 선수 통계 정보를 가져오는 서버 액션
 * @param teamId 팀 ID
 * @param league 리그 ID (기본값: 프리미어리그)
 * @returns 선수별 통계 정보
 */
export async function fetchTeamPlayerStats(teamId: string, league: string = '39'): Promise<PlayerStatsResponse> {
  try {
    if (!teamId) {
      throw new Error('팀 ID는 필수입니다');
    }

    // 현재 시즌 계산
    const currentYear = new Date().getFullYear();
    const season = new Date().getMonth() > 6 ? currentYear : currentYear - 1;


    // 여러 페이지의 데이터를 저장할 배열
    const allPlayerData: ApiPlayerData[] = [];
    let page = 1;
    let hasMorePages = true;

    // API가 페이지네이션되어 있으므로 모든 페이지 데이터 가져오기
    while (hasMorePages && page <= 5) { // 최대 5페이지까지만 (무한루프 방지)
      // 선수 통계 정보 가져오기
      const statsResponse = await fetch(
        `https://v3.football.api-sports.io/players?team=${teamId}&season=${season}&league=${league}&page=${page}`,
        {
          headers: {
            'x-rapidapi-host': 'v3.football.api-sports.io',
            'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
          },
          cache: 'no-store'
        }
      );

      if (!statsResponse.ok) {
        throw new Error(`API 응답 오류: ${statsResponse.status}`);
      }

      const statsData = await statsResponse.json();
      
      // 현재 페이지 데이터 추가
      if (statsData?.response?.length > 0) {
        allPlayerData.push(...statsData.response);
        
        // paging 정보 확인
        const totalPages = statsData.paging?.total || 1;
        if (page >= totalPages) {
          hasMorePages = false;
        } else {
          page++;
        }
      } else {
        hasMorePages = false;
      }
    }
    
    if (allPlayerData.length === 0) {
      return { 
        success: false,
        message: '선수 통계 데이터를 찾을 수 없습니다'
      };
    }
    
    
    // 선수별 통계 데이터 매핑
    const playerStats: Record<number, PlayerStats> = {};
    
    allPlayerData.forEach((playerData: ApiPlayerData) => {
      if (playerData.player && playerData.statistics && playerData.statistics.length > 0) {
        const player = playerData.player;
        const stats = playerData.statistics[0]; // 첫 번째 리그 통계 사용
        
        playerStats[player.id] = {
          appearances: stats.games?.appearences || 0,
          goals: stats.goals?.total || 0,
          assists: stats.goals?.assists || 0,
          yellowCards: stats.cards?.yellow || 0,
          redCards: stats.cards?.red || 0
        };
      }
    });
    
    
    return { 
      success: true,
      data: playerStats,
      message: '선수 통계 데이터를 성공적으로 가져왔습니다'
    };

  } catch (error) {
    console.error('선수 통계 정보 가져오기 오류:', error);
    return { 
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// 캐싱 적용 함수
export const fetchCachedTeamPlayerStats = cache(fetchTeamPlayerStats); 