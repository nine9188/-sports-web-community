import { cache } from 'react';
import { getSupabaseAdmin } from '@/shared/lib/supabase/server';
import { getLeagueById } from '@/domains/livescore/actions/teamLeagueData';
import { fetchCachedMatchData } from '@/domains/livescore/utils/matchDataApi';

type FixtureShellRow = {
  fixture_id: number;
  home_team_id: number | null;
  away_team_id: number | null;
  league_id: number | null;
  season: number | null;
  match_date: string | null;
  status_short: string | null;
  status_long: string | null;
  home_goals: number | null;
  away_goals: number | null;
  venue_name: string | null;
  venue_city: string | null;
  round: string | null;
  updated_at?: string | null;
};

type TeamShellRow = {
  team_id: number;
  name: string | null;
  name_ko: string | null;
  display_name: string | null;
  short_name: string | null;
  slug: string | null;
  logo_url: string | null;
  logo_cached_url: string | null;
};

export type MatchShell = {
  id: number;
  status: {
    code: string;
    name: string;
    elapsed: number | null;
  };
  time: {
    timestamp: number;
    date: string;
    timezone: string;
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season?: number;
    round?: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      name_en?: string | null;
      name_ko?: string | null;
      slug?: string | null;
      logo: string;
      winner: boolean | null;
    };
    away: {
      id: number;
      name: string;
      name_en?: string | null;
      name_ko?: string | null;
      slug?: string | null;
      logo: string;
      winner: boolean | null;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  venue?: {
    name?: string | null;
    city?: string | null;
  };
};

export type MatchShellResult =
  | { status: 'found'; shell: MatchShell; source: 'db' | 'api' }
  | { status: 'missing' }
  | { status: 'temporary-error'; error: string };

const FINISHED_STATUS_CODES = new Set(['FT', 'AET', 'PEN']);
const STABLE_SHELL_STATUS_CODES = new Set(['FT', 'AET', 'PEN', 'CANC', 'ABD', 'AWD', 'WO']);
const SHELL_REFRESH_BEFORE_KICKOFF_MS = 10 * 60 * 1000;

function statusNameFromCode(code: string): string {
  switch (code) {
    case 'TBD':
      return 'Time to be defined';
    case 'NS':
      return 'Not started';
    case '1H':
    case '2H':
    case 'ET':
    case 'BT':
    case 'P':
    case 'LIVE':
      return 'Live';
    case 'HT':
      return 'Halftime';
    case 'FT':
      return 'Match finished';
    case 'AET':
      return 'Match finished after extra time';
    case 'PEN':
      return 'Match finished after penalties';
    case 'PST':
      return 'Postponed';
    case 'CANC':
      return 'Cancelled';
    case 'ABD':
      return 'Abandoned';
    case 'SUSP':
      return 'Suspended';
    default:
      return code || '';
  }
}

function toTimestamp(value: string | null | undefined): number {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? Math.floor(time / 1000) : 0;
}

function isTemporaryMatchDataError(error?: string): boolean {
  const text = String(error || '').toLowerCase();
  return [
    'fetch failed',
    'network',
    'timeout',
    'timed out',
    'econnreset',
    'etimedout',
    'enotfound',
    'rate',
    '429',
    '502',
    '503',
    '504',
  ].some((needle) => text.includes(needle));
}

function shouldUseFixtureShellRow(row: FixtureShellRow): boolean {
  const statusCode = String(row.status_short || '');
  if (STABLE_SHELL_STATUS_CODES.has(statusCode)) {
    return true;
  }

  const matchTime = row.match_date ? new Date(row.match_date).getTime() : NaN;
  if (!Number.isFinite(matchTime)) {
    return false;
  }

  return Date.now() < matchTime - SHELL_REFRESH_BEFORE_KICKOFF_MS;
}

async function fetchFixtureShellRow(matchId: number): Promise<FixtureShellRow | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('fixtures')
    .select('fixture_id,home_team_id,away_team_id,league_id,season,match_date,status_short,status_long,home_goals,away_goals,venue_name,venue_city,round,updated_at')
    .eq('fixture_id', matchId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as FixtureShellRow | null) ?? null;
}

async function fetchTeamShellRows(teamIds: number[]): Promise<Record<number, TeamShellRow>> {
  const ids = [...new Set(teamIds.filter((id) => Number.isFinite(id) && id > 0))];
  if (!ids.length) return {};

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('football_teams')
    .select('team_id,name,name_ko,display_name,short_name,slug,logo_url,logo_cached_url')
    .in('team_id', ids);

  if (error) {
    throw new Error(error.message);
  }

  const result: Record<number, TeamShellRow> = {};
  for (const row of (data || []) as TeamShellRow[]) {
    result[row.team_id] = row;
  }

  return result;
}

