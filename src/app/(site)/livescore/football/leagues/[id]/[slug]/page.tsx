import { notFound } from 'next/navigation';
import { getLeagueSlug } from '@/domains/livescore/utils/slugs';
import { fetchLeagueDetails } from '@/domains/livescore/actions/footballApi';
import { fetchLeagueStandings } from '@/domains/livescore/actions/match/standingsData';
import { LeagueHeader, LeagueStandingsTable, LeagueRankingsSection, CupRoundsView } from '@/domains/livescore/components/football/leagues';
import { fetchCupFixturesByRound } from '@/domains/livescore/actions/match/cupFixtures';
import { buildMetadata } from '@/shared/utils/metadataNew';
import { siteConfig } from '@/shared/config';
import { getTeamLogoUrls, getLeagueLogoUrl } from '@/domains/livescore/actions/images';
import { fetchCachedLeagueRankings } from '@/domains/livescore/actions/match/leagueRankings';
import { getBoardSlugByLeagueId } from '@/domains/boards/actions/getBoards';
import AdBanner from '@/shared/components/AdBanner';

interface LeaguePageProps {
  params: Promise<{ id: string; slug: string }>;
}

export async function generateMetadata({ params }: LeaguePageProps) {
  const { id } = await params;
  const league = await fetchLeagueDetails(id);

  if (!league) {
    return buildMetadata({
      title: '리그를 찾을 수 없습니다',
      description: '요청하신 리그 정보가 존재하지 않습니다.',
      path: `/livescore/football/leagues/${id}/${getLeagueSlug(parseInt(id, 10))}`,
      noindex: true,
    });
  }

  return buildMetadata({
    title: `${league.name} 순위표 - 팀 순위·득점 순위`,
    description: `${league.name} (${league.country}) 리그 순위표, 득점 순위, 도움 순위를 확인하세요. 축구 커뮤니티 4590 Football.`,
    path: `/livescore/football/leagues/${id}/${getLeagueSlug(parseInt(id, 10))}`,
    keywords: [`${league.name} 순위`, `${league.name} 득점 순위`, `${league.name} 일정`, `${league.name} 결과`, '축구 리그 순위표', '축구 커뮤니티', '4590', '4590football'],
  });
}

/** 리그 데이터 로딩 + 렌더링 async 서버 컴포넌트 */
async function LeaguePageContent({ id }: { id: string }) {
  const leagueId = parseInt(id, 10);

  // 1단계: 리그 정보 먼저 조회 (타입에 따라 다른 데이터 병렬 fetch 결정)
  const league = await fetchLeagueDetails(id);
  if (!league) {
    notFound();
  }

  const isCup = league.type === 'Cup';

  // 2단계: 리그(일반)는 standings+rankings, 컵은 라운드별 경기+rankings 병렬
  // 컵 대회는 API가 standings를 원천적으로 지원하지 않음 (coverage.standings: false)
  const [standingsResponse, rankings, cupRoundsResponse] = await Promise.all([
    isCup
      ? Promise.resolve({ success: false as const, data: null as null })
      : fetchLeagueStandings(leagueId),
    fetchCachedLeagueRankings(leagueId),
    isCup
      ? fetchCupFixturesByRound(leagueId, league.season)
      : Promise.resolve({ success: true as const, rounds: [] }),
  ]);

  // 4590 표준: 리그 로고 + 다크모드 로고 + 게시판 slug 조회
  const [leagueLogoUrl, leagueLogoUrlDark, boardSlug] = await Promise.all([
    getLeagueLogoUrl(leagueId),
    getLeagueLogoUrl(leagueId, true),
    getBoardSlugByLeagueId(leagueId),
  ]);

  let teamLogoUrls: Record<number, string> = {};
  if (standingsResponse.success && standingsResponse.data?.league?.standings) {
    const teamIds = new Set<number>();
    standingsResponse.data.league.standings.forEach((group: Array<{ team?: { id?: number } }>) => {
      group.forEach(standing => {
        if (standing.team?.id) {
          teamIds.add(standing.team.id);
        }
      });
    });
    if (teamIds.size > 0) {
      teamLogoUrls = await getTeamLogoUrls([...teamIds]);
    }
  }

  // SportsOrganization JSON-LD 생성
  const leagueSchema = {
    '@context': 'https://schema.org',
    '@type': 'SportsOrganization',
    name: league.name,
    url: `${siteConfig.url}/livescore/football/leagues/${leagueId}`,
    sport: 'Football',
    ...(league.country ? { location: { '@type': 'Country', name: league.country } } : {}),
  };

  // ItemList JSON-LD 생성 (순위표 기반 소속팀 목록)
  const standings = standingsResponse.success && standingsResponse.data?.league?.standings;
  const teamListSchema = standings && standings[0]?.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${league.name} 순위`,
    itemListElement: standings[0].map((standing: { rank?: number; team?: { id?: number; name?: string } }, index: number) => ({
      '@type': 'ListItem',
      position: standing.rank || index + 1,
      item: {
        '@type': 'SportsTeam',
        name: standing.team?.name || '',
        ...(standing.team?.id ? { url: `${siteConfig.url}/livescore/football/team/${standing.team.id}` } : {}),
      },
    })),
  } : null;

  // BreadcrumbList JSON-LD
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: siteConfig.url },
      { '@type': 'ListItem', position: 2, name: '라이브스코어', item: `${siteConfig.url}/livescore/football` },
      { '@type': 'ListItem', position: 3, name: league.name, item: `${siteConfig.url}/livescore/football/leagues/${leagueId}` },
    ],
  };

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(leagueSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {teamListSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(teamListSchema) }}
        />
      )}
      <div className="bg-white dark:bg-[#1D1D1D] md:rounded-lg border border-black/7 dark:border-0 overflow-hidden">
        <LeagueHeader
          league={league}
          leagueLogoUrl={leagueLogoUrl}
          leagueLogoUrlDark={leagueLogoUrlDark}
          boardSlug={boardSlug}
        />
        <div className="px-4 py-2.5 bg-white dark:bg-[#1D1D1D]">
          <p className="text-sm text-gray-900 dark:text-gray-100">
            {isCup
              ? '경기를 클릭하면 상세 정보를, 선수를 클릭하면 선수 상세 정보를 확인할 수 있습니다.'
              : '순위표에서 팀을 클릭하면 팀 상세 정보를, 팀 페이지에서 선수를 클릭하면 선수 상세 정보를 확인할 수 있습니다.'}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <AdBanner />
      </div>

      <div className="mt-4">
        {isCup ? (
          <CupRoundsView rounds={cupRoundsResponse.rounds} />
        ) : (
          <LeagueStandingsTable
            standings={standingsResponse.success && standingsResponse.data ? standingsResponse.data : null}
            leagueId={leagueId}
            teamLogoUrls={teamLogoUrls}
          />
        )}
      </div>

      <div className="mt-4">
        <LeagueRankingsSection
        topScorers={rankings.topScorers}
        topAssists={rankings.topAssists}
        playerPhotoUrls={rankings.playerPhotoUrls}
        teamLogoUrls={{ ...teamLogoUrls, ...rankings.teamLogoUrls }}
        playerKoreanNames={rankings.playerKoreanNames}
        leagueId={leagueId}
      />
      </div>
    </div>
  );
}

export default async function LeaguePage({ params }: LeaguePageProps) {
  const { id } = await params;

  return await LeaguePageContent({ id });
}
