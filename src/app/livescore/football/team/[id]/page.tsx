import TabContent from './TabContent';
import TabNavigation from './TabNavigation';
import { fetchTeamFullData } from '@/app/actions/livescore/teams/team';
import { ErrorState } from '@/app/livescore/football/components/CommonComponents';
import { notFound } from 'next/navigation';
import { TeamDataProvider } from '../context/TeamDataContext';
import TeamHeader from '../components/TeamHeader';
import { Suspense } from 'react';

interface TeamPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function TeamPage({ params, searchParams }: TeamPageProps) {
  const { id } = await params;
  const { tab = 'overview' } = await searchParams;
  
  try {
    // 탭에 따라 필요한 데이터만 가져오기 위한 옵션 설정
    const options = {
      fetchMatches: tab === 'overview',
      fetchSquad: tab === 'squad',
      fetchPlayerStats: tab === 'squad',
      fetchStandings: tab === 'overview' || tab === 'standings'
    };

    // 필요한 모든 데이터를 한 번에 가져오기
    const teamFullData = await fetchTeamFullData(id, options);
    
    if (!teamFullData.success || !teamFullData.teamData?.team) {
      notFound();
    }
    
    // 컨텍스트에 제공할 초기 데이터
    const initialData = {
      teamData: teamFullData.teamData,
      matchesData: teamFullData.matches,
      squadData: teamFullData.squad,
      playerStats: teamFullData.playerStats,
      standingsData: teamFullData.standings
    };
    
    return (
      <div className="container mx-auto w-full">
        <TeamDataProvider initialTeamId={id} initialTab={tab} initialData={initialData}>
          <Suspense fallback={
            <div className="mb-4 bg-white rounded-lg border p-4">
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <span className="ml-3 text-gray-600">팀 정보를 불러오는 중...</span>
              </div>
            </div>
          }>
            <TeamHeader />
          </Suspense>
          <TabNavigation teamId={id} activeTab={tab} />
          <TabContent teamId={id} tab={tab} />
        </TeamDataProvider>
      </div>
    );
  } catch (error) {
    console.error('팀 페이지 로딩 오류:', error);
    return <ErrorState message="팀 정보를 불러오는데 실패했습니다. API 서버에 연결할 수 없거나 요청한 데이터가 존재하지 않습니다." />;
  }
} 