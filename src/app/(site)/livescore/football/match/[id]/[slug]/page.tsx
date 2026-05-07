import { Metadata } from 'next';
import { fetchCachedMatchFullData, MatchFullDataResponse } from '@/domains/livescore/actions/match/matchData';
import MatchPageClient, { MatchTabType } from '@/domains/livescore/components/football/match/MatchPageClient';
import { notFound, permanentRedirect } from 'next/navigation';
import { getLeagueSlug, getMatchSlug, getTeamSlugFromName } from '@/domains/livescore/utils/slugs';
import { buildMetadata } from '@/shared/utils/metadataNew';
import { siteConfig } from '@/shared/config';
import { buildBreadcrumbJsonLd, jsonLdScriptProps } from '@/shared/utils/jsonLd';
import { resolveCanonicalMatchSlug } from '@/domains/livescore/actions/match/matchSlug';
import { getTeamsByIds, getLeagueById, isCupLeague } from '@/domains/livescore/actions/teamLeagueData';
import { fetchCupFixturesByRound } from '@/domains/livescore/actions/match/cupFixtures';
import { getMatchHighlight } from '@/domains/livescore/actions/highlights/getMatchHighlight';
import { getCachedPowerData } from '@/domains/livescore/actions/match/headtohead';
import type { MatchHighlight } from '@/domains/livescore/types/highlight';

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

function buildVideoObjectJsonLd({
  highlight,
  matchUrl,
  homeTeamName,
  awayTeamName,
  leagueName,
}: {
  highlight: MatchHighlight | null;
  matchUrl: string;
  homeTeamName: string;
  awayTeamName: string;
  leagueName: string;
}) {
  if (!highlight?.video_id || !highlight.published_at) return null;

  const title = highlight.video_title || `${homeTeamName} vs ${awayTeamName} 하이라이트`;
  const thumbnailUrl =
    highlight.thumbnail_url ||
    `https://i.ytimg.com/vi/${highlight.video_id}/hqdefault.jpg`;

  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    '@id': `${matchUrl}#video-${highlight.video_id}`,
    name: title,
    description: `${leagueName} ${homeTeamName} vs ${awayTeamName} 경기 하이라이트 영상입니다.`,
    thumbnailUrl: [thumbnailUrl],
    uploadDate: highlight.published_at,
    embedUrl: `https://www.youtube.com/embed/${highlight.video_id}`,
    url: matchUrl,
    publisher: { '@id': `${siteConfig.url}#organization` },
    ...(highlight.duration && { duration: highlight.duration }),
    ...(highlight.channel_name && {
      author: {
        '@type': 'Organization',
        name: highlight.channel_name,
      },
    }),
  };
}

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

    const matchData = await fetchCachedMatchFullData(matchId, {
      fetchEvents: initialTab === 'events' || initialTab === 'lineups',
      fetchLineups: initialTab === 'lineups',
      fetchStats: false,
      fetchStandings: initialTab === DEFAULT_TAB || initialTab === 'standings',
    });

    if (!matchData.success) {
      return notFound();
    }
    // JSON-LD building (SEO)
    const match = matchData.match;
    const rawData = matchData.matchData as Record<string, unknown> | undefined;
    const rawFixture = rawData?.fixture as { venue?: { name?: string; city?: string } } | undefined;
    const rawLeague = rawData?.league as { season?: number } | undefined;
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
          : ['FT', 'AET', 'PEN', 'AWD', 'WO'].includes(statusCode)
            ? 'https://schema.org/EventCompleted'
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
      offers: {
        '@type': 'Offer',
        name: `${homeTeamName} vs ${awayTeamName} 경기 정보 무료 보기`,
        url: matchUrl,
        price: '0',
        priceCurrency: 'KRW',
        availability: 'https://schema.org/InStock',
      },
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
    const shouldLoadCupRounds = initialTab === 'standings' && match?.league?.id
      ? await isCupLeague(match.league.id)
      : false;
    const shouldLoadPowerData = initialTab === DEFAULT_TAB && match?.teams.home.id && match?.teams.away.id;
    const [cupRoundsData, highlight, powerDataResult] = await Promise.all([
      shouldLoadCupRounds && match?.league?.id
        ? fetchCupFixturesByRound(match.league.id, rawLeague?.season).then((result) => result.rounds)
        : Promise.resolve(undefined),
      match?.id && match?.teams.home.id && match?.teams.away.id && match?.league.id
        ? getMatchHighlight(
            match.id,
            match.teams.home.id,
            match.teams.away.id,
            match.league.id,
            match.time?.date
          )
        : Promise.resolve(null),
      shouldLoadPowerData
        ? getCachedPowerData(match.teams.home.id, match.teams.away.id, 5).catch((error) => {
            console.error('[match-page] power data preload failed:', error);
            return null;
          })
        : Promise.resolve(null),
    ]);
    const initialPowerData = powerDataResult?.success ? powerDataResult.data : undefined;
    const videoObjectSchema = buildVideoObjectJsonLd({
      highlight,
      matchUrl,
      homeTeamName,
      awayTeamName,
      leagueName,
    });

    return (
      <>
        {sportsEventSchema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(sportsEventSchema) }}
          />
        )}
        {videoObjectSchema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(videoObjectSchema) }}
          />
        )}
        <script
          type="application/ld+json"
          {...jsonLdScriptProps(breadcrumbSchema)}
        />
        <MatchPageClient
          matchId={matchId}
          initialTab={initialTab}
          initialData={matchData}
          initialPowerData={initialPowerData}
          cupRoundsData={cupRoundsData}
          highlight={highlight}
        />
      </>
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

