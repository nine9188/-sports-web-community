import type { MetadataRoute } from 'next';
import { getLeagueSitemap } from '@/shared/seo/sitemap';

export default function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getLeagueSitemap();
}
