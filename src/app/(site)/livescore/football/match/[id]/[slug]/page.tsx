import { Metadata } from 'next';
import { fetchCachedMatchFullData, MatchFullDataResponse } from '@/domains/livescore/actions/match/matchData';
import { getCachedSidebarExtrasData } from '@/domains/livescore/actions/match/sidebarData';
import { getCachedPowerSummaryData } from '@/domains/livescore/actions/match/headtohead';
import MatchPageClient, { MatchTabType } from '@/domains/livescore/components/football/match/MatchPageClient';
import { notFound, permanentRedirect } from 'next/navigation';
import { getLeagueSlug, getMatchSlug, getTeamSlugFromName } from '@/domains/livescore/utils/slugs';
import { buildMetadata } from '@/shared/utils/metadataNew';
import { siteConfig } from '@/shared/config';
import { buildBreadcrumbJsonLd, jsonLdScriptProps } from '@/shared/utils/jsonLd';
import { resolveCanonicalMatchSlug } from '@/domains/livescore/actions/match/matchSlug';
import { getTeamsByIds, getLeagueById, isCupLeague, getCurrentSeasonForLeague } from '@/domains/livescore/actions/teamLeagueData';
import { fetchCupFixturesByRound } from '@/domains/livescore/actions/match/cupFixtures';
import { getMatchHighlight } from '@/domains/livescore/actions/highlights/getMatchHighlight';
import type { HeadToHeadTestData } from '@/domains/livescore/actions/match/headtohead';
import MatchHeader from '@/domains/livescore/components/football/match/MatchHeader';
import MatchSidebar from '@/domains/livescore/components/football/match/sidebar/MatchSidebar';
import HighlightBanner from '@/domains/livescore/components/football/match/HighlightBanner';

function addHoursToIsoDate(isoDate: string, hours: number): string {
  const date = new Date(isoDate);
  date.setHours(date.getHours() + hours);

  const offsetMatch = isoDate.match(/([+-]\d{2}:\d{2})$/);
  if (!offsetMatch) return date.toISOString();

  const offset = offsetMatch[1];
  const sign = offset[0] === '-' ? -1 : 1;
  const [offsetHours, offsetMinutes] = offset.slice(1).split(':').map(Number);
  const offsetMs = sign * ((offsetHours * 60 + offsetMinutes) * 60 * 1000);
  const localDate = new Date(date.getTime() + offsetMs);

  return `${localDate.toISOString().slice(0, 19)}${offset}`;
}

