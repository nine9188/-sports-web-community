'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { fetchTeamFullData, TeamResponse } from '@/domains/livescore/actions/teams/team';
import { Match } from '@/domains/livescore/actions/teams/matches';
import { Standing } from '@/domains/livescore/actions/teams/standings';
import { Player, Coach } from '@/domains/livescore/actions/teams/squad';
import { PlayerStats } from '@/domains/livescore/actions/teams/player-stats';

// 컨텍스트에서 제공할 데이터 타입 정의
interface TeamDataContextType {
  teamId: string | null;
  teamData: TeamResponse | null;
  matchesData: { success: boolean; data?: Match[]; message: string } | null;
  squadData: { success: boolean; data?: (Player | Coach)[]; message: string } | null;
  playerStats: { success: boolean; data?: Record<number, PlayerStats>; message: string } | null;
  standingsData: { success: boolean; data?: Standing[]; message: string } | null;
  isLoading: boolean;
  error: string | null;
  loadTeamData: (id: string, tab?: string) => Promise<void>;
}

// 기본값과 함께 컨텍스트 생성
const TeamDataContext = createContext<TeamDataContextType>({
  teamId: null,
  teamData: null,
  matchesData: null,
  squadData: null,
  playerStats: null,
  standingsData: null,
  isLoading: false,
  error: null,
  loadTeamData: async () => {}
});

// 컨텍스트 훅
export const useTeamData = () => {
  const context = useContext(TeamDataContext);
  if (context === undefined) {
    throw new Error('useTeamData는 TeamDataProvider 내부에서 사용해야 합니다');
  }
  return context;
};

// 컨텍스트 제공자 컴포넌트 Props
interface TeamDataProviderProps {
  children: ReactNode;
  initialTeamId?: string;
  initialTab?: string;
  initialData?: {
    teamData?: TeamResponse;
    matchesData?: { success: boolean; data?: Match[]; message: string };
    squadData?: { success: boolean; data?: (Player | Coach)[]; message: string };
    playerStats?: { success: boolean; data?: Record<number, PlayerStats>; message: string };
    standingsData?: { success: boolean; data?: Standing[]; message: string };
  };
}

// 각 탭별 필요 데이터 맵핑
const tabDataRequirements = {
  overview: ['teamData', 'matchesData', 'standingsData'],
  standings: ['teamData', 'standingsData'],
  squad: ['teamData', 'squadData', 'playerStats'],
  stats: ['teamData', 'playerStats'],
  fixtures: ['teamData', 'matchesData']
};

