'use server';

import { unstable_cache } from 'next/cache';
import { getSupabaseAdmin } from '@/shared/lib/supabase/server';
import {
  getAllLeagues,
  getAllTeams,
  type LeagueData,
  type TeamData,
} from '@/domains/livescore/actions/teamLeagueData';
import { TRANSFER_LEAGUE_IDS } from '@/domains/livescore/constants/transferLeagues';

type FixtureTeamRow = {
  league_id: number | null;
  season: number | null;
  home_team_id: number | null;
  away_team_id: number | null;
  round: string | null;
};

export type TransferLeagueTeamGroup = {
  league: LeagueData;
  teams: TeamData[];
  source: 'fixtures' | 'team_mapping';
  season?: number;
};

function isUsableTransferTeam(team: TeamData): boolean {
  return team.is_active === true && Boolean(team.slug);
}

function isPrimaryLeagueRound(round?: string | null): boolean {
  const value = (round || '').toLowerCase();
  if (!value) return true;

  return !(
    value.startsWith('round of') ||
    value.includes('semi-finals') ||
    value.includes('quarter-finals') ||
    value.includes('final') ||
    value === 'relegation round'
  );
}

export const getTransferLeagueTeamGroups = unstable_cache(
  async (): Promise<TransferLeagueTeamGroup[]> => {
    const supabase = getSupabaseAdmin();
    const [{ data: fixtures, error }, teams, leagues] = await Promise.all([
      supabase
        .from('fixtures')
        .select('league_id, season, home_team_id, away_team_id, round')
        .in('league_id', TRANSFER_LEAGUE_IDS),
      getAllTeams(),
      getAllLeagues(),
    ]);

    if (error) {
      console.error('[transfers] fixture team lookup failed:', error);
    }

    const teamMap = new Map(teams.map((team) => [team.id, team]));
    const leagueMap = new Map(leagues.map((league) => [league.id, league]));
    const latestSeasonByLeague = new Map<number, number>();
    const fixtureRows = ((fixtures || []) as FixtureTeamRow[]).filter(
      (row) => row.league_id && row.season
    );

    for (const row of fixtureRows) {
      const leagueId = row.league_id!;
      const season = row.season!;
      const current = latestSeasonByLeague.get(leagueId);
      if (!current || season > current) latestSeasonByLeague.set(leagueId, season);
    }

    const groups = TRANSFER_LEAGUE_IDS
      .map((leagueId): TransferLeagueTeamGroup | null => {
        const league = leagueMap.get(leagueId);
        if (!league) return null;

        const latestSeason = latestSeasonByLeague.get(leagueId);
        const fixtureTeamIds = new Set<number>();

        if (latestSeason) {
          for (const row of fixtureRows) {
            if (row.league_id !== leagueId || row.season !== latestSeason || !isPrimaryLeagueRound(row.round)) continue;
            if (row.home_team_id) fixtureTeamIds.add(row.home_team_id);
            if (row.away_team_id) fixtureTeamIds.add(row.away_team_id);
          }
        }

        const fixtureTeams = [...fixtureTeamIds]
          .map((teamId) => teamMap.get(teamId))
          .filter((team): team is TeamData => Boolean(team && isUsableTransferTeam(team)))
          .sort((a, b) => (a.name_ko || a.name_en).localeCompare(b.name_ko || b.name_en, 'ko'));

        if (fixtureTeams.length > 0) {
          return {
            league,
            teams: fixtureTeams,
            source: 'fixtures' as const,
            season: latestSeason,
          };
        }

        const fallbackTeams = teams
          .filter((team) => team.league_id === leagueId && isUsableTransferTeam(team))
          .sort((a, b) => (a.name_ko || a.name_en).localeCompare(b.name_ko || b.name_en, 'ko'));

        return {
          league,
          teams: fallbackTeams,
          source: 'team_mapping' as const,
          season: undefined,
        };
      })
      .filter((group): group is TransferLeagueTeamGroup => Boolean(group && group.teams.length > 0));

    return groups;
  },
  ['transfer-league-team-groups'],
  { revalidate: 86400, tags: ['football-teams', 'fixtures'] }
);
