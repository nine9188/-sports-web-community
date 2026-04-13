import type { MetadataRoute } from 'next';
import { siteConfig } from '@/shared/config';

const LEAGUE_SLUGS = ['epl','laliga','bundesliga','serie-a','ligue1','championship','scottish','eredivisie','primeira','ucl','uel','uecl','kleague','jleague','saudi','csl','mls','brasileirao','liga-mx','danish'];

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
      `${u}/sitemap-leagues.xml`,
      ...LEAGUE_SLUGS.flatMap((s) => [
        `${u}/sitemap-players-${s}.xml`,
        `${u}/sitemap-matches-${s}.xml`,
      ]),
    ],
    host: siteConfig.url,
  };
}
