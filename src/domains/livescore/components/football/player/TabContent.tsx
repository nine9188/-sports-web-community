'use client';

import { memo, useMemo } from 'react';
import { usePlayerTabData, PlayerTabType } from '@/domains/livescore/hooks';
import { PlayerFullDataResponse } from '@/domains/livescore/actions/player/data';
import { PlayerStatistic, FixtureData, TransferData, InjuryData, TrophyData, RankingsData } from '@/domains/livescore/types/player';
import PlayerStats from './tabs/PlayerStats';
import PlayerFixtures from './tabs/PlayerFixtures';
import PlayerTrophies from './tabs/PlayerTrophies';
import PlayerTransfers from './tabs/PlayerTransfers';
import PlayerInjuries from './tabs/PlayerInjuries';
import PlayerRankings from './tabs/PlayerRankings';
import SidebarRelatedPosts from '@/domains/sidebar/components/SidebarRelatedPosts';
import { Container, ContainerHeader, ContainerTitle, ContainerContent } from '@/shared/components/ui';

// ============================================
// 탭 컴포넌트들 (메모이제이션)
// ============================================

const StatsTab = memo(function StatsTab({
  statistics,
  teamLogoUrls = {},
  leagueLogoUrls = {},
  leagueLogoDarkUrls = {}
}: {
  statistics: PlayerStatistic[];
  teamLogoUrls?: Record<number, string>;
  leagueLogoUrls?: Record<number, string>;
  leagueLogoDarkUrls?: Record<number, string>;
}) {
  return (
    <PlayerStats
      statistics={statistics}
      teamLogoUrls={teamLogoUrls}
      leagueLogoUrls={leagueLogoUrls}
      leagueLogoDarkUrls={leagueLogoDarkUrls}
    />
  );
});

const FixturesTab = memo(function FixturesTab({
  playerId,
  fixturesData
}: {
  playerId: number;
  fixturesData: {
    data: FixtureData[];
    status?: string;
    message?: string;
    completeness?: {
      total: number;
      success: number;
      failed: number;
      failedFixtureIds?: number[];
    };
    teamLogoUrls?: Record<number, string>;
    leagueLogoUrls?: Record<number, string>;
    leagueLogoDarkUrls?: Record<number, string>;
  }
}) {
  const safeFixturesData = useMemo(() => ({
    data: fixturesData?.data || [],
    status: fixturesData?.status || 'error',
    message: fixturesData?.message || '경기 기록이 없습니다.'
  }), [fixturesData]);

  return (
    <PlayerFixtures
      playerId={playerId}
      fixturesData={{
        ...safeFixturesData,
        completeness: fixturesData?.completeness,
      }}
      teamLogoUrls={fixturesData?.teamLogoUrls || {}}
      leagueLogoUrls={fixturesData?.leagueLogoUrls || {}}
      leagueLogoDarkUrls={fixturesData?.leagueLogoDarkUrls || {}}
    />
  );
});

const TrophiesTab = memo(function TrophiesTab({
  playerId,
  trophiesData,
  leagueLogoUrls = {},
  leagueLogoDarkUrls = {}
}: {
  playerId: number;
  trophiesData: TrophyData[];
  leagueLogoUrls?: Record<number, string>;
  leagueLogoDarkUrls?: Record<number, string>;
}) {
  return (
    <PlayerTrophies
      playerId={playerId}
      trophiesData={trophiesData}
      leagueLogoUrls={leagueLogoUrls}
      leagueLogoDarkUrls={leagueLogoDarkUrls}
    />
  );
});

const TransfersTab = memo(function TransfersTab({
  playerId,
  transfersData,
  teamLogoUrls = {}
}: {
  playerId: number;
  transfersData: TransferData[];
  teamLogoUrls?: Record<number, string>;
}) {
  return (
    <PlayerTransfers
      playerId={playerId}
      transfersData={transfersData}
      teamLogoUrls={teamLogoUrls}
    />
  );
});

