'use client';

import { useEffect, useState } from 'react';
import { getMatchesByDate, type MatchesWithImages } from '@/domains/boards/actions/matches';

export function useMatchesByDate(date: string, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  const [result, setResult] = useState<MatchesWithImages | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !date) {
      setResult(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function loadMatches() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getMatchesByDate(date);
        if (!cancelled) {
          setResult(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to load matches'));
          setResult(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadMatches();

    return () => {
      cancelled = true;
    };
  }, [date, enabled]);

  return {
    data: result?.matches || [],
    teamLogoUrls: result?.teamLogoUrls || {},
    leagueLogoUrls: result?.leagueLogoUrls || {},
    leagueLogoUrlsDark: result?.leagueLogoUrlsDark || {},
    isLoading,
    error,
  };
}
