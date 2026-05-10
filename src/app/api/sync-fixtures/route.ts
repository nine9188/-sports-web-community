import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/shared/lib/supabase/server';
import { getCurrentSeasonForLeague } from '@/domains/livescore/actions/teamLeagueData';
import { TRANSFER_LEAGUE_IDS } from '@/domains/livescore/constants/transferLeagues';

// 동기화 대상 리그 (하이라이트 지원 리그 + 5대 리그 전체)
const SYNC_LEAGUE_IDS = [...new Set([1, 2, 3, ...TRANSFER_LEAGUE_IDS])];

const API_BASE = 'https://v3.football.api-sports.io';
const API_KEY = process.env.FOOTBALL_API_KEY || '';

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

async function fetchFixturesForLeague(
  leagueId: number,
  season: number,
  from: string,
  to: string
): Promise<{
  fixture_id: number;
  home_team_id: number;
  away_team_id: number;
  league_id: number;
  season: number;
  match_date: string;
  status_short: string;
  round: string;
}[]> {
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
  return response.map((item: any) => ({
    fixture_id: item.fixture.id,
    home_team_id: item.teams.home.id,
    away_team_id: item.teams.away.id,
    league_id: item.league.id,
    season: item.league.season,
    match_date: item.fixture.date,
    status_short: item.fixture.status.short,
    round: item.league.round || '',
  }));
}

export async function GET(request: Request) {
  // Vercel Cron 또는 수동 호출 인증 (개발 환경에서는 스킵)
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
  // 과거 60일 ~ 미래 28일 범위
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

      const upsertRows = rows.map(r => ({ ...r, updated_at: now.toISOString() }));

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
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[sync-fixtures] league=${leagueId} error:`, msg);
      results[leagueId] = { fetched: 0, upserted: 0, error: msg };
    }
  }

  // 60일 이상 지난 경기 삭제
  const cutoff = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
  const { error: deleteError } = await supabase
    .from('fixtures')
    .delete()
    .lt('match_date', cutoff);

  if (deleteError) {
    console.error('[sync-fixtures] 오래된 경기 삭제 오류:', deleteError.message);
  }

  const total = Object.values(results).reduce((s, r) => s + r.upserted, 0);

  return NextResponse.json({ ok: true, from, to, total, results });
}
