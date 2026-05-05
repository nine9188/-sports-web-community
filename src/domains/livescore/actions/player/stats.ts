'use server';

import { cache } from 'react';
import { PlayerStatistic } from '@/domains/livescore/types/player';
import { fetchFromFootballApi } from '@/domains/livescore/actions/footballApi';
import { formatPlayerStatistics } from './stats-format';

export async function fetchPlayerSeasons(playerId: number): Promise<number[]> {
  try {
    if (!playerId) {
      return [];
    }

    const data = await fetchFromFootballApi('players/seasons', { player: playerId });

    if (!data?.response || !Array.isArray(data.response)) {
      return [];
    }

    return data.response.sort((a: number, b: number) => b - a);
  } catch {
    return [];
  }
}

export async function fetchPlayerStats(playerId: number, season: number): Promise<PlayerStatistic[]> {
  try {
    if (!playerId || !season) {
      throw new Error('Player ID and season are required.');
    }

    const data = await fetchFromFootballApi('players', { id: playerId, season });

    if (!data?.response?.[0]?.statistics) {
      return [];
    }

    return formatPlayerStatistics(data.response[0].statistics, season);
  } catch {
    return [];
  }
}

export const fetchCachedPlayerStats = cache(fetchPlayerStats);
export const fetchCachedPlayerSeasons = cache(fetchPlayerSeasons);
