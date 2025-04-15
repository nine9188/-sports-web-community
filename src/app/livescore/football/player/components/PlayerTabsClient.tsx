'use client';

import { useState, useRef, Suspense, useEffect, useCallback } from 'react';
import classNames from 'classnames';
import dynamic from 'next/dynamic';
import { PlayerData, StatisticsData, FixtureData, TrophyData, TransferData, InjuryData, RankingsData } from '../types/player';

// 탭 컴포넌트 로딩 상태 표시 컴포넌트
const TabLoading = () => (
  <div className="py-10 flex justify-center items-center">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
  </div>
);

// 필요한 인터페이스 정의
interface Tab {
  id: string;
  label: string;
}

interface PlayerTabsClientProps {
  playerId: number;
  player: PlayerData;
  currentLeagueId?: number;
  baseUrl: string;
  tabs: Tab[];
  seasons: number[];
  statsData: StatisticsData[];
  defaultSeason: number;
}

// 동적 임포트로 탭 컴포넌트 로드 (첫 번째 탭만 SSR 활성화)
const PlayerStats = dynamic(() => import('./player-tabs/PlayerStats'), {
  loading: () => <TabLoading />,
  ssr: true // 첫 번째 탭은 SSR로 렌더링
});

// 나머지 탭은 필요시 로드 (CSR)
const PlayerFixtures = dynamic(() => import('./player-tabs/PlayerFixtures'), {
  loading: () => <TabLoading />,
  ssr: false
});
const PlayerTrophies = dynamic(() => import('./player-tabs/PlayerTrophies'), {
  loading: () => <TabLoading />,
  ssr: false
});
const PlayerTransfers = dynamic(() => import('./player-tabs/PlayerTransfers'), {
  loading: () => <TabLoading />,
  ssr: false
});
const PlayerInjuries = dynamic(() => import('./player-tabs/PlayerInjuries'), {
  loading: () => <TabLoading />,
  ssr: false
});
const PlayerRankings = dynamic(() => import('./player-tabs/PlayerRankings'), {
  loading: () => <TabLoading />,
  ssr: false
});

