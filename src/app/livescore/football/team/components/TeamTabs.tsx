'use client';

import { useState, FC, Suspense } from 'react';
import { Tab } from '@headlessui/react';
import dynamic from 'next/dynamic';

// LoadingSpinner 직접 구현
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-10">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700"></div>
  </div>
);

// dynamic import로 변경
const OverviewDynamic = dynamic(() => import('./tabs/Overview'), {
  loading: () => <LoadingSpinner />,
  ssr: false
});
const SquadDynamic = dynamic(() => import('./tabs/Squad'), {
  loading: () => <LoadingSpinner />,
  ssr: false
});
const StatsDynamic = dynamic(() => import('./tabs/Stats'), {
  loading: () => <LoadingSpinner />,
  ssr: false
});
const StandingsDynamic = dynamic(() => import('./tabs/Standings'), {
  loading: () => <LoadingSpinner />,
  ssr: false
});

// tabs 폴더에 있는 컴포넌트들이 사용하는 인터페이스와 일치하도록 정의
export interface Match {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
    };
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

export interface Standing {
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
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
  }[]>;
}

// Overview 컴포넌트용 스탠딩 타입
export interface OverviewStanding {
  league: {
    id: number;
    name: string;
    logo: string;
  };
  standings: {
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
  }[];
}

// Standings 컴포넌트용 스탠딩 타입
export interface LeagueStanding {
  league: {
    id: number;
    name: string;
    logo: string;
  };
  standings: {
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
    description?: string;
  }[][];
}

// Squad 컴포넌트용 Player 타입
export interface Player {
  id: number;
  name: string;
  age: number;
  number?: number;
  position: string;
  photo: string;
  stats?: {
    appearances: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
  };
}

// Squad 컴포넌트용 수정된 Player 타입 - number가 필수인 경우
export interface PlayerWithRequiredNumber {
  id: number;
  name: string;
  age: number;
  number: number;
  position: string;
  photo: string;
  stats: {
    appearances: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
  };
}

export interface Coach {
  id: number;
  name: string;
  age: number;
  photo: string;
  position: 'Coach';
}

// Stats 컴포넌트용 GoalData 타입
export interface MinuteGoalData {
  total: number;
  percentage: string;
}

export interface GoalStats {
  total?: {
    home: number;
    away: number;
    total: number;
  };
  average?: {
    home: string;
    away: string;
    total: string;
  };
  minute?: Record<string, MinuteGoalData>;
}

export interface TeamStats {
  league?: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
  };
  fixtures?: {
    played: {
      home: number;
      away: number;
      total: number;
    };
    wins: {
      home: number;
      away: number;
      total: number;
    };
    draws: {
      home: number;
      away: number;
      total: number;
    };
    loses: {
      home: number;
      away: number;
      total: number;
    };
  };
  goals?: {
    for: {
      total: {
        home: number;
        away: number;
        total: number;
      };
      average?: {
        home: string;
        away: string;
        total: string;
      };
      minute?: {
        [key: string]: {
          total: number | null;
          percentage: string | null;
        };
      };
    };
    against: {
      total: {
        home: number;
        away: number;
        total: number;
      };
      average?: {
        home: string;
        away: string;
        total: string;
      };
      minute?: {
        [key: string]: {
          total: number | null;
          percentage: string | null;
        };
      };
    };
  };
  clean_sheet?: {
    total: number;
    home: number;
    away: number;
  };
  form?: string;
  lineups?: {
    formation: string;
    played: number;
  }[];
  cards?: {
    yellow: {
      [key: string]: {
        total: number;
        percentage: string;
      };
    };
    red: {
      [key: string]: {
        total: number;
        percentage: string;
      };
    };
  };
}

interface OverviewProps {
  team: {
    team: {
      id: number;
      name: string;
      logo: string;
    };
    venue?: {
      name: string;
      address: string;
      city: string;
      capacity: number;
      image: string;
    };
  };
  stats: {
    league?: LeagueInfo;
    fixtures?: FixturesInfo;
    goals?: {
      for: GoalStats;
      against: GoalStats;
    };
    clean_sheet?: CleanSheetInfo;
    form?: string;
  };
  matches: Array<Match>;
  standings: Array<OverviewStanding>;
  onTabChange?: (tab: string) => void;
  teamId?: number;
}

