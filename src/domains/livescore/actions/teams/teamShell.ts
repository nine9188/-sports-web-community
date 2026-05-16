import { cache } from 'react';
import { fetchFromFootballApi } from '@/domains/livescore/actions/footballApi';
import { getTeamLinkSlug } from '@/domains/livescore/utils/entityLinks';
import { getSupabaseAdmin, getSupabaseServer } from '@/shared/lib/supabase/server';
import { getCurrentSeasonForLeague } from '@/domains/livescore/actions/teamLeagueData';

type TeamShellRow = {
  team_id: number;
  name: string | null;
  name_ko: string | null;
  display_name: string | null;
  short_name: string | null;
  code: string | null;
  logo_url: string | null;
  logo_cached_url: string | null;
  league_id: number | null;
  league_name: string | null;
  league_name_ko: string | null;
  league_logo_url: string | null;
  country: string | null;
  country_ko: string | null;
  founded: number | null;
  venue_id: number | null;
  venue_name: string | null;
  venue_city: string | null;
  venue_capacity: number | null;
  venue_address: string | null;
  venue_surface: string | null;
  current_season: number | null;
  slug: string | null;
  is_active: boolean | null;
  last_api_sync: string | null;
};

type ApiTeamResponse = {
  team?: {
    id?: number;
    name?: string | null;
    code?: string | null;
    country?: string | null;
    founded?: number | null;
    logo?: string | null;
  };
  venue?: {
    id?: number | null;
    name?: string | null;
    address?: string | null;
    city?: string | null;
    capacity?: number | null;
    surface?: string | null;
    image?: string | null;
  };
};

type ApiLeagueResponse = {
  league?: {
    id?: number;
    name?: string | null;
    type?: string | null;
    logo?: string | null;
  };
  country?: {
    name?: string | null;
  };
  seasons?: Array<{
    year?: number;
    current?: boolean;
  }>;
};

export type TeamShell = {
  id: number;
  name: string;
  name_en?: string | null;
  name_ko?: string | null;
  displayName?: string | null;
  shortName?: string | null;
  slug?: string | null;
  code?: string | null;
  country?: string | null;
  country_ko?: string | null;
  founded?: number | null;
  logo?: string | null;
  league?: {
    id: number;
    name: string;
    name_ko?: string | null;
    country?: string | null;
    logo?: string | null;
    season?: number | null;
  } | null;
  venue?: {
    id?: number | null;
    name?: string | null;
    address?: string | null;
    city?: string | null;
    capacity?: number | null;
    surface?: string | null;
    image?: string | null;
  } | null;
  lastApiSync?: string | null;
};

export type TeamShellResult =
  | { status: 'found'; shell: TeamShell; source: 'db' | 'api' }
  | { status: 'missing' }
  | { status: 'temporary-error'; error: string };

function isTemporaryTeamDataError(error?: string): boolean {
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

function buildSlug(shell: Pick<TeamShell, 'id' | 'name' | 'name_en' | 'name_ko' | 'displayName' | 'shortName'>): string {
  return getTeamLinkSlug({
    id: shell.id,
    name: shell.name_en || shell.name,
    name_ko: shell.name_ko || shell.name,
    display_name: shell.displayName || shell.name,
    short_name: shell.shortName || undefined,
  });
}

async function fetchTeamRow(teamId: number): Promise<TeamShellRow | null> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('football_teams')
    .select('team_id,name,name_ko,display_name,short_name,code,logo_url,logo_cached_url,league_id,league_name,league_name_ko,league_logo_url,country,country_ko,founded,venue_id,venue_name,venue_city,venue_capacity,venue_address,venue_surface,current_season,slug,is_active,last_api_sync')
    .eq('team_id', teamId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as TeamShellRow | null) ?? null;
}

function buildShellFromRow(row: TeamShellRow): TeamShell {
  const nameEn = row.display_name || row.name || `Team ${row.team_id}`;
  const name = row.name_ko || nameEn;
  const shell: TeamShell = {
    id: row.team_id,
    name,
    name_en: row.name,
    name_ko: row.name_ko,
    displayName: row.display_name,
    shortName: row.short_name,
    slug: row.slug,
    code: row.code,
    country: row.country_ko || row.country,
    country_ko: row.country_ko,
    founded: row.founded,
    logo: row.logo_cached_url || row.logo_url,
    league: row.league_id ? {
      id: row.league_id,
      name: row.league_name_ko || row.league_name || '',
      name_ko: row.league_name_ko,
      country: row.country_ko || row.country,
      logo: row.league_logo_url,
      season: row.current_season,
    } : null,
    venue: row.venue_id || row.venue_name ? {
      id: row.venue_id,
      name: row.venue_name,
      address: row.venue_address,
      city: row.venue_city,
      capacity: row.venue_capacity,
      surface: row.venue_surface,
    } : null,
    lastApiSync: row.last_api_sync,
  };

  return {
    ...shell,
    slug: shell.slug || buildSlug(shell),
  };
}

