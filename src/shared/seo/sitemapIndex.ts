import {
  getBoardSitemap,
  getLeagueSitemap,
  getMatchSitemap,
  getPlayerSitemap,
  getPostSitemap,
  getShopSitemap,
  getStaticSitemap,
  getSitemapQueryFailures,
  getTeamSitemap,
  getTransferTeamSitemap,
  resetSitemapQueryFailures,
} from '@/shared/seo/sitemap';
import { assertCompleteMainSitemap } from '@/shared/seo/sitemapSnapshot';
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
  resetSitemapQueryFailures();

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

  const failures = getSitemapQueryFailures();
  if (failures.length) {
    throw new Error(`Main sitemap generation failed queries: ${failures.join(', ')}`);
  }

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

  const xml = sitemapUrlsetXml(entries);
  assertCompleteMainSitemap(xml);

  return xml;
}

export async function buildMainSitemapIndexXml(): Promise<string> {
  return buildMainSitemapXml();
}
