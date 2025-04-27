'use server';

import { cache } from 'react';
import { fetchMatchData } from './match';
import { fetchMatchEvents } from './events';
import { fetchMatchLineups, TeamLineup } from './lineups';
import { fetchMatchStats } from './stats';
import { fetchMatchStandings } from './standings';
import { StandingsData } from './standings';
import { TeamStats } from './stats';
import { MatchEvent } from '@/app/livescore/football/match/types';
import { PlayerStats, fetchMultiplePlayerStats } from './playerStats';

// 매치 데이터 인터페이스
interface MatchDataType {
  fixture?: {
    date?: string;
    status?: {
      short?: string;
      long?: string;
      elapsed?: number | null;
    };
    timestamp?: number;
  };
  league?: {
    name?: string;
    name_ko?: string;
    logo?: string;
    id?: number;
  };
  teams?: {
    home?: {
      id?: number;
      name?: string;
      name_ko?: string;
      logo?: string;
      formation?: string;
    };
    away?: {
      id?: number;
      name?: string;
      name_ko?: string;
      logo?: string;
      formation?: string;
    };
  };
  goals?: {
    home?: number | null;
    away?: number | null;
  };
  score?: {
    halftime?: {
      home?: number | null;
      away?: number | null;
    };
    fulltime?: {
      home?: number | null;
      away?: number | null;
    };
  };
  [key: string]: unknown;
}

// 각 API 응답 타입 정의
interface EventsResponse {
  events: MatchEvent[];
  status: string;
  message: string;
}

interface LineupsResponse {
  success: boolean;
  response: {
    home: TeamLineup;
    away: TeamLineup;
  } | null;
  message: string;
}

interface StatsResponse {
  success: boolean;
  response: TeamStats[];
  message: string;
}

export interface MatchFullDataResponse {
  success: boolean;
  message: string;
  matchData?: MatchDataType | null;
  events?: MatchEvent[];
  lineups?: {
    response: {
      home: TeamLineup;
      away: TeamLineup;
    } | null;
  };
  stats?: TeamStats[];
  standings?: StandingsData | null;
  homeTeam?: {
    id: number;
    name: string;
    logo: string;
  };
  awayTeam?: {
    id: number;
    name: string;
    logo: string;
  };
  playersStats?: Record<number, { response: PlayerStats[] }>;
}

interface FetchOptions {
  fetchEvents?: boolean;
  fetchLineups?: boolean;
  fetchStats?: boolean;
  fetchStandings?: boolean;
  fetchPlayersStats?: boolean;  // 선수 통계 데이터 옵션 추가
}

// 캐시 TTL 설정 - 5분
const CACHE_TTL = 5 * 60 * 1000;

// 메모리 캐시 구현
const dataCache = new Map<string, { data: MatchFullDataResponse; timestamp: number }>();

/**
 * 특정 경기의 모든 관련 데이터를 한 번에 가져오는 통합 서버 액션
 * @param matchId 경기 ID
 * @param options 가져올 데이터 타입을 지정하는 옵션
 * @returns 통합된 경기 데이터
 */
