import { Metadata } from 'next';
import { fetchCachedMatchFullData } from '@/domains/livescore/actions/match/matchData';
import MatchPageClient, { MatchTabType } from '@/domains/livescore/components/football/match/MatchPageClient';
import { notFound, permanentRedirect } from 'next/navigation';
import { getLeagueSlug } from '@/domains/livescore/utils/slugs';
import { getMatchHrefByTeams, getTeamHref } from '@/domains/livescore/utils/entityLinks';
import { buildMetadata } from '@/shared/utils/metadataNew';
import DaumWebmasterHints from '@/shared/components/DaumWebmasterHints';
import { siteConfig } from '@/shared/config';
import { buildBreadcrumbJsonLd, jsonLdScriptProps } from '@/shared/utils/jsonLd';
import { resolveCanonicalMatchSlug } from '@/domains/livescore/actions/match/matchSlug';
import { fetchCachedMatchShell } from '@/domains/livescore/actions/match/matchShell';
import { getTeamsByIds, getLeagueById, isCupLeague } from '@/domains/livescore/actions/teamLeagueData';
import { fetchCupFixturesByRound } from '@/domains/livescore/actions/match/cupFixtures';
import { getMatchHighlight } from '@/domains/livescore/actions/highlights/getMatchHighlight';
import { getCachedPowerData } from '@/domains/livescore/actions/match/headtohead';
import { getCachedSidebarExtrasData } from '@/domains/livescore/actions/match/sidebarData';
import { fetchAllPlayerStats } from '@/domains/livescore/actions/match/playerStats';
import { fetchCachedMatchGoalEvents } from '@/domains/livescore/actions/match/eventData';
import { getPlayersKoreanNames } from '@/domains/livescore/actions/player/getKoreanName';
import { getPlayerPhotoUrls } from '@/domains/livescore/actions/images';
import type { MatchHighlight } from '@/domains/livescore/types/highlight';
import type { HeaderGoalEvent } from '@/domains/livescore/components/football/match/MatchHeader';
import { isNextRedirectError, normalizeRouteSlug } from '@/shared/utils/nextNavigationErrors';
import { buildFootballOgImageUrl } from '@/shared/utils/footballOgImage';

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
  params,
  searchParams
}: {
  params: Promise<{ id: string; slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}): Promise<Metadata> {
  const [{ id, slug }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const hasTabState = Boolean(resolvedSearchParams?.tab);

  const shellResult = await fetchCachedMatchShell(id);

  if (shellResult.status !== 'found') {
    return buildMetadata({
      title: '경기 정보를 찾을 수 없습니다',
      description: '요청하신 경기 정보가 존재하지 않습니다.',
      path: `/livescore/football/match/${id}`,
      noindex: true,
    });
  }

  const match = shellResult.shell;
  const homeTeam = match.teams.home.name_ko || match.teams.home.name;
  const awayTeam = match.teams.away.name_ko || match.teams.away.name;
  const leagueName = match.league.name;

  const isNotStarted = ['TBD', 'NS'].includes(match.status.code);
  const hasScore = match.goals.home !== null && match.goals.away !== null;
  const score = isNotStarted || !hasScore ? 'vs' : `${match.goals.home} - ${match.goals.away}`;

  const matchDate = match.time?.date ? new Date(match.time.date) : null;
  const dateStr = matchDate
    ? `${matchDate.getFullYear()}년 ${matchDate.getMonth() + 1}월 ${matchDate.getDate()}일`
    : '';

  const title = `${homeTeam} ${score} ${awayTeam} - ${leagueName}`;
  const venueText = [match.venue?.name, match.venue?.city].filter(Boolean).join(', ');
  const roundText = match.league.round || '';
  const statusText = match.status.name || '';
  const matchContext = [dateStr, leagueName, roundText].filter(Boolean).join(' ');
  const locationText = venueText ? ` 경기 장소: ${venueText}.` : '';
  const description = isNotStarted || !hasScore
    ? `${matchContext} ${homeTeam} vs ${awayTeam} 경기 일정입니다.${locationText} 상대 전적, 예상 라인업, 순위와 경기 정보를 4590 Football에서 확인하세요.`
    : `${matchContext} ${homeTeam} ${score} ${awayTeam} 경기 ${statusText ? `${statusText} ` : ''}정보입니다.${locationText} 득점, 라인업, 통계, 하이라이트를 4590 Football에서 확인하세요.`;
  const ogImage = buildFootballOgImageUrl({
    title: `${homeTeam} ${score} ${awayTeam}`,
    subtitle: [leagueName, roundText, dateStr].filter(Boolean).join(' · '),
    label: '경기 정보',
    leftImage: match.teams.home.logo,
    rightImage: match.teams.away.logo,
  });

  const canonicalSlug = await resolveCanonicalMatchSlug(id);

  return buildMetadata({
    title,
    description,
    image: ogImage,
    imageWidth: 1200,
    imageHeight: 630,
    path: canonicalSlug
      ? `/livescore/football/match/${id}/${canonicalSlug}`
      : getMatchHrefByTeams(id, match.teams.home, match.teams.away) || `/livescore/football/match/${id}/${slug}`,
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
      '4590',
      '4590football',
    ],
    includeSiteKeywords: false,
    includeDefaultOgFallbacks: false,
    ...(hasTabState ? { robots: { index: false, follow: true } } : {}),
  });
}

