'use client';

import { Suspense, memo, useMemo, useEffect, useState } from 'react';
import PlayerStats from '../components/player-tabs/PlayerStats';
import PlayerFixtures from '../components/player-tabs/PlayerFixtures';
import PlayerTrophies from '../components/player-tabs/PlayerTrophies';
import PlayerTransfers from '../components/player-tabs/PlayerTransfers';
import PlayerInjuries from '../components/player-tabs/PlayerInjuries';
import PlayerRankings from '../components/player-tabs/PlayerRankings';
import { LoadingState, EmptyState } from '@/app/livescore/football/components/CommonComponents';
import { usePlayerData, TabType } from '../context/PlayerDataContext';
import { PlayerStatistic, FixtureData, TransferData, InjuryData, TrophyData, RankingsData } from '@/app/livescore/football/player/types/player';

// 탭 로딩 컴포넌트
const TabLoading = memo(function TabLoading() {
  return (
    <div className="p-4 bg-white rounded-lg border">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
});

// 데이터 없음 표시 컴포넌트
const NoDataState = memo(function NoDataState({ tabName }: { tabName: string }) {
  const messages = {
    stats: {
      title: '통계 데이터가 없습니다',
      message: '현재 시즌 또는 이전 시즌의 통계 데이터를 찾을 수 없습니다.'
    },
    fixtures: {
      title: '경기 기록이 없습니다',
      message: '현재 시즌 또는 이전 시즌의 경기 기록을 찾을 수 없습니다.'
    },
    trophies: {
      title: '트로피 기록이 없습니다',
      message: '이 선수의 트로피 기록 정보를 찾을 수 없습니다.'
    },
    transfers: {
      title: '이적 기록이 없습니다',
      message: '이 선수의 이적 기록 정보를 찾을 수 없습니다.'
    },
    injuries: {
      title: '부상 기록이 없습니다',
      message: '이 선수의 부상 기록 정보를 찾을 수 없습니다.'
    },
    rankings: {
      title: '순위 정보가 없습니다',
      message: '이 선수의 순위 정보를 찾을 수 없습니다.'
    }
  };

  const defaultMessage = {
    title: '데이터가 없습니다',
    message: '표시할 데이터를 찾을 수 없습니다.'
  };

  const { title, message } = messages[tabName as keyof typeof messages] || defaultMessage;
  
  return <EmptyState title={title} message={message} />;
});

// 각 탭 컴포넌트를 개별적으로 메모이제이션하여 최적화
const StatsTab = memo(function StatsTab({ 
  statistics, 
  seasons 
}: { 
  statistics: PlayerStatistic[],
  seasons: number[] 
}) {
  return (
    <PlayerStats 
      statistics={statistics} 
      preloadedSeasons={seasons} 
      preloadedStats={statistics} 
    />
  );
});

const FixturesTab = memo(function FixturesTab({ 
  seasons, 
  fixturesData,
  currentSeason
}: { 
  seasons: number[], 
  fixturesData: { data: FixtureData[] },
  currentSeason: number
}) {
  return (
    <PlayerFixtures 
      seasons={seasons} 
      fixturesData={fixturesData}
      initialSeason={currentSeason} 
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

const TabContent = memo(function TabContent() {
  // 컨텍스트에서 필요한 데이터 및 상태 가져오기
  const {
    playerId,
    currentTab: tab,
    tabsData,
    isLoading,
    loadPlayerData,
    tabsLoaded
  } = usePlayerData();
  
  // 탭 변경 시 데이터 로드 상태 추적을 위한 로컬 상태
  const [isTabLoading, setIsTabLoading] = useState(false);
  
  // 플레이어 ID를 숫자로 변환
  const playerIdNum = playerId ? parseInt(playerId, 10) : 0;
  
  // 현재 탭에 해당하는 캐시된 데이터 가져오기
  const cachedTabData = tabsData[tab as TabType];
  
  // 현재 시즌 계산 함수 - API에서 데이터가 있는 가장 최신 시즌 반환
  const currentSeason = useMemo(() => {
    // 스탯 탭 데이터에서 시즌 정보 가져오기
    const seasons = tabsData.stats ? (tabsData.stats as { seasons: number[] }).seasons : [];
    
    // 시즌 데이터가 있으면 첫 번째(가장 최신) 시즌 사용
    if (seasons && seasons.length > 0) {
      return seasons[0];
    }
    
    // 없으면 현재 날짜 기반으로 계산
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    // 7월 이후면 해당 연도, 아니면 이전 연도를 시즌으로 사용
    return month >= 6 ? year : year - 1;
  }, [tabsData.stats]);

  // 필요한 데이터만 로드하는 useEffect 최적화
  useEffect(() => {
    // 플레이어 ID가 없으면 로드하지 않음
    if (!playerId) return;

    // 이미 로드된 탭은 다시 로드하지 않음
    if (tabsLoaded[tab]) return;
    
    // 현재 탭 타입
    const currentTabType = tab as TabType;
    
    // 현재 탭에 해당하는 데이터 가져오기
    const currentTabData = tabsData[currentTabType];
    
    // 로딩 필요 여부 확인
    let needsData = false;
    
    if (!currentTabData) {
      // 해당 탭 데이터가 아예 없는 경우
      needsData = true;
    } else {
      // 각 탭에 따라 데이터 유효성 검사
      switch (currentTabType) {
        case 'stats':
          needsData = !(currentTabData as { seasons: number[], statistics: PlayerStatistic[] }).statistics?.length;
          break;
        case 'fixtures':
          needsData = !(currentTabData as { fixtures: { data: FixtureData[] } }).fixtures?.data?.length;
          break;
        case 'trophies':
          needsData = !(currentTabData as { trophies: TrophyData[] }).trophies?.length;
          break;
        case 'transfers':
          needsData = !(currentTabData as { transfers: TransferData[] }).transfers?.length;
          break;
        case 'injuries':
          needsData = !(currentTabData as { injuries: InjuryData[] }).injuries?.length;
          break;
        case 'rankings':
          needsData = !(currentTabData as { rankings: RankingsData }).rankings;
          break;
      }
    }

    // 데이터가 필요한 경우에만 로드
    if (needsData) {
      const loadData = async () => {
        setIsTabLoading(true);
        await loadPlayerData(playerId, currentTabType);
        setIsTabLoading(false);
      };
      
      loadData();
    }
  }, [playerId, tab, tabsData, loadPlayerData, tabsLoaded]);

  // 현재 탭에 따라 컴포넌트 렌더링 - 메모를 사용하여 불필요한 재렌더링 방지
  const tabContent = useMemo(() => {
    // 전역 로딩 상태 또는 현재 탭 로딩 상태 확인
    const showLoading = isLoading || isTabLoading;
    
    if (showLoading) {
      return (
        <LoadingState message={`${tab === 'stats' ? '통계' : 
          tab === 'fixtures' ? '경기 기록' : 
          tab === 'trophies' ? '트로피' : 
          tab === 'transfers' ? '이적 기록' : 
          tab === 'injuries' ? '부상 기록' : 
          tab === 'rankings' ? '순위' : '선수'} 데이터를 불러오는 중...`} />
      );
    }

    // 캐시된 데이터가 없으면 로딩 상태 표시
    if (!cachedTabData) {
      return <TabLoading />;
    }

    switch (tab) {
      case 'stats': {
        const { seasons, statistics } = cachedTabData as { seasons: number[], statistics: PlayerStatistic[] };
        return statistics && statistics.length > 0 ? (
          <StatsTab 
            statistics={statistics} 
            seasons={seasons} 
          />
        ) : (
          <NoDataState tabName="stats" />
        );
      }
      
      case 'fixtures': {
        const { fixtures } = cachedTabData as { fixtures: { data: FixtureData[] } };
        // stats 탭에서 시즌 정보를 가져오거나, 없으면 빈 배열 사용
        const seasons = tabsData.stats ? (tabsData.stats as { seasons: number[] }).seasons : [];
        
        return fixtures && fixtures.data && fixtures.data.length > 0 ? (
          <FixturesTab 
            seasons={seasons} 
            fixturesData={fixtures}
            currentSeason={currentSeason} 
          />
        ) : (
          <NoDataState tabName="fixtures" />
        );
      }
      
      case 'trophies': {
        const { trophies } = cachedTabData as { trophies: TrophyData[] };
        return trophies && trophies.length > 0 ? (
          <TrophiesTab 
            playerId={playerIdNum} 
            trophiesData={trophies} 
          />
        ) : (
          <NoDataState tabName="trophies" />
        );
      }
      
      case 'transfers': {
        const { transfers } = cachedTabData as { transfers: TransferData[] };
        return transfers && transfers.length > 0 ? (
          <TransfersTab 
            playerId={playerIdNum} 
            transfersData={transfers} 
          />
        ) : (
          <NoDataState tabName="transfers" />
        );
      }
      
      case 'injuries': {
        const { injuries } = cachedTabData as { injuries: InjuryData[] };
        return injuries && injuries.length > 0 ? (
          <InjuriesTab 
            playerId={playerIdNum} 
            injuriesData={injuries} 
          />
        ) : (
          <NoDataState tabName="injuries" />
        );
      }
      
      case 'rankings': {
        const { rankings } = cachedTabData as { rankings: RankingsData };
        return rankings && Object.keys(rankings).length > 0 ? (
          <RankingsTab 
            playerId={playerIdNum}
            rankingsData={rankings}
          />
        ) : (
          <NoDataState tabName="rankings" />
        );
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
    tabsData.stats,
    currentSeason, 
    playerIdNum,
    isLoading,
    isTabLoading
  ]);

  return (
    <Suspense fallback={<TabLoading />}>
      {tabContent}
    </Suspense>
  );
});

export default TabContent; 