'use server';

import { cache } from 'react';
import { getLeagueById } from '../../constants/league-mappings';

// 순위 데이터 응답 타입 정의
export interface StandingsDataResponse {
  success: boolean;
  data?: {
    league?: {
      id?: number;
      name?: string;
      country?: string;
      logo?: string;
      flag?: string;
      season?: number;
      name_ko?: string;
      standings?: Array<Array<{
        rank?: number;
        team?: {
          id?: number;
          name?: string;
          logo?: string;
        };
        points?: number;
        goalsDiff?: number;
        form?: string;
        description?: string;
        all?: {
          played?: number;
          win?: number;
          draw?: number;
          lose?: number;
          goals?: {
            for?: number;
            against?: number;
          };
        };
      }>>;
    };
  };
  error?: string;
}

// 현재 시즌 구하기
function getCurrentSeason() {
  const now = new Date();
  const month = now.getMonth() + 1; // 0-11이므로 1 더하기
  const year = now.getFullYear();
  
  // 7월 이전이면 (시즌이 끝나가는 중) 현재 년도 - 1을 사용
  // 7월 이후면 (새 시즌이 시작) 현재 년도를 사용
  return month < 7 ? year - 1 : year;
}

/**
 * 특정 리그의 순위 데이터를 가져오는 서버 액션
 * @param leagueId 리그 ID
 * @param season 시즌 (옵션, 없으면 현재 시즌 사용)
 * @returns 리그 순위 데이터 및 상태
 */
export async function fetchLeagueStandings(leagueId: number, season?: number): Promise<StandingsDataResponse> {
  try {
    // 시즌이 제공되지 않으면 현재 시즌 계산
    const targetSeason = season || getCurrentSeason();

    if (!leagueId) {
      throw new Error('리그 ID가 필요합니다');
    }

    // API 요청
    const response = await fetch(
      `https://v3.football.api-sports.io/standings?league=${leagueId}&season=${targetSeason}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        // 실시간 데이터를 위해 캐싱 방지
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      throw new Error(`API 응답 오류: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.response || data.response.length === 0) {
      return {
        success: false,
        error: '순위 데이터를 찾을 수 없습니다.'
      };
    }
    
    // 한국어 리그 이름 추가
    if (data.response[0]?.league?.id) {
      const leagueInfo = getLeagueById(data.response[0].league.id);
      if (leagueInfo) {
        data.response[0].league.name_ko = leagueInfo.nameKo;
      }
    }
    
    return {
      success: true,
      data: data.response[0]
    };
  } catch (error) {
    console.error('순위 데이터 로딩 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '순위 데이터를 불러오는 중 오류가 발생했습니다.'
    };
  }
}

// 캐싱을 적용한 순위 데이터 가져오기
export const fetchCachedLeagueStandings = cache(fetchLeagueStandings); 