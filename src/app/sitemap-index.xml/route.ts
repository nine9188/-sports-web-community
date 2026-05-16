import { buildRootLevelSitemapIndexXml } from '@/shared/seo/sitemapRootIndex';
import { sitemapXmlResponse } from '@/shared/seo/sitemapXml';

export const revalidate = 3600;

export async function GET() {
  return sitemapXmlResponse(await buildRootLevelSitemapIndexXml());
}
