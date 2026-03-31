'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchTodayMatches, fetchMatchesByDateLabel, type TodayMatchesResult, type MatchData } from '../actions/footballApi';
import { liveScoreKeys } from '@/shared/constants/queryKeys';

/**
 * 메인페이지 초기 로딩용: 오늘 경기만 fetch
 * - CacheSeeder로 주입된 캐시 사용
 * - 탭 복귀 시 refetch (stale > 1분)
 */
export function useTodayMatches(initialData?: TodayMatchesResult) {
  return useQuery({
    queryKey: liveScoreKeys.multiDay(),
    queryFn: () => fetchTodayMatches(),
    initialData,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
  });
}

/**
 * 모달 탭 전환용: 어제/내일 경기를 lazy fetch
 * - enabled=false면 fetch하지 않음
 * - 탭 클릭 시 enabled=true로 전환되어 fetch 시작
 */
export function useDateMatches(dateLabel: 'yesterday' | 'today' | 'tomorrow', enabled: boolean) {
  return useQuery<MatchData[]>({
    queryKey: liveScoreKeys.matches(dateLabel),
    queryFn: async () => {
      const result = await fetchMatchesByDateLabel(dateLabel);
      if (!result.success || !result.matches) return [];
      return result.matches;
    },
    enabled,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });
}

/**
 * 오늘 경기 수만 필요한 헤더용 (같은 캐시에서 파생)
 */
export function useTodayMatchCount() {
  const { data } = useTodayMatches();
  const count = data?.data?.today?.matches?.length ?? 0;
  return { count, hasTodayMatches: count > 0 };
}
