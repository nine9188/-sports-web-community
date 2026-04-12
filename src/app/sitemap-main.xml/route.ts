import { siteConfig } from '@/shared/config';
import { sitemapResponse } from '@/shared/utils/sitemap';
import { HOTDEAL_BOARD_SLUGS } from '@/domains/boards/types/hotdeal/constants';

export const dynamic = 'force-dynamic';

export async function GET() {
  const b = siteConfig.url;
  return sitemapResponse([
    { url: b, lastModified: new Date().toISOString(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${b}/about`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${b}/guide`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${b}/contact`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${b}/privacy`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${b}/terms`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${b}/transfers`, changeFrequency: 'daily', priority: 0.6 },
    { url: `${b}/livescore/football`, changeFrequency: 'always', priority: 0.9 },
    { url: `${b}/livescore/football/leagues`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${b}/shop`, changeFrequency: 'weekly', priority: 0.4 },
    { url: `${b}/boards/all`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${b}/boards/popular`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${b}/search`, changeFrequency: 'weekly', priority: 0.5 },
    ...HOTDEAL_BOARD_SLUGS.map((slug) => ({
      url: `${b}/boards/${slug}`, changeFrequency: 'daily', priority: 0.6,
    })),
  ]);
}
