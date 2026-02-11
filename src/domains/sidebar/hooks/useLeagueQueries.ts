'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { StandingsData } from '../types';
import { fetchStandingsData } from '../actions/football';

// Query Keys
export const leagueKeys = {
  all: ['league'] as const,
  standings: (leagueId: string) => [...leagueKeys.all, 'standings', leagueId] as const,
};

interface UseLeagueStandingsOptions {
  initialData?: StandingsData | null;
  enabled?: boolean;
}

/**
 * 리그 순위 데이터를 가져오는 React Query 훅
 *
 * - 자동 캐싱 (10분 staleTime)
 * - 중복 요청 자동 제거
 * - 초기 데이터 지원 (SSR)
 */
export function useLeagueStandings(
  leagueId: string = 'premier',
  options: UseLeagueStandingsOptions = {}
) {
  const { initialData, enabled = true } = options;

  const query = useQuery({
    queryKey: leagueKeys.standings(leagueId),
    queryFn: () => fetchStandingsData(leagueId),
    initialData: initialData ?? undefined,
    enabled,
    staleTime: 1000 * 60 * 10, // 10분
    gcTime: 1000 * 60 * 30, // 30분
    placeholderData: keepPreviousData, // 탭 전환 시 이전 데이터 유지
    retry: 1,
  });

  return {
    standings: query.data ?? null,
    // 4590 표준: 팀 로고 URL (서버 액션에서 조회됨)
    teamLogoUrls: query.data?.teamLogoUrls ?? {},
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? '데이터를 불러오는데 실패했습니다.' : null,
    refetch: query.refetch,
  };
}
