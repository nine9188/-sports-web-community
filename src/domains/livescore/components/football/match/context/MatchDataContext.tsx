'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { fetchCachedMatchFullData, MatchFullDataResponse } from '@/domains/livescore/actions/match/matchData';
import { MatchEvent } from '@/domains/livescore/types/match';
import { TeamLineup } from '@/domains/livescore/actions/match/lineupData';
import { TeamStats } from '@/domains/livescore/actions/match/statsData';
import { StandingsData } from '@/domains/livescore/types/match';
import { HeadToHeadTestData } from '@/domains/livescore/actions/match/headtohead';
import { toast } from 'react-toastify';

export type TabType = 'events' | 'lineups' | 'stats' | 'standings' | 'power' | 'support';

export function isPowerTabData(data: unknown): data is HeadToHeadTestData {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Partial<HeadToHeadTestData>;
  return (
    typeof d.teamA === 'number' &&
    typeof d.teamB === 'number' &&
    typeof d.h2h === 'object' &&
    typeof d.recent === 'object' &&
    typeof d.topPlayers === 'object'
  );
}

export function isStatsTabData(data: unknown): data is { stats: TeamStats[] } {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as { stats?: unknown };
  return Array.isArray(d.stats);
}

export function isStandingsTabData(data: unknown): data is { standings: StandingsData } {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as { standings?: unknown };
  return typeof d.standings === 'object' && d.standings !== null;
}

interface MatchDataContextType {
  matchId: string | null;
  matchData: Record<string, unknown> | null;
  eventsData: MatchEvent[] | null;
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
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
  tabsData: { power?: HeadToHeadTestData };
  tabData?: unknown;
  isTabLoading: boolean;
  tabLoadError: string | null;
  isTabLoaded: (tab: TabType) => boolean;
}

const MatchDataContext = createContext<MatchDataContextType>({
  matchId: null,
  matchData: null,
  eventsData: null,
  lineupsData: null,
  statsData: null,
  standingsData: null,
  homeTeam: null,
  awayTeam: null,
  isLoading: false,
  error: null,
  loadMatchData: async () => {},
  currentTab: 'power',
  setCurrentTab: () => {},
  tabsData: {},
  tabData: undefined,
  isTabLoading: false,
  tabLoadError: null,
  isTabLoaded: () => false
});

export const useMatchData = () => useContext(MatchDataContext);

interface MatchDataProviderProps {
  children: ReactNode;
  initialMatchId?: string;
  initialTab?: string;
  initialData?: Partial<MatchFullDataResponse>;
  initialPowerData?: HeadToHeadTestData;
}

