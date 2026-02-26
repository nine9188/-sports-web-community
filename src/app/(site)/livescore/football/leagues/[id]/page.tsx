import { notFound } from 'next/navigation';
import { fetchLeagueDetails } from '@/domains/livescore/actions/footballApi';
import { fetchLeagueStandings } from '@/domains/livescore/actions/match/standingsData';
import { LeagueHeader } from '@/domains/livescore/components/football/leagues';
import { LeagueStandingsTable } from '@/domains/livescore/components/football/leagues';
import { buildMetadata } from '@/shared/utils/metadataNew';
import { getTeamLogoUrls, getLeagueLogoUrl } from '@/domains/livescore/actions/images';
import AdBanner from '@/shared/components/AdBanner';

interface LeaguePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: LeaguePageProps) {
  const { id } = await params;
  const league = await fetchLeagueDetails(id);

  if (!league) {
    return buildMetadata({
      title: '리그를 찾을 수 없습니다',
      description: '요청하신 리그 정보가 존재하지 않습니다.',
      path: `/livescore/football/leagues/${id}`,
      noindex: true,
    });
  }

  return buildMetadata({
    title: `${league.name} - 순위표`,
    description: `${league.name} (${league.country})의 리그 순위표를 확인하세요.`,
    path: `/livescore/football/leagues/${id}`,
  });
}

export default async function LeaguePage({ params }: LeaguePageProps) {
  const { id } = await params;
  const leagueId = parseInt(id, 10);

  // 리그 정보와 순위 데이터를 병렬로 가져오기
  const [league, standingsResponse] = await Promise.all([
    fetchLeagueDetails(id),
    fetchLeagueStandings(leagueId)
  ]);

  if (!league) {
    notFound();
  }

  // 4590 표준: 리그 로고 + 다크모드 로고 + 순위 데이터 팀 로고 조회
  const [leagueLogoUrl, leagueLogoUrlDark] = await Promise.all([
    getLeagueLogoUrl(leagueId),
    getLeagueLogoUrl(leagueId, true),
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

  return (
    <div className="min-h-screen space-y-4">
      <div className="bg-white dark:bg-[#1D1D1D] md:rounded-lg border border-black/7 dark:border-0 overflow-hidden">
        <LeagueHeader
          league={league}
          leagueLogoUrl={leagueLogoUrl}
          leagueLogoUrlDark={leagueLogoUrlDark}
        />
      </div>

      <AdBanner />

      <LeagueStandingsTable
        standings={standingsResponse.success && standingsResponse.data ? standingsResponse.data : null}
        leagueId={leagueId}
        teamLogoUrls={teamLogoUrls}
      />
    </div>
  );
} 