'use client';

import { useQuery, useQueries, UseQueryResult } from '@tanstack/react-query';
import { fetchPlayerFullData, PlayerFullDataResponse } from '../actions/player/data';
import { playerKeys } from '@/shared/constants/queryKeys';
import { CACHE_STRATEGIES } from '@/shared/constants/cacheConfig';
import {
  PlayerData,
  PlayerStatistic,
  FixtureData,
  TransferData,
  TrophyData,
  InjuryData,
  RankingsData,
} from '../types/player';

// ============================================
// 타입 정의
// ============================================

export type PlayerTabType = 'stats' | 'fixtures' | 'trophies' | 'transfers' | 'injuries' | 'rankings';

interface UsePlayerQueryOptions {
  enabled?: boolean;
}

interface PlayerStatsData {
  seasons: number[];
  statistics: PlayerStatistic[];
  // 4590 표준: 이미지 Storage URL
  teamLogoUrls?: Record<number, string>;
  leagueLogoUrls?: Record<number, string>;
  leagueLogoDarkUrls?: Record<number, string>;
}

interface PlayerFixturesData {
  data: FixtureData[];
  status?: string;
  message?: string;
  // 4590 표준: 이미지 Storage URL
  teamLogoUrls?: Record<number, string>;
  leagueLogoUrls?: Record<number, string>;
  leagueLogoDarkUrls?: Record<number, string>;
}

// 4590 표준: transfers 데이터 + 이미지 URL
interface PlayerTransfersData {
  data: TransferData[];
  teamLogoUrls: Record<number, string>;
}

// 4590 표준: trophies 데이터 + 이미지 URL
interface PlayerTrophiesData {
  data: TrophyData[];
  leagueLogoUrls: Record<number, string>;
  leagueLogoDarkUrls: Record<number, string>;
}

// ============================================
// 개별 훅들
// ============================================

/**
 * 선수 기본 정보 조회
 */
export function usePlayerInfo(
  playerId: string | null,
  options: UsePlayerQueryOptions = {}
): UseQueryResult<PlayerData | null> {
  return useQuery({
    queryKey: playerKeys.info(playerId || ''),
    queryFn: async () => {
      if (!playerId) return null;
      const response = await fetchPlayerFullData(playerId, {
        fetchSeasons: false,
        fetchStats: false,
      });
      return response.success ? response.playerData || null : null;
    },
    enabled: !!playerId && (options.enabled !== false),
    ...CACHE_STRATEGIES.STABLE_DATA,
  });
}

/**
 * 선수 통계 조회 (시즌 목록 포함)
 * 4590 표준: 이미지 URL 포함
 */
export function usePlayerStats(
  playerId: string | null,
  options: UsePlayerQueryOptions = {}
): UseQueryResult<PlayerStatsData | null> {
  return useQuery({
    queryKey: playerKeys.stats(playerId || ''),
    queryFn: async () => {
      if (!playerId) return null;
      const response = await fetchPlayerFullData(playerId, {
        fetchSeasons: true,
        fetchStats: true,
      });
      if (!response.success) return null;
      return {
        seasons: response.seasons || [],
        statistics: response.statistics || [],
        teamLogoUrls: response.statisticsTeamLogoUrls || {},
        leagueLogoUrls: response.statisticsLeagueLogoUrls || {},
        leagueLogoDarkUrls: response.statisticsLeagueLogoDarkUrls || {},
      };
    },
    enabled: !!playerId && (options.enabled !== false),
    ...CACHE_STRATEGIES.OCCASIONALLY_UPDATED,
  });
}

/**
 * 선수 경기 일정 조회
 */
