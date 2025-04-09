'use client';

import { useState, Suspense } from 'react';
import classNames from 'classnames';
import dynamic from 'next/dynamic';
import { PlayerData } from '../../types/player';

// 탭 컴포넌트 로딩 상태 표시 컴포넌트
const TabLoading = () => (
  <div className="py-10 flex justify-center items-center">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
  </div>
);

// 필요한 인터페이스 정의
interface StatisticsData {
  team: {
    id: number;
    name: string;
    logo: string;
  };
  league: {
    id: number;
    name: string;
    country: string;
    season?: number;
    logo: string;
  };
  games: {
    appearences?: number;
    lineups?: number;
    minutes?: number;
    position?: string;
    rating?: string;
  };
  goals: {
    total?: number;
    conceded?: number;
    assists?: number;
    saves?: number;
    cleansheets?: number;
  };
  shots: {
    total?: number;
    on?: number;
  };
  passes: {
    total?: number;
    key?: number;
    accuracy?: string;
    cross?: number;
  };
  dribbles: {
    attempts?: number;
    success?: number;
  };
  duels: {
    total?: number;
    won?: number;
  };
  tackles: {
    total?: number;
    blocks?: number;
    interceptions?: number;
    clearances?: number;
  };
  fouls: {
    drawn?: number;
    committed?: number;
  };
  cards: {
    yellow?: number;
    red?: number;
  };
  penalty: {
    scored?: number;
    missed?: number;
    saved?: number;
  };
}

interface Tab {
  id: string;
  label: string;
}

interface PlayerTabsClientProps {
  tabs: Tab[];
  player: PlayerData;
  statsData: StatisticsData[];
  seasons: number[];
  playerId: number;
  currentLeagueId?: number;
  defaultSeason: number;
  baseUrl: string;
}

// 동적 임포트로 탭 컴포넌트 로드
const PlayerStats = dynamic(() => import('./player-tabs/PlayerStats'), {
  loading: () => <TabLoading />
});
const PlayerFixtures = dynamic(() => import('./player-tabs/PlayerFixtures'), {
  loading: () => <TabLoading />
});
const PlayerTrophies = dynamic(() => import('./player-tabs/PlayerTrophies'), {
  loading: () => <TabLoading />
});
const PlayerTransfers = dynamic(() => import('./player-tabs/PlayerTransfers'), {
  loading: () => <TabLoading />
});
const PlayerInjuries = dynamic(() => import('./player-tabs/PlayerInjuries'), {
  loading: () => <TabLoading />
});
const PlayerRankings = dynamic(() => import('./player-tabs/PlayerRankings'), {
  loading: () => <TabLoading />
});

export default function PlayerTabsClient({ 
  tabs,
  player, 
  statsData,
  seasons,
  playerId,
  currentLeagueId,
  defaultSeason,
  baseUrl
}: PlayerTabsClientProps) {
  const [activeTab, setActiveTab] = useState('stats');
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(['stats']));
  
  // 탭 클릭 시 해당 탭을 로드된 탭 목록에 추가
  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setLoadedTabs(prev => new Set([...prev, tabId]));
  };
  
  // 탭에 따른 컨텐츠 렌더링
  const renderContent = (tabId: string) => {
    if (!playerId || !player?.info) {
      return <div>선수 정보를 불러올 수 없습니다.</div>;
    }

    // 해당 탭이 로드되지 않았거나 활성화되지 않은 경우 렌더링하지 않음
    if (!loadedTabs.has(tabId) || activeTab !== tabId) {
      return null;
    }

    // 탭 컨텐츠 렌더링
    switch (tabId) {
      case 'stats': {
        return (
          <Suspense fallback={<TabLoading />}>
            <PlayerStats 
              statistics={statsData} 
              playerId={playerId} 
              preloadedSeasons={seasons}
              preloadedStats={statsData}
            />
          </Suspense>
        );
      }
      case 'fixtures':
        return (
          <Suspense fallback={<TabLoading />}>
            <PlayerFixtures 
              playerId={playerId}
              seasons={seasons}
              fixturesData={{ data: [] }}
              initialSeason={defaultSeason}
              baseUrl={baseUrl}
            />
          </Suspense>
        );
      case 'trophies':
        return (
          <Suspense fallback={<TabLoading />}>
            <PlayerTrophies 
              playerId={playerId}
              baseUrl={baseUrl}
            />
          </Suspense>
        );
      case 'transfers':
        return (
          <Suspense fallback={<TabLoading />}>
            <PlayerTransfers 
              playerId={playerId}
              baseUrl={baseUrl}
            />
          </Suspense>
        );
      case 'injuries':
        return (
          <Suspense fallback={<TabLoading />}>
            <PlayerInjuries 
              playerId={playerId}
              baseUrl={baseUrl}
            />
          </Suspense>
        );
      case 'rankings':
        if (!currentLeagueId) {
          return <div>리그 정보를 찾을 수 없습니다.</div>;
        }
        return (
          <Suspense fallback={<TabLoading />}>
            <PlayerRankings 
              playerId={playerId}
              currentLeague={currentLeagueId}
              baseUrl={baseUrl}
            />
          </Suspense>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={classNames(
                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm',
                {
                  'border-blue-500 text-blue-600': activeTab === tab.id,
                  'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300':
                    activeTab !== tab.id,
                }
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="mt-6">
        {tabs.map(tab => (
          <div key={tab.id}>
            {renderContent(tab.id)}
          </div>
        ))}
      </div>
    </div>
  );
} 