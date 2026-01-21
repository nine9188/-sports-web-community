'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchPlayerRatingsAndCaptains } from '@/domains/livescore/actions/match/playerStats';

export default function usePlayerStats(matchId: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['playerRatings', matchId],
    queryFn: () => fetchPlayerRatingsAndCaptains(matchId),
    enabled: !!matchId,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });

  return {
    playersRatings: data?.ratings ?? {},
    captainIds: data?.captainIds ?? [],
    isLoading,
    error: error ? '선수 데이터 로드 중 오류가 발생했습니다.' : null
  };
}