async function MatchPageContent({ matchId, slug, tab }: { matchId: string; slug: string; tab?: string }) {
  try {
    const initialTab: MatchTabType = tab && VALID_TABS.includes(tab as MatchTabType)
      ? (tab as MatchTabType)
      : DEFAULT_TAB;
    const canonicalSlug = await resolveCanonicalMatchSlug(matchId);

    if (canonicalSlug && normalizeRouteSlug(slug) !== normalizeRouteSlug(canonicalSlug)) {
      const tabParam = initialTab !== DEFAULT_TAB ? `?tab=${initialTab}` : '';
      permanentRedirect(`/livescore/football/match/${matchId}/${encodeURIComponent(canonicalSlug)}${tabParam}`);
    }

    const matchData = await fetchCachedMatchFullData(matchId, {
      fetchEvents: initialTab === 'events' || initialTab === 'lineups',
      fetchLineups: initialTab === 'lineups',
      fetchStats: initialTab === 'stats',
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
    const matchSlug = canonicalSlug || slug;
    const matchUrl = `${siteConfig.url}/livescore/football/match/${matchId}/${matchSlug}`;
    const leagueUrl = match?.league?.id
      ? `${siteConfig.url}/livescore/football/leagues/${match.league.id}/${getLeagueSlug(match.league.id, match.league.name)}`
      : undefined;
    const homeTeamUrl = match?.teams.home.id && match.teams.home.name
      ? `${siteConfig.url}${getTeamHref({ ...match.teams.home, slug: homeTeamMapping?.slug, name_en: homeTeamMapping?.name_en, name_ko: homeTeamMapping?.name_ko })}`
      : undefined;
    const awayTeamUrl = match?.teams.away.id && match.teams.away.name
      ? `${siteConfig.url}${getTeamHref({ ...match.teams.away, slug: awayTeamMapping?.slug, name_en: awayTeamMapping?.name_en, name_ko: awayTeamMapping?.name_ko })}`
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
        validFrom: matchStartDate,
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
    const shouldLoadPlayerStats = initialTab === 'stats' || initialTab === 'lineups';
    const lineupPlayerIds = new Set<number>();
    if (initialTab === 'lineups' && matchData.lineups?.response) {
      const { home, away } = matchData.lineups.response;
      home?.startXI?.forEach((item) => item.player?.id && lineupPlayerIds.add(item.player.id));
      home?.substitutes?.forEach((item) => item.player?.id && lineupPlayerIds.add(item.player.id));
      away?.startXI?.forEach((item) => item.player?.id && lineupPlayerIds.add(item.player.id));
      away?.substitutes?.forEach((item) => item.player?.id && lineupPlayerIds.add(item.player.id));
    }
    const [cupRoundsData, highlight, powerDataResult, sidebarExtrasResult, allPlayerStats, goalEventsResult, lineupPlayerPhotoUrls] = await Promise.all([
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
      match?.id
        ? getCachedSidebarExtrasData(
            matchId,
            match.teams.home.id,
            match.teams.away.id,
            rawData
          ).catch((error) => {
            console.error('[match-page] sidebar preload failed:', error);
            return null;
          })
        : Promise.resolve(null),
      shouldLoadPlayerStats
        ? fetchAllPlayerStats(matchId, statusCode).catch((error) => {
            console.error('[match-page] player stats preload failed:', error);
            return null;
          })
        : Promise.resolve(null),
      match?.id
        ? fetchCachedMatchGoalEvents(matchId).catch((error) => {
            console.error('[match-page] header goal events preload failed:', error);
            return null;
          })
        : Promise.resolve(null),
      lineupPlayerIds.size > 0
        ? getPlayerPhotoUrls(Array.from(lineupPlayerIds), 'md').catch((error) => {
            console.error('[match-page] lineup player photos preload failed:', error);
            return {};
          })
        : Promise.resolve({}),
    ]);
    const initialPowerData = powerDataResult?.success ? powerDataResult.data : undefined;
    const initialSidebarData = sidebarExtrasResult?.success ? sidebarExtrasResult.data : null;
    const headerGoalEvents: HeaderGoalEvent[] = goalEventsResult?.success
      ? (goalEventsResult.data || []).map((event) => {
          const detail = event.detail?.toLowerCase() || '';
          const goalKind = detail.includes('own goal')
            ? 'ownGoal'
            : detail.includes('penalty')
              ? 'penalty'
              : 'normal';
          return { ...event, goalKind };
        })
      : [];
    const statsPlayerIds = new Set<number>();
    allPlayerStats?.allPlayersData?.forEach((playerData) => {
      const playerId = playerData.player?.id;
      if (Number.isFinite(playerId) && playerId > 0) {
        statsPlayerIds.add(playerId);
      }
    });
    headerGoalEvents.forEach((event) => {
      if (event.player?.id) statsPlayerIds.add(event.player.id);
      if (event.assist?.id) statsPlayerIds.add(event.assist.id);
    });
    lineupPlayerIds.forEach((playerId) => statsPlayerIds.add(playerId));
    const playerKoreanNames = statsPlayerIds.size > 0
      ? await getPlayersKoreanNames(Array.from(statsPlayerIds)).catch((error) => {
          console.error('[match-page] stats Korean names preload failed:', error);
          return {};
        })
      : {};
    const videoObjectSchema = buildVideoObjectJsonLd({
      highlight,
      matchUrl,
      homeTeamName,
      awayTeamName,
      leagueName,
    });
    const daumScore = match && !['TBD', 'NS'].includes(statusCode)
      ? `${match.goals.home ?? 0} - ${match.goals.away ?? 0}`
      : 'vs';
    const daumTitle = `${homeTeamName} ${daumScore} ${awayTeamName} - ${leagueName}`;
    const daumContent = [
      `${leagueName} ${homeTeamName} ${daumScore} ${awayTeamName} 경기 정보`,
      venueName || venueCity ? `경기장 ${[venueName, venueCity].filter(Boolean).join(', ')}` : '',
      '라인업, 전력 비교, 이벤트, 통계, 순위 정보를 확인하세요.',
    ].filter(Boolean).join('. ');

    return (
      <>
        <DaumWebmasterHints
          title={daumTitle}
          content={daumContent}
          datetime={matchStartDate}
        />
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
          allPlayerStats={allPlayerStats}
          playerKoreanNames={playerKoreanNames}
          headerGoalEvents={headerGoalEvents}
          lineupPlayerPhotoUrls={lineupPlayerPhotoUrls}
          cupRoundsData={cupRoundsData}
          initialSidebarData={initialSidebarData}
          highlight={highlight}
        />
      </>
    );
  } catch (error) {
    if (isNextRedirectError(error)) {
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

