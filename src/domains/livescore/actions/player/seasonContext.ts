'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { getCurrentSeasonForLeague } from '@/domains/livescore/actions/teamLeagueData';
import { getDefaultPlayerSeason } from './currentSeason';

export type PlayerSeasonContext = {
  season: number;
  strict: boolean;
  teamId: number | null;
  leagueId: number | null;
};

export async function resolvePlayerSeasonContext(playerId: number): Promise<PlayerSeasonContext> {
  try {
    const supabase = await getSupabaseServer();
    const { data: playerRow } = await supabase
      .from('football_players')
      .select('team_id')
      .eq('player_id', playerId)
      .maybeSingle();

    const teamId = typeof playerRow?.team_id === 'number' ? playerRow.team_id : null;
    if (!teamId) {
      return {
        season: getDefaultPlayerSeason(),
        strict: false,
        teamId: null,
        leagueId: null,
      };
    }

    const { data: teamRow } = await supabase
      .from('football_teams')
      .select('current_season,league_id')
      .eq('team_id', teamId)
      .maybeSingle();

    const leagueId = typeof teamRow?.league_id === 'number' ? teamRow.league_id : null;

    if (typeof teamRow?.current_season === 'number') {
      return {
        season: teamRow.current_season,
        strict: true,
        teamId,
        leagueId,
      };
    }

    if (leagueId) {
      return {
        season: await getCurrentSeasonForLeague(leagueId),
        strict: true,
        teamId,
        leagueId,
      };
    }
  } catch {
    // Fall through to the legacy season fallback only when the DB mapping is unavailable.
  }

  return {
    season: getDefaultPlayerSeason(),
    strict: false,
    teamId: null,
    leagueId: null,
  };
}
