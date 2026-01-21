'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCachedMatchFullData, MatchFullDataResponse } from '@/domains/livescore/actions/match/matchData';
import { getHeadToHeadTestData, HeadToHeadTestData } from '@/domains/livescore/actions/match/headtohead';
import { MatchEvent } from '@/domains/livescore/types/match';
import { TeamLineup } from '@/domains/livescore/actions/match/lineupData';
import { TeamStats } from '@/domains/livescore/actions/match/statsData';
import { StandingsData } from '@/domains/livescore/types/match';

// Query Keys
export const matchKeys = {
  all: ['match'] as const,
  detail: (matchId: string) => [...matchKeys.all, matchId] as const,
  events: (matchId: string) => [...matchKeys.detail(matchId), 'events'] as const,
  lineups: (matchId: string) => [...matchKeys.detail(matchId), 'lineups'] as const,
  stats: (matchId: string) => [...matchKeys.detail(matchId), 'stats'] as const,
  standings: (matchId: string) => [...matchKeys.detail(matchId), 'standings'] as const,
  power: (matchId: string, homeId: number, awayId: number) =>
    [...matchKeys.detail(matchId), 'power', homeId, awayId] as const,
};

// 공통 타입
interface MatchTeam {
  id: number;
  name: string;
  logo: string;
  photo?: string;
}

// 기본 경기 데이터 훅
export function useMatchDetail(matchId: string | null, enabled = true) {
  return useQuery({
    queryKey: matchId ? matchKeys.detail(matchId) : ['match', 'empty'],
    queryFn: async () => {
      if (!matchId) throw new Error('Match ID is required');
      const result = await fetchCachedMatchFullData(matchId, {
        fetchEvents: true,
        fetchLineups: false,
        fetchStats: false,
        fetchStandings: false,
      });
      if (!result.success) {
        throw new Error(result.error || '경기 데이터를 불러오는데 실패했습니다.');
      }
      return result;
    },
    enabled: enabled && !!matchId,
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 10, // 10분
  });
}

// 이벤트 데이터 훅
export function useMatchEvents(matchId: string | null, enabled = true) {
  return useQuery<MatchEvent[] | null>({
    queryKey: matchId ? matchKeys.events(matchId) : ['match', 'events', 'empty'],
    queryFn: async () => {
      if (!matchId) throw new Error('Match ID is required');
      const result = await fetchCachedMatchFullData(matchId, {
        fetchEvents: true,
        fetchLineups: false,
        fetchStats: false,
        fetchStandings: false,
      });
      if (!result.success) {
        throw new Error(result.error || '이벤트 데이터를 불러오는데 실패했습니다.');
      }
      return result.events || null;
    },
    enabled: enabled && !!matchId,
    staleTime: 1000 * 60 * 2, // 2분 (이벤트는 자주 변경될 수 있음)
    gcTime: 1000 * 60 * 10,
  });
}

