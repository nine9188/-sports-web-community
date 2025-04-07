'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import TeamTabs from '../components/TeamTabs';
import TeamHeader from '../components/TeamHeader';
import Link from 'next/link';

// 필요한 인터페이스 정의
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

// API 응답 래퍼 인터페이스 추가
interface ApiTeamResponse {
  success: boolean;
  team: TeamInfo;
  stats?: TeamStats;
  league?: {
    id: number;
    name: string;
    type?: string;
    logo?: string;
    [key: string]: unknown; // 기타 가능한 속성
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

// TeamTabs.tsx와 동일한 인터페이스 구조로 업데이트
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

interface TeamClientProps {
  teamId: string;
  team: TeamInfo | ApiTeamResponse; // API 응답 형태가 다양할 수 있음
  matches: Match[];
  standings: Standing[];
  squad: Player[];
  stats: TeamStats;
}

export default function TeamClient({ 
  teamId, 
  team, 
  matches, 
  standings, 
  squad, 
  stats 
}: TeamClientProps) {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';
  
  // 클라이언트 상태 관리 - URL 변경 없이 상태만 관리
  const [activeTab, setActiveTab] = useState(initialTab);

  // teamId를 숫자로 변환 (API 응답의 ID와 비교하기 위함)
  const numericTeamId = parseInt(teamId, 10);

  // 탭 변경 핸들러 - URL 변경 없이 상태만 업데이트
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };
  
  // success 확인 - API에서 success: true를 포함하는 래퍼 객체로 응답이 오는 경우를 처리
  const teamData = 'success' in team ? team.team : team;

  // 에러 처리 (서버에서 전달된 데이터가 없는 경우)
  if (!teamData || !matches || !standings || !squad) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">오류 발생</h2>
          <p className="text-gray-700 mb-4">데이터를 불러오는데 실패했습니다.</p>
          <p className="text-gray-600 mb-6">
            API 서버에 연결할 수 없거나 요청한 팀 ID({teamId})에 대한 데이터가 존재하지 않습니다.
          </p>
          <div className="flex justify-center gap-4">
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              다시 시도
            </button>
            <Link 
              href="/livescore/football"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
            >
              라이브스코어 홈으로
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <TeamHeader team={teamData} stats={stats} />
      <div className="mt-6">
        <TeamTabs 
          team={teamData} 
          matches={matches} 
          standings={standings} 
          squad={squad} 
          stats={stats}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          teamId={numericTeamId}
        />
      </div>
    </div>
  );
} 