export function usePlayerFixtures(
  playerId: string | null,
  options: UsePlayerQueryOptions = {}
): UseQueryResult<PlayerFixturesData | null> {
  return useQuery({
    queryKey: playerKeys.fixtures(playerId || ''),
    queryFn: async () => {
      if (!playerId) return null;
      const response = await fetchPlayerFullData(playerId, {
        fetchSeasons: false,
        fetchStats: false,
        fetchFixtures: true,
      });
      if (!response.success) return null;
      return response.fixtures || { data: [] };
    },
    enabled: !!playerId && (options.enabled !== false),
    ...CACHE_STRATEGIES.OCCASIONALLY_UPDATED,
  });
}

/**
 * 선수 이적 기록 조회
 * 4590 표준: 이미지 URL 포함
 */
export function usePlayerTransfers(
  playerId: string | null,
  options: UsePlayerQueryOptions = {}
): UseQueryResult<PlayerTransfersData | null> {
  return useQuery({
    queryKey: playerKeys.transfers(playerId || ''),
    queryFn: async () => {
      if (!playerId) return null;
      const response = await fetchPlayerFullData(playerId, {
        fetchSeasons: false,
        fetchStats: false,
        fetchTransfers: true,
      });
      if (!response.success) return null;
      return {
        data: response.transfers || [],
        teamLogoUrls: response.transfersTeamLogoUrls || {},
      };
    },
    enabled: !!playerId && (options.enabled !== false),
    ...CACHE_STRATEGIES.STATIC_DATA,
  });
}

/**
 * 선수 트로피 조회
 * 4590 표준: 이미지 URL 포함
 */
export function usePlayerTrophies(
  playerId: string | null,
  options: UsePlayerQueryOptions = {}
): UseQueryResult<PlayerTrophiesData | null> {
  return useQuery({
    queryKey: playerKeys.trophies(playerId || ''),
    queryFn: async () => {
      if (!playerId) return null;
      const response = await fetchPlayerFullData(playerId, {
        fetchSeasons: false,
        fetchStats: false,
        fetchTrophies: true,
      });
      if (!response.success) return null;
      return {
        data: response.trophies || [],
        leagueLogoUrls: response.trophiesLeagueLogoUrls || {},
        leagueLogoDarkUrls: response.trophiesLeagueLogoDarkUrls || {},
      };
    },
    enabled: !!playerId && (options.enabled !== false),
    ...CACHE_STRATEGIES.STATIC_DATA,
  });
}

/**
 * 선수 부상 기록 조회
 */
export function usePlayerInjuries(
  playerId: string | null,
  options: UsePlayerQueryOptions = {}
): UseQueryResult<InjuryData[] | null> {
  return useQuery({
    queryKey: playerKeys.injuries(playerId || ''),
    queryFn: async () => {
      if (!playerId) return null;
      const response = await fetchPlayerFullData(playerId, {
        fetchSeasons: false,
        fetchStats: false,
        fetchInjuries: true,
      });
      return response.success ? response.injuries || [] : null;
    },
    enabled: !!playerId && (options.enabled !== false),
    ...CACHE_STRATEGIES.STABLE_DATA,
  });
}

/**
 * 선수 랭킹 조회
 */
export function usePlayerRankings(
  playerId: string | null,
  options: UsePlayerQueryOptions = {}
): UseQueryResult<RankingsData | null> {
  return useQuery({
    queryKey: playerKeys.rankings(playerId || ''),
    queryFn: async () => {
      if (!playerId) return null;
      const response = await fetchPlayerFullData(playerId, {
        fetchSeasons: false,
        fetchStats: false,
        fetchRankings: true,
      });
      return response.success ? response.rankings || null : null;
    },
    enabled: !!playerId && (options.enabled !== false),
    ...CACHE_STRATEGIES.STABLE_DATA,
  });
}

// ============================================
// 통합 훅
// ============================================

interface UsePlayerTabDataOptions {
  playerId: string | null;
  currentTab: PlayerTabType;
  initialData?: Partial<PlayerFullDataResponse>;
}

interface UsePlayerTabDataReturn {
  // 선수 기본 정보
  playerData: PlayerData | null;
  playerDataLoading: boolean;
  playerDataError: Error | null;

