'use client';

import { Suspense, useState, useEffect } from 'react';
import PlayerStats from '../components/player-tabs/PlayerStats';
import PlayerFixtures from '../components/player-tabs/PlayerFixtures';
import PlayerTrophies from '../components/player-tabs/PlayerTrophies';
import PlayerTransfers from '../components/player-tabs/PlayerTransfers';
import PlayerInjuries from '../components/player-tabs/PlayerInjuries';
import PlayerRankings from '../components/player-tabs/PlayerRankings';
import { fetchPlayerSeasons, fetchPlayerStats } from '@/app/actions/livescore/player/stats';
import { PlayerStatistic as ImportedPlayerStatistic } from '../types/player';

interface TabContentProps {
  tab: string;
  playerId: string;
}

// TabContent 컴포넌트 내에서 사용할 PlayerStatistic 인터페이스
type PlayerStatistic = ImportedPlayerStatistic;

// 각 탭 컴포넌트를 위한 로딩 컴포넌트
function TabLoading() {
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
}

export default function TabContent({ tab, playerId }: TabContentProps) {
  const [seasons, setSeasons] = useState<number[]>([]);
  const [defaultSeason, setDefaultSeason] = useState<number>(new Date().getFullYear());
  const [playerStats, setPlayerStats] = useState<PlayerStatistic[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mainLeagueId, setMainLeagueId] = useState<number>(0);
  
  // playerId 문자열을 숫자로 변환
  const playerIdNum = parseInt(playerId, 10);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // 선수 시즌 목록 가져오기
        const seasonsData = await fetchPlayerSeasons(playerIdNum);
        setSeasons(seasonsData);
        
        const currentSeason = seasonsData.length > 0 ? seasonsData[0] : new Date().getFullYear();
        setDefaultSeason(currentSeason);
        
        // 통계 데이터 가져오기 (stats 탭에서 필요)
        if (tab === 'stats' || tab === 'overview' || tab === 'rankings') {
          const statsData = await fetchPlayerStats(playerIdNum, currentSeason);
          // 원본 PlayerStatistic[] 타입으로 처리
          setPlayerStats(statsData as PlayerStatistic[]);
          
          // 가장 많이 출전한 리그를 찾아 저장 (rankings 탭에서 필요)
          if (statsData && statsData.length > 0 && tab === 'rankings') {
            const mainLeague = statsData.reduce((prev, current) => {
              const prevAppearances = prev.games?.appearences || 0;
              const currentAppearances = current.games?.appearences || 0;
              return currentAppearances > prevAppearances ? current : prev;
            });
            
            if (mainLeague && mainLeague.league && mainLeague.league.id) {
              setMainLeagueId(mainLeague.league.id);
            }
          }
        }
      } catch (error) {
        console.error('선수 데이터 로딩 에러:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [playerIdNum, tab]);
  
  if (isLoading) {
    return <TabLoading />;
  }

  switch (tab) {
    case 'overview':
      // 오버뷰는 이제 stats 탭으로 리다이렉트
    case 'stats':
      return (
        <Suspense fallback={<TabLoading />}>
          <PlayerStats 
            playerId={playerIdNum} 
            statistics={playerStats}
            preloadedSeasons={seasons}
            preloadedStats={playerStats}
          />
        </Suspense>
      );
    case 'fixtures':
      return (
        <Suspense fallback={<TabLoading />}>
          <PlayerFixtures 
            playerId={playerIdNum} 
            seasons={seasons} 
            initialSeason={defaultSeason} 
          />
        </Suspense>
      );
    case 'trophies':
      return (
        <Suspense fallback={<TabLoading />}>
          <PlayerTrophies playerId={playerIdNum} />
        </Suspense>
      );
    case 'transfers':
      return (
        <Suspense fallback={<TabLoading />}>
          <PlayerTransfers playerId={playerIdNum} />
        </Suspense>
      );
    case 'injuries':
      return (
        <Suspense fallback={<TabLoading />}>
          <PlayerInjuries playerId={playerIdNum} />
        </Suspense>
      );
    case 'rankings':
      return (
        <Suspense fallback={<TabLoading />}>
          <PlayerRankings 
            playerId={playerIdNum} 
            currentLeague={mainLeagueId} // 선수의 기본 리그 ID 전달
          />
        </Suspense>
      );
    default:
      return (
        <div className="p-4 text-center bg-white rounded-lg shadow-sm">
          <p className="text-gray-700">존재하지 않는 탭입니다.</p>
        </div>
      );
  }
} 