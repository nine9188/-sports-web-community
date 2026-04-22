import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { siteConfig } from '@/shared/config';
import { getMajorLeagueIds } from '@/domains/livescore/actions/teamLeagueData';
import { getLeagueSlug } from '@/domains/livescore/utils/slugs';
import { getCachedAllBoards } from '@/domains/boards/actions/getCachedBoards';
import { getSupabaseAdmin } from '@/shared/lib/supabase/server';

// ISR: 1시간
export const revalidate = 3600;

// 거의 변하지 않는 참조 데이터는 1시간 캐시 (sitemap은 최신성 요구 낮음)
const _getCachedActiveTeams = unstable_cache(
  async () => {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('football_teams')
      .select('team_id, slug, updated_at, league_id')
      .eq('is_active', true);
    return data || [];
  },
  ['sitemap-active-teams'],
  { revalidate: 3600, tags: ['sitemap-teams'] }
);


const _getCachedActiveShopCategories = unstable_cache(
  async () => {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('shop_categories')
      .select('slug')
      .eq('is_active', true);
    return data || [];
  },
  ['sitemap-shop-categories'],
  { revalidate: 3600, tags: ['sitemap-shop'] }
);

const BASE_URL = siteConfig.url;

// 사이트맵 대상 리그 (5대 리그만 — 봇 크롤링 비용 절감)
const SITEMAP_LEAGUES: Record<string, number> = {
  epl: 39, laliga: 140, bundesliga: 78, 'serie-a': 135, ligue1: 61,
};

// 게시판 카테고리
const BOARD_CATEGORIES: Record<string, { parentSlugs: string[] }> = {
  football: { parentSlugs: ['soccer', 'premier', 'laliga', 'bundesliga', 'serie-a', 'LIGUE1'] },
  kleague: { parentSlugs: ['k-league', 'k-league-1', 'k-league-2'] },
  news: { parentSlugs: ['news', 'data-analysis', 'foreign-analysis', 'domestic-analysis'] },
  community: { parentSlugs: ['free', 'hotdeal', 'market', 'review', 'creative'] },
};

const STATIC_PAGES = [
  { path: '/', changefreq: 'daily', priority: 1.0 },
  { path: '/about', changefreq: 'monthly', priority: 0.3 },
  { path: '/guide', changefreq: 'monthly', priority: 0.3 },
  { path: '/privacy', changefreq: 'yearly', priority: 0.2 },
  { path: '/terms', changefreq: 'yearly', priority: 0.2 },
  { path: '/contact', changefreq: 'monthly', priority: 0.3 },
  { path: '/search', changefreq: 'daily', priority: 0.5 },
  { path: '/transfers', changefreq: 'daily', priority: 0.6 },
  { path: '/livescore/football', changefreq: 'always', priority: 0.9 },
  { path: '/livescore/football/leagues', changefreq: 'weekly', priority: 0.7 },
  { path: '/shop', changefreq: 'weekly', priority: 0.4 },
  { path: '/shop/emoticon-studio', changefreq: 'weekly', priority: 0.3 },
  { path: '/boards/all', changefreq: 'daily', priority: 0.6 },
  { path: '/boards/popular', changefreq: 'hourly', priority: 0.7 },
];

const HOTDEAL_SLUGS = [
  'hotdeal', 'hotdeal-food', 'hotdeal-game', 'hotdeal-pc', 'hotdeal-appliance',
  'hotdeal-living', 'hotdeal-fashion', 'hotdeal-sale', 'hotdeal-beauty',
  'hotdeal-mobile', 'hotdeal-package', 'hotdeal-coupon', 'hotdeal-apptech',
  'hotdeal-sports', 'hotdeal-overseas', 'hotdeal-etc',
];

// --- XML 헬퍼 ---

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: number;
}

