'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { fetchCachedMatchFullData, MatchFullDataResponse } from '@/domains/livescore/actions/match/matchData';
import { MatchEvent } from '@/domains/livescore/types/match';
import { TeamLineup } from '@/domains/livescore/actions/match/lineupData';
import { TeamStats } from '@/domains/livescore/actions/match/statsData';
import { StandingsData } from '@/domains/livescore/types/match';
import { PlayerStats } from '@/domains/livescore/actions/match/playerStats';
import { HeadToHeadTestData } from '@/domains/livescore/actions/match/headtohead';
import { toast } from 'react-hot-toast';

// 탭 타입 정의
export type TabType = 'events' | 'lineups' | 'stats' | 'standings' | 'power' | 'support';

// 각 탭의 데이터 타입 정의 (support 제외)
interface TabDataTypes {
  events: {
    events: MatchEvent[];
  };
  lineups: {
    lineups: {
      response: {
        home: TeamLineup;
        away: TeamLineup;
      } | null;
    } | null;
    playersStats?: Record<number, { response: PlayerStats[] }>;
  };
  stats: {
    stats: TeamStats[] | null;
  };
  standings: {
    standings: StandingsData | null;
  };
  power: HeadToHeadTestData;
}

// 탭 데이터 유니온 타입 (support 제외)
export type TabData = TabDataTypes[keyof TabDataTypes];

// 타입 가드 함수
export function isEventsTabData(data: TabData): data is TabDataTypes['events'] {
  return 'events' in data;
}

export function isLineupsTabData(data: TabData): data is TabDataTypes['lineups'] {
  return 'lineups' in data;
}

export function isStatsTabData(data: TabData): data is TabDataTypes['stats'] {
  return 'stats' in data;
}

export function isStandingsTabData(data: TabData): data is TabDataTypes['standings'] {
  return 'standings' in data;
}

// power 탭 타입 가드
export function isPowerTabData(data: TabData): data is TabDataTypes['power'] {
  return (
    typeof (data as any)?.teamA === 'number' &&
    typeof (data as any)?.teamB === 'number' &&
    'h2h' in (data as any) &&
    'recent' in (data as any) &&
    'topPlayers' in (data as any)
  );
}

// 컨텍스트에서 제공할 데이터 타입 정의
interface MatchDataContextType {
  matchId: string | null;
  matchData: Record<string, unknown> | null;
  eventsData: MatchEvent[];
  lineupsData: {
    response: {
      home: TeamLineup;
      away: TeamLineup;
    } | null;
  } | null;
  statsData: TeamStats[] | null;
  standingsData: StandingsData | null;
  homeTeam: { id: number; name: string; logo: string; photo?: string } | null;
  awayTeam: { id: number; name: string; logo: string; photo?: string } | null;
  isLoading: boolean;
  error: string | null;
  loadMatchData: (id: string, tab?: string) => Promise<void>;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  // 각 탭별 로딩 상태 및 캐시된 데이터
  tabsLoaded: Record<string, boolean>;
  tabsData: Record<TabType, TabData | undefined>;
  getTabData: (tab: TabType) => Promise<TabData | null>;
  // 탭 컴포넌트용 간소화된 추가 프로퍼티
  tabData: TabData | undefined;
  isTabLoading: boolean;
  tabLoadError: string | null;
}

// 기본값과 함께 컨텍스트 생성
const MatchDataContext = createContext<MatchDataContextType>({
  matchId: null,
  matchData: null,
  eventsData: [],
  lineupsData: null,
  statsData: null,
  standingsData: null,
  homeTeam: null,
  awayTeam: null,
  isLoading: false,
  error: null,
  loadMatchData: async () => {},
  currentTab: 'events',
  setCurrentTab: () => {},
  tabsLoaded: {},
  tabsData: {} as Record<TabType, TabData | undefined>,
  getTabData: async () => null,
  // 탭 컴포넌트용 간소화된 기본값
  tabData: undefined,
  isTabLoading: false,
  tabLoadError: null
});

// 컨텍스트 훅
export const useMatchData = () => useContext(MatchDataContext);

// 컨텍스트 제공자 컴포넌트 Props
interface MatchDataProviderProps {
  children: ReactNode;
  initialMatchId?: string;
  initialTab?: string;
  initialData?: Partial<MatchFullDataResponse>;
}

