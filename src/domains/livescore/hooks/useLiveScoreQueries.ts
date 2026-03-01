'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fetchMatchesByDate } from '../actions/footballApi';
import { countLiveMatches } from '../constants/match-status';
import { transformMatches } from '../utils/transformMatch';
import { liveScoreKeys } from '@/shared/constants/queryKeys';

// KST 기준 오늘 날짜 문자열
function getTodayKst(): string {
  const nowUtc = new Date();
  const kstNow = new Date(nowUtc.getTime() + 9 * 60 * 60 * 1000);
  return kstNow.toISOString().split('T')[0];
}

interface UseMatchesOptions {
  showLiveOnly?: boolean;
}

/**
 * 특정 날짜의 경기 목록을 가져오는 훅
 *
 * - HydrationBoundary로 서버 데이터가 캐시에 주입됨
 * - 자동 캐싱 (5분 staleTime)
 * - 오늘 날짜 + LIVE 모드일 때 30초마다 자동 refetch
 * - 오늘 날짜일 때 60초마다 자동 refetch
 */
export function useMatches(date: Date, options: UseMatchesOptions = {}) {
  const { showLiveOnly = false } = options;
  const formattedDate = format(date, 'yyyy-MM-dd');
  const todayStr = getTodayKst();
  const isToday = formattedDate === todayStr;

  // 폴링 간격: LIVE 모드면 30초, 오늘이면 60초, 과거/미래면 폴링 없음
  const refetchInterval = showLiveOnly ? 30000 : isToday ? 60000 : false;

  const query = useQuery({
    queryKey: liveScoreKeys.matches(formattedDate),
    queryFn: async () => {
      const data = await fetchMatchesByDate(formattedDate);
      return transformMatches(data);
    },
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 30, // 30분
    refetchInterval,
    refetchIntervalInBackground: false, // 탭이 비활성화되면 폴링 중지
  });

  // 라이브 경기 수 계산
  const liveMatchCount = query.data ? countLiveMatches(query.data) : 0;

  return {
    matches: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    liveMatchCount,
    refetch: query.refetch,
  };
}

/**
 * 오늘의 라이브 경기 수를 가져오는 훅 (다른 날짜 조회 시 사용)
 *
 * - 60초마다 자동 refetch
 */
export function useTodayLiveCount(enabled: boolean = true) {
  const todayStr = getTodayKst();

  const query = useQuery({
    queryKey: liveScoreKeys.matches(todayStr),
    queryFn: async () => {
      const data = await fetchMatchesByDate(todayStr);
      return transformMatches(data);
    },
    enabled,
    staleTime: 1000 * 60, // 1분
    gcTime: 1000 * 60 * 10, // 10분
    refetchInterval: 60000, // 60초마다 갱신
    refetchIntervalInBackground: false,
  });

  return {
    liveCount: query.data ? countLiveMatches(query.data) : 0,
    isLoading: query.isLoading,
  };
}

/**
 * LiveScoreView에서 사용하는 통합 훅
 *
 * HydrationBoundary 패턴:
 * - 서버에서 prefetchQuery로 3일치 데이터를 캐시에 주입
 * - 클라이언트에서는 캐시 히트로 즉시 데이터 사용 (로딩 스침 없음)
 * - initialData prop drilling 불필요
 */
export function useLiveScore(
  selectedDate: Date,
  options: { showLiveOnly?: boolean } = {}
) {
  const { showLiveOnly = false } = options;

  const formattedDate = format(selectedDate, 'yyyy-MM-dd');
  const todayStr = getTodayKst();
  const isToday = formattedDate === todayStr;

  // 선택된 날짜의 경기 데이터
  const {
    matches,
    isLoading,
    isFetching,
    liveMatchCount: currentDateLiveCount,
  } = useMatches(selectedDate, { showLiveOnly });

  // 오늘이 아닌 날짜를 볼 때만 오늘의 라이브 카운트 별도 조회
  const { liveCount: todayLiveCount } = useTodayLiveCount(!isToday);

  // 라이브 카운트: 오늘이면 현재 데이터에서, 아니면 별도 쿼리에서
  const liveMatchCount = isToday ? currentDateLiveCount : todayLiveCount;

  return {
    matches,
    isLoading,
    isFetching,
    liveMatchCount,
  };
}
