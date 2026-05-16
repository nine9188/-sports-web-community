'use server';

import { getSupabaseAdmin } from '@/shared/lib/supabase/server';
import { slugify } from '@/domains/livescore/utils/slugs';
import { getMatchLinkSlug, getTeamLinkSlug } from '@/domains/livescore/utils/entityLinks';
import { isUsableTeamSlug } from '@/domains/livescore/actions/teams/slug';
import { cache } from 'react';
import { fetchCachedMatchShell } from './matchShell';

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
    isUsableTeamSlug(team.team_id, team.slug) && teamNameCandidates(team).some((candidate) => candidate === normalizedName)
  );
  if (exact?.slug) return exact.slug;

  const partial = teams.find((team) =>
    isUsableTeamSlug(team.team_id, team.slug) && teamNameCandidates(team).some((candidate) =>
      candidate.includes(normalizedName) || normalizedName.includes(candidate)
    )
  );

  return partial?.slug || null;
}

function canonicalTeamSlugFromRow(team: TeamSlugRow): string | null {
  if (isUsableTeamSlug(team.team_id, team.slug)) return team.slug;

  const nameSlug = getTeamLinkSlug({
    id: team.team_id,
    name: team.name,
    name_ko: team.name_ko,
    display_name: team.display_name,
    short_name: team.short_name,
  });

  return isUsableTeamSlug(team.team_id, nameSlug) ? nameSlug : null;
}

function isUsableMatchSlug(fixtureId: number | string, slug?: string | null): slug is string {
  const normalized = String(slug ?? '').trim().toLowerCase();
  const normalizedId = String(fixtureId ?? '').trim().toLowerCase();

  return Boolean(
    normalized &&
    normalized !== 'match' &&
    normalized !== normalizedId &&
    normalized !== `match-${normalizedId}`
  );
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
    .select('team_id, name, name_ko, display_name, short_name, slug')
    .in('team_id', [homeTeamId, awayTeamId]);

  const rows = (data || []) as TeamSlugRow[];
  const homeRow = rows.find((row) => row.team_id === homeTeamId);
  const awayRow = rows.find((row) => row.team_id === awayTeamId);
  const homeSlug = homeRow ? canonicalTeamSlugFromRow(homeRow) : null;
  const awaySlug = awayRow ? canonicalTeamSlugFromRow(awayRow) : null;

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
    .select('team_id, name, name_ko, display_name, short_name, slug');

  const rows = (teams || []) as TeamSlugRow[];
  const homeSlug = findTeamSlugByName(teamNames[0], rows) || slugify(teamNames[0]);
  const awaySlug = findTeamSlugByName(teamNames[1], rows) || slugify(teamNames[1]);

  const slug = homeSlug && awaySlug ? `${homeSlug}-vs-${awaySlug}` : null;
  return isUsableMatchSlug(fixtureId, slug) ? slug : null;
}

async function resolveCanonicalMatchSlugInternal(fixtureId: number | string): Promise<string | null> {
  const id = Number(fixtureId);
  if (!Number.isFinite(id) || id <= 0) return null;

  const shellResult = await fetchCachedMatchShell(String(id));

  if (shellResult.status === 'found') {
    const { shell } = shellResult;
    const fromIds = await getTeamSlugsFromIds(
      shell.teams?.home?.id,
      shell.teams?.away?.id
    );
    if (isUsableMatchSlug(id, fromIds)) return fromIds;

    const fromNames = getMatchLinkSlug(
      shell.teams?.home || {},
      shell.teams?.away || {},
      id
    );
    if (isUsableMatchSlug(id, fromNames)) return fromNames;
  }

  return getTeamSlugsFromHighlightTitle(id);
}

export const resolveCanonicalMatchSlug = cache(resolveCanonicalMatchSlugInternal);
