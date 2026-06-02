import { buildSitemapSectionXml } from '@/shared/seo/sitemapIndex';
import { sitemapXmlResponse } from '@/shared/seo/sitemapXml';

export const revalidate = 3600;

export async function GET() {
  const xml = await buildSitemapSectionXml('boards');
  return sitemapXmlResponse(xml || '');
}
