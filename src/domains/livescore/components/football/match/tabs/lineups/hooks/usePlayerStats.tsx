'use client';

import { useState, useEffect } from 'react';
import { fetchPlayerRatingsAndCaptains } from '@/domains/livescore/actions/match/playerStats';

export default function usePlayerStats(matchId: string) {
  const [playersRatings, setPlayersRatings] = useState<Record<number, number>>({});
  const [captainIds, setCaptainIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!matchId) return;

    const loadPlayerStats = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { ratings, captainIds: captains } = await fetchPlayerRatingsAndCaptains(matchId);
        setPlayersRatings(ratings);
        setCaptainIds(captains);
      } catch (error) {
        setError('선수 데이터 로드 중 오류가 발생했습니다.');
        console.error('선수 데이터 로드 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPlayerStats();
  }, [matchId]);

  return {
    playersRatings,
    captainIds,
    isLoading,
    error
  };
}
