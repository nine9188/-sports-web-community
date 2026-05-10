'use server';

import { getSupabaseAdmin } from '@/shared/lib/supabase/server';
import { fetchCachedMatchFullData } from './matchData';
import { slugify } from '@/domains/livescore/utils/slugs';
import { getMatchLinkSlug } from '@/domains/livescore/utils/entityLinks';
import { cache } from 'react';

type TeamSlugRow = {
  team_id: number;
  name: string | null;
  name_ko: string | null;
  display_name: string | null;
  short_name: string | null;
  slug: string | null;
};

type HighlightRow = {
  video_title: string | null;
};

function normalizeName(value: string | null | undefined): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .toLowerCase();
}

function teamNameCandidates(team: TeamSlugRow): string[] {
  return [team.name, team.name_ko, team.display_name, team.short_name]
    .map(normalizeName)
    .filter(Boolean);
}

function findTeamSlugByName(name: string, teams: TeamSlugRow[]): string | null {
  const normalizedName = normalizeName(name);
  if (!normalizedName) return null;

  const exact = teams.find((team) =>
    team.slug && teamNameCandidates(team).some((candidate) => candidate === normalizedName)
  );
  if (exact?.slug) return exact.slug;

  const partial = teams.find((team) =>
    team.slug && teamNameCandidates(team).some((candidate) =>
      candidate.includes(normalizedName) || normalizedName.includes(candidate)
    )
  );

  return partial?.slug || null;
}

function extractTeamsFromHighlightTitle(title: string | null | undefined): [string, string] | null {
  if (!title) return null;

  const withoutBracketPrefix = title.replace(/^\[[^\]]+\]\s*/, '');
  const match = withoutBracketPrefix.match(/(.+?)\s+(?:vs|VS|v|V)\s+(.+?)(?:\s+\d|$)/);

  if (!match) return null;

  const home = match[1]?.trim();
  const away = match[2]?.trim();

  return home && away ? [home, away] : null;
}

async function getTeamSlugsFromIds(homeTeamId?: number | null, awayTeamId?: number | null): Promise<string | null> {
  if (!homeTeamId || !awayTeamId) return null;

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('football_teams')
    .select('team_id, slug')
    .in('team_id', [homeTeamId, awayTeamId]);

  const rows = (data || []) as Array<{ team_id: number; slug: string | null }>;
  const homeSlug = rows.find((row) => row.team_id === homeTeamId)?.slug;
  const awaySlug = rows.find((row) => row.team_id === awayTeamId)?.slug;

  return homeSlug && awaySlug ? `${homeSlug}-vs-${awaySlug}` : null;
}

async function getTeamSlugsFromHighlightTitle(fixtureId: number): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data: highlight } = await supabase
    .from('match_highlights')
    .select('video_title')
    .eq('fixture_id', fixtureId)
    .neq('video_id', 'NOT_FOUND')
    .maybeSingle();

  const teamNames = extractTeamsFromHighlightTitle((highlight as HighlightRow | null)?.video_title);
  if (!teamNames) return null;

  const { data: teams } = await supabase
    .from('football_teams')
    .select('team_id, name, name_ko, display_name, short_name, slug')
    .not('slug', 'is', null);

  const rows = (teams || []) as TeamSlugRow[];
  const homeSlug = findTeamSlugByName(teamNames[0], rows) || slugify(teamNames[0]);
  const awaySlug = findTeamSlugByName(teamNames[1], rows) || slugify(teamNames[1]);

  return homeSlug && awaySlug ? `${homeSlug}-vs-${awaySlug}` : null;
}

async function resolveCanonicalMatchSlugInternal(fixtureId: number | string): Promise<string | null> {
  const id = Number(fixtureId);
  if (!Number.isFinite(id) || id <= 0) return null;

  const matchData = await fetchCachedMatchFullData(String(id), {
    fetchEvents: false,
    fetchLineups: false,
    fetchStats: false,
    fetchStandings: false,
  });

  if (matchData.success && matchData.match) {
    const fromIds = await getTeamSlugsFromIds(
      matchData.match.teams?.home?.id,
      matchData.match.teams?.away?.id
    );
    if (fromIds) return fromIds;

    const fromNames = getMatchLinkSlug(
      matchData.match.teams?.home || {},
      matchData.match.teams?.away || {},
      id
    );
    if (fromNames) return fromNames;
  }

  return getTeamSlugsFromHighlightTitle(id);
}

export const resolveCanonicalMatchSlug = cache(resolveCanonicalMatchSlugInternal);
