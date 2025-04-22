'use server';

import { cache } from 'react';
import { MatchEvent } from '@/app/livescore/football/match/types';
import { getTeamById } from '@/app/constants';

// 타입 안전성을 위한 응답 인터페이스 정의
interface EventsResponse {
  events: MatchEvent[];
  status: 'success' | 'error';
  message: string;
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
export async function fetchMatchEvents(matchId: string): Promise<EventsResponse> {
  try {
    if (!matchId) {
      throw new Error('Match ID is required');
    }

    // API 요청
    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures/events?fixture=${matchId}`,
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
    let events = Array.isArray(data.response) ? data.response : [];
    
    // 팀 데이터 매핑 추가
    events = events.map((event: ApiEvent) => {
      if (event.team && event.team.id) {
        const teamMapping = getTeamById(event.team.id);
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
      events,
      status: 'success',
      message: events.length ? 'Events found' : 'No events found'
    };

  } catch (error) {
    console.error('경기 이벤트 가져오기 오류:', error);
    return { 
      events: [],
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 캐싱을 적용한 경기 이벤트 데이터 가져오기
 * 참고: 실시간 데이터이기 때문에 실제로는 캐싱이 적용되지 않습니다.
 */
export const fetchCachedMatchEvents = cache(fetchMatchEvents); 