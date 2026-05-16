import { cache } from 'react';
import { fetchFromFootballApi } from '@/domains/livescore/actions/footballApi';
import { getPlayerLinkSlug } from '@/domains/livescore/utils/entityLinks';
import { getSupabaseAdmin, getSupabaseServer } from '@/shared/lib/supabase/server';
import { getDefaultPlayerSeason, getPlayerSeasonCandidates } from './currentSeason';

type PlayerShellRow = {
  player_id: number;
  name: string | null;
  korean_name: string | null;
  display_name: string | null;
  team_id: number | null;
  team_name: string | null;
  position: string | null;
  number: number | null;
  nationality: string | null;
  nationality_ko: string | null;
  age: number | null;
  height: number | null;
  weight: number | null;
  photo_url: string | null;
  photo_cached_url: string | null;
  slug: string | null;
  is_active: boolean | null;
  last_api_sync: string | null;
};

type TeamShellRow = {
  team_id: number;
  name: string | null;
  name_ko: string | null;
  slug: string | null;
  logo_url: string | null;
  logo_cached_url: string | null;
  league_id: number | null;
  league_name: string | null;
  league_name_ko: string | null;
  league_logo_url: string | null;
  country: string | null;
  current_season: number | null;
};

type ApiPlayerResponse = {
  player?: {
    id?: number;
    name?: string | null;
    firstname?: string | null;
    lastname?: string | null;
    age?: number | null;
    birth?: {
      date?: string | null;
      place?: string | null;
      country?: string | null;
    };
    nationality?: string | null;
    height?: string | number | null;
    weight?: string | number | null;
    injured?: boolean | null;
    photo?: string | null;
  };
  statistics?: Array<{
    team?: {
      id?: number | null;
      name?: string | null;
      logo?: string | null;
    };
    league?: {
      id?: number | null;
      name?: string | null;
      country?: string | null;
      logo?: string | null;
      season?: number | null;
    };
    games?: {
      number?: number | null;
      position?: string | null;
    };
  }>;
};

export type PlayerShell = {
  id: number;
  name: string;
  name_en?: string | null;
  name_ko?: string | null;
  slug?: string | null;
  nationality?: string | null;
  position?: string | null;
  number?: number | null;
  age?: number | null;
  height?: string | null;
  weight?: string | null;
  photo?: string | null;
  team?: {
    id: number;
    name: string;
    name_en?: string | null;
    name_ko?: string | null;
    slug?: string | null;
    logo?: string | null;
  } | null;
  league?: {
    id: number;
    name: string;
    country?: string | null;
    logo?: string | null;
    season?: number | null;
  } | null;
  lastApiSync?: string | null;
};

export type PlayerShellResult =
  | { status: 'found'; shell: PlayerShell; source: 'db' | 'api' }
  | { status: 'missing' }
  | { status: 'temporary-error'; error: string };

function formatMetric(value: string | number | null | undefined, suffix: string): string | null {
  if (typeof value === 'number') return value > 0 ? `${value}${suffix}` : null;
  if (typeof value === 'string' && value.trim()) return value;
  return null;
}