// 컨텍스트 제공자 컴포넌트
export function MatchDataProvider({ 
  children, 
  initialMatchId, 
  initialTab = 'support',
  initialData = {}
}: MatchDataProviderProps) {
  const [matchId, setMatchId] = useState<string | null>(initialMatchId || null);
  const [matchData, setMatchData] = useState<Record<string, unknown> | null>(initialData.matchData || null);
  const [eventsData, setEventsData] = useState<MatchEvent[]>(initialData.events || []);
  const [lineupsData, setLineupsData] = useState<{
    response: {
      home: TeamLineup;
      away: TeamLineup;
    } | null;
  } | null>(initialData.lineups || null);
  const [statsData, setStatsData] = useState<TeamStats[] | null>(initialData.stats || null);
  const [standingsData, setStandingsData] = useState<StandingsData | null>(initialData.standings || null);
  const [homeTeam, setHomeTeam] = useState<{ id: number; name: string; logo: string; photo?: string } | null>(
    initialData.homeTeam || null
  );
  const [awayTeam, setAwayTeam] = useState<{ id: number; name: string; logo: string; photo?: string } | null>(
    initialData.awayTeam || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<TabType>(initialTab as TabType);

  // 탭별 데이터 캐싱을 위한 상태 추가
  const [tabsData, setTabsData] = useState<Record<TabType, TabData | undefined>>(() => {
    // 초기 데이터를 기반으로 캐시 초기화
    const initialTabsData: Partial<Record<TabType, TabData>> = {};
    
    // support 탭은 별도 데이터가 필요 없으므로 스킵
    if (initialTab !== 'support') {
      // 초기 탭에 대한 데이터 설정
      if (initialTab === 'events' && initialData.events) {
        initialTabsData['events'] = {
          events: initialData.events
        };
      } else if (initialTab === 'lineups' && initialData.lineups) {
        initialTabsData['lineups'] = {
          lineups: initialData.lineups
        };
      } else if (initialTab === 'stats' && initialData.stats) {
        initialTabsData['stats'] = {
          stats: initialData.stats
        };
      } else if (initialTab === 'standings' && initialData.standings) {
        initialTabsData['standings'] = {
          standings: initialData.standings
        };
      }
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
    
    // support 탭은 별도 데이터 로딩이 필요 없으므로 항상 로드됨으로 표시
    if (initialTab === 'support') {
      initialTabsLoaded['support'] = true;
    } else {
      // 초기 tab에 대한 로딩 상태 설정
      initialTabsLoaded[initialTab] = true;
    }
    
    // 초기 데이터가 있는 탭에 대해서도 로딩 완료 상태로 설정
    if (initialData.events && initialData.events.length > 0) {
      initialTabsLoaded['events'] = true;
    }
    
    if (initialData.lineups && initialData.lineups.response) {
      initialTabsLoaded['lineups'] = true;
    }
    
    if (initialData.stats && initialData.stats.length > 0) {
      initialTabsLoaded['stats'] = true;
    }
    
    if (initialData.standings) {
      initialTabsLoaded['standings'] = true;
    }
    
    return initialTabsLoaded;
  });

  // 현재 마운트 ID - 비동기 작업 취소를 위한 메커니즘
  const mountIdRef = useRef<number>(0);
  const lastStatusRef = useRef<string | null>(null);
  const lastInvalidationTsRef = useRef<number>(0);
  
  // 탭별 필요한 데이터 매핑
  const getOptionsForTab = useCallback((tab: string) => {
    switch (tab) {
      case 'events':
        return { fetchEvents: true };
      case 'lineups':
        return { fetchLineups: true, fetchEvents: true, fetchPlayersStats: true };
      case 'stats':
        return { fetchStats: true };
      case 'standings':
        return { fetchStandings: true };
      case 'power':
        // 전력 탭: 순위 + 이벤트도 함께 필요 (헤더 득점 정보 등)
        return { fetchStandings: true, fetchEvents: true };
      default:
        return { fetchEvents: true };
    }
  }, []);

  // 특정 탭에 필요한 데이터가 이미 로드되어 있는지 확인하는 함수
  const hasRequiredDataForTab = useCallback((tab: string) => {
    // 이미 해당 탭이 로드된 것으로 표시되어 있으면 true 반환 (최우선)
    if (tabsLoaded[tab]) {
      return true;
    }
    
    // tabsData에 해당 탭 데이터가 있으면 바로 true 반환
    if (tabsData[tab as TabType]) {
      // 데이터가 있다면 해당 탭을 로드된 것으로 표시
      setTabsLoaded(prev => ({
        ...prev,
        [tab]: true
      }));
      return true;
    }
    
    // 아니면 데이터 확인
    const options = getOptionsForTab(tab);
    
    // 전력 탭은 tabsData.power가 없으면 데이터 필요로 판단
    if (tab === 'power') {
      return Boolean(tabsData['power']);
    }

    const hasData = (
      (options.fetchEvents ? eventsData.length > 0 : true) &&
      (options.fetchLineups ? lineupsData && lineupsData.response : true) &&
      (options.fetchStats ? statsData && statsData.length > 0 : true) &&
      (options.fetchStandings ? standingsData !== null : true)
    );
    
    // 모든 필요한 데이터가 있다면 로드된 것으로 표시
    if (hasData) {
      setTabsLoaded(prev => ({
        ...prev,
        [tab]: true
      }));
      
      // 모든 탭 데이터 캐시 업데이트 (라인업 탭만 특별히 처리하지 않고 일반화)
      if (tab === 'events' && eventsData.length > 0) {
        setTabsData(prev => ({
          ...prev,
          events: {
            events: eventsData
          } as TabData
        }));
      } else if (tab === 'lineups' && lineupsData && lineupsData.response) {
        setTabsData(prev => ({
          ...prev,
          lineups: {
            lineups: lineupsData
          } as TabData
        }));
      } else if (tab === 'stats' && statsData && statsData.length > 0) {
        setTabsData(prev => ({
          ...prev,
          stats: {
            stats: statsData
          } as TabData
        }));
      } else if (tab === 'standings' && standingsData) {
        setTabsData(prev => ({
          ...prev,
          standings: {
            standings: standingsData
          } as TabData
        }));
      }
    }
    
    return hasData;
  }, [
    tabsData,
    eventsData,
    lineupsData,
    statsData,
    standingsData,
    tabsLoaded,
    getOptionsForTab,
    setTabsLoaded,
    setTabsData
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
      
      if (!matchId) {
        throw new Error('유효한 경기 ID가 없습니다.');
      }
      
      // 서버 액션 호출
      const fullData = await fetchCachedMatchFullData(matchId, options);

      // 마운트 ID가 변경되었으면 무시
      if (currentMountId !== mountIdRef.current) {
        return null;
      }
      
      if (!fullData.success) {
        setError(fullData.error || '데이터를 불러오는데 실패했습니다.');
        toast.error(fullData.error || '데이터를 불러오는데 실패했습니다.');
        return null;
      }
      
      // 탭에 따라 캐시할 데이터 구성
      let tabData: TabData;
      
      switch (tab) {
        case 'events':
          tabData = {
            events: fullData.events || []
          } as TabData;
          
          // 전역 상태 업데이트
          if (fullData.events) setEventsData(fullData.events);
          break;
        case 'power': {
          // 전력 데이터: H2H/최근 폼/탑 플레이어
          const { getHeadToHeadTestData } = await import('@/domains/livescore/actions/match/headtohead');
          const homeId = fullData.homeTeam?.id || 0;
          const awayId = fullData.awayTeam?.id || 0;
          const power = homeId && awayId ? await getHeadToHeadTestData(homeId, awayId, 5) : null;
          if (!power) return null;
          // 이벤트 데이터가 함께 왔다면 전역 상태에도 반영 (헤더 등에서 사용)
          if (fullData.events) setEventsData(fullData.events);
          // Power 탭은 HeadToHeadTestData를 그대로 저장
          tabData = power as TabData;
          break;
        }
          
        case 'lineups':
          tabData = {
            lineups: fullData.lineups || null,
            playersStats: fullData.playersStats
          } as TabDataTypes['lineups'];
          
          // 전역 상태 업데이트
          if (fullData.lineups) {
            setLineupsData(fullData.lineups);
          }
          
          break;
          
        case 'stats':
          tabData = {
            stats: fullData.stats || null
          } as TabData;
          
          // 전역 상태 업데이트
          if (fullData.stats) setStatsData(fullData.stats);
          break;
          
        case 'standings':
          tabData = {
            standings: fullData.standings || null
          } as TabData;
          
          // 전역 상태 업데이트
          if (fullData.standings) setStandingsData(fullData.standings);
          break;
          
        default:
          return null;
      }
      
      // 기본 경기 데이터 업데이트 (모든 탭에 공통)
      if (fullData.matchData) {
        setMatchData(fullData.matchData);
      }
      
      // 팀 정보 업데이트 (모든 탭에 공통)
      if (fullData.homeTeam) {
        setHomeTeam(fullData.homeTeam);
      }
      
      if (fullData.awayTeam) {
        setAwayTeam(fullData.awayTeam);
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
    matchId,
    setEventsData,
    setLineupsData,
    setStatsData,
    setStandingsData
  ]);

  // 탭별 메모리 캐시 - 세션 스토리지 대신 사용
  const lineupsMemoryCache = useRef<Record<string, TabDataTypes['lineups']>>({});

  // loadMatchData 함수 수정 - 이제 탭 변경과 필요시에만 데이터 로드 처리
  const loadMatchData = useCallback(async (id: string, tab: string = currentTab) => {
    // 이미 로딩 중이면 중복 요청 방지
    if (isLoading) {
      return;
    }
    
    const typedTab = tab as TabType;
    
    // 마운트 ID 증가 (기존 비동기 작업 취소)
    mountIdRef.current += 1;
    
    // 탭 변경을 즉시 반영 - 단, 현재 탭과 다를 때만 변경
    if (currentTab !== typedTab) {
      setCurrentTab(typedTab);
    }
    
    // 새로운 경기라면 이전 데이터 초기화
    if (id !== matchId) {
      setMatchId(id);
      if (matchId) { // 기존에 경기 ID가 있었다면 데이터를 초기화
        setMatchData(null);
        setEventsData([]);
        setLineupsData(null);
        setStatsData(null);
        setStandingsData(null);
        setHomeTeam(null);
        setAwayTeam(null);
        setTabsLoaded({});
        setTabsData({} as Record<TabType, TabData | undefined>);
        
        // 메모리 캐시 초기화
        lineupsMemoryCache.current = {};
        
        // 마지막으로 로드된 탭 초기화
        lastLoadedTabRef.current = typedTab;
      }
    } else {
      // 같은 경기이고 이미 해당 탭의 데이터가 로드된 경우 API 호출 방지
      // 이미 해당 탭이 로드된 경우 데이터 로드 스킵
      if (tabsLoaded[tab] || tabsData[typedTab]) {
        return;
      }
      
      // 라인업 탭인 경우 메모리 캐시 확인
      if (tab === 'lineups') {
        const cacheKey = `match-${id}-tab-${tab}`;
        const cachedData = lineupsMemoryCache.current[cacheKey];
        
        if (cachedData && cachedData.lineups && cachedData.lineups.response) {
          // 메모리 캐시된 데이터 사용
          
          // 전역 상태 업데이트
          setLineupsData(cachedData.lineups);
          
          // 탭 데이터 업데이트
          if (typedTab === 'lineups') {
            setTabsData(prev => {
              const newData = { ...prev };
              newData.lineups = { lineups: cachedData.lineups };
              return newData;
            });
          }
          
          // 해당 탭을 로드된 것으로 표시
          setTabsLoaded(prev => ({
            ...prev,
            [tab]: true
          }));
          
          return;
        }
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
    
    // 데이터 로드 요청 (현재 탭에 대해서만)
    if (!tabsLoaded[tab] && !tabsData[typedTab]) {
      // 로딩 시작 - API 호출 전에 상태 업데이트하여 로딩 UI를 먼저 표시
      setIsLoading(true);
      
      try {
        // 필요한 데이터만 로드
        const tabData = await getTabData(typedTab);
        
        // 라인업 탭 데이터를 메모리 캐시에 저장
        if (typedTab === 'lineups' && tabData) {
          const cacheKey = `match-${id}-tab-${typedTab}`;
          if ('lineups' in tabData) {
            lineupsMemoryCache.current[cacheKey] = tabData as TabDataTypes['lineups'];
          }
        }
      } catch (error) {
        console.error('탭 데이터 로드 중 오류 발생:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [
    isLoading, 
    matchId, 
    hasRequiredDataForTab, 
    currentTab, 
    tabsData, 
    tabsLoaded, 
    getTabData, 
    setEventsData, 
    setLineupsData, 
    setStatsData, 
    setStandingsData, 
    setMatchData, 
    setHomeTeam, 
    setAwayTeam
  ]);

  // 초기화 상태 관리 - 마운트/언마운트 관련 로직만 처리하도록 최적화
  useEffect(() => {
    // 컴포넌트 마운트 시 마운트 ID 증가
    const mountId = ++mountIdRef.current;
    
    // 초기 데이터를 최대한 활용하여 탭 데이터 사전 구성
    if (initialData && !isInitializedRef.current) {
      // 초기화된 데이터가 있는 경우 모든 탭에 미리 초기화 시도
      const initialTabsDataTemp: Partial<Record<TabType, TabData>> = { ...tabsData };
      
      // events 데이터가 있으면 events 탭 초기화
      if (initialData.events) {
        initialTabsDataTemp['events'] = {
          events: initialData.events
        };
        setTabsLoaded(prev => ({ ...prev, 'events': true }));
      }
      
      // lineups 데이터가 있으면 lineups 탭 초기화
      if (initialData.lineups) {
        initialTabsDataTemp['lineups'] = {
          lineups: initialData.lineups
        };
        setTabsLoaded(prev => ({ ...prev, 'lineups': true }));
      }
      
      // stats 데이터가 있으면 stats 탭 초기화
      if (initialData.stats) {
        initialTabsDataTemp['stats'] = {
          stats: initialData.stats
        };
        setTabsLoaded(prev => ({ ...prev, 'stats': true }));
      }
      
      // standings 데이터가 있으면 standings 탭 초기화
      if (initialData.standings) {
        initialTabsDataTemp['standings'] = {
          standings: initialData.standings
        };
        setTabsLoaded(prev => ({ ...prev, 'standings': true }));
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

  // 초기 데이터가 있고 초기 matchId가 있을 때 초기화 - 의존성 배열 최적화
  useEffect(() => {
    // 이미 초기화가 완료되었다면 중복 호출 방지
    if (initialMatchId && !isInitializedRef.current) {
      // 초기화 이미 다른 useEffect에서 처리됨
      isInitializedRef.current = true;
    }
    // initialData가 충분하면 추가 API 호출 불필요
  }, [initialMatchId]);
  
  // 경기 상태 변화 시 세션 캐시 무효화 (NS -> LIVE/FT 등)
  useEffect(() => {
    try {
      if (!matchId || !matchData || typeof window === 'undefined') return;
      const statusCode = (matchData as any)?.fixture?.status?.short as string | undefined;
      if (!statusCode) return;
      const prev = lastStatusRef.current;
      const now = Date.now();
      const started = prev === 'NS' && statusCode !== 'NS';
      const finished = statusCode === 'FT';
      const shouldInvalidate = started || finished;
      if (shouldInvalidate && now - lastInvalidationTsRef.current > 10000) { // 10초 쿨다운
        const cacheKey = `match-${matchId}-players-stats`;
        sessionStorage.removeItem(cacheKey);
        lastInvalidationTsRef.current = now;
      }
      lastStatusRef.current = statusCode;
    } catch {
      // no-op
    }
  }, [matchData, matchId]);
  
  // setCurrentTab 함수 - 단순히 상태만 변경
  const handleSetCurrentTab = useCallback((tab: string) => {
    setCurrentTab(tab as TabType);
  }, []);

  // 컨텍스트 값 정의 - useMemo로 최적화
  const contextValue = useMemo(() => ({
    matchId,
    matchData,
    eventsData,
    lineupsData,
    statsData,
    standingsData,
    homeTeam,
    awayTeam,
    isLoading,
    error,
    loadMatchData,
    currentTab,
    setCurrentTab: handleSetCurrentTab,
    tabsLoaded,
    tabsData,
    getTabData,
    // 탭 컴포넌트용 간소화된 프로퍼티
    tabData: tabsData[currentTab as TabType],
    isTabLoading: isLoading,
    tabLoadError: error
  }), [
    matchId, matchData, eventsData, lineupsData, statsData, standingsData,
    homeTeam, awayTeam, isLoading, error, loadMatchData, currentTab,
    handleSetCurrentTab, tabsLoaded, tabsData, getTabData
  ]);

  // 컨텍스트 제공
  return (
    <MatchDataContext.Provider value={contextValue}>
      {children}
    </MatchDataContext.Provider>
  );
} 