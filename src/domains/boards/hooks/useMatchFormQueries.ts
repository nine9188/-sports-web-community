'use client';

import { useQuery } from '@tanstack/react-query';
import { getMatchesByDate, type MatchesWithImages } from '@/domains/boards/actions/matches';

// Query Keys
export const matchFormKeys = {
  all: ['matchForm'] as const,
  matchesByDate: (date: string) => [...matchFormKeys.all, 'matchesByDate', date] as const,
};

/**
 * 날짜별 경기 목록을 가져오는 훅
 * - 선택된 날짜의 경기 데이터 로드
 * - 4590 표준: Storage URL 포함 반환
 * - 캐싱을 통해 동일 날짜 재요청 방지
 */
export function useMatchesByDate(date: string, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;

  const query = useQuery({
    queryKey: matchFormKeys.matchesByDate(date),
    queryFn: async (): Promise<MatchesWithImages> => {
      const data = await getMatchesByDate(date);
      return data;
    },
    enabled: enabled && !!date,
    staleTime: 1000 * 60 * 5, // 5분 (경기 상태가 자주 변경될 수 있음)
    gcTime: 1000 * 60 * 30, // 30분
  });

  // 4590 표준: 호환성을 위해 data를 MatchesByDateResult 형태로 반환
  return {
    ...query,
    data: query.data?.matches || [],
    teamLogoUrls: query.data?.teamLogoUrls || {},
    leagueLogoUrls: query.data?.leagueLogoUrls || {},
    leagueLogoUrlsDark: query.data?.leagueLogoUrlsDark || {},
  };
}
