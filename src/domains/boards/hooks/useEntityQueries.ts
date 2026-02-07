'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchLeagueTeams } from '@/domains/livescore/actions/footballApi';
import { fetchTeamSquad, type Player } from '@/domains/livescore/actions/teams/squad';
import { getTeamById, type TeamMapping } from '@/domains/livescore/constants/teams';
import { getPlayersKoreanNames } from '@/domains/livescore/actions/player/getKoreanName';
import { getLeagueLogoUrls, getTeamLogoUrls, getPlayerPhotoUrls } from '@/domains/livescore/actions/images';

// Query Keys
export const entityKeys = {
  all: ['entity'] as const,
  leagueLogos: (leagueIds: number[]) => [...entityKeys.all, 'leagueLogos', leagueIds.join(',')] as const,
  leagueTeams: (leagueId: number) => [...entityKeys.all, 'leagueTeams', leagueId] as const,
  teamPlayers: (teamId: number) => [...entityKeys.all, 'teamPlayers', teamId] as const,
};

// 4590 표준: 반환 타입
interface LeagueTeamsResult {
  teams: TeamMapping[];
  teamLogoUrls: Record<number, string>;
}

interface TeamPlayersResult {
  players: Player[];
  koreanNames: Record<number, string | null>;
  playerPhotoUrls: Record<number, string>;
  teamLogoUrl?: string;
}

// 리그 로고 반환 타입 (light/dark)
interface LeagueLogosResult {
  light: Record<number, string>;
  dark: Record<number, string>;
}

/**
 * 리그 로고 URL을 가져오는 훅
 * - 4590 표준: Storage URL 반환 (light/dark 둘 다)
 */
export function useLeagueLogos(leagueIds: number[]) {
  const query = useQuery({
    queryKey: entityKeys.leagueLogos(leagueIds),
    queryFn: async (): Promise<LeagueLogosResult> => {
      if (leagueIds.length === 0) return { light: {}, dark: {} };
      const [light, dark] = await Promise.all([
        getLeagueLogoUrls(leagueIds, false),
        getLeagueLogoUrls(leagueIds, true),
      ]);
      return { light, dark };
    },
    enabled: leagueIds.length > 0,
    staleTime: 1000 * 60 * 60, // 1시간
    gcTime: 1000 * 60 * 60 * 24, // 24시간
  });

  return {
    ...query,
    data: query.data?.light || {},
    dataDark: query.data?.dark || {},
  };
}

/**
 * 리그별 팀 목록을 가져오는 훅
 * - 리그 선택 시 해당 리그의 팀 목록 로드
 * - API 팀 데이터에 한국어 이름 매핑
 * - 4590 표준: 팀 로고 Storage URL 포함
 */
export function useLeagueTeams(leagueId: number | null) {
  const query = useQuery({
    queryKey: entityKeys.leagueTeams(leagueId ?? 0),
    queryFn: async (): Promise<LeagueTeamsResult> => {
      if (!leagueId) return { teams: [], teamLogoUrls: {} };

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

      // 4590 표준: 팀 로고 Storage URL 일괄 조회
      const teamIds = mappedTeams.map(t => t.id);
      const teamLogoUrls = await getTeamLogoUrls(teamIds);

      return { teams: mappedTeams, teamLogoUrls };
    },
    enabled: !!leagueId,
    staleTime: 1000 * 60 * 30, // 30분
    gcTime: 1000 * 60 * 60, // 1시간
  });

  // 호환성을 위해 data와 teamLogoUrls를 분리하여 반환
  return {
    ...query,
    data: query.data?.teams || [],
    teamLogoUrls: query.data?.teamLogoUrls || {},
  };
}

/**
 * 팀별 선수 목록을 가져오는 훅
 * - 팀 선택 시 해당 팀의 선수 목록 로드
 * - Coach 제외하고 Player만 반환
 * - 선수 한글명도 함께 반환
 * - 4590 표준: 선수 사진 및 팀 로고 Storage URL 포함
 */
export function useTeamPlayers(teamId: number | null) {
  const query = useQuery({
    queryKey: entityKeys.teamPlayers(teamId ?? 0),
    queryFn: async (): Promise<TeamPlayersResult> => {
      if (!teamId) return { players: [], koreanNames: {}, playerPhotoUrls: {} };

      const response = await fetchTeamSquad(String(teamId));

      if (response.success && response.data) {
        // Coach 제외하고 Player만 필터링
        const players = response.data.filter(
          (item): item is Player => item.position !== 'Coach'
        );

        // 선수 한글명 일괄 조회 (DB)
        const playerIds = players.map(p => p.id);
        const [koreanNames, playerPhotoUrls, teamLogoUrls] = await Promise.all([
          getPlayersKoreanNames(playerIds),
          getPlayerPhotoUrls(playerIds),
          getTeamLogoUrls([teamId]),
        ]);

        return {
          players,
          koreanNames,
          playerPhotoUrls,
          teamLogoUrl: teamLogoUrls[teamId],
        };
      }

      return { players: [], koreanNames: {}, playerPhotoUrls: {} };
    },
    enabled: !!teamId,
    staleTime: 1000 * 60 * 30, // 30분
    gcTime: 1000 * 60 * 60, // 1시간
  });

  // 호환성을 위해 분리하여 반환
  return {
    ...query,
    data: query.data
      ? { players: query.data.players, koreanNames: query.data.koreanNames }
      : { players: [], koreanNames: {} },
    playerPhotoUrls: query.data?.playerPhotoUrls || {},
    teamLogoUrl: query.data?.teamLogoUrl,
  };
}
