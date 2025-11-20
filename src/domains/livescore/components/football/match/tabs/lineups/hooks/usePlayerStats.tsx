'use client';

import { useState, useEffect } from 'react';
import { fetchPlayerRatings } from '@/domains/livescore/actions/match/playerStats';

export default function usePlayerStats(matchId: string) {
  const [playersRatings, setPlayersRatings] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!matchId) return;

    const loadPlayerRatings = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const ratings = await fetchPlayerRatings(matchId);
        setPlayersRatings(ratings);
      } catch (error) {
        setError('선수 평점 로드 중 오류가 발생했습니다.');
        console.error('선수 평점 로드 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPlayerRatings();
  }, [matchId]);

  return {
    playersRatings,
    isLoading,
    error
  };
}
