import {
  getPostSitemapCount,
  getSitemapLeagueGroups,
  sitemapPageCount,
  siteUrl,
} from '@/shared/seo/sitemap';
import { sitemapIndexXml, type SitemapIndexEntry } from '@/shared/seo/sitemapXml';

export async function buildMainSitemapIndexXml(): Promise<string> {
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

  return sitemapIndexXml(entries);
}