interface LeagueInfo {
  name: string;
  country: string;
  logo: string;
  season: number;
}

interface FixturesInfo {
  wins: { total: number };
  draws: { total: number };
  loses: { total: number };
}

interface CleanSheetInfo {
  total: number;
}

// Stats 컴포넌트에서 사용하는 StatsData 타입 다시 정의
export interface StatsData {
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
  };
  form: string;
  fixtures: {
    played: { home: number; away: number; total: number };
    wins: { home: number; away: number; total: number };
    draws: { home: number; away: number; total: number };
    loses: { home: number; away: number; total: number };
  };
  goals: {
    for: {
      total: { home: number; away: number; total: number; minute?: Record<string, { total: number; percentage: string }> };
      average?: { home: string; away: string; total: string };
    };
    against: {
      total: { home: number; away: number; total: number; minute?: Record<string, { total: number; percentage: string }> };
      average?: { home: string; away: string; total: string };
    };
  };
  clean_sheet: {
    home: number;
    away: number;
    total: number;
  };
  lineups?: Array<{
    formation: string;
    played: number;
  }>;
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

// Stats 컴포넌트에서 기대하는 타입 정의
interface StatsComponentProps {
  stats: {
    league: {
      id: number;
      name: string;
      country: string;
      logo: string;
      flag: string;
      season: number;
    };
    form: string;
    fixtures: {
      played: { home: number; away: number; total: number };
      wins: { home: number; away: number; total: number };
      draws: { home: number; away: number; total: number };
      loses: { home: number; away: number; total: number };
    };
    goals: {
      for: {
        total: { home: number; away: number; total: number; minute?: Record<string, { total: number; percentage: string }> };
        average?: { home: string; away: string; total: string };
      };
      against: {
        total: { home: number; away: number; total: number; minute?: Record<string, { total: number; percentage: string }> };
        average?: { home: string; away: string; total: string };
      };
    };
    clean_sheet: {
      home: number;
      away: number;
      total: number;
    };
    lineups: Array<{
      formation: string;
      played: number;
    }>;
    cards: {
      yellow: Record<string, { total: number; percentage: string }>;
      red: Record<string, { total: number; percentage: string }>;
    };
  };
}

interface TeamTabsProps {
  team: {
    id: number;
    name: string;
    code?: string;
    country?: string;
    founded?: number;
    logo: string;
    venue?: {
      name: string;
      address: string;
      city: string;
      capacity: number;
      image: string;
    };
  };
  matches: Match[] | null;
  standings: Standing[] | null;
  squad: (Player | Coach)[] | null;
  stats: TeamStats;
  activeTab: string;
  onTabChange: (tab: string) => void;
  teamId: number;
  error: {
    matches: boolean;
    standings: boolean;
    squad: boolean;
  };
}

// 타입 변환 어댑터 함수들
const adaptStandingsForOverview = (standings: Standing[] | null): OverviewStanding[] => {
  if (!standings) return [];
  
  return standings.map(league => ({
    league: {
      id: league.league.id,
      name: league.league.name,
      logo: league.league.logo
    },
    standings: league.standings.flat() // 중첩 배열을 평탄화
  }));
};

const adaptStandingsForStandingsTab = (standings: Standing[] | null): LeagueStanding[] => {
  if (!standings) return [];
  
  return standings.map(league => ({
    league: {
      id: league.league.id,
      name: league.league.name,
      logo: league.league.logo
    },
    standings: league.standings // 중첩 배열 유지
  }));
};

const adaptSquadForSquadTab = (squad: (Player | Coach)[] | null): (PlayerWithRequiredNumber | Coach)[] => {
  if (!squad) return [];
  
  return squad.map(member => {
    if (member.position === 'Coach') {
      return member as Coach;
    } else {
      const player = member as Player;
      return {
        ...player,
        number: player.number || 0, // number가 undefined면 0으로 설정
        stats: player.stats || {
          appearances: 0,
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0
        }
      };
    }
  });
};

