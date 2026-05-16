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

type FlatSitemapParams = {
  params: Promise<{ file: string }>;
};

export async function generateStaticParams() {
  const leagueGroups = await getSitemapLeagueGroups();

  return [
    { file: 'static.xml' },
    { file: 'boards.xml' },
    { file: 'posts-0.xml' },
    { file: 'leagues.xml' },
    { file: 'matches-recent.xml' },
    { file: 'transfers.xml' },
    { file: 'shop.xml' },
    ...leagueGroups.flatMap((group) => [
      { file: `teams-${group.slug}.xml` },
      { file: `players-${group.slug}.xml` },
    ]),
  ];
}

function leagueSlugFromFile(file: string, prefix: 'teams' | 'players'): string | null {
  const start = `${prefix}-`;
  if (!file.startsWith(start) || !file.endsWith('.xml')) return null;
  return file.slice(start.length, -4);
}

export async function GET(_request: Request, { params }: FlatSitemapParams) {
  const { file } = await params;

  if (file === 'static.xml') return sitemapXmlResponse(sitemapUrlsetXml(getStaticSitemap()));
  if (file === 'boards.xml') return sitemapXmlResponse(sitemapUrlsetXml(await getBoardSitemap()));
  if (file === 'posts-0.xml') return sitemapXmlResponse(sitemapUrlsetXml(await getPostSitemap(0)));
  if (file === 'leagues.xml') return sitemapXmlResponse(sitemapUrlsetXml(await getLeagueSitemap()));
  if (file === 'matches-recent.xml') return sitemapXmlResponse(sitemapUrlsetXml(await getMatchSitemap(0)));
  if (file === 'transfers.xml') return sitemapXmlResponse(sitemapUrlsetXml(await getTransferTeamSitemap()));
  if (file === 'shop.xml') return sitemapXmlResponse(sitemapUrlsetXml(await getShopSitemap()));

  const teamLeagueSlug = leagueSlugFromFile(file, 'teams');
  if (teamLeagueSlug) {
    return sitemapXmlResponse(sitemapUrlsetXml(await getTeamSitemapByLeagueSlug(teamLeagueSlug)));
  }

  const playerLeagueSlug = leagueSlugFromFile(file, 'players');
  if (playerLeagueSlug) {
    return sitemapXmlResponse(sitemapUrlsetXml(await getPlayerSitemapByLeagueSlug(playerLeagueSlug)));
  }

  return new Response('Not Found', { status: 404 });
}
