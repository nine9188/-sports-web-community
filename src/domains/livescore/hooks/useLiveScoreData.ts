'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchMultiDayMatches, MultiDayMatchesResult } from '../actions/footballApi';
import { liveScoreKeys } from '@/shared/constants/queryKeys';

/**
 * 3곳(위젯, 헤더, 모달)이 공유하는 멀티데이 매치 데이터 hook
 *
 * - SSR 데이터를 initialData로 받아 hydration
 * - CacheSeeder로 주입된 캐시도 자동 사용
 * - staleTime 5분 → 5분 내 재사용, 이후 백그라운드 refetch
 */
export function useMultiDayMatches(initialData?: MultiDayMatchesResult) {
  return useQuery({
    queryKey: liveScoreKeys.multiDay(),
    queryFn: () => fetchMultiDayMatches(),
    initialData,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });
}

/**
 * 오늘 경기 수만 필요한 헤더용 (같은 캐시에서 파생)
 * - useMultiDayMatches의 캐시 데이터에서 오늘 경기 수만 추출
 * - 추가 API 호출 없음
 */
export function useTodayMatchCount() {
  const { data } = useMultiDayMatches();
  const count = data?.data?.today?.matches?.length ?? 0;
  return { count, hasTodayMatches: count > 0 };
}
