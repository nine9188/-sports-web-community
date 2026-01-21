'use client';

import { Suspense, memo, useMemo } from 'react';
import { LoadingState } from '@/domains/livescore/components/common/CommonComponents';
import { usePlayerTabData, PlayerTabType } from '@/domains/livescore/hooks';
import { PlayerFullDataResponse } from '@/domains/livescore/actions/player/data';
import { PlayerStatistic, FixtureData, TransferData, InjuryData, TrophyData, RankingsData } from '@/domains/livescore/types/player';
import PlayerStats from './tabs/PlayerStats';
import PlayerFixtures from './tabs/PlayerFixtures';
import PlayerTrophies from './tabs/PlayerTrophies';
import PlayerTransfers from './tabs/PlayerTransfers';
import PlayerInjuries from './tabs/PlayerInjuries';
import PlayerRankings from './tabs/PlayerRankings';

// ============================================
// 탭 컴포넌트들 (메모이제이션)
// ============================================

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
    <div className="p-4 text-center bg-white dark:bg-[#1D1D1D] rounded-lg shadow-sm">
      <p className="text-red-600 dark:text-red-400">오류: {message}</p>
    </div>
  );
});

// ============================================
// Props 타입
// ============================================

interface TabContentProps {
  playerId: string;
  currentTab: PlayerTabType;
  initialData?: Partial<PlayerFullDataResponse>;
}

// ============================================
// 메인 컴포넌트
// ============================================

export default function TabContent({
  playerId,
  currentTab,
  initialData
}: TabContentProps) {
  // React Query 훅으로 데이터 관리
  const {
    statsData,
    fixturesData,
    transfersData,
    trophiesData,
    injuriesData,
    rankingsData,
    isLoading,
    error,
  } = usePlayerTabData({
    playerId,
    currentTab,
    initialData,
  });

  // 플레이어 ID를 숫자로 변환
  const playerIdNum = parseInt(playerId, 10);

  // 탭 이름 매핑
  const tabNameMap: Record<PlayerTabType, string> = {
    stats: '통계',
    fixtures: '경기 기록',
    trophies: '트로피',
    transfers: '이적 기록',
    injuries: '부상 기록',
    rankings: '순위',
  };

  // 현재 탭에 따라 컴포넌트 렌더링
  const renderTabContent = useMemo(() => {
    // 로딩 상태일 때
    if (isLoading) {
      return <LoadingState message={`${tabNameMap[currentTab]} 데이터를 불러오는 중...`} />;
    }

    // 에러 상태 처리
    if (error) {
      return <ErrorDisplay message={error.message} />;
    }

    switch (currentTab) {
      case 'stats': {
        const statistics = statsData?.statistics || [];
        return (
          <Suspense fallback={<LoadingState message="통계 데이터를 불러오는 중..." />}>
            <StatsTab statistics={statistics} />
          </Suspense>
        );
      }

      case 'fixtures': {
        const fixtures = fixturesData || { data: [], status: 'error', message: '경기 기록이 없습니다.' };
        return (
          <Suspense fallback={<LoadingState message="경기 기록을 불러오는 중..." />}>
            <FixturesTab fixturesData={fixtures} />
          </Suspense>
        );
      }

      case 'trophies': {
        const trophies = trophiesData || [];
        return (
          <Suspense fallback={<LoadingState message="트로피 정보를 불러오는 중..." />}>
            <TrophiesTab playerId={playerIdNum} trophiesData={trophies} />
          </Suspense>
        );
      }

      case 'transfers': {
        const transfers = transfersData || [];
        return (
          <Suspense fallback={<LoadingState message="이적 기록을 불러오는 중..." />}>
            <TransfersTab playerId={playerIdNum} transfersData={transfers} />
          </Suspense>
        );
      }

      case 'injuries': {
        const injuries = injuriesData || [];
        return (
          <Suspense fallback={<LoadingState message="부상 기록을 불러오는 중..." />}>
            <InjuriesTab playerId={playerIdNum} injuriesData={injuries} />
          </Suspense>
        );
      }

      case 'rankings': {
        const rankings = rankingsData || {} as RankingsData;
        return (
          <Suspense fallback={<LoadingState message="순위 정보를 불러오는 중..." />}>
            <RankingsTab playerId={playerIdNum} rankingsData={rankings} />
          </Suspense>
        );
      }

      default:
        return (
          <div className="p-4 text-center bg-white dark:bg-[#1D1D1D] rounded-lg shadow-sm">
            <p className="text-gray-700 dark:text-gray-300">존재하지 않는 탭입니다.</p>
          </div>
        );
    }
  }, [currentTab, statsData, fixturesData, transfersData, trophiesData, injuriesData, rankingsData, playerIdNum, isLoading, error, tabNameMap]);

  return renderTabContent;
}