// Overview 컴포넌트용 stats 어댑터
const adaptStatsForOverview = (stats: TeamStats): OverviewProps['stats'] => {
  // 기본값 설정
  const defaultLeagueInfo: LeagueInfo = {
    name: '',
    country: '',
    logo: '',
    season: 0
  };
  
  const defaultFixturesInfo: FixturesInfo = {
    wins: { total: 0 },
    draws: { total: 0 },
    loses: { total: 0 }
  };
  
  const defaultCleanSheetInfo: CleanSheetInfo = {
    total: 0
  };
  
  // TeamStats에서 Overview에 필요한 형태로 변환
  return {
    league: stats.league ? {
      name: stats.league.name || '',
      country: stats.league.country || '',
      logo: stats.league.logo || '',
      season: stats.league.season || 0
    } : defaultLeagueInfo,
    
    fixtures: stats.fixtures ? {
      wins: { total: stats.fixtures.wins.total || 0 },
      draws: { total: stats.fixtures.draws.total || 0 },
      loses: { total: stats.fixtures.loses.total || 0 }
    } : defaultFixturesInfo,
    
    goals: stats.goals ? {
      for: {
        total: stats.goals.for.total || { home: 0, away: 0, total: 0 },
        average: stats.goals.for.average,
        minute: stats.goals.for.minute ? 
          Object.entries(stats.goals.for.minute).reduce((acc, [key, value]) => {
            acc[key] = {
              total: value.total !== null ? value.total : 0,
              percentage: value.percentage !== null ? value.percentage : '0%'
            };
            return acc;
          }, {} as Record<string, { total: number; percentage: string }>) 
          : undefined
      },
      against: {
        total: stats.goals.against.total || { home: 0, away: 0, total: 0 },
        average: stats.goals.against.average,
        minute: stats.goals.against.minute ? 
          Object.entries(stats.goals.against.minute).reduce((acc, [key, value]) => {
            acc[key] = {
              total: value.total !== null ? value.total : 0,
              percentage: value.percentage !== null ? value.percentage : '0%'
            };
            return acc;
          }, {} as Record<string, { total: number; percentage: string }>) 
          : undefined
      }
    } : undefined,
    
    clean_sheet: stats.clean_sheet ? {
      total: stats.clean_sheet.total || 0
    } : defaultCleanSheetInfo,
    
    form: stats.form || ''
  };
};

// Stats 컴포넌트용 어댑터 함수 수정
const adaptStatsForStatsTab = (stats: TeamStats): StatsData => {
  // 기본값 설정
  const defaultLeague = {
    id: 0,
    name: '',
    country: '',
    logo: '',
    flag: '',
    season: 0
  };
  
  const defaultFixtures = {
    played: { home: 0, away: 0, total: 0 },
    wins: { home: 0, away: 0, total: 0 },
    draws: { home: 0, away: 0, total: 0 },
    loses: { home: 0, away: 0, total: 0 }
  };
  
  // minute 객체를 안전하게 변환하는 함수
  const adaptMinuteStats = (minuteStats?: { [key: string]: { total: number | null; percentage: string | null } }) => {
    if (!minuteStats) return undefined;
    
    const result: Record<string, { total: number; percentage: string }> = {};
    
    Object.entries(minuteStats).forEach(([key, value]) => {
      result[key] = {
        total: value.total !== null ? value.total : 0,
        percentage: value.percentage !== null ? value.percentage : '0%'
      };
    });
    
    return result;
  };
  
  // lineups가 항상 배열이도록 보장
  const ensureLineups = (lineups?: { formation: string; played: number }[]) => {
    if (!lineups) return [];
    return lineups.map(lineup => ({
      formation: lineup.formation || '',
      played: lineup.played || 0
    }));
  };
  
  // 반환할 결과 객체
  const result: StatsData = {
    league: stats.league || defaultLeague,
    form: stats.form || '',
    fixtures: stats.fixtures || defaultFixtures,
    goals: {
      for: {
        total: {
          home: stats.goals?.for.total?.home || 0,
          away: stats.goals?.for.total?.away || 0,
          total: stats.goals?.for.total?.total || 0,
          minute: adaptMinuteStats(stats.goals?.for.minute)
        },
        average: stats.goals?.for.average
      },
      against: {
        total: {
          home: stats.goals?.against.total?.home || 0,
          away: stats.goals?.against.total?.away || 0,
          total: stats.goals?.against.total?.total || 0,
          minute: adaptMinuteStats(stats.goals?.against.minute)
        },
        average: stats.goals?.against.average
      }
    },
    clean_sheet: stats.clean_sheet || {
      home: 0,
      away: 0,
      total: 0
    },
    // 항상 배열을 반환하도록 보장
    lineups: ensureLineups(stats.lineups),
    cards: stats.cards || {
      yellow: {},
      red: {}
    }
  };
  
  return result;
};

