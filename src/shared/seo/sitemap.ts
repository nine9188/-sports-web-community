import type { MetadataRoute } from 'next';
import { getCachedAllBoards } from '@/domains/boards/actions/getCachedBoards';
import { getMajorLeagueIds } from '@/domains/livescore/actions/teamLeagueData';
import { getLeagueSlug } from '@/domains/livescore/utils/slugs';
import { getTransferLeagueTeamGroups } from '@/domains/livescore/actions/transfers/transferTeams';
import { isWorthlessSitemapPlayer } from '@/domains/livescore/utils/playerSeoQuality';
import { siteConfig } from '@/shared/config';
import { getSupabaseAdmin } from '@/shared/lib/supabase/server';

export const SITEMAP_PAGE_SIZE = 50000;

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
  slug: string | null;
  updated_at: string | null;
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
  match_date: string | null;
  updated_at: string | null;
};

type ShopCategoryRow = {
  slug: string | null;
};

export function siteUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${siteConfig.url}${normalizedPath}`;
}

export function sitemapPageCount(total: number): Array<{ id: number }> {
  return Array.from({ length: Math.max(1, Math.ceil(total / SITEMAP_PAGE_SIZE)) }, (_, id) => ({ id }));
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

export async function getShopSitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('shop_categories')
    .select('slug')
    .eq('is_active', true);

  if (error) {
    console.error('[sitemap] shop_categories query failed:', error);
    return [];
  }

  return ((data || []) as ShopCategoryRow[])
    .filter((category) => Boolean(category.slug))
    .map((category): SitemapEntry => ({
      url: siteUrl(`/shop/${category.slug}`),
      changeFrequency: 'weekly',
      priority: 0.3,
    }));
}

export async function getPostSitemapCount(): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('is_deleted', false)
    .eq('is_hidden', false);

  if (error) {
    console.error('[sitemap] posts count query failed:', error);
    return 0;
  }

  return count || 0;
}

export async function getPostSitemap(id: string | number): Promise<MetadataRoute.Sitemap> {
  const { from, to } = pageRange(id);
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('posts')
    .select('post_number, updated_at, created_at, boards!inner(slug)')
    .eq('is_deleted', false)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .range(from, to);

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

export async function getTeamSitemapCount(): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from('football_teams')
    .select('team_id', { count: 'exact', head: true })
    .eq('is_active', true)
    .not('slug', 'is', null);

  if (error) {
    console.error('[sitemap] football_teams count query failed:', error);
    return 0;
  }

  return count || 0;
}

export async function getTeamSitemap(id: string | number): Promise<MetadataRoute.Sitemap> {
  const { from, to } = pageRange(id);
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('football_teams')
    .select('team_id, slug, updated_at')
    .eq('is_active', true)
    .not('slug', 'is', null)
    .order('team_id', { ascending: true })
    .range(from, to);

  if (error) {
    console.error('[sitemap] football_teams page query failed:', error);
    return [];
  }

  return ((data || []) as TeamRow[]).map((team): SitemapEntry => ({
    url: siteUrl(`/livescore/football/team/${team.team_id}/${team.slug}`),
    lastModified: team.updated_at || undefined,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));
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
  const { count, error } = await supabase
    .from('football_players')
    .select('player_id', { count: 'exact', head: true })
    .eq('is_active', true)
    .not('slug', 'is', null);

  if (error) {
    console.error('[sitemap] football_players count query failed:', error);
    return 0;
  }

  return count || 0;
}

export async function getPlayerSitemap(id: string | number): Promise<MetadataRoute.Sitemap> {
  const { from, to } = pageRange(id);
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('football_players')
    .select('player_id, slug, updated_at, name, display_name, korean_name, team_id, team_name, position, number, age, photo_url')
    .eq('is_active', true)
    .not('slug', 'is', null)
    .order('player_id', { ascending: true })
    .range(from, to);

  if (error) {
    console.error('[sitemap] football_players page query failed:', error);
    return [];
  }

  return ((data || []) as PlayerRow[])
    .filter((player) => player.player_id > 0 && !isWorthlessSitemapPlayer(player))
    .map((player): SitemapEntry => ({
      url: siteUrl(`/livescore/football/player/${player.player_id}/${player.slug}`),
      lastModified: player.updated_at || undefined,
      changeFrequency: 'monthly',
      priority: 0.4,
    }));
}

export async function getMatchSitemapCount(): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { fromDate, toDate } = matchDateWindow();
  const { count, error } = await supabase
    .from('fixtures')
    .select('fixture_id', { count: 'exact', head: true })
    .gte('match_date', fromDate)
    .lte('match_date', toDate);

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
  const { data: fixtures, error } = await supabase
    .from('fixtures')
    .select('fixture_id, home_team_id, away_team_id, match_date, updated_at')
    .gte('match_date', fromDate)
    .lte('match_date', toDate)
    .order('match_date', { ascending: false })
    .range(from, to);

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
    const { data: teams, error: teamsError } = await supabase
      .from('football_teams')
      .select('team_id, slug')
      .in('team_id', teamIds)
      .not('slug', 'is', null);

    if (teamsError) {
      console.error('[sitemap] fixture team slug query failed:', teamsError);
    }

    for (const team of (teams || []) as TeamRow[]) {
      if (team.team_id && team.slug) teamSlugById.set(team.team_id, team.slug);
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