export function MatchDataProvider({
  children,
  initialMatchId,
  initialTab = 'power',
  initialData = {},
  initialPowerData
}: MatchDataProviderProps) {
  // initialData에 있는 탭들을 미리 loadedTabs에 추가
  const getInitialLoadedTabs = (): Set<string> => {
    if (!initialMatchId) return new Set();

    const tabs = new Set<string>();

    // 각 데이터가 있으면 해당 탭을 로드된 것으로 표시
    if (initialData.events !== undefined) {
      tabs.add(`${initialMatchId}-events`);
    }
    if (initialData.lineups !== undefined) {
      tabs.add(`${initialMatchId}-lineups`);
    }
    if (initialData.stats !== undefined) {
      tabs.add(`${initialMatchId}-stats`);
    }
    if (initialData.standings !== undefined) {
      tabs.add(`${initialMatchId}-standings`);
    }
    // power 탭: 서버에서 프리로드된 데이터가 있으면 로드 완료로 표시
    if (initialPowerData !== undefined) {
      tabs.add(`${initialMatchId}-power`);
    }

    return tabs;
  };

  const [matchId, setMatchId] = useState<string | null>(initialMatchId || null);
  const [matchData, setMatchData] = useState<Record<string, unknown> | null>(initialData.matchData || null);
  const [eventsData, setEventsData] = useState<MatchEvent[] | null>(initialData.events || null);
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
  // power 데이터: 서버에서 프리로드된 데이터가 있으면 초기값으로 사용
  const [powerData, setPowerData] = useState<HeadToHeadTestData | undefined>(initialPowerData);

  // 탭별 로드 완료 상태 추적 (initialData에 있는 탭들은 미리 로드된 것으로 표시)
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(() => getInitialLoadedTabs());

  // 특정 탭이 로드되었는지 확인
  const isTabLoaded = useCallback((tab: TabType): boolean => {
    if (!matchId) return false;
    return loadedTabs.has(`${matchId}-${tab}`);
  }, [matchId, loadedTabs]);

  const getOptionsForTab = (tab: string) => {
    switch (tab) {
      case 'events':
        return { fetchEvents: true };
      case 'lineups':
        return { fetchLineups: true, fetchEvents: true };
      case 'stats':
        return { fetchStats: true };
      case 'standings':
        return { fetchStandings: true };
      case 'power':
        return { fetchStandings: true, fetchEvents: true };
      default:
        return { fetchEvents: true };
    }
  };

  const loadMatchData = useCallback(async (id: string, tab: string = currentTab) => {
    if (tab === 'support') return;

    // 이미 로드된 탭은 다시 로드하지 않음
    const tabKey = `${id}-${tab}`;
    if (loadedTabs.has(tabKey)) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const options = getOptionsForTab(tab);
      const fullData = await fetchCachedMatchFullData(id, options);

      if (!fullData.success) {
        setError(fullData.error || '데이터를 불러오는데 실패했습니다.');
        toast.error(fullData.error || '데이터를 불러오는데 실패했습니다.');
        // 실패해도 로드 완료로 표시 (무한 재시도 방지)
        setLoadedTabs(prev => new Set(prev).add(tabKey));
        return;
      }

      // 공통 데이터 업데이트
      if (fullData.matchData) setMatchData(fullData.matchData);
      if (fullData.homeTeam) setHomeTeam(fullData.homeTeam);
      if (fullData.awayTeam) setAwayTeam(fullData.awayTeam);
      if (fullData.events !== undefined) setEventsData(fullData.events);

      // 탭별 데이터 업데이트 (빈 값도 설정하여 로드 완료 표시)
      switch (tab) {
        case 'events':
          if (fullData.events !== undefined) setEventsData(fullData.events);
          break;

        case 'lineups':
          // lineups는 null일 수 있으므로 undefined 체크만
          if (fullData.lineups !== undefined) setLineupsData(fullData.lineups);
          break;

        case 'stats':
          // stats가 빈 배열이어도 설정 (로드 완료로 간주)
          if (fullData.stats !== undefined) setStatsData(fullData.stats);
          break;

        case 'standings':
          // standings가 없어도 null로 설정 (로드 완료로 간주)
          if (fullData.standings !== undefined) setStandingsData(fullData.standings);
          break;

        case 'power': {
          const { getHeadToHeadTestData } = await import('@/domains/livescore/actions/match/headtohead');
          const homeId = fullData.homeTeam?.id || 0;
          const awayId = fullData.awayTeam?.id || 0;
          if (homeId && awayId) {
            const power = await getHeadToHeadTestData(homeId, awayId, 5);
            setPowerData(power || undefined);
          }
          if (fullData.standings !== undefined) setStandingsData(fullData.standings);
          break;
        }
      }

      setMatchId(id);
      
      // 로드 완료 표시
      setLoadedTabs(prev => new Set(prev).add(tabKey));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.';
      setError(errorMessage);
      toast.error(errorMessage);
      // 에러 발생 시에도 로드 완료로 표시 (무한 재시도 방지)
      setLoadedTabs(prev => new Set(prev).add(tabKey));
    } finally {
      setIsLoading(false);
    }
  }, [currentTab, loadedTabs]);

  return (
    <MatchDataContext.Provider
      value={{
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
        setCurrentTab,
        tabsData: { power: powerData },
        tabData: currentTab === 'stats' ? { stats: statsData } : currentTab === 'standings' ? { standings: standingsData } : undefined,
        isTabLoading: isLoading,
        tabLoadError: error,
        isTabLoaded
      }}
    >
      {children}
    </MatchDataContext.Provider>
  );
}
