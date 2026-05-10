import type { MetadataRoute } from 'next';
import { getTransferTeamSitemap } from '@/shared/seo/sitemap';

export const dynamic = 'force-dynamic';

export default function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getTransferTeamSitemap();
}
