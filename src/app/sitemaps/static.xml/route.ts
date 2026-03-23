import { siteConfig } from '@/shared/config';
import { getSitemapSupabase, buildUrlsetXml, sitemapResponse } from '../utils';

export const revalidate = 3600;

export async function GET() {
  const baseUrl = siteConfig.url;
  const supabase = getSitemapSupabase();
  const now = new Date().toISOString();

  const urls = [
    { loc: baseUrl, lastmod: now, changefreq: 'daily', priority: 1 },
    { loc: `${baseUrl}/boards/all`, lastmod: now, changefreq: 'hourly', priority: 0.9 },
    { loc: `${baseUrl}/boards/popular`, lastmod: now, changefreq: 'hourly', priority: 0.9 },
    { loc: `${baseUrl}/boards/hotdeal`, lastmod: now, changefreq: 'hourly', priority: 0.85 },
    { loc: `${baseUrl}/boards/hotdeal-food`, lastmod: now, changefreq: 'hourly', priority: 0.8 },
    { loc: `${baseUrl}/boards/hotdeal-beauty`, lastmod: now, changefreq: 'hourly', priority: 0.8 },
    { loc: `${baseUrl}/boards/hotdeal-mobile`, lastmod: now, changefreq: 'hourly', priority: 0.8 },
    { loc: `${baseUrl}/boards/hotdeal-sale`, lastmod: now, changefreq: 'hourly', priority: 0.8 },
    { loc: `${baseUrl}/boards/hotdeal-appliance`, lastmod: now, changefreq: 'hourly', priority: 0.8 },
    { loc: `${baseUrl}/boards/hotdeal-apptech`, lastmod: now, changefreq: 'hourly', priority: 0.8 },
    { loc: `${baseUrl}/boards/hotdeal-living`, lastmod: now, changefreq: 'hourly', priority: 0.8 },
    { loc: `${baseUrl}/livescore/football`, lastmod: now, changefreq: 'always', priority: 0.8 },
    { loc: `${baseUrl}/livescore/football/leagues`, lastmod: now, changefreq: 'daily', priority: 0.7 },
    { loc: `${baseUrl}/transfers`, lastmod: now, changefreq: 'daily', priority: 0.7 },
    { loc: `${baseUrl}/shop`, lastmod: now, changefreq: 'weekly', priority: 0.5 },
    { loc: `${baseUrl}/about`, lastmod: now, changefreq: 'monthly', priority: 0.5 },
    { loc: `${baseUrl}/contact`, lastmod: now, changefreq: 'monthly', priority: 0.5 },
    { loc: `${baseUrl}/privacy`, lastmod: now, changefreq: 'monthly', priority: 0.3 },
    { loc: `${baseUrl}/terms`, lastmod: now, changefreq: 'monthly', priority: 0.3 },
  ];

  try {
    // 게시판 목록
    const { data: boards } = await supabase
      .from('boards')
      .select('slug')
      .not('slug', 'is', null);

    if (boards) {
      boards
        .filter((b) => b.slug)
        .forEach((b) => {
          urls.push({
            loc: `${baseUrl}/boards/${b.slug}`,
            lastmod: now,
            changefreq: 'hourly',
            priority: 0.8,
          });
        });
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
          lastmod: now,
          changefreq: 'daily',
          priority: 0.65,
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
          lastmod: now,
          changefreq: 'weekly',
          priority: 0.5,
        });
      });
    }
  } catch (error) {
    console.error('Static sitemap error:', error);
  }

  return sitemapResponse(buildUrlsetXml(urls));
}
