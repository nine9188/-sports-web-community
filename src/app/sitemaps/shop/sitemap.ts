import type { MetadataRoute } from 'next';
import { getShopSitemap } from '@/shared/seo/sitemap';

export const revalidate = 3600;

export default function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getShopSitemap();
}
