import { fetchMatchData } from '@/app/actions/livescore/matches/match';
import { fetchMatchStandings } from '@/app/actions/livescore/matches/standings';
import StandingsContent from '@/app/livescore/football/match/components/tabs/Standings';

export const dynamic = 'force-dynamic';
export const fetchCache = 'default-no-store';
export const revalidate = 0;

export default async function StandingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: matchId } = await params;
  
  // 팀 정보 가져오기
  const matchDataResponse = await fetchMatchData(matchId);
  if (!matchDataResponse.success || !matchDataResponse.data) {
    throw new Error(matchDataResponse.message || '경기 데이터를 찾을 수 없습니다');
  }
  const data = matchDataResponse.data;
  
  // 순위표 데이터 가져오기
  const standingsData = await fetchMatchStandings(matchId);
  
  return (
    <div className="bg-white rounded-lg mt-4">
      <StandingsContent 
        matchData={{
          matchId: matchId,
          homeTeam: {
            id: data.teams?.home?.id || 0,
            name: data.teams?.home?.name || '',
            logo: data.teams?.home?.logo || ''
          },
          awayTeam: {
            id: data.teams?.away?.id || 0,
            name: data.teams?.away?.name || '',
            logo: data.teams?.away?.logo || ''
          },
          standings: standingsData
        }}
      />
    </div>
  );
} 