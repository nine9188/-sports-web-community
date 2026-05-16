import type { MetadataRoute } from 'next';
import { getStaticSitemap } from '@/shared/seo/sitemap';

export const revalidate = 3600;

export default function sitemap(): MetadataRoute.Sitemap {
  return getStaticSitemap();
}
