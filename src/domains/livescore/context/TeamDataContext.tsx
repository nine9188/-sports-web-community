import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';
import { 
  fetchTeamFullData, 
  TeamResponse
} from '../actions/teams';

// 컨텍스트에서 제공할 값의 타입 정의
type MatchData = { id: number; status: { code: string; name: string }; /* 다른 매치 필드 */ }; 
type PlayerData = { id: number; name: string; /* 다른 선수 필드 */ };
type StandingData = { rank: number; team: { id: number; name: string }; /* 다른 순위 필드 */ };
type PlayerStatsData = Record<number, { goals: number; assists: number; /* 다른 통계 필드 */ }>;

interface DataResponse<T> {
  success: boolean;
  data?: T;
  message: string;
}

interface TeamDataContextType {
  teamId: string | null;
  teamData: TeamResponse | null;
  matchesData: DataResponse<MatchData[]> | null;
  squadData: DataResponse<PlayerData[]> | null;
  playerStats: DataResponse<PlayerStatsData> | null;
  standingsData: DataResponse<StandingData[]> | null;
  isLoading: boolean;
  error: string | null;
  loadTeamData: (id: string, tab?: string) => Promise<void>;
}

// 탭별 필요한 데이터 정의
type TabDataRequirements = {
  [key: string]: string[];
};

const tabDataRequirements: TabDataRequirements = {
  overview: ['teamData', 'matchesData'],
  fixtures: ['teamData', 'matchesData'],
  squad: ['teamData', 'squadData', 'playerStats'],
  standings: ['teamData', 'standingsData'],
  stats: ['teamData', 'playerStats']
};

// 기본값으로 빈 컨텍스트 생성
const TeamDataContext = createContext<TeamDataContextType | undefined>(undefined);

// 컨텍스트 제공자 컴포넌트
export const TeamDataProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamData, setTeamData] = useState<TeamResponse | null>(null);
  const [matchesData, setMatchesData] = useState<DataResponse<MatchData[]> | null>(null);
  const [squadData, setSquadData] = useState<DataResponse<PlayerData[]> | null>(null);
  const [playerStats, setPlayerStats] = useState<DataResponse<PlayerStatsData> | null>(null);
  const [standingsData, setStandingsData] = useState<DataResponse<StandingData[]> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
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
        if (fullData.matches && needsMatches) setMatchesData(fullData.matches as DataResponse<MatchData[]>);
        if (fullData.squad && needsSquad) setSquadData(fullData.squad as DataResponse<PlayerData[]>);
        if (fullData.playerStats && needsPlayerStats) setPlayerStats(fullData.playerStats as DataResponse<PlayerStatsData>);
        if (fullData.standings && needsStandings) setStandingsData(fullData.standings as DataResponse<StandingData[]>);
      }
    } catch (err) {
      console.error('팀 데이터 로딩 오류:', err);
      setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
      setPendingRequest(null);
    }
  }, [isLoading, pendingRequest, teamId, teamData, matchesData, squadData, playerStats, standingsData]);

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

  return <TeamDataContext.Provider value={value}>{children}</TeamDataContext.Provider>;
};

// 컨텍스트 사용을 위한 커스텀 훅
export const useTeamData = () => {
  const context = useContext(TeamDataContext);
  if (context === undefined) {
    throw new Error('useTeamData는 TeamDataProvider 내부에서 사용해야 합니다');
  }
  return context;
};

export default TeamDataContext;