function chooseMainLeague(leagues: ApiLeagueResponse[], season: number): ApiLeagueResponse | null {
  const usable = leagues.filter((item) => {
    const seasonInfo = item.seasons?.find((entry) => entry.year === season);
    return seasonInfo ? seasonInfo.current !== false : true;
  });

  return usable.find((item) =>
    item.league?.type === 'League' &&
    !String(item.league?.name || '').includes('Champions') &&
    !String(item.league?.name || '').includes('Europa') &&
    !String(item.league?.name || '').includes('Conference') &&
    !String(item.league?.name || '').includes('Friendlies')
  ) || usable[0] || null;
}

async function fetchTeamLeagueFromApi(teamId: number): Promise<ApiLeagueResponse | null> {
  const year = new Date().getFullYear();
  const europeanSeason = new Date().getMonth() > 6 ? year : year - 1;
  const seasons = [...new Set([year, europeanSeason])];

  for (const season of seasons) {
    try {
      const data = await fetchFromFootballApi('leagues', { team: teamId, season });
      const leagues = (data?.response || []) as ApiLeagueResponse[];
      const mainLeague = chooseMainLeague(leagues, season);
      if (mainLeague?.league?.id) return mainLeague;
    } catch {
      continue;
    }
  }

  return null;
}

function buildShellFromApi(raw: ApiTeamResponse, league: ApiLeagueResponse | null): TeamShell | null {
  const team = raw.team;
  if (!team?.id || !team.name) return null;

  const shell: TeamShell = {
    id: team.id,
    name: team.name,
    name_en: team.name,
    name_ko: null,
    displayName: team.name,
    shortName: team.code || null,
    code: team.code || null,
    country: team.country || league?.country?.name || null,
    country_ko: null,
    founded: team.founded || null,
    logo: team.logo || null,
    league: league?.league?.id ? {
      id: league.league.id,
      name: league.league.name || '',
      name_ko: null,
      country: league.country?.name || team.country || null,
      logo: league.league.logo || null,
      season: league.seasons?.find((season) => season.current)?.year || null,
    } : null,
    venue: raw.venue ? {
      id: raw.venue.id,
      name: raw.venue.name,
      address: raw.venue.address,
      city: raw.venue.city,
      capacity: raw.venue.capacity,
      surface: raw.venue.surface,
      image: raw.venue.image,
    } : null,
  };

  return {
    ...shell,
    slug: buildSlug(shell),
  };
}

async function upsertTeamShellFromApi(shell: TeamShell, raw: ApiTeamResponse): Promise<void> {
  if (!shell.league?.id) return;

  try {
    const now = new Date().toISOString();
    const currentSeason = shell.league.season || await getCurrentSeasonForLeague(shell.league.id);
    const supabase = getSupabaseAdmin();

    await supabase
      .from('football_teams')
      .upsert({
        team_id: shell.id,
        name: shell.name_en || shell.name,
        display_name: shell.displayName || shell.name_en || shell.name,
        short_name: shell.shortName || null,
        code: shell.code || null,
        logo_url: shell.logo || null,
        league_id: shell.league.id,
        league_name: shell.league.name,
        league_logo_url: shell.league.logo || null,
        country: shell.country || shell.league.country || '',
        founded: shell.founded || null,
        venue_id: shell.venue?.id || null,
        venue_name: shell.venue?.name || null,
        venue_city: shell.venue?.city || null,
        venue_capacity: shell.venue?.capacity || null,
        venue_address: shell.venue?.address || null,
        venue_surface: shell.venue?.surface || null,
        current_season: currentSeason,
        slug: shell.slug || null,
        api_data: {
          ...raw,
          lastSync: now,
          source: 'teams-shell',
        },
        last_api_sync: now,
        updated_at: now,
      }, { onConflict: 'team_id' });
  } catch {
    // Shell writes are opportunistic and should never block rendering.
  }
}

async function fetchTeamShellFromApi(teamId: number): Promise<TeamShellResult> {
  try {
    const data = await fetchFromFootballApi('teams', { id: teamId });
    const raw = data?.response?.[0] as ApiTeamResponse | undefined;
    if (!raw?.team) return { status: 'missing' };

    const league = await fetchTeamLeagueFromApi(teamId);
    const shell = buildShellFromApi(raw, league);
    if (!shell) return { status: 'missing' };

    await upsertTeamShellFromApi(shell, raw);
    return { status: 'found', shell, source: 'api' };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isTemporaryTeamDataError(message)) {
      return { status: 'temporary-error', error: message };
    }

    return { status: 'missing' };
  }
}

async function fetchTeamShellInternal(teamId: string): Promise<TeamShellResult> {
  const id = Number(teamId);
  if (!Number.isFinite(id) || id <= 0) {
    return { status: 'missing' };
  }

  try {
    const row = await fetchTeamRow(id);
    if (row && row.is_active !== false) {
      return { status: 'found', shell: buildShellFromRow(row), source: 'db' };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { status: 'temporary-error', error: message };
  }

  return fetchTeamShellFromApi(id);
}

export const fetchCachedTeamShell = cache(fetchTeamShellInternal);
