'use client';

import { useState, useEffect } from 'react';
import classNames from 'classnames';
import dynamic from 'next/dynamic';

// 탭 정의
const tabs = [
  { id: 'events', label: '이벤트' },
  { id: 'lineups', label: '라인업' },
  { id: 'stats', label: '통계' },
  { id: 'standings', label: '순위' },
];

// 동적 임포트로 탭 컴포넌트 로드
const Events = dynamic(() => import('./tabs/Events'));
const Lineups = dynamic(() => import('./tabs/Lineups'));
const Stats = dynamic(() => import('./tabs/Stats'));
const Standings = dynamic(() => import('./tabs/Standings'));

// 필요한 인터페이스 정의
interface MatchEvent {
  time: {
    elapsed: number;
    extra?: number | null;
  };
  team: {
    id: number;
    name: string;
    logo: string;
  };
  player: {
    id: number;
    name: string;
  };
  assist?: {
    id: number | null;
    name: string | null;
  };
  type: string;
  detail: string;
  comments?: string;
}

interface TeamStats {
  team: {
    id: number;
    name: string;
    logo: string;
  };
  statistics: Array<{
    type: string;
    value: number | string | null;
  }>;
}

interface TeamLineup {
  team: {
    id: number;
    name: string;
    logo: string;
    colors: {
      player: {
        primary: string;
        number: string;
        border: string;
      };
      goalkeeper: {
        primary: string;
        number: string;
        border: string;
      };
    };
  };
  formation: string;
  startXI: Array<{
    player: {
      id: number;
      name: string;
      number: number;
      pos: string;
      grid?: string;
      captain?: boolean;
      photo?: string;
    };
  }>;
  substitutes: Array<{
    player: {
      id: number;
      name: string;
      number: number;
      pos: string;
      captain?: boolean;
      photo?: string;
    };
  }>;
  coach: {
    id: number;
    name: string;
    photo?: string;
  };
}

interface MatchData {
  fixture: {
    id: number;
    date: string;
    time: string;
    timestamp: number;
  };
  league: {
    id: number;
    name: string;
    logo: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
      formation?: string;
    };
    away: {
      id: number;
      name: string;
      logo: string;
      formation?: string;
    };
  };
  goals: {
    home: string;
    away: string;
  };
  score: {
    halftime: { home: string; away: string };
    fulltime: { home: string; away: string };
  };
  status: {
    long: string;
    short: string;
    elapsed?: number;
  };
}

interface PlayerStatsData {
  response: Array<{
    player: {
      id: number;
      name: string;
      photo?: string;
    };
    statistics: Array<{
      team?: {
        logo: string;
        name: string;
      };
      games?: {
        rating: string;
        minutes: number;
        captain: boolean;
      };
      goals?: {
        total: number;
        assists: number;
        conceded?: number;
        saves?: number;
      };
      shots?: {
        total: number;
        on: number;
      };
      passes?: {
        total: number;
        key: number;
        accuracy: string;
      };
      tackles?: {
        total: number;
        blocks: number;
        interceptions: number;
      };
      duels?: {
        total: number;
        won: number;
      };
      dribbles?: {
        attempts: number;
        success: number;
      };
      fouls?: {
        drawn: number;
        committed: number;
      };
      cards?: {
        yellow: number;
        red: number;
      };
      penalty?: {
        won: number;
        scored: number;
        missed: number;
        saved: number;
      };
    }>;
  }>;
}

interface StandingsData {
  standings: {
    league: {
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
  home?: {
    id: number;
    name?: string;
  };
  away?: {
    id: number;
    name?: string;
  };
}

// 인터페이스 정의
interface TabContentProps {
  matchData: MatchData;
  eventsData: MatchEvent[];
  lineupsData: {
    response: {
      home: TeamLineup;
      away: TeamLineup;
    } | null;
  };
  statsData?: TeamStats[];
  standingsData: StandingsData | null;
  playersStatsData?: Record<number, PlayerStatsData>;
}

export default function TabContent({ 
  matchData, 
  eventsData, 
  lineupsData, 
  statsData = [], 
  standingsData = null,
  playersStatsData = {}
}: TabContentProps) {
  // 로컬 스토리지에서 활성 탭 가져오기 또는 기본값 설정
  const [activeTab, setActiveTab] = useState('events');
  
  // 컴포넌트 마운트 시 로컬 스토리지에서 활성 탭 가져오기
  useEffect(() => {
    const savedTab = localStorage.getItem('activeMatchTab');
    if (savedTab && tabs.some(tab => tab.id === savedTab)) {
      setActiveTab(savedTab);
    }
  }, []);
  
  // 탭 변경 시 로컬 스토리지에 저장
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    localStorage.setItem('activeMatchTab', tabId);
  };

  // 현재 활성화된 탭에 따라 컨텐츠 렌더링
  const renderContent = () => {
    switch (activeTab) {
      case 'events':
        return <Events events={eventsData} />;
      case 'lineups':
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return (
          <Lineups 
            homeTeam={matchData?.teams?.home}
            awayTeam={matchData?.teams?.away}
            lineups={lineupsData?.response as any}
            events={eventsData as any}
            playersStatsData={playersStatsData as any}
            matchId={matchData?.fixture?.id}
          />
        );
        /* eslint-enable @typescript-eslint/no-explicit-any */
      case 'stats':
        return (
          <Stats 
            stats={statsData}
          />
        );
      case 'standings':
        return standingsData ? <Standings standings={standingsData} /> : null;
      default:
        return null;
    }
  };

  return (
    <div>
      <div>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={classNames(
                  'whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm flex-shrink-0',
                  {
                    'border-blue-500 text-blue-600': activeTab === tab.id,
                    'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300': activeTab !== tab.id,
                  }
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="mt-4">
        {renderContent()}
      </div>
    </div>
  );
} 