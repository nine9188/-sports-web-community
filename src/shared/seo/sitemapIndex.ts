import {
  getBoardSitemap,
  getLeagueSitemap,
  getMatchSitemap,
  getPlayerSitemap,
  getPostSitemap,
  getShopSitemap,
  getStaticSitemap,
  getTeamSitemap,
  getTransferTeamSitemap,
} from '@/shared/seo/sitemap';
import { sitemapUrlsetXml } from '@/shared/seo/sitemapXml';

type SitemapEntry = Awaited<ReturnType<typeof getPostSitemap>>[number];

function uniqueSitemapEntries(entries: SitemapEntry[]): SitemapEntry[] {
  const seen = new Set<string>();

  return entries.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}

export async function buildMainSitemapXml(): Promise<string> {
  const [
    boardEntries,
    postEntries,
    leagueEntries,
    teamEntries,
    playerEntries,
    matchEntries,
    transferEntries,
    shopEntries,
  ] = await Promise.all([
    getBoardSitemap(),
    getPostSitemap(0),
    getLeagueSitemap(),
    getTeamSitemap(0),
    getPlayerSitemap(0),
    getMatchSitemap(0),
    getTransferTeamSitemap(),
    getShopSitemap(),
  ]);

  const entries = uniqueSitemapEntries([
    ...getStaticSitemap(),
    ...boardEntries,
    ...postEntries,
    ...leagueEntries,
    ...teamEntries,
    ...playerEntries,
    ...matchEntries,
    ...transferEntries,
    ...shopEntries,
  ]);

  return sitemapUrlsetXml(entries);
}

export async function buildMainSitemapIndexXml(): Promise<string> {
  return buildMainSitemapXml();
}
