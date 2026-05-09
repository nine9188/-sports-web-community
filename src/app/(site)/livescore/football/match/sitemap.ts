import type { MetadataRoute } from 'next';
import { getMatchSitemap } from '@/shared/seo/sitemap';

export const dynamic = 'force-dynamic';

export async function generateSitemaps() {
  return [{ id: 0 }];
}

export default async function sitemap(props: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  return getMatchSitemap(await props.id);
}
