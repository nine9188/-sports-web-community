'use client';

import { useQuery } from '@tanstack/react-query';
import { getMatchesByDate } from '@/domains/boards/actions/matches';

// 경기 데이터 타입 (MatchResultForm과 동일)
interface Match {
  id?: number | string;
  fixture?: {
    id: number | string;
    date?: string;
  };
  league: {
    id: number | string;
    name: string;
    logo: string;
  };
  teams: {
    home: {
      id: number | string;
      name: string;
      logo: string;
    };
    away: {
      id: number | string;
      name: string;
      logo: string;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  status: {
    code: string;
    elapsed?: number | null;
    name?: string;
  };
}

// Query Keys
export const matchFormKeys = {
  all: ['matchForm'] as const,
  matchesByDate: (date: string) => [...matchFormKeys.all, 'matchesByDate', date] as const,
};

/**
 * 날짜별 경기 목록을 가져오는 훅
 * - 선택된 날짜의 경기 데이터 로드
 * - 캐싱을 통해 동일 날짜 재요청 방지
 */
export function useMatchesByDate(date: string, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: matchFormKeys.matchesByDate(date),
    queryFn: async (): Promise<Match[]> => {
      const data = await getMatchesByDate(date);
      return data || [];
    },
    enabled: enabled && !!date,
    staleTime: 1000 * 60 * 5, // 5분 (경기 상태가 자주 변경될 수 있음)
    gcTime: 1000 * 60 * 30, // 30분
  });
}
