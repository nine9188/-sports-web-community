import { fetchMatchData } from '@/app/actions/livescore/matches/match';
import { fetchMatchStandings } from '@/app/actions/livescore/matches/standings';
import StandingsContent from '@/app/livescore/football/match/components/tabs/Standings';
import { cache } from 'react';

// 캐싱 전략 설정
export const dynamic = 'force-dynamic';
export const fetchCache = 'default-cache';
export const revalidate = 300; // 5분마다 재검증 (순위는 자주 변경되지 않음)

// 캐싱된 데이터 로딩 함수
const getMatchData = cache(async (matchId: string) => {
  try {
    return await fetchMatchData(matchId);
  } catch (error) {
    console.error('경기 데이터 로딩 실패:', error);
    return { success: false, data: null, message: '로딩 실패' };
  }
});

const getStandingsData = cache(async (matchId: string) => {
  try {
    return await fetchMatchStandings(matchId);
  } catch (error) {
    console.error('순위 데이터 로딩 실패:', error);
    return null;
  }
});

export default async function StandingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: matchId } = await params;

  // 경기 데이터 로드
  const matchDataResponse = await getMatchData(matchId);
  
  if (!matchDataResponse.success || !matchDataResponse.data) {
    throw new Error(matchDataResponse.message || '경기 데이터를 찾을 수 없습니다');
  }
  
  const data = matchDataResponse.data;
  
  // 순위 데이터 로드 - 캐싱 함수 사용
  const standings = await getStandingsData(matchId);
  
  if (!standings) {
    return (
      <div className="bg-white rounded-lg mt-4 p-4">
        <p className="text-gray-500 text-center py-8">
          순위 정보를 불러올 수 없습니다.
        </p>
      </div>
    );
  }

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
          standings: standings
        }}
      />
    </div>
  );
} 