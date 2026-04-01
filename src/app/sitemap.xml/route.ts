import { siteConfig } from '@/shared/config';

export const revalidate = 3600;

const SITEMAPS = [
  'static',
  'posts',
  'matches',
  'teams',
  'players',
];

export async function GET() {
  const baseUrl = siteConfig.url;
  const now = new Date().toISOString();

  const sitemapEntries = SITEMAPS.map(
    (name) => `  <sitemap>
    <loc>${baseUrl}/sitemaps/${name}.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`
  ).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
