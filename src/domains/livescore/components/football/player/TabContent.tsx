'use client';

import { Suspense, memo, useMemo } from 'react';
import { LoadingState } from '@/domains/livescore/components/common/CommonComponents';
import { usePlayerData, TabType } from './context/PlayerDataContext';
import { PlayerStatistic, FixtureData, TransferData, InjuryData, TrophyData, RankingsData } from '@/domains/livescore/types/player';
import PlayerStats from './tabs/PlayerStats';
import PlayerFixtures from './tabs/PlayerFixtures';
import PlayerTrophies from './tabs/PlayerTrophies';
import PlayerTransfers from './tabs/PlayerTransfers';
import PlayerInjuries from './tabs/PlayerInjuries';
import PlayerRankings from './tabs/PlayerRankings';

// 탭 로딩 컴포넌트
const TabLoading = memo(function TabLoading() {
  return (
    <div className="p-4 text-center bg-white rounded-lg border">
      <div className="py-4">
        <p className="text-gray-500">데이터를 불러오는 중입니다...</p>
      </div>
    </div>
  );
});

// 각 탭 컴포넌트를 개별적으로 메모이제이션하여 최적화
const StatsTab = memo(function StatsTab({ 
  statistics
}: { 
  statistics: PlayerStatistic[]
}) {
  return (
    <PlayerStats 
      statistics={statistics} 
    />
  );
});

const FixturesTab = memo(function FixturesTab({ 
  fixturesData
}: { 
  fixturesData: { 
    data: FixtureData[]; 
    status?: string; 
    message?: string;
  }
}) {
  // fixtures 데이터가 undefined이거나 null인 경우 빈 배열로 초기화
  const safeFixturesData = useMemo(() => ({
    data: fixturesData?.data || [],
    status: fixturesData?.status || 'error',
    message: fixturesData?.message || '경기 기록이 없습니다.'
  }), [fixturesData]);
  
  return (
    <PlayerFixtures 
      fixturesData={safeFixturesData}
    />
  );
});

const TrophiesTab = memo(function TrophiesTab({ 
  playerId, 
  trophiesData 
}: { 
  playerId: number, 
  trophiesData: TrophyData[] 
}) {
  return (
    <PlayerTrophies 
      playerId={playerId} 
      trophiesData={trophiesData} 
    />
  );
});

const TransfersTab = memo(function TransfersTab({ 
  playerId, 
  transfersData 
}: { 
  playerId: number, 
  transfersData: TransferData[] 
}) {
  return (
    <PlayerTransfers 
      playerId={playerId} 
      transfersData={transfersData} 
    />
  );
});

const InjuriesTab = memo(function InjuriesTab({ 
  playerId, 
  injuriesData 
}: { 
  playerId: number, 
  injuriesData: InjuryData[] 
}) {
  return (
    <PlayerInjuries 
      playerId={playerId} 
      injuriesData={injuriesData} 
    />
  );
});

const RankingsTab = memo(function RankingsTab({ 
  playerId, 
  rankingsData 
}: { 
  playerId: number, 
  rankingsData: RankingsData 
}) {
  return (
    <PlayerRankings 
      playerId={playerId}
      rankingsData={rankingsData}
    />
  );
});

// 오류 표시 컴포넌트 (메모이제이션)
const ErrorDisplay = memo(function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="p-4 text-center bg-white rounded-lg shadow-sm">
      <p className="text-red-600">오류: {message}</p>
    </div>
  );
});

