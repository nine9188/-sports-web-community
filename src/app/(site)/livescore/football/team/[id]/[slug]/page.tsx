import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import TeamPageClient, { TeamTabType } from '@/domains/livescore/components/football/team/TeamPageClient';
import { fetchTeamFullData, fetchTeamSeoData } from '@/domains/livescore/actions/teams/team';
import { buildMetadata } from '@/shared/utils/metadataNew';
import { siteConfig } from '@/shared/config';
import { getTeamById, getLeagueById } from '@/domains/livescore/actions/teamLeagueData';
import { getPlayersKoreanNames } from '@/domains/livescore/actions/player/getKoreanName';
import { slugify } from '@/domains/livescore/utils/slugs';

type TeamPagePerfStep = {
  label: string;
  ms: number;
};

function createTeamPagePerfTrace(teamId: string, tab: string) {
  const enabled = process.env.NODE_ENV === 'development' || process.env.TEAM_DETAIL_PERF === '1';
  const startedAt = Date.now();
  const steps: TeamPagePerfStep[] = [];

  return {
    mark: async <T,>(label: string, task: () => Promise<T>): Promise<T> => {
      if (!enabled) return task();

      const start = Date.now();
      try {
        return await task();
      } finally {
        steps.push({ label, ms: Date.now() - start });
      }
    },
    log: (label: string) => {
      if (!enabled) return;

      const detail = steps.map((step) => `${step.label}=${step.ms}ms`).join(' | ');
      console.info(`[team-page-perf] ${label} team=${teamId} tab=${tab} total=${Date.now() - startedAt}ms${detail ? ` | ${detail}` : ''}`);
    },
  };
}

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
  const description = `${teamName} 순위, 선수단, 경기 일정, 통계 정보를 확인하세요.${team.country ? ` ${team.country}` : ''}${team.founded ? ` (창단: ${team.founded}년)` : ''} 축구 커뮤니티 4590 Football.`;

  return buildMetadata({
    title: `${teamName} - 순위·선수단·일정`,
    description,
    path: `/livescore/football/team/${id}/${teamSlug}`,
    keywords: [`${teamName} 순위`, `${teamName} 선수단`, `${teamName} 일정`, `${teamName} 경기결과`, `${teamName} 이적`, `${teamName} 라인업`, '축구 커뮤니티', '4590', '4590football'],
  });
}

// 유효한 탭 목록
const VALID_TABS: TeamTabType[] = ['overview', 'fixtures', 'standings', 'squad', 'transfers', 'stats'];

/** 팀 데이터 로딩 + 렌더링 async 서버 컴포넌트 (Suspense 스트리밍용) */
async function TeamPageContent({ id, slug, tab }: { id: string; slug: string; tab: string }) {
  const perf = createTeamPagePerfTrace(id, tab);

  try {
    // 유효한 탭인지 확인
    const initialTab = VALID_TABS.includes(tab as TeamTabType)
      ? (tab as TeamTabType)
      : 'overview';

    // 현재 탭 데이터만 SSR (나머지 탭은 클라이언트에서 on-demand 로드)
    const headersList = await perf.mark('headers', () => import('next/headers').then(m => m.headers()));
    const isBot = headersList.get('x-is-bot') === '1';

    const needsMatches = !isBot && initialTab === 'fixtures';
    const needsSquad = !isBot && initialTab === 'squad';
    const needsPlayerStats = !isBot && ['squad', 'stats'].includes(initialTab);
    const needsStandings = !isBot && initialTab === 'standings';
    const needsTransfers = !isBot && initialTab === 'transfers';

    const initialData = await perf.mark('fetchTeamFullData', () => fetchTeamFullData(id, {
      fetchMatches: needsMatches,
      fetchSquad: needsSquad,
      fetchPlayerStats: needsPlayerStats,
      fetchStandings: needsStandings,
      fetchTransfers: needsTransfers,
      fetchMatchesMode: initialTab === 'overview' ? 'recent' : 'season',
      matchLimit: 10,
    }));

    if (!initialData.success || !initialData.teamData?.team) {
      notFound();
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
        : initialData.transfers.data.in?.slice(0, 3);
      const transferOutForNames = initialTab === 'transfers'
        ? initialData.transfers.data.out
        : initialData.transfers.data.out?.slice(0, 3);

      transferInForNames?.forEach((transfer: { player?: { id?: number } }) => {
        if (transfer.player?.id) playerIds.add(transfer.player.id);
      });
      // 방출 선수
      transferOutForNames?.forEach((transfer: { player?: { id?: number } }) => {
        if (transfer.player?.id) playerIds.add(transfer.player.id);
      });
    }

    // 선수 한글명 일괄 조회 (DB)
    const playerKoreanNames = playerIds.size > 0
      ? await perf.mark('db:player-korean-names', () => getPlayersKoreanNames(Array.from(playerIds)))
      : {};

    // SportsTeam JSON-LD 생성
    const team = initialData.teamData?.team?.team;
    const venue = initialData.teamData?.team?.venue;
    const [teamMapping, leagueMapping] = await perf.mark('jsonld:mappings', () => Promise.all([
      team ? getTeamById(Number(id)) : Promise.resolve(null),
      initialData.standings?.data?.[0]?.league
        ? getLeagueById(initialData.standings.data[0].league.id)
        : Promise.resolve(null),
    ]));

    // 코치 정보 추출
    const coach = initialData.squad?.data?.find(
      (member: { position?: string }) => member.position === 'Coach'
    ) as { id?: number; name?: string } | undefined;

    const teamSlug = slug || (team?.name ? slugify(team.name) : '') || 'team';
    const teamUrl = `${siteConfig.url}/livescore/football/team/${id}/${teamSlug}`;

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
          name: leagueMapping.name_ko || initialData.standings?.data?.[0]?.league?.name,
          url: `${siteConfig.url}/livescore/football/leagues/${initialData.standings?.data?.[0]?.league?.id}`,
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
    const leagueDisplayName = leagueMapping?.name_ko || initialData.standings?.data?.[0]?.league?.name || '';
    const leagueId = initialData.standings?.data?.[0]?.league?.id;
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
    perf.log('success');

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
    perf.log('error');
    console.error('팀 페이지 로딩 오류:', error);
    notFound();
  }
}

export default async function TeamPage({ params, searchParams }: TeamPageProps) {
  const { id, slug } = await params;
  const { tab = 'overview' } = await searchParams;

  return await TeamPageContent({ id, slug, tab });
}
