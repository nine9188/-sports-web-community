import type { MetadataRoute } from 'next';
import { siteConfig } from '@/shared/config';
import {
  getMatchSitemapCount,
  getPlayerSitemapCount,
  getPostSitemapCount,
  getTeamSitemapCount,
  sitemapPageCount,
  siteUrl,
} from '@/shared/seo/sitemap';

function generatedSitemapUrls(path: string, pages: Array<{ id: number }>) {
  return pages.map(({ id }) => siteUrl(`${path}/sitemap/${id}.xml`));
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  const [postPages, teamPages, playerPages, matchPages] = await Promise.all([
    getPostSitemapCount().then(sitemapPageCount),
    getTeamSitemapCount().then(sitemapPageCount),
    getPlayerSitemapCount().then(sitemapPageCount),
    getMatchSitemapCount().then(sitemapPageCount),
  ]);

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/livescore/'],
        disallow: [
          '/signin','/signup','/social-signup','/auth','/help','/settings',
          '/notifications','/admin','/api/','/boards/*/create','/boards/*/edit',
          '/ui','/*?from=*','/*?sort=*',
        ],
      },
      {
        userAgent: 'GPTBot',
        allow: ['/', '/livescore/football', '/livescore/football/leagues'],
        disallow: [
          '/livescore/football/match/',
          '/livescore/football/player/',
          '/livescore/football/team/',
          '/livescore/football/*?*',
          '/*_rsc=*',
        ],
      },
      {
        userAgent: 'OAI-SearchBot',
        allow: '/',
      },
      { userAgent: 'SERankingBot', disallow: '/' },
    ],
    host: new URL(siteConfig.url).host,
    sitemap: [
      siteUrl('/sitemap.xml'),
      siteUrl('/boards/sitemap.xml'),
      ...generatedSitemapUrls('/boards/posts', postPages),
      siteUrl('/livescore/football/leagues/sitemap.xml'),
      ...generatedSitemapUrls('/livescore/football/team', teamPages),
      ...generatedSitemapUrls('/livescore/football/player', playerPages),
      ...generatedSitemapUrls('/livescore/football/match', matchPages),
      siteUrl('/shop/sitemap.xml'),
    ],
  };
}