// 탭 컨텐츠 표시
const TabContent = memo(function TabContent() {
  // 컨텍스트에서 필요한 데이터 및 상태 가져오기
  const {
    playerId,
    currentTab: tab,
    tabsData,
    isLoading,
    error
  } = usePlayerData();
  
  // 플레이어 ID를 숫자로 변환
  const playerIdNum = playerId ? parseInt(playerId, 10) : 0;
  
  // 현재 탭에 해당하는 캐시된 데이터 가져오기
  const cachedTabData = tabsData[tab as TabType];
  
  // 개발 모드에서만 로그 출력
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[TabContent] 렌더링 - 탭: ${tab}, 로딩: ${isLoading}, 데이터 있음: ${!!cachedTabData}`);
  }

  // 현재 탭에 따라 컴포넌트 렌더링 - 메모를 사용하여 불필요한 재렌더링 방지
  const tabContent = useMemo(() => {
    // 오류가 있으면 오류 메시지 표시
    if (error) {
      return <ErrorDisplay message={error} />;
    }
    
    // 전역 로딩 상태 확인
    if (isLoading) {
      const loadingMessage = `${tab === 'stats' ? '통계' : 
        tab === 'fixtures' ? '경기 기록' : 
        tab === 'trophies' ? '트로피' : 
        tab === 'transfers' ? '이적 기록' : 
        tab === 'injuries' ? '부상 기록' : 
        tab === 'rankings' ? '순위' : '선수'} 데이터를 불러오는 중...`;
      
      return <LoadingState message={loadingMessage} />;
    }

    // 캐시된 데이터가 없으면 로딩 상태 표시
    if (!cachedTabData) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[TabContent] ${tab} 탭 데이터 없음`);
      }
      return <TabLoading />;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[TabContent] ${tab} 탭 데이터 표시`, cachedTabData);
    }

    switch (tab) {
      case 'stats': {
        const { statistics } = cachedTabData as { seasons: number[], statistics: PlayerStatistic[] };
        return <StatsTab statistics={statistics || []} />;
      }
      
      case 'fixtures': {
        const { fixtures } = cachedTabData as { fixtures: { data: FixtureData[]; status?: string; message?: string; } };
        
        if (process.env.NODE_ENV !== 'production') {
          console.log("[TabContent] fixtures 데이터:", fixtures);
        }
        
        // fixtures나 fixtures.data가 undefined/null인 경우 빈 배열로 초기화하고 적절한 상태/메시지 설정
        const safeFixtures = {
          data: fixtures?.data || [],
          status: fixtures?.status || 'error',
          message: fixtures?.message || '경기 기록이 없습니다.'
        };
        
        // 항상 FixturesTab 컴포넌트를 렌더링 (내부적으로 EmptyState 처리)
        return <FixturesTab fixturesData={safeFixtures} />;
      }
      
      case 'trophies': {
        const { trophies } = cachedTabData as { trophies: TrophyData[] };
        return <TrophiesTab playerId={playerIdNum} trophiesData={trophies || []} />;
      }
      
      case 'transfers': {
        const { transfers } = cachedTabData as { transfers: TransferData[] };
        return <TransfersTab playerId={playerIdNum} transfersData={transfers || []} />;
      }
      
      case 'injuries': {
        const { injuries } = cachedTabData as { injuries: InjuryData[] };
        
        if (process.env.NODE_ENV !== 'production') {
          console.log("[TabContent] 부상 데이터:", injuries);
          console.log("[TabContent] 부상 데이터 길이:", injuries?.length || 0);
          console.log("[TabContent] 부상 데이터 타입:", typeof injuries);
        }
        
        return <InjuriesTab playerId={playerIdNum} injuriesData={injuries || []} />;
      }
      
      case 'rankings': {
        const { rankings } = cachedTabData as { rankings: RankingsData | undefined };
        return <RankingsTab playerId={playerIdNum} rankingsData={rankings || {} as RankingsData} />;
      }

      default:
        return (
          <div className="p-4 text-center bg-white rounded-lg shadow-sm">
            <p className="text-gray-700">존재하지 않는 탭입니다.</p>
          </div>
        );
    }
  }, [
    tab, 
    cachedTabData,
    playerIdNum,
    isLoading,
    error
  ]);

  // Suspense 경계를 통해 로딩 상태 처리 (비동기 데이터 로딩시 대체 UI 표시)
  return (
    <Suspense fallback={<TabLoading />}>
      {tabContent}
    </Suspense>
  );
});

export default TabContent; 