function toXml(entries: SitemapEntry[]): string {
  const urls = entries.map(e => {
    let xml = `  <url>\n    <loc>${escapeXml(e.loc)}</loc>`;
    if (e.lastmod) xml += `\n    <lastmod>${e.lastmod}</lastmod>`;
    if (e.changefreq) xml += `\n    <changefreq>${e.changefreq}</changefreq>`;
    if (e.priority !== undefined) xml += `\n    <priority>${e.priority}</priority>`;
    xml += '\n  </url>';
    return xml;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

function sitemapResponse(entries: SitemapEntry[]) {
  return new NextResponse(toXml(entries), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}

// --- Supabase ---

async function getSupabase() {
  const { getSupabaseServer } = await import('@/shared/lib/supabase/server');
  return getSupabaseServer();
}

/**
 * 게시판 카테고리 → 하위 게시판 ID 목록 조회
 * getCachedAllBoards() 활용 (unstable_cache 7일) → DB 조회 없음
 */
async function getBoardIdsByCategory(category: string): Promise<string[]> {
  const config = BOARD_CATEGORIES[category];
  if (!config) return [];

  const allBoards = await getCachedAllBoards();

  // parent slugs와 일치하는 보드의 ID 수집
  const parents = allBoards.filter(b => b.slug && config.parentSlugs.includes(b.slug));
  if (!parents.length) return [];

  const parentIds = new Set(parents.map(p => p.id));

  // parent 자신 + parent_id가 parent에 속하는 보드의 ID 수집
  const relevant = allBoards.filter(
    b => parentIds.has(b.id) || (b.parent_id && parentIds.has(b.parent_id))
  );

  return relevant.map(b => b.id);
}

// --- GET handler ---

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await props.params;
  // .xml 확장자 제거
  const id = rawId.replace(/\.xml$/, '');

  try {
    // 정적 + 리그
    if (id === 'static') {
      const entries: SitemapEntry[] = [];
      for (const p of STATIC_PAGES) {
        entries.push({ loc: `${BASE_URL}${p.path}`, changefreq: p.changefreq, priority: p.priority });
      }
      for (const slug of HOTDEAL_SLUGS) {
        entries.push({ loc: `${BASE_URL}/boards/${slug}`, changefreq: 'hourly', priority: 0.6 });
      }
      for (const leagueId of await getMajorLeagueIds()) {
        entries.push({ loc: `${BASE_URL}/livescore/football/leagues/${leagueId}/${getLeagueSlug(leagueId)}`, changefreq: 'daily', priority: 0.7 });
      }
      return sitemapResponse(entries);
    }

    // 게시판 (getCachedAllBoards 활용, DB 조회 없음)
    if (id.startsWith('boards-')) {
      const category = id.replace('boards-', '');
      const config = BOARD_CATEGORIES[category];
      if (!config) return sitemapResponse([{ loc: `${BASE_URL}/` }]);

      const allBoards = await getCachedAllBoards();
      const parents = allBoards.filter(b => b.slug && config.parentSlugs.includes(b.slug));
      if (!parents.length) return sitemapResponse([{ loc: `${BASE_URL}/` }]);

      const parentIds = new Set(parents.map(p => p.id));
      const children = allBoards.filter(b => b.parent_id && parentIds.has(b.parent_id) && b.slug);

      const allSlugs = [...new Set([
        ...parents.map(p => p.slug),
        ...children.map(b => b.slug),
      ].filter(Boolean))] as string[];

      return sitemapResponse(allSlugs.map(slug => ({ loc: `${BASE_URL}/boards/${slug}`, changefreq: 'daily', priority: 0.5 })));
    }

    // 게시글
    if (id.startsWith('posts-')) {
      const category = id.replace('posts-', '');
      const supabase = await getSupabase();
      const boardIds = await getBoardIdsByCategory(category);
      if (!boardIds.length) return sitemapResponse([{ loc: `${BASE_URL}/` }]);

      const { data: posts } = await supabase
        .from('posts')
        .select('post_number, board_id, updated_at, created_at, boards!inner(slug)')
        .in('board_id', boardIds)
        .eq('is_deleted', false)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(5000);

      if (!posts?.length) return sitemapResponse([{ loc: `${BASE_URL}/` }]);

      const entries = posts.map(post => {
        const boardSlug = (post.boards as unknown as { slug: string })?.slug;
        const lastmod = post.updated_at || post.created_at;
        return { loc: `${BASE_URL}/boards/${boardSlug}/${post.post_number}`, lastmod: lastmod || undefined, changefreq: 'weekly', priority: 0.4 };
      }).filter(e => !e.loc.includes('/undefined/'));

      return sitemapResponse(entries);
    }

    // 팀 (5대 리그만, unstable_cache 1시간)
    if (id === 'teams') {
      const allTeams = await _getCachedActiveTeams();
      const leagueIdSet = new Set(Object.values(SITEMAP_LEAGUES));
      const teams = allTeams.filter(t => t.league_id !== null && leagueIdSet.has(t.league_id));

      return sitemapResponse(teams.map(t => ({
        loc: `${BASE_URL}/livescore/football/team/${t.team_id}/${t.slug || 'team'}`,
        lastmod: t.updated_at || undefined,
        changefreq: 'weekly', priority: 0.6,
      })));
    }

    // 선수 — 사이트맵 인덱스에서 제거됨 (봇 크롤링 비용 절감)
    if (id.startsWith('players-')) {
      return sitemapResponse([]);
      const leagueSlug = id.replace('players-', '');
      const leagueId = SITEMAP_LEAGUES[leagueSlug];
      if (!leagueId) return sitemapResponse([{ loc: `${BASE_URL}/` }]);

      const allTeams = await _getCachedActiveTeams();
      const leagueTeamIds = allTeams
        .filter(t => t.league_id === leagueId)
        .map(t => t.team_id);
      if (!leagueTeamIds.length) return sitemapResponse([{ loc: `${BASE_URL}/` }]);

      const players = await _getCachedActivePlayersByTeam(leagueTeamIds);

      return sitemapResponse(players.map(p => ({
        loc: `${BASE_URL}/livescore/football/player/${p.player_id}/${p.slug || 'player'}`,
        lastmod: p.updated_at || undefined,
        changefreq: 'monthly', priority: 0.4,
      })));
    }

    // 매치 — 사이트맵 인덱스에서 제거됨 (API 호출 절감)
    if (id === 'matches') {
      return sitemapResponse([]);
    }

    // 샵 (unstable_cache 1시간)
    if (id === 'shop') {
      const categories = await _getCachedActiveShopCategories();

      return sitemapResponse(categories.map(c => ({
        loc: `${BASE_URL}/shop/${c.slug}`, changefreq: 'weekly', priority: 0.3,
      })));
    }

    return sitemapResponse([{ loc: `${BASE_URL}/` }]);
  } catch (error) {
    console.error(`Sitemap ${id} 생성 오류:`, error);
    return sitemapResponse([{ loc: `${BASE_URL}/` }]);
  }
}
