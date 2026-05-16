'use server';

import { cache } from 'react';
import { PlayerData, PlayerStatistic, FixtureData, TransferData, InjuryData, TrophyData, RankingsData } from '@/domains/livescore/types/player';
import { fetchPlayerData } from './player';
import { fetchPlayerSeasons } from './stats';
import { formatPlayerStatistics, type ApiStatisticResponse } from './stats-format';
import { fetchPlayerFixtures } from './fixtures';
import { fetchPlayerTrophies } from './trophies';
import { fetchPlayerTransfers } from './transfers';
import { fetchPlayerInjuries } from './injuries';
import { fetchPlayerRankings } from './rankings';
import { fetchFromFootballApi } from '@/domains/livescore/actions/footballApi';
import { getPlayerPhotoUrl, getTeamLogoUrl, getTeamLogoUrls, getLeagueLogoUrls } from '@/domains/livescore/actions/images';
import { getSupabaseAdmin, getSupabaseServer } from '@/shared/lib/supabase/server';
import { getDefaultPlayerSeason, getPlayerSeasonCandidates } from './currentSeason';
import { resolvePlayerSeasonContext } from './seasonContext';
import { fetchCachedPlayerShell, type PlayerShell } from './playerShell';

const PLAYER_STATS_CACHE_MS = 1000 * 60 * 60 * 24 * 7;

type CachedPlayerApiData = {
  raw?: {
    player?: unknown;
    statistics?: ApiStatisticResponse[];
  } | ApiStatisticResponse[] | null;
  lastSync?: string;
  source?: string;
};

type CachedPlayerStatsRow = {
  api_data: CachedPlayerApiData | null;
  last_api_sync: string | null;
};

/**
 * player.ts에서 구현된 fetchPlayerData 함수를 사용하여 
 * 선수 데이터를 가져오는 캐싱된 함수입니다.
 * 
 * 이 함수는 기존 API 호출 로직을 중복하지 않고 재사용하여
 * 코드 일관성과 유지보수성을 높입니다.
 * 
 * @param id 선수 ID
 * @returns 선수 데이터
 */
export const fetchCachedPlayerData = cache(fetchPlayerData);

/**
 * 통합 데이터 응답 인터페이스
 */
export interface PlayerFullDataResponse {
  success: boolean;
  message: string;
  playerData?: PlayerData;
  seasons?: number[];
  allSeasons?: number[]; // 전체 사용 가능한 시즌 목록(내부 처리용)
  statistics?: PlayerStatistic[];
  // 4590 표준: statistics 이미지 URL
  statisticsTeamLogoUrls?: Record<number, string>;
  statisticsLeagueLogoUrls?: Record<number, string>;
  statisticsLeagueLogoDarkUrls?: Record<number, string>;
  fixtures?: {
    data: FixtureData[];
    status?: string;
    message?: string;
    seasonUsed?: number;
    completeness?: {
      total: number;
      success: number;
      failed: number;
      failedFixtureIds?: number[];
    };
    // 4590 표준: 이미지 Storage URL
    teamLogoUrls?: Record<number, string>;
    leagueLogoUrls?: Record<number, string>;
    leagueLogoDarkUrls?: Record<number, string>;
  };
  trophies?: TrophyData[];
  // 4590 표준: trophies 이미지 URL
  trophiesLeagueLogoUrls?: Record<number, string>;
  trophiesLeagueLogoDarkUrls?: Record<number, string>;
  transfers?: TransferData[];
  // 4590 표준: transfers 이미지 URL
  transfersTeamLogoUrls?: Record<number, string>;
  injuries?: InjuryData[];
  // 4590 표준: injuries 이미지 URL
  injuriesTeamLogoUrls?: Record<number, string>;
  rankings?: RankingsData;
  currentTeamLeague?: {
    id: number;
    name: string;
    country?: string;
    season: number;
  };
  cachedAt?: number; // 캐시 타임스탬프 추가
  // 4590 표준: 이미지 Storage URL
  playerPhotoUrl?: string;
  teamLogoUrl?: string;
}

export interface PlayerStatsTabDataResponse {
  success: boolean;
  message?: string;
  statistics: PlayerStatistic[];
  teamLogoUrls: Record<number, string>;
  leagueLogoUrls: Record<number, string>;
  leagueLogoDarkUrls: Record<number, string>;
}

