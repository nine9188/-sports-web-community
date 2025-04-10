'use client'; // 클라이언트 컴포넌트로 명시

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import TabSelectorWrapper from './TabSelectorWrapper';

// 로딩 스피너 컴포넌트 (LoadingSpinner가 없는 경우)
const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-10">
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

// 동적 가져오기로 탭 컴포넌트 로드 (ssr: false 추가)
const Events = dynamic(() => import('./tabs/Events'), { 
  loading: () => <LoadingSpinner />,
  ssr: false 
});
const Lineups = dynamic(() => import('./tabs/Lineups'), { 
  loading: () => <LoadingSpinner />,
  ssr: false 
});
const Stats = dynamic(() => import('./tabs/Stats'), { 
  loading: () => <LoadingSpinner />,
  ssr: false 
});
const Standings = dynamic(() => import('./tabs/Standings'), { 
  loading: () => <LoadingSpinner />,
  ssr: false 
});

// 필요한 타입 정의
interface Team {
  id: number;
  name: string;
  logo: string;
}

interface MatchData {
  data: {
    fixture: {
      id: number;
      date: string;
      status: {
        long: string;
        short: string;
        elapsed: number;
      };
    };
    league: {
      id: number;
      name: string;
      logo: string;
    };
    teams: {
      home: Team;
      away: Team;
    };
    goals: {
      home: number;
      away: number;
    };
  };
  events: Array<{
    time: {
      elapsed: number;
      extra: number | null;
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
  }>;
  lineups: {
    response: {
      home: {
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
            grid: string;
          };
        }>;
        substitutes: Array<{
          player: {
            id: number;
            name: string;
            number: number;
            pos: string;
            grid: string;
          };
        }>;
        coach: {
          id: number;
          name: string;
          photo: string;
        };
      };
      away: {
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
            grid: string;
          };
        }>;
        substitutes: Array<{
          player: {
            id: number;
            name: string;
            number: number;
            pos: string;
            grid: string;
          };
        }>;
        coach: {
          id: number;
          name: string;
          photo: string;
        };
      };
    } | null;
  };
  stats: Array<{
    team: {
      id: number;
      name: string;
      logo: string;
    };
    statistics: Array<{
      type: string;
      value: number | string | null;
    }>;
  }>;
  standings: {
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
  } | null;
  playersStats: Record<number, {
    response: Array<{
      player: {
        id: number;
        name: string;
        photo: string;
      };
      statistics: Array<{
        team: {
          id: number;
          name: string;
          logo: string;
        };
        games: {
          rating: string;
          minutes: number;
          captain: boolean;
        };
        goals: {
          total: number;
          assists: number;
          conceded: number;
          saves: number;
        };
        shots: {
          total: number;
          on: number;
        };
        passes: {
          total: number;
          key: number;
          accuracy: string;
        };
        tackles: {
          total: number;
          blocks: number;
          interceptions: number;
        };
        duels: {
          total: number;
          won: number;
        };
        dribbles: {
          attempts: number;
          success: number;
        };
        fouls: {
          drawn: number;
          committed: number;
        };
        cards: {
          yellow: number;
          red: number;
        };
        penalty: {
          won: number;
          scored: number;
          missed: number;
          saved: number;
        };
      }>;
    }>;
  }>;
}

interface TabContentProps {
  matchId: string;
  homeTeam: Team;
  awayTeam: Team;
  matchData: MatchData;
}

export default function TabContent({ matchId, homeTeam, awayTeam, matchData }: TabContentProps) {
  // 각 탭에 필요한 속성들을 전달 (null-safe 처리 강화)
  const safeMatchData = matchData || {};
  const safeLineups = safeMatchData.lineups || { response: null }; // lineups 기본값 설정
  const safeStats = safeMatchData.stats || []; // stats 기본값 설정
  const safeStandings = safeMatchData.standings || null; // standings 기본값 설정
  const safePlayersStats = safeMatchData.playersStats || {}; // playersStats 기본값 설정
  const safeEvents = safeMatchData.events || []; // events 기본값 설정

  const tabComponents: { [key: string]: React.ReactNode } = {
    events: <Events matchData={{ events: safeEvents }} />,
    lineups: <Lineups matchData={{ 
      homeTeam, 
      awayTeam, 
      lineups: safeLineups, // null-safe lineups 전달
      events: safeEvents,
      playersStats: safePlayersStats
    }} />,
    stats: <Stats matchData={{ 
      stats: safeStats, // null-safe stats 전달
      homeTeam,
      awayTeam
    }} />,
    standings: <Standings matchData={{ 
      matchId, 
      homeTeam, 
      awayTeam, 
      standings: safeStandings // null-safe standings 전달
    }} />,
  };

  // 클라이언트 컴포넌트에서 상태 관리
  return (
    <div className="mt-4">
      <Suspense fallback={<LoadingSpinner />}>
        <TabSelectorWrapper 
          tabComponents={tabComponents}
        />
      </Suspense>
    </div>
  );
} 