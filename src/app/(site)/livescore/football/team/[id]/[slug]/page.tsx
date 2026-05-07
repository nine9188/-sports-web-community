import { Metadata } from 'next';
import { notFound } from 'next/navigation';
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
import { getPlayersKoreanNames } from '@/domains/livescore/actions/player/getKoreanName';
import { getLeagueSlug, slugify } from '@/domains/livescore/utils/slugs';
import { getTeamLogoUrl } from '@/domains/livescore/actions/images';

interface TeamPageProps {
  params: Promise<{ id: string; slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

// 팀 메타데이터 생성
export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string; slug: string }>
}): Promise<Metadata> {
  const { id, slug } = await params;

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
  const teamName = team.name;
  const teamSlug = slug || slugify(teamName) || 'team';
  const teamLogoUrl = await getTeamLogoUrl(Number(id), 'md');
  const ogImage = teamLogoUrl.includes('placeholder') ? undefined : teamLogoUrl;
  const description = `${teamName} 순위, 선수단, 경기 일정, 통계 정보를 확인하세요.${team.country ? ` ${team.country}` : ''}${team.founded ? ` (창단: ${team.founded}년)` : ''} 축구 커뮤니티 4590 Football.`;

  return buildMetadata({
    title: `${teamName} - 순위·선수단·일정`,
    description,
    path: `/livescore/football/team/${id}/${teamSlug}`,
    image: ogImage,
    imageWidth: ogImage ? 128 : undefined,
    imageHeight: ogImage ? 128 : undefined,
    keywords: [`${teamName} 순위`, `${teamName} 선수단`, `${teamName} 일정`, `${teamName} 경기결과`, `${teamName} 이적`, `${teamName} 라인업`, '축구 커뮤니티', '4590', '4590football'],
  });
}

// 유효한 탭 목록
const VALID_TABS: TeamTabType[] = ['overview', 'fixtures', 'standings', 'squad', 'transfers', 'stats'];

/** 팀 데이터 로딩 + 렌더링 async 서버 컴포넌트 */
async function TeamPageContent({ id, slug, tab }: { id: string; slug: string; tab: string }) {
  try {
    // 유효한 탭인지 확인
    const initialTab = VALID_TABS.includes(tab as TeamTabType)
      ? (tab as TeamTabType)
      : 'overview';

    // 현재 탭 데이터만 SSR (나머지 탭은 클라이언트에서 on-demand 로드)
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

    const teamSlug = slug || (team?.name ? slugify(team.name) : '') || 'team';
    const teamUrl = `${siteConfig.url}/livescore/football/team/${id}/${teamSlug}`;
    const leagueId = leagueIdFromData;
    const leagueUrl = leagueId ? `${siteConfig.url}/livescore/football/leagues/${leagueId}/${getLeagueSlug(leagueId)}` : undefined;
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
        />
      </>
    );
  } catch (error: unknown) {
    console.error('팀 페이지 로딩 오류:', error);
    notFound();
  }
}

export default async function TeamPage({ params, searchParams }: TeamPageProps) {
  const { id, slug } = await params;
  const { tab = 'overview' } = await searchParams;

  return await TeamPageContent({ id, slug, tab });
}
