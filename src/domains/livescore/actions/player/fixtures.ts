'use server';

import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { FixtureData } from '@/domains/livescore/types/player';
import { fetchFromFootballApi } from '@/domains/livescore/actions/footballApi';
import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { getDefaultPlayerSeason, getPlayerSeasonCandidates } from './currentSeason';

interface ApiPlayerFixtureStats {
  games?: {
    minutes?: number;
    rating?: string;
  };
  goals?: {
    total?: number;
    assists?: number;
  };
  shots?: {
    total?: number;
    on?: number;
  };
  passes?: {
    total?: number;
    key?: number;
  };
}

interface ApiFixture {
  fixture: {
    id: number;
    date: string;
    timestamp: number;
    status?: {
      short?: string;
    };
  };
  league: {
    id: number;
    name: string;
    logo: string;
    country?: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
    };
    away: {
      id: number;
      name: string;
      logo: string;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  players?: Array<{
    players?: Array<{
      player: {
        id: number;
      };
      statistics?: ApiPlayerFixtureStats[];
    }>;
  }>;
}

export interface FixturesResponse {
  data: FixtureData[];
  status?: 'success' | 'partial' | 'error';
  message?: string;
  seasonUsed?: number;
  completeness?: {
    total: number;
    success: number;
    failed: number;
    failedFixtureIds?: number[];
  };
}

interface PlayerFixtureContext {
  teamId: number;
  fixtureIds: number[];
}

type MemoryCacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const PLAYER_FIXTURES_CACHE_VERSION = 'v3';
const MEMORY_CACHE_TTL_MS = 1000 * 60 * 60;
const EMPTY_RESULT_MEMORY_CACHE_TTL_MS = 1000 * 30;
const globalFixtureCache = globalThis as typeof globalThis & {
  __playerFixturesMemoryCache?: Map<string, MemoryCacheEntry<unknown>>;
};
const memoryCache = globalFixtureCache.__playerFixturesMemoryCache ?? new Map<string, MemoryCacheEntry<unknown>>();
globalFixtureCache.__playerFixturesMemoryCache = memoryCache;

function getMemoryCacheTtl(value: unknown): number {
  const response = value as Partial<FixturesResponse>;
  if (Array.isArray(response.data) && response.data.length === 0 && (response.completeness?.total || 0) > 0) {
    return EMPTY_RESULT_MEMORY_CACHE_TTL_MS;
  }

  return MEMORY_CACHE_TTL_MS;
}

async function memoryCached<T>(key: string, task: () => Promise<T>): Promise<T> {
  const cached = memoryCache.get(key) as MemoryCacheEntry<T> | undefined;
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const value = await task();
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + getMemoryCacheTtl(value),
  });
  return value;
}

function getCurrentSeason(): number {
  return getDefaultPlayerSeason();
}

async function fetchPlayerFixtureContextFromDb(
  playerId: number,
  season: number
): Promise<PlayerFixtureContext | null> {
  try {
    const supabase = await getSupabaseServer();
    const { data: playerRow } = await supabase
      .from('football_players')
      .select('team_id')
      .eq('player_id', playerId)
      .maybeSingle();

    const teamId = playerRow?.team_id;
    if (!teamId) return null;

    const { data: fixtureRows, error } = await supabase
      .from('fixtures' as never)
      .select('fixture_id,match_date')
      .eq('season', season)
      .eq('status_short', 'FT')
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
      .order('match_date', { ascending: false });

    if (error || !fixtureRows?.length) {
      return { teamId, fixtureIds: [] };
    }

    return {
      teamId,
      fixtureIds: (fixtureRows as Array<{ fixture_id: number }>).map(row => row.fixture_id).filter(Boolean),
    };
  } catch {
    return null;
  }
}

async function fetchPlayerTeamIdFromApi(playerId: number, season: number): Promise<number | null> {
  const currentData = await fetchFromFootballApi('players', { id: playerId, season });
  const currentTeamId = getBestPlayerTeamIdFromStats(currentData.response?.[0]?.statistics);
  if (currentTeamId) return currentTeamId;

  if (season < 2023) return null;

  try {
    const previousData = await fetchFromFootballApi('players', { id: playerId, season: season - 1 });
    return getBestPlayerTeamIdFromStats(previousData.response?.[0]?.statistics);
  } catch {
    return null;
  }
}

