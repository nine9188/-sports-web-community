'use client';

import { Suspense, memo, useMemo, useEffect, useState } from 'react';
import { LoadingState } from '@/domains/livescore/components/common/CommonComponents';
import { usePlayerData, TabType } from './context/PlayerDataContext';
import { PlayerStatistic, FixtureData, TransferData, InjuryData, TrophyData, RankingsData } from '@/domains/livescore/types/player';
import PlayerStats from './tabs/PlayerStats';
import PlayerFixtures from './tabs/PlayerFixtures';
import PlayerTrophies from './tabs/PlayerTrophies';
import PlayerTransfers from './tabs/PlayerTransfers';
import PlayerInjuries from './tabs/PlayerInjuries';
import PlayerRankings from './tabs/PlayerRankings';

// 각 탭 컴포넌트를 개별적으로 메모이제이션
const StatsTab = memo(function StatsTab({ statistics }: { statistics: PlayerStatistic[] }) {
  return <PlayerStats statistics={statistics} />;
});

const FixturesTab = memo(function FixturesTab({ 
  fixturesData 
}: { 
  fixturesData: { data: FixtureData[]; status?: string; message?: string; } 
}) {
  const safeFixturesData = useMemo(() => ({
    data: fixturesData?.data || [],
    status: fixturesData?.status || 'error',
    message: fixturesData?.message || '경기 기록이 없습니다.'
  }), [fixturesData]);
  
  return <PlayerFixtures fixturesData={safeFixturesData} />;
});

const TrophiesTab = memo(function TrophiesTab({ 
  playerId, trophiesData 
}: { 
  playerId: number, trophiesData: TrophyData[] 
}) {
  return <PlayerTrophies playerId={playerId} trophiesData={trophiesData} />;
});

const TransfersTab = memo(function TransfersTab({ 
  playerId, transfersData 
}: { 
  playerId: number, transfersData: TransferData[] 
}) {
  return <PlayerTransfers playerId={playerId} transfersData={transfersData} />;
});

const InjuriesTab = memo(function InjuriesTab({ 
  playerId, injuriesData 
}: { 
  playerId: number, injuriesData: InjuryData[] 
}) {
  return <PlayerInjuries playerId={playerId} injuriesData={injuriesData} />;
});

const RankingsTab = memo(function RankingsTab({ 
  playerId, rankingsData 
}: { 
  playerId: number, rankingsData: RankingsData 
}) {
  return <PlayerRankings playerId={playerId} rankingsData={rankingsData} />;
});

// 오류 표시 컴포넌트
const ErrorDisplay = memo(function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="p-4 text-center bg-white rounded-lg shadow-sm">
      <p className="text-red-600">오류: {message}</p>
    </div>
  );
});

