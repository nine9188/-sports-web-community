import { getRecentPostSitemap } from '@/shared/seo/sitemap';
import { sitemapUrlsetXml } from '@/shared/seo/sitemapXml';

export const revalidate = 300;

export async function GET() {
  const entries = await getRecentPostSitemap();
  if (!entries.length) {
    return new Response('Recent posts sitemap is temporarily unavailable.', {
      status: 503,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }

  return new Response(sitemapUrlsetXml(entries), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=3600',
    },
  });
}