// 라인업 데이터 훅
export function useMatchLineups(matchId: string | null, enabled = true) {
  return useQuery<{ response: { home: TeamLineup; away: TeamLineup } | null } | null>({
    queryKey: matchId ? matchKeys.lineups(matchId) : ['match', 'lineups', 'empty'],
    queryFn: async () => {
      if (!matchId) throw new Error('Match ID is required');
      const result = await fetchCachedMatchFullData(matchId, {
        fetchEvents: true,
        fetchLineups: true,
        fetchStats: false,
        fetchStandings: false,
      });
      if (!result.success) {
        throw new Error(result.error || '라인업 데이터를 불러오는데 실패했습니다.');
      }
      return result.lineups || null;
    },
    enabled: enabled && !!matchId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
}

// 통계 데이터 훅
export function useMatchStats(matchId: string | null, enabled = true) {
  return useQuery<TeamStats[] | null>({
    queryKey: matchId ? matchKeys.stats(matchId) : ['match', 'stats', 'empty'],
    queryFn: async () => {
      if (!matchId) throw new Error('Match ID is required');
      const result = await fetchCachedMatchFullData(matchId, {
        fetchEvents: false,
        fetchLineups: false,
        fetchStats: true,
        fetchStandings: false,
      });
      if (!result.success) {
        throw new Error(result.error || '통계 데이터를 불러오는데 실패했습니다.');
      }
      return result.stats || null;
    },
    enabled: enabled && !!matchId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
}

// 순위 데이터 훅
export function useMatchStandings(matchId: string | null, enabled = true) {
  return useQuery<StandingsData | null>({
    queryKey: matchId ? matchKeys.standings(matchId) : ['match', 'standings', 'empty'],
    queryFn: async () => {
      if (!matchId) throw new Error('Match ID is required');
      const result = await fetchCachedMatchFullData(matchId, {
        fetchEvents: false,
        fetchLineups: false,
        fetchStats: false,
        fetchStandings: true,
      });
      if (!result.success) {
        throw new Error(result.error || '순위 데이터를 불러오는데 실패했습니다.');
      }
      return result.standings || null;
    },
    enabled: enabled && !!matchId,
    staleTime: 1000 * 60 * 10, // 10분 (순위는 자주 변경되지 않음)
    gcTime: 1000 * 60 * 30,
  });
}

// 전력 분석 데이터 훅
export function useMatchPower(
  matchId: string | null,
  homeTeamId: number | null,
  awayTeamId: number | null,
  enabled = true
) {
  return useQuery<HeadToHeadTestData | null>({
    queryKey: matchId && homeTeamId && awayTeamId
      ? matchKeys.power(matchId, homeTeamId, awayTeamId)
      : ['match', 'power', 'empty'],
    queryFn: async () => {
      if (!homeTeamId || !awayTeamId) {
        throw new Error('Team IDs are required');
      }
      const result = await getHeadToHeadTestData(homeTeamId, awayTeamId, 5);
      return result || null;
    },
    enabled: enabled && !!matchId && !!homeTeamId && !!awayTeamId,
    staleTime: 1000 * 60 * 30, // 30분
    gcTime: 1000 * 60 * 60, // 1시간
  });
}

// 통합 데이터 훅 - 모든 탭 데이터를 한 번에 관리
export interface UseMatchDataOptions {
  matchId: string | null;
  initialData?: Partial<MatchFullDataResponse>;
  initialPowerData?: HeadToHeadTestData;
}

export function useMatchTabData({ matchId, initialData, initialPowerData }: UseMatchDataOptions) {
  const queryClient = useQueryClient();

  // 초기 데이터가 있으면 캐시에 미리 설정
  if (matchId && initialData) {
    if (initialData.events !== undefined) {
      queryClient.setQueryData(matchKeys.events(matchId), initialData.events);
    }
    if (initialData.lineups !== undefined) {
      queryClient.setQueryData(matchKeys.lineups(matchId), initialData.lineups);
    }
    if (initialData.stats !== undefined) {
      queryClient.setQueryData(matchKeys.stats(matchId), initialData.stats);
    }
    if (initialData.standings !== undefined) {
      queryClient.setQueryData(matchKeys.standings(matchId), initialData.standings);
    }
    if (initialData.homeTeam && initialData.awayTeam && initialPowerData) {
      queryClient.setQueryData(
        matchKeys.power(matchId, initialData.homeTeam.id, initialData.awayTeam.id),
        initialPowerData
      );
    }
  }

  // 기본 경기 정보
  const matchDetail = useMatchDetail(matchId);

  // 팀 정보
  const homeTeam = matchDetail.data?.homeTeam || initialData?.homeTeam || null;
  const awayTeam = matchDetail.data?.awayTeam || initialData?.awayTeam || null;

  // 탭별 데이터 (조건부 활성화)
  const events = useMatchEvents(matchId);
  const lineups = useMatchLineups(matchId);
  const stats = useMatchStats(matchId);
  const standings = useMatchStandings(matchId);
  const power = useMatchPower(matchId, homeTeam?.id || null, awayTeam?.id || null);

  // 특정 탭 데이터 프리페치
  const prefetchTab = async (tab: 'events' | 'lineups' | 'stats' | 'standings' | 'power') => {
    if (!matchId) return;

    switch (tab) {
      case 'events':
        await queryClient.prefetchQuery({
          queryKey: matchKeys.events(matchId),
          queryFn: async () => {
            const result = await fetchCachedMatchFullData(matchId, { fetchEvents: true });
            return result.events || null;
          },
        });
        break;
      case 'lineups':
        await queryClient.prefetchQuery({
          queryKey: matchKeys.lineups(matchId),
          queryFn: async () => {
            const result = await fetchCachedMatchFullData(matchId, { fetchLineups: true });
            return result.lineups || null;
          },
        });
        break;
      case 'stats':
        await queryClient.prefetchQuery({
          queryKey: matchKeys.stats(matchId),
          queryFn: async () => {
            const result = await fetchCachedMatchFullData(matchId, { fetchStats: true });
            return result.stats || null;
          },
        });
        break;
      case 'standings':
        await queryClient.prefetchQuery({
          queryKey: matchKeys.standings(matchId),
          queryFn: async () => {
            const result = await fetchCachedMatchFullData(matchId, { fetchStandings: true });
            return result.standings || null;
          },
        });
        break;
      case 'power':
        if (homeTeam?.id && awayTeam?.id) {
          await queryClient.prefetchQuery({
            queryKey: matchKeys.power(matchId, homeTeam.id, awayTeam.id),
            queryFn: async () => {
              const result = await getHeadToHeadTestData(homeTeam.id, awayTeam.id, 5);
              return result || null;
            },
          });
        }
        break;
    }
  };

  return {
    matchId,
    matchData: matchDetail.data?.matchData || initialData?.matchData || null,
    homeTeam,
    awayTeam,

    // 탭별 데이터
    eventsData: events.data ?? initialData?.events ?? null,
    lineupsData: lineups.data ?? initialData?.lineups ?? null,
    statsData: stats.data ?? initialData?.stats ?? null,
    standingsData: standings.data ?? initialData?.standings ?? null,
    powerData: power.data ?? initialPowerData ?? null,

    // 로딩 상태
    isLoading: matchDetail.isLoading,
    isEventsLoading: events.isLoading,
    isLineupsLoading: lineups.isLoading,
    isStatsLoading: stats.isLoading,
    isStandingsLoading: standings.isLoading,
    isPowerLoading: power.isLoading,

    // 에러 상태
    error: matchDetail.error?.message || null,

    // 탭 데이터 로드 여부
    isTabLoaded: (tab: 'events' | 'lineups' | 'stats' | 'standings' | 'power') => {
      switch (tab) {
        case 'events':
          return events.data !== undefined;
        case 'lineups':
          return lineups.data !== undefined;
        case 'stats':
          return stats.data !== undefined;
        case 'standings':
          return standings.data !== undefined;
        case 'power':
          return power.data !== undefined;
        default:
          return false;
      }
    },

    // 프리페치 함수
    prefetchTab,

    // 리페치 함수
    refetch: () => {
      matchDetail.refetch();
    },
  };
}
