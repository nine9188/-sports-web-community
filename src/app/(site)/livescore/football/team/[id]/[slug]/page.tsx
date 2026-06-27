import { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import TeamPageClient, { TeamTabType } from '@/domains/livescore/components/football/team/TeamPageClient';
import {
  fetchTeamFullData,
  fetchTeamOverviewPlayerRankingsData,
  fetchTeamOverviewRecentMatchesData,
  fetchTeamOverviewStandingsData,
  fetchTeamOverviewTransfersData,
  fetchTeamOverviewUpcomingMatchesData,
  fetchTeamSeoData,
} from '@/domains/livescore/actions/teams/team';
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
import { getTeamById, getLeagueById } from '@/domains/livescore/actions/teamLeagueData';
import { resolveTeamIndexability } from '@/domains/livescore/actions/seoIndexability';
import { getPlayersKoreanNames } from '@/domains/livescore/actions/player/getKoreanName';
import { getLeagueSlug, slugify } from '@/domains/livescore/utils/slugs';
import { getTeamLogoUrl } from '@/domains/livescore/actions/images';
import { getTeamDailyBriefing } from '@/domains/livescore/actions/teams/dailyBriefing';
import { isUsableTeamSlug, resolveTeamCanonicalSlug } from '@/domains/livescore/actions/teams/slug';
import {
  isNextNotFoundError,
  isNextRedirectError,
  normalizeRouteSlug,
} from '@/shared/utils/nextNavigationErrors';
import { buildFootballOgImageUrl } from '@/shared/utils/footballOgImage';

interface TeamPageProps {
  params: Promise<{ id: string; slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

// 팀 메타데이터 생성
export async function generateMetadata({
  params,
  searchParams
}: {
  params: Promise<{ id: string; slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}): Promise<Metadata> {
  const [{ id, slug }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const hasTabState = Boolean(resolvedSearchParams?.tab);

  // 팀 데이터 조회 (최소한의 옵션으로)
  const teamData = await fetchTeamSeoData(id);

  if (!teamData.success || !teamData.team) {
    return buildMetadata({
      title: '팀 정보를 찾을 수 없습니다',
      description: '요청하신 팀 정보가 존재하지 않습니다.',
      path: `/livescore/football/team/${id}`,
      noindex: true,
    });
  }





  const team = teamData.team;
  const mappedTeam = await getTeamById(Number(id));
  const resolvedLeagueId = mappedTeam?.league_id || team.league?.id || null;
  const league = resolvedLeagueId ? await getLeagueById(resolvedLeagueId) : null;
  const teamName = mappedTeam?.name_ko || team.name;
  const leagueName = league?.name_ko || league?.name || team.league?.name_ko || team.league?.name || '';
  const countryName = mappedTeam?.country_ko || mappedTeam?.country_en || team.country || '';
  const canonicalSlug = await resolveTeamCanonicalSlug(id);
  const teamSlug = canonicalSlug || (isUsableTeamSlug(id, slug) ? slug : '') || slugify(teamName);
  const teamLogoUrl = team.logo || await getTeamLogoUrl(Number(id), 'md');
  const teamLogoImage = teamLogoUrl.includes('placeholder') ? undefined : teamLogoUrl;
  const contextParts = [leagueName, countryName, team.founded ? `${team.founded}년 창단` : '']
    .filter(Boolean)
    .join(', ');
  const description = `${teamName}${contextParts ? ` (${contextParts})` : ''} 팀 페이지입니다. 현재 순위, 선수단, 최근 경기 결과, 다음 경기 일정과 시즌 통계를 4590 Football에서 확인하세요.`;
  const ogImage = buildFootballOgImageUrl({
    title: teamName,
    subtitle: [leagueName, countryName, team.founded ? `${team.founded}년 창단` : ''].filter(Boolean).join(' · '),
    label: leagueName || '팀 정보',
    leftImage: teamLogoImage,
    logo: league?.logo,
  });

  const { shouldNoindex } = await resolveTeamIndexability({
    teamId: id,
    leagueId: resolvedLeagueId,
    hasQueryState: hasTabState,
  });

  return buildMetadata({
    title: `${teamName} 순위·선수단·경기 일정·경기 결과·통계·이적${leagueName ? ` - ${leagueName}` : ''}`,
    description,
    path: `/livescore/football/team/${id}/${teamSlug}`,
    image: ogImage,
    imageWidth: 1200,
    imageHeight: 630,
    keywords: [
      `${teamName} 순위`,
      `${teamName} 선수단`,
      `${teamName} 일정`,
      `${teamName} 경기 일정`,
      `${teamName} 경기결과`,
      `${teamName} 경기 결과`,
      `${teamName} 통계`,
      `${teamName} 시즌 통계`,
      `${teamName} 이적`,
      `${teamName} 라인업`,
      `${teamName} 선수 통계`,
      `${teamName} 최근 경기`,
      `${teamName} 다음 경기`,
      ...(leagueName ? [
        `${leagueName} ${teamName}`,
        `${leagueName} ${teamName} 순위`,
        `${leagueName} ${teamName} 경기 일정`,
        `${leagueName} ${teamName} 경기 결과`,
      ] : []),
      '축구 팀 순위',
      '축구 팀 선수단',
      '축구 팀 경기 일정',
      '축구 팀 통계',
      '4590',
      '4590football',
    ],
    includeSiteKeywords: false,
    includeDefaultOgFallbacks: false,
    ...(shouldNoindex ? { robots: { index: false, follow: true } } : {}),
  });
}

// URL에서 허용하는 팀 상세 탭 목록.
const VALID_TABS: TeamTabType[] = ['overview', 'fixtures', 'standings', 'squad', 'transfers', 'stats'];

/** URL 탭 기준으로 필요한 팀 데이터를 서버에서 준비하고 렌더링합니다. */
async function TeamPageContent({ id, slug, tab }: { id: string; slug: string; tab: string }) {
  try {
    const canonicalSlug = await resolveTeamCanonicalSlug(id);

    if (canonicalSlug && normalizeRouteSlug(slug) !== normalizeRouteSlug(canonicalSlug)) {
      const tabParam = tab && tab !== 'overview' ? `?tab=${tab}` : '';
      permanentRedirect(`/livescore/football/team/${id}/${encodeURIComponent(canonicalSlug)}${tabParam}`);
    }

    // 유효하지 않은 탭은 기본 overview로 정규화합니다.
    const initialTab = VALID_TABS.includes(tab as TeamTabType)
      ? (tab as TeamTabType)
      : 'overview';

    // 현재 URL 탭에 필요한 데이터만 서버에서 준비합니다.
    // 탭 이동은 App Router navigation으로 다시 서버를 실행합니다.
    const needsMatches = initialTab === 'fixtures';
    const needsSquad = initialTab === 'squad';
    const needsPlayerStats = ['squad', 'stats'].includes(initialTab);
    const needsStandings = initialTab === 'standings';
    const needsTransfers = initialTab === 'transfers';

    const [
      initialData,
      overviewPlayerRankings,
      overviewTransfers,
      overviewRecentMatches,
      overviewUpcomingMatches,
      overviewStandings,
      dailyBriefing,
    ] = await Promise.all([
      fetchTeamFullData(id, {
        fetchMatches: needsMatches,
        fetchSquad: needsSquad,
        fetchPlayerStats: needsPlayerStats,
        fetchStandings: needsStandings,
        fetchTransfers: needsTransfers,
        fetchMatchesMode: initialTab === 'overview' ? 'recent' : 'season',
        matchLimit: 10,
      }),
      initialTab === 'overview'
        ? fetchTeamOverviewPlayerRankingsData(id, 5)
        : Promise.resolve(null),
      initialTab === 'overview'
        ? fetchTeamOverviewTransfersData(id)
        : Promise.resolve(null),
      initialTab === 'overview'
        ? fetchTeamOverviewRecentMatchesData(id, 5)
        : Promise.resolve(null),
      initialTab === 'overview'
        ? fetchTeamOverviewUpcomingMatchesData(id, 5)
        : Promise.resolve(null),
      initialTab === 'overview'
        ? fetchTeamOverviewStandingsData(id)
        : Promise.resolve(null),
      initialTab === 'overview'
        ? getTeamDailyBriefing(Number(id))
        : Promise.resolve(null),
    ]);

    if (!initialData.success || !initialData.teamData?.team) {
      notFound();
    }

    if (overviewPlayerRankings?.success) {
      initialData.squad = {
        success: true,
        data: overviewPlayerRankings.squad,
        message: overviewPlayerRankings.message,
      };
      initialData.playerStats = {
        success: true,
        data: overviewPlayerRankings.playerStats,
        message: overviewPlayerRankings.message,
      };
      initialData.squadMode = 'preview';
      initialData.playerPhotoUrls = {
        ...(initialData.playerPhotoUrls || {}),
        ...overviewPlayerRankings.playerPhotoUrls,
      };
    }

    if (overviewTransfers?.success) {
      initialData.transfers = {
        success: true,
        data: overviewTransfers.transfers,
        message: overviewTransfers.message,
      };
      initialData.transfersMode = 'preview';
      initialData.playerPhotoUrls = {
        ...(initialData.playerPhotoUrls || {}),
        ...overviewTransfers.playerPhotoUrls,
      };
      initialData.teamLogoUrls = {
        ...(initialData.teamLogoUrls || {}),
        ...overviewTransfers.teamLogoUrls,
      };
    }

    if (overviewRecentMatches?.success || overviewUpcomingMatches?.success) {
      initialData.matches = {
        success: Boolean(overviewRecentMatches?.success || overviewUpcomingMatches?.success),
        data: [
          ...(overviewRecentMatches?.matches || []),
          ...(overviewUpcomingMatches?.matches || []),
        ],
        message: overviewRecentMatches?.message || overviewUpcomingMatches?.message || '팀 경기 preview 데이터를 가져왔습니다',
      };
      initialData.teamLogoUrls = {
        ...(initialData.teamLogoUrls || {}),
        ...(overviewRecentMatches?.teamLogoUrls || {}),
        ...(overviewUpcomingMatches?.teamLogoUrls || {}),
      };
      initialData.leagueLogoUrls = {
        ...(initialData.leagueLogoUrls || {}),
        ...(overviewRecentMatches?.leagueLogoUrls || {}),
        ...(overviewUpcomingMatches?.leagueLogoUrls || {}),
      };
      initialData.leagueLogoDarkUrls = {
        ...(initialData.leagueLogoDarkUrls || {}),
        ...(overviewRecentMatches?.leagueLogoDarkUrls || {}),
        ...(overviewUpcomingMatches?.leagueLogoDarkUrls || {}),
      };
    }

    if (overviewStandings?.success) {
      initialData.standings = {
        success: true,
        data: overviewStandings.standings,
        message: overviewStandings.message,
      };
      initialData.teamLogoUrls = {
        ...(initialData.teamLogoUrls || {}),
        ...overviewStandings.teamLogoUrls,
      };
      initialData.leagueLogoUrls = {
        ...(initialData.leagueLogoUrls || {}),
        ...overviewStandings.leagueLogoUrls,
      };
      initialData.leagueLogoDarkUrls = {
        ...(initialData.leagueLogoDarkUrls || {}),
        ...overviewStandings.leagueLogoDarkUrls,
      };
    }

    // 선수 ID 추출 (squad + transfers)
    const playerIds: Set<number> = new Set();

    // squad에서 선수 ID 추출
    if (initialTab === 'squad' && initialData.squad?.data) {
      initialData.squad.data.forEach((member: { id?: number }) => {
        if (member.id) playerIds.add(member.id);
      });
    }

    // transfers에서 선수 ID 추출 (in/out 구조)
    if (initialData.transfers?.data) {
      // 영입 선수
      const transferInForNames = initialTab === 'transfers'
        ? initialData.transfers.data.in
        : initialData.transfers.data.in?.slice(0, 5);
      const transferOutForNames = initialTab === 'transfers'
        ? initialData.transfers.data.out
        : initialData.transfers.data.out?.slice(0, 5);

      transferInForNames?.forEach((transfer: { player?: { id?: number } }) => {
        if (transfer.player?.id) playerIds.add(transfer.player.id);
      });
      // 방출 선수
      transferOutForNames?.forEach((transfer: { player?: { id?: number } }) => {
        if (transfer.player?.id) playerIds.add(transfer.player.id);
      });
    }

    // 선수 한글명 일괄 조회 (DB)
    const playerKoreanNames = {
      ...(overviewPlayerRankings?.playerKoreanNames || {}),
      ...(overviewTransfers?.playerKoreanNames || {}),
      ...(playerIds.size > 0 ? await getPlayersKoreanNames(Array.from(playerIds)) : {}),
    };

    // SportsTeam JSON-LD 생성
    const team = initialData.teamData?.team?.team;
    const venue = initialData.teamData?.team?.venue;
    const teamMapping = team ? await getTeamById(Number(id)) : null;
    const leagueIdFromData = initialData.standings?.data?.[0]?.league?.id || teamMapping?.league_id;
    const leagueMapping = leagueIdFromData ? await getLeagueById(leagueIdFromData) : null;

    // 코치 정보 추출
    const coach = initialData.squad?.data?.find(
      (member: { position?: string }) => member.position === 'Coach'
    ) as { id?: number; name?: string } | undefined;

    const teamSlug = canonicalSlug || slug;
    const teamUrl = `${siteConfig.url}/livescore/football/team/${id}/${teamSlug}`;
    const leagueId = leagueIdFromData;
    const leagueNameForSlug = initialData.standings?.data?.[0]?.league?.name || leagueMapping?.name_ko;
    const leagueUrl = leagueId ? `${siteConfig.url}/livescore/football/leagues/${leagueId}/${getLeagueSlug(leagueId, leagueNameForSlug)}` : undefined;
    const teamLogoUrl = initialData.teamLogoUrls?.[Number(id)] || team?.logo;
    const teamLogoJsonLdUrl = isUsableJsonLdImage(teamLogoUrl) ? absoluteSiteUrl(teamLogoUrl) : undefined;
    const venueImageJsonLdUrl = isUsableJsonLdImage(initialData.venueImageUrl || venue?.image)
      ? absoluteSiteUrl(initialData.venueImageUrl || venue?.image || '')
      : undefined;

    const sportsTeamSchema = team ? {
      '@context': 'https://schema.org',
      '@type': 'SportsTeam',
      '@id': buildJsonLdId(teamUrl, 'sports-team'),
      name: team.name,
      ...(teamMapping?.name_en ? { alternateName: teamMapping.name_en } : {}),
      url: teamUrl,
      isPartOf: { '@id': SITE_WEBSITE_ID },
      publisher: { '@id': SITE_ORGANIZATION_ID },
      ...(teamLogoJsonLdUrl ? { logo: teamLogoJsonLdUrl, image: teamLogoJsonLdUrl } : {}),
      ...(team.founded ? { foundingDate: String(team.founded) } : {}),
      sport: 'Football',
      ...(leagueMapping && leagueUrl ? {
        memberOf: {
          '@type': 'SportsOrganization',
          '@id': buildJsonLdId(leagueUrl, 'sports-organization'),
          name: leagueMapping.name_ko || initialData.standings?.data?.[0]?.league?.name || '',
          url: leagueUrl,
          sport: 'Football',
        },
      } : {}),
      ...(coach?.name ? {
        coach: {
          '@type': 'Person',
          name: coach.name,
        },
      } : {}),
      ...(venue?.name ? {
        location: {
          '@type': 'StadiumOrArena',
          name: venue.name,
          ...(venueImageJsonLdUrl ? { image: venueImageJsonLdUrl } : {}),
          ...((venue.address || venue.city) ? {
            address: {
              '@type': 'PostalAddress',
              ...(venue.address ? { streetAddress: venue.address } : {}),
              ...(venue.city ? { addressLocality: venue.city } : {}),
            },
          } : {}),
          ...(venue.capacity ? { maximumAttendeeCapacity: venue.capacity } : {}),
        },
      } : (team.country ? {
        location: { '@type': 'Country', name: team.country },
      } : {})),
    } : null;

    // BreadcrumbList JSON-LD
    const teamDisplayName = teamMapping?.name_ko || team?.name || '';
    const leagueDisplayName = leagueMapping?.name_ko || initialData.standings?.data?.[0]?.league?.name || '';
    const daumContent = [
      `${teamDisplayName || team?.name || '팀'} 축구팀 정보`,
      leagueDisplayName ? `${leagueDisplayName} 소속` : '',
      team?.country ? `${team.country} 축구팀` : '',
      venue?.name ? `홈구장 ${venue.name}` : '',
      team?.founded ? `창단 ${team.founded}` : '',
      '경기 일정, 결과, 순위, 선수단, 이적 정보를 확인하세요.',
    ].filter(Boolean).join('. ');
    const breadcrumbSchema = buildBreadcrumbJsonLd({
      items: [
        { name: '홈', url: '/' },
        { name: '라이브스코어', url: '/livescore/football' },
        ...(leagueDisplayName && leagueId && leagueUrl ? [{ name: leagueDisplayName, url: leagueUrl }] : []),
        { name: teamDisplayName, url: teamUrl },
      ],
    });

    // 클라이언트 컴포넌트에 데이터 전달
    return (
      <>
        <DaumWebmasterHints
          title={`${teamDisplayName || team?.name || '팀'} - 팀 정보`}
          content={daumContent}
        />
        {sportsTeamSchema && (
          <script
            type="application/ld+json"
            {...jsonLdScriptProps(sportsTeamSchema)}
          />
        )}
        <script
          type="application/ld+json"
          {...jsonLdScriptProps(breadcrumbSchema)}
        />
        <TeamPageClient
          teamId={id}
          initialTab={initialTab}
          initialData={initialData}
          playerKoreanNames={playerKoreanNames}
          dailyBriefing={dailyBriefing}
        />
      </>
    );
  } catch (error: unknown) {
    if (isNextRedirectError(error) || isNextNotFoundError(error)) {
      throw error;
    }

    console.error('팀 페이지 로딩 오류:', error);
    notFound();
  }
}

export default async function TeamPage({ params, searchParams }: TeamPageProps) {
  const { id, slug } = await params;
  const { tab = 'overview' } = await searchParams;

  return await TeamPageContent({ id, slug, tab });
}
