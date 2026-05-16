import {
  getPostSitemapCount,
  getSitemapLeagueGroups,
  sitemapPageCount,
  siteUrl,
} from '@/shared/seo/sitemap';
import { sitemapIndexXml, type SitemapIndexEntry } from '@/shared/seo/sitemapXml';

export async function buildRootLevelSitemapIndexXml(): Promise<string> {
  const generatedAt = new Date();
  const [postCount, leagueGroups] = await Promise.all([
    getPostSitemapCount(),
    getSitemapLeagueGroups(),
  ]);

  const entries: SitemapIndexEntry[] = [
    { loc: siteUrl('/sitemap-static.xml'), lastModified: generatedAt },
    { loc: siteUrl('/sitemap-boards.xml'), lastModified: generatedAt },
    ...sitemapPageCount(postCount).map(({ id }) => ({
      loc: siteUrl(`/sitemap-posts-${id}.xml`),
      lastModified: generatedAt,
    })),
    { loc: siteUrl('/sitemap-leagues.xml'), lastModified: generatedAt },
    ...leagueGroups.map((group) => ({
      loc: siteUrl(`/sitemap-teams-${group.slug}.xml`),
      lastModified: generatedAt,
    })),
    ...leagueGroups.map((group) => ({
      loc: siteUrl(`/sitemap-players-${group.slug}.xml`),
      lastModified: generatedAt,
    })),
    { loc: siteUrl('/sitemap-matches-recent.xml'), lastModified: generatedAt },
    { loc: siteUrl('/sitemap-transfers.xml'), lastModified: generatedAt },
    { loc: siteUrl('/sitemap-shop.xml'), lastModified: generatedAt },
  ];

  return sitemapIndexXml(entries);
}