async function buildShellFromFixtureRow(row: FixtureShellRow): Promise<MatchShell | null> {
  const fixtureId = Number(row.fixture_id);
  const homeTeamId = Number(row.home_team_id);
  const awayTeamId = Number(row.away_team_id);
  const leagueId = Number(row.league_id);

  if (!Number.isFinite(fixtureId) || fixtureId <= 0) return null;
  if (!Number.isFinite(homeTeamId) || homeTeamId <= 0) return null;
  if (!Number.isFinite(awayTeamId) || awayTeamId <= 0) return null;

  const [teamMap, leagueMapping] = await Promise.all([
    fetchTeamShellRows([homeTeamId, awayTeamId]),
    Number.isFinite(leagueId) && leagueId > 0 ? getLeagueById(leagueId) : Promise.resolve(null),
  ]);

  const homeTeam = teamMap[homeTeamId];
  const awayTeam = teamMap[awayTeamId];
  const matchDate = row.match_date || '';
  const statusCode = row.status_short || '';

  return {
    id: fixtureId,
    status: {
      code: statusCode,
      name: row.status_long || statusNameFromCode(statusCode),
      elapsed: null,
    },
    time: {
      timestamp: toTimestamp(matchDate),
      date: matchDate,
      timezone: 'Asia/Seoul',
    },
    league: {
      id: Number.isFinite(leagueId) ? leagueId : 0,
      name: leagueMapping?.name_ko || leagueMapping?.name || '',
      country: leagueMapping?.country_ko || leagueMapping?.country || '',
      logo: leagueMapping?.logo || '',
      flag: leagueMapping?.flag || '',
      season: row.season || undefined,
      round: row.round || undefined,
    },
    teams: {
      home: {
        id: homeTeamId,
        name: homeTeam?.name_ko || homeTeam?.display_name || homeTeam?.name || `Team ${homeTeamId}`,
        name_en: homeTeam?.name || null,
        name_ko: homeTeam?.name_ko || null,
        slug: homeTeam?.slug || null,
        logo: homeTeam?.logo_cached_url || homeTeam?.logo_url || '',
        winner: null,
      },
      away: {
        id: awayTeamId,
        name: awayTeam?.name_ko || awayTeam?.display_name || awayTeam?.name || `Team ${awayTeamId}`,
        name_en: awayTeam?.name || null,
        name_ko: awayTeam?.name_ko || null,
        slug: awayTeam?.slug || null,
        logo: awayTeam?.logo_cached_url || awayTeam?.logo_url || '',
        winner: null,
      },
    },
    goals: {
      home: row.home_goals ?? null,
      away: row.away_goals ?? null,
    },
    venue: {
      name: row.venue_name,
      city: row.venue_city,
    },
  };
}

async function upsertFixtureShellFromApi(shell: MatchShell): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    await supabase
      .from('fixtures')
      .upsert({
        fixture_id: shell.id,
        home_team_id: shell.teams.home.id,
        away_team_id: shell.teams.away.id,
        league_id: shell.league.id,
        season: shell.league.season ?? null,
        match_date: shell.time.date,
        status_short: shell.status.code,
        status_long: shell.status.name,
        home_goals: shell.goals.home,
        away_goals: shell.goals.away,
        venue_name: shell.venue?.name ?? null,
        venue_city: shell.venue?.city ?? null,
        round: shell.league.round ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'fixture_id' });
  } catch {
    // Shell writes are opportunistic and should never block rendering.
  }
}

async function fetchMatchShellFromApi(matchId: number): Promise<MatchShellResult> {
  const matchData = await fetchCachedMatchData(String(matchId));

  if (!matchData.success || !matchData.data) {
    if (isTemporaryMatchDataError(matchData.error)) {
      return { status: 'temporary-error', error: matchData.error || 'Temporary match API error' };
    }

    return { status: 'missing' };
  }

  const data = matchData.data;
  const shell: MatchShell = {
    id: data.fixture.id,
    status: {
      code: data.fixture.status.short,
      name: data.fixture.status.long,
      elapsed: data.fixture.status.elapsed,
    },
    time: {
      timestamp: data.fixture.timestamp,
      date: data.fixture.date,
      timezone: data.fixture.timezone || 'UTC',
    },
    league: {
      id: data.league.id,
      name: data.league.name_ko || data.league.name,
      country: data.league.country,
      logo: data.league.logo,
      flag: data.league.flag,
      season: data.league.season,
      round: data.league.round,
    },
    teams: {
      home: {
        id: data.teams.home.id,
        name: data.teams.home.name_ko || data.teams.home.name,
        name_en: data.teams.home.name_en || data.teams.home.name,
        name_ko: data.teams.home.name_ko || null,
        logo: data.teams.home.logo,
        winner: data.teams.home.winner,
      },
      away: {
        id: data.teams.away.id,
        name: data.teams.away.name_ko || data.teams.away.name,
        name_en: data.teams.away.name_en || data.teams.away.name,
        name_ko: data.teams.away.name_ko || null,
        logo: data.teams.away.logo,
        winner: data.teams.away.winner,
      },
    },
    goals: {
      home: data.goals.home,
      away: data.goals.away,
    },
    venue: {
      name: data.fixture.venue?.name ?? null,
      city: data.fixture.venue?.city ?? null,
    },
  };

  await upsertFixtureShellFromApi(shell);
  return { status: 'found', shell, source: 'api' };
}

async function fetchMatchShellInternal(matchId: string): Promise<MatchShellResult> {
  const id = Number(matchId);
  if (!Number.isFinite(id) || id <= 0) {
    return { status: 'missing' };
  }

  let fallbackShell: MatchShell | null = null;

  try {
    const row = await fetchFixtureShellRow(id);
    if (row) {
      const shell = await buildShellFromFixtureRow(row);
      if (shell) {
        if (shouldUseFixtureShellRow(row)) {
          return { status: 'found', shell, source: 'db' };
        }

        fallbackShell = shell;
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { status: 'temporary-error', error: message };
  }

  const apiResult = await fetchMatchShellFromApi(id);
  if (apiResult.status === 'temporary-error' && fallbackShell) {
    return { status: 'found', shell: fallbackShell, source: 'db' };
  }

  return apiResult;
}

export function isFinishedMatchStatus(statusCode: string | null | undefined): boolean {
  return FINISHED_STATUS_CODES.has(String(statusCode || ''));
}

export const fetchCachedMatchShell = cache(fetchMatchShellInternal);