// Stats 컴포넌트에 필요한 타입으로 변환하는 함수
const makeStatsCompatible = (stats: StatsData): StatsComponentProps['stats'] => {
  return {
    ...stats,
    // 항상 빈 배열이라도 제공하여 undefined가 되지 않도록 함
    lineups: stats.lineups || [],
    cards: stats.cards || { yellow: {}, red: {} }
  };
};

const TeamTabs: FC<TeamTabsProps> = ({
  team,
  matches,
  standings,
  squad,
  stats,
  activeTab,
  onTabChange,
  teamId,
  error,
}) => {
  // 현재 활성화된 탭의 인덱스를 결정
  const getTabIndex = (tab: string): number => {
    const tabNames = ['overview', 'squad', 'stats', 'standings'];
    const index = tabNames.indexOf(tab);
    return index >= 0 ? index : 0;
  };

  const [selectedTab, setSelectedTab] = useState(getTabIndex(activeTab));

  // 에러 상태 확인
  const hasError = error.matches || error.standings || error.squad;
  if (hasError) {
    return <div className="text-red-500">데이터를 불러오는 중 오류가 발생했습니다.</div>;
  }

  // 각 탭 컴포넌트에 필요한 props 구조에 맞게 데이터 전달
  const tabComponents = [
    <Suspense fallback={<LoadingSpinner />} key="overview">
      <OverviewDynamic 
        team={{ 
          team: team,
          venue: team.venue || {
            name: '정보 없음',
            address: '정보 없음',
            city: '정보 없음',
            capacity: 0,
            image: '/images/stadium-placeholder.jpg'
          }
        }} 
        matches={matches || []} 
        standings={adaptStandingsForOverview(standings)}
        teamId={teamId}
        stats={adaptStatsForOverview(stats)}
        onTabChange={onTabChange}
      />
    </Suspense>,
    <Suspense fallback={<LoadingSpinner />} key="squad">
      <SquadDynamic 
        squad={adaptSquadForSquadTab(squad)}
      />
    </Suspense>,
    <Suspense fallback={<LoadingSpinner />} key="stats">
      <StatsDynamic 
        stats={makeStatsCompatible(adaptStatsForStatsTab(stats))}
      />
    </Suspense>,
    <Suspense fallback={<LoadingSpinner />} key="standings">
      <StandingsDynamic 
        standings={adaptStandingsForStandingsTab(standings)}
        teamId={teamId} 
      />
    </Suspense>
  ];

  const tabNames = ['Overview', 'Squad', 'Stats', 'Standings'];

  // 탭 변경 핸들러
  const handleTabChange = (index: number) => {
    setSelectedTab(index);
    const tabId = ['overview', 'squad', 'stats', 'standings'][index];
    onTabChange(tabId);
  };

  return (
    <div className="w-full px-4 md:px-8 py-4">
      <Tab.Group
        selectedIndex={selectedTab}
        onChange={handleTabChange}
      >
        <Tab.List className="flex rounded-lg bg-white p-1">
          {tabNames.map((name, index) => (
            <Tab
              key={`tab-${index}`}
              className={({ selected }) =>
                `w-full py-2.5 text-sm font-medium leading-5 rounded-lg focus:outline-none ${
                  selected ? 'bg-blue-600 text-white shadow' : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              {name}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-4">
          {tabComponents.map((component, index) => (
            <Tab.Panel
              key={index}
              className="rounded-lg bg-white p-3 ring-white/5 ring-opacity-60 focus:outline-none"
            >
              {/* 선택된 탭만 렌더링 (Lazy loading은 dynamic import가 담당) */}
              {selectedTab === index ? component : null}
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default TeamTabs; 