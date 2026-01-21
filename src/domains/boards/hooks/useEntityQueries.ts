'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchLeagueTeams } from '@/domains/livescore/actions/footballApi';
import { fetchTeamSquad, type Player } from '@/domains/livescore/actions/teams/squad';
import { getTeamById, type TeamMapping } from '@/domains/livescore/constants/teams';

// Query Keys
export const entityKeys = {
  all: ['entity'] as const,
  leagueTeams: (leagueId: number) => [...entityKeys.all, 'leagueTeams', leagueId] as const,
  teamPlayers: (teamId: number) => [...entityKeys.all, 'teamPlayers', teamId] as const,
};

/**
 * 리그별 팀 목록을 가져오는 훅
 * - 리그 선택 시 해당 리그의 팀 목록 로드
 * - API 팀 데이터에 한국어 이름 매핑
 */
export function useLeagueTeams(leagueId: number | null) {
  return useQuery({
    queryKey: entityKeys.leagueTeams(leagueId ?? 0),
    queryFn: async (): Promise<TeamMapping[]> => {
      if (!leagueId) return [];

      const apiTeams = await fetchLeagueTeams(leagueId.toString());

      // API 팀 데이터에 한국어 이름 매핑
      const mappedTeams: TeamMapping[] = apiTeams.map(apiTeam => {
        const localTeam = getTeamById(apiTeam.id);
        return {
          id: apiTeam.id,
          name_ko: localTeam?.name_ko || apiTeam.name,
          name_en: apiTeam.name,
          country_ko: localTeam?.country_ko,
          country_en: localTeam?.country_en,
          code: localTeam?.code,
          logo: apiTeam.logo
        };
      });

      return mappedTeams;
    },
    enabled: !!leagueId,
    staleTime: 1000 * 60 * 30, // 30분
    gcTime: 1000 * 60 * 60, // 1시간
  });
}

/**
 * 팀별 선수 목록을 가져오는 훅
 * - 팀 선택 시 해당 팀의 선수 목록 로드
 * - Coach 제외하고 Player만 반환
 */
export function useTeamPlayers(teamId: number | null) {
  return useQuery({
    queryKey: entityKeys.teamPlayers(teamId ?? 0),
    queryFn: async (): Promise<Player[]> => {
      if (!teamId) return [];

      const response = await fetchTeamSquad(String(teamId));

      if (response.success && response.data) {
        // Coach 제외하고 Player만 필터링
        return response.data.filter(
          (item): item is Player => item.position !== 'Coach'
        );
      }

      return [];
    },
    enabled: !!teamId,
    staleTime: 1000 * 60 * 30, // 30분
    gcTime: 1000 * 60 * 60, // 1시간
  });
}
