import type { MetadataRoute } from 'next';
import { getCachedAllBoards } from '@/domains/boards/actions/getCachedBoards';
import { getMajorLeagueIds } from '@/domains/livescore/actions/teamLeagueData';
import { getPlayerLinkSlug, getTeamLinkSlug } from '@/domains/livescore/utils/entityLinks';
import { isUsableTeamSlug } from '@/domains/livescore/actions/teams/slug';
import { isUsablePlayerSlug } from '@/domains/livescore/actions/player/slug';
import { getLeagueSlug } from '@/domains/livescore/utils/slugs';
import { getTransferLeagueTeamGroups } from '@/domains/livescore/actions/transfers/transferTeams';
import { isWorthlessSitemapPlayer } from '@/domains/livescore/utils/playerSeoQuality';
import { siteConfig } from '@/shared/config';
import { MATCH_LEAGUE_IDS } from '@/shared/constants/leagueIds';
import { getSupabaseAdmin } from '@/shared/lib/supabase/server';
import { ExtendedSitemapEntry } from '@/shared/seo/sitemapXml';

export const SITEMAP_PAGE_SIZE = 50000;
export const CORE_SITEMAP_LEAGUE_IDS = [39, 140, 78, 135, 61, 292, 293] as const;
const SITEMAP_QUERY_MAX_ATTEMPTS = 3;
const SITEMAP_QUERY_RETRY_DELAYS_MS = [250, 1000];
const FIXTURE_TEAM_QUERY_CHUNK_SIZE = 500;
const sitemapQueryFailures = new Set<string>();

type SitemapEntry = MetadataRoute.Sitemap[number];

type BoardRow = {
  id: string;
  slug: string | null;
  parent_id: string | null;
};

type PostRow = {
  post_number: number;
  updated_at: string | null;
  created_at: string | null;
  boards: { slug: string | null } | { slug: string | null }[] | null;
};

type TeamRow = {
  team_id: number;
  league_id?: number | null;
  slug: string | null;
  updated_at: string | null;
  name: string | null;
  name_ko: string | null;
  display_name: string | null;
  short_name: string | null;
};

type PlayerRow = {
  player_id: number;
  slug: string | null;
  updated_at: string | null;
  name: string | null;
  display_name: string | null;
  korean_name: string | null;
  team_id: number | null;
  team_name: string | null;
  position: string | null;
  number: number | null;
  age: number | null;
  photo_url: string | null;
};

type FixtureRow = {
  fixture_id: number;
  home_team_id: number | null;
  away_team_id: number | null;
  league_id: number | null;
  match_date: string | null;
  updated_at: string | null;
};

type SupabaseQueryResult = {
  data?: unknown;
  count?: number | null;
  error: unknown | null;
};

