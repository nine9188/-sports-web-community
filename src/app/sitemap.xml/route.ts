import { getMainSitemapSnapshot } from '@/shared/seo/sitemapSnapshot';
import { sitemapXmlResponse } from '@/shared/seo/sitemapXml';

export const revalidate = 3600;

export async function GET() {
  const snapshot = await getMainSitemapSnapshot();

  if (!snapshot) {
    return new Response('Sitemap snapshot is not ready.', {
      status: 503,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }

  return sitemapXmlResponse(snapshot.xml);
}
