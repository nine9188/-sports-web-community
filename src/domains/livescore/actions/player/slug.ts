import { fetchFromFootballApi } from '@/domains/livescore/actions/footballApi';
import { getPlayerLinkSlug } from '@/domains/livescore/utils/entityLinks';
import { getPlayerSeasonCandidates } from './currentSeason';
import { cache } from 'react';

type PlayerSlugRow = {
  slug?: string | null;
  name?: string | null;
  display_name?: string | null;
  korean_name?: string | null;
  firstname?: string | null;
  lastname?: string | null;
};

type PlayerNameResponse = {
  player?: {
    name?: string | null;
  };
};

export function isUsablePlayerSlug(slug?: string | null): slug is string {
  const normalized = String(slug ?? '').trim().toLowerCase();

  return Boolean(
    normalized &&
    normalized !== 'player' &&
    !/^player-\d+$/.test(normalized) &&
    !/^\d+$/.test(normalized)
  );
}

async function fetchPlayerSlugRowFromDb(playerId: string): Promise<PlayerSlugRow | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return null;

    const res = await fetch(
      `${supabaseUrl}/rest/v1/football_players?player_id=eq.${playerId}&select=slug,name,display_name,korean_name,firstname,lastname&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        cache: 'force-cache',
      }
    );

    if (!res.ok) return null;

    const data = await res.json() as PlayerSlugRow[];
    return data?.[0] ?? null;
  } catch {
    return null;
  }
}

async function fetchPlayerNameFromProfile(playerId: string): Promise<string | null> {
  try {
    const profileData = await fetchFromFootballApi('players/profiles', { player: playerId });
    const profile = profileData?.response?.[0] as PlayerNameResponse | undefined;
    return profile?.player?.name || null;
  } catch {
    return null;
  }
}

async function fetchPlayerNameFromStats(playerId: string): Promise<string | null> {
  for (const season of getPlayerSeasonCandidates()) {
    try {
      const playerData = await fetchFromFootballApi('players', { id: playerId, season });
      const player = playerData?.response?.[0] as PlayerNameResponse | undefined;
      if (player?.player?.name) return player.player.name;
    } catch {
      continue;
    }
  }

  return null;
}

async function resolvePlayerCanonicalSlugInternal(playerId: string): Promise<string | null> {
  const numericId = Number(playerId);
  if (!Number.isFinite(numericId) || numericId <= 0) return null;

  const dbRow = await fetchPlayerSlugRowFromDb(playerId);
  if (isUsablePlayerSlug(dbRow?.slug)) return dbRow.slug;

  if (dbRow) {
    const dbNameSlug = getPlayerLinkSlug({ id: playerId, ...dbRow, name_ko: dbRow.korean_name });
    if (isUsablePlayerSlug(dbNameSlug)) return dbNameSlug;
  }

  const playerName =
    await fetchPlayerNameFromProfile(playerId) ||
    await fetchPlayerNameFromStats(playerId);

  const apiSlug = playerName ? getPlayerLinkSlug({ id: playerId, name: playerName }) : '';
  return isUsablePlayerSlug(apiSlug) ? apiSlug : null;
}

export const resolvePlayerCanonicalSlug = cache(resolvePlayerCanonicalSlugInternal);
