'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { fetchTeamFullData, TeamResponse } from '@/domains/livescore/actions/teams/team';
import { Match } from '@/domains/livescore/actions/teams/matches';
import { Standing } from '@/domains/livescore/actions/teams/standings';
import { Player, Coach } from '@/domains/livescore/actions/teams/squad';
import { PlayerStats } from '@/domains/livescore/actions/teams/player-stats';

// 탭 타입 정의
type TabType = 'overview' | 'squad' | 'standings' | 'stats' | 'fixtures';

// 각 탭별 필요 데이터 맵핑
const TAB_DATA_REQUIREMENTS: Record<TabType, Array<keyof TeamDataState>> = {
  overview: ['teamData', 'matchesData', 'standingsData'],
  standings: ['teamData', 'standingsData'],
  squad: ['teamData', 'squadData', 'playerStats'],
  stats: ['teamData', 'playerStats'],
  fixtures: ['teamData', 'matchesData']
};

// 상태 타입 정의
interface TeamDataState {
  teamData: TeamResponse | null;
  matchesData: { success: boolean; data?: Match[]; message: string } | null;
  squadData: { success: boolean; data?: (Player | Coach)[]; message: string } | null;
  playerStats: { success: boolean; data?: Record<number, PlayerStats>; message: string } | null;
  standingsData: { success: boolean; data?: Standing[]; message: string } | null;
}

// 컨텍스트에서 제공할 데이터 타입 정의
interface TeamDataContextType extends TeamDataState {
  teamId: string | null;
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
  initialData?: Partial<TeamDataState>;
}

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

  // 특정 탭에 필요한 데이터가 있는지 확인하는 헬퍼 함수
  const hasRequiredDataForTab = useCallback((tab: string, currentTeamId: string | null): boolean => {
    if (teamId !== currentTeamId) return false;
    
    const tabType = tab as TabType;
    const requiredData = TAB_DATA_REQUIREMENTS[tabType] || ['teamData'];
    
    // 각 필수 데이터가 존재하는지 확인
    return requiredData.every(dataKey => {
      switch (dataKey) {
        case 'teamData':
          return Boolean(teamData);
        case 'matchesData':
          return Boolean(matchesData?.data);
        case 'squadData':
          return Boolean(squadData?.data);
        case 'playerStats':
          return Boolean(playerStats?.data);
        case 'standingsData':
          return Boolean(standingsData?.data);
        default:
          return false;
      }
    });
  }, [teamData, matchesData, squadData, playerStats, standingsData, teamId]);

  // 팀 데이터 로드 함수 - useCallback으로 감싸 불필요한 재생성 방지
  const loadTeamData = useCallback(async (id: string, tab: string = 'overview') => {
    // 이미 로딩 중이면 중복 요청 방지
    if (isLoading) return;
    
    // 요청 ID 생성 (팀ID + 탭)
    const requestId = `${id}-${tab}`;
    
    // 같은 요청이 이미 진행 중이면 무시
    if (pendingRequest === requestId) return;

    // 이미 필요한 데이터가 모두 있으면 요청하지 않음
    if (hasRequiredDataForTab(tab, id)) return;

    // 탭에 필요한 데이터 유형 확인
    const tabType = tab as TabType;
    const requiredData = TAB_DATA_REQUIREMENTS[tabType] || ['teamData'];
    
    // API 요청 옵션 설정
    const options = {
      fetchMatches: requiredData.includes('matchesData'),
      fetchSquad: requiredData.includes('squadData'), 
      fetchPlayerStats: requiredData.includes('playerStats'),
      fetchStandings: requiredData.includes('standingsData')
    };

    setIsLoading(true);
    setError(null);
    setPendingRequest(requestId);

    try {
      // ID가 변경된 경우에만 업데이트
      if (teamId !== id) {
        setTeamId(id);
      }

      // 통합 API 호출
      const fullData = await fetchTeamFullData(id, options);

      if (!fullData.success) {
        setError(fullData.message);
        return;
      }

      // 데이터 업데이트
      if (fullData.teamData) setTeamData(fullData.teamData);
      if (fullData.matches) setMatchesData(fullData.matches);
      if (fullData.squad) setSquadData(fullData.squad);
      if (fullData.playerStats) setPlayerStats(fullData.playerStats);
      if (fullData.standings) setStandingsData(fullData.standings);
    } catch (err) {
      console.error('팀 데이터 로딩 오류:', err);
      setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
      setPendingRequest(null);
    }
  }, [isLoading, pendingRequest, teamId, hasRequiredDataForTab]);

  // 초기 데이터 로드
  useEffect(() => {
    if (!initialTeamId) return;
    
    const shouldLoadInitialData = !hasRequiredDataForTab(initialTab, initialTeamId);
    
    if (shouldLoadInitialData) {
      loadTeamData(initialTeamId, initialTab);
    }
  }, [initialTeamId, initialTab, loadTeamData, hasRequiredDataForTab]);

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

  return (
    <TeamDataContext.Provider value={value}>
      {children}
    </TeamDataContext.Provider>
  );
}

export default TeamDataContext; 