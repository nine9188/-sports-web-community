import type { MetadataRoute } from 'next';
import {
  getBoardSitemap,
  getCoreLeagueSitemap,
  getCoreMatchSitemap,
  getCorePlayerSitemap,
  getCoreTeamSitemap,
  getRecentPostSitemap,
  getStaticSitemap,
  getTransferTeamSitemap,
  siteUrl,
} from '@/shared/seo/sitemap';
import { sitemapIndexXml, sitemapUrlsetXml } from '@/shared/seo/sitemapXml';

type SitemapEntry = MetadataRoute.Sitemap[number];

export const MAIN_SITEMAP_SECTIONS = [
  {
    key: 'core',
    path: '/sitemaps/core.xml',
  },
  {
    key: 'boards',
    path: '/sitemaps/boards.xml',
  },
  {
    key: 'recent-posts',
    path: '/sitemaps/recent-posts.xml',
  },
  {
    key: 'livescore-teams',
    path: '/sitemaps/livescore-teams.xml',
  },
  {
    key: 'livescore-players',
    path: '/sitemaps/livescore-players.xml',
  },
  {
    key: 'livescore-matches',
    path: '/sitemaps/livescore-matches.xml',
  },
  {
    key: 'transfers',
    path: '/sitemaps/transfers.xml',
  },
] as const;

export type MainSitemapSection = typeof MAIN_SITEMAP_SECTIONS[number]['key'];

function uniqueSitemapEntries(entries: SitemapEntry[]): SitemapEntry[] {
  const seen = new Set<string>();

  return entries.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}

export function buildMainSitemapIndexXml(): string {
  return sitemapIndexXml(
    MAIN_SITEMAP_SECTIONS.map((section) => ({
      loc: siteUrl(section.path),
    }))
  );
}

export async function getSitemapSectionEntries(section: string): Promise<MetadataRoute.Sitemap | null> {
  if (section === 'core') {
    const [staticEntries, leagueEntries] = await Promise.all([
      getStaticSitemap(),
      getCoreLeagueSitemap(),
    ]);

    return [...staticEntries, ...leagueEntries];
  }
  if (section === 'static') return getStaticSitemap();
  if (section === 'boards') return getBoardSitemap();
  if (section === 'recent-posts') return getRecentPostSitemap();
  if (section === 'transfers') return getTransferTeamSitemap();
  if (section === 'livescore-leagues') return getCoreLeagueSitemap();
  if (section === 'livescore-teams') return getCoreTeamSitemap();
  if (section === 'livescore-players') return getCorePlayerSitemap();
  if (section === 'livescore-matches') return getCoreMatchSitemap();

  return null;
}

export async function buildSitemapSectionXml(section: string): Promise<string | null> {
  const entries = await getSitemapSectionEntries(section);
  if (!entries) return null;
  return sitemapUrlsetXml(uniqueSitemapEntries(entries));
}

export async function getSitemapSectionCounts(): Promise<Record<string, number>> {
  const result: Record<string, number> = {};

  for (const section of MAIN_SITEMAP_SECTIONS) {
    const entries = await getSitemapSectionEntries(section.key);
    result[section.key] = entries?.length ?? 0;
  }

  return result;
}
