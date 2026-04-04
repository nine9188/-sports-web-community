import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import TeamPageClient, { TeamTabType } from '@/domains/livescore/components/football/team/TeamPageClient';
import { fetchTeamFullData } from '@/domains/livescore/actions/teams/team';
import { buildMetadata } from '@/shared/utils/metadataNew';
import { siteConfig } from '@/shared/config';
import { getTeamById } from '@/domains/livescore/constants/teams';
import { getLeagueById } from '@/domains/livescore/constants/league-mappings';
import { getPlayersKoreanNames } from '@/domains/livescore/actions/player/getKoreanName';
import { TeamPageSkeleton } from '@/shared/components/skeletons/page-skeletons';

interface TeamPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

// 팀 메타데이터 생성
export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params;

  // 팀 데이터 조회 (최소한의 옵션으로)
  const teamData = await fetchTeamFullData(id, {
    fetchMatches: false,
    fetchSquad: false,
    fetchPlayerStats: false,
    fetchStandings: false,
  });

  if (!teamData.success || !teamData.teamData?.team?.team) {
    return buildMetadata({
      title: '팀 정보를 찾을 수 없습니다',
      description: '요청하신 팀 정보가 존재하지 않습니다.',
      path: `/livescore/football/team/${id}`,
      noindex: true,
    });
  }

  const team = teamData.teamData.team.team;
  const teamName = team.name;
  const description = `${teamName} 순위, 선수단, 경기 일정, 통계 정보를 확인하세요.${team.country ? ` ${team.country}` : ''}${team.founded ? ` (창단: ${team.founded}년)` : ''} 축구 커뮤니티 4590 Football.`;

  return buildMetadata({
    title: `${teamName} - 순위·선수단·일정`,
    description,
    path: `/livescore/football/team/${id}`,
    keywords: [`${teamName} 순위`, `${teamName} 선수단`, `${teamName} 일정`, `${teamName} 경기결과`, `${teamName} 이적`, `${teamName} 라인업`, '축구 커뮤니티', '4590', '4590football'],
  });
}

// 유효한 탭 목록
const VALID_TABS: TeamTabType[] = ['overview', 'fixtures', 'standings', 'squad', 'stats'];

/** 팀 데이터 로딩 + 렌더링 async 서버 컴포넌트 (Suspense 스트리밍용) */
async function TeamPageContent({ id, tab }: { id: string; tab: string }) {
  try {
    // 유효한 탭인지 확인
    const initialTab = VALID_TABS.includes(tab as TeamTabType)
      ? (tab as TeamTabType)
      : 'overview';

    // 모든 탭 데이터를 서버에서 미리 로드 (빠른 탭 전환을 위해)
    const initialData = await fetchTeamFullData(id, {
      fetchMatches: true,      // overview, fixtures 탭용
      fetchSquad: true,        // squad 탭용
      fetchPlayerStats: true,  // squad, stats 탭용
      fetchStandings: true,    // overview, standings 탭용
      fetchTransfers: true     // overview 탭용
    });

    if (!initialData.success || !initialData.teamData?.team) {
      notFound();
    }

    // 선수 ID 추출 (squad + transfers)
    const playerIds: Set<number> = new Set();

    // squad에서 선수 ID 추출
    if (initialData.squad?.data) {
      initialData.squad.data.forEach((member: { id?: number }) => {
        if (member.id) playerIds.add(member.id);
      });
    }

    // transfers에서 선수 ID 추출 (in/out 구조)
    if (initialData.transfers?.data) {
      // 영입 선수
      initialData.transfers.data.in?.forEach((transfer: { player?: { id?: number } }) => {
        if (transfer.player?.id) playerIds.add(transfer.player.id);
      });
      // 방출 선수
      initialData.transfers.data.out?.forEach((transfer: { player?: { id?: number } }) => {
        if (transfer.player?.id) playerIds.add(transfer.player.id);
      });
    }

    // 선수 한글명 일괄 조회 (DB)
    const playerKoreanNames = playerIds.size > 0
      ? await getPlayersKoreanNames(Array.from(playerIds))
      : {};

    // SportsTeam JSON-LD 생성
    const team = initialData.teamData?.team?.team;
    const venue = initialData.teamData?.team?.venue;
    const teamMapping = team ? getTeamById(Number(id)) : null;
    const leagueMapping = initialData.standings?.standings?.league
      ? getLeagueById(initialData.standings.standings.league.id)
      : null;

    // 코치 정보 추출
    const coach = initialData.squad?.data?.find(
      (member: { position?: string }) => member.position === 'Coach'
    ) as { id?: number; name?: string } | undefined;

    const teamUrl = `${siteConfig.url}/livescore/football/team/${id}`;

    const sportsTeamSchema = team ? {
      '@context': 'https://schema.org',
      '@type': 'SportsTeam',
      name: team.name,
      ...(teamMapping?.name_en ? { alternateName: teamMapping.name_en } : {}),
      url: teamUrl,
      logo: team.logo || `${siteConfig.url}/og-image.png`,
      ...(team.founded ? { foundingDate: String(team.founded) } : {}),
      sport: 'Football',
      ...(leagueMapping ? {
        memberOf: {
          '@type': 'SportsOrganization',
          name: leagueMapping.nameKo || initialData.standings?.standings?.league?.name,
          url: `${siteConfig.url}/livescore/football/leagues/${initialData.standings?.standings?.league?.id}`,
        },
      } : {}),
      ...(coach?.name ? {
        coach: {
          '@type': 'Person',
          name: coach.name,
        },
      } : {}),
      location: venue?.name ? {
        '@type': 'StadiumOrArena',
        name: venue.name,
        ...(venue.image ? { image: venue.image } : {}),
        ...((venue.address || venue.city) ? {
          address: {
            '@type': 'PostalAddress',
            ...(venue.address ? { streetAddress: venue.address } : {}),
            ...(venue.city ? { addressLocality: venue.city } : {}),
          },
        } : {}),
        ...(venue.capacity ? { maximumAttendeeCapacity: venue.capacity } : {}),
      } : (team.country ? { '@type': 'Country', name: team.country } : undefined),
    } : null;

    // BreadcrumbList JSON-LD
    const teamDisplayName = teamMapping?.name_ko || team?.name || '';
    const leagueDisplayName = leagueMapping?.nameKo || initialData.standings?.standings?.league?.name || '';
    const leagueId = initialData.standings?.standings?.league?.id;
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '홈', item: siteConfig.url },
        { '@type': 'ListItem', position: 2, name: '라이브스코어', item: `${siteConfig.url}/livescore/football` },
        ...(leagueDisplayName && leagueId ? [{
          '@type': 'ListItem', position: 3, name: leagueDisplayName, item: `${siteConfig.url}/livescore/football/leagues/${leagueId}`,
        }] : []),
        { '@type': 'ListItem', position: leagueDisplayName && leagueId ? 4 : 3, name: teamDisplayName, item: teamUrl },
      ],
    };

    // 클라이언트 컴포넌트에 데이터 전달
    return (
      <>
        {sportsTeamSchema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(sportsTeamSchema) }}
          />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
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
  const { id } = await params;
  const { tab = 'overview' } = await searchParams;

  return (
    <Suspense fallback={<TeamPageSkeleton />}>
      <TeamPageContent id={id} tab={tab} />
    </Suspense>
  );
}
