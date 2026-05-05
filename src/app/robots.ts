import type { MetadataRoute } from 'next';
import { siteConfig } from '@/shared/config';

export default function robots(): MetadataRoute.Robots {
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
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
