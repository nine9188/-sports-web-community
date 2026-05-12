import { notFound, permanentRedirect } from 'next/navigation';
import { getLeagueSlug } from '@/domains/livescore/utils/slugs';
import { fetchLeagueDetails } from '@/domains/livescore/actions/footballApi';
import { getLeagueById } from '@/domains/livescore/actions/teamLeagueData';
import { fetchLeagueStandings } from '@/domains/livescore/actions/match/standingsData';
import { fetchCupFixturesByRound } from '@/domains/livescore/actions/match/cupFixtures';
import { fetchCachedLeagueRankings } from '@/domains/livescore/actions/match/leagueRankings';
import { LeagueHeader, LeagueStandingsTable, LeagueRankingsSection, CupRoundsView } from '@/domains/livescore/components/football/leagues';
import { buildMetadata } from '@/shared/utils/metadataNew';
import DaumWebmasterHints from '@/shared/components/DaumWebmasterHints';
import { siteConfig } from '@/shared/config';
import {
  SITE_ORGANIZATION_ID,
  SITE_WEBSITE_ID,
  absoluteSiteUrl,
  buildBreadcrumbJsonLd,
  buildJsonLdId,
  isUsableJsonLdImage,
  jsonLdScriptProps,
} from '@/shared/utils/jsonLd';
import { getTeamLogoUrls, getLeagueLogoUrl } from '@/domains/livescore/actions/images';
import { getBoardSlugByLeagueId } from '@/domains/boards/actions/getBoards';
import AdBanner from '@/shared/components/AdBanner';
import { normalizeRouteSlug } from '@/shared/utils/nextNavigationErrors';

interface LeaguePageProps {
  params: Promise<{ id: string; slug: string }>;
}

function createLeaguePerfTrace(leagueId: string) {
  void leagueId;

  return {
    mark: async <T,>(label: string, task: () => Promise<T>): Promise<T> => {
      void label;
      return task();
    },
    log: (label: string) => {
      void label;
    },
  };
}

export async function generateMetadata({ params }: LeaguePageProps) {
  const { id } = await params;
  const league = await fetchLeagueDetails(id);
  const leagueMapping = await getLeagueById(parseInt(id, 10));
  const displayName = leagueMapping?.name_ko || league?.name || '리그';

  if (!league) {
    return buildMetadata({
      title: '리그를 찾을 수 없습니다',
      description: '요청하신 리그 정보가 존재하지 않습니다.',
      path: `/livescore/football/leagues/${id}/${getLeagueSlug(parseInt(id, 10))}`,
      noindex: true,
    });
  }

  return buildMetadata({
    title: `${displayName} 순위 - 팀 순위 및 리그 순위`,
    description: `${displayName}${league.country ? ` (${league.country})` : ''} 리그 순위, 팀 순위, 득점 순위와 도움 순위를 4590 Football에서 확인하세요.`,
    path: `/livescore/football/leagues/${id}/${getLeagueSlug(parseInt(id, 10), league.name)}`,
    keywords: [
      `${displayName} 순위`,
      `${displayName} 득점 순위`,
      `${displayName} 일정`,
      `${displayName} 결과`,
      ...(league.name && league.name !== displayName ? [`${league.name} standings`, `${league.name} results`] : []),
      '축구 리그 순위',
      '축구 커뮤니티',
      '4590',
      '4590football',
    ],
  });
}
async function LeaguePageContent({ id }: { id: string }) {
  const perf = createLeaguePerfTrace(id);
  const leagueId = parseInt(id, 10);

  const league = await perf.mark('league-details', () => fetchLeagueDetails(id));
  const leagueMapping = await perf.mark('league-mapping', () => getLeagueById(leagueId));
  if (!league) {
    notFound();
  }
  const leagueSlug = getLeagueSlug(leagueId, league.name);
  const displayName = leagueMapping?.name_ko || league.name;
  const seasonLabel = leagueMapping?.is_calendar_season
    ? `${league.season} 시즌`
    : `${league.season}-${String(league.season + 1).slice(2)} 시즌`;

  const isCup = league.type === 'Cup';

  const [leagueLogoUrl, leagueLogoUrlDark, boardSlug] = await Promise.all([
    perf.mark('league-logo', () => getLeagueLogoUrl(leagueId)),
    perf.mark('league-logo-dark', () => getLeagueLogoUrl(leagueId, true)),
    perf.mark('board-slug', () => getBoardSlugByLeagueId(leagueId)),
  ]);

  perf.log(`success type=${league.type}`);

  const leagueUrl = `${siteConfig.url}/livescore/football/leagues/${leagueId}/${leagueSlug}`;
  const leagueLogoJsonLdUrl = isUsableJsonLdImage(leagueLogoUrl)
    ? absoluteSiteUrl(leagueLogoUrl)
    : undefined;
  const leagueSchema = {
    '@context': 'https://schema.org',
    '@type': 'SportsOrganization',
    '@id': buildJsonLdId(leagueUrl, 'sports-organization'),
    name: displayName,
    url: leagueUrl,
    isPartOf: { '@id': SITE_WEBSITE_ID },
    publisher: { '@id': SITE_ORGANIZATION_ID },
    sport: 'Football',
    ...(leagueLogoJsonLdUrl ? { logo: leagueLogoJsonLdUrl, image: leagueLogoJsonLdUrl } : {}),
    ...(league.country ? { location: { '@type': 'Country', name: league.country } } : {}),
  };

  const breadcrumbSchema = buildBreadcrumbJsonLd({
    items: [
      { name: '홈', url: '/' },
      { name: '라이브스코어', url: '/livescore/football' },
      { name: displayName, url: leagueUrl },
    ],
  });

  const [standingsSection, rankingsSection] = await Promise.all([
    LeagueStandingsSection({
      leagueId,
      season: league.season,
      isCup,
      leagueType: league.type,
    }),
    LeagueRankingsSectionBlock({ leagueId }),
  ]);

  return (
    <div className="min-h-screen">
      <DaumWebmasterHints
        title={`${displayName} - 리그 정보`}
        content={`${displayName}${league.country ? ` (${league.country})` : ''} 리그 순위, 팀 순위, 득점 순위, 일정과 결과를 확인하세요.`}
      />
      <script type="application/ld+json" {...jsonLdScriptProps(leagueSchema)} />
      <script type="application/ld+json" {...jsonLdScriptProps(breadcrumbSchema)} />

      <div className="bg-white dark:bg-[#1D1D1D] md:rounded-lg border border-black/7 dark:border-0 overflow-hidden">
        <LeagueHeader
          league={league}
          displayName={displayName}
          seasonLabel={seasonLabel}
          leagueLogoUrl={leagueLogoUrl}
          leagueLogoUrlDark={leagueLogoUrlDark}
          boardSlug={boardSlug}
        />
      </div>

      <div className="mt-4">
        <AdBanner />
      </div>

      <div className="mt-4">
        {standingsSection}
      </div>

      <div className="mt-4">
        {rankingsSection}
      </div>
    </div>
  );
}

