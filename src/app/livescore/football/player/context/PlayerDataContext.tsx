'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { fetchPlayerFullData, PlayerFullDataResponse } from '@/app/actions/livescore/player/data';
import { PlayerData, PlayerStatistic, FixtureData, TransferData, InjuryData, TrophyData, RankingsData } from '@/app/livescore/football/player/types/player';
import { toast } from 'react-hot-toast';

// 탭 타입 정의
export type TabType = 'stats' | 'fixtures' | 'trophies' | 'transfers' | 'injuries' | 'rankings';

// 각 탭의 데이터 타입 정의
interface TabDataTypes {
  stats: {
    seasons: number[];
    statistics: PlayerStatistic[];
  };
  fixtures: {
    fixtures: { data: FixtureData[] };
  };
  trophies: {
    trophies: TrophyData[];
  };
  transfers: {
    transfers: TransferData[];
  };
  injuries: {
    injuries: InjuryData[];
  };
  rankings: {
    rankings: RankingsData | undefined;
  };
}

// 탭 데이터 유니온 타입
type TabData = TabDataTypes[TabType];

// 컨텍스트에서 제공할 데이터 타입 정의
interface PlayerDataContextType {
  playerId: string | null;
  playerData: PlayerData | null;
  seasons: number[];
  statistics: PlayerStatistic[];
  fixturesData: { data: FixtureData[] } | null;
  trophiesData: TrophyData[];
  transfersData: TransferData[];
  injuriesData: InjuryData[];
  rankingsData: RankingsData | undefined;
  isLoading: boolean;
  error: string | null;
  loadPlayerData: (id: string, tab?: string) => Promise<void>;
  setCurrentTab: (tab: string) => void;
  currentTab: string;
  // 각 탭별 로딩 상태 및 캐시된 데이터
  tabsLoaded: Record<string, boolean>;
  tabsData: Record<TabType, TabData | undefined>;
  getTabData: (tab: TabType) => Promise<TabData | null>;
}

// 기본값과 함께 컨텍스트 생성
const PlayerDataContext = createContext<PlayerDataContextType>({
  playerId: null,
  playerData: null,
  seasons: [],
  statistics: [],
  fixturesData: null,
  trophiesData: [],
  transfersData: [],
  injuriesData: [],
  rankingsData: undefined,
  isLoading: false,
  error: null,
  loadPlayerData: async () => {},
  setCurrentTab: () => {},
  currentTab: 'stats',
  tabsLoaded: {},
  tabsData: {} as Record<TabType, TabData | undefined>,
  getTabData: async () => null
});

// 컨텍스트 훅
export const usePlayerData = () => useContext(PlayerDataContext);

// 컨텍스트 제공자 컴포넌트 Props
interface PlayerDataProviderProps {
  children: ReactNode;
  initialPlayerId?: string;
  initialTab?: string;
  initialData?: Partial<PlayerFullDataResponse>;
}

