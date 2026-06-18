import type { MetadataRoute } from 'next';

type SitemapEntry = MetadataRoute.Sitemap[number];

export type SitemapIndexEntry = {
  loc: string;
  lastModified?: string | Date;
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate(value: string | Date): string {
  if (value instanceof Date) return value.toISOString();
  return value;
}

export function sitemapIndexXml(entries: SitemapIndexEntry[]): string {
  const sitemaps = entries
    .map((entry) => {
      const lastmod = entry.lastModified
        ? `\n    <lastmod>${escapeXml(formatDate(entry.lastModified))}</lastmod>`
        : '';

      return `  <sitemap>\n    <loc>${escapeXml(entry.loc)}</loc>${lastmod}\n  </sitemap>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemaps}\n</sitemapindex>\n`;
}

export type ExtendedSitemapEntry = SitemapEntry & {
  images?: string[];
};

export function sitemapUrlsetXml(entries: ExtendedSitemapEntry[]): string {
  const urls = entries
    .map((entry: ExtendedSitemapEntry) => {
      const lastmod = entry.lastModified
        ? `\n    <lastmod>${escapeXml(formatDate(entry.lastModified))}</lastmod>`
        : '';

      const images = entry.images && entry.images.length > 0
        ? entry.images
            .map((img) => `\n    <image:image>\n      <image:loc>${escapeXml(img)}</image:loc>\n    </image:image>`)
            .join('')
        : '';

      return `  <url>\n    <loc>${escapeXml(entry.url)}</loc>${lastmod}${images}\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls}\n</urlset>\n`;
}

export function sitemapXmlResponse(xml: string): Response {
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