/**
 * 데이터 로드 옵션 인터페이스
 */
interface FetchOptions {
  fetchSeasons?: boolean;
  fetchStats?: boolean;
  fetchFixtures?: boolean;
  fixtureLimit?: number;
  fixtureOffset?: number;
  fetchTrophies?: boolean;
  fetchTransfers?: boolean;
  fetchInjuries?: boolean;
  fetchRankings?: boolean;
  season?: number; // 조회할 특정 시즌
}

function buildPlayerFullDataFromShell(shell: PlayerShell): PlayerFullDataResponse {
  const statistic = shell.team ? {
    team: {
      id: shell.team.id,
      name: shell.team.name,
      logo: shell.team.logo || '',
    },
    league: {
      id: shell.league?.id || 0,
      name: shell.league?.name || '',
      country: shell.league?.country || '',
      logo: shell.league?.logo || '',
      season: shell.league?.season || getDefaultPlayerSeason(),
    },
    games: {
      appearences: 0,
      lineups: 0,
      minutes: 0,
      number: shell.number || undefined,
      position: shell.position || '',
      rating: '',
      captain: false,
    },
    substitutes: { in: 0, out: 0, bench: 0 },
    goals: { total: 0, assists: 0, saves: 0, conceded: 0, cleansheets: 0 },
    shots: { total: 0, on: 0 },
    passes: { total: 0, key: 0, accuracy: '', cross: 0 },
    tackles: { total: 0, blocks: 0, interceptions: 0, clearances: 0 },
    duels: { total: 0, won: 0 },
    dribbles: { attempts: 0, success: 0, past: 0 },
    fouls: { drawn: 0, committed: 0 },
    cards: { yellow: 0, yellowred: 0, red: 0 },
    penalty: { won: 0, commited: 0, scored: 0, missed: 0, saved: 0 },
  } : null;

  return {
    success: true,
    message: 'Player shell data loaded from player cache.',
    playerData: {
      info: {
        id: shell.id,
        name: shell.name,
        firstname: shell.name_en || shell.name,
        lastname: '',
        age: shell.age || 0,
        birth: {
          date: '',
          place: '',
          country: '',
        },
        nationality: shell.nationality || '',
        height: shell.height || '',
        weight: shell.weight || '',
        injured: false,
        photo: shell.photo || '',
      },
      statistics: statistic ? [statistic] : [],
    },
    statistics: statistic ? [statistic] : [],
    playerPhotoUrl: shell.photo || '/images/placeholder-player.svg',
    teamLogoUrl: shell.team?.logo || '/images/placeholder-team.svg',
    currentTeamLeague: shell.league?.id ? {
      id: shell.league.id,
      name: shell.league.name,
      country: shell.league.country || undefined,
      season: shell.league.season || getDefaultPlayerSeason(),
    } : undefined,
    cachedAt: Date.now(),
  };
}

/**
 * 현재 시즌 계산 함수
 */
function getCurrentSeason(): number {
  return getDefaultPlayerSeason();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  // 현재 시즌이 API에서 아직 데이터를 제공하지 않을 수 있으므로
  // 항상 이전 시즌을 기본으로 사용
  // 7월 이후면 해당 연도, 아니면 이전 연도를 시즌으로 사용
  return month >= 6 ? year : year - 1;
}

async function fetchResolvedPlayerStatistics(playerId: number): Promise<PlayerStatistic[]> {
  const resolved = await resolvePlayerSeasonContext(playerId);
  const cachedStats = await fetchCachedPlayerStatisticsFromDb(playerId, resolved.season);
  if (cachedStats?.length) {
    return cachedStats;
  }

  const primaryStats = await fetchPlayerStatsFromApiAndPersist(playerId, resolved.season);
  if (primaryStats?.length || resolved.strict) {
    return primaryStats;
  }

  for (const season of getPlayerSeasonCandidates(resolved.season)) {
    if (season === resolved.season) continue;
    const stats = await fetchPlayerStatsFromApiAndPersist(playerId, season);
    if (stats?.length) {
      return stats;
    }
  }

  return [];
}

