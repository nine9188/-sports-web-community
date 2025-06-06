import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { fetchLeagueDetails, fetchLeagueTeams } from '@/domains/livescore/actions/footballApi';
import { LeagueHeader, LeagueTeamsList } from '@/domains/livescore/components/football/leagues';

interface LeaguePageProps {
  params: Promise<{ id: string }>;
}

export default async function LeaguePage({ params }: LeaguePageProps) {
  const { id } = await params;
  
  try {
    // 리그 상세 정보와 팀 목록을 병렬로 가져오기
    const [leagueDetails, teams] = await Promise.all([
      fetchLeagueDetails(id),
      fetchLeagueTeams(id)
    ]);

    // 리그 정보가 없으면 404 페이지로 이동
    if (!leagueDetails) {
      notFound();
    }

    return (
      <div className="container mx-auto w-full">
        {/* 리그 헤더 */}
        <Suspense fallback={
          <div className="mb-4 bg-white rounded-lg border p-4">
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <span className="ml-3 text-gray-600">리그 정보를 불러오는 중...</span>
            </div>
          </div>
        }>
          <LeagueHeader league={leagueDetails} />
        </Suspense>

        {/* 소속 팀 목록 */}
        <Suspense fallback={<LeagueTeamsList teams={[]} isLoading={true} />}>
          <LeagueTeamsList teams={teams} />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error('리그 페이지 로딩 오류:', error);
    return (
      <div className="container mx-auto w-full">
        <div className="mb-4 bg-white rounded-lg border p-4">
          <div className="text-center py-8">
            <div className="text-red-500 text-lg mb-2">오류 발생</div>
            <div className="text-gray-600">리그 정보를 불러오는데 실패했습니다.</div>
          </div>
        </div>
      </div>
    );
  }
}

// 메타데이터 생성
export async function generateMetadata({ params }: LeaguePageProps) {
  const { id } = await params;
  const leagueDetails = await fetchLeagueDetails(id);

  if (!leagueDetails) {
    return {
      title: '리그를 찾을 수 없습니다',
      description: '요청하신 리그 정보를 찾을 수 없습니다.'
    };
  }

  return {
    title: `${leagueDetails.name} - 라이브스코어`,
    description: `${leagueDetails.name} 리그의 소속 팀 정보와 최신 경기 결과를 확인하세요.`,
    openGraph: {
      title: `${leagueDetails.name} - 라이브스코어`,
      description: `${leagueDetails.name} 리그의 소속 팀 정보와 최신 경기 결과를 확인하세요.`,
      images: leagueDetails.logo ? [{ url: leagueDetails.logo }] : undefined,
    }
  };
} 