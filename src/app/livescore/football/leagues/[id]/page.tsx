import { notFound } from 'next/navigation';
import { fetchLeagueDetails } from '@/domains/livescore/actions/footballApi';
import { fetchLeagueStandings } from '@/domains/livescore/actions/match/standingsData';
import { LeagueHeader } from '@/domains/livescore/components/football/leagues';
import { LeagueStandingsTable } from '@/domains/livescore/components/football/leagues';

interface LeaguePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: LeaguePageProps) {
  const { id } = await params;
  const league = await fetchLeagueDetails(id);

  if (!league) {
    return {
      title: '리그를 찾을 수 없습니다',
    };
  }

  return {
    title: `${league.name} - 순위표`,
    description: `${league.name} (${league.country})의 리그 순위표를 확인하세요.`,
  };
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

  return (
    <div className="min-h-screen space-y-4">
      <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0 overflow-hidden">
        <LeagueHeader league={league} />
      </div>

      <LeagueStandingsTable
        standings={standingsResponse.success && standingsResponse.data ? standingsResponse.data : null}
        leagueId={leagueId}
      />
    </div>
  );
} 