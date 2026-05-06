import type { MetadataRoute } from 'next';
import { getBoardSitemap } from '@/shared/seo/sitemap';

export default function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getBoardSitemap();
}
