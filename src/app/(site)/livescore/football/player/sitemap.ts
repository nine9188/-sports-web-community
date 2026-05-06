import type { MetadataRoute } from 'next';
import { getPlayerSitemap, getPlayerSitemapCount, sitemapPageCount } from '@/shared/seo/sitemap';

export async function generateSitemaps() {
  return sitemapPageCount(await getPlayerSitemapCount());
}

export default async function sitemap(props: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  return getPlayerSitemap(await props.id);
}
