import { siteConfig } from '@/shared/config';
import { LEAGUE_TEAM_MAPPINGS } from '@/domains/livescore/constants/teams';

// ─── 리그 설정 ───
const LEAGUE_SITEMAP_CONFIG = [
  { leagueId: 39, slug: 'epl' },
  { leagueId: 140, slug: 'laliga' },
  { leagueId: 78, slug: 'bundesliga' },
  { leagueId: 135, slug: 'serie-a' },
  { leagueId: 61, slug: 'ligue1' },
  { leagueId: 40, slug: 'championship' },
  { leagueId: 179, slug: 'scottish' },
  { leagueId: 88, slug: 'eredivisie' },
  { leagueId: 94, slug: 'primeira' },
  { leagueId: 2, slug: 'ucl' },
  { leagueId: 3, slug: 'uel' },
  { leagueId: 848, slug: 'uecl' },
  { leagueId: 292, slug: 'kleague' },
  { leagueId: 98, slug: 'jleague' },
  { leagueId: 307, slug: 'saudi' },
  { leagueId: 169, slug: 'csl' },
  { leagueId: 253, slug: 'mls' },
  { leagueId: 71, slug: 'brasileirao' },
  { leagueId: 262, slug: 'liga-mx' },
  { leagueId: 119, slug: 'danish' },
] as const;

const LEAGUES_WITH_TEAMS = LEAGUE_SITEMAP_CONFIG.filter(
  (l) => LEAGUE_TEAM_MAPPINGS[l.leagueId as keyof typeof LEAGUE_TEAM_MAPPINGS]?.length > 0
);

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = siteConfig.url;

  // 모든 sub-sitemap ID 생성
  const ids: string[] = [
    'static-and-boards',
    ...LEAGUE_SITEMAP_CONFIG.map((l) => `posts-${l.slug}`),
    'posts-hotdeal-etc',
    ...LEAGUES_WITH_TEAMS.map((l) => `sports-${l.slug}`),
    ...LEAGUE_SITEMAP_CONFIG.map((l) => `matches-${l.slug}`),
    'leagues',
  ];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...ids.map(
      (id) =>
        `<sitemap><loc>${baseUrl}/sitemaps/${id}.xml</loc></sitemap>`
    ),
    '</sitemapindex>',
  ].join('\n');

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
