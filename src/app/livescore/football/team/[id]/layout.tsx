import { Suspense } from 'react';
import { fetchCachedTeamData } from '@/app/actions/livescore/teams/team';
import TeamHeader from '../components/TeamHeader';
import Link from 'next/link';
import TabNavigation from './TabNavigation';
import TabContentWrapper from './TabContentWrapper';

// 동적 렌더링 강제 설정 추가
export const dynamic = 'force-dynamic';

interface TeamLayoutProps {
  children: React.ReactNode;
  overview: React.ReactNode;
  squad: React.ReactNode;
  standings: React.ReactNode;
  stats: React.ReactNode;
  params: { id: string, tab?: string };
}

export default async function TeamLayout({
  overview,
  squad,
  standings,
  stats,
  params
}: TeamLayoutProps) {
  try {
    const { id } = await params;
    
    // 팀 기본 정보만 가져오기
    const teamResponse = await fetchCachedTeamData(id);
    
    // 팀 정보가 없으면 에러 표시
    if (!teamResponse.success || !teamResponse.team) {
      throw new Error('팀 정보를 불러오는데 실패했습니다.');
    }
    
    return (
      <div className="container">
        <TeamHeader 
          team={{
            team: teamResponse.team.team,
            venue: teamResponse.team.venue || null
          }} 
          stats={teamResponse.stats || {}} 
        />
        
        <div className="mt-0">
          <Suspense fallback={
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700"></div>
            </div>
          }>
            <TabNavigation teamId={id} />
            <TabContentWrapper
              overview={overview}
              squad={squad}
              standings={standings}
              stats={stats}
            />
          </Suspense>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Team page error:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">오류 발생</h2>
          <p className="text-gray-700 mb-4">팀 정보를 불러오는데 실패했습니다.</p>
          <p className="text-gray-600 mb-6">
            API 서버에 연결할 수 없거나 요청한 데이터가 존재하지 않습니다.
          </p>
          <div className="flex justify-center gap-4">
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              다시 시도
            </button>
            <Link 
              href="/livescore/football"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
            >
              라이브스코어 홈으로
            </Link>
          </div>
        </div>
      </div>
    );
  }
} 