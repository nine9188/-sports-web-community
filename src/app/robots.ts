import type { MetadataRoute } from 'next';
import { siteConfig } from '@/shared/config';

export default function robots(): MetadataRoute.Robots {
  const u = siteConfig.url;
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/livescore/'],
        disallow: [
          '/signin','/signup','/social-signup','/auth','/help','/settings',
          '/notifications','/admin','/api/','/boards/*/create','/boards/*/edit',
          '/test','/ui','/*?from=*','/*?sort=*','/.well-known/',
        ],
      },
      { userAgent: 'Amazonbot', disallow: '/' },
      { userAgent: 'SERankingBot', disallow: '/' },
      { userAgent: 'Yeti', allow: '/' },
    ],
    sitemap: [
      `${u}/sitemap-main.xml`,
      `${u}/sitemap-boards.xml`,
      `${u}/sitemap-posts.xml`,
      `${u}/sitemap-teams.xml`,
      `${u}/sitemap-players.xml`,
      `${u}/sitemap-matches.xml`,
      `${u}/sitemap-leagues.xml`,
    ],
    host: siteConfig.url,
  };
}
