import type { MetadataRoute } from 'next';
import { siteConfig } from '@/shared/config';

const SITEMAP_IDS = [
  'static',
  'boards-football',
  'boards-kleague',
  'boards-news',
  'boards-community',
  'posts-football',
  'posts-kleague',
  'posts-news',
  'posts-community',
  'teams',
  'matches',
  'shop',
  'players-epl',
  'players-laliga',
  'players-bundesliga',
  'players-serie-a',
  'players-ligue1',
  'players-eredivisie',
  'players-primeira',
  'players-danish',
  'players-kleague',
  'players-jleague',
  'players-saudi',
  'players-mls',
];

export default function robots(): MetadataRoute.Robots {
  const sitemapBaseUrl = `${siteConfig.url}/sitemaps`;

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
      { userAgent: 'SERankingBot', disallow: '/' },
    ],
    host: new URL(siteConfig.url).host,
    sitemap: [
      `${siteConfig.url}/sitemap.xml`,
      `${siteConfig.url}/sitemap-index.xml`,
      ...SITEMAP_IDS.map((id) => `${sitemapBaseUrl}/${id}.xml`),
    ],
  };
}
