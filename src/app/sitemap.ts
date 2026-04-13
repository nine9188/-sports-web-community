import { MetadataRoute } from 'next';
import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { siteConfig } from '@/shared/config';
import { MAJOR_LEAGUE_IDS } from '@/domains/livescore/constants/league-mappings';

// 사이트맵 revalidate: 1시간
export const revalidate = 3600;

// --- 상수 ---

const BASE_URL = siteConfig.url;

// 선수 사이트맵 대상 리그 (slug → leagueId)
const PLAYER_LEAGUES: Record<string, number> = {
  epl: 39,
  laliga: 140,
  bundesliga: 78,
  'serie-a': 135,
  ligue1: 61,
  eredivisie: 88,
  primeira: 94,
  danish: 119,
  kleague: 292,
  jleague: 98,
  saudi: 307,
  mls: 253,
};

// 게시판 카테고리 → parent board IDs
// 해외 축구: soccer 자체 + 하위 리그 카테고리(premier, laliga, bundesliga, serie-a, LIGUE1)
const BOARD_CATEGORIES = {
  football: {
    // 해외 축구 관련 parent slugs
    parentSlugs: ['soccer', 'premier', 'laliga', 'bundesliga', 'serie-a', 'LIGUE1'],
  },
  kleague: {
    parentSlugs: ['k-league', 'k-league-1', 'k-league-2'],
  },
  news: {
    parentSlugs: ['news', 'data-analysis', 'foreign-analysis', 'domestic-analysis'],
  },
  community: {
    parentSlugs: ['free', 'hotdeal', 'market', 'review', 'creative'],
  },
};

// 정적 페이지 목록
const STATIC_PAGES = [
  { path: '/', changeFrequency: 'daily' as const, priority: 1.0 },
  { path: '/about', changeFrequency: 'monthly' as const, priority: 0.3 },
  { path: '/guide', changeFrequency: 'monthly' as const, priority: 0.3 },
  { path: '/privacy', changeFrequency: 'yearly' as const, priority: 0.2 },
  { path: '/terms', changeFrequency: 'yearly' as const, priority: 0.2 },
  { path: '/contact', changeFrequency: 'monthly' as const, priority: 0.3 },
  { path: '/search', changeFrequency: 'daily' as const, priority: 0.5 },
  { path: '/transfers', changeFrequency: 'daily' as const, priority: 0.6 },
  { path: '/livescore/football', changeFrequency: 'always' as const, priority: 0.9 },
  { path: '/livescore/football/leagues', changeFrequency: 'weekly' as const, priority: 0.7 },
  { path: '/shop', changeFrequency: 'weekly' as const, priority: 0.4 },
  { path: '/shop/emoticon-studio', changeFrequency: 'weekly' as const, priority: 0.3 },
  { path: '/boards/all', changeFrequency: 'daily' as const, priority: 0.6 },
  { path: '/boards/popular', changeFrequency: 'hourly' as const, priority: 0.7 },
];

// 핫딜 게시판 slugs
const HOTDEAL_SLUGS = [
  'hotdeal', 'hotdeal-food', 'hotdeal-game', 'hotdeal-pc', 'hotdeal-appliance',
  'hotdeal-living', 'hotdeal-fashion', 'hotdeal-sale', 'hotdeal-beauty',
  'hotdeal-mobile', 'hotdeal-package', 'hotdeal-coupon', 'hotdeal-apptech',
  'hotdeal-sports', 'hotdeal-overseas', 'hotdeal-etc',
];

// --- 헬퍼 ---

function url(path: string) {
  return `${BASE_URL}${path}`;
}

async function getSupabase() {
  return getSupabaseServer();
}

// 카테고리에 해당하는 게시판 ID 목록
async function getBoardIdsByCategory(category: keyof typeof BOARD_CATEGORIES): Promise<string[]> {
  const supabase = await getSupabase();
  const { parentSlugs } = BOARD_CATEGORIES[category];

  // parent slug에 해당하는 board id 가져오기
  const { data: parents } = await supabase
    .from('boards')
    .select('id')
    .in('slug', parentSlugs);

  if (!parents?.length) return [];

  const parentIds = parents.map(p => p.id);

  // 해당 parent의 하위 게시판 + parent 자체
  const { data: boards } = await supabase
    .from('boards')
    .select('id')
    .or(`id.in.(${parentIds.join(',')}),parent_id.in.(${parentIds.join(',')})`);

  return (boards || []).map(b => b.id);
}

// --- ID 매핑 (Next.js 15 generateSitemaps는 number id만 지원) ---

const SITEMAP_ID_MAP: Record<number, string> = {
  0: 'static',
  1: 'boards-football',
  2: 'boards-kleague',
  3: 'boards-news',
  4: 'boards-community',
  5: 'posts-football',
  6: 'posts-kleague',
  7: 'posts-news',
  8: 'posts-community',
  9: 'teams',
  10: 'shop',
  11: 'players-epl',
  12: 'players-laliga',
  13: 'players-bundesliga',
  14: 'players-serie-a',
  15: 'players-ligue1',
  16: 'players-eredivisie',
  17: 'players-primeira',
  18: 'players-danish',
  19: 'players-kleague',
  20: 'players-jleague',
  21: 'players-saudi',
  22: 'players-mls',
};

// --- generateSitemaps ---

export async function generateSitemaps() {
  return Object.keys(SITEMAP_ID_MAP).map(id => ({ id: Number(id) }));
}

// --- sitemap ---

