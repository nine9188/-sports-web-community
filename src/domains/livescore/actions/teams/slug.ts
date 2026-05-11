import { cache } from 'react';
import { fetchFromFootballApi } from '@/domains/livescore/actions/footballApi';
import { getTeamLinkSlug } from '@/domains/livescore/utils/entityLinks';

type TeamSlugRow = {
  slug?: string | null;
  name?: string | null;
  name_en?: string | null;
  name_ko?: string | null;
  display_name?: string | null;
  short_name?: string | null;
};

type TeamApiResponse = {
  team?: {
    id?: number | string | null;
    name?: string | null;
  };
};

export function isUsableTeamSlug(teamId: string | number, slug?: string | null): slug is string {
  const normalized = String(slug ?? '').trim().toLowerCase();
  const normalizedId = String(teamId ?? '').trim().toLowerCase();

  return Boolean(
    normalized &&
    normalized !== 'team' &&
    normalized !== normalizedId &&
    normalized !== `team-${normalizedId}`
  );
}

async function fetchTeamSlugRowFromDb(teamId: string): Promise<TeamSlugRow | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return null;

    const res = await fetch(
      `${supabaseUrl}/rest/v1/football_teams?team_id=eq.${teamId}&select=slug,name,name_en,name_ko,display_name,short_name&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        cache: 'force-cache',
      }
    );

    if (!res.ok) return null;

    const data = await res.json() as TeamSlugRow[];
    return data?.[0] ?? null;
  } catch {
    return null;
  }
}

async function fetchTeamNameFromApi(teamId: string): Promise<string | null> {
  try {
    const teamData = await fetchFromFootballApi('teams', { id: teamId });
    const team = teamData?.response?.[0] as TeamApiResponse | undefined;
    return team?.team?.name || null;
  } catch {
    return null;
  }
}

async function resolveTeamCanonicalSlugInternal(teamId: string): Promise<string | null> {
  const numericId = Number(teamId);
  if (!Number.isFinite(numericId) || numericId <= 0) return null;

  const dbRow = await fetchTeamSlugRowFromDb(teamId);
  if (isUsableTeamSlug(teamId, dbRow?.slug)) return dbRow.slug;

  if (dbRow) {
    const dbNameSlug = getTeamLinkSlug({ id: teamId, ...dbRow });
    if (isUsableTeamSlug(teamId, dbNameSlug)) return dbNameSlug;
  }

  const apiName = await fetchTeamNameFromApi(teamId);
  const apiSlug = apiName ? getTeamLinkSlug({ id: teamId, name: apiName }) : '';

  return isUsableTeamSlug(teamId, apiSlug) ? apiSlug : null;
}

export const resolveTeamCanonicalSlug = cache(resolveTeamCanonicalSlugInternal);
