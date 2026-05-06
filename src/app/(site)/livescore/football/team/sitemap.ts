import type { MetadataRoute } from 'next';
import { getTeamSitemap, getTeamSitemapCount, sitemapPageCount } from '@/shared/seo/sitemap';

export async function generateSitemaps() {
  return sitemapPageCount(await getTeamSitemapCount());
}

export default async function sitemap(props: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  return getTeamSitemap(await props.id);
}
