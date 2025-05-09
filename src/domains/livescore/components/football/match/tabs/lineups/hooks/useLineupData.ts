'use client';

import { useState, useEffect } from 'react';
import { MatchEvent } from '@/domains/livescore/types/match';
import { TeamLineup } from '@/domains/livescore/actions/match/lineupData';
import { PlayerStats } from '@/domains/livescore/actions/match/playerStats';

// 탭 데이터 타입 정의
interface TabsData {
  lineups?: {
    playersStats?: Record<number, { response: PlayerStats[] }>;
  };
  [key: string]: unknown;
}

interface UseLineupDataProps {
  matchId: string;
  matchData?: {
    lineups?: {
      response: {
        home: TeamLineup;
        away: TeamLineup;
      } | null;
    };
    events?: MatchEvent[];
    playersStats?: Record<number, { response: PlayerStats[] }>;
  };
  tabsData: TabsData;
}

export function useLineupData({ matchId, matchData, tabsData }: UseLineupDataProps) {
  // 상태 관리
  const [loading, setLoading] = useState(!matchData?.lineups);
  const [lineups, setLineups] = useState<{home: TeamLineup; away: TeamLineup} | null>(
    matchData?.lineups?.response || null
  );
  const [events, setEvents] = useState<MatchEvent[]>(matchData?.events || []);
  const [error, setError] = useState<string | null>(null);
  const [playersStatsData, setPlayersStatsData] = useState<Record<number, { response: PlayerStats[] }>>(
    matchData?.playersStats || {}
  );

  // 컴포넌트가 새 데이터를 받으면 상태 업데이트
  useEffect(() => {
    if (matchData) {
      if (matchData.lineups?.response) {
        setLineups(matchData.lineups.response);
        setLoading(false);
      }
      
      if (matchData.events) {
        setEvents(matchData.events);
      }
      
      // props에서 통계 데이터 설정
      if (matchData.playersStats) {
        setPlayersStatsData(matchData.playersStats);
      }
    }
    
    // 컨텍스트에서 통계 데이터 확인 및 통합
    const contextPlayerStats = tabsData.lineups?.playersStats;
    if (contextPlayerStats && Object.keys(contextPlayerStats).length > 0) {
      setPlayersStatsData(prevStats => ({
        ...prevStats,
        ...contextPlayerStats
      }));
    }
  }, [matchId, matchData, tabsData]);

  return { 
    loading, 
    lineups, 
    events, 
    error, 
    playersStatsData,
    setLoading,
    setError
  };
} 