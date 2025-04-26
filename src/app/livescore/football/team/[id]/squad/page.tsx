import { fetchCachedTeamData } from '@/app/actions/livescore/teams/team';
import { fetchCachedTeamSquad } from '@/app/actions/livescore/teams/squad';
import { fetchCachedTeamPlayerStats } from '@/app/actions/livescore/teams/player-stats';
import Squad from '../../components/tabs/Squad';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SquadMember = any;

export default async function SquadPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    // params를 비동기적으로 처리
    const { id } = await params;
    
    // 팀 기본 정보 가져오기
    const teamResponse = await fetchCachedTeamData(id);
    
    if (!teamResponse.success || !teamResponse.team) {
      throw new Error('팀 정보를 불러오는데 실패했습니다.');
    }
    
    // 선수단 정보와 선수 통계 병렬로 가져오기
    const [squadResponse, playerStatsResponse] = await Promise.all([
      fetchCachedTeamSquad(id),
      fetchCachedTeamPlayerStats(id)
    ]);
    
    // 스쿼드 데이터 없는 경우 빈 배열 사용
    const processedSquad: SquadMember[] = [];
    
    // 선수 통계 데이터
    const playerStats = playerStatsResponse.success ? playerStatsResponse.data : {};
    
    if (squadResponse.success && squadResponse.data) {
      
      // 각 선수/코치 데이터 처리
      squadResponse.data.forEach(member => {
        if (member.position === 'Coach') {
          // 코치는 그대로 사용
          processedSquad.push(member);
        } else {
          // 선수인 경우 통계 정보 추가
          const playerStat = playerStats?.[member.id];
          const stats = playerStat || {
            appearances: 0,
            goals: 0, 
            assists: 0,
            yellowCards: 0,
            redCards: 0
          };
          
          processedSquad.push({
            ...member,
            stats: stats
          });
        }
      });
    }
    
    return (
      <Squad squad={processedSquad} />
    );
  } catch (error) {
    console.error('스쿼드 탭 오류:', error);
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        스쿼드 데이터를 불러오는데 실패했습니다.
      </div>
    );
  }
} 