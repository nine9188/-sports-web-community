import type { MetadataRoute } from 'next';
import { getShopSitemap } from '@/shared/seo/sitemap';

export default function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getShopSitemap();
}
