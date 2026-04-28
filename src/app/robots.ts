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
          '/test','/ui','/*?from=*','/*?sort=*','/.well-known/',
        ],
      },
      { userAgent: 'Amazonbot', disallow: '/' },
      { userAgent: 'Amzn-SearchBot', disallow: '/' },
      { userAgent: 'SERankingBot', disallow: '/' },
      { userAgent: 'Yeti', allow: '/' },
      { userAgent: 'Googlebot-Image', allow: ['/favicon.ico', '/icon.svg', '/apple-icon.png'], disallow: '/' },
    ],
    host: siteConfig.url,
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
