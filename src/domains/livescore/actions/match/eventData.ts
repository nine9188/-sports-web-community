'use server';

import { cache } from 'react';
import { MatchEvent } from '../../types/match';
import { getTeamsByIds } from '@/domains/livescore/actions/teamLeagueData';
import { fetchFromFootballApi } from '@/domains/livescore/actions/footballApi';

// 이벤트 데이터 응답 타입 정의
export interface EventDataResponse {
  success: boolean;
  data?: MatchEvent[];
  error?: string;
}

// API 응답 이벤트 타입 정의
interface ApiEvent {
  time: {
    elapsed: number;
    extra?: number;
  };
  team: {
    id: number;
    name: string;
    logo: string;
  };
  player: {
    id: number;
    name: string;
  };
  assist?: {
    id: number;
    name: string;
  };
  type: string;
  detail: string;
  comments?: string;
}

/**
 * 특정 경기의 이벤트 데이터를 가져오는 서버 액션
 * @param matchId 경기 ID
 * @returns 경기 이벤트 데이터 및 상태
 */
export async function fetchMatchEvents(matchId: string): Promise<EventDataResponse> {
  try {
    if (!matchId) {
      throw new Error('Match ID is required');
    }

    // API 요청
    const data = await fetchFromFootballApi('fixtures/events', { fixture: matchId });
    let events = Array.isArray(data.response) ? data.response : [];

    // 팀 데이터 일괄 조회 후 매핑
    const teamIds = Array.from(
      new Set(events.map((e: ApiEvent) => e.team?.id).filter((id): id is number => typeof id === 'number'))
    );
    const teamMap = await getTeamsByIds(teamIds);

    events = events.map((event: ApiEvent) => {
      if (event.team && event.team.id) {
        const teamMapping = teamMap[event.team.id];
        if (teamMapping) {
          return {
            ...event,
            team: {
              ...event.team,
              name_ko: teamMapping.name_ko,
              name_en: teamMapping.name_en
            }
          };
        }
      }
      return event;
    });
    
    return { 
      success: true,
      data: events
    };

  } catch (error) {
    console.error('경기 이벤트 가져오기 오류:', error);
    return { 
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    };
  }
}

// 캐싱을 적용한 이벤트 데이터 가져오기
export const fetchCachedMatchEvents = cache(fetchMatchEvents); 