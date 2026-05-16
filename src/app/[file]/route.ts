import {
  getBoardSitemap,
  getLeagueSitemap,
  getMatchSitemap,
  getPlayerSitemapByLeagueSlug,
  getPostSitemap,
  getShopSitemap,
  getSitemapLeagueGroups,
  getStaticSitemap,
  getTeamSitemapByLeagueSlug,
  getTransferTeamSitemap,
} from '@/shared/seo/sitemap';
import { sitemapUrlsetXml, sitemapXmlResponse } from '@/shared/seo/sitemapXml';

export const revalidate = 3600;

type RootSitemapParams = {
  params: Promise<{ file: string }>;
};

export async function generateStaticParams() {
  const leagueGroups = await getSitemapLeagueGroups();

  return [
    { file: 'sitemap-static.xml' },
    { file: 'sitemap-boards.xml' },
    { file: 'sitemap-posts-0.xml' },
    { file: 'sitemap-leagues.xml' },
    { file: 'sitemap-matches-recent.xml' },
    { file: 'sitemap-transfers.xml' },
    { file: 'sitemap-shop.xml' },
    ...leagueGroups.flatMap((group) => [
      { file: `sitemap-teams-${group.slug}.xml` },
      { file: `sitemap-players-${group.slug}.xml` },
    ]),
  ];
}

function sitemapNameFromFile(file: string): string | null {
  if (!file.startsWith('sitemap-') || !file.endsWith('.xml')) return null;
  return file.slice('sitemap-'.length);
}

function leagueSlugFromName(name: string, prefix: 'teams' | 'players'): string | null {
  const start = `${prefix}-`;
  if (!name.startsWith(start) || !name.endsWith('.xml')) return null;
  return name.slice(start.length, -4);
}

export async function GET(_request: Request, { params }: RootSitemapParams) {
  const { file } = await params;
  const sitemapName = sitemapNameFromFile(file);
  if (!sitemapName) return new Response('Not Found', { status: 404 });

  if (sitemapName === 'static.xml') return sitemapXmlResponse(sitemapUrlsetXml(getStaticSitemap()));
  if (sitemapName === 'boards.xml') return sitemapXmlResponse(sitemapUrlsetXml(await getBoardSitemap()));
  if (sitemapName === 'posts-0.xml') return sitemapXmlResponse(sitemapUrlsetXml(await getPostSitemap(0)));
  if (sitemapName === 'leagues.xml') return sitemapXmlResponse(sitemapUrlsetXml(await getLeagueSitemap()));
  if (sitemapName === 'matches-recent.xml') return sitemapXmlResponse(sitemapUrlsetXml(await getMatchSitemap(0)));
  if (sitemapName === 'transfers.xml') return sitemapXmlResponse(sitemapUrlsetXml(await getTransferTeamSitemap()));
  if (sitemapName === 'shop.xml') return sitemapXmlResponse(sitemapUrlsetXml(await getShopSitemap()));

  const teamLeagueSlug = leagueSlugFromName(sitemapName, 'teams');
  if (teamLeagueSlug) {
    return sitemapXmlResponse(sitemapUrlsetXml(await getTeamSitemapByLeagueSlug(teamLeagueSlug)));
  }

  const playerLeagueSlug = leagueSlugFromName(sitemapName, 'players');
  if (playerLeagueSlug) {
    return sitemapXmlResponse(sitemapUrlsetXml(await getPlayerSitemapByLeagueSlug(playerLeagueSlug)));
  }

  return new Response('Not Found', { status: 404 });
}
