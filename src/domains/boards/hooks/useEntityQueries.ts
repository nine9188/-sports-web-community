'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchLeagueTeams } from '@/domains/livescore/actions/footballApi';
import { fetchTeamSquad, type Player } from '@/domains/livescore/actions/teams/squad';
import { useTeamLeague } from '@/shared/context/TeamLeagueContext';
import { getPlayersKoreanNames } from '@/domains/livescore/actions/player/getKoreanName';
import { getLeagueLogoUrls, getTeamLogoUrls, getPlayerPhotoUrls } from '@/domains/livescore/actions/images';

export interface TeamMapping {
  id: number;
  name_ko: string;
  name_en: string;
  country_ko?: string | null;
  country_en?: string | null;
  code?: string | null;
  logo?: string;
}

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

interface LeagueLogosResult {
  light: Record<number, string>;
  dark: Record<number, string>;
}

const leagueTeamsCache = new Map<number, LeagueTeamsResult>();
const teamPlayersCache = new Map<number, TeamPlayersResult>();
const leagueLogosCache = new Map<string, LeagueLogosResult>();

export function useLeagueLogos(leagueIds: number[]) {
  const [data, setData] = useState<LeagueLogosResult>({ light: {}, dark: {} });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const key = leagueIds.join(',');

  useEffect(() => {
    if (leagueIds.length === 0) {
      setData({ light: {}, dark: {} });
      return;
    }

    let cancelled = false;

    async function loadLogos() {
      const cached = leagueLogosCache.get(key);
      if (cached) {
        setData(cached);
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const [light, dark] = await Promise.all([
          getLeagueLogoUrls(leagueIds, false),
          getLeagueLogoUrls(leagueIds, true),
        ]);
        const nextData = { light, dark };
        leagueLogosCache.set(key, nextData);
        if (!cancelled) setData(nextData);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err : new Error('Failed to load league logos'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadLogos();

    return () => {
      cancelled = true;
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    data: data.light,
    dataDark: data.dark,
    isLoading,
    error,
  };
}

export function useLeagueTeams(leagueId: number | null) {
  const { getTeamById, getTeamsByLeagueId } = useTeamLeague();
  const [result, setResult] = useState<LeagueTeamsResult>({ teams: [], teamLogoUrls: {} });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!leagueId) {
      setResult({ teams: [], teamLogoUrls: {} });
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    const currentLeagueId = leagueId;

    async function loadTeams() {
      const cached = leagueTeamsCache.get(currentLeagueId);
      if (cached) {
        if (!cancelled) {
          setResult(cached);
          setIsLoading(false);
          setError(null);
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const localTeams = getTeamsByLeagueId(currentLeagueId);
        const teams: TeamMapping[] = localTeams.length > 0
          ? localTeams.map(team => ({
              id: team.id,
              name_ko: team.name_ko || team.name_en,
              name_en: team.name_en,
              country_ko: team.country_ko,
              country_en: team.country_en,
              code: team.code,
            }))
          : (await fetchLeagueTeams(currentLeagueId.toString())).map(apiTeam => {
              const localTeam = getTeamById(apiTeam.id);
              return {
                id: apiTeam.id,
                name_ko: localTeam?.name_ko || apiTeam.name,
                name_en: apiTeam.name,
                country_ko: localTeam?.country_ko,
                country_en: localTeam?.country_en,
                code: localTeam?.code,
                logo: apiTeam.logo,
              };
            });
        const teamLogoUrls = await getTeamLogoUrls(teams.map(team => team.id));
        const nextResult = { teams, teamLogoUrls };
        leagueTeamsCache.set(currentLeagueId, nextResult);
        if (!cancelled) setResult(nextResult);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to load teams'));
          setResult({ teams: [], teamLogoUrls: {} });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadTeams();

    return () => {
      cancelled = true;
    };
  }, [leagueId, getTeamById, getTeamsByLeagueId]);

  return {
    data: result.teams,
    teamLogoUrls: result.teamLogoUrls,
    isLoading,
    error,
  };
}

export function useTeamPlayers(teamId: number | null) {
  const [result, setResult] = useState<TeamPlayersResult>({
    players: [],
    koreanNames: {},
    playerPhotoUrls: {},
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadPlayers = useCallback(async (cancelledRef?: { current: boolean }) => {
    if (!teamId) {
      setResult({ players: [], koreanNames: {}, playerPhotoUrls: {} });
      setIsLoading(false);
      setError(null);
      return;
    }

    const cached = teamPlayersCache.get(teamId);
    if (cached) {
      if (!cancelledRef?.current) {
        setResult(cached);
        setIsLoading(false);
        setError(null);
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchTeamSquad(String(teamId));
      if (!response.success || !response.data) {
        if (!cancelledRef?.current) setResult({ players: [], koreanNames: {}, playerPhotoUrls: {} });
        return;
      }

      const players = response.data.filter((item): item is Player => item.position !== 'Coach');
      const playerIds = players.map(player => player.id);
      const [koreanNames, playerPhotoUrls, teamLogoUrls] = await Promise.all([
        getPlayersKoreanNames(playerIds),
        getPlayerPhotoUrls(playerIds),
        getTeamLogoUrls([teamId]),
      ]);

      if (!cancelledRef?.current) {
        const nextResult = {
          players,
          koreanNames,
          playerPhotoUrls,
          teamLogoUrl: teamLogoUrls[teamId],
        };
        teamPlayersCache.set(teamId, nextResult);
        setResult(nextResult);
      }
    } catch (err) {
      if (!cancelledRef?.current) {
        setError(err instanceof Error ? err : new Error('Failed to load players'));
        setResult({ players: [], koreanNames: {}, playerPhotoUrls: {} });
      }
    } finally {
      if (!cancelledRef?.current) setIsLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    const cancelledRef = { current: false };
    loadPlayers(cancelledRef);
    return () => {
      cancelledRef.current = true;
    };
  }, [loadPlayers]);

  return {
    data: {
      players: result.players,
      koreanNames: result.koreanNames,
    },
    playerPhotoUrls: result.playerPhotoUrls,
    teamLogoUrl: result.teamLogoUrl,
    isLoading,
    error,
    refetch: () => loadPlayers(),
  };
}
