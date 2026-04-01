import { siteConfig } from '@/shared/config';
import { getSitemapSupabase, buildUrlsetXml, sitemapResponse } from '../utils';

export const revalidate = 3600;

// 게시판 slug 목록 (최신 글 시간 조회용)
const BOARD_SLUGS = [
  'all', 'popular',
  'hotdeal', 'hotdeal-food', 'hotdeal-beauty', 'hotdeal-mobile',
  'hotdeal-sale', 'hotdeal-appliance', 'hotdeal-apptech', 'hotdeal-living',
];

export async function GET() {
  const baseUrl = siteConfig.url;
  const supabase = getSitemapSupabase();
  const now = new Date().toISOString();

  // 전체 최신 글 시간 (홈, 전체글, 인기글용)
  const { data: latestPost } = await supabase
    .from('posts')
    .select('created_at')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const latestPostTime = latestPost?.created_at
    ? new Date(latestPost.created_at).toISOString()
    : now;

  // 라이브스코어/이적은 매일 갱신되므로 오늘 날짜
  const today = new Date().toISOString().split('T')[0] + 'T00:00:00Z';

  const urls: { loc: string; lastmod?: string }[] = [
    { loc: baseUrl, lastmod: latestPostTime },
    { loc: `${baseUrl}/boards/all`, lastmod: latestPostTime },
    { loc: `${baseUrl}/boards/popular`, lastmod: latestPostTime },
    { loc: `${baseUrl}/livescore/football`, lastmod: today },
    { loc: `${baseUrl}/livescore/football/leagues`, lastmod: today },
    { loc: `${baseUrl}/transfers`, lastmod: today },
    { loc: `${baseUrl}/shop`, lastmod: today },
    { loc: `${baseUrl}/about`, lastmod: '2026-04-02T00:00:00Z' },
    { loc: `${baseUrl}/contact`, lastmod: '2026-04-02T00:00:00Z' },
    { loc: `${baseUrl}/privacy`, lastmod: '2026-04-02T00:00:00Z' },
    { loc: `${baseUrl}/terms`, lastmod: '2026-04-02T00:00:00Z' },
  ];

  try {
    // 게시판 목록 + 생성일 (lastmod fallback용)
    const { data: boards } = await supabase
      .from('boards')
      .select('slug, created_at')
      .not('slug', 'is', null);

    if (boards) {
      const boardSlugs = boards.filter((b) => b.slug).map((b) => b.slug!);

      // 게시판 slug → 생성일 맵 (게시글 없을 때 fallback)
      const boardCreatedMap = new Map<string, string>();
      for (const b of boards) {
        if (b.slug && b.created_at) {
          boardCreatedMap.set(b.slug, new Date(b.created_at).toISOString());
        }
      }

      // 각 게시판별 최신 글 시간 조회
      const { data: boardLatestPosts } = await supabase
        .from('posts')
        .select('created_at, board:boards!inner(slug)')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      // slug → 최신 시간 맵 생성
      const slugLastmod = new Map<string, string>();
      if (boardLatestPosts) {
        for (const p of boardLatestPosts) {
          const slug = (p.board as { slug: string })?.slug;
          if (slug && !slugLastmod.has(slug)) {
            slugLastmod.set(slug, new Date(p.created_at!).toISOString());
          }
        }
      }

      // 게시판의 lastmod: 최신 게시글 시간 → 없으면 게시판 생성일
      const getBoardLastmod = (slug: string) =>
        slugLastmod.get(slug) || boardCreatedMap.get(slug) || now;

      // 핫딜 게시판 URL 추가
      for (const slug of BOARD_SLUGS) {
        if (!['all', 'popular'].includes(slug)) {
          urls.push({
            loc: `${baseUrl}/boards/${slug}`,
            lastmod: getBoardLastmod(slug),
          });
        }
      }

      // 나머지 게시판 URL 추가 (핫딜 제외)
      for (const slug of boardSlugs) {
        if (!BOARD_SLUGS.includes(slug)) {
          urls.push({
            loc: `${baseUrl}/boards/${slug}`,
            lastmod: getBoardLastmod(slug),
          });
        }
      }
    }

    // 리그 상세 (리그 데이터는 시즌 중 지속 갱신)
    const { data: leagues } = await supabase
      .from('leagues')
      .select('id, updated_at')
      .order('id', { ascending: true });

    if (leagues) {
      leagues.forEach((l) => {
        urls.push({
          loc: `${baseUrl}/livescore/football/leagues/${l.id}`,
          lastmod: l.updated_at ? new Date(l.updated_at).toISOString() : today,
        });
      });
    }

    // 샵 카테고리
    const { data: shopCategories } = await supabase
      .from('shop_categories')
      .select('slug, updated_at')
      .eq('is_active', true);

    if (shopCategories) {
      shopCategories.forEach((c) => {
        urls.push({
          loc: `${baseUrl}/shop/${c.slug}`,
          lastmod: c.updated_at ? new Date(c.updated_at).toISOString() : today,
        });
      });
    }
  } catch (error) {
    console.error('Static sitemap error:', error);
  }

  return sitemapResponse(buildUrlsetXml(urls));
}
