'use server';

import { cache } from 'react';
import { fetchFromFootballApi } from '@/domains/livescore/actions/footballApi';
import { getCurrentSeasonForLeague, getLeagueById, getTeamById } from '@/domains/livescore/actions/teamLeagueData';

type LeagueResponse = {
  league: {
    id: number;
    name: string;
    type: string;
  };
  seasons?: Array<{
    year: number;
    current: boolean;
  }>;
};

export type CurrentTeamMainLeague = {
  leagueId: number;
  season: number;
  name: string;
};

function isUsableSeason(league: LeagueResponse, season: number): boolean {
  const seasonInfo = league.seasons?.find((item) => item.year === season);
  return seasonInfo ? seasonInfo.current !== false : true;
}

function findMainLeague(leagues: LeagueResponse[], season: number): LeagueResponse | undefined {
  return leagues.find(
    (league) =>
      isUsableSeason(league, season) &&
      league.league.type === 'League' &&
      !league.league.name.includes('Champions') &&
      !league.league.name.includes('Europa') &&
      !league.league.name.includes('Conference') &&
      !league.league.name.includes('Friendlies')
  );
}

export const resolveCurrentTeamMainLeague = cache(async (
  teamId: string | number,
  preferredSeason?: number | null
): Promise<CurrentTeamMainLeague | null> => {
  const numericTeamId = typeof teamId === 'string' ? parseInt(teamId, 10) : teamId;

  if (Number.isFinite(numericTeamId)) {
    const team = await getTeamById(numericTeamId);

    if (team?.league_id) {
      const season = preferredSeason ?? await getCurrentSeasonForLeague(team.league_id);
      const league = await getLeagueById(team.league_id);

      return {
        leagueId: team.league_id,
        season,
        name: league?.name || league?.name_ko || team.name_en || team.name_ko,
      };
    }
  }

  const currentYear = new Date().getFullYear();
  const europeanSeason = new Date().getMonth() > 6 ? currentYear : currentYear - 1;
  const seasonsToTry = [...new Set([
    currentYear,
    preferredSeason,
    europeanSeason,
  ].filter((season): season is number => typeof season === 'number'))];

  for (const season of seasonsToTry) {
    try {
      const leaguesData = await fetchFromFootballApi('leagues', { team: teamId, season });
      const leagues = (leaguesData.response || []) as LeagueResponse[];
      const mainLeague = findMainLeague(leagues, season);

      if (mainLeague) {
        return {
          leagueId: mainLeague.league.id,
          season,
          name: mainLeague.league.name,
        };
      }
    } catch {
      // Try the next season candidate.
    }
  }

  return null;
});
