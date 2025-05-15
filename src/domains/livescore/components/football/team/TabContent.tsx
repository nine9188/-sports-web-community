'use client';

import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Overview, Squad, Standings, Stats } from './tabs';
import { useTeamData } from './context/TeamDataContext';
import { 
  convertTeamStatsForOverview, 
  convertTeamStatsForStatsComponent, 
  convertStandingsData 
} from '../../../utils/teamDataUtils';
import { LoadingState, ErrorState } from '@/domains/livescore/components/common/CommonComponents';
import { Suspense } from 'react';
import { Match as ApiMatch } from '@/domains/livescore/actions/teams/matches';
import { Match as UIMatch } from './tabs/overview/components/MatchItems';

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

  // 탭 변경 핸들러
  const handleTabChange = useCallback((newTab: string) => {
    // 탭 변경 시작 표시
    setIsTabChanging(true);
    
    // 탭 변경을 위한 라우팅
    if (newTab === 'overview') {
      router.push(`/livescore/football/team/${teamId}`);
    } else {
      router.push(`/livescore/football/team/${teamId}?tab=${newTab}`);
    }
  }, [router, teamId]);

  // 탭 변경 시 마다 필요한 데이터 로드
  useEffect(() => {
    // squad 탭인 경우 데이터 유무를 확인하고 필요한 경우에만 로드
    if (tab === 'squad') {
      if (!squadData?.data || !playerStats?.data) {
        loadTeamData(teamId, tab);
      } else {
        // 데이터가 이미 있으면 즉시 탭 변경 상태 해제
        setIsTabChanging(false);
      }
      return;
    }
    
    // 다른 탭에 대한 데이터 확인
    const hasOverviewData = tab === 'overview' && teamData?.team && matchesData?.data && standingsData?.data;
    const hasStandingsData = tab === 'standings' && standingsData?.data;
    const hasStatsData = tab === 'stats' && teamData?.stats;
    
    // 필요한 데이터가 없을 때만 로드
    if (!hasOverviewData && !hasStandingsData && !hasStatsData) {
      loadTeamData(teamId, tab);
    } else {
      // 데이터가 이미 있으면 즉시 탭 변경 상태 해제
      setIsTabChanging(false);
    }
    
    // 최대 1초 후에는 강제로 로딩 상태 해제 (UX 향상)
    const timerId = setTimeout(() => {
      setIsTabChanging(false);
    }, 1000);
    
    return () => clearTimeout(timerId);
  }, [teamId, tab, loadTeamData, teamData, matchesData, squadData, playerStats, standingsData]);

  // 탭 변경이 완료되면 로딩 상태 해제
  useEffect(() => {
    if (!isLoading && isTabChanging) {
      setIsTabChanging(false);
    }
  }, [isLoading, isTabChanging]);

  // API의 Match 타입을 UI의 Match 타입으로 변환
  const convertMatchesForOverview = useCallback((matches: ApiMatch[] | undefined | null): UIMatch[] | undefined => {
    if (!matches) return undefined;
    
    return matches.map(match => ({
      fixture: {
        id: match.fixture.id,
        date: match.fixture.date,
        status: {
          short: match.fixture.status.short,
          long: match.fixture.status.short // short 값을 long에도 사용
        }
      },
      league: {
        id: 0, // 필요한 경우 실제 ID 값으로 대체
        name: match.league.name,
        logo: match.league.logo
      },
      teams: match.teams,
      goals: match.goals
    }));
  }, []);

  // 각 탭 컴포넌트 렌더링 함수
  const renderTabContent = useCallback(() => {
    // 전체 로딩 상태일 때 (새 데이터 로드 중)
    if (isLoading || isTabChanging) {
      return <LoadingState message={`${tab === 'overview' ? '팀 개요' : 
                                      tab === 'squad' ? '선수단' : 
                                      tab === 'standings' ? '순위표' : 
                                      tab === 'stats' ? '통계' : '팀'} 데이터를 불러오는 중...`} />;
    }

    // 에러 상태 처리
    if (error) {
      return <ErrorState message={error} />;
    }

    switch (tab) {
      case 'overview':
        if (!teamData?.team || !matchesData?.data || !standingsData?.data) {
          return <LoadingState message="팀 개요 정보를 불러오는 중..." />;
        }
        return (
          <Suspense fallback={<LoadingState message="팀 개요 정보를 불러오는 중..." />}>
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
        // 데이터 유무를 재확인하지 않고 바로 Squad 컴포넌트에 전달하여 불필요한 렌더링 방지
        return (
          <Suspense fallback={<LoadingState message="선수단 정보를 불러오는 중..." />}>
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
          return <LoadingState message="순위표를 불러오는 중..." />;
        }
        return (
          <Suspense fallback={<LoadingState message="순위표를 불러오는 중..." />}>
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
          return <LoadingState message="팀 통계를 불러오는 중..." />;
        }
        return (
          <Suspense fallback={<LoadingState message="팀 통계를 불러오는 중..." />}>
            <Stats
              teamStats={convertTeamStatsForStatsComponent(teamData.stats)}
              isLoading={false}
              error={null}
            />
          </Suspense>
        );
      default:
        return (
          <ErrorState message="지원하지 않는 탭입니다." />
        );
    }
  }, [tab, teamData, matchesData, squadData, playerStats, standingsData, numericTeamId, isLoading, isTabChanging, error, handleTabChange, convertMatchesForOverview]);

  return renderTabContent();
} 