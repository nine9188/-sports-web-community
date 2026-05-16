import {
  getMatchSitemapCount,
  getPlayerSitemapCount,
  getPostSitemapCount,
  getTeamSitemapCount,
  sitemapPageCount,
  siteUrl,
} from '@/shared/seo/sitemap';
import { sitemapIndexXml, sitemapXmlResponse, type SitemapIndexEntry } from '@/shared/seo/sitemapXml';

export const revalidate = 3600;

function pagedSitemapEntries(path: string, total: number, lastModified: Date): SitemapIndexEntry[] {
  return sitemapPageCount(total).map(({ id }) => ({
    loc: siteUrl(`${path}/sitemap/${id}.xml`),
    lastModified,
  }));
}

export async function GET() {
  const generatedAt = new Date();
  const [postCount, teamCount, playerCount, matchCount] = await Promise.all([
    getPostSitemapCount(),
    getTeamSitemapCount(),
    getPlayerSitemapCount(),
    getMatchSitemapCount(),
  ]);

  const entries: SitemapIndexEntry[] = [
    { loc: siteUrl('/sitemaps/static/sitemap.xml'), lastModified: generatedAt },
    { loc: siteUrl('/sitemaps/boards/sitemap.xml'), lastModified: generatedAt },
    ...pagedSitemapEntries('/sitemaps/posts', postCount, generatedAt),
    { loc: siteUrl('/sitemaps/leagues/sitemap.xml'), lastModified: generatedAt },
    ...pagedSitemapEntries('/sitemaps/teams', teamCount, generatedAt),
    ...pagedSitemapEntries('/sitemaps/players', playerCount, generatedAt),
    ...pagedSitemapEntries('/sitemaps/matches', matchCount, generatedAt),
    { loc: siteUrl('/sitemaps/transfers/sitemap.xml'), lastModified: generatedAt },
    { loc: siteUrl('/sitemaps/shop/sitemap.xml'), lastModified: generatedAt },
  ];

  return sitemapXmlResponse(sitemapIndexXml(entries));
}
