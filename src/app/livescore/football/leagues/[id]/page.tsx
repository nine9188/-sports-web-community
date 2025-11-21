import { notFound } from 'next/navigation';
import { fetchLeagueDetails, fetchLeagueTeams } from '@/domains/livescore/actions/footballApi';
import { LeagueHeader, LeagueTeamsList } from '@/domains/livescore/components/football/leagues';

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
    title: `${league.name} - 소속 팀 목록`,
    description: `${league.name} (${league.country})의 모든 소속 팀을 확인하세요.`,
  };
}

export default async function LeaguePage({ params }: LeaguePageProps) {
  const { id } = await params;
  
  // 리그 정보와 팀 목록을 병렬로 가져오기
  const [league, teams] = await Promise.all([
    fetchLeagueDetails(id),
    fetchLeagueTeams(id)
  ]);

  if (!league) {
    notFound();
  }



  return (
    <div className="min-h-screen">
      <div className="space-y-0">
        <LeagueHeader league={league} />
        <LeagueTeamsList teams={teams} leagueId={league.id} />
      </div>
    </div>
  );
} 