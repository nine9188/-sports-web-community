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
      { userAgent: 'GPTBot', disallow: '/' },
      { userAgent: 'ChatGPT-User', disallow: '/' },
      { userAgent: 'CCBot', disallow: '/' },
      { userAgent: 'anthropic-ai', disallow: '/' },
      { userAgent: 'Claude-Web', disallow: '/' },
      { userAgent: 'Yeti', allow: '/' },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
