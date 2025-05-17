'use client';

import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { Overview, Squad, Standings, Stats } from './tabs';
import { useTeamData } from './context/TeamDataContext';
import { 
  convertTeamStatsForOverview, 
  convertTeamStatsForStatsComponent, 
  convertStandingsData 
} from '../../../utils/teamDataUtils';
import { LoadingState, ErrorState } from '@/domains/livescore/components/common/CommonComponents';
import { Match as ApiMatch } from '@/domains/livescore/actions/teams/matches';
import { Match as UIMatch } from './tabs/overview/components/MatchItems';

// 탭 타입 정의
type TabType = 'overview' | 'squad' | 'standings' | 'stats';

// 탭별 로딩 메시지
const TAB_LOADING_MESSAGES: Record<TabType, string> = {
  overview: '팀 개요 정보를 불러오는 중...',
  squad: '선수단 정보를 불러오는 중...',
  standings: '순위표를 불러오는 중...',
  stats: '팀 통계를 불러오는 중...'
};

// 탭 컨텐츠 컴포넌트 props
interface TabContentProps {
  teamId: string;
  tab: string;
}

export default function TabContent({ teamId, tab }: TabContentProps) {
  // 팀 ID를 숫자로 변환
  const numericTeamId = parseInt(teamId, 10);
  const router = useRouter();
  
  // 로컬 로딩 상태 관리 (탭 전환 애니메이션용)
  const [isTabChanging, setIsTabChanging] = useState<boolean>(false);
  
  // 컨텍스트에서 데이터 가져오기
  const { 
    teamData, 
    matchesData, 
    squadData, 
    playerStats, 
    standingsData, 
    isLoading,
    error,
    loadTeamData
  } = useTeamData();

  // 탭 변경 핸들러 - 경로 변경 로직을 단순화
  const handleTabChange = useCallback((newTab: string) => {
    setIsTabChanging(true);
    
    const path = newTab === 'overview'
      ? `/livescore/football/team/${teamId}`
      : `/livescore/football/team/${teamId}?tab=${newTab}`;
      
    router.push(path);
  }, [router, teamId]);

  // 필요한 데이터가 있는지 확인하는 헬퍼 함수
  const hasRequiredData = useCallback((tabType: TabType): boolean => {
    switch (tabType) {
      case 'overview':
        return Boolean(teamData?.team && matchesData?.data && standingsData?.data);
      case 'squad':
        return Boolean(squadData?.data && playerStats?.data);
      case 'standings':
        return Boolean(standingsData?.data);
      case 'stats':
        return Boolean(teamData?.stats);
      default:
        return false;
    }
  }, [teamData, matchesData, squadData, playerStats, standingsData]);

  // 탭 변경 시 필요한 데이터 로드
  useEffect(() => {
    const tabType = tab as TabType;
    
    // 이미 필요한 데이터가 있는지 확인
    if (hasRequiredData(tabType)) {
      setIsTabChanging(false);
      return;
    }
    
    // 데이터 로드
    loadTeamData(teamId, tab);
    
    // 데이터 로드에 시간이 너무 오래 걸리는 경우를 대비한 안전장치
    const timerId = setTimeout(() => {
      setIsTabChanging(false);
    }, 1000);
    
    return () => clearTimeout(timerId);
  }, [teamId, tab, loadTeamData, hasRequiredData]);

  // 로딩 상태 해제
  useEffect(() => {
    if (!isLoading && isTabChanging) {
      setIsTabChanging(false);
    }
  }, [isLoading, isTabChanging]);

  // API 매치 데이터를 UI 매치 데이터로 변환
  const convertMatchesForOverview = useCallback((matches: ApiMatch[] | undefined | null): UIMatch[] | undefined => {
    if (!matches) return undefined;
    
    return matches.map(match => ({
      fixture: {
        id: match.fixture.id,
        date: match.fixture.date,
        status: {
          short: match.fixture.status.short,
          long: match.fixture.status.short
        }
      },
      league: {
        id: 0,
        name: match.league.name,
        logo: match.league.logo
      },
      teams: match.teams,
      goals: match.goals
    }));
  }, []);

  // 로딩/에러 상태 처리
  if (isLoading || isTabChanging) {
    const validTab = (tab as TabType) in TAB_LOADING_MESSAGES ? (tab as TabType) : 'overview';
    return <LoadingState message={TAB_LOADING_MESSAGES[validTab]} />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  // 탭별 컴포넌트 렌더링
  switch (tab) {
    case 'overview':
      if (!teamData?.team || !matchesData?.data || !standingsData?.data) {
        return <LoadingState message={TAB_LOADING_MESSAGES.overview} />;
      }
      
      return (
        <Suspense fallback={<LoadingState message={TAB_LOADING_MESSAGES.overview} />}>
          <Overview
            teamId={numericTeamId}
            team={teamData.team}
            stats={convertTeamStatsForOverview(teamData.stats)}
            matches={convertMatchesForOverview(matchesData.data)}
            standings={convertStandingsData(standingsData.data)}
            isLoading={false}
            error={null}
            onTabChange={handleTabChange}
          />
        </Suspense>
      );
      
    case 'squad':
      return (
        <Suspense fallback={<LoadingState message={TAB_LOADING_MESSAGES.squad} />}>
          <Squad
            initialSquad={squadData?.data}
            initialStats={playerStats?.data}
            isLoading={false}
            error={null}
          />
        </Suspense>
      );
      
    case 'standings':
      if (!standingsData?.data) {
        return <LoadingState message={TAB_LOADING_MESSAGES.standings} />;
      }
      
      return (
        <Suspense fallback={<LoadingState message={TAB_LOADING_MESSAGES.standings} />}>
          <Standings
            teamId={numericTeamId}
            initialStandings={standingsData.data}
            isLoading={false}
            error={null}
          />
        </Suspense>
      );
      
    case 'stats':
      if (!teamData?.stats) {
        return <LoadingState message={TAB_LOADING_MESSAGES.stats} />;
      }
      
      return (
        <Suspense fallback={<LoadingState message={TAB_LOADING_MESSAGES.stats} />}>
          <Stats
            teamStats={convertTeamStatsForStatsComponent(teamData.stats)}
            isLoading={false}
            error={null}
          />
        </Suspense>
      );
      
    default:
      return <ErrorState message="지원하지 않는 탭입니다." />;
  }
} 