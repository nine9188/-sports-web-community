'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import classNames from 'classnames';
import dynamic from 'next/dynamic';
import { PlayerData, StatisticsData, FixtureData, TrophyData, TransferData, InjuryData, RankingsData } from '../types/player';

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
  ssr: true // 첫 번째 탭은 SSR로 렌더링
});

// 나머지 탭은 필요시 로드 (CSR)
const PlayerFixtures = dynamic(() => import('./player-tabs/PlayerFixtures'), {
  ssr: false
});
const PlayerTrophies = dynamic(() => import('./player-tabs/PlayerTrophies'), {
  ssr: false
});
const PlayerTransfers = dynamic(() => import('./player-tabs/PlayerTransfers'), {
  ssr: false
});
const PlayerInjuries = dynamic(() => import('./player-tabs/PlayerInjuries'), {
  ssr: false
});
const PlayerRankings = dynamic(() => import('./player-tabs/PlayerRankings'), {
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
  
  // 각 탭의 데이터를 캐시하기 위한 상태
  const [fixtures, setFixtures] = useState<{ data: FixtureData[] }>({ data: [] });
  const [trophies, setTrophies] = useState<TrophyData[]>([]);
  const [transfers, setTransfers] = useState<TransferData[]>([]);
  const [injuries, setInjuries] = useState<InjuryData[]>([]);
  const [rankings, setRankings] = useState<RankingsData | undefined>(undefined);
  
  // 이미 로드된 탭을 추적하는 ref
  const loadedTabs = useRef<Set<string>>(new Set(['stats']));
  
  // 탭 데이터를 가져오는 함수
  const loadTabData = useCallback(async (tabId: string) => {
    // playerId가 없는 경우 처리 생략
    if (!playerId) return;
    
    // 이미 로드된 탭이면 건너뜀
    if (loadedTabs.current.has(tabId)) {
      return;
    }
    
    // 현재 날짜 기준으로 시즌 계산 (7월 이후면 새 시즌으로 간주)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentSeason = currentMonth >= 6 ? currentYear : currentYear - 1;
    
    // 사용 가능한 시즌 중 현재 시즌과 가장 가까운 시즌 찾기
    const sortedSeasons = [...(seasons || [])].sort((a, b) => b - a);
    const calculatedSeason = sortedSeasons.length > 0 
      ? sortedSeasons.reduce((closest, season) => {
          const currentDiff = Math.abs(currentSeason - season);
          const closestDiff = Math.abs(currentSeason - closest);
          return currentDiff < closestDiff ? season : closest;
        }, sortedSeasons[0])
      : defaultSeason;
      
    // 계산된 시즌 사용
    const seasonToUse = calculatedSeason;
    
    switch (tabId) {
      case 'fixtures':
        try {
          console.log(`Fetching fixtures for player: ${playerId}, season: ${seasonToUse}`);
          const response = await fetch(`${baseUrl}/api/livescore/football/players/${playerId}/fixtures?season=${seasonToUse}`);
          if (response.ok) {
            const data = await response.json();
            console.log(`Fixtures data received: ${data?.data?.length || 0} items`);
            if (data && data.data && data.data.length > 0) {
              setFixtures(data);
              loadedTabs.current.add(tabId);
            } else {
              setFixtures({ data: [] });
            }
          } else {
            setFixtures({ data: [] });
          }
        } catch (error) {
          console.error('Error fetching fixtures data:', error);
          setFixtures({ data: [] });
        }
        break;
      case 'trophies':
        try {
          const response = await fetch(`${baseUrl}/api/livescore/football/players/${playerId}/trophies`);
          if (response.ok) {
            const data = await response.json();
            setTrophies(data || []);
            loadedTabs.current.add(tabId);
          } else {
            setTrophies([]);
          }
        } catch (error) {
          console.error('Error fetching trophies data:', error);
          setTrophies([]);
        }
        break;
      case 'transfers':
        try {
          const response = await fetch(`${baseUrl}/api/livescore/football/players/${playerId}/transfers`);
          if (response.ok) {
            const data = await response.json();
            setTransfers(data || []);
            loadedTabs.current.add(tabId);
          } else {
            setTransfers([]);
          }
        } catch (error) {
          console.error('Error fetching transfers data:', error);
          setTransfers([]);
        }
        break;
      case 'injuries':
        try {
          const response = await fetch(`${baseUrl}/api/livescore/football/players/${playerId}/injuries`);
          if (response.ok) {
            const data = await response.json();
            setInjuries(data || []);
            loadedTabs.current.add(tabId);
          } else {
            setInjuries([]);
          }
        } catch (error) {
          console.error('Error fetching injuries data:', error);
          setInjuries([]);
        }
        break;
      case 'rankings':
        if (currentLeagueId) {
          try {
            const response = await fetch(`${baseUrl}/api/livescore/football/players/${playerId}/rankings?league=${currentLeagueId}`);
            if (response.ok) {
              const data = await response.json();
              setRankings(data || {});
              loadedTabs.current.add(tabId);
            } else {
              setRankings({});
            }
          } catch (error) {
            console.error('Error fetching rankings data:', error);
            setRankings({});
          }
        }
        break;
    }
  }, [playerId, baseUrl, currentLeagueId, defaultSeason, seasons]);
  
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
  // 현재 날짜 기준으로 시즌 계산 (7월 이후면 새 시즌으로 간주)
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentSeason = currentMonth >= 6 ? currentYear : currentYear - 1;
  
  // 사용 가능한 시즌 중 현재 시즌과 가장 가까운 시즌 찾기
  const sortedSeasons = [...(seasons || [])].sort((a, b) => b - a);
  const calculatedSeason = sortedSeasons.length > 0 
    ? sortedSeasons.reduce((closest, season) => {
        const currentDiff = Math.abs(currentSeason - season);
        const closestDiff = Math.abs(currentSeason - closest);
        return currentDiff < closestDiff ? season : closest;
      }, sortedSeasons[0])
    : defaultSeason;

  const statsProps = {
    statistics: statsData, 
    playerId, 
    preloadedSeasons: seasons ? [...seasons].sort((a, b) => b - a) : [],  // 최신 시즌이 먼저 오도록 내림차순 정렬
    preloadedStats: statsData
  };

  const fixturesProps = {
    playerId,
    seasons: seasons ? [...seasons].sort((a, b) => b - a) : [],  // 최신 시즌이 먼저 오도록 내림차순 정렬
    fixturesData: fixtures,
    initialSeason: calculatedSeason,
    baseUrl
  };

  const trophiesProps = {
    playerId,
    baseUrl,
    trophiesData: trophies
  };

  const transfersProps = {
    playerId,
    baseUrl,
    transfersData: transfers
  };

  const injuriesProps = {
    playerId,
    baseUrl,
    injuriesData: injuries
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
        {activeTab === 'stats' && (
          <div className="min-h-[300px]">
            <PlayerStats {...statsProps} />
          </div>
        )}

        {activeTab === 'fixtures' && (
          <div className="min-h-[300px]">
            <PlayerFixtures {...fixturesProps} />
          </div>
        )}

        {activeTab === 'trophies' && (
          <div className="min-h-[300px]">
            <PlayerTrophies {...trophiesProps} />
          </div>
        )}

        {activeTab === 'transfers' && (
          <div className="min-h-[300px]">
            <PlayerTransfers {...transfersProps} />
          </div>
        )}

        {activeTab === 'injuries' && (
          <div className="min-h-[300px]">
            <PlayerInjuries {...injuriesProps} />
          </div>
        )}

        {activeTab === 'rankings' && currentLeagueId && (
          <div className="min-h-[300px]">
            <PlayerRankings {...rankingsProps} />
          </div>
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