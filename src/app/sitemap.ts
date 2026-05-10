import type { MetadataRoute } from 'next';
import { siteUrl } from '@/shared/seo/sitemap';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    {
      url: siteUrl('/'),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: siteUrl('/about'),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: siteUrl('/guide'),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: siteUrl('/contact'),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: siteUrl('/transfers'),
      changeFrequency: 'daily',
      priority: 0.6,
    },
    {
      url: siteUrl('/livescore/football'),
      changeFrequency: 'always',
      priority: 0.9,
    },
    {
      url: siteUrl('/livescore/football/leagues'),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: siteUrl('/shop'),
      changeFrequency: 'weekly',
      priority: 0.4,
    },
    {
      url: siteUrl('/shop/emoticon-studio'),
      changeFrequency: 'weekly',
      priority: 0.3,
    },
    {
      url: siteUrl('/boards/all'),
      changeFrequency: 'daily',
      priority: 0.6,
    },
    {
      url: siteUrl('/boards/popular'),
      changeFrequency: 'hourly',
      priority: 0.7,
    },
  ];
}