// 컨텍스트 제공자 컴포넌트
export function TeamDataProvider({ 
  children, 
  initialTeamId, 
  initialTab = 'overview',
  initialData = {}
}: TeamDataProviderProps) {
  const [teamId, setTeamId] = useState<string | null>(initialTeamId || null);
  const [teamData, setTeamData] = useState<TeamResponse | null>(initialData.teamData || null);
  const [matchesData, setMatchesData] = useState<{ success: boolean; data?: Match[]; message: string } | null>(
    initialData.matchesData || null
  );
  const [squadData, setSquadData] = useState<{ success: boolean; data?: (Player | Coach)[]; message: string } | null>(
    initialData.squadData || null
  );
  const [playerStats, setPlayerStats] = useState<{ success: boolean; data?: Record<number, PlayerStats>; message: string } | null>(
    initialData.playerStats || null
  );
  const [standingsData, setStandingsData] = useState<{ success: boolean; data?: Standing[]; message: string } | null>(
    initialData.standingsData || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 현재 진행중인 데이터 로드 요청 저장
  const [pendingRequest, setPendingRequest] = useState<string | null>(null);

  // 팀 데이터 로드 함수 - useCallback으로 감싸 불필요한 재생성 방지
  const loadTeamData = useCallback(async (id: string, tab: string = 'overview') => {
    // 이미 로딩 중이면 중복 요청 방지
    if (isLoading) return;
    
    // 요청 ID 생성 (팀ID + 탭)
    const requestId = `${id}-${tab}`;
    
    // 같은 요청이 이미 진행 중이면 무시
    if (pendingRequest === requestId) return;

    // 필요한 데이터 유형 결정
    const requiredData = tabDataRequirements[tab as keyof typeof tabDataRequirements] || ['teamData'];
    
    // 로드하려는 ID가 이미 현재 로드된 팀 ID와 동일하고 필요한 데이터가 이미 있는지 확인
    if (teamId === id) {
      // squad 탭의 경우 squadData가 없거나 playerStats가 없는 경우만 데이터를 로드
      if (tab === 'squad' && squadData?.data && playerStats?.data) {
        return; // 이미 필요한 데이터가 있으면 요청하지 않음
      }
      
      // 다른 탭의 경우 필요한 데이터 확인
      const hasTeamData = teamData && requiredData.includes('teamData');
      const hasMatchData = matchesData?.data && requiredData.includes('matchesData');
      const hasStandingsData = standingsData?.data && requiredData.includes('standingsData');
      
      // 필요한 데이터가 이미 로드되어 있으면 요청하지 않음
      if (
        (requiredData.includes('teamData') ? hasTeamData : true) &&
        (requiredData.includes('matchesData') ? hasMatchData : true) &&
        (requiredData.includes('standingsData') ? hasStandingsData : true)
      ) {
        return;
      }
    }
    
    // 탭에 따라 필요한 데이터 확인
    const needsTeamData = requiredData.includes('teamData') && (!teamData || teamId !== id);
    const needsMatches = requiredData.includes('matchesData') && (!matchesData?.data || teamId !== id);
    const needsSquad = requiredData.includes('squadData') && (!squadData?.data || teamId !== id);
    const needsPlayerStats = requiredData.includes('playerStats') && (!playerStats?.data || teamId !== id);
    const needsStandings = requiredData.includes('standingsData') && (!standingsData?.data || teamId !== id);
    
    // 모든 데이터가 있으면 요청하지 않음
    if (!needsTeamData && !needsMatches && !needsSquad && !needsPlayerStats && !needsStandings) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setPendingRequest(requestId);

    try {
      // ID가 변경된 경우에만 업데이트
      if (teamId !== id) {
        setTeamId(id);
      }

      // 탭에 따라 필요한 데이터만 가져오기 위한 옵션
      const options = {
        fetchMatches: needsMatches,
        fetchSquad: needsSquad, 
        fetchPlayerStats: needsPlayerStats,
        fetchStandings: needsStandings
      };

      // 필요한 데이터가 없을 때만 API 호출
      if (needsTeamData || needsMatches || needsSquad || needsPlayerStats || needsStandings) {
        // 통합 API를 사용하여 필요한 데이터 한 번에 가져오기
        const fullData = await fetchTeamFullData(id, options);

        if (!fullData.success) {
          setError(fullData.message);
          return;
        }

        // 필요한 데이터만 업데이트하여 불필요한 리렌더링 방지
        if (fullData.teamData && needsTeamData) setTeamData(fullData.teamData);
        if (fullData.matches && needsMatches) setMatchesData(fullData.matches);
        if (fullData.squad && needsSquad) setSquadData(fullData.squad);
        if (fullData.playerStats && needsPlayerStats) setPlayerStats(fullData.playerStats);
        if (fullData.standings && needsStandings) setStandingsData(fullData.standings);
      }
    } catch (err) {
      console.error('팀 데이터 로딩 오류:', err);
      setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
      setPendingRequest(null);
    }
  }, [isLoading, matchesData, squadData, playerStats, standingsData, teamData, teamId, pendingRequest]);

  // 초기 데이터가 있고 초기 teamId가 있을 때 초기화
  useEffect(() => {
    // 팀 ID가 있고 필요한 데이터가 없을 때만 데이터 로드
    if (initialTeamId && (!teamData || !matchesData || !squadData || !playerStats || !standingsData)) {
      // 이미 로드된 초기 데이터가 있으면 추가 로드하지 않음
      const hasInitialTeamData = Boolean(initialData.teamData);
      const hasInitialMatchesData = Boolean(initialData.matchesData);
      const hasInitialSquadData = Boolean(initialData.squadData);
      const hasInitialPlayerStats = Boolean(initialData.playerStats);
      const hasInitialStandingsData = Boolean(initialData.standingsData);
      
      // 필요한 데이터만 로드
      const needsLoad = !hasInitialTeamData || 
        (initialTab === 'overview' && !hasInitialMatchesData) ||
        (initialTab === 'squad' && (!hasInitialSquadData || !hasInitialPlayerStats)) ||
        ((initialTab === 'overview' || initialTab === 'standings') && !hasInitialStandingsData);
        
      if (needsLoad) {
        loadTeamData(initialTeamId, initialTab);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTeamId, initialTab]);

  // 컨텍스트 값 정의
  const value = {
    teamId,
    teamData,
    matchesData,
    squadData,
    playerStats,
    standingsData,
    isLoading,
    error,
    loadTeamData
  };

  // 컨텍스트 제공
  return (
    <TeamDataContext.Provider value={value}>
      {children}
    </TeamDataContext.Provider>
  );
}

export default TeamDataContext; 