  // 현재 탭 데이터
  currentTabData: unknown;
  currentTabLoading: boolean;
  currentTabError: Error | null;

  // 개별 탭 데이터 (캐시된 상태)
  statsData: PlayerStatsData | null;
  fixturesData: PlayerFixturesData | null;
  transfersData: TransferData[] | null;
  trophiesData: TrophyData[] | null;
  injuriesData: InjuryData[] | null;
  rankingsData: RankingsData | null;

  // 4590 표준: 이미지 URL 맵
  trophiesLeagueLogoUrls: Record<number, string>;
  trophiesLeagueLogoDarkUrls: Record<number, string>;
  transfersTeamLogoUrls: Record<number, string>;
  injuriesTeamLogoUrls: Record<number, string>;

  // 유틸리티
  isLoading: boolean;
  error: Error | null;
  refetchCurrentTab: () => void;
}

/**
 * 선수 탭 데이터 통합 훅
 *
 * 현재 탭에 따라 필요한 데이터만 로드하고,
 * 이미 로드된 탭 데이터는 React Query 캐시에서 자동으로 제공됩니다.
 *
 * @example
 * ```tsx
 * const {
 *   playerData,
 *   currentTabData,
 *   isLoading,
 *   error,
 * } = usePlayerTabData({
 *   playerId: '123',
 *   currentTab: 'stats',
 *   initialData: serverData,
 * });
 * ```
 */
