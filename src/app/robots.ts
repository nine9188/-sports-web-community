import type { MetadataRoute } from 'next';
import { siteConfig } from '@/shared/config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/livescore/'],
        disallow: [
          '/signin',
          '/signup',
          '/social-signup',
          '/auth',
          '/help',
          '/settings',
          '/notifications',
          '/admin',
          '/api/',
          '/boards/*/create',
          '/boards/*/edit',
          '/test',
          '/ui',
          '/*?from=*',
          '/*?sort=*',
          '/.well-known/',
        ],
      },
      { userAgent: 'Amazonbot', disallow: '/' },
      { userAgent: 'SERankingBot', disallow: '/' },
      { userAgent: 'Yeti', allow: '/' },
    ],
    sitemap: [
      `${siteConfig.url}/sitemap.xml`,
      `${siteConfig.url}/sitemaps/static.xml`,
      `${siteConfig.url}/sitemaps/posts/foreign-news.xml`,
      `${siteConfig.url}/sitemaps/posts/domestic-news.xml`,
      `${siteConfig.url}/sitemaps/posts/foreign-analysis.xml`,
      `${siteConfig.url}/sitemaps/posts/foreign-analysis-bundesliga.xml`,
      `${siteConfig.url}/sitemaps/posts/foreign-analysis-serie-a.xml`,
      `${siteConfig.url}/sitemaps/posts/foreign-analysis-laliga.xml`,
      `${siteConfig.url}/sitemaps/posts/foreign-analysis-premier.xml`,
      `${siteConfig.url}/sitemaps/posts/foreign-analysis-ligue1.xml`,
      `${siteConfig.url}/sitemaps/posts/k-league-1.xml`,
      `${siteConfig.url}/sitemaps/posts/notice.xml`,
      `${siteConfig.url}/sitemaps/posts/recent.xml`,
      ...['epl','laliga','bundesliga','seriea','ligue1','eredivisie','primeira','kleague'].map(
        (s) => `${siteConfig.url}/sitemaps/teams/${s}.xml`
      ),
      ...['epl','laliga','bundesliga','seriea','ligue1','eredivisie','primeira','kleague','ucl','uel','uecl'].map(
        (s) => `${siteConfig.url}/sitemaps/matches/${s}.xml`
      ),
      `${siteConfig.url}/rss.xml`,
    ],
    host: siteConfig.url,
  };
}