const VALID_TABS: MatchTabType[] = ['power', 'events', 'lineups', 'stats', 'standings', 'support'];
const DEFAULT_TAB: MatchTabType = 'power';

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string; slug: string }>
}): Promise<Metadata> {
  const { id, slug } = await params;

  const matchData = await fetchCachedMatchFullData(id, {
    fetchEvents: false,
    fetchLineups: false,
    fetchStats: false,
    fetchStandings: false,
  });

  if (!matchData.success || !matchData.match) {
    return buildMetadata({
      title: '경기 정보를 찾을 수 없습니다',
      description: '요청하신 경기 정보가 존재하지 않습니다.',
      path: `/livescore/football/match/${id}`,
      noindex: true,
    });
  }

  const { match } = matchData;

  const [teamMap, leagueMapping] = await Promise.all([
    getTeamsByIds([match.teams.home.id, match.teams.away.id]),
    getLeagueById(match.league.id),
  ]);
  const homeTeamMapping = teamMap[match.teams.home.id];
  const awayTeamMapping = teamMap[match.teams.away.id];
  const homeTeam = homeTeamMapping?.name_ko || match.teams.home.name;
  const awayTeam = awayTeamMapping?.name_ko || match.teams.away.name;
  const leagueName = leagueMapping?.name_ko || match.league.name;

  const isNotStarted = ['TBD', 'NS'].includes(match.status.code);
  const score = isNotStarted ? 'vs' : `${match.goals.home} - ${match.goals.away}`;

  const matchDate = match.time?.date ? new Date(match.time.date) : null;
  const dateStr = matchDate
    ? `${matchDate.getFullYear()}년 ${matchDate.getMonth() + 1}월 ${matchDate.getDate()}일`
    : '';

  const title = `${homeTeam} ${score} ${awayTeam} - ${leagueName}`;
  const description = dateStr
    ? `${dateStr} ${leagueName} ${homeTeam} ${score} ${awayTeam} 경기 결과, 라인업, 통계, 하이라이트를 4590 Football에서 확인하세요.`
    : `${leagueName} ${homeTeam} ${score} ${awayTeam} 경기 결과, 라인업, 통계, 하이라이트를 4590 Football에서 확인하세요.`;

  const canonicalSlug = await resolveCanonicalMatchSlug(id);

  return buildMetadata({
    title,
    description,
    path: `/livescore/football/match/${id}/${canonicalSlug || slug || getMatchSlug(match.teams.home.name, match.teams.away.name)}`,
    keywords: [
      `${homeTeam} ${awayTeam}`,
      `${homeTeam} ${score} ${awayTeam}`,
      `${homeTeam} 라인업`,
      `${awayTeam} 라인업`,
      `${leagueName} 경기 결과`,
      `${leagueName} 스코어`,
      ...(dateStr ? [`${dateStr} 축구`, `${dateStr} ${leagueName}`] : []),
      '축구 경기 결과',
      '실시간 스코어',
    ],
  });
}

async function MatchSidebarLoader({
  matchId,
  matchData,
}: {
  matchId: string;
  matchData: MatchFullDataResponse;
}) {
  const numericMatchId = parseInt(matchId, 10);
  const homeTeamId = matchData.homeTeam?.id;
  const awayTeamId = matchData.awayTeam?.id;
  const leagueId = matchData.match?.league?.id;
  const statusCode = matchData.match?.status?.code ?? '';
  const isFinished = ['FT', 'AET', 'PEN'].includes(statusCode);

  const [sidebarDataResult, highlightData] = await Promise.all([
    getCachedSidebarExtrasData(matchId, homeTeamId, awayTeamId, matchData.matchData as Record<string, unknown> | undefined),
    isFinished && homeTeamId && awayTeamId && leagueId
      ? getMatchHighlight(numericMatchId, homeTeamId, awayTeamId, leagueId, matchData.match?.time?.date).catch(() => null)
      : Promise.resolve(null),
  ]);
  const sidebarData = sidebarDataResult.success ? sidebarDataResult.data : null;

  return (
    <>
      {highlightData && <HighlightBanner highlight={highlightData} mode="modal" />}
      <MatchSidebar
        matchId={matchId}
        initialData={matchData.matchData}
        sidebarData={sidebarData}
        teamLogoUrls={matchData.teamLogoUrls}
      />
    </>
  );
}

