'use client';

import React from 'react';
import { LoadingState, ErrorState, EmptyState } from '@/domains/livescore/components/common/CommonComponents';
import StatsCards from './components/StatsCards';
import StandingsPreview from './components/StandingsPreview';
import MatchItems from './components/MatchItems';
import { Match } from './components/MatchItems';
import { StandingDisplay } from '@/domains/livescore/types/standings';

// 팀 정보 타입
interface Team {
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
}

// 리그 정보 타입
interface LeagueInfo {
  name: string;
  country: string;
  logo: string;
  season: number;
}

// 경기 결과 타입
interface FixturesInfo {
  wins: { total: number };
  draws: { total: number };
  loses: { total: number };
}

// 득점 관련 타입
interface GoalStats {
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
  minute?: Record<string, { total: number; percentage: string }>;
}

// 클린시트 타입
interface CleanSheetInfo {
  total: number;
}

// 통계 정보 타입
interface Stats {
  league?: LeagueInfo;
  fixtures?: FixturesInfo;
  goals?: {
    for: GoalStats;
    against: GoalStats;
  };
  clean_sheet?: CleanSheetInfo;
  form?: string;
}

// Overview 컴포넌트 props 타입
interface OverviewProps {
  team?: Team;
  stats?: Stats;
  matches?: Match[];
  standings?: StandingDisplay[];
  onTabChange?: (tab: string) => void;
  teamId: number;
  isLoading?: boolean;
  error?: string | null;
}

export default function Overview({ 
  team, 
  stats, 
  matches, 
  standings, 
  onTabChange, 
  teamId, 
  isLoading, 
  error 
}: OverviewProps) {
  // 탭 변경 핸들러 (메모이제이션으로 불필요한 렌더링 방지)
  const handleTabChange = React.useCallback((tab: string) => {
    if (onTabChange) {
      onTabChange(tab);
    }
  }, [onTabChange]);
  
  // 로딩 상태 처리
  if (isLoading) {
    return <LoadingState message="팀 개요 데이터를 불러오는 중..." />;
  }

  // 에러 상태 처리
  if (error) {
    return <ErrorState message={error || ''} />;
  }

  // 데이터가 없는 경우 처리
  if (!team || !team.team) {
    return <EmptyState title="팀 정보가 없습니다" message="현재 이 팀에 대한 정보를 제공할 수 없습니다." />;
  }

  // 안전한 리그 정보 설정
  const safeLeague = {
    name: stats?.league?.name || '',
    logo: stats?.league?.logo || ''
  };

  return (
    <div className="space-y-4">
      {/* 1. 리그 정보 + 기본 통계 */}
      {stats && (
        <StatsCards 
          stats={stats} 
          onTabChange={handleTabChange} 
        />
      )}

      {/* 2. 리그 순위 */}
      <StandingsPreview 
        standings={standings} 
        teamId={teamId} 
        safeLeague={safeLeague}
        onTabChange={handleTabChange}
      />

      {/* 3. 최근 경기와 예정된 경기 */}
      <MatchItems 
        matches={matches} 
        teamId={teamId} 
      />
    </div>
  );
} 