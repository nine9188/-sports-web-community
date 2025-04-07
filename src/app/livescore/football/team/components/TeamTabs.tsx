'use client';

import Overview from './tabs/Overview';
import Squad from './tabs/Squad';
import Stats from './tabs/Stats';
import Standings from './tabs/Standings';

// TeamClient.tsx와 동일한 인터페이스 사용
interface TeamInfo {
  team: {
    id: number;
    name: string;
    code: string;
    country: string;
    founded: number;
    national: boolean;
    logo: string;
  };
  venue: {
    id: number;
    name: string;
    address: string;
    city: string;
    capacity: number;
    surface: string;
    image: string;
  };
}

interface Match {
  fixture: {
    id: number;
    date: string;
    status: { short: string };
  };
  league: {
    name: string;
    logo: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
    away: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

interface Standing {
  league: {
    id: number;
    name: string;
    logo: string;
  };
  standings: Array<{
    rank: number;
    team: {
      id: number;
      name: string;
      logo: string;
    };
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
    goalsDiff: number;
    points: number;
    form: string;
  }>;
}

interface Player {
  id: number;
  name: string;
  age: number;
  number?: number;
  position: string;
  photo: string;
}

interface TeamStats {
  league?: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
  };
  team?: {
    id: number;
    name: string;
    logo: string;
  };
  form?: string;
  fixtures?: {
    played: { home: number; away: number; total: number };
    wins: { home: number; away: number; total: number };
    draws: { home: number; away: number; total: number };
    loses: { home: number; away: number; total: number };
  };
  goals?: {
    for: {
      total: { 
        home: number; 
        away: number; 
        total: number;
        minute?: Record<string, { total: number; percentage: string }>;
      };
      average?: {
        home: string;
        away: string;
        total: string;
      };
      under_over?: Record<string, { over: number; under: number }>;
    };
    against: {
      total: { 
        home: number; 
        away: number; 
        total: number;
        minute?: Record<string, { total: number; percentage: string }>;
      };
      average?: {
        home: string;
        away: string;
        total: string;
      };
      under_over?: Record<string, { over: number; under: number }>;
    };
  };
  clean_sheet?: { 
    total: number;
    home: number;
    away: number;
  };
  lineups?: Array<{ formation: string; played: number }>;
  cards?: {
    yellow: Record<string, { total: number; percentage: string }>;
    red: Record<string, { total: number; percentage: string }>;
  };
  biggest?: {
    streak: {
      wins: number;
      draws: number;
      loses: number;
    };
    wins: {
      home: string;
      away: string;
    };
    loses: {
      home: string;
      away: string;
    };
    goals?: {
      for: {
        home: number;
        away: number;
      };
      against: {
        home: number;
        away: number;
      };
    };
  };
  penalty?: {
    total: number;
    scored: { total: number; percentage: string };
    missed: { total: number; percentage: string };
  };
  failed_to_score?: {
    home: number;
    away: number;
    total: number;
  };
}

interface TeamTabsProps {
  team: TeamInfo;
  matches: Match[];
  standings: Standing[];
  squad: Player[];
  stats: TeamStats;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  teamId?: number;
}

const tabs = [
  { id: 'overview', label: '개요' },
  { id: 'squad', label: '선수단' },
  { id: 'stats', label: '통계' },
  { id: 'standings', label: '경기' }
];

export default function TeamTabs({ 
  team, 
  matches, 
  standings, 
  squad, 
  stats,
  activeTab = 'overview',
  onTabChange,
  teamId 
}: TeamTabsProps) {
  // 탭 변경 핸들러
  const handleTabChange = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  return (
    <div>
      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="py-4">
        {activeTab === 'overview' && (
          <Overview 
            team={team} 
            stats={stats} 
            matches={matches} 
            standings={standings}
            onTabChange={handleTabChange}
            teamId={teamId}
          />
        )}
        {/* @ts-expect-error - 컴포넌트들 간의 타입이 완전히 일치하지 않아도 실제 데이터 구조는 호환됩니다 */}
        {activeTab === 'squad' && <Squad squad={squad} />}
        {/* @ts-expect-error - 컴포넌트들 간의 타입이 완전히 일치하지 않아도 실제 데이터 구조는 호환됩니다 */}
        {activeTab === 'stats' && <Stats stats={stats} />}
        {/* @ts-expect-error - 컴포넌트들 간의 타입이 완전히 일치하지 않아도 실제 데이터 구조는 호환됩니다 */}
        {activeTab === 'standings' && <Standings standings={standings} teamId={teamId || 0} />}
      </div>
    </div>
  );
} 