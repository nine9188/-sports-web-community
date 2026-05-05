'use server';

import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { MatchEvent } from '../../types/match';
import { getTeamsByIds } from '@/domains/livescore/actions/teamLeagueData';
import { fetchFromFootballApi } from '@/domains/livescore/actions/footballApi';

export interface EventDataResponse {
  success: boolean;
  data?: MatchEvent[];
  error?: string;
}

export interface GoalEventDataResponse {
  success: boolean;
  data?: MatchEvent[];
  error?: string;
}

interface ApiEvent {
  time: {
    elapsed: number;
    extra?: number;
  };
  team: {
    id: number;
    name: string;
    logo: string;
  };
  player: {
    id: number;
    name: string;
  };
  assist?: {
    id: number;
    name: string;
  };
  type: string;
  detail: string;
  comments?: string;
}

export async function fetchMatchEvents(matchId: string): Promise<EventDataResponse> {
  try {
    if (!matchId) {
      throw new Error('Match ID is required');
    }

    const data = await fetchFromFootballApi('fixtures/events', { fixture: matchId });
    let events = Array.isArray(data.response) ? data.response : [];

    const teamIds = Array.from(
      new Set(events.map((e: ApiEvent) => e.team?.id).filter((id: number | undefined): id is number => typeof id === 'number'))
    ) as number[];
    const teamMap = await getTeamsByIds(teamIds);

    events = events.map((event: ApiEvent) => {
      if (event.team && event.team.id) {
        const teamMapping = teamMap[event.team.id];
        if (teamMapping) {
          return {
            ...event,
            team: {
              ...event.team,
              name_ko: teamMapping.name_ko,
              name_en: teamMapping.name_en
            }
          };
        }
      }
      return event;
    });

    return {
      success: true,
      data: events
    };
  } catch (error) {
    console.error('Match events fetch failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function fetchMatchGoalEvents(matchId: string): Promise<GoalEventDataResponse> {
  try {
    if (!matchId) {
      throw new Error('Match ID is required');
    }

    const data = await fetchFromFootballApi('fixtures/events', { fixture: matchId });
    const events = Array.isArray(data.response) ? data.response : [];

    const goalEvents = events.filter((event: ApiEvent) => {
      const type = event.type?.toLowerCase() || '';
      const detail = event.detail?.toLowerCase() || '';

      if (type === 'var' || detail.includes('cancelled')) return false;
      if (type !== 'goal') return false;
      if (detail.includes('missed')) return false;
      return true;
    });

    return {
      success: true,
      data: goalEvents as MatchEvent[],
    };
  } catch (error) {
    console.error('Match goal events fetch failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export const fetchCachedMatchEvents = cache(fetchMatchEvents);

async function fetchMatchGoalEventsCached(matchId: string): Promise<GoalEventDataResponse> {
  return unstable_cache(
    () => fetchMatchGoalEvents(matchId),
    ['match-goal-events-v2', matchId],
    { revalidate: 300, tags: [`match-${matchId}`, `match-goal-events-${matchId}`] }
  )();
}

export const fetchCachedMatchGoalEvents = cache(fetchMatchGoalEventsCached);
