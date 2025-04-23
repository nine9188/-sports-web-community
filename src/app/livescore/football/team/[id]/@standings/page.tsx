import { fetchCachedTeamStandings } from '@/app/actions/livescore/teams/standings';
import Standings from '../../components/tabs/Standings';

export default async function StandingsPage({ params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    
    // 팀 ID를 숫자로 변환
    const numericTeamId = parseInt(id, 10);
    
    // 순위표 정보 가져오기
    const standingsResponse = await fetchCachedTeamStandings(id);
    
    // 데이터 변환
    const standings = standingsResponse.success && standingsResponse.data
      ? standingsResponse.data.map(standing => ({
          league: {
            id: standing.league.id,
            name: standing.league.name,
            logo: standing.league.logo
          },
          standings: standing.league.standings
        }))
      : [];
    
    return <Standings standings={standings} teamId={numericTeamId} />;
    
  } catch (error) {
    console.error('Standings 탭 오류:', error);
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        순위표 정보를 불러오는데 실패했습니다.
      </div>
    );
  }
} 