/**
 * 시즌 데이터를 API에서 직접 가져오는 함수
 * API Football의 시즌 목록 API를 호출합니다.
 * @returns 사용 가능한 모든 시즌 목록
 */
function isFreshSync(lastApiSync: string | null): boolean {
  if (!lastApiSync) return false;

  const syncedAt = new Date(lastApiSync).getTime();
  if (Number.isNaN(syncedAt)) return false;

  return Date.now() - syncedAt <= PLAYER_STATS_CACHE_MS;
}

function getRawStatistics(apiData: CachedPlayerApiData | null): ApiStatisticResponse[] | null {
  if (!apiData || typeof apiData !== 'object' || Array.isArray(apiData)) return null;

  const raw = apiData.raw;
  if (!raw || typeof raw !== 'object') return null;

  if (Array.isArray(raw)) {
    return raw;
  }

  return Array.isArray(raw.statistics) ? raw.statistics : null;
}

async function fetchCachedPlayerStatisticsFromDb(
  playerId: number,
  season: number
): Promise<PlayerStatistic[] | null> {
  try {
    const supabase = await getSupabaseServer();
    const { data, error } = await supabase
      .from('football_players')
      .select('api_data,last_api_sync')
      .eq('player_id', playerId)
      .maybeSingle();

    if (error || !data) return null;

    const row = data as CachedPlayerStatsRow;
    if (!isFreshSync(row.last_api_sync)) return null;

    const statistics = getRawStatistics(row.api_data);
    if (!statistics?.length) return null;
    if (!statistics.some((stat) => stat.league?.season === season)) return null;

    return formatPlayerStatistics(statistics, season);
  } catch {
    return null;
  }
}

async function persistPlayerStatsRaw(
  playerId: number,
  rawResponse: { player?: unknown; statistics?: ApiStatisticResponse[] }
): Promise<void> {
  if (!rawResponse.statistics?.length) return;

  try {
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    await supabase
      .from('football_players')
      .update({
        api_data: {
          raw: rawResponse,
          lastSync: now,
          source: 'players',
        },
        last_api_sync: now,
        updated_at: now,
      })
      .eq('player_id', playerId);
  } catch {
    // Cache writes should never block the tab.
  }
}

async function fetchPlayerStatsFromApiAndPersist(
  playerId: number,
  season: number
): Promise<PlayerStatistic[]> {
  const data = await fetchFromFootballApi('players', { id: playerId, season });
  const rawResponse = data?.response?.[0];

  if (!rawResponse?.statistics?.length) {
    return [];
  }

  await persistPlayerStatsRaw(playerId, rawResponse);
  return formatPlayerStatistics(rawResponse.statistics, season);
}

export const fetchAvailableSeasons = async (): Promise<number[]> => {
  try {
    const seasonsData = await fetchFromFootballApi('leagues/seasons', {});
    const seasons = seasonsData.response || [];
    return seasons.sort((a: number, b: number) => b - a);
  } catch {
    const currentYear = new Date().getFullYear();
    const fallbackSeasons = Array.from({ length: 10 }, (_, i) => currentYear - i);
    return fallbackSeasons;
  }
};

// React cache로 래핑 (동일 렌더링 사이클 내 중복 호출 방지)
export const getCachedSeasons = cache(fetchAvailableSeasons);
export const getCachedSeasonsForReact = getCachedSeasons;

export const fetchPlayerStatsTabData = async (
  playerId: string
): Promise<PlayerStatsTabDataResponse> => {
  try {
    const playerIdNum = parseInt(playerId, 10);
    if (isNaN(playerIdNum)) {
      return {
        success: false,
        message: '유효하지 않은 선수 ID입니다.',
        statistics: [],
        teamLogoUrls: {},
        leagueLogoUrls: {},
        leagueLogoDarkUrls: {},
      };
    }

    const statistics = await fetchResolvedPlayerStatistics(playerIdNum);

    const teamLogoUrls: Record<number, string> = {};
    const leagueLogoUrls: Record<number, string> = {};
    const leagueLogoDarkUrls: Record<number, string> = {};

    statistics.forEach(stat => {
      if (stat.team?.id && stat.team.logo) {
        teamLogoUrls[stat.team.id] = stat.team.logo;
      }
      if (stat.league?.id && stat.league.logo) {
        leagueLogoUrls[stat.league.id] = stat.league.logo;
        leagueLogoDarkUrls[stat.league.id] = stat.league.logo;
      }
    });

    return {
      success: true,
      statistics,
      teamLogoUrls,
      leagueLogoUrls,
      leagueLogoDarkUrls,
    };
  } catch (error) {
    console.error('[fetchPlayerStatsTabData] error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      statistics: [],
      teamLogoUrls: {},
      leagueLogoUrls: {},
      leagueLogoDarkUrls: {},
    };
  }
};