const InjuriesTab = memo(function InjuriesTab({
  playerId,
  injuriesData,
  teamLogoUrls = {}
}: {
  playerId: number;
  injuriesData: InjuryData[];
  teamLogoUrls?: Record<number, string>;
}) {
  return (
    <PlayerInjuries
      playerId={playerId}
      injuriesData={injuriesData}
      teamLogoUrls={teamLogoUrls}
    />
  );
});

const RankingsTab = memo(function RankingsTab({
  playerId, rankingsData, playerKoreanNames = {}, leagueId
}: {
  playerId: number, rankingsData: RankingsData, playerKoreanNames?: Record<number, string | null>, leagueId?: number
}) {
  return (
    <PlayerRankings
      playerId={playerId}
      leagueId={leagueId}
      rankingsData={rankingsData}
      playerKoreanNames={playerKoreanNames}
      playerPhotoUrls={rankingsData.playerPhotoUrls}
      teamLogoUrls={rankingsData.teamLogoUrls}
    />
  );
});

// 오류 표시 컴포넌트
const ErrorDisplay = memo(function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="p-4 text-center bg-white dark:bg-[#1D1D1D] rounded-lg shadow-sm">
      <p className="text-red-600 dark:text-red-400">오류: {message}</p>
    </div>
  );
});

export const PlayerTabLoadingDisplay = memo(function PlayerTabLoadingDisplay({ title }: { title: string }) {
  return (
    <Container>
      <ContainerHeader>
        <ContainerTitle>{title}</ContainerTitle>
      </ContainerHeader>
      <ContainerContent>
        <p className="py-2 text-center text-sm text-gray-500 dark:text-gray-400">
          불러오는 중...
        </p>
      </ContainerContent>
    </Container>
  );
});

const TAB_NAME_MAP: Record<PlayerTabType, string> = {
  stats: '통계',
  fixtures: '경기 기록',
  trophies: '트로피',
  transfers: '이적 기록',
  injuries: '부상 기록',
  rankings: '순위',
};

export function PlayerTabLoading({ tab }: { tab: PlayerTabType }) {
  if (tab === 'rankings') {
    return <RankingsTabLoading />;
  }

  return (
    <PlayerTabLoadingDisplay
      title={TAB_NAME_MAP[tab]}
    />
  );
}

const rankingLoadingTabs = ['최다 득점', '최다 어시스트', '최다 득점 경기', '최소 출전 시간', '경고', '퇴장'];