// 컨텍스트 제공자 컴포넌트
export function PlayerDataProvider({ 
  children, 
  initialPlayerId, 
  initialTab = 'stats',
  initialData = {}
}: PlayerDataProviderProps) {
  const [playerId, setPlayerId] = useState<string | null>(initialPlayerId || null);
  const [playerData, setPlayerData] = useState<PlayerData | null>(initialData.playerData || null);
  const [seasons, setSeasons] = useState<number[]>(initialData.seasons || []);
  const [statistics, setStatistics] = useState<PlayerStatistic[]>(initialData.statistics || []);
  const [fixturesData, setFixturesData] = useState<{ data: FixtureData[] } | null>(
    initialData.fixtures || { data: [] }
  );
  const [trophiesData, setTrophiesData] = useState<TrophyData[]>(
    initialData.trophies || []
  );
  const [transfersData, setTransfersData] = useState<TransferData[]>(
    initialData.transfers || []
  );
  const [injuriesData, setInjuriesData] = useState<InjuryData[]>(
    initialData.injuries || []
  );
  const [rankingsData, setRankingsData] = useState<RankingsData | undefined>(
    initialData.rankings
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<TabType>(initialTab as TabType);
  
  // 탭별 데이터 캐싱을 위한 상태 추가
  const [tabsData, setTabsData] = useState<Record<TabType, TabData | undefined>>(() => {
    // 초기 데이터를 기반으로 캐시 초기화
    const initialTabsData: Partial<Record<TabType, TabData>> = {};
    
    // 초기 탭에 대한 데이터 설정
    if (initialTab === 'stats' && initialData.statistics) {
      initialTabsData['stats'] = {
        seasons: initialData.seasons || [],
        statistics: initialData.statistics || []
      };
    } else if (initialTab === 'fixtures' && initialData.fixtures) {
      initialTabsData['fixtures'] = {
        fixtures: initialData.fixtures
      };
    } else if (initialTab === 'trophies' && initialData.trophies) {
      initialTabsData['trophies'] = {
        trophies: initialData.trophies
      };
    } else if (initialTab === 'transfers' && initialData.transfers) {
      initialTabsData['transfers'] = {
        transfers: initialData.transfers
      };
    } else if (initialTab === 'injuries' && initialData.injuries) {
      initialTabsData['injuries'] = {
        injuries: initialData.injuries
      };
    } else if (initialTab === 'rankings' && initialData.rankings) {
      initialTabsData['rankings'] = {
        rankings: initialData.rankings
      };
    }
    
    return initialTabsData as Record<TabType, TabData | undefined>;
  });
  
  // 마지막으로 로드된 탭을 추적하는 ref
  const lastLoadedTabRef = useRef<TabType>(initialTab as TabType);
  
  // 데이터 로딩 방지를 위한 초기화 플래그
  const isInitializedRef = useRef<boolean>(false);
  
  // 각 탭별 데이터 로딩 상태 추적
  const [tabsLoaded, setTabsLoaded] = useState<Record<string, boolean>>(() => {
    // 초기 데이터를 기반으로 어떤 탭이 이미 로드되었는지 체크
    const initialTabsLoaded: Record<string, boolean> = {};
    
    // 초기 tab에 대한 로딩 상태 설정
    initialTabsLoaded[initialTab] = true;
    
    // 초기 데이터가 있는 탭에 대해서도 로딩 완료 상태로 설정
    if (initialData.statistics && initialData.statistics.length > 0) {
      initialTabsLoaded['stats'] = true;
    }
    
    if (initialData.fixtures && initialData.fixtures.data && initialData.fixtures.data.length > 0) {
      initialTabsLoaded['fixtures'] = true;
    }
    
    if (initialData.trophies && initialData.trophies.length > 0) {
      initialTabsLoaded['trophies'] = true;
    }
    
    if (initialData.transfers && initialData.transfers.length > 0) {
      initialTabsLoaded['transfers'] = true;
    }
    
    if (initialData.injuries && initialData.injuries.length > 0) {
      initialTabsLoaded['injuries'] = true;
    }
    
    if (initialData.rankings) {
      initialTabsLoaded['rankings'] = true;
    }
    
    return initialTabsLoaded;
  });

  // 현재 마운트 ID - 비동기 작업 취소를 위한 메커니즘
  const mountIdRef = useRef<number>(0);
  
  // 탭별 필요한 데이터 매핑
  const getOptionsForTab = useCallback((tab: string) => {
    switch (tab) {
      case 'stats':
        return { fetchSeasons: true, fetchStats: true };
      case 'fixtures':
        return { fetchSeasons: true, fetchFixtures: true };
      case 'trophies':
        return { fetchTrophies: true };
      case 'transfers':
        return { fetchTransfers: true };
      case 'injuries':
        return { fetchInjuries: true };
      case 'rankings':
        return { fetchRankings: true };
      default:
        return { fetchSeasons: true, fetchStats: true };
    }
  }, []);

  // 특정 탭에 필요한 데이터가 이미 로드되어 있는지 확인하는 함수
  const hasRequiredDataForTab = useCallback((tab: string) => {
    // tabsData에 해당 탭 데이터가 있으면 바로 true 반환
    if (tabsData[tab as TabType]) {
      return true;
    }
    
    // 이미 해당 탭이 로드된 것으로 표시되어 있으면 true 반환
    if (tabsLoaded[tab]) {
      return true;
    }
    
    // 아니면 데이터 확인
    const options = getOptionsForTab(tab);
    
    return (
      (options.fetchSeasons && seasons.length > 0) &&
      (options.fetchStats ? statistics.length > 0 : true) &&
      (options.fetchFixtures ? fixturesData && fixturesData.data && fixturesData.data.length > 0 : true) &&
      (options.fetchTrophies ? trophiesData.length > 0 : true) &&
      (options.fetchTransfers ? transfersData.length > 0 : true) &&
      (options.fetchInjuries ? injuriesData.length > 0 : true) &&
      (options.fetchRankings ? !!rankingsData : true)
    );
  }, [
    tabsData,
    fixturesData, 
    injuriesData, 
    rankingsData, 
    seasons, 
    statistics, 
    tabsLoaded, 
    transfersData, 
    trophiesData, 
    getOptionsForTab
  ]);

  // 탭 데이터 가져오기 (캐시 활용)
  const getTabData = useCallback(async (tab: TabType): Promise<TabData | null> => {
    // 이미 캐시된 데이터가 있으면 즉시 반환
    if (tabsData[tab]) {
      return tabsData[tab] as TabData;
    }
    
    // 데이터 로딩 중이면 대기
    if (isLoading) {
      return null;
    }
    
    // 캐시된 데이터가 없으면 로드
    setIsLoading(true);
    
    try {
      // 현재 마운트 ID 저장
      const currentMountId = mountIdRef.current;
      
      // 필요한 데이터 옵션 설정
      const options = getOptionsForTab(tab);
      
      if (!playerId) {
        throw new Error('유효한 선수 ID가 없습니다.');
      }
      
      // 서버 액션 호출
      const fullData = await fetchPlayerFullData(playerId, options);

      // 마운트 ID가 변경되었으면 무시
      if (currentMountId !== mountIdRef.current) {
        return null;
      }

      if (!fullData.success) {
        setError(fullData.message);
        toast.error(fullData.message);
        return null;
      }
      
      // 탭에 따라 캐시할 데이터 구성
      let tabData: TabData;
      
      switch (tab) {
        case 'stats':
          tabData = {
            seasons: fullData.seasons || [],
            statistics: fullData.statistics || []
          } as TabData;
          
          // 전역 상태 업데이트
          if (fullData.seasons) setSeasons(fullData.seasons);
          if (fullData.statistics) setStatistics(fullData.statistics);
          break;
          
        case 'fixtures':
          tabData = {
            fixtures: fullData.fixtures || { data: [] }
          } as TabData;
          
          // 전역 상태 업데이트
          if (fullData.fixtures) setFixturesData(fullData.fixtures);
          break;
          
        case 'trophies':
          tabData = {
            trophies: fullData.trophies || []
          } as TabData;
          
          // 전역 상태 업데이트
          if (fullData.trophies) setTrophiesData(fullData.trophies);
          break;
          
        case 'transfers':
          tabData = {
            transfers: fullData.transfers || []
          } as TabData;
          
          // 전역 상태 업데이트
          if (fullData.transfers) setTransfersData(fullData.transfers);
          break;
          
        case 'injuries':
          tabData = {
            injuries: fullData.injuries || []
          } as TabData;
          
          // 전역 상태 업데이트
          if (fullData.injuries) setInjuriesData(fullData.injuries);
          break;
          
        case 'rankings':
          tabData = {
            rankings: fullData.rankings
          } as TabData;
          
          // 전역 상태 업데이트
          if (fullData.rankings) setRankingsData(fullData.rankings);
          break;
          
        default:
          return null;
      }
      
      // 기본 선수 데이터 업데이트 (모든 탭에 공통)
      if (fullData.playerData) {
        setPlayerData(fullData.playerData);
      }
      
      // 탭 데이터를 캐시에 저장
      setTabsData(prev => ({
        ...prev,
        [tab]: tabData
      }));
      
      // 해당 탭을 로드된 것으로 표시
      setTabsLoaded(prev => ({
        ...prev,
        [tab]: true
      }));
      
      // 마지막으로 로드된 탭 업데이트
      lastLoadedTabRef.current = tab;
      
      return tabData;
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.');
      toast.error('데이터를 불러오는데 실패했습니다.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [
    tabsData,
    isLoading,
    getOptionsForTab,
    playerId,
    setSeasons,
    setStatistics,
    setFixturesData,
    setTrophiesData,
    setTransfersData,
    setInjuriesData,
    setRankingsData
  ]);

  // loadPlayerData 함수 수정 - 이제 탭 변경과 필요시에만 데이터 로드 처리
  const loadPlayerData = useCallback(async (id: string, tab: string = currentTab) => {
    // 이미 로딩 중이면 중복 요청 방지
    if (isLoading) {
      return;
    }
    
    const typedTab = tab as TabType;
    
    // 마운트 ID 증가 (기존 비동기 작업 취소)
    mountIdRef.current += 1;
    
    // 탭 변경을 즉시 반영 - 사용자 경험 향상을 위해 데이터 로드보다 UI 변경을 먼저 처리
    setCurrentTab(typedTab);
    
    // 같은 선수이고 이미 해당 탭의 데이터가 로드된 경우 API 호출 방지
    if (id === playerId) {
      // 이미 해당 탭이 로드된 경우 데이터 로드 스킵
      if (tabsLoaded[tab] || tabsData[typedTab]) {
        return;
      }
      
      // 필요한 데이터가 이미 있는지 확인 - 간소화된 체크
      if (hasRequiredDataForTab(tab)) {
        // 데이터가 있으면 로드된 것으로 표시
        setTabsLoaded(prev => ({
          ...prev,
          [tab]: true
        }));
        return;
      }
    }

    // 새로운 선수라면 이전 데이터 초기화
    if (id !== playerId) {
      setPlayerId(id);
      if (playerId) { // 기존에 선수 ID가 있었다면 데이터를 초기화
        setPlayerData(null);
        setSeasons([]);
        setStatistics([]);
        setFixturesData({ data: [] });
        setTrophiesData([]);
        setTransfersData([]);
        setInjuriesData([]);
        setRankingsData(undefined);
        setTabsLoaded({});
        setTabsData({} as Record<TabType, TabData | undefined>);
        
        // 마지막으로 로드된 탭 초기화
        lastLoadedTabRef.current = typedTab;
      }
    }
    
    // 데이터 로드 요청 (현재 탭에 대해서만)
    if (!tabsLoaded[tab] && !tabsData[typedTab]) {
      // 로딩 시작 - API 호출 전에 상태 업데이트하여 로딩 UI를 먼저 표시
      setIsLoading(true);
      
      try {
        // 필요한 데이터만 로드
        await getTabData(typedTab);
      } catch (error) {
        console.error('탭 데이터 로드 중 오류 발생:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [
    isLoading, 
    playerId, 
    hasRequiredDataForTab, 
    currentTab, 
    tabsData, 
    tabsLoaded, 
    getTabData, 
    setSeasons, 
    setStatistics, 
    setFixturesData, 
    setTrophiesData, 
    setTransfersData, 
    setInjuriesData, 
    setRankingsData, 
    setPlayerData
  ]);

  // 초기화 완료 후에만 탭 변경 시 데이터 로드
  useEffect(() => {
    // 이 useEffect는 TabContent.tsx에서 필요할 때만 loadPlayerData를 호출하므로
    // 여기서는 중복 로드를 방지하기 위해 비활성화
    // 초기화 완료 후 TabContent에서 데이터 상태를 확인하고 필요시 로드합니다
  }, []);

  // 초기화 상태 관리 - 마운트/언마운트 관련 로직만 처리하도록 최적화
  useEffect(() => {
    // 컴포넌트 마운트 시 마운트 ID 증가
    const mountId = ++mountIdRef.current;
    
    // 초기 데이터를 최대한 활용하여 탭 데이터 사전 구성
    if (initialData && !isInitializedRef.current) {
      // 초기화된 데이터가 있는 경우 모든 탭에 미리 초기화 시도
      const initialTabsDataTemp: Partial<Record<TabType, TabData>> = { ...tabsData };
      
      // statistics와 seasons 데이터가 있으면 stats 탭 초기화
      if (initialData.statistics && initialData.seasons) {
        initialTabsDataTemp['stats'] = {
          seasons: initialData.seasons,
          statistics: initialData.statistics
        };
        setTabsLoaded(prev => ({ ...prev, 'stats': true }));
      }
      
      // fixtures 데이터가 있으면 fixtures 탭 초기화
      if (initialData.fixtures) {
        initialTabsDataTemp['fixtures'] = {
          fixtures: initialData.fixtures
        };
        setTabsLoaded(prev => ({ ...prev, 'fixtures': true }));
      }
      
      // 나머지 탭도 초기화
      if (initialData.trophies) {
        initialTabsDataTemp['trophies'] = {
          trophies: initialData.trophies
        };
        setTabsLoaded(prev => ({ ...prev, 'trophies': true }));
      }
      
      if (initialData.transfers) {
        initialTabsDataTemp['transfers'] = {
          transfers: initialData.transfers
        };
        setTabsLoaded(prev => ({ ...prev, 'transfers': true }));
      }
      
      if (initialData.injuries) {
        initialTabsDataTemp['injuries'] = {
          injuries: initialData.injuries
        };
        setTabsLoaded(prev => ({ ...prev, 'injuries': true }));
      }
      
      if (initialData.rankings) {
        initialTabsDataTemp['rankings'] = {
          rankings: initialData.rankings
        };
        setTabsLoaded(prev => ({ ...prev, 'rankings': true }));
      }
      
      // 모든 초기 데이터 적용
      setTabsData(initialTabsDataTemp as Record<TabType, TabData | undefined>);
    }
    
    // 이제 초기화 완료됨을 표시
    isInitializedRef.current = true;
    
    return () => {
      // 컴포넌트 언마운트 시 마운트 ID 증가 (비동기 작업 취소를 위해)
      if (mountIdRef.current === mountId) {
        mountIdRef.current += 1;
      }
    };
  }, [initialData, setTabsLoaded, tabsData]);

  // 초기 데이터가 있고 초기 playerId가 있을 때 초기화 - 의존성 배열 최적화
  useEffect(() => {
    // 이미 초기화가 완료되었다면 중복 호출 방지
    if (initialPlayerId && !isInitializedRef.current) {
      // 초기화 이미 다른 useEffect에서 처리됨
      isInitializedRef.current = true;
    }
    // initialData가 충분하면 추가 API 호출 불필요
  }, [initialPlayerId]);

  // setCurrentTab 함수 - 단순히 상태만 변경
  const handleSetCurrentTab = useCallback((tab: string) => {
    setCurrentTab(tab as TabType);
  }, []);

  // 컨텍스트 값 정의 - useMemo로 최적화
  const value = useMemo(() => ({
    playerId,
    playerData,
    seasons,
    statistics,
    fixturesData,
    trophiesData,
    transfersData,
    injuriesData,
    rankingsData,
    isLoading,
    error,
    loadPlayerData,
    setCurrentTab: handleSetCurrentTab,
    currentTab,
    tabsLoaded,
    tabsData,
    getTabData
  }), [
    playerId, playerData, seasons, statistics, fixturesData,
    trophiesData, transfersData, injuriesData, rankingsData,
    isLoading, error, loadPlayerData, handleSetCurrentTab, currentTab,
    tabsLoaded, tabsData, getTabData
  ]);

  // 컨텍스트 제공
  return (
    <PlayerDataContext.Provider value={value}>
      {children}
    </PlayerDataContext.Provider>
  );
} 