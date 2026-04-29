'use server';

import { getSupabaseAdmin } from '@/shared/lib/supabase/server';
import type { MatchHighlight } from '@/domains/livescore/types/highlight';
import { HIGHLIGHT_SUPPORTED_LEAGUE_IDS } from '@/domains/livescore/constants/youtube-channels';

const NOT_FOUND_SENTINEL = 'NOT_FOUND';

/**
 * Read a match highlight from the DB only.
 *
 * YouTube API calls are handled by /api/sync-highlights so match pages do not
 * burn search quota or write NOT_FOUND rows during normal user traffic.
 */
export async function getMatchHighlight(
  fixtureId: number,
  _homeTeamId: number,
  _awayTeamId: number,
  leagueId: number,
  _matchDate?: string
): Promise<MatchHighlight | null> {
  if (
    !HIGHLIGHT_SUPPORTED_LEAGUE_IDS.includes(
      leagueId as (typeof HIGHLIGHT_SUPPORTED_LEAGUE_IDS)[number]
    )
  ) {
    return null;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('match_highlights')
    .select('*')
    .eq('fixture_id', fixtureId)
    .single();

  if (error || !data || data.video_id === NOT_FOUND_SENTINEL) {
    return null;
  }

  return data as MatchHighlight;
}
