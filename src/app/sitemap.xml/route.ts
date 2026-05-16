import {
  getPostSitemapCount,
  getSitemapLeagueGroups,
  sitemapPageCount,
  siteUrl,
} from '@/shared/seo/sitemap';
import { sitemapIndexXml, sitemapXmlResponse, type SitemapIndexEntry } from '@/shared/seo/sitemapXml';

export const revalidate = 3600;

export async function GET() {
  const generatedAt = new Date();
  const [postCount, leagueGroups] = await Promise.all([
    getPostSitemapCount(),
    getSitemapLeagueGroups(),
  ]);

  const entries: SitemapIndexEntry[] = [
    { loc: siteUrl('/sitemaps/static.xml'), lastModified: generatedAt },
    { loc: siteUrl('/sitemaps/boards.xml'), lastModified: generatedAt },
    ...sitemapPageCount(postCount).map(({ id }) => ({
      loc: siteUrl(`/sitemaps/posts-${id}.xml`),
      lastModified: generatedAt,
    })),
    { loc: siteUrl('/sitemaps/leagues.xml'), lastModified: generatedAt },
    ...leagueGroups.map((group) => ({
      loc: siteUrl(`/sitemaps/teams-${group.slug}.xml`),
      lastModified: generatedAt,
    })),
    ...leagueGroups.map((group) => ({
      loc: siteUrl(`/sitemaps/players-${group.slug}.xml`),
      lastModified: generatedAt,
    })),
    { loc: siteUrl('/sitemaps/matches-recent.xml'), lastModified: generatedAt },
    { loc: siteUrl('/sitemaps/transfers.xml'), lastModified: generatedAt },
    { loc: siteUrl('/sitemaps/shop.xml'), lastModified: generatedAt },
  ];

  return sitemapXmlResponse(sitemapIndexXml(entries));
}
