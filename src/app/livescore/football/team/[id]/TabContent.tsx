'use client';

import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Overview from '../components/tabs/Overview';
import Squad from '../components/tabs/Squad';
import Standings from '../components/tabs/Standings';
import Stats from '../components/tabs/Stats';
import { useTeamData } from '../context/TeamDataContext';
import { 
  convertTeamStatsForOverview, 
  convertTeamStatsForStatsComponent, 
  convertStandingsData 
} from '@/app/utils/teamDataUtils';
import { LoadingState, ErrorState } from '@/app/livescore/football/components/CommonComponents';
import { Suspense } from 'react';

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
    // 해당 탭에 필요한 데이터 로드
    loadTeamData(teamId, tab);
    
    // 최대 500ms 후에는 강제로 로딩 상태 해제 (UX 향상)
    const timerId = setTimeout(() => {
      setIsTabChanging(false);
    }, 500);
    
    return () => clearTimeout(timerId);
  }, [teamId, tab, loadTeamData]);

  // 탭 변경이 완료되면 로딩 상태 해제
  useEffect(() => {
    if (!isLoading && isTabChanging) {
      setIsTabChanging(false);
    }
  }, [isLoading, isTabChanging]);

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

    // 각 탭에 필요한 데이터가 있는지 확인
    const hasOverviewData = teamData?.team && matchesData?.data && standingsData?.data;
    const hasSquadData = squadData?.data && playerStats?.data;
    const hasStandingsData = standingsData?.data;
    const hasStatsData = teamData?.stats;

    switch (tab) {
      case 'overview':
        if (!hasOverviewData) return <LoadingState message="팀 개요 정보를 불러오는 중..." />;
        return (
          <Suspense fallback={<LoadingState message="팀 개요 정보를 불러오는 중..." />}>
            <Overview
              teamId={numericTeamId}
              team={teamData.team}
              stats={convertTeamStatsForOverview(teamData.stats)}
              matches={matchesData.data}
              standings={convertStandingsData(standingsData.data)}
              isLoading={false}
              error={null}
              onTabChange={handleTabChange}
            />
          </Suspense>
        );
      case 'squad':
        if (!hasSquadData) return <LoadingState message="선수단 정보를 불러오는 중..." />;
        return (
          <Suspense fallback={<LoadingState message="선수단 정보를 불러오는 중..." />}>
            <Squad
              initialSquad={squadData.data}
              initialStats={playerStats.data}
              isLoading={false}
              error={null}
            />
          </Suspense>
        );
      case 'standings':
        if (!hasStandingsData) return <LoadingState message="순위표를 불러오는 중..." />;
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
        if (!hasStatsData) return <LoadingState message="팀 통계를 불러오는 중..." />;
        return (
          <Suspense fallback={<LoadingState message="팀 통계를 불러오는 중..." />}>
            <Stats
              initialStats={convertTeamStatsForStatsComponent(teamData.stats)}
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
  }, [tab, teamData, matchesData, squadData, playerStats, standingsData, numericTeamId, isLoading, isTabChanging, error, handleTabChange]);

  return renderTabContent();
} 