function getBestPlayerTeamIdFromStats(statistics: unknown): number | null {
  if (!Array.isArray(statistics)) return null;

  const ranked = statistics
    .map((stat) => {
      const item = stat as {
        team?: { id?: number };
        league?: { type?: string; id?: number };
        games?: { appearences?: number | null; appearances?: number | null; minutes?: number | null };
      };
      const appearances = Number(item.games?.appearences ?? item.games?.appearances ?? 0);
      const minutes = Number(item.games?.minutes ?? 0);
      const leagueTypeBoost = item.league?.type === 'League' ? 1_000_000 : 0;

      return {
        teamId: item.team?.id,
        score: leagueTypeBoost + minutes * 100 + appearances,
      };
    })
    .filter((item): item is { teamId: number; score: number } => typeof item.teamId === 'number')
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.teamId || null;
}

async function fetchTeamFixtureIdsFromApi(teamId: number, season: number): Promise<number[]> {
  const fixturesData = await fetchFromFootballApi('fixtures', {
    team: teamId,
    season,
  });

  const fixtures: ApiFixture[] = fixturesData.response || [];
  return fixtures
    .filter(item => item.fixture.status?.short === 'FT')
    .sort((a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime())
    .map(item => item.fixture.id)
    .filter(Boolean);
}

const fetchCachedTeamFixtureIdsFromApi = unstable_cache(
  fetchTeamFixtureIdsFromApi,
  ['player-team-fixture-ids', PLAYER_FIXTURES_CACHE_VERSION],
  { revalidate: 3600 }
);

const fetchCachedFixtureDetailsBatch = unstable_cache(
  async (idsParam: string) => fetchFromFootballApi('fixtures', { ids: idsParam }),
  ['player-fixture-details-batch', PLAYER_FIXTURES_CACHE_VERSION],
  { revalidate: 3600 }
);

function findPlayerStats(fixtureData: ApiFixture, playerId: number): ApiPlayerFixtureStats | null {
  for (const teamPlayers of fixtureData.players || []) {
    for (const item of teamPlayers.players || []) {
      if (item.player.id === playerId) {
        return item.statistics?.[0] || null;
      }
    }
  }

  return null;
}

function formatFixtureWithPlayerStats(
  fixtureData: ApiFixture,
  playerStats: ApiPlayerFixtureStats | null,
  playerTeamId: number
): FixtureData | null {
  const minutes = playerStats?.games?.minutes || 0;
  if (minutes <= 0) return null;

  return {
    fixture: {
      id: fixtureData.fixture.id,
      date: fixtureData.fixture.date,
      timestamp: fixtureData.fixture.timestamp,
    },
    league: {
      id: fixtureData.league.id,
      name: fixtureData.league.name,
      logo: fixtureData.league.logo,
      country: fixtureData.league.country || '',
    },
    teams: {
      home: {
        id: fixtureData.teams.home.id,
        name: fixtureData.teams.home.name,
        logo: fixtureData.teams.home.logo,
      },
      away: {
        id: fixtureData.teams.away.id,
        name: fixtureData.teams.away.name,
        logo: fixtureData.teams.away.logo,
      },
      playerTeamId,
    },
    goals: {
      home: String(fixtureData.goals.home ?? 0),
      away: String(fixtureData.goals.away ?? 0),
    },
    statistics: {
      games: {
        minutes,
        rating: playerStats?.games?.rating,
      },
      goals: {
        total: playerStats?.goals?.total || 0,
        assists: playerStats?.goals?.assists || 0,
      },
      shots: {
        total: playerStats?.shots?.total || 0,
        on: playerStats?.shots?.on || 0,
      },
      passes: {
        total: playerStats?.passes?.total || 0,
        key: playerStats?.passes?.key || 0,
      },
    },
  };
}

function formatFixtureWithStats(
  fixtureData: ApiFixture,
  playerId: number,
  playerTeamId: number
): FixtureData | null {
  return formatFixtureWithPlayerStats(
    fixtureData,
    findPlayerStats(fixtureData, playerId),
    playerTeamId
  );
}

export async function fetchPlayerFixtures(
  playerId: number,
  limit: number = 0,
  offset: number = 0
): Promise<FixturesResponse> {
  return memoryCached(
    `player-fixtures:${PLAYER_FIXTURES_CACHE_VERSION}:${playerId}:${limit}:${offset}`,
    () => fetchPlayerFixturesInternal(playerId, limit, offset)
  );
}

const fetchPlayerFixturesInternal = unstable_cache(
  fetchPlayerFixturesUncached,
  ['player-fixtures-page', PLAYER_FIXTURES_CACHE_VERSION],
  { revalidate: 3600 }
);

async function fetchPlayerFixturesUncached(
  playerId: number,
  limit: number = 0,
  offset: number = 0
): Promise<FixturesResponse> {
  if (!playerId) {
    return { data: [], status: 'error', message: '선수 ID가 필요합니다.' };
  }

  const currentSeason = getCurrentSeason();

  try {
    let dbContext: PlayerFixtureContext | null = null;
    let apiTeamId: number | null = null;
    let seasonUsed = currentSeason;

    for (const season of getPlayerSeasonCandidates(currentSeason)) {
      dbContext = await fetchPlayerFixtureContextFromDb(playerId, season);
      apiTeamId = await fetchPlayerTeamIdFromApi(playerId, season);
      if (apiTeamId || dbContext?.teamId) {
        seasonUsed = season;
        break;
      }
    }

    const teamId = apiTeamId || dbContext?.teamId;

    if (!teamId) {
      return { data: [], status: 'error', message: '선수의 팀 정보를 찾을 수 없습니다.' };
    }

    let fixtureIds = apiTeamId && apiTeamId !== dbContext?.teamId ? [] : (dbContext?.fixtureIds || []);

    // The local fixtures table can be incomplete during the season. If it looks
    // too sparse, or the API player team differs from the DB team, use the API
    // fixture list so the tab does not silently truncate or search the wrong team.
    if (fixtureIds.length < 15) {
      const apiFixtureIds = await fetchCachedTeamFixtureIdsFromApi(teamId, seasonUsed);

      if (apiFixtureIds.length > fixtureIds.length) {
        fixtureIds = apiFixtureIds;
      }
    }

    if (fixtureIds.length === 0) {
      return {
        data: [],
        status: 'success',
        message: `${seasonUsed} 시즌 경기 기록이 없습니다.`,
        seasonUsed,
      };
    }

    const fixturesWithStats: FixtureData[] = [];
    const failedFixtureIds: number[] = [];
    const batchSize = 20;
    const selectedFixtureIds = fixtureIds;
    let skippedPlayedFixtures = 0;

    for (let i = 0; i < selectedFixtureIds.length; i += batchSize) {
      const batchIds = selectedFixtureIds.slice(i, i + batchSize);
      const idsParam = batchIds.join('-');

      try {
        const batchData = await fetchCachedFixtureDetailsBatch(idsParam);

        for (const fixtureData of batchData.response || []) {
          const fixture = formatFixtureWithStats(fixtureData, playerId, teamId);
          if (fixture) {
            if (skippedPlayedFixtures < offset) {
              skippedPlayedFixtures += 1;
            } else if (limit <= 0 || fixturesWithStats.length < limit) {
              fixturesWithStats.push(fixture);
            }
          }
        }

        if (limit > 0 && fixturesWithStats.length >= limit) {
          break;
        }
      } catch (error) {
        console.error('[fetchPlayerFixtures] Batch request failed:', error);
        failedFixtureIds.push(...batchIds);
      }
    }

    const sortedFixtures = fixturesWithStats.sort(
      (a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime()
    );
    const limitedFixtures = sortedFixtures;
    const isComplete = failedFixtureIds.length === 0;

    return {
      data: sortedFixtures,
      status: isComplete ? 'success' : 'partial',
      message: isComplete
        ? (limitedFixtures.length > 0 ? '경기 기록을 찾았습니다.' : `${seasonUsed} 시즌 경기 기록이 없습니다.`)
        : `일부 경기 데이터 로딩 실패 (${failedFixtureIds.length}건)`,
      seasonUsed,
      completeness: {
        total: fixtureIds.length,
        success: limitedFixtures.length,
        failed: failedFixtureIds.length,
        failedFixtureIds: failedFixtureIds.length > 0 ? failedFixtureIds : undefined,
      },
    };
  } catch (error) {
    console.error('[fetchPlayerFixtures] Fatal error:', error);
    return {
      data: [],
      status: 'error',
      message: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}

export const fetchCachedPlayerFixtures = cache(fetchPlayerFixtures);
