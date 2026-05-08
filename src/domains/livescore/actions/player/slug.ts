'use server';

import { fetchFromFootballApi } from '@/domains/livescore/actions/footballApi';
import { getPlayerSlugFromName } from '@/domains/livescore/utils/slugs';
import { getPlayerSeasonCandidates } from './currentSeason';

type PlayerNameResponse = {
  player?: {
    name?: string | null;
  };
};

function isUsablePlayerSlug(slug?: string | null): slug is string {
  const normalized = String(slug ?? '').trim().toLowerCase();

  return Boolean(
    normalized &&
    normalized !== 'player' &&
    !/^player-\d+$/.test(normalized) &&
    !/^\d+$/.test(normalized)
  );
}

async function fetchPlayerSlugFromDb(playerId: string): Promise<string | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return null;

    const res = await fetch(
      `${supabaseUrl}/rest/v1/football_players?player_id=eq.${playerId}&select=slug&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        cache: 'force-cache',
      }
    );

    if (!res.ok) return null;

    const data = await res.json() as Array<{ slug?: string | null }>;
    const slug = data?.[0]?.slug;

    return isUsablePlayerSlug(slug) ? slug : null;
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

export async function resolvePlayerCanonicalSlug(playerId: string): Promise<string | null> {
  const numericId = Number(playerId);
  if (!Number.isFinite(numericId) || numericId <= 0) return null;

  const dbSlug = await fetchPlayerSlugFromDb(playerId);
  if (dbSlug) return dbSlug;

  const playerName =
    await fetchPlayerNameFromProfile(playerId) ||
    await fetchPlayerNameFromStats(playerId);

  const apiSlug = playerName ? getPlayerSlugFromName(playerName) : '';
  return isUsablePlayerSlug(apiSlug) ? apiSlug : null;
}
