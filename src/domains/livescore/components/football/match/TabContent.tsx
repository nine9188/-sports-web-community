'use client';

import { Suspense, memo, useMemo, useEffect, useState } from 'react';
import Events from './tabs/Events';
import Lineups from './tabs/lineups/Lineups';
import Stats from './tabs/Stats';
import Standings from './tabs/Standings';
import Power from './tabs/Power';
import MatchPredictionClient from './sidebar/MatchPredictionClient';
import SupportCommentsSection from './sidebar/SupportCommentsSection';
import { LoadingState, EmptyState } from '@/domains/livescore/components/common/CommonComponents';
import { useMatchData, TabType, isLineupsTabData, isPowerTabData } from './context/MatchDataContext';
import { Team, MatchEvent, TeamLineup, TeamStats, StandingsData } from '@/domains/livescore/types/match';
import { PlayerStats } from '@/domains/livescore/actions/match/playerStats';

// 데이터 없음 표시 컴포넌트
const NoDataState = memo(function NoDataState({ tabName }: { tabName: string }) {
  const messages = {
    events: {
      title: '이벤트 데이터가 없습니다',
      message: '이 경기의 이벤트 데이터를 찾을 수 없습니다.'
    },
    power: {
      title: '전력 데이터가 없습니다',
      message: '이 경기의 전력 데이터를 찾을 수 없습니다.'
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

// 각 탭 컴포넌트를 개별적으로 메모이제이션
const EventsTab = memo(function EventsTab({ events }: { events: MatchEvent[] }) {
  return <Events events={events} />;
});

const LineupsTab = memo(function LineupsTab({ 
  matchId, lineups, homeTeam, awayTeam, events, playersStats
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
  matchId, stats, homeTeam, awayTeam
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
  matchId, standings, homeTeam, awayTeam
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

export default function TabContent() {
  // 컨텍스트에서 필요한 데이터 및 상태 가져오기
  const {
    matchId,
    matchData,
    currentTab: tab,
    eventsData,
    lineupsData,
    statsData,
    standingsData,
    homeTeam,
    awayTeam,
    isLoading,
    loadMatchData,
    tabsData
  } = useMatchData();
  
  // 탭 변경 시 데이터 로드 상태 추적을 위한 로컬 상태
  const [isTabChanging, setIsTabChanging] = useState(false);

  // 탭 변경 시 마다 필요한 데이터 로드
  useEffect(() => {
    // 매치 ID가 없으면 로드하지 않음
    if (!matchId) return;
    
    // support 탭은 별도 데이터 로딩이 필요하지 않음
    if (tab === 'support') {
      setIsTabChanging(false);
      return;
    }
    
    // 현재 탭에 대한 데이터 확인
    const hasEventsData = tab === 'events' && eventsData && eventsData.length > 0;
    const hasLineupsData = tab === 'lineups' && lineupsData && lineupsData.response;
    const hasStatsData = tab === 'stats' && statsData && statsData.length > 0;
    const hasStandingsData = tab === 'standings' && standingsData;
    const hasPowerData = tab === 'power' && tabsData.power;
    
    // 필요한 데이터가 없을 때만 로드
    const needsDataLoad = (
      (tab === 'events' && !hasEventsData) ||
      (tab === 'lineups' && !hasLineupsData) ||
      (tab === 'stats' && !hasStatsData) ||
      (tab === 'standings' && !hasStandingsData) ||
      (tab === 'power' && !hasPowerData)
    );

    if (needsDataLoad) {
      setIsTabChanging(true);
      loadMatchData(matchId, tab as TabType);
    } else {
      // 데이터가 이미 있으면 즉시 탭 변경 상태 해제
      setIsTabChanging(false);
    }
    
    // 로딩은 실제 데이터 도착에 의해 해제되도록 타임아웃 제거
    return () => {};
  }, [matchId, tab, eventsData, lineupsData, statsData, standingsData, tabsData.power, loadMatchData]);

  // 탭 변경이 완료되면 로딩 상태 해제
  useEffect(() => {
    if (!isLoading && isTabChanging) {
      setIsTabChanging(false);
    }
  }, [isLoading, isTabChanging]);

  // 현재 탭에 따라 컴포넌트 렌더링
  const renderTabContent = useMemo(() => {
    console.log(`TabContent - 현재 탭: ${tab}`); // 디버깅 로그
    
    // 전체 로딩 상태일 때
    if (isLoading || isTabChanging) {
      return <LoadingState message={`${tab === 'events' ? '이벤트' : 
                                      tab === 'lineups' ? '라인업' : 
                                      tab === 'stats' ? '통계' : 
                                      tab === 'standings' ? '순위' : 
                                      tab === 'power' ? '전력' : 
                                      tab === 'support' ? '응원' : '경기'} 데이터를 불러오는 중...`} />;
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

    switch (tab) {
      case 'events': {
        return eventsData && eventsData.length > 0 ? (
          <Suspense fallback={<LoadingState message="이벤트 데이터를 불러오는 중..." />}>
            <EventsTab events={eventsData} />
          </Suspense>
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
          <Suspense fallback={<LoadingState message="라인업 정보를 불러오는 중..." />}>
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
          </Suspense>
        ) : (
          <NoDataState tabName="lineups" />
        );
      }
      
      case 'stats': {
        return statsData && statsData.length > 0 ? (
          <Suspense fallback={<LoadingState message="통계 데이터를 불러오는 중..." />}>
            <StatsTab 
              matchId={matchId} 
              stats={statsData}
              homeTeam={homeTeam as unknown as Team}
              awayTeam={awayTeam as unknown as Team}
            />
          </Suspense>
        ) : (
          <NoDataState tabName="stats" />
        );
      }
      
      case 'standings': {
        return standingsData ? (
          <Suspense fallback={<LoadingState message="순위 정보를 불러오는 중..." />}>
            <StandingsTab 
              matchId={matchId} 
              standings={standingsData}
              homeTeam={homeTeam as unknown as Team}
              awayTeam={awayTeam as unknown as Team}
            />
          </Suspense>
        ) : (
          <NoDataState tabName="standings" />
        );
      }

      case 'power': {
        const powerData = tabsData.power;
        return powerData && isPowerTabData(powerData) ? (
          <Suspense fallback={<LoadingState message="전력 데이터를 불러오는 중..." />}>
            <Power 
              matchId={matchId}
              homeTeam={homeTeam as unknown as Team}
              awayTeam={awayTeam as unknown as Team}
              data={{ 
                ...powerData, 
                standings: standingsData 
              }}
            />
          </Suspense>
        ) : (
          <NoDataState tabName="power" />
        );
      }

      case 'support': {
        // 응원 탭 - 승무패 예측과 응원 댓글
        return (
          <div className="space-y-4">
            <Suspense fallback={<LoadingState message="응원 데이터를 불러오는 중..." />}>
              <MatchPredictionClient matchData={matchData || {}} />
              <SupportCommentsSection matchData={matchData || {}} />
            </Suspense>
          </div>
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
    isTabChanging,
    tabsData,
    matchData
  ]);

  return renderTabContent;
} 