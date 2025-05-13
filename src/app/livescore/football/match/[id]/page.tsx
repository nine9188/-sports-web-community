import { MatchHeaderSkeleton } from '@/domains/livescore/components/common/HeadersUI';
import TabNavigation from '@/domains/livescore/components/football/match/TabNavigation';
import TabContent from '@/domains/livescore/components/football/match/TabContent';
import MatchHeader from '@/domains/livescore/components/football/match/MatchHeader';
import { fetchCachedMatchFullData, MatchFullDataResponse } from '@/domains/livescore/actions/match/matchData';
import { MatchDataProvider } from '@/domains/livescore/components/football/match/context/MatchDataContext';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';

// 캐시 항목 인터페이스
interface CacheEntry {
  data: MatchFullDataResponse;
  timestamp: number;
}

// 글로벌 데이터 캐시 (서버 재시작될 때까지 유지)
const dataCache = new Map<string, CacheEntry>();

// 캐시 유효 시간 (5분)
const CACHE_TTL = 5 * 60 * 1000;

// 캐시 유효성 체크 함수
const isCacheValid = (cacheEntry: CacheEntry | undefined): boolean => {
  if (!cacheEntry) return false;
  return Date.now() - cacheEntry.timestamp < CACHE_TTL;
};

// 페이지 캐시 설정
export const revalidate = 300; // 5분마다 재검증
export const dynamic = 'force-dynamic';

// 페이지 컴포넌트 - 서버 컴포넌트
export default async function MatchPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ tab?: string }>
}) {
  try {
    // URL에서 ID 및 탭 가져오기 - params와 searchParams를 await으로 처리
    const { id: matchId } = await params;
    const { tab = 'events' } = await searchParams;
    
    const initialTab = tab;
    
    // 캐시 키 생성
    const cacheKey = `match-${matchId}-${initialTab}`;
    
    // 캐시된 데이터 확인
    let matchData;
    const cacheEntry = dataCache.get(cacheKey);
    
    if (cacheEntry && isCacheValid(cacheEntry)) {
      // 유효한 캐시 데이터가 있으면 사용
      matchData = cacheEntry.data;
    } else {
      // 캐시된 데이터가 없거나 만료된 경우에만 서버 액션 호출
      
      // 각 탭에 필요한 데이터만 선별적으로 로드
      const options = {
        fetchEvents: initialTab === 'events' || initialTab === 'lineups',
        fetchLineups: initialTab === 'lineups',
        fetchStats: initialTab === 'stats',
        fetchStandings: initialTab === 'standings',
        fetchPlayersStats: initialTab === 'lineups' // 라인업 탭일 때 선수 통계 데이터도 함께 가져오기
      };
      
      // 초기 데이터 로드 - 서버에서 필요한 데이터만 프리로드
      matchData = await fetchCachedMatchFullData(matchId, options);
      
      // 결과를 타임스탬프와 함께 캐시에 저장
      dataCache.set(cacheKey, {
        data: matchData,
        timestamp: Date.now()
      });
    }
    
    // 기본 데이터 로드 실패 시 오류 페이지로 이동
    if (!matchData.success) {
      return notFound();
    }
    
    return (
      <div className="container">
        <MatchDataProvider
          initialMatchId={matchId}
          initialTab={initialTab}
          initialData={matchData}
        >
          {/* 헤더를 탭 외부에 배치하여 탭 전환 시 다시 로드되지 않도록 함 */}
          <Suspense fallback={<MatchHeaderSkeleton />}>
            <MatchHeader />
          </Suspense>
          
          <TabNavigation activeTab={initialTab} />
          
          {/* 탭 콘텐츠는 Suspense로 감싸서 독립적으로 로딩 */}
          <Suspense fallback={
            <div className="mb-4 bg-white rounded-lg border p-4">
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <span className="ml-3 text-gray-600">데이터를 불러오는 중...</span>
              </div>
            </div>
          }>
            <TabContent />
          </Suspense>
        </MatchDataProvider>
      </div>
    );
  } catch (error) {
    console.error('매치 페이지 로딩 오류:', error);
    return (
      <div className="container py-8">
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-red-500">경기 정보를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }
}