export default function TabContent() {
  // 컨텍스트에서 필요한 데이터 및 상태 가져오기
  const {
    playerId,
    currentTab: tab,
    tabsData,
    isLoading,
    error,
    loadPlayerData
  } = usePlayerData();
  
  // 플레이어 ID를 숫자로 변환
  const playerIdNum = playerId ? parseInt(playerId, 10) : 0;
  
  // 로컬 로딩 상태 관리 (탭 전환 애니메이션용)
  const [isTabChanging, setIsTabChanging] = useState<boolean>(false);
  
  // 탭 변경 시 마다 필요한 데이터 로드
  useEffect(() => {
    if (!playerId) return;
    
    // 현재 탭에 대한 데이터 확인
    const hasStatsData = tab === 'stats' && tabsData.stats;
    const hasFixturesData = tab === 'fixtures' && tabsData.fixtures;
    const hasTrophiesData = tab === 'trophies' && tabsData.trophies;
    const hasTransfersData = tab === 'transfers' && tabsData.transfers;
    const hasInjuriesData = tab === 'injuries' && tabsData.injuries;
    const hasRankingsData = tab === 'rankings' && tabsData.rankings;
    
    // 필요한 데이터가 없을 때만 로드
    if (!hasStatsData && !hasFixturesData && !hasTrophiesData && 
        !hasTransfersData && !hasInjuriesData && !hasRankingsData) {
      setIsTabChanging(true);
      loadPlayerData(playerId, tab as TabType);
    } else {
      // 데이터가 이미 있으면 즉시 탭 변경 상태 해제
      setIsTabChanging(false);
    }
    
    // 최대 1초 후에는 강제로 로딩 상태 해제 (UX 향상)
    const timerId = setTimeout(() => {
      setIsTabChanging(false);
    }, 1000);
    
    return () => clearTimeout(timerId);
  }, [playerId, tab, tabsData, loadPlayerData]);

  // 탭 변경이 완료되면 로딩 상태 해제
  useEffect(() => {
    if (!isLoading && isTabChanging) {
      setIsTabChanging(false);
    }
  }, [isLoading, isTabChanging]);

  // 현재 탭에 따라 컴포넌트 렌더링
  const renderTabContent = useMemo(() => {
    // 전체 로딩 상태일 때
    if (isLoading || isTabChanging) {
      return <LoadingState message={`${tab === 'stats' ? '통계' : 
                                      tab === 'fixtures' ? '경기 기록' : 
                                      tab === 'trophies' ? '트로피' : 
                                      tab === 'transfers' ? '이적 기록' : 
                                      tab === 'injuries' ? '부상 기록' : 
                                      tab === 'rankings' ? '순위' : '선수'} 데이터를 불러오는 중...`} />;
    }

    // 에러 상태 처리
    if (error) {
      return <ErrorDisplay message={error} />;
    }

    switch (tab) {
      case 'stats': {
        const statsData = tabsData.stats as { seasons: number[], statistics: PlayerStatistic[] } | undefined;
        const statistics = statsData?.statistics || [];
        
        return (
          <Suspense fallback={<LoadingState message="통계 데이터를 불러오는 중..." />}>
            <StatsTab statistics={statistics} />
          </Suspense>
        );
      }
      
      case 'fixtures': {
        const fixturesData = tabsData.fixtures as { fixtures: { data: FixtureData[], status?: string, message?: string } } | undefined;
        const fixtures = fixturesData?.fixtures || { data: [], status: 'error', message: '경기 기록이 없습니다.' };
        const safeFixtures = {
          data: fixtures?.data || [],
          status: fixtures?.status || 'error',
          message: fixtures?.message || '경기 기록이 없습니다.'
        };
        
        return (
          <Suspense fallback={<LoadingState message="경기 기록을 불러오는 중..." />}>
            <FixturesTab fixturesData={safeFixtures} />
          </Suspense>
        );
      }
      
      case 'trophies': {
        const trophiesData = tabsData.trophies as { trophies: TrophyData[] } | undefined;
        const trophies = trophiesData?.trophies || [];
        
        return (
          <Suspense fallback={<LoadingState message="트로피 정보를 불러오는 중..." />}>
            <TrophiesTab playerId={playerIdNum} trophiesData={trophies} />
          </Suspense>
        );
      }
      
      case 'transfers': {
        const transfersData = tabsData.transfers as { transfers: TransferData[] } | undefined;
        const transfers = transfersData?.transfers || [];
        
        return (
          <Suspense fallback={<LoadingState message="이적 기록을 불러오는 중..." />}>
            <TransfersTab playerId={playerIdNum} transfersData={transfers} />
          </Suspense>
        );
      }
      
      case 'injuries': {
        const injuriesData = tabsData.injuries as { injuries: InjuryData[] } | undefined;
        const injuries = injuriesData?.injuries || [];
        
        return (
          <Suspense fallback={<LoadingState message="부상 기록을 불러오는 중..." />}>
            <InjuriesTab playerId={playerIdNum} injuriesData={injuries} />
          </Suspense>
        );
      }
      
      case 'rankings': {
        const rankingsData = tabsData.rankings as { rankings: RankingsData | undefined } | undefined;
        const rankings = rankingsData?.rankings || {} as RankingsData;
        
        return (
          <Suspense fallback={<LoadingState message="순위 정보를 불러오는 중..." />}>
            <RankingsTab playerId={playerIdNum} rankingsData={rankings} />
          </Suspense>
        );
      }

      default:
        return (
          <div className="p-4 text-center bg-white rounded-lg shadow-sm">
            <p className="text-gray-700">존재하지 않는 탭입니다.</p>
          </div>
        );
    }
  }, [tab, tabsData, playerIdNum, isLoading, isTabChanging, error]);

  return renderTabContent;
} 