export type SitemapLeagueGroup = {
  id: number | null;
  slug: string;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function resetSitemapQueryFailures() {
  sitemapQueryFailures.clear();
}

export function getSitemapQueryFailures(): string[] {
  return [...sitemapQueryFailures];
}

function chunks<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

function errorText(error: unknown): string {
  if (!error) return '';
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function isRetryableSitemapError(error: unknown): boolean {
  const text = errorText(error).toLowerCase();

  return [
    'fetch failed',
    'network',
    'timeout',
    'timed out',
    'econnreset',
    'etimedout',
    'enotfound',
    '503',
    '502',
    '504',
  ].some((needle) => text.includes(needle));
}

async function runSitemapQuery<T extends SupabaseQueryResult>(
  label: string,
  query: () => PromiseLike<T>
): Promise<T> {
  let result = await query();

  for (let attempt = 1; result.error && attempt < SITEMAP_QUERY_MAX_ATTEMPTS; attempt += 1) {
    if (!isRetryableSitemapError(result.error)) break;

    console.warn(`[sitemap] ${label} retry ${attempt}/${SITEMAP_QUERY_MAX_ATTEMPTS - 1}:`, result.error);
    await sleep(SITEMAP_QUERY_RETRY_DELAYS_MS[attempt - 1] ?? 1000);
    result = await query();
  }

  if (result.error) {
    sitemapQueryFailures.add(label);
  }

  return result;
}

export function siteUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${siteConfig.url}${normalizedPath}`;
}

export function sitemapPageCount(total: number): Array<{ id: number }> {
  return Array.from({ length: Math.max(1, Math.ceil(total / SITEMAP_PAGE_SIZE)) }, (_, id) => ({ id }));
}

export async function getSitemapLeagueGroups(): Promise<SitemapLeagueGroup[]> {
  const leagueIds = await getMajorLeagueIds();
  const groups = leagueIds
    .map((id) => ({ id, slug: getLeagueSlug(id) }))
    .sort((a, b) => a.slug.localeCompare(b.slug));

  return [...groups, { id: null, slug: 'other' }];
}

async function getSitemapLeagueGroup(leagueSlug: string): Promise<SitemapLeagueGroup | null> {
  const normalizedSlug = leagueSlug.trim().toLowerCase();
  const groups = await getSitemapLeagueGroups();
  return groups.find((group) => group.slug === normalizedSlug) ?? null;
}

export function getStaticSitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl('/'),
    },
    {
      url: siteUrl('/about'),
    },
    {
      url: siteUrl('/guide'),
    },
    {
      url: siteUrl('/contact'),
    },
    {
      url: siteUrl('/transfers'),
    },
    {
      url: siteUrl('/livescore/football'),
    },
    {
      url: siteUrl('/livescore/football/leagues'),
    },
    {
      url: siteUrl('/shop'),
    },
    {
      url: siteUrl('/boards/all'),
    },
    {
      url: siteUrl('/boards/popular'),
    },
  ];
}

function pageRange(id: string | number): { from: number; to: number } {
  const page = Number(id);
  const from = Number.isFinite(page) && page > 0 ? page * SITEMAP_PAGE_SIZE : 0;
  return { from, to: from + SITEMAP_PAGE_SIZE - 1 };
}

function boardSlugFromPost(post: PostRow): string | null {
  if (Array.isArray(post.boards)) return post.boards[0]?.slug ?? null;
  return post.boards?.slug ?? null;
}

function fixtureSlug(fixture: FixtureRow, teamSlugById: Map<number, string>): string | null {
  const homeSlug = fixture.home_team_id ? teamSlugById.get(fixture.home_team_id) : null;
  const awaySlug = fixture.away_team_id ? teamSlugById.get(fixture.away_team_id) : null;
  return homeSlug && awaySlug ? `${homeSlug}-vs-${awaySlug}` : null;
}

function canonicalTeamSlugFromRow(team: TeamRow): string | null {
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

function canonicalPlayerSlugFromRow(player: PlayerRow): string | null {
  if (isUsablePlayerSlug(player.slug)) return player.slug;

  const nameSlug = getPlayerLinkSlug({
    id: player.player_id,
    name: player.name,
    display_name: player.display_name,
    name_ko: player.korean_name,
  });

  return isUsablePlayerSlug(nameSlug) ? nameSlug : null;
}

export async function getBoardSitemap(): Promise<MetadataRoute.Sitemap> {
  const boards = (await getCachedAllBoards()) as BoardRow[];

  return boards
    .filter((board) => Boolean(board.slug))
    .map((board): SitemapEntry => ({
      url: siteUrl(`/boards/${board.slug}`),
      changeFrequency: board.parent_id ? 'daily' : 'weekly',
      priority: board.parent_id ? 0.5 : 0.6,
    }));
}

export async function getLeagueSitemap(): Promise<MetadataRoute.Sitemap> {
  const leagueIds = await getMajorLeagueIds();

  return leagueIds.map((leagueId): SitemapEntry => ({
    url: siteUrl(`/livescore/football/leagues/${leagueId}/${getLeagueSlug(leagueId)}`),
    changeFrequency: 'daily',
    priority: 0.7,
  }));
}

export async function getCoreLeagueSitemap(): Promise<MetadataRoute.Sitemap> {
  const leagueIds = await getMajorLeagueIds();

  return leagueIds.map((leagueId): SitemapEntry => ({
    url: siteUrl(`/livescore/football/leagues/${leagueId}/${getLeagueSlug(leagueId)}`),
    changeFrequency: 'daily',
    priority: 0.7,
  }));
}

export async function getPostSitemapCount(): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { count, error } = await runSitemapQuery('posts count query', () => supabase
    .from('posts')
    .select('id, boards!inner(slug)', { count: 'exact', head: true })
    .eq('is_deleted', false)
    .eq('is_hidden', false)
    .not('boards.slug', 'in', '("foreign-news","domestic-news","news")'));

  if (error) {
    console.error('[sitemap] posts count query failed:', error);
    return 0;
  }

  return count || 0;
}

export async function getPostSitemap(id: string | number): Promise<MetadataRoute.Sitemap> {
  const { from, to } = pageRange(id);
  const supabase = getSupabaseAdmin();
  const { data, error } = await runSitemapQuery('posts page query', () => supabase
    .from('posts')
    .select('post_number, updated_at, created_at, boards!inner(slug)')
    .eq('is_deleted', false)
    .eq('is_hidden', false)
    .not('boards.slug', 'in', '("foreign-news","domestic-news","news")')
    .order('created_at', { ascending: false })
    .range(from, to));

  if (error) {
    console.error('[sitemap] posts page query failed:', error);
    return [];
  }

  return ((data || []) as unknown as PostRow[])
    .map((post): SitemapEntry | null => {
      const boardSlug = boardSlugFromPost(post);
      if (!boardSlug) return null;

      return {
        url: siteUrl(`/boards/${boardSlug}/${post.post_number}`),
        lastModified: post.updated_at || post.created_at || undefined,
        changeFrequency: 'weekly',
        priority: 0.4,
      };
    })
    .filter((entry): entry is SitemapEntry => Boolean(entry));
}

export async function getRecentPostSitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await runSitemapQuery('recent posts sitemap query', () => supabase
    .from('posts')
    .select('post_number, updated_at, created_at, boards!inner(slug)')
    .eq('is_deleted', false)
    .eq('is_hidden', false)
    .not('boards.slug', 'in', '("foreign-news","domestic-news","news")')
    .order('created_at', { ascending: false })
    .limit(1000));

  if (error) {
    console.error('[sitemap] recent posts query failed:', error);
    return [];
  }

  return ((data || []) as unknown as PostRow[])
    .map((post): SitemapEntry | null => {
      const boardSlug = boardSlugFromPost(post);
      if (!boardSlug) return null;

      return {
        url: siteUrl(`/boards/${boardSlug}/${post.post_number}`),
        lastModified: post.updated_at || post.created_at || undefined,
        changeFrequency: 'hourly',
        priority: 0.6,
      };
    })
    .filter((entry): entry is SitemapEntry => Boolean(entry));
}


export async function getTeamSitemapCount(): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { count, error } = await runSitemapQuery('football_teams count query', () => supabase
    .from('football_teams')
    .select('team_id', { count: 'exact', head: true })
    .eq('is_active', true)
    .not('name', 'is', null));

  if (error) {
    console.error('[sitemap] football_teams count query failed:', error);
    return 0;
  }

  return count || 0;
}

export async function getTeamSitemap(id: string | number): Promise<MetadataRoute.Sitemap> {
  const { from, to } = pageRange(id);
  const supabase = getSupabaseAdmin();
  const { data, error } = await runSitemapQuery('football_teams page query', () => supabase
    .from('football_teams')
    .select('team_id, league_id, slug, updated_at, name, name_ko, display_name, short_name')
    .eq('is_active', true)
    .not('name', 'is', null)
    .order('team_id', { ascending: true })
    .range(from, to));

  if (error) {
    console.error('[sitemap] football_teams page query failed:', error);
    return [];
  }

  return ((data || []) as TeamRow[])
    .map((team): SitemapEntry | null => {
      const slug = canonicalTeamSlugFromRow(team);
      if (!slug) return null;

      return {
        url: siteUrl(`/livescore/football/team/${team.team_id}/${slug}`),
        lastModified: team.updated_at || undefined,
        changeFrequency: 'weekly',
        priority: 0.6,
      };
    })
    .filter((entry): entry is SitemapEntry => Boolean(entry));
}

export async function getCoreTeamSitemap(): Promise<MetadataRoute.Sitemap> {
  return getCoreLeagueTeamSitemap();
}

export async function getCoreLeagueTeamSitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = getSupabaseAdmin();
  const leagueIds = await getMajorLeagueIds();
  const { data, error } = await runSitemapQuery('football_teams core query', () => supabase
    .from('football_teams')
    .select('team_id, league_id, slug, updated_at, name, name_ko, display_name, short_name, logo_url, logo_cached_url')
    .eq('is_active', true)
    .not('name', 'is', null)
    .in('league_id', leagueIds)
    .order('team_id', { ascending: true }));

  if (error) {
    console.error('[sitemap] football_teams core query failed:', error);
    return [];
  }

  return ((data || []) as (TeamRow & { logo_url: string | null; logo_cached_url: string | null })[])
    .map((team): ExtendedSitemapEntry | null => {
      const slug = canonicalTeamSlugFromRow(team);
      if (!slug) return null;

      const logo = team.logo_cached_url || team.logo_url;
      return {
        url: siteUrl(`/livescore/football/team/${team.team_id}/${slug}`),
        lastModified: team.updated_at || undefined,
        changeFrequency: 'weekly',
        priority: 0.6,
        images: logo ? [logo] : undefined,
      };
    })
    .filter((entry): entry is ExtendedSitemapEntry => Boolean(entry));
}

async function getCoreSitemapTeamIds(): Promise<Set<number>> {
  const supabase = getSupabaseAdmin();
  const leagueIds = await getMajorLeagueIds();
  const { data, error } = await runSitemapQuery('football_teams core ids query', () => supabase
    .from('football_teams')
    .select('team_id')
    .eq('is_active', true)
    .not('name', 'is', null)
    .in('league_id', leagueIds));

  if (error) {
    console.error('[sitemap] football_teams core ids query failed:', error);
    return new Set();
  }

  return new Set(((data || []) as TeamRow[])
    .map((team) => team.team_id)
    .filter((teamId): teamId is number => typeof teamId === 'number'));
}

export async function getTeamSitemapByLeagueSlug(leagueSlug: string): Promise<MetadataRoute.Sitemap> {
  const group = await getSitemapLeagueGroup(leagueSlug);
  if (!group) return [];

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('football_teams')
    .select('team_id, league_id, slug, updated_at, name, name_ko, display_name, short_name')
    .eq('is_active', true)
    .not('name', 'is', null)
    .order('team_id', { ascending: true });

  if (group.id !== null) {
    query = query.eq('league_id', group.id);
  }

  const { data, error } = await runSitemapQuery(`football_teams ${leagueSlug} query`, () => query);

  if (error) {
    console.error(`[sitemap] football_teams ${leagueSlug} query failed:`, error);
    return [];
  }

  const majorLeagueIds = new Set((await getSitemapLeagueGroups())
    .map((item) => item.id)
    .filter((id): id is number => typeof id === 'number'));

  return ((data || []) as TeamRow[])
    .filter((team) => group.id !== null || !majorLeagueIds.has(Number(team.league_id)))
    .map((team): SitemapEntry | null => {
      const slug = canonicalTeamSlugFromRow(team);
      if (!slug) return null;

      return {
        url: siteUrl(`/livescore/football/team/${team.team_id}/${slug}`),
        lastModified: team.updated_at || undefined,
      };
    })
    .filter((entry): entry is SitemapEntry => Boolean(entry));
}

export async function getTransferTeamSitemap(): Promise<MetadataRoute.Sitemap> {
  const groups = await getTransferLeagueTeamGroups();

  return groups.flatMap((group) => group.teams.map((team): SitemapEntry => ({
    url: siteUrl(`/transfers/team/${team.id}/${team.slug}`),
    changeFrequency: 'weekly',
    priority: 0.5,
  })));
}

export async function getPlayerSitemapCount(): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { count, error } = await runSitemapQuery('football_players count query', () => supabase
    .from('football_players')
    .select('player_id', { count: 'exact', head: true })
    .eq('is_active', true)
    .not('name', 'is', null));

  if (error) {
    console.error('[sitemap] football_players count query failed:', error);
    return 0;
  }

  return count || 0;
}

export async function getPlayerSitemap(id: string | number): Promise<MetadataRoute.Sitemap> {
  const { from, to } = pageRange(id);
  const supabase = getSupabaseAdmin();
  const { data, error } = await runSitemapQuery('football_players page query', () => supabase
    .from('football_players')
    .select('player_id, slug, updated_at, name, display_name, korean_name, team_id, team_name, position, number, age, photo_url')
    .eq('is_active', true)
    .not('name', 'is', null)
    .order('player_id', { ascending: true })
    .range(from, to));

  if (error) {
    console.error('[sitemap] football_players page query failed:', error);
    return [];
  }

  return ((data || []) as PlayerRow[])
    .filter((player) => player.player_id > 0 && !isWorthlessSitemapPlayer(player))
    .map((player): SitemapEntry | null => {
      const slug = canonicalPlayerSlugFromRow(player);
      if (!slug) return null;

      return {
        url: siteUrl(`/livescore/football/player/${player.player_id}/${slug}`),
        lastModified: player.updated_at || undefined,
        changeFrequency: 'monthly',
        priority: 0.4,
      };
    })
    .filter((entry): entry is SitemapEntry => Boolean(entry));
}

export async function getCorePlayerSitemap(): Promise<MetadataRoute.Sitemap> {
  const teamIds = await getCoreSitemapTeamIds();
  if (!teamIds.size) return [];

  const supabase = getSupabaseAdmin();
  const entries: ExtendedSitemapEntry[] = [];

  for (const teamIdChunk of chunks([...teamIds], 500)) {
    const { data, error } = await runSitemapQuery('football_players core query', () => supabase
      .from('football_players')
      .select('player_id, slug, updated_at, name, display_name, korean_name, team_id, team_name, position, number, age, photo_url')
      .eq('is_active', true)
      .not('name', 'is', null)
      .in('team_id', teamIdChunk)
      .order('player_id', { ascending: true }));

    if (error) {
      console.error('[sitemap] football_players core query failed:', error);
      continue;
    }

    entries.push(...((data || []) as PlayerRow[])
      .filter((player) => player.player_id > 0 && !isWorthlessSitemapPlayer(player))
      .map((player): ExtendedSitemapEntry | null => {
        const slug = canonicalPlayerSlugFromRow(player);
        if (!slug) return null;

        return {
          url: siteUrl(`/livescore/football/player/${player.player_id}/${slug}`),
          lastModified: player.updated_at || undefined,
          changeFrequency: 'monthly',
          priority: 0.4,
          images: player.photo_url ? [player.photo_url] : undefined,
        };
      })
      .filter((entry): entry is ExtendedSitemapEntry => Boolean(entry)));
  }

  return entries;
}

async function getTeamIdsForLeagueGroup(group: SitemapLeagueGroup): Promise<Set<number>> {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('football_teams')
    .select('team_id, league_id')
    .eq('is_active', true);

  if (group.id !== null) {
    query = query.eq('league_id', group.id);
  }

  const { data, error } = await runSitemapQuery(`football_teams ids ${group.slug} query`, () => query);

  if (error) {
    console.error(`[sitemap] football_teams ids ${group.slug} query failed:`, error);
    return new Set();
  }

  if (group.id !== null) {
    return new Set(((data || []) as TeamRow[])
      .map((team) => team.team_id)
      .filter((teamId) => typeof teamId === 'number'));
  }

  const majorLeagueIds = new Set((await getSitemapLeagueGroups())
    .map((item) => item.id)
    .filter((id): id is number => typeof id === 'number'));

  return new Set(((data || []) as TeamRow[])
    .filter((team) => !majorLeagueIds.has(Number(team.league_id)))
    .map((team) => team.team_id)
    .filter((teamId) => typeof teamId === 'number'));
}

export async function getPlayerSitemapByLeagueSlug(leagueSlug: string): Promise<MetadataRoute.Sitemap> {
  const group = await getSitemapLeagueGroup(leagueSlug);
  if (!group) return [];

  const teamIds = await getTeamIdsForLeagueGroup(group);
  if (!teamIds.size) return [];

  const supabase = getSupabaseAdmin();
  const { data, error } = await runSitemapQuery(`football_players ${leagueSlug} query`, () => supabase
    .from('football_players')
    .select('player_id, slug, updated_at, name, display_name, korean_name, team_id, team_name, position, number, age, photo_url')
    .eq('is_active', true)
    .not('name', 'is', null)
    .in('team_id', [...teamIds])
    .order('player_id', { ascending: true }));

  if (error) {
    console.error(`[sitemap] football_players ${leagueSlug} query failed:`, error);
    return [];
  }

  return ((data || []) as PlayerRow[])
    .filter((player) => player.player_id > 0 && !isWorthlessSitemapPlayer(player))
    .map((player): SitemapEntry | null => {
      const slug = canonicalPlayerSlugFromRow(player);
      if (!slug) return null;

      return {
        url: siteUrl(`/livescore/football/player/${player.player_id}/${slug}`),
        lastModified: player.updated_at || undefined,
      };
    })
    .filter((entry): entry is SitemapEntry => Boolean(entry));
}

export async function getMatchSitemapCount(): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { fromDate, toDate } = matchDateWindow();
  const { count, error } = await runSitemapQuery('fixtures count query', () => supabase
    .from('fixtures')
    .select('fixture_id', { count: 'exact', head: true })
    .in('league_id', MATCH_LEAGUE_IDS)
    .gte('match_date', fromDate)
    .lte('match_date', toDate));

  if (error) {
    console.error('[sitemap] fixtures count query failed:', error);
    return 0;
  }

  return count || 0;
}

export async function getMatchSitemap(id: string | number): Promise<MetadataRoute.Sitemap> {
  const { from, to } = pageRange(id);
  const { fromDate, toDate } = matchDateWindow();
  const supabase = getSupabaseAdmin();
  const { data: fixtures, error } = await runSitemapQuery('fixtures page query', () => supabase
    .from('fixtures')
    .select('fixture_id, home_team_id, away_team_id, league_id, match_date, updated_at')
    .in('league_id', MATCH_LEAGUE_IDS)
    .gte('match_date', fromDate)
    .lte('match_date', toDate)
    .order('match_date', { ascending: false })
    .range(from, to));

  if (error) {
    console.error('[sitemap] fixtures page query failed:', error);
    return [];
  }

  const teamIds = [
    ...new Set(
      ((fixtures || []) as FixtureRow[])
        .flatMap((fixture) => [fixture.home_team_id, fixture.away_team_id])
        .filter((teamId): teamId is number => typeof teamId === 'number')
    ),
  ];

  const teamSlugById = new Map<number, string>();
  if (teamIds.length) {
    for (const teamIdChunk of chunks(teamIds, FIXTURE_TEAM_QUERY_CHUNK_SIZE)) {
      const { data: teams, error: teamsError } = await runSitemapQuery('fixture team slug query', () => supabase
        .from('football_teams')
        .select('team_id, slug, updated_at, name, name_ko, display_name, short_name')
        .in('team_id', teamIdChunk));

      if (teamsError) {
        console.error('[sitemap] fixture team slug query failed:', teamsError);
        continue;
      }

      for (const team of (teams || []) as TeamRow[]) {
        const slug = canonicalTeamSlugFromRow(team);
        if (team.team_id && slug) teamSlugById.set(team.team_id, slug);
      }
    }
  }

  const now = Date.now();

  return ((fixtures || []) as FixtureRow[])
    .map((fixture): SitemapEntry | null => {
      const slug = fixtureSlug(fixture, teamSlugById);
      if (!slug) return null;

      const isPast = fixture.match_date ? new Date(fixture.match_date).getTime() < now : true;
      return {
        url: siteUrl(`/livescore/football/match/${fixture.fixture_id}/${slug}`),
        lastModified: fixture.updated_at || fixture.match_date || undefined,
        changeFrequency: isPast ? 'weekly' : 'daily',
        priority: isPast ? 0.6 : 0.7,
      };
    })
    .filter((entry): entry is SitemapEntry => Boolean(entry));
}

export async function getCoreMatchSitemap(): Promise<MetadataRoute.Sitemap> {
  const { fromDate, toDate } = matchDateWindow();
  const supabase = getSupabaseAdmin();
  const leagueIds = await getMajorLeagueIds();
  const { data: fixtures, error } = await runSitemapQuery('fixtures core query', () => supabase
    .from('fixtures')
    .select('fixture_id, home_team_id, away_team_id, league_id, match_date, updated_at')
    .in('league_id', leagueIds)
    .gte('match_date', fromDate)
    .lte('match_date', toDate)
    .order('match_date', { ascending: false }));

  if (error) {
    console.error('[sitemap] fixtures core query failed:', error);
    return [];
  }

  const teamIds = [
    ...new Set(
      ((fixtures || []) as FixtureRow[])
        .flatMap((fixture) => [fixture.home_team_id, fixture.away_team_id])
        .filter((teamId): teamId is number => typeof teamId === 'number')
    ),
  ];

  const teamSlugById = new Map<number, string>();
  if (teamIds.length) {
    for (const teamIdChunk of chunks(teamIds, FIXTURE_TEAM_QUERY_CHUNK_SIZE)) {
      const { data: teams, error: teamsError } = await runSitemapQuery('core fixture team slug query', () => supabase
        .from('football_teams')
        .select('team_id, slug, updated_at, name, name_ko, display_name, short_name')
        .in('team_id', teamIdChunk));

      if (teamsError) {
        console.error('[sitemap] core fixture team slug query failed:', teamsError);
        continue;
      }

      for (const team of (teams || []) as TeamRow[]) {
        const slug = canonicalTeamSlugFromRow(team);
        if (team.team_id && slug) teamSlugById.set(team.team_id, slug);
      }
    }
  }

  const now = Date.now();

  return ((fixtures || []) as FixtureRow[])
    .map((fixture): SitemapEntry | null => {
      const slug = fixtureSlug(fixture, teamSlugById);
      if (!slug) return null;

      const isPast = fixture.match_date ? new Date(fixture.match_date).getTime() < now : true;
      return {
        url: siteUrl(`/livescore/football/match/${fixture.fixture_id}/${slug}`),
        lastModified: fixture.updated_at || fixture.match_date || undefined,
        changeFrequency: isPast ? 'weekly' : 'daily',
        priority: isPast ? 0.6 : 0.7,
      };
    })
    .filter((entry): entry is SitemapEntry => Boolean(entry));
}

function matchDateWindow(): { fromDate: string; toDate: string } {
  const now = new Date();
  return {
    fromDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    toDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
}
