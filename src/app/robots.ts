import type { MetadataRoute } from 'next';
import { siteConfig } from '@/shared/config';
import { siteUrl } from '@/shared/seo/sitemap';

function generatedSitemapUrl(path: string) {
  return siteUrl(`${path}/sitemap/0.xml`);
}

export default async function robots(): Promise<MetadataRoute.Robots> {
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
      generatedSitemapUrl('/boards/posts'),
      siteUrl('/livescore/football/leagues/sitemap.xml'),
      generatedSitemapUrl('/livescore/football/team'),
      generatedSitemapUrl('/livescore/football/player'),
      generatedSitemapUrl('/livescore/football/match'),
      siteUrl('/transfers/sitemap.xml'),
      siteUrl('/shop/sitemap.xml'),
    ],
  };
}
