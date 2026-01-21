'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchTeamFullData, TeamResponse } from '@/domains/livescore/actions/teams/team';
import { Match } from '@/domains/livescore/actions/teams/matches';
import { Standing } from '@/domains/livescore/actions/teams/standings';
import { Player, Coach } from '@/domains/livescore/actions/teams/squad';
import { PlayerStats } from '@/domains/livescore/actions/teams/player-stats';

// Query Keys
export const teamKeys = {
  all: ['team'] as const,
  detail: (teamId: string) => [...teamKeys.all, teamId] as const,
  info: (teamId: string) => [...teamKeys.detail(teamId), 'info'] as const,
  matches: (teamId: string) => [...teamKeys.detail(teamId), 'matches'] as const,
  squad: (teamId: string) => [...teamKeys.detail(teamId), 'squad'] as const,
  playerStats: (teamId: string) => [...teamKeys.detail(teamId), 'playerStats'] as const,
  standings: (teamId: string) => [...teamKeys.detail(teamId), 'standings'] as const,
};

// 팀 기본 정보 훅
export function useTeamInfo(teamId: string | null, enabled = true) {
  return useQuery<TeamResponse | null>({
    queryKey: teamId ? teamKeys.info(teamId) : ['team', 'info', 'empty'],
    queryFn: async () => {
      if (!teamId) throw new Error('Team ID is required');
      const result = await fetchTeamFullData(teamId, {
        fetchMatches: false,
        fetchSquad: false,
        fetchPlayerStats: false,
        fetchStandings: false,
      });
      if (!result.success) {
        throw new Error(result.message || '팀 정보를 불러오는데 실패했습니다.');
      }
      return result.teamData || null;
    },
    enabled: enabled && !!teamId,
    staleTime: 1000 * 60 * 10, // 10분
    gcTime: 1000 * 60 * 30, // 30분
  });
}

// 경기 일정 훅
export function useTeamMatches(teamId: string | null, enabled = true) {
  return useQuery<Match[] | null>({
    queryKey: teamId ? teamKeys.matches(teamId) : ['team', 'matches', 'empty'],
    queryFn: async () => {
      if (!teamId) throw new Error('Team ID is required');
      const result = await fetchTeamFullData(teamId, {
        fetchMatches: true,
        fetchSquad: false,
        fetchPlayerStats: false,
        fetchStandings: false,
      });
      if (!result.success) {
        throw new Error(result.message || '경기 일정을 불러오는데 실패했습니다.');
      }
      return result.matches?.data || null;
    },
    enabled: enabled && !!teamId,
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 30,
  });
}

// 선수단 훅
export function useTeamSquad(teamId: string | null, enabled = true) {
  return useQuery<(Player | Coach)[] | null>({
    queryKey: teamId ? teamKeys.squad(teamId) : ['team', 'squad', 'empty'],
    queryFn: async () => {
      if (!teamId) throw new Error('Team ID is required');
      const result = await fetchTeamFullData(teamId, {
        fetchMatches: false,
        fetchSquad: true,
        fetchPlayerStats: false,
        fetchStandings: false,
      });
      if (!result.success) {
        throw new Error(result.message || '선수단 정보를 불러오는데 실패했습니다.');
      }
      return result.squad?.data || null;
    },
    enabled: enabled && !!teamId,
    staleTime: 1000 * 60 * 30, // 30분
    gcTime: 1000 * 60 * 60, // 1시간
  });
}

// 선수 통계 훅
export function useTeamPlayerStats(teamId: string | null, enabled = true) {
  return useQuery<Record<number, PlayerStats> | null>({
    queryKey: teamId ? teamKeys.playerStats(teamId) : ['team', 'playerStats', 'empty'],
    queryFn: async () => {
      if (!teamId) throw new Error('Team ID is required');
      const result = await fetchTeamFullData(teamId, {
        fetchMatches: false,
        fetchSquad: false,
        fetchPlayerStats: true,
        fetchStandings: false,
      });
      if (!result.success) {
        throw new Error(result.message || '선수 통계를 불러오는데 실패했습니다.');
      }
      return result.playerStats?.data || null;
    },
    enabled: enabled && !!teamId,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });
}

// 순위 훅
export function useTeamStandings(teamId: string | null, enabled = true) {
  return useQuery<Standing[] | null>({
    queryKey: teamId ? teamKeys.standings(teamId) : ['team', 'standings', 'empty'],
    queryFn: async () => {
      if (!teamId) throw new Error('Team ID is required');
      const result = await fetchTeamFullData(teamId, {
        fetchMatches: false,
        fetchSquad: false,
        fetchPlayerStats: false,
        fetchStandings: true,
      });
      if (!result.success) {
        throw new Error(result.message || '순위 정보를 불러오는데 실패했습니다.');
      }
      return result.standings?.data || null;
    },
    enabled: enabled && !!teamId,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });
}

// 통합 데이터 훅
interface TeamDataState {
  teamData: TeamResponse | null;
  matchesData: { success: boolean; data?: Match[]; message: string } | null;
  squadData: { success: boolean; data?: (Player | Coach)[]; message: string } | null;
  playerStats: { success: boolean; data?: Record<number, PlayerStats>; message: string } | null;
  standingsData: { success: boolean; data?: Standing[]; message: string } | null;
}