export const fetchMatchFullData = cache(
  async (
    matchId: string,
    options: FetchOptions = {
      fetchEvents: true,
      fetchLineups: true,
      fetchStats: true,
      fetchStandings: true,
      fetchPlayersStats: false
    }
  ): Promise<MatchFullDataResponse> => {
    try {
      // 캐시 키 생성 - 경기 ID와 옵션 기반
      const cacheKey = `match-${matchId}-${JSON.stringify(options)}`;
      
      // 캐시 확인
      const cachedData = dataCache.get(cacheKey);
      const now = Date.now();
      
      // 캐시된 데이터가 있고 유효 기간이 지나지 않았으면 캐시 데이터 반환
      if (cachedData && (now - cachedData.timestamp) < CACHE_TTL) {
        return cachedData.data;
      }
      
      // 항상 기본 경기 데이터는 가져옵니다
      const matchDataResult = await fetchMatchData(matchId);
      
      if (!matchDataResult.success || !matchDataResult.data) {
        return {
          success: false,
          message: matchDataResult.message || '경기 데이터를 가져오는데 실패했습니다',
        };
      }

      const matchData = matchDataResult.data as unknown as MatchDataType;
      
      // 홈팀과 어웨이팀 데이터 추출
      let homeTeam, awayTeam;
      if (matchData.teams?.home) {
        homeTeam = {
          id: matchData.teams.home.id || 0,
          name: matchData.teams.home.name || '',
          logo: matchData.teams.home.logo || ''
        };
      }
      
      if (matchData.teams?.away) {
        awayTeam = {
          id: matchData.teams.away.id || 0,
          name: matchData.teams.away.name || '',
          logo: matchData.teams.away.logo || ''
        };
      }

      // 필요한 데이터를 병렬로 요청하여 성능 최적화
      const promises: Promise<unknown>[] = [];
      const dataTypes: string[] = [];

      // 각 데이터 유형별 요청 설정
      if (options.fetchEvents) {
        promises.push(fetchMatchEvents(matchId));
        dataTypes.push('events');
      }

      if (options.fetchLineups) {
        promises.push(fetchMatchLineups(matchId));
        dataTypes.push('lineups');
      }

      if (options.fetchStats) {
        promises.push(fetchMatchStats(matchId));
        dataTypes.push('stats');
      }

      if (options.fetchStandings && matchData.league?.id) {
        promises.push(fetchMatchStandings(matchId));
        dataTypes.push('standings');
      }

      // 모든 데이터 병렬로 요청
      const results = await Promise.all(promises);
      
      // 결과 조합
      const response: MatchFullDataResponse = {
        success: true,
        message: '경기 데이터를 성공적으로 가져왔습니다',
        matchData,
        homeTeam,
        awayTeam
      };
      
      // 병렬 요청 결과 처리
      results.forEach((result, index) => {
        const dataType = dataTypes[index];
        
        switch (dataType) {
          case 'events':
            response.events = (result as EventsResponse).events;
            break;
          case 'lineups':
            response.lineups = result as LineupsResponse;
            break;
          case 'stats':
            response.stats = (result as StatsResponse).response;
            break;
          case 'standings':
            response.standings = result as StandingsData;
            break;
        }
      });
      
      // 라인업이 로드된 경우, 모든 선수 통계 데이터도 함께 로드 (선택 사항)
      if (options.fetchPlayersStats && response.lineups?.response) {
        try {
          const homeLineup = response.lineups.response.home;
          const awayLineup = response.lineups.response.away;
          
          // 모든 선수 ID 추출
          const playerIds = [];
          
          // 홈팀 선발 선수
          if (homeLineup.startXI) {
            for (const player of homeLineup.startXI) {
              if (player.player?.id) {
                playerIds.push(player.player.id);
              }
            }
          }
          
          // 홈팀 교체 선수
          if (homeLineup.substitutes) {
            for (const player of homeLineup.substitutes) {
              if (player.player?.id) {
                playerIds.push(player.player.id);
              }
            }
          }
          
          // 원정팀 선발 선수
          if (awayLineup.startXI) {
            for (const player of awayLineup.startXI) {
              if (player.player?.id) {
                playerIds.push(player.player.id);
              }
            }
          }
          
          // 원정팀 교체 선수
          if (awayLineup.substitutes) {
            for (const player of awayLineup.substitutes) {
              if (player.player?.id) {
                playerIds.push(player.player.id);
              }
            }
          }
          
          // 선수 ID가 있는 경우에만 통계 데이터 요청
          if (playerIds.length > 0) {
            const playersStats = await fetchMultiplePlayerStats(matchId, playerIds);
            response.playersStats = playersStats;
          }
        } catch (error) {
          console.error('선수 통계 데이터 가져오기 오류:', error);
          // 선수 통계 데이터 오류는 전체 응답에 영향을 미치지 않도록 처리
        }
      }
      
      // 캐시에 결과 저장
      dataCache.set(cacheKey, {
        data: response,
        timestamp: now
      });
      
      return response;
      
    } catch (error) {
      console.error('경기 데이터 로드 중 오류:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
      };
    }
  }
); 