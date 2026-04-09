import { siteConfig } from '@/shared/config';
import { getSitemapSupabase, buildUrlsetXml, sitemapResponse, REVALIDATE } from '../utils';

export const revalidate = 21600; // 6시간

export async function GET() {
  const baseUrl = siteConfig.url;
  const supabase = getSitemapSupabase();
  const now = new Date().toISOString();

  // 라이브스코어/이적은 매일 갱신
  const today = new Date().toISOString().split('T')[0] + 'T00:00:00Z';

  const urls: { loc: string; lastmod?: string }[] = [
    // 메인
    { loc: baseUrl, lastmod: now },
    { loc: `${baseUrl}/boards/all`, lastmod: now },
    { loc: `${baseUrl}/boards/popular`, lastmod: now },

    // 라이브스코어
    { loc: `${baseUrl}/livescore/football`, lastmod: today },
    { loc: `${baseUrl}/livescore/football/leagues`, lastmod: today },
    { loc: `${baseUrl}/transfers`, lastmod: today },

    // 샵
    { loc: `${baseUrl}/shop`, lastmod: today },
    { loc: `${baseUrl}/shop/emoticon-studio`, lastmod: today },

    // 정적 페이지
    { loc: `${baseUrl}/about`, lastmod: '2026-04-02T00:00:00Z' },
    { loc: `${baseUrl}/guide`, lastmod: '2026-04-02T00:00:00Z' },
    { loc: `${baseUrl}/contact`, lastmod: '2026-04-02T00:00:00Z' },
    { loc: `${baseUrl}/privacy`, lastmod: '2026-04-02T00:00:00Z' },
    { loc: `${baseUrl}/terms`, lastmod: '2026-04-02T00:00:00Z' },
  ];

  try {
    // 게시판 목록 페이지 URL (게시글 사이트맵과 별개로, 게시판 "리스트" 페이지)
    const { data: boards } = await supabase
      .from('boards')
      .select('slug, created_at')
      .not('slug', 'is', null);

    if (boards) {
      for (const b of boards) {
        if (b.slug) {
          urls.push({
            loc: `${baseUrl}/boards/${b.slug}`,
            lastmod: b.created_at ? new Date(b.created_at).toISOString() : now,
          });
        }
      }
    }

    // 리그 상세 페이지
    const { data: leagues } = await supabase
      .from('leagues')
      .select('id, updated_at')
      .order('id', { ascending: true });

    if (leagues) {
      for (const l of leagues) {
        urls.push({
          loc: `${baseUrl}/livescore/football/leagues/${l.id}`,
          lastmod: l.updated_at ? new Date(l.updated_at).toISOString() : today,
        });
      }
    }

    // 샵 카테고리
    const { data: shopCategories } = await supabase
      .from('shop_categories')
      .select('slug, updated_at')
      .eq('is_active', true);

    if (shopCategories) {
      for (const c of shopCategories) {
        urls.push({
          loc: `${baseUrl}/shop/${c.slug}`,
          lastmod: c.updated_at ? new Date(c.updated_at).toISOString() : today,
        });
      }
    }
  } catch (error) {
    console.error('Static sitemap error:', error);
  }

  return sitemapResponse(buildUrlsetXml(urls), REVALIDATE.STANDARD);
}
