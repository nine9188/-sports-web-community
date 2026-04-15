import { NextResponse } from 'next/server';
import { siteConfig } from '@/shared/config';
import { getMajorLeagueIds } from '@/domains/livescore/actions/teamLeagueData';
import { getLeagueSlug } from '@/domains/livescore/utils/slugs';

// ISR: 1시간
export const revalidate = 3600;

const BASE_URL = siteConfig.url;

// 선수 사이트맵 대상 리그
const PLAYER_LEAGUES: Record<string, number> = {
  epl: 39, laliga: 140, bundesliga: 78, 'serie-a': 135, ligue1: 61,
  eredivisie: 88, primeira: 94, danish: 119, kleague: 292, kleague2: 293, jleague: 98,
  saudi: 307, mls: 253,
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

async function getBoardIdsByCategory(category: string): Promise<string[]> {
  const supabase = await getSupabase();
  const config = BOARD_CATEGORIES[category];
  if (!config) return [];

  const { data: parents } = await supabase
    .from('boards').select('id').in('slug', config.parentSlugs);
  if (!parents?.length) return [];

  const parentIds = parents.map(p => p.id);
  const { data: boards } = await supabase
    .from('boards').select('id')
    .or(`id.in.(${parentIds.join(',')}),parent_id.in.(${parentIds.join(',')})`);

  return (boards || []).map(b => b.id);
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

    // 게시판
    if (id.startsWith('boards-')) {
      const category = id.replace('boards-', '');
      const supabase = await getSupabase();
      const config = BOARD_CATEGORIES[category];
      if (!config) return sitemapResponse([{ loc: `${BASE_URL}/` }]);

      const { data: parents } = await supabase
        .from('boards').select('id, slug').in('slug', config.parentSlugs);
      if (!parents?.length) return sitemapResponse([{ loc: `${BASE_URL}/` }]);

      const parentIds = parents.map(p => p.id);
      const { data: boards } = await supabase
        .from('boards').select('slug').in('parent_id', parentIds).not('slug', 'is', null);

      const allSlugs = [...new Set([...parents.map(p => p.slug), ...(boards || []).map(b => b.slug)].filter(Boolean))];
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

    // 팀
    if (id === 'teams') {
      const supabase = await getSupabase();
      const { data: teams } = await supabase
        .from('football_teams').select('team_id, slug, updated_at')
        .in('league_id', Object.values(PLAYER_LEAGUES))
        .eq('is_active', true);

      return sitemapResponse((teams || []).map(t => ({
        loc: `${BASE_URL}/livescore/football/team/${t.team_id}/${t.slug || 'team'}`,
        lastmod: t.updated_at || undefined,
        changefreq: 'weekly', priority: 0.6,
      })));
    }

    // 선수 (리그별)
    if (id.startsWith('players-')) {
      const leagueSlug = id.replace('players-', '');
      const leagueId = PLAYER_LEAGUES[leagueSlug];
      if (!leagueId) return sitemapResponse([{ loc: `${BASE_URL}/` }]);

      const supabase = await getSupabase();
      const { data: teams } = await supabase
        .from('football_teams').select('team_id')
        .eq('league_id', leagueId).eq('is_active', true);
      if (!teams?.length) return sitemapResponse([{ loc: `${BASE_URL}/` }]);

      const { data: players } = await supabase
        .from('football_players').select('player_id, slug, updated_at')
        .in('team_id', teams.map(t => t.team_id))
        .eq('is_active', true);

      return sitemapResponse((players || []).map(p => ({
        loc: `${BASE_URL}/livescore/football/player/${p.player_id}/${p.slug || 'player'}`,
        lastmod: p.updated_at || undefined,
        changefreq: 'monthly', priority: 0.4,
      })));
    }

    // 샵
    if (id === 'shop') {
      const supabase = await getSupabase();
      const { data: categories } = await supabase
        .from('shop_categories').select('slug').eq('is_active', true);

      return sitemapResponse((categories || []).map(c => ({
        loc: `${BASE_URL}/shop/${c.slug}`, changefreq: 'weekly', priority: 0.3,
      })));
    }

    return sitemapResponse([{ loc: `${BASE_URL}/` }]);
  } catch (error) {
    console.error(`Sitemap ${id} 생성 오류:`, error);
    return sitemapResponse([{ loc: `${BASE_URL}/` }]);
  }
}
