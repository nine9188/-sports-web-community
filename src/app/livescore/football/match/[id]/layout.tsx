import MatchHeader from '@/app/livescore/football/match/components/MatchHeader';
import styles from '@/app/livescore/football/match/styles/mobile.module.css';
import TabNavigation from './TabNavigation';
import { fetchMatchData } from '@/app/actions/livescore/matches/match';
import { Suspense } from 'react';

// 동적 렌더링 강제 설정
export const dynamic = 'force-dynamic';
export const fetchCache = 'default-no-store';
export const revalidate = 0;

// 간단한 로딩 컴포넌트
function Loading() {
  return (
    <div className="p-4 text-center">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
      <p className="mt-2 text-gray-600">데이터를 불러오는 중...</p>
    </div>
  );
}

// 헤더 컴포넌트 - 별도로 분리하여 비동기 스트리밍 처리
async function MatchHeaderSection({ matchId }: { matchId: string }) {
  // 기본 경기 데이터만 가져오기 (서버 액션 사용)
  const matchDataResponse = await fetchMatchData(matchId);
  
  if (!matchDataResponse.success || !matchDataResponse.data) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="text-center">
          <p className="text-red-500 font-medium">경기 데이터를 불러올 수 없습니다</p>
        </div>
      </div>
    );
  }
  
  const data = matchDataResponse.data;

  return (
    <MatchHeader 
      matchId={matchId}
      league={data.league}
      status={data.fixture?.status}
      fixture={{
        date: new Date(data.fixture.date).toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        time: new Date(data.fixture.date).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        timestamp: data.fixture.timestamp
      }}
      teams={{
        home: {
          id: data.teams?.home?.id || 0,
          name: data.teams?.home?.name || '',
          logo: data.teams?.home?.logo || '',
          formation: '',
          name_ko: data.teams?.home?.name_ko || data.teams?.home?.name || '',
          name_en: data.teams?.home?.name_en || data.teams?.home?.name || ''
        },
        away: {
          id: data.teams?.away?.id || 0,
          name: data.teams?.away?.name || '',
          logo: data.teams?.away?.logo || '',
          formation: '',
          name_ko: data.teams?.away?.name_ko || data.teams?.away?.name || '',
          name_en: data.teams?.away?.name_en || data.teams?.away?.name || ''
        }
      }}
      score={{
        halftime: {
          home: String(data.score?.halftime?.home || 0),
          away: String(data.score?.halftime?.away || 0)
        },
        fulltime: {
          home: String(data.score?.fulltime?.home || 0),
          away: String(data.score?.fulltime?.away || 0)
        }
      }}
      goals={{
        home: String(data.goals?.home || 0),
        away: String(data.goals?.away || 0)
      }}
      events={[]} // 이벤트는 각 탭에서 로드
    />
  );
}

export default async function MatchLayout({ 
  children, 
  params 
}: { 
  children: React.ReactNode; 
  params: Promise<{ id: string }>;
}) {
  try {
    const { id: matchId } = await params;

    return (
      <div className={styles.mobileContainer}>
        {/* MatchHeader 컴포넌트를 Suspense로 감싸서 병렬 스트리밍 처리 */}
        <Suspense fallback={
          <div className="bg-white p-4 rounded-lg shadow-sm animate-pulse">
            <div className="h-20 bg-gray-200 rounded mb-4"></div>
            <div className="flex justify-between items-center">
              <div className="w-1/3 h-16 bg-gray-200 rounded"></div>
              <div className="w-24 h-10 bg-gray-200 rounded"></div>
              <div className="w-1/3 h-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        }>
          <MatchHeaderSection matchId={matchId} />
        </Suspense>
        
        {/* 새로운 탭 네비게이션 */}
        <TabNavigation matchId={matchId} />
        
        {/* 패러렐 라우트 컨텐츠를 Suspense로 감싸 로딩 상태 표시 */}
        <Suspense fallback={<Loading />}>
          {children}
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error('Match layout error:', error);
    return (
      <div>
        <div className="bg-white rounded-lg shadow-sm text-center p-6">
          <h2 className="text-xl font-semibold text-red-600">오류 발생</h2>
          <p className="text-gray-700">경기 정보를 불러오는데 실패했습니다.</p>
          <p className="text-gray-600">API 서버에 연결할 수 없거나 요청한 데이터가 존재하지 않습니다.</p>
          <div className="flex justify-center gap-2 mt-4">
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              다시 시도
            </button>
            <a 
              href="/livescore/football"
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
            >
              라이브스코어 홈으로
            </a>
          </div>
        </div>
      </div>
    );
  }
} 