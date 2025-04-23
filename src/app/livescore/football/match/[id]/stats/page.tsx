import { fetchMatchData } from '@/app/actions/livescore/matches/match';
import { fetchMatchStats } from '@/app/actions/livescore/matches/stats';
import StatsContent from '@/app/livescore/football/match/components/tabs/Stats';

export const dynamic = 'force-dynamic';
export const fetchCache = 'default-no-store';
export const revalidate = 0;

export default async function StatsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: matchId } = await params;
  
  // 팀 정보 가져오기
  const matchDataResponse = await fetchMatchData(matchId);
  if (!matchDataResponse.success || !matchDataResponse.data) {
    throw new Error(matchDataResponse.message || '경기 데이터를 찾을 수 없습니다');
  }
  const data = matchDataResponse.data;
  
  // 통계 데이터 가져오기
  const statsData = await fetchMatchStats(matchId);
  
  return (
    <div className="bg-white rounded-lg mt-4">
      <StatsContent 
        matchData={{
          stats: statsData.response || [],
          homeTeam: {
            id: data.teams?.home?.id || 0,
            name: data.teams?.home?.name || '',
            logo: data.teams?.home?.logo || ''
          },
          awayTeam: {
            id: data.teams?.away?.id || 0,
            name: data.teams?.away?.name || '',
            logo: data.teams?.away?.logo || ''
          }
        }}
      />
    </div>
  );
} 