import type { MetadataRoute } from 'next';
import { getTransferTeamSitemap } from '@/shared/seo/sitemap';

export const revalidate = 3600;

export default function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getTransferTeamSitemap();
}
