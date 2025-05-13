import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import PlayerHeader from '@/domains/livescore/components/football/player/PlayerHeader';
import PlayerTabNavigation from '@/domains/livescore/components/football/player/TabNavigation';
import TabContent from '@/domains/livescore/components/football/player/TabContent';
import { fetchPlayerFullData, PlayerFullDataResponse } from '@/domains/livescore/actions/player/data';
import { PlayerDataProvider } from '@/domains/livescore/components/football/player/context/PlayerDataContext';
import { LoadingState } from '@/domains/livescore/components/common/CommonComponents';

// 플레이스홀더 로딩 컴포넌트
function ContentLoading() {
  return <LoadingState message="데이터를 불러오는 중..." />;
}

// 캐시 항목 인터페이스
interface CacheEntry {
  data: PlayerFullDataResponse;
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

export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5분마다 재검증

export default async function PlayerPage({ 
  params,
  searchParams 
}: { 
  params: { id: string };
  searchParams: { tab?: string };
}) {
  try {
    // URL에서 ID 및 탭 가져오기 - params와 searchParams를 await으로 처리
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;
    
    const playerId = resolvedParams.id;
    const tab = resolvedSearchParams.tab || 'stats';
    
    // 캐시 키 생성
    const cacheKey = `${playerId}-${tab}`;
    
    // 캐시된 데이터 확인
    let initialData: PlayerFullDataResponse;
    const cacheEntry = dataCache.get(cacheKey);
    
    if (cacheEntry && isCacheValid(cacheEntry)) {
      // 유효한 캐시 데이터가 있으면 사용
      initialData = cacheEntry.data;
    } else {
      // 캐시된 데이터가 없거나 만료된 경우에만 서버 액션 호출
      
      // 모든 데이터를 미리 로드 (성능 최적화를 위해 필요한 데이터만 가져오기)
      const loadOptions = {
        fetchSeasons: true, // 시즌 정보는 항상 필요
        fetchStats: tab === 'stats', // 기본 통계 데이터
        fetchFixtures: tab === 'fixtures',
        fetchTrophies: tab === 'trophies',
        fetchTransfers: tab === 'transfers',
        fetchInjuries: tab === 'injuries',
        fetchRankings: tab === 'rankings'
      };
      
      // 통합 서버 액션 호출로 한 번에 모든 필요한 데이터 로드
      initialData = await fetchPlayerFullData(playerId, loadOptions);
      
      // 결과를 타임스탬프와 함께 캐시에 저장
      dataCache.set(cacheKey, {
        data: initialData,
        timestamp: Date.now()
      });
    }
    
    // 기본 데이터 로드 실패 시 404 페이지로 이동
    if (!initialData.success || !initialData.playerData) {
      return notFound();
    }
    
    return (
      <PlayerDataProvider 
        initialPlayerId={playerId}
        initialTab={tab}
        initialData={initialData}
      >
        <div className="container">
          {/* PlayerHeader는 초기 데이터 이미 로드했으므로 바로 렌더링 */}
          <PlayerHeader />
          
          {/* 탭 네비게이션 */}
          <PlayerTabNavigation activeTab={tab} />
          
          {/* 탭 컨텐츠 */}
          <Suspense fallback={<ContentLoading />}>
            <TabContent />
          </Suspense>
        </div>
      </PlayerDataProvider>
    );
  } catch (error) {
    console.error('플레이어 페이지 로딩 오류:', error);
    return notFound();
  }
} 