export function usePlayerTabData({
  playerId,
  currentTab,
  initialData,
}: UsePlayerTabDataOptions): UsePlayerTabDataReturn {
  // 서버에서 가져온 시간 (initialData가 fresh함을 알리기 위함)
  // initialDataUpdatedAt을 설정하면 staleTime 동안 refetch하지 않음
  const initialDataUpdatedAt = initialData ? Date.now() : undefined;

  // 선수 기본 정보 (항상 로드)
  const playerInfoQuery = useQuery({
    queryKey: playerKeys.info(playerId || ''),
    queryFn: async () => {
      if (!playerId) return null;
      const response = await fetchPlayerFullData(playerId, {
        fetchSeasons: false,
        fetchStats: false,
      });
      return response.success ? response.playerData || null : null;
    },
    enabled: !!playerId,
    initialData: initialData?.playerData,
    initialDataUpdatedAt: initialData?.playerData ? initialDataUpdatedAt : undefined,
    ...CACHE_STRATEGIES.STABLE_DATA,
  });

  // 탭별 쿼리 설정
  const tabQueries = useQueries({
    queries: [
      // Stats (4590 표준: 이미지 URL 포함)
      {
        queryKey: playerKeys.stats(playerId || ''),
        queryFn: async (): Promise<PlayerStatsData | null> => {
          if (!playerId) return null;
          const response = await fetchPlayerFullData(playerId, {
            fetchSeasons: true,
            fetchStats: true,
          });
          if (!response.success) return null;
          return {
            seasons: response.seasons || [],
            statistics: response.statistics || [],
            teamLogoUrls: response.statisticsTeamLogoUrls || {},
            leagueLogoUrls: response.statisticsLeagueLogoUrls || {},
            leagueLogoDarkUrls: response.statisticsLeagueLogoDarkUrls || {},
          };
        },
        enabled: !!playerId && currentTab === 'stats',
        initialData: initialData?.statistics
          ? {
              seasons: initialData.seasons || [],
              statistics: initialData.statistics,
              teamLogoUrls: initialData.statisticsTeamLogoUrls || {},
              leagueLogoUrls: initialData.statisticsLeagueLogoUrls || {},
              leagueLogoDarkUrls: initialData.statisticsLeagueLogoDarkUrls || {},
            }
          : undefined,
        initialDataUpdatedAt: initialData?.statistics ? initialDataUpdatedAt : undefined,
        ...CACHE_STRATEGIES.OCCASIONALLY_UPDATED,
      },
      // Fixtures
      {
        queryKey: playerKeys.fixtures(playerId || ''),
        queryFn: async (): Promise<PlayerFixturesData | null> => {
          if (!playerId) return null;
          const response = await fetchPlayerFullData(playerId, {
            fetchSeasons: false,
            fetchStats: false,
            fetchFixtures: true,
          });
          if (!response.success) return null;
          return response.fixtures || { data: [] };
        },
        enabled: !!playerId && currentTab === 'fixtures',
        initialData: initialData?.fixtures,
        initialDataUpdatedAt: initialData?.fixtures ? initialDataUpdatedAt : undefined,
        ...CACHE_STRATEGIES.OCCASIONALLY_UPDATED,
      },
      // Transfers (4590 표준: 이미지 URL 포함)
      {
        queryKey: playerKeys.transfers(playerId || ''),
        queryFn: async (): Promise<PlayerTransfersData | null> => {
          if (!playerId) return null;
          const response = await fetchPlayerFullData(playerId, {
            fetchSeasons: false,
            fetchStats: false,
            fetchTransfers: true,
          });
          if (!response.success) return null;
          return {
            data: response.transfers || [],
            teamLogoUrls: response.transfersTeamLogoUrls || {},
          };
        },
        enabled: !!playerId && currentTab === 'transfers',
        initialData: initialData?.transfers
          ? { data: initialData.transfers, teamLogoUrls: initialData.transfersTeamLogoUrls || {} }
          : undefined,
        initialDataUpdatedAt: initialData?.transfers ? initialDataUpdatedAt : undefined,
        ...CACHE_STRATEGIES.STATIC_DATA,
      },
      // Trophies (4590 표준: 이미지 URL 포함)
      {
        queryKey: playerKeys.trophies(playerId || ''),
        queryFn: async (): Promise<PlayerTrophiesData | null> => {
          if (!playerId) return null;
          const response = await fetchPlayerFullData(playerId, {
            fetchSeasons: false,
            fetchStats: false,
            fetchTrophies: true,
          });
          if (!response.success) return null;
          return {
            data: response.trophies || [],
            leagueLogoUrls: response.trophiesLeagueLogoUrls || {},
            leagueLogoDarkUrls: response.trophiesLeagueLogoDarkUrls || {},
          };
        },
        enabled: !!playerId && currentTab === 'trophies',
        initialData: initialData?.trophies
          ? {
              data: initialData.trophies,
              leagueLogoUrls: initialData.trophiesLeagueLogoUrls || {},
              leagueLogoDarkUrls: initialData.trophiesLeagueLogoDarkUrls || {},
            }
          : undefined,
        initialDataUpdatedAt: initialData?.trophies ? initialDataUpdatedAt : undefined,
        ...CACHE_STRATEGIES.STATIC_DATA,
      },
      // Injuries (4590 표준: URL 맵 포함)
      {
        queryKey: playerKeys.injuries(playerId || ''),
        queryFn: async (): Promise<{ data: InjuryData[]; teamLogoUrls: Record<number, string> } | null> => {
          if (!playerId) return null;
          const response = await fetchPlayerFullData(playerId, {
            fetchSeasons: false,
            fetchStats: false,
            fetchInjuries: true,
          });
          return response.success
            ? { data: response.injuries || [], teamLogoUrls: response.injuriesTeamLogoUrls || {} }
            : null;
        },
        enabled: !!playerId && currentTab === 'injuries',
        initialData: initialData?.injuries
          ? { data: initialData.injuries, teamLogoUrls: initialData.injuriesTeamLogoUrls || {} }
          : undefined,
        initialDataUpdatedAt: initialData?.injuries ? initialDataUpdatedAt : undefined,
        ...CACHE_STRATEGIES.STABLE_DATA,
      },
      // Rankings
      {
        queryKey: playerKeys.rankings(playerId || ''),
        queryFn: async (): Promise<RankingsData | null> => {
          if (!playerId) return null;
          const response = await fetchPlayerFullData(playerId, {
            fetchSeasons: false,
            fetchStats: false,
            fetchRankings: true,
          });
          return response.success ? response.rankings || null : null;
        },
        enabled: !!playerId && currentTab === 'rankings',
        initialData: initialData?.rankings,
        initialDataUpdatedAt: initialData?.rankings ? initialDataUpdatedAt : undefined,
        ...CACHE_STRATEGIES.STABLE_DATA,
      },
    ],
  });

  // 탭 인덱스 매핑
  const tabIndexMap: Record<PlayerTabType, number> = {
    stats: 0,
    fixtures: 1,
    transfers: 2,
    trophies: 3,
    injuries: 4,
    rankings: 5,
  };

  const currentTabIndex = tabIndexMap[currentTab];
  const currentTabQuery = tabQueries[currentTabIndex];

  // 4590 표준: 데이터에서 URL 맵 분리
  const transfersQueryData = tabQueries[2]?.data as PlayerTransfersData | null;
  const trophiesQueryData = tabQueries[3]?.data as PlayerTrophiesData | null;
  const injuriesQueryData = tabQueries[4]?.data as { data: InjuryData[]; teamLogoUrls: Record<number, string> } | null;

  return {
    // 선수 기본 정보
    playerData: playerInfoQuery.data ?? null,
    playerDataLoading: playerInfoQuery.isLoading,
    playerDataError: playerInfoQuery.error,

    // 현재 탭 데이터
    currentTabData: currentTabQuery?.data ?? null,
    currentTabLoading: currentTabQuery?.isLoading ?? false,
    currentTabError: currentTabQuery?.error ?? null,

    // 개별 탭 데이터
    statsData: (tabQueries[0]?.data as PlayerStatsData) ?? null,
    fixturesData: (tabQueries[1]?.data as PlayerFixturesData) ?? null,
    transfersData: transfersQueryData?.data ?? null,
    trophiesData: trophiesQueryData?.data ?? null,
    injuriesData: injuriesQueryData?.data ?? null,
    rankingsData: (tabQueries[5]?.data as RankingsData) ?? null,

    // 4590 표준: 이미지 URL 맵
    trophiesLeagueLogoUrls: trophiesQueryData?.leagueLogoUrls ?? {},
    trophiesLeagueLogoDarkUrls: trophiesQueryData?.leagueLogoDarkUrls ?? {},
    transfersTeamLogoUrls: transfersQueryData?.teamLogoUrls ?? {},
    injuriesTeamLogoUrls: injuriesQueryData?.teamLogoUrls ?? {},

    // 유틸리티
    isLoading: playerInfoQuery.isLoading || (currentTabQuery?.isLoading ?? false),
    error: playerInfoQuery.error || currentTabQuery?.error || null,
    refetchCurrentTab: () => currentTabQuery?.refetch(),
  };
}

