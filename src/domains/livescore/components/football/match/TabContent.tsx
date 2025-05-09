'use client';

import { Suspense, memo, useMemo, useEffect, useState } from 'react';
import Events from './tabs/Events';
import Lineups from './tabs/lineups/Lineups';
import Stats from './tabs/Stats';
import Standings from './tabs/Standings';
import { LoadingState, EmptyState } from '@/domains/livescore/components/common/CommonComponents';
import { useMatchData, TabType, isLineupsTabData } from './context/MatchDataContext';
import { Team, MatchEvent, TeamLineup, TeamStats, StandingsData } from '@/domains/livescore/types/match';
import { PlayerStats } from '@/domains/livescore/actions/match/playerStats';

// 탭 로딩 컴포넌트
const TabLoading = memo(function TabLoading() {
  return (
    <div className="p-4 bg-white rounded-lg border">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
});

// 데이터 없음 표시 컴포넌트
const NoDataState = memo(function NoDataState({ tabName }: { tabName: string }) {
  const messages = {
    events: {
      title: '이벤트 데이터가 없습니다',
      message: '이 경기의 이벤트 데이터를 찾을 수 없습니다.'
    },
    lineups: {
      title: '라인업 정보가 없습니다',
      message: '이 경기의 라인업 정보를 찾을 수 없습니다.'
    },
    stats: {
      title: '통계 데이터가 없습니다',
      message: '이 경기의 통계 데이터를 찾을 수 없습니다.'
    },
    standings: {
      title: '순위 정보가 없습니다',
      message: '이 리그의 순위 정보를 찾을 수 없습니다.'
    }
  };

  const defaultMessage = {
    title: '데이터가 없습니다',
    message: '표시할 데이터를 찾을 수 없습니다.'
  };

  const { title, message } = messages[tabName as keyof typeof messages] || defaultMessage;
  
  return <EmptyState title={title} message={message} />;
});

// 각 탭 컴포넌트를 개별적으로 메모이제이션하여 최적화
const EventsTab = memo(function EventsTab({ 
  events 
}: { 
  events: MatchEvent[] 
}) {
  return (
    <Events 
      events={events} 
    />
  );
});

const LineupsTab = memo(function LineupsTab({ 
  matchId, 
  lineups,
  homeTeam,
  awayTeam,
  events,
  playersStats
}: { 
  matchId: string, 
  lineups: {
    response: {
      home: TeamLineup;
      away: TeamLineup;
    } | null;
  } | undefined,
  homeTeam: Team | undefined,
  awayTeam: Team | undefined,
  events: MatchEvent[],
  playersStats: Record<number, { response: PlayerStats[] }> | undefined
}) {
  return (
    <Lineups 
      matchData={{
        lineups,
        homeTeam,
        awayTeam,
        events,
        playersStats
      }} 
      matchId={matchId}
    />
  );
});

const StatsTab = memo(function StatsTab({ 
  matchId, 
  stats,
  homeTeam,
  awayTeam
}: { 
  matchId: string, 
  stats: TeamStats[],
  homeTeam: Team | undefined,
  awayTeam: Team | undefined
}) {
  return (
    <Stats 
      matchData={{
        stats: stats || [],
        homeTeam,
        awayTeam
      }}
      matchId={matchId}
    />
  );
});

const StandingsTab = memo(function StandingsTab({ 
  matchId, 
  standings,
  homeTeam,
  awayTeam
}: { 
  matchId: string, 
  standings: StandingsData | null,
  homeTeam: Team | undefined,
  awayTeam: Team | undefined
}) {
  return (
    <Standings 
      matchData={{
        standings,
        homeTeam,
        awayTeam
      }}
      matchId={matchId}
    />
  );
});

const TabContent = memo(function TabContent() {
  // 컨텍스트에서 필요한 데이터 및 상태 가져오기
  const {
    matchId,
    currentTab: tab,
    eventsData,
    lineupsData,
    statsData,
    standingsData,
    homeTeam,
    awayTeam,
    isLoading,
    loadMatchData,
    tabsLoaded,
    tabsData
  } = useMatchData();
  
  // 탭 변경 시 데이터 로드 상태 추적을 위한 로컬 상태
  const [isTabLoading, setIsTabLoading] = useState(false);

  // 현재 탭에 해당하는 캐시된 데이터 가져오기
  const cachedTabData = tabsData[tab as TabType];

  // 필요한 경우에만 데이터 로드하는 useEffect 추가
  useEffect(() => {
    // 매치 ID가 없으면 로드하지 않음
    if (!matchId) return;
    
    // 이미 해당 탭이 로드된 경우 중복 로드 방지
    if (tabsLoaded[tab]) return;
    
    // 현재 탭 타입
    const currentTabType = tab as TabType;
    
    // 현재 탭에 해당하는 데이터 가져오기
    const currentTabData = tabsData[currentTabType];
    
    // 로딩 필요 여부 확인
    let needsData = false;
    
    if (!currentTabData) {
      // 해당 탭 데이터가 아예 없는 경우
      needsData = true;
    } else {
      // 각 탭에 따라 데이터 유효성 검사
      switch (currentTabType) {
        case 'events':
          needsData = !eventsData || eventsData.length === 0;
          break;
        case 'lineups':
          needsData = !lineupsData || !lineupsData.response;
          break;
        case 'stats':
          needsData = !statsData || statsData.length === 0;
          break;
        case 'standings':
          needsData = !standingsData;
          break;
      }
    }
    
    // 데이터가 필요한 경우에만 로드
    if (needsData) {
      const loadData = async () => {
        setIsTabLoading(true);
        await loadMatchData(matchId, currentTabType);
        setIsTabLoading(false);
      };
      
      loadData();
    }
  }, [matchId, tab, tabsData, loadMatchData, tabsLoaded, eventsData, lineupsData, statsData, standingsData]);

  // 현재 탭에 따라 컴포넌트 렌더링 - useMemo를 사용하여 불필요한 재렌더링 방지
  const tabContent = useMemo(() => {
    // 전역 로딩 상태 또는 현재 탭 로딩 상태 확인
    const showLoading = isLoading || isTabLoading;
    
    if (showLoading) {
      return (
        <LoadingState message={`${tab === 'events' ? '이벤트' : 
          tab === 'lineups' ? '라인업' : 
          tab === 'stats' ? '통계' : 
          tab === 'standings' ? '순위' : '경기'} 데이터를 불러오는 중...`} />
      );
    }

    // 매치 ID 없는 경우 처리
    if (!matchId) {
      return (
        <div className="mb-4 bg-white rounded-lg border p-4">
          <div className="flex justify-center items-center py-8">
            <p className="text-gray-600">경기 정보가 없습니다.</p>
          </div>
        </div>
      );
    }
    
    // 캐시된 데이터가 없으면 로딩 상태 표시
    if (!cachedTabData) {
      return <TabLoading />;
    }

    switch (tab) {
      case 'events': {
        return eventsData && eventsData.length > 0 ? (
          <EventsTab 
            events={eventsData} 
          />
        ) : (
          <NoDataState tabName="events" />
        );
      }
      
      case 'lineups': {
        // tabsData에서 lineups 탭 데이터 가져오기
        const lineupsTabData = tabsData.lineups;
        
        // 타입 가드를 사용하여 안전하게 데이터 접근
        // Record<number, { response: PlayerStats[] }> 타입의 빈 객체 생성
        const playersStatsData: Record<number, { response: PlayerStats[] }> = {};
        
        // lineups 탭 데이터가 올바른 형식인지 확인하고 playersStats 추출
        if (lineupsTabData && isLineupsTabData(lineupsTabData) && lineupsTabData.playersStats) {
          // playersStats 데이터 복사
          Object.assign(playersStatsData, lineupsTabData.playersStats);
        }
        
        return lineupsData && lineupsData.response ? (
          <LineupsTab 
            matchId={matchId} 
            lineups={lineupsData && {
              response: {
                home: lineupsData.response.home as TeamLineup,
                away: lineupsData.response.away as TeamLineup
              }
            }}
            homeTeam={homeTeam as unknown as Team}
            awayTeam={awayTeam as unknown as Team}
            events={eventsData}
            playersStats={playersStatsData}
          />
        ) : (
          <NoDataState tabName="lineups" />
        );
      }
      
      case 'stats': {
        return statsData && statsData.length > 0 ? (
          <StatsTab 
            matchId={matchId} 
            stats={statsData}
            homeTeam={homeTeam as unknown as Team}
            awayTeam={awayTeam as unknown as Team}
          />
        ) : (
          <NoDataState tabName="stats" />
        );
      }
      
      case 'standings': {
        return standingsData ? (
          <StandingsTab 
            matchId={matchId} 
            standings={standingsData}
            homeTeam={homeTeam as unknown as Team}
            awayTeam={awayTeam as unknown as Team}
          />
        ) : (
          <NoDataState tabName="standings" />
        );
      }

      default:
        return (
          <div className="p-4 text-center bg-white rounded-lg shadow-sm">
            <p className="text-gray-700">존재하지 않는 탭입니다.</p>
          </div>
        );
    }
  }, [
    tab, 
    matchId, 
    eventsData, 
    lineupsData, 
    statsData, 
    standingsData, 
    homeTeam, 
    awayTeam, 
    isLoading,
    isTabLoading,
    cachedTabData,
    tabsData
  ]);

  return (
    <Suspense fallback={<TabLoading />}>
      {tabContent}
    </Suspense>
  );
});

export default TabContent; 