function RankingsTabLoading() {
  return (
    <div className="space-y-4">
      <div className="mb-4">
        <div className="flex overflow-x-auto overflow-hidden border border-black/7 bg-[#F5F5F5] no-scrollbar dark:border-0 dark:bg-[#262626] md:rounded-lg">
          {rankingLoadingTabs.map((tab, index) => (
            <div
              key={tab}
              className={`flex h-12 flex-1 items-center justify-center whitespace-nowrap px-3 text-xs font-medium ${
                index === 0
                  ? 'border-b-2 border-[#002FA7] bg-white font-semibold text-gray-900 dark:bg-[#1D1D1D] dark:text-[#F0F0F0]'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {tab}
            </div>
          ))}
        </div>
      </div>
      <Container>
        <ContainerContent>
          <p className="py-2 text-center text-sm text-gray-500 dark:text-gray-400">
            순위 데이터를 불러오는 중...
          </p>
        </ContainerContent>
      </Container>
    </div>
  );
}

// ============================================
// Props 타입
// ============================================

interface TabContentProps {
  playerId: string;
  currentTab: PlayerTabType;
  initialData?: Partial<PlayerFullDataResponse>;
  rankingsKoreanNames?: Record<number, string | null>;
}

// ============================================
// 메인 컴포넌트
// ============================================

export default function TabContent({
  playerId,
  currentTab,
  initialData,
  rankingsKoreanNames = {}
}: TabContentProps) {
  // React Query 훅으로 데이터 관리
  const {
    statsData,
    fixturesData,
    transfersData,
    trophiesData,
    injuriesData,
    rankingsData,
    trophiesLeagueLogoUrls,
    trophiesLeagueLogoDarkUrls,
    transfersTeamLogoUrls,
    injuriesTeamLogoUrls,
    isLoading,
    error,
  } = usePlayerTabData({
    playerId,
    currentTab,
    initialData,
  });

  // 플레이어 ID를 숫자로 변환
  const playerIdNum = parseInt(playerId, 10);

  const hasCurrentTabData = useMemo(() => {
    switch (currentTab) {
      case 'stats':
        return Boolean(statsData?.statistics?.length);
      case 'fixtures':
        return Boolean(fixturesData);
      case 'trophies':
        return trophiesData !== null;
      case 'transfers':
        return transfersData !== null;
      case 'injuries':
        return injuriesData !== null;
      case 'rankings':
        return rankingsData !== null;
      default:
        return false;
    }
  }, [currentTab, statsData, fixturesData, transfersData, trophiesData, injuriesData, rankingsData]);

  // 현재 탭에 따라 컴포넌트 렌더링
  const renderTabContent = useMemo(() => {
    // 에러 상태 처리
    if (error) {
      return <ErrorDisplay message={error.message} />;
    }

    if (isLoading && !hasCurrentTabData) {
      return <PlayerTabLoading tab={currentTab} />;
    }

    switch (currentTab) {
      case 'stats': {
        const statistics = statsData?.statistics || [];
        return (
          <>
            <div className="xl:hidden mb-4">
              <SidebarRelatedPosts />
            </div>
            <StatsTab
              statistics={statistics}
              teamLogoUrls={statsData?.teamLogoUrls || {}}
              leagueLogoUrls={statsData?.leagueLogoUrls || {}}
              leagueLogoDarkUrls={statsData?.leagueLogoDarkUrls || {}}
            />
          </>
        );
      }

      case 'fixtures': {
        const fixtures = fixturesData || { data: [], status: 'error', message: '경기 기록이 없습니다.' };
        return <FixturesTab playerId={playerIdNum} fixturesData={fixtures} />;
      }

      case 'trophies': {
        const trophies = trophiesData || [];
        return (
          <TrophiesTab
            playerId={playerIdNum}
            trophiesData={trophies}
            leagueLogoUrls={trophiesLeagueLogoUrls}
            leagueLogoDarkUrls={trophiesLeagueLogoDarkUrls}
          />
        );
      }

      case 'transfers': {
        const transfers = transfersData || [];
        return (
          <TransfersTab
            playerId={playerIdNum}
            transfersData={transfers}
            teamLogoUrls={transfersTeamLogoUrls}
          />
        );
      }

      case 'injuries': {
        const injuries = injuriesData || [];
        return (
          <InjuriesTab
            playerId={playerIdNum}
            injuriesData={injuries}
            teamLogoUrls={injuriesTeamLogoUrls}
          />
        );
      }

      case 'rankings': {
        const rankings = rankingsData || {} as RankingsData;
        const currentLeagueId = initialData?.playerData?.statistics?.[0]?.league?.id;
        return <RankingsTab playerId={playerIdNum} rankingsData={rankings} playerKoreanNames={rankingsKoreanNames} leagueId={currentLeagueId} />;
      }

      default:
        return (
          <div className="p-4 text-center bg-white dark:bg-[#1D1D1D] rounded-lg shadow-sm">
            <p className="text-gray-700 dark:text-gray-300">존재하지 않는 탭입니다.</p>
          </div>
        );
    }
  }, [
    currentTab,
    statsData,
    fixturesData,
    transfersData,
    trophiesData,
    injuriesData,
    rankingsData,
    trophiesLeagueLogoUrls,
    trophiesLeagueLogoDarkUrls,
    transfersTeamLogoUrls,
    injuriesTeamLogoUrls,
    playerIdNum,
    error,
    isLoading,
    hasCurrentTabData,
    initialData,
    rankingsKoreanNames,
  ]);

  return renderTabContent;
}
