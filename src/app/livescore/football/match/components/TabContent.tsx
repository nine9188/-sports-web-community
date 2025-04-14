'use client'; // 클라이언트 컴포넌트로 명시

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { TabType, MatchEvent, Team, TeamLineup, TeamStats, PlayerStatsData } from '../types';
import TabSelectorWrapper from './TabSelectorWrapper';

// 간단한 로딩 스피너 컴포넌트
const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-10">
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

// 각 탭 컴포넌트를 동적으로 로드 (SSR은 활성화하여 첫 번째 탭은 미리 렌더링)
const Events = dynamic(() => import('./tabs/Events'), { 
  loading: () => <LoadingSpinner />,
  ssr: true // 이벤트 탭은 기본 탭으로 SSR 활성화
});

const Lineups = dynamic(() => import('./tabs/Lineups'), { 
  loading: () => <LoadingSpinner />,
  ssr: false // 선택 시에만 로드
});

const Stats = dynamic(() => import('./tabs/Stats'), { 
  loading: () => <LoadingSpinner />,
  ssr: false // 선택 시에만 로드
});

const Standings = dynamic(() => import('./tabs/Standings'), { 
  loading: () => <LoadingSpinner />,
  ssr: false // 선택 시에만 로드
});

interface StandingsData {
  standings: {
    league: {
      id: number;
      name: string;
      logo: string;
      standings: Array<Array<{
        rank: number;
        team: {
          id: number;
          name: string;
          logo: string;
        };
        points: number;
        goalsDiff: number;
        group: string;
        form: string;
        status: string;
        description: string;
        all: {
          played: number;
          win: number;
          draw: number;
          lose: number;
          goals: {
            for: number;
            against: number;
          };
        };
      }>>;
    };
  };
}

interface MatchDataCommon {
  events?: MatchEvent[];
  lineups?: {
    response: {
      home: TeamLineup;
      away: TeamLineup;
    } | null;
  };
  stats?: TeamStats[];
  standings?: StandingsData | null;
  playersStats?: Record<number, PlayerStatsData>;
  [key: string]: unknown;
}

interface TabContentProps {
  matchId: string;
  homeTeam: Team;
  awayTeam: Team;
  matchData: MatchDataCommon;
}

export default function TabContent({ matchId, homeTeam, awayTeam, matchData }: TabContentProps) {
  // 기본 탭 설정 - 항상 events 탭을 기본값으로 사용
  const [activeTab, setActiveTab] = useState<TabType>('events');
  
  // 로컬스토리지에서 저장된 탭 정보 복원 - 로컬스토리지 값은 무시하고 항상 첫 탭으로
  useEffect(() => {
    // 탭 상태 저장
    localStorage.setItem('activeMatchTab', 'events');
  }, []);
  
  // 각 탭 컴포넌트가 이미 로드되었는지 추적
  const loadedTabs = useRef<Set<TabType>>(new Set(['events'])); // events는 기본적으로 로드
  
  // 탭 변경 핸들러
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    localStorage.setItem('activeMatchTab', tab);
    
    // 탭이 처음 로드되었음을 기록
    loadedTabs.current.add(tab);
  };

  // 각 탭에 맞게 데이터 준비
  const eventProps = { 
    events: matchData.events || [],
  };

  const lineupProps = {
    homeTeam: homeTeam || { id: 0, name: '', logo: '' }, 
    awayTeam: awayTeam || { id: 0, name: '', logo: '' },
    lineups: matchData.lineups || { response: null },
    events: matchData.events || [],
    playersStats: matchData.playersStats || {},
  };

  const statsProps = {
    stats: matchData.stats || [],
    homeTeam: homeTeam || { id: 0, name: '', logo: '' },
    awayTeam: awayTeam || { id: 0, name: '', logo: '' },
  };

  const standingsProps = {
    matchId: matchId || '',
    homeTeam: homeTeam || { id: 0, name: '', logo: '' },
    awayTeam: awayTeam || { id: 0, name: '', logo: '' },
    standings: matchData.standings || null,
  };
  
  // 각 탭 컴포넌트에 키를 추가하여 리렌더링 방지
  return (
    <>
      {/* 탭 선택기를 별도 컨테이너로 분리 */}
      <TabSelectorWrapper 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
      />
      
      {/* 탭 내용 영역 - 테두리 제거 */}
      <div>
        {/* 각 탭은 조건부 렌더링하되, 한번 로드된 후에는 유지합니다 */}
        {activeTab === 'events' && <Events key="events-tab" matchData={eventProps} />}
        
        {activeTab === 'lineups' && (
          <Lineups key="lineups-tab" matchData={lineupProps} />
        )}
        
        {activeTab === 'stats' && (
          <Stats key="stats-tab" matchData={statsProps} />
        )}
        
        {activeTab === 'standings' && (
          <Standings key="standings-tab" matchData={standingsProps} />
        )}
      </div>
    </>
  );
} 