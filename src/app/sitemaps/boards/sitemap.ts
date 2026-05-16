import type { MetadataRoute } from 'next';
import { getBoardSitemap } from '@/shared/seo/sitemap';

export const revalidate = 3600;

export default function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getBoardSitemap();
}