export interface UseTeamDataOptions {
  teamId: string | null;
  initialData?: Partial<TeamDataState>;
}

export function useTeamTabData({ teamId, initialData }: UseTeamDataOptions) {
  const queryClient = useQueryClient();

  // 초기 데이터가 있으면 캐시에 미리 설정
  if (teamId && initialData) {
    if (initialData.teamData !== undefined) {
      queryClient.setQueryData(teamKeys.info(teamId), initialData.teamData);
    }
    if (initialData.matchesData?.data !== undefined) {
      queryClient.setQueryData(teamKeys.matches(teamId), initialData.matchesData.data);
    }
    if (initialData.squadData?.data !== undefined) {
      queryClient.setQueryData(teamKeys.squad(teamId), initialData.squadData.data);
    }
    if (initialData.playerStats?.data !== undefined) {
      queryClient.setQueryData(teamKeys.playerStats(teamId), initialData.playerStats.data);
    }
    if (initialData.standingsData?.data !== undefined) {
      queryClient.setQueryData(teamKeys.standings(teamId), initialData.standingsData.data);
    }
  }

  // 각 데이터 훅
  const teamInfo = useTeamInfo(teamId);
  const matches = useTeamMatches(teamId);
  const squad = useTeamSquad(teamId);
  const playerStats = useTeamPlayerStats(teamId);
  const standings = useTeamStandings(teamId);

  // 특정 탭 데이터 프리페치
  const prefetchTab = async (tab: 'overview' | 'fixtures' | 'squad' | 'standings' | 'stats') => {
    if (!teamId) return;

    switch (tab) {
      case 'overview':
        await Promise.all([
          queryClient.prefetchQuery({
            queryKey: teamKeys.matches(teamId),
            queryFn: async () => {
              const result = await fetchTeamFullData(teamId, { fetchMatches: true });
              return result.matches?.data || null;
            },
          }),
          queryClient.prefetchQuery({
            queryKey: teamKeys.standings(teamId),
            queryFn: async () => {
              const result = await fetchTeamFullData(teamId, { fetchStandings: true });
              return result.standings?.data || null;
            },
          }),
        ]);
        break;
      case 'fixtures':
        await queryClient.prefetchQuery({
          queryKey: teamKeys.matches(teamId),
          queryFn: async () => {
            const result = await fetchTeamFullData(teamId, { fetchMatches: true });
            return result.matches?.data || null;
          },
        });
        break;
      case 'squad':
        await Promise.all([
          queryClient.prefetchQuery({
            queryKey: teamKeys.squad(teamId),
            queryFn: async () => {
              const result = await fetchTeamFullData(teamId, { fetchSquad: true });
              return result.squad?.data || null;
            },
          }),
          queryClient.prefetchQuery({
            queryKey: teamKeys.playerStats(teamId),
            queryFn: async () => {
              const result = await fetchTeamFullData(teamId, { fetchPlayerStats: true });
              return result.playerStats?.data || null;
            },
          }),
        ]);
        break;
      case 'standings':
        await queryClient.prefetchQuery({
          queryKey: teamKeys.standings(teamId),
          queryFn: async () => {
            const result = await fetchTeamFullData(teamId, { fetchStandings: true });
            return result.standings?.data || null;
          },
        });
        break;
      case 'stats':
        await queryClient.prefetchQuery({
          queryKey: teamKeys.playerStats(teamId),
          queryFn: async () => {
            const result = await fetchTeamFullData(teamId, { fetchPlayerStats: true });
            return result.playerStats?.data || null;
          },
        });
        break;
    }
  };

  return {
    teamId,
    teamData: teamInfo.data ?? initialData?.teamData ?? null,
    matchesData: matches.data ?? initialData?.matchesData?.data ?? null,
    squadData: squad.data ?? initialData?.squadData?.data ?? null,
    playerStats: playerStats.data ?? initialData?.playerStats?.data ?? null,
    standingsData: standings.data ?? initialData?.standingsData?.data ?? null,

    // 로딩 상태
    isLoading: teamInfo.isLoading,
    isMatchesLoading: matches.isLoading,
    isSquadLoading: squad.isLoading,
    isPlayerStatsLoading: playerStats.isLoading,
    isStandingsLoading: standings.isLoading,

    // 에러 상태
    error: teamInfo.error?.message || null,

    // 탭 데이터 로드 여부
    isTabLoaded: (tab: 'overview' | 'fixtures' | 'squad' | 'standings' | 'stats') => {
      switch (tab) {
        case 'overview':
          return matches.data !== undefined && standings.data !== undefined;
        case 'fixtures':
          return matches.data !== undefined;
        case 'squad':
          return squad.data !== undefined && playerStats.data !== undefined;
        case 'standings':
          return standings.data !== undefined;
        case 'stats':
          return playerStats.data !== undefined;
        default:
          return false;
      }
    },

    // 프리페치 함수
    prefetchTab,

    // 리페치 함수
    refetch: () => {
      teamInfo.refetch();
    },
  };
}
