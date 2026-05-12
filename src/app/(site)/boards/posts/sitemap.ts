import type { MetadataRoute } from 'next';
import { getPostSitemap, getPostSitemapCount, sitemapPageCount } from '@/shared/seo/sitemap';

export const dynamic = 'force-dynamic';

export async function generateSitemaps() {
  return sitemapPageCount(await getPostSitemapCount());
}

export default async function sitemap(props: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  return getPostSitemap(await props.id);
}