/**
 * 선수의 모든 데이터를 한 번에 가져오는 통합 함수
 * 필요한 데이터만 선택적으로 로드하여 성능 최적화
 * 
 * @param playerId 선수 ID
 * @param options 가져올 데이터 옵션
 * @returns 통합된 선수 데이터
 */
export const fetchPlayerFullData = async (
  playerId: string,
  options: FetchOptions = {}
): Promise<PlayerFullDataResponse> => {
  try {
    const playerIdNum = parseInt(playerId, 10);
    if (isNaN(playerIdNum)) {
      return {
        success: false,
        message: '유효하지 않은 선수 ID입니다.'
      };
    }
    
    // 기본 옵션 설정
    const loadOptions = {
      fetchSeasons: options.fetchSeasons !== undefined ? options.fetchSeasons : true,
      fetchStats: options.fetchStats !== undefined ? options.fetchStats : true,
      fetchFixtures: options.fetchFixtures ?? false,
      fixtureLimit: options.fixtureLimit,
      fixtureOffset: options.fixtureOffset,
      fetchTrophies: options.fetchTrophies ?? false,
      fetchTransfers: options.fetchTransfers ?? false,
      fetchInjuries: options.fetchInjuries ?? false,
      fetchRankings: options.fetchRankings ?? false,
      season: options.season
    };

    // 병렬로 처리할 API 호출 준비
    const apiPromises: {
      playerData?: Promise<PlayerData>;
      seasons?: Promise<number[]>;
      allSeasons?: Promise<number[]>;
      statistics?: Promise<PlayerStatistic[]>;
      fixtures?: Promise<{ data: FixtureData[] }>;
      trophies?: Promise<TrophyData[]>;
      transfers?: Promise<TransferData[]>;
      injuries?: Promise<InjuryData[]>;
      rankings?: Promise<RankingsData>;
    } = {};

    // 기본 선수 데이터는 항상 가져옴
    apiPromises.playerData = fetchCachedPlayerData(playerId);

    // 모든 사용 가능한 시즌 목록 가져오기 (필요한 경우)
    if (loadOptions.fetchSeasons) {
      apiPromises.allSeasons = getCachedSeasons();
    }

    // 선택적으로 다른 데이터 로드
    if (loadOptions.fetchSeasons) {
      apiPromises.seasons = fetchPlayerSeasons(playerIdNum);
    }

    if (loadOptions.fetchStats) {
      apiPromises.statistics = (async () => {
        if (typeof loadOptions.season === 'number') {
          const cachedStats = await fetchCachedPlayerStatisticsFromDb(playerIdNum, loadOptions.season);
          if (cachedStats?.length) {
            return cachedStats;
          }

          return fetchPlayerStatsFromApiAndPersist(playerIdNum, loadOptions.season);
        }

        return fetchResolvedPlayerStatistics(playerIdNum);
      })();
    }

    if (loadOptions.fetchFixtures) {
      apiPromises.fixtures = (async () => {
        try {
          const fixtures = await fetchPlayerFixtures(
            playerIdNum,
            loadOptions.fixtureLimit,
            loadOptions.fixtureOffset
          );
          return {
            data: fixtures?.data || [],
            status: fixtures?.status || 'success',
            message: fixtures?.message,
            seasonUsed: fixtures?.seasonUsed,
            completeness: fixtures?.completeness,
          };
        } catch {
          return {
            data: [] as FixtureData[],
            status: 'error' as const,
            message: '경기 데이터를 가져오는데 실패했습니다.'
          };
        }
      })();
    }

    if (loadOptions.fetchTrophies) {
      apiPromises.trophies = fetchPlayerTrophies(playerIdNum);
    }

    if (loadOptions.fetchTransfers) {
      apiPromises.transfers = fetchPlayerTransfers(playerIdNum);
    }

    if (loadOptions.fetchInjuries) {
      apiPromises.injuries = (async () => {
        try {
          return await fetchPlayerInjuries(playerIdNum);
        } catch (error) {
          console.error(`[fetchPlayerFullData] 부상 데이터 로드 오류:`, error);
          return [] as InjuryData[];
        }
      })();
    }

    if (loadOptions.fetchRankings) {
      apiPromises.rankings = apiPromises.playerData!.then(async (playerData) => {
        const seasonContext = await resolvePlayerSeasonContext(playerIdNum);
        const currentLeagueId = seasonContext.leagueId ?? playerData?.statistics?.[0]?.league?.id;
        if (!currentLeagueId) {
          return {};
        }
        return fetchPlayerRankings(playerIdNum, currentLeagueId, seasonContext.season);
      });
    }

    // 병렬로 모든 API 호출 처리
    const results = await Promise.allSettled(
      Object.entries(apiPromises).map(async ([key, promise]) => {
        try {
          const data = await promise;
          return { key, data, error: null };
        } catch (error) {
          console.error(`[fetchPlayerFullData] ${key} 로드 실패:`, error);
          return { key, data: null, error };
        }
      })
    );

    // 결과 조합
    const response: PlayerFullDataResponse = {
      success: true,
      message: '선수 데이터를 성공적으로 가져왔습니다.',
      cachedAt: Date.now()
    };

    // 각 데이터 처리
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const { key, data } = result.value;

        if (data) {
          if (key === 'allSeasons') {
            response.allSeasons = data as number[];
          } else {
            // @ts-expect-error - 동적 키 할당
            response[key] = data;
          }
        }
      }
    });

    // 시즌 데이터 병합
    if (response.allSeasons) {
      if (response.seasons && response.seasons.length > 0) {
        const combinedSeasons = [...new Set([...response.seasons, ...response.allSeasons])];
        response.seasons = combinedSeasons.sort((a, b) => b - a);
      } else {
        response.seasons = response.allSeasons;
      }
      delete response.allSeasons;
    }

    // 필수 데이터인 playerData가 없으면 실패로 처리
    if (!response.playerData) {
      const shellResult = await fetchCachedPlayerShell(playerId);
      if (shellResult.status === 'found') {
        return buildPlayerFullDataFromShell(shellResult.shell);
      }

      console.error(`[fetchPlayerFullData] playerData 없음 - playerId: ${playerId}`);
      return {
        success: false,
        message: '선수 기본 정보를 가져오는데 실패했습니다.'
      };
    }

    // 4590 표준: 선수 사진 및 팀 로고 URL 조회
    const playerNumId = response.playerData.info?.id;
    const teamId = response.playerData.statistics?.[0]?.team?.id;
    const existingPlayerPhotoUrl = response.playerData.info?.photo;
    const existingTeamLogoUrl = response.playerData.statistics?.[0]?.team?.logo;
    const statsLeague = response.playerData.statistics?.[0]?.league;

    const seasonContext = await resolvePlayerSeasonContext(playerIdNum);
    if (seasonContext.leagueId && statsLeague?.name) {
      response.currentTeamLeague = {
        id: seasonContext.leagueId,
        name: statsLeague.name,
        country: statsLeague.country,
        season: seasonContext.season,
      };
    }

    const [playerPhotoUrl, teamLogoUrl] = await Promise.all([
      existingPlayerPhotoUrl
        ? Promise.resolve(existingPlayerPhotoUrl)
        : playerNumId ? getPlayerPhotoUrl(playerNumId) : Promise.resolve('/images/placeholder-player.svg'),
      existingTeamLogoUrl
        ? Promise.resolve(existingTeamLogoUrl)
        : teamId ? getTeamLogoUrl(teamId) : Promise.resolve('/images/placeholder-team.svg')
    ]);

    response.playerPhotoUrl = playerPhotoUrl;
    response.teamLogoUrl = teamLogoUrl;

    // 4590 표준: fixtures 이미지 URL 맵 생성 (다크모드 포함)
    if (response.fixtures?.data && response.fixtures.data.length > 0) {
      const fixturesTeamLogos: Record<number, string> = {};
      const fixturesLeagueLogos: Record<number, string> = {};
      const fixturesLeagueLogosDark: Record<number, string> = {};

      response.fixtures.data.forEach(fixture => {
        if (fixture.teams?.home?.id && fixture.teams.home.logo) {
          fixturesTeamLogos[fixture.teams.home.id] = fixture.teams.home.logo;
        }
        if (fixture.teams?.away?.id && fixture.teams.away.logo) {
          fixturesTeamLogos[fixture.teams.away.id] = fixture.teams.away.logo;
        }
        if (fixture.league?.id && fixture.league.logo) {
          fixturesLeagueLogos[fixture.league.id] = fixture.league.logo;
          fixturesLeagueLogosDark[fixture.league.id] = fixture.league.logo;
        }
      });

      response.fixtures.teamLogoUrls = fixturesTeamLogos;
      response.fixtures.leagueLogoUrls = fixturesLeagueLogos;
      response.fixtures.leagueLogoDarkUrls = fixturesLeagueLogosDark;
    }

    // 4590 표준: injuries 이미지 URL 맵 생성
    if (response.injuries && response.injuries.length > 0) {
      const injuriesTeamIds = new Set<number>();

      response.injuries.forEach(injury => {
        if (injury.team?.id) injuriesTeamIds.add(injury.team.id);
      });

      if (injuriesTeamIds.size > 0) {
        response.injuriesTeamLogoUrls = await getTeamLogoUrls([...injuriesTeamIds]);
      }
    }

    // 4590 표준: transfers 이미지 URL 맵 생성
    if (response.transfers && response.transfers.length > 0) {
      const transfersTeamIds = new Set<number>();

      response.transfers.forEach(transfer => {
        if (transfer.teams?.from?.id) transfersTeamIds.add(transfer.teams.from.id);
        if (transfer.teams?.to?.id) transfersTeamIds.add(transfer.teams.to.id);
      });

      if (transfersTeamIds.size > 0) {
        response.transfersTeamLogoUrls = await getTeamLogoUrls([...transfersTeamIds]);
      }
    }

    // 4590 표준: trophies 이미지 URL 맵 생성 (다크모드 포함)
    if (response.trophies && response.trophies.length > 0) {
      const trophiesLeagueIds = new Set<number>();

      response.trophies.forEach(trophy => {
        if (trophy.leagueLogo) {
          const match = trophy.leagueLogo.match(/\/(\d+)\.(png|svg)$/);
          if (match) {
            trophiesLeagueIds.add(parseInt(match[1], 10));
          }
        }
      });

      if (trophiesLeagueIds.size > 0) {
        const [trophiesLeagueLogos, trophiesLeagueLogosDark] = await Promise.all([
          getLeagueLogoUrls([...trophiesLeagueIds]),
          getLeagueLogoUrls([...trophiesLeagueIds], true)
        ]);
        response.trophiesLeagueLogoUrls = trophiesLeagueLogos;
        response.trophiesLeagueLogoDarkUrls = trophiesLeagueLogosDark;
      }
    }

    // 4590 표준: statistics 이미지 URL 맵 생성
    if (response.statistics && response.statistics.length > 0) {
      const statsTeamLogos: Record<number, string> = {};
      const statsLeagueLogos: Record<number, string> = {};
      const statsLeagueLogoDark: Record<number, string> = {};

      response.statistics.forEach(stat => {
        if (stat.team?.id && stat.team.logo) {
          statsTeamLogos[stat.team.id] = stat.team.logo;
        }
        if (stat.league?.id && stat.league.logo) {
          statsLeagueLogos[stat.league.id] = stat.league.logo;
          statsLeagueLogoDark[stat.league.id] = stat.league.logo;
        }
      });

      response.statisticsTeamLogoUrls = statsTeamLogos;
      response.statisticsLeagueLogoUrls = statsLeagueLogos;
      response.statisticsLeagueLogoDarkUrls = statsLeagueLogoDark;
    }

    return response;

  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    };
  }
};