export default async function sitemap(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  arg: any
): Promise<MetadataRoute.Sitemap> {
  // Next.js 15: params는 Promise<{id: number}> 형태
  const resolved = typeof arg?.then === 'function' ? await arg : arg;
  const rawId = typeof resolved?.id?.then === 'function' ? await resolved.id : resolved?.id ?? resolved;
  const numId = Number(rawId);
  const name = SITEMAP_ID_MAP[numId];
  if (!name) return [];

  // 정적 페이지 + 리그
  if (name === 'static') {
    return buildStaticSitemap();
  }

  // 게시판
  if (name.startsWith('boards-')) {
    const category = name.replace('boards-', '') as keyof typeof BOARD_CATEGORIES;
    return buildBoardsSitemap(category);
  }

  // 게시글
  if (name.startsWith('posts-')) {
    const category = name.replace('posts-', '') as keyof typeof BOARD_CATEGORIES;
    return buildPostsSitemap(category);
  }

  // 팀
  if (name === 'teams') {
    return buildTeamsSitemap();
  }

  // 선수 (리그별)
  if (name.startsWith('players-')) {
    const leagueSlug = name.replace('players-', '');
    const leagueId = PLAYER_LEAGUES[leagueSlug];
    if (leagueId) return buildPlayersSitemap(leagueId);
  }

  // 샵
  if (name === 'shop') {
    return buildShopSitemap();
  }

  return [];
}

// --- 개별 사이트맵 빌더 ---

async function buildStaticSitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // 정적 페이지
  for (const page of STATIC_PAGES) {
    entries.push({
      url: url(page.path),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    });
  }

  // 핫딜 게시판
  for (const slug of HOTDEAL_SLUGS) {
    entries.push({
      url: url(`/boards/${slug}`),
      changeFrequency: 'hourly',
      priority: 0.6,
    });
  }

  // 리그 상세 페이지 (MAJOR_LEAGUE_IDS 상수에서)
  const leagueIds = Object.values(MAJOR_LEAGUE_IDS);
  for (const leagueId of leagueIds) {
    entries.push({
      url: url(`/livescore/football/leagues/${leagueId}`),
      changeFrequency: 'daily',
      priority: 0.7,
    });
  }

  return entries;
}

async function buildBoardsSitemap(category: keyof typeof BOARD_CATEGORIES): Promise<MetadataRoute.Sitemap> {
  const supabase = await getSupabase();
  const { parentSlugs } = BOARD_CATEGORIES[category];

  // parent 게시판들
  const { data: parents } = await supabase
    .from('boards')
    .select('id, slug')
    .in('slug', parentSlugs);

  if (!parents?.length) return [];
  const parentIds = parents.map(p => p.id);

  // 하위 게시판들
  const { data: boards } = await supabase
    .from('boards')
    .select('slug')
    .in('parent_id', parentIds)
    .not('slug', 'is', null);

  const allSlugs = [
    ...parents.map(p => p.slug),
    ...(boards || []).map(b => b.slug),
  ].filter(Boolean);

  return allSlugs.map(slug => ({
    url: url(`/boards/${slug}`),
    changeFrequency: 'daily' as const,
    priority: 0.5,
  }));
}

async function buildPostsSitemap(category: keyof typeof BOARD_CATEGORIES): Promise<MetadataRoute.Sitemap> {
  const supabase = await getSupabase();
  const boardIds = await getBoardIdsByCategory(category);

  if (boardIds.length === 0) return [];

  // 해당 카테고리 게시글 (삭제/숨김 제외)
  const { data: posts } = await supabase
    .from('posts')
    .select('post_number, board_id, updated_at, created_at, boards!inner(slug)')
    .in('board_id', boardIds)
    .eq('is_deleted', false)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .limit(5000);

  if (!posts?.length) return [];

  return posts.map(post => {
    const boardSlug = (post.boards as unknown as { slug: string })?.slug;
    return {
      url: url(`/boards/${boardSlug}/${post.post_number}`),
      lastModified: post.updated_at || post.created_at || undefined,
      changeFrequency: 'weekly' as const,
      priority: 0.4,
    };
  }).filter(entry => entry.url.includes('/boards/'));
}

async function buildTeamsSitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await getSupabase();

  const SYNC_LEAGUE_IDS = Object.values(PLAYER_LEAGUES);

  const { data: teams } = await supabase
    .from('football_teams')
    .select('team_id, updated_at')
    .in('league_id', SYNC_LEAGUE_IDS)
    .eq('is_active', true);

  if (!teams?.length) return [];

  return teams.map(team => ({
    url: url(`/livescore/football/team/${team.team_id}`),
    lastModified: team.updated_at || undefined,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));
}

async function buildPlayersSitemap(leagueId: number): Promise<MetadataRoute.Sitemap> {
  const supabase = await getSupabase();

  // 해당 리그 팀 ID 목록
  const { data: teams } = await supabase
    .from('football_teams')
    .select('team_id')
    .eq('league_id', leagueId)
    .eq('is_active', true);

  if (!teams?.length) return [];
  const teamIds = teams.map(t => t.team_id);

  // 해당 팀 소속 선수
  const { data: players } = await supabase
    .from('football_players')
    .select('player_id, updated_at')
    .in('team_id', teamIds)
    .eq('is_active', true);

  if (!players?.length) return [];

  return players.map(player => ({
    url: url(`/livescore/football/player/${player.player_id}`),
    lastModified: player.updated_at || undefined,
    changeFrequency: 'monthly' as const,
    priority: 0.4,
  }));
}

async function buildShopSitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await getSupabase();

  const { data: categories } = await supabase
    .from('shop_categories')
    .select('slug')
    .eq('is_active', true);

  if (!categories?.length) return [];

  return categories.map(cat => ({
    url: url(`/shop/${cat.slug}`),
    changeFrequency: 'weekly' as const,
    priority: 0.3,
  }));
}
