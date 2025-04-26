import { fetchCachedTeamData } from '@/app/actions/livescore/teams/team';
import { fetchCachedTeamStandings } from '@/app/actions/livescore/teams/standings';
import Standings from '../../components/tabs/Standings';

export default async function StandingsPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    // params를 비동기적으로 처리
    const { id } = await params;
    
    // 디버깅 로그
    
    // 팀 기본 정보 가져오기
    const teamResponse = await fetchCachedTeamData(id);
    
    if (!teamResponse.success || !teamResponse.team) {
      throw new Error('팀 정보를 불러오는데 실패했습니다.');
    }
    
    // 스탠딩 정보 가져오기
    const standingsResponse = await fetchCachedTeamStandings(id);
    
    // 스탠딩 데이터 가공 - LeagueStanding 인터페이스에 맞게 수정
    const standings = standingsResponse.success && standingsResponse.data 
      ? standingsResponse.data.map(standing => ({
          league: {
            id: standing.league.id,
            name: standing.league.name,
            logo: standing.league.logo
          },
          standings: [standing.league.standings[0] || []] // standings를 이중 배열로 감싸줌
        }))
      : [];
    
    // 팀 ID 숫자로 변환
    const numericTeamId = parseInt(id, 10);
    
    return (
      <Standings 
        standings={standings}
        teamId={numericTeamId}
      />
    );
  } catch (error) {
    console.error('스탠딩 탭 오류:', error);
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        스탠딩 데이터를 불러오는데 실패했습니다.
      </div>
    );
  }
} 