// ============================================
// 모든 탭 프리페치 훅 (선택적)
// ============================================

/**
 * 모든 탭 데이터를 한 번에 프리페치하는 훅
 * 네트워크 상황이 좋을 때 미리 로드해두면 탭 전환이 즉시 이루어집니다.
 */
export function usePlayerAllTabs(
  playerId: string | null,
  options: UsePlayerQueryOptions = {}
) {
  const queries = useQueries({
    queries: [
      {
        queryKey: playerKeys.info(playerId || ''),
        queryFn: async () => {
          if (!playerId) return null;
          const response = await fetchPlayerFullData(playerId, {
            fetchSeasons: false,
            fetchStats: false,
          });
          return response.success ? response.playerData || null : null;
        },
        enabled: !!playerId && (options.enabled !== false),
        ...CACHE_STRATEGIES.STABLE_DATA,
      },
      {
        queryKey: playerKeys.stats(playerId || ''),
        queryFn: async () => {
          if (!playerId) return null;
          const response = await fetchPlayerFullData(playerId, {
            fetchSeasons: true,
            fetchStats: true,
          });
          if (!response.success) return null;
          return {
            seasons: response.seasons || [],
            statistics: response.statistics || [],
            teamLogoUrls: response.statisticsTeamLogoUrls || {},
            leagueLogoUrls: response.statisticsLeagueLogoUrls || {},
            leagueLogoDarkUrls: response.statisticsLeagueLogoDarkUrls || {},
          };
        },
        enabled: !!playerId && (options.enabled !== false),
        ...CACHE_STRATEGIES.OCCASIONALLY_UPDATED,
      },
      {
        queryKey: playerKeys.fixtures(playerId || ''),
        queryFn: async () => {
          if (!playerId) return null;
          const response = await fetchPlayerFullData(playerId, {
            fetchSeasons: false,
            fetchStats: false,
            fetchFixtures: true,
          });
          if (!response.success) return null;
          return response.fixtures || { data: [] };
        },
        enabled: !!playerId && (options.enabled !== false),
        ...CACHE_STRATEGIES.OCCASIONALLY_UPDATED,
      },
      {
        queryKey: playerKeys.transfers(playerId || ''),
        queryFn: async () => {
          if (!playerId) return null;
          const response = await fetchPlayerFullData(playerId, {
            fetchSeasons: false,
            fetchStats: false,
            fetchTransfers: true,
          });
          if (!response.success) return null;
          return {
            data: response.transfers || [],
            teamLogoUrls: response.transfersTeamLogoUrls || {},
          };
        },
        enabled: !!playerId && (options.enabled !== false),
        ...CACHE_STRATEGIES.STATIC_DATA,
      },
      {
        queryKey: playerKeys.trophies(playerId || ''),
        queryFn: async () => {
          if (!playerId) return null;
          const response = await fetchPlayerFullData(playerId, {
            fetchSeasons: false,
            fetchStats: false,
            fetchTrophies: true,
          });
          if (!response.success) return null;
          return {
            data: response.trophies || [],
            leagueLogoUrls: response.trophiesLeagueLogoUrls || {},
            leagueLogoDarkUrls: response.trophiesLeagueLogoDarkUrls || {},
          };
        },
        enabled: !!playerId && (options.enabled !== false),
        ...CACHE_STRATEGIES.STATIC_DATA,
      },
      {
        queryKey: playerKeys.injuries(playerId || ''),
        queryFn: async () => {
          if (!playerId) return null;
          const response = await fetchPlayerFullData(playerId, {
            fetchSeasons: false,
            fetchStats: false,
            fetchInjuries: true,
          });
          return response.success ? response.injuries || [] : null;
        },
        enabled: !!playerId && (options.enabled !== false),
        ...CACHE_STRATEGIES.STABLE_DATA,
      },
      {
        queryKey: playerKeys.rankings(playerId || ''),
        queryFn: async () => {
          if (!playerId) return null;
          const response = await fetchPlayerFullData(playerId, {
            fetchSeasons: false,
            fetchStats: false,
            fetchRankings: true,
          });
          return response.success ? response.rankings || null : null;
        },
        enabled: !!playerId && (options.enabled !== false),
        ...CACHE_STRATEGIES.STABLE_DATA,
      },
    ],
  });

  const isLoading = queries.some((q) => q.isLoading);
  const error = queries.find((q) => q.error)?.error || null;

  return {
    playerData: queries[0]?.data as PlayerData | null,
    statsData: queries[1]?.data as PlayerStatsData | null,
    fixturesData: queries[2]?.data as PlayerFixturesData | null,
    transfersData: queries[3]?.data as TransferData[] | null,
    trophiesData: queries[4]?.data as TrophyData[] | null,
    injuriesData: queries[5]?.data as InjuryData[] | null,
    rankingsData: queries[6]?.data as RankingsData | null,
    isLoading,
    error,
    queries,
  };
}
