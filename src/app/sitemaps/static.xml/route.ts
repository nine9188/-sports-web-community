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
    : undefined;

  const urls: { loc: string; lastmod?: string }[] = [
    { loc: baseUrl, lastmod: latestPostTime },
    { loc: `${baseUrl}/boards/all`, lastmod: latestPostTime },
    { loc: `${baseUrl}/boards/popular`, lastmod: latestPostTime },
    { loc: `${baseUrl}/livescore/football` },
    { loc: `${baseUrl}/livescore/football/leagues` },
    { loc: `${baseUrl}/transfers` },
    { loc: `${baseUrl}/shop` },
    { loc: `${baseUrl}/about` },
    { loc: `${baseUrl}/contact` },
    { loc: `${baseUrl}/privacy` },
    { loc: `${baseUrl}/terms` },
  ];

  try {
    // 게시판 목록 + 각 게시판의 최신 글 시간
    const { data: boards } = await supabase
      .from('boards')
      .select('slug')
      .not('slug', 'is', null);

    if (boards) {
      const boardSlugs = boards.filter((b) => b.slug).map((b) => b.slug!);

      // 핫딜 게시판 포함, 전체 게시판의 최신 글 시간을 한번에 조회
      const allSlugs = [...new Set([...BOARD_SLUGS, ...boardSlugs])];

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

      // 핫딜 게시판 URL 추가
      for (const slug of BOARD_SLUGS) {
        if (!['all', 'popular'].includes(slug)) {
          urls.push({
            loc: `${baseUrl}/boards/${slug}`,
            lastmod: slugLastmod.get(slug),
          });
        }
      }

      // 나머지 게시판 URL 추가 (핫딜 제외)
      for (const slug of boardSlugs) {
        if (!BOARD_SLUGS.includes(slug)) {
          urls.push({
            loc: `${baseUrl}/boards/${slug}`,
            lastmod: slugLastmod.get(slug),
          });
        }
      }
    }

    // 리그 상세
    const { data: leagues } = await supabase
      .from('leagues')
      .select('id')
      .order('id', { ascending: true });

    if (leagues) {
      leagues.forEach((l) => {
        urls.push({
          loc: `${baseUrl}/livescore/football/leagues/${l.id}`,
        });
      });
    }

    // 샵 카테고리
    const { data: shopCategories } = await supabase
      .from('shop_categories')
      .select('slug')
      .eq('is_active', true);

    if (shopCategories) {
      shopCategories.forEach((c) => {
        urls.push({
          loc: `${baseUrl}/shop/${c.slug}`,
        });
      });
    }
  } catch (error) {
    console.error('Static sitemap error:', error);
  }

  return sitemapResponse(buildUrlsetXml(urls));
}
