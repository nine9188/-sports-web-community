import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/shared/lib/supabase/server';
import { getCurrentSeasonForLeague } from '@/domains/livescore/actions/teamLeagueData';
import { TRANSFER_LEAGUE_IDS } from '@/domains/livescore/constants/transferLeagues';
import { CLUB_FRIENDLY_LEAGUE_IDS } from '@/shared/constants/leagueIds';

// Highlight-supported leagues plus the transfer league set and club friendlies, including Asian Cup (7).
const SYNC_LEAGUE_IDS = [...new Set([1, 2, 3, 7, ...TRANSFER_LEAGUE_IDS, ...CLUB_FRIENDLY_LEAGUE_IDS])];

const API_BASE = 'https://v3.football.api-sports.io';
const API_KEY = process.env.FOOTBALL_API_KEY || '';

type FixtureShellSyncRow = {
  fixture_id: number;
  home_team_id: number;
  away_team_id: number;
  league_id: number;
  season: number;
  match_date: string;
  status_short: string;
  status_long: string;
  home_goals: number | null;
  away_goals: number | null;
  venue_name: string | null;
  venue_city: string | null;
  round: string;
};

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function fetchFixturesForLeague(
  leagueId: number,
  season: number,
  from: string,
  to: string
): Promise<FixtureShellSyncRow[]> {
  const params = new URLSearchParams({
    league: String(leagueId),
    season: String(season),
    from,
    to,
    timezone: 'Asia/Seoul',
  });

  const res = await fetch(`${API_BASE}/fixtures?${params}`, {
    headers: {
      'x-rapidapi-host': 'v3.football.api-sports.io',
      'x-rapidapi-key': API_KEY,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    console.error(`[sync-fixtures] API error league=${leagueId} status=${res.status}`);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json();
  if (data.errors && typeof data.errors === 'object' && Object.keys(data.errors).length > 0) {
    return [];
  }

  const response = data?.response;
  if (!Array.isArray(response)) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return response.map((item: any): FixtureShellSyncRow => ({
    fixture_id: item.fixture.id,
    home_team_id: item.teams.home.id,
    away_team_id: item.teams.away.id,
    league_id: item.league.id,
    season: item.league.season,
    match_date: item.fixture.date,
    status_short: item.fixture.status.short,
    status_long: item.fixture.status.long || '',
    home_goals: item.goals?.home ?? null,
    away_goals: item.goals?.away ?? null,
    venue_name: item.fixture.venue?.name || null,
    venue_city: item.fixture.venue?.city || null,
    round: item.league.round || '',
  }));
}

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  if (!API_KEY) {
    return NextResponse.json({ error: 'FOOTBALL_API_KEY not set' }, { status: 500 });
  }

  const now = new Date();
  const from = toDateStr(new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000));
  const to = toDateStr(new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000));

  const supabase = getSupabaseAdmin();
  const results: Record<string, { fetched: number; upserted: number; error?: string }> = {};

  for (const leagueId of SYNC_LEAGUE_IDS) {
    try {
      const season = await getCurrentSeasonForLeague(leagueId);
      const rows = await fetchFixturesForLeague(leagueId, season, from, to);

      if (!rows.length) {
        results[leagueId] = { fetched: 0, upserted: 0 };
        continue;
      }

      const upsertRows = rows.map((row) => ({ ...row, updated_at: now.toISOString() }));
      const { error } = await supabase
        .from('fixtures')
        .upsert(upsertRows, { onConflict: 'fixture_id' });

      if (error) {
        console.error(`[sync-fixtures] DB upsert error league=${leagueId}:`, error.message);
        results[leagueId] = { fetched: rows.length, upserted: 0, error: error.message };
      } else {
        results[leagueId] = { fetched: rows.length, upserted: rows.length };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[sync-fixtures] league=${leagueId} error:`, message);
      results[leagueId] = { fetched: 0, upserted: 0, error: message };
    }
  }

  const total = Object.values(results).reduce((sum, result) => sum + result.upserted, 0);

  return NextResponse.json({
    ok: true,
    from,
    to,
    total,
    results,
    cleanup: 'skipped: fixture shell rows are retained for crawled match URLs',
  });
}