async function LeagueStandingsSection({
  leagueId,
  season,
  isCup,
  leagueType,
}: {
  leagueId: number;
  season: number;
  isCup: boolean;
  leagueType: string;
}) {
  const perf = createLeaguePerfTrace(`${leagueId}:standings`);
  const isWorldCup = leagueId === 1;
  const shouldShowStandings = !isCup || isWorldCup;
  const shouldShowCupRounds = isCup;

  const standingsResponse = shouldShowStandings
    ? await perf.mark('standings', () => fetchLeagueStandings(leagueId, season))
    : { success: false as const, data: null as null };

  const cupRoundsResponse = shouldShowCupRounds
    ? await perf.mark('cup-rounds', () => fetchCupFixturesByRound(leagueId, season))
    : { success: true as const, rounds: [] };

  let teamLogoUrls: Record<number, string> = {};
  if (standingsResponse.success && standingsResponse.data?.league?.standings) {
    const teamIds = new Set<number>();
    standingsResponse.data.league.standings.forEach((group: Array<{ team?: { id?: number } }>) => {
      group.forEach((standing) => {
        if (standing.team?.id) {
          teamIds.add(standing.team.id);
        }
      });
    });

    if (teamIds.size > 0) {
      teamLogoUrls = await perf.mark('standings-team-logos', () => getTeamLogoUrls([...teamIds]));
    }
  }

  perf.log(`section type=${leagueType}`);

  const standingsTable = (
    <LeagueStandingsTable
      standings={standingsResponse.success && standingsResponse.data ? standingsResponse.data : null}
      leagueId={leagueId}
      teamLogoUrls={teamLogoUrls}
    />
  );

  const cupRounds = <CupRoundsView rounds={cupRoundsResponse.rounds} />;

  if (shouldShowStandings && shouldShowCupRounds) {
    return (
      <div className="space-y-4">
        {standingsTable}
        {cupRounds}
      </div>
    );
  }

  return shouldShowCupRounds ? (
    <CupRoundsView rounds={cupRoundsResponse.rounds} />
  ) : (
    standingsTable
  );
}

async function LeagueRankingsSectionBlock({ leagueId }: { leagueId: number }) {
  const perf = createLeaguePerfTrace(`${leagueId}:rankings`);
  const rankings = await perf.mark('rankings', () => fetchCachedLeagueRankings(leagueId));
  perf.log('section');

  return (
    <LeagueRankingsSection
      topScorers={rankings.topScorers}
      topAssists={rankings.topAssists}
      playerPhotoUrls={rankings.playerPhotoUrls}
      teamLogoUrls={rankings.teamLogoUrls}
      playerKoreanNames={rankings.playerKoreanNames}
      leagueId={leagueId}
    />
  );
}

export default async function LeaguePage({ params }: LeaguePageProps) {
  const { id, slug } = await params;
  const leagueId = parseInt(id, 10);
  const league = await fetchLeagueDetails(id);
  const canonicalSlug = getLeagueSlug(leagueId, league?.name);

  if (normalizeRouteSlug(slug) !== normalizeRouteSlug(canonicalSlug)) {
    permanentRedirect(`/livescore/football/leagues/${id}/${encodeURIComponent(canonicalSlug)}`);
  }

  return await LeaguePageContent({ id });
}

