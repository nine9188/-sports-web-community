'use server';

import { getTeamLogoUrl, getLeagueLogoUrl } from '@/domains/livescore/actions/images';
import { getTeamsByIds } from '@/domains/livescore/actions/teamLeagueData';
import type { TeamData } from '@/domains/livescore/actions/teamLeagueData';
import type { MatchCardData } from '@/shared/types/matchCard';

export interface MatchCardDataResult {
  success: boolean;
  data?: MatchCardData;
  error?: string;
}

/**
 * Create match card data for the editor.
 *
 * The stored card keeps both display names and canonical slug fields so the
 * read-only renderer can build the same match URL everywhere.
 */
export async function createMatchCardData(
  matchData: MatchCardData
): Promise<MatchCardDataResult> {
  try {
    if (!matchData?.teams) {
      return { success: false, error: 'Match data is required.' };
    }

    const { teams, league } = matchData;

    const homeTeamId = typeof teams.home?.id === 'string'
      ? parseInt(teams.home.id, 10)
      : teams.home?.id;
    const awayTeamId = typeof teams.away?.id === 'string'
      ? parseInt(teams.away.id, 10)
      : teams.away?.id;
    const leagueId = typeof league?.id === 'string'
      ? parseInt(league.id, 10)
      : league?.id;

    const teamIds = [homeTeamId, awayTeamId].filter((id): id is number => Boolean(id));

    const [homeTeamLogo, awayTeamLogo, leagueLogo, teamMap] = await Promise.all([
      homeTeamId ? getTeamLogoUrl(homeTeamId) : Promise.resolve('/images/placeholder-team.svg'),
      awayTeamId ? getTeamLogoUrl(awayTeamId) : Promise.resolve('/images/placeholder-team.svg'),
      leagueId ? getLeagueLogoUrl(leagueId) : Promise.resolve('/images/placeholder-league.svg'),
      teamIds.length ? getTeamsByIds(teamIds) : Promise.resolve({} as Record<number, TeamData>),
    ]);

    const homeTeamMapping = homeTeamId ? teamMap[homeTeamId] : null;
    const awayTeamMapping = awayTeamId ? teamMap[awayTeamId] : null;

    const updatedMatchData: MatchCardData = {
      ...matchData,
      teams: {
        home: {
          ...teams.home,
          name_en: homeTeamMapping?.name_en || teams.home.name_en || teams.home.name,
          name_ko: homeTeamMapping?.name_ko || teams.home.name_ko || null,
          slug: homeTeamMapping?.slug || teams.home.slug || null,
          logo: homeTeamLogo,
        },
        away: {
          ...teams.away,
          name_en: awayTeamMapping?.name_en || teams.away.name_en || teams.away.name,
          name_ko: awayTeamMapping?.name_ko || teams.away.name_ko || null,
          slug: awayTeamMapping?.slug || teams.away.slug || null,
          logo: awayTeamLogo,
        },
      },
      league: {
        ...league,
        logo: leagueLogo,
      },
    };

    return {
      success: true,
      data: updatedMatchData,
    };
  } catch (error) {
    console.error('[createMatchCardData] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