function parseMetricNumber(value: string | number | null | undefined): number | null {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : null;
  if (!value) return null;

  const match = String(value).match(/\d+/);
  if (!match) return null;

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function isTemporaryPlayerDataError(error?: string): boolean {
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

function buildSlug(shell: Pick<PlayerShell, 'id' | 'name' | 'name_en' | 'name_ko'>): string {
  return getPlayerLinkSlug({
    id: shell.id,
    name: shell.name_en || shell.name,
    name_ko: shell.name_ko || shell.name,
    display_name: shell.name,
  });
}

async function fetchPlayerRow(playerId: number): Promise<PlayerShellRow | null> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('football_players')
    .select('player_id,name,korean_name,display_name,team_id,team_name,position,number,nationality,nationality_ko,age,height,weight,photo_url,photo_cached_url,slug,is_active,last_api_sync')
    .eq('player_id', playerId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as PlayerShellRow | null) ?? null;
}

async function fetchTeamRow(teamId: number | null | undefined): Promise<TeamShellRow | null> {
  if (!teamId) return null;

  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from('football_teams')
    .select('team_id,name,name_ko,slug,logo_url,logo_cached_url,league_id,league_name,league_name_ko,league_logo_url,country,current_season')
    .eq('team_id', teamId)
    .maybeSingle();

  return (data as TeamShellRow | null) ?? null;
}

function buildShellFromRows(row: PlayerShellRow, team: TeamShellRow | null): PlayerShell {
  const nameEn = row.display_name || row.name || `Player ${row.player_id}`;
  const name = row.korean_name || nameEn;
  const teamName = team?.name_ko || row.team_name || team?.name || '';
  const shell: PlayerShell = {
    id: row.player_id,
    name,
    name_en: row.name || row.display_name,
    name_ko: row.korean_name,
    slug: row.slug,
    nationality: row.nationality_ko || row.nationality,
    position: row.position,
    number: row.number,
    age: row.age,
    height: formatMetric(row.height, 'cm'),
    weight: formatMetric(row.weight, 'kg'),
    photo: row.photo_cached_url || row.photo_url,
    team: row.team_id ? {
      id: row.team_id,
      name: teamName,
      name_en: team?.name || row.team_name,
      name_ko: team?.name_ko,
      slug: team?.slug,
      logo: team?.logo_cached_url || team?.logo_url,
    } : null,
    league: team?.league_id ? {
      id: team.league_id,
      name: team.league_name_ko || team.league_name || '',
      country: team.country,
      logo: team.league_logo_url,
      season: team.current_season || getDefaultPlayerSeason(),
    } : null,
    lastApiSync: row.last_api_sync,
  };

  return {
    ...shell,
    slug: shell.slug || buildSlug(shell),
  };
}

function buildShellFromApi(raw: ApiPlayerResponse): PlayerShell | null {
  const player = raw.player;
  if (!player?.id || !player.name) return null;

  const stat = raw.statistics?.find((item) => item.team?.id) || raw.statistics?.[0];
  const teamId = stat?.team?.id ?? null;
  const teamName = stat?.team?.name || '';
  const leagueId = stat?.league?.id ?? null;

  const shell: PlayerShell = {
    id: player.id,
    name: player.name,
    name_en: player.name,
    name_ko: null,
    nationality: player.nationality || null,
    position: stat?.games?.position || null,
    number: stat?.games?.number || null,
    age: player.age || null,
    height: formatMetric(player.height, 'cm'),
    weight: formatMetric(player.weight, 'kg'),
    photo: player.photo || null,
    team: teamId ? {
      id: teamId,
      name: teamName,
      name_en: teamName,
      name_ko: null,
      slug: null,
      logo: stat?.team?.logo || null,
    } : null,
    league: leagueId ? {
      id: leagueId,
      name: stat?.league?.name || '',
      country: stat?.league?.country || null,
      logo: stat?.league?.logo || null,
      season: stat?.league?.season || getDefaultPlayerSeason(),
    } : null,
  };

  return {
    ...shell,
    slug: buildSlug(shell),
  };
}

async function upsertPlayerShellFromApi(shell: PlayerShell, raw: ApiPlayerResponse): Promise<void> {
  if (!shell.team?.id) return;

  try {
    const now = new Date().toISOString();
    const supabase = getSupabaseAdmin();
    await supabase
      .from('football_players')
      .upsert({
        player_id: shell.id,
        name: shell.name_en || shell.name,
        display_name: shell.name_en || shell.name,
        korean_name: shell.name_ko || null,
        team_id: shell.team.id,
        team_name: shell.team.name_en || shell.team.name,
        position: shell.position || null,
        number: shell.number || null,
        nationality: shell.nationality || null,
        age: shell.age || null,
        height: parseMetricNumber(shell.height),
        weight: parseMetricNumber(shell.weight),
        photo_url: shell.photo || null,
        slug: shell.slug || null,
        api_data: {
          raw,
          lastSync: now,
          source: 'players-shell',
        },
        last_api_sync: now,
        updated_at: now,
      }, { onConflict: 'player_id' });
  } catch {
    // Shell writes are opportunistic and should never block rendering.
  }
}

async function fetchPlayerShellFromApi(playerId: number): Promise<PlayerShellResult> {
  for (const season of getPlayerSeasonCandidates()) {
    try {
      const data = await fetchFromFootballApi('players', { id: playerId, season });
      const raw = data?.response?.[0] as ApiPlayerResponse | undefined;
      const shell = raw ? buildShellFromApi(raw) : null;
      if (shell && raw) {
        await upsertPlayerShellFromApi(shell, raw);
        return { status: 'found', shell, source: 'api' };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (isTemporaryPlayerDataError(message)) {
        return { status: 'temporary-error', error: message };
      }
    }
  }

  try {
    const profileData = await fetchFromFootballApi('players/profiles', { player: playerId });
    const raw = profileData?.response?.[0] as ApiPlayerResponse | undefined;
    const shell = raw ? buildShellFromApi(raw) : null;
    if (shell && raw) {
      await upsertPlayerShellFromApi(shell, raw);
      return { status: 'found', shell, source: 'api' };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isTemporaryPlayerDataError(message)) {
      return { status: 'temporary-error', error: message };
    }
  }

  return { status: 'missing' };
}

async function fetchPlayerShellInternal(playerId: string): Promise<PlayerShellResult> {
  const id = Number(playerId);
  if (!Number.isFinite(id) || id <= 0) {
    return { status: 'missing' };
  }

  try {
    const row = await fetchPlayerRow(id);
    if (row && row.is_active !== false) {
      const team = await fetchTeamRow(row.team_id);
      return { status: 'found', shell: buildShellFromRows(row, team), source: 'db' };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { status: 'temporary-error', error: message };
  }

  return fetchPlayerShellFromApi(id);
}

export const fetchCachedPlayerShell = cache(fetchPlayerShellInternal);
