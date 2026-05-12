import type { MetadataRoute } from 'next';
import { getMatchSitemap, getMatchSitemapCount, sitemapPageCount } from '@/shared/seo/sitemap';

export const dynamic = 'force-dynamic';

export async function generateSitemaps() {
  return sitemapPageCount(await getMatchSitemapCount());
}

export default async function sitemap(props: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  return getMatchSitemap(await props.id);
}