async function MatchPageContent({ matchId, slug, tab }: { matchId: string; slug: string; tab?: string }) {
  try {
    const initialTab: MatchTabType = tab && VALID_TABS.includes(tab as MatchTabType)
      ? (tab as MatchTabType)
      : DEFAULT_TAB;
    const canonicalSlug = await resolveCanonicalMatchSlug(matchId);

    if (!canonicalSlug) {
      return notFound();
    }

    if (slug !== canonicalSlug) {
      const tabParam = initialTab !== DEFAULT_TAB ? `?tab=${initialTab}` : '';
      permanentRedirect(`/livescore/football/match/${matchId}/${canonicalSlug}${tabParam}`);
    }

    // Stage 1: load base match data first so the header and JSON-LD can render early.
    const fetchEvents = initialTab === 'events' || initialTab === 'lineups';
    const fetchLineups = initialTab === 'lineups';
    const fetchStats = initialTab === 'stats';
    const fetchStandings = initialTab === 'standings';
    const matchData = await fetchCachedMatchFullData(matchId, {
      fetchEvents,
      fetchLineups,
      fetchStats,
      fetchStandings,
    });

    if (!matchData.success) {
      return notFound();
    }
    // JSON-LD building (SEO)
    const match = matchData.match;
    const homeTeamId = matchData.homeTeam?.id;
    const awayTeamId = matchData.awayTeam?.id;
    const leagueId = match?.league?.id;
    const needsCupRounds = initialTab === 'standings';
    const [powerDataResult, leagueIsCup, cupSeason] = await Promise.all([
      homeTeamId && awayTeamId
        ? getCachedPowerSummaryData(homeTeamId, awayTeamId, 5)
        : Promise.resolve({ success: false, data: undefined }),
      needsCupRounds ? isCupLeague(leagueId) : Promise.resolve(false),
      needsCupRounds && leagueId ? getCurrentSeasonForLeague(leagueId) : Promise.resolve(undefined),
    ]);
    const powerResult = powerDataResult as { success?: boolean; data?: HeadToHeadTestData };
    const powerData = powerResult.success ? powerResult.data : undefined;
    const cupRoundsResult = needsCupRounds && leagueIsCup && leagueId
      ? await fetchCupFixturesByRound(leagueId, cupSeason).catch(() => ({ success: false as const, rounds: [] }))
      : { success: true as const, rounds: [] };
    const rawData = matchData.matchData as Record<string, unknown> | undefined;
    const rawFixture = rawData?.fixture as { venue?: { name?: string; city?: string } } | undefined;
    const venueName = rawFixture?.venue?.name;
    const venueCity = rawFixture?.venue?.city;
    const statusCode = match?.status?.code ?? '';

    const [jsonLdTeamMap, jsonLdLeagueMapping] = match
      ? await Promise.all([
          getTeamsByIds([match.teams.home.id, match.teams.away.id]),
          getLeagueById(match.league.id),
        ])
      : [{} as Record<number, import('@/domains/livescore/actions/teamLeagueData').TeamData>, null];
    const homeTeamMapping = match ? jsonLdTeamMap[match.teams.home.id] : null;
    const awayTeamMapping = match ? jsonLdTeamMap[match.teams.away.id] : null;
    const leagueMapping = jsonLdLeagueMapping;
    const homeTeamName = homeTeamMapping?.name_ko || match?.teams.home.name || '';
    const awayTeamName = awayTeamMapping?.name_ko || match?.teams.away.name || '';
    const leagueName = leagueMapping?.name_ko || match?.league.name || '';
    const venueCountry = match?.league.country || leagueMapping?.country || undefined;

    const eventStatus = ['CANC', 'ABD'].includes(statusCode)
        ? 'https://schema.org/EventCancelled'
        : ['PST', 'SUSP'].includes(statusCode)
          ? 'https://schema.org/EventPostponed'
          : 'https://schema.org/EventScheduled';

    const matchStartDate = match?.time?.date;
    const matchEndDate = matchStartDate
      ? addHoursToIsoDate(matchStartDate, 2)
      : undefined;
    const matchSlug = canonicalSlug;
    const matchUrl = `${siteConfig.url}/livescore/football/match/${matchId}/${matchSlug}`;
    const leagueUrl = match?.league?.id
      ? `${siteConfig.url}/livescore/football/leagues/${match.league.id}/${getLeagueSlug(match.league.id)}`
      : undefined;
    const homeTeamUrl = match?.teams.home.id && match.teams.home.name
      ? `${siteConfig.url}/livescore/football/team/${match.teams.home.id}/${getTeamSlugFromName(match.teams.home.name)}`
      : undefined;
    const awayTeamUrl = match?.teams.away.id && match.teams.away.name
      ? `${siteConfig.url}/livescore/football/team/${match.teams.away.id}/${getTeamSlugFromName(match.teams.away.name)}`
      : undefined;
    const homeTeamSchema = {
      '@type': 'SportsTeam',
      name: homeTeamName,
      ...(homeTeamUrl && {
        '@id': `${homeTeamUrl}#sports-team`,
        url: homeTeamUrl,
      }),
    };
    const awayTeamSchema = {
      '@type': 'SportsTeam',
      name: awayTeamName,
      ...(awayTeamUrl && {
        '@id': `${awayTeamUrl}#sports-team`,
        url: awayTeamUrl,
      }),
    };

    const sportsEventSchema = match ? {
      '@context': 'https://schema.org',
      '@type': 'SportsEvent',
      '@id': `${matchUrl}#sports-event`,
      name: `${homeTeamName} vs ${awayTeamName}`,
      url: matchUrl,
      isPartOf: { '@id': `${siteConfig.url}#website` },
      publisher: { '@id': `${siteConfig.url}#organization` },
      startDate: matchStartDate,
      ...(matchEndDate && { endDate: matchEndDate }),
      description: `${leagueName} - ${homeTeamName} vs ${awayTeamName}`,
      image: `${siteConfig.url}/og-image.png`,
      sport: 'Football',
      eventStatus,
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      ...((venueName || venueCity || venueCountry) && { location: {
        '@type': 'Place',
        ...(venueName && { name: venueName }),
        address: {
          '@type': 'PostalAddress',
          ...(venueCity && { addressLocality: venueCity }),
          ...(venueCountry && { addressCountry: venueCountry }),
        },
      } }),
      performer: [
        homeTeamSchema,
        awayTeamSchema,
      ],
      homeTeam: homeTeamSchema,
      awayTeam: awayTeamSchema,
      organizer: {
        '@type': 'SportsOrganization',
        name: leagueName,
        ...(match.league?.id && {
          '@id': leagueUrl ? `${leagueUrl}#sports-organization` : undefined,
          url: leagueUrl,
        }),
      },
    } : null;

    // BreadcrumbList JSON-LD
    const matchDisplayName = `${homeTeamName} vs ${awayTeamName}`;
    const breadcrumbSchema = buildBreadcrumbJsonLd({
      items: [
        { name: '홈', url: '/' },
        { name: '라이브스코어', url: '/livescore/football' },
        ...(leagueName && match?.league?.id && leagueUrl ? [{ name: leagueName, url: leagueUrl }] : []),
        { name: matchDisplayName, url: matchUrl },
      ],
    });

    return (
      <div className="container">
        {sportsEventSchema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(sportsEventSchema) }}
          />
        )}
        <script
          type="application/ld+json"
          {...jsonLdScriptProps(breadcrumbSchema)}
        />
        <div className="flex gap-4">
          <div className="flex-1 min-w-0">
            <MatchHeader
              matchId={matchId}
              initialData={matchData}
              teamLogoUrls={matchData.teamLogoUrls}
              leagueLogoUrl={matchData.leagueLogoUrl}
              leagueLogoDarkUrl={matchData.leagueLogoDarkUrl}
            />
            <MatchPageClient
              matchId={matchId}
              initialTab={initialTab}
              initialData={matchData}
              initialPowerData={powerData}
              powerMode="all"
              cupRoundsData={cupRoundsResult.rounds}
            />
          </div>
          <aside className="hidden xl:block w-[300px] shrink-0">
            <MatchSidebarLoader
              matchId={matchId}
              matchData={matchData}
            />
          </aside>
        </div>
      </div>
    );
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'digest' in error &&
      typeof error.digest === 'string' &&
      error.digest.startsWith('NEXT_REDIRECT')
    ) {
      throw error;
    }
    console.error('Match page loading error:', error);
    return (
      <div className="container py-8">
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-red-500">경기 정보를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }
}

export default async function MatchPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string; slug: string }>,
  searchParams: Promise<{ tab?: string }>
}) {
  const { id: matchId, slug } = await params;
  const { tab } = await searchParams;

  return await MatchPageContent({ matchId, slug, tab });
}

