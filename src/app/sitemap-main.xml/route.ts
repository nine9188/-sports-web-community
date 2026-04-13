import { siteConfig } from '@/shared/config';
import { sitemapResponse, safeSitemap } from '@/shared/utils/sitemap';
import { HOTDEAL_BOARD_SLUGS } from '@/domains/boards/types/hotdeal/constants';

export const revalidate = 3600;

export async function GET() {
  return safeSitemap(async () => {
    const b = siteConfig.url;
    const now = new Date().toISOString();
    return sitemapResponse([
      { url: b, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
      { url: `${b}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
      { url: `${b}/guide`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
      { url: `${b}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
      { url: `${b}/privacy`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
      { url: `${b}/terms`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
      { url: `${b}/transfers`, lastModified: now, changeFrequency: 'daily', priority: 0.6 },
      { url: `${b}/livescore/football`, lastModified: now, changeFrequency: 'always', priority: 0.9 },
      { url: `${b}/livescore/football/leagues`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
      { url: `${b}/shop`, lastModified: now, changeFrequency: 'weekly', priority: 0.4 },
      { url: `${b}/boards/all`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
      { url: `${b}/boards/popular`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
      { url: `${b}/search`, lastModified: now, changeFrequency: 'weekly', priority: 0.5 },
      ...HOTDEAL_BOARD_SLUGS.map((slug) => ({
        url: `${b}/boards/${slug}`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.6,
      })),
    ]);
  });
}