export default function PlayerTabsClient({
  playerId,
  player,
  currentLeagueId,
  baseUrl,
  tabs,
  seasons,
  statsData,
  defaultSeason
}: PlayerTabsClientProps) {
  // 상태 관리 (항상 최상위에서 Hook 호출)
  const [activeTab, setActiveTab] = useState<string>('stats');
  const [isLoading, setIsLoading] = useState(false);
  
  // 각 탭의 데이터를 캐시하기 위한 상태
  const [fixtures, setFixtures] = useState<{ data: FixtureData[] } | undefined>(undefined);
  const [trophies, setTrophies] = useState<TrophyData[] | undefined>(undefined);
  const [transfers, setTransfers] = useState<TransferData[] | undefined>(undefined);
  const [injuries, setInjuries] = useState<InjuryData[] | undefined>(undefined);
  const [rankings, setRankings] = useState<RankingsData | undefined>(undefined);
  
  // 이미 로드된 탭을 추적하는 ref
  const loadedTabs = useRef<Set<string>>(new Set(['stats']));
  
  // 탭 데이터를 가져오는 함수
  const loadTabData = useCallback(async (tabId: string) => {
    // playerId가 없는 경우의 체크는 함수 내부에서 수행합니다
    if (!playerId) return;
    
    // 이미 로드된 탭이면 건너뜀
    if (loadedTabs.current.has(tabId)) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      switch (tabId) {
        case 'fixtures':
          if (!fixtures) {
            const response = await fetch(`${baseUrl}/api/livescore/football/players/${playerId}/fixtures?season=${defaultSeason}&per_page=30`);
            if (response.ok) {
              const data = await response.json();
              setFixtures(data);
            }
          }
          break;
        case 'trophies':
          if (!trophies) {
            const response = await fetch(`${baseUrl}/api/livescore/football/players/${playerId}/trophies`);
            if (response.ok) {
              const data = await response.json();
              setTrophies(data);
            }
          }
          break;
        case 'transfers':
          if (!transfers) {
            const response = await fetch(`${baseUrl}/api/livescore/football/players/${playerId}/transfers`);
            if (response.ok) {
              const data = await response.json();
              setTransfers(data);
            }
          }
          break;
        case 'injuries':
          if (!injuries) {
            const response = await fetch(`${baseUrl}/api/livescore/football/players/${playerId}/injuries`);
            if (response.ok) {
              const data = await response.json();
              setInjuries(data);
            }
          }
          break;
        case 'rankings':
          if (!rankings && currentLeagueId) {
            const response = await fetch(`${baseUrl}/api/livescore/football/players/${playerId}/rankings?league=${currentLeagueId}`);
            if (response.ok) {
              const data = await response.json();
              setRankings(data);
            }
          }
          break;
      }
      // 로드 완료 후 탭을 로드된 탭 목록에 추가
      loadedTabs.current.add(tabId);
    } catch (error) {
      console.error(`Error loading ${tabId} data:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [playerId, baseUrl, fixtures, trophies, transfers, injuries, rankings, currentLeagueId, defaultSeason]);
  
  // 컴포넌트 마운트 시 로컬 스토리지에서 활성 탭 복원
  useEffect(() => {
    // Hook 호출을 조건부로 하지 않고, 내부 로직에서 처리
    const storedActiveTab = localStorage.getItem(`player_${playerId}_active_tab`);
    
    if (playerId && storedActiveTab && tabs.some(tab => tab.id === storedActiveTab)) {
      setActiveTab(storedActiveTab);
      loadTabData(storedActiveTab);
    } else {
      // 기본값 설정
      setActiveTab('stats');
      if (playerId) {
        loadTabData('stats');
      }
    }
  }, [playerId, loadTabData, tabs]);
  
  // 탭 클릭 시 핸들러
  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    
    if (playerId) {
      localStorage.setItem(`player_${playerId}_active_tab`, tabId);
      // 아직 로드되지 않은 탭이면 데이터 로드
      loadTabData(tabId);
    }
  };

  // 플레이어 정보가 없는 경우 메시지 표시
  if (!playerId || !player) {
    return (
      <div className="w-full p-6 text-center">
        <div className="py-10 text-gray-600">
          선수 정보를 불러올 수 없습니다.
        </div>
      </div>
    );
  }

  // 각 탭별 props 준비
  const statsProps = {
    statistics: statsData, 
    playerId, 
    preloadedSeasons: seasons ? [...seasons].sort((a, b) => b - a) : [],  // 최신 시즌이 먼저 오도록 내림차순 정렬
    preloadedStats: statsData
  };

  const fixturesProps = {
    playerId,
    seasons: seasons ? [...seasons].sort((a, b) => b - a) : [],  // 최신 시즌이 먼저 오도록 내림차순 정렬
    fixturesData: fixtures || { data: [] },
    initialSeason: defaultSeason,
    baseUrl
  };

  const trophiesProps = {
    playerId,
    baseUrl,
    trophiesData: trophies || []
  };

  const transfersProps = {
    playerId,
    baseUrl,
    transfersData: transfers || []
  };

  const injuriesProps = {
    playerId,
    baseUrl,
    injuriesData: injuries || []
  };

  const rankingsProps = {
    playerId,
    currentLeague: currentLeagueId || 0,
    baseUrl,
    rankingsData: rankings
  };

  return (
    <div className="w-full">
      {/* PlayerHeader 컴포넌트를 제거하고 필요한 경우 상위 컴포넌트에서 렌더링하도록 변경 */}
      
      {/* 탭 네비게이션 */}
      <div className="mb-4 bg-white rounded-lg border overflow-hidden">
        <div 
          className="flex overflow-x-auto" 
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={classNames(
                'px-3 py-3 text-sm font-medium flex-1 min-w-[100px] whitespace-nowrap',
                {
                  'text-blue-600 border-b-3 border-blue-600 font-semibold': activeTab === tab.id,
                  'text-gray-500 hover:text-gray-700': activeTab !== tab.id,
                }
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10">
            <TabLoading />
          </div>
        )}
        
        {activeTab === 'stats' && (
          <Suspense fallback={<TabLoading />}>
            <PlayerStats {...statsProps} />
          </Suspense>
        )}

        {activeTab === 'fixtures' && (
          <Suspense fallback={<TabLoading />}>
            <PlayerFixtures {...fixturesProps} />
          </Suspense>
        )}

        {activeTab === 'trophies' && (
          <Suspense fallback={<TabLoading />}>
            <PlayerTrophies {...trophiesProps} />
          </Suspense>
        )}

        {activeTab === 'transfers' && (
          <Suspense fallback={<TabLoading />}>
            <PlayerTransfers {...transfersProps} />
          </Suspense>
        )}

        {activeTab === 'injuries' && (
          <Suspense fallback={<TabLoading />}>
            <PlayerInjuries {...injuriesProps} />
          </Suspense>
        )}

        {activeTab === 'rankings' && currentLeagueId && (
          <Suspense fallback={<TabLoading />}>
            <PlayerRankings {...rankingsProps} />
          </Suspense>
        )}

        {activeTab === 'rankings' && !currentLeagueId && (
          <div className="py-8 text-center text-gray-600">
            리그 정보를 찾을 수 없습니다. 현재 선수가 활동 중인 리그 정보가 필요합니다.
          </div>
        )}
      </div>
    </div>
  );
} 