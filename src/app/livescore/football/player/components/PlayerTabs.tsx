'use client';

import { useState } from 'react';
import classNames from 'classnames';
import dynamic from 'next/dynamic';
import { PlayerData } from '../../types/player';

// 필요한 인터페이스 정의
interface Trophy {
  league: string;
  country: string;
  place: string;
  season: string;
  leagueLogo: string | null;
}

interface Transfer {
  date: string;
  type: string;
  teams: {
    from: {
      id: number;
      name: string;
      logo: string;
    };
    to: {
      id: number;
      name: string;
      logo: string;
    };
  };
}

interface Injury {
  fixture: {
    date: string;
  };
  league: {
    name: string;
    season: string;
  };
  team: {
    name: string;
    logo: string;
  };
  type: string;
  reason: string;
}

interface FixtureData {
  fixture: {
    id: number;
    date: string;
  };
  league: {
    id: number;
    name: string;
    logo: string;
    country: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
    };
    away: {
      id: number;
      name: string;
      logo: string;
    };
    playerTeamId: number | null;
  };
  goals: {
    home: string;
    away: string;
  };
  statistics?: {
    games?: {
      minutes?: number;
      rating?: string;
    };
    goals?: {
      total?: number;
      assists?: number;
    };
    shots?: {
      total?: number;
      on?: number;
    };
    passes?: {
      total?: number;
      key?: number;
    };
  };
}

interface FixturesResponse {
  data: FixtureData[];
}

// 선수 순위 데이터 인터페이스
interface Player {
  id: number;
  name: string;
  photo: string;
}

interface TeamRanking {
  id: number;
  name: string;
  logo: string;
}

interface StatisticRanking {
  team: TeamRanking;
  games: {
    appearences?: number;
    minutes?: number;
  };
  goals: {
    total?: number;
    assists?: number;
  };
  cards: {
    yellow?: number;
    red?: number;
  };
}

interface PlayerRanking {
  player: Player;
  statistics: StatisticRanking[];
}

interface RankingsData {
  topScorers?: PlayerRanking[];
  topAssists?: PlayerRanking[];
  mostGamesScored?: PlayerRanking[];
  leastPlayTime?: PlayerRanking[];
  topRedCards?: PlayerRanking[];
  topYellowCards?: PlayerRanking[];
}

interface StatisticsData {
  team: {
    id: number;
    name: string;
    logo: string;
  };
  league: {
    id: number;
    name: string;
    country: string;
    season?: number;
  };
  games: {
    appearences?: number;
    lineups?: number;
    minutes?: number;
    position?: string;
    rating?: string;
  };
  goals: {
    total?: number;
    conceded?: number;
    assists?: number;
    saves?: number;
    cleansheets?: number;
  };
  shots: {
    total?: number;
    on?: number;
  };
  passes: {
    total?: number;
    key?: number;
    accuracy?: string;
    cross?: number;
  };
  dribbles?: {
    attempts?: number;
    success?: number;
  };
  duels?: {
    total?: number;
    won?: number;
  };
  tackles?: {
    total?: number;
    blocks?: number;
    interceptions?: number;
    clearances?: number;
  };
  fouls?: {
    drawn?: number;
    committed?: number;
  };
  cards?: {
    yellow?: number;
    red?: number;
  };
  penalty?: {
    scored?: number;
    missed?: number;
    saved?: number;
  };
}

interface Tab {
  id: string;
  label: string;
}

interface PlayerTabsProps {
  player: PlayerData;
  trophies: Trophy[];
  transfers: Transfer[];
  injuries: Injury[];
  seasons: number[];
  fixtures: FixturesResponse;
  rankings: RankingsData;
  statsData: StatisticsData[];
}

const tabs: Tab[] = [
  { id: 'trophies', label: '트로피' },
  { id: 'transfers', label: '이적 기록' },
  { id: 'stats', label: '통계' },
  { id: 'fixtures', label: '경기별 통계' },
  { id: 'injuries', label: '부상 기록' },
  { id: 'rankings', label: '리그 순위' },
];

// 동적 임포트로 탭 컴포넌트 로드
const PlayerTransfers = dynamic(() => import('./player-tabs/PlayerTransfers'));
const PlayerStats = dynamic(() => import('./player-tabs/PlayerStats'));
const PlayerTrophies = dynamic(() => import('./player-tabs/PlayerTrophies'));
const PlayerInjuries = dynamic(() => import('./player-tabs/PlayerInjuries'));
const PlayerFixtures = dynamic(() => import('./player-tabs/PlayerFixtures'));
const PlayerRankings = dynamic(() => import('./player-tabs/PlayerRankings'));

// StatisticsData를 PlayerStatistic으로 변환하는 함수
const convertStatisticsToPlayerStatistic = (stats: StatisticsData[] | undefined) => {
  if (!stats || !Array.isArray(stats)) return [];
  
  return stats.map(stat => ({
    ...stat,
    league: {
      ...stat.league,
      logo: '', // logo 필드 추가 (없으면 빈 문자열)
    },
    // 누락된 필드가 있을 경우 기본값 추가
    dribbles: stat.dribbles || { attempts: 0, success: 0 },
    duels: stat.duels || { total: 0, won: 0 },
    tackles: stat.tackles || { total: 0, blocks: 0, interceptions: 0, clearances: 0 },
    fouls: stat.fouls || { drawn: 0, committed: 0 },
    cards: stat.cards || { yellow: 0, red: 0 },
    penalty: stat.penalty || { scored: 0, missed: 0, saved: 0 }
  }));
};

export default function PlayerTabs({ 
  player, 
  trophies, 
  transfers, 
  injuries, 
  seasons, 
  fixtures, 
  rankings,
  statsData
}: PlayerTabsProps) {
  const [activeTab, setActiveTab] = useState('stats');
  
  const currentYear = new Date().getFullYear();
  const defaultSeason = currentYear > 2024 ? 2024 : currentYear;

  // 안전하게 player.statistics 참조
  const playerStatistics = player.statistics || [];
  
  // statsData를 PlayerStatistic 타입으로 변환
  const convertedStatsData = convertStatisticsToPlayerStatistic(statsData);
  
  const renderContent = () => {
    if (!player?.info?.id) {
      return <div>선수 정보를 불러올 수 없습니다.</div>;
    }

    // 리그 ID 가져오기
    const currentLeagueId = 
      Array.isArray(playerStatistics) && playerStatistics[0]?.league?.id || 
      (statsData && statsData[0]?.league?.id);

    switch (activeTab) {
      case 'trophies':
        return <PlayerTrophies trophiesData={trophies} />;
      case 'transfers':
        return <PlayerTransfers transfersData={transfers} />;
      case 'stats': {
        return <PlayerStats 
          statistics={convertedStatsData} 
          playerId={player.info.id} 
          preloadedSeasons={seasons}
          preloadedStats={convertedStatsData}
        />;
      }
      case 'fixtures':
        return <PlayerFixtures 
          playerId={player.info.id}
          seasons={seasons}
          fixturesData={fixtures}
          initialSeason={defaultSeason}
        />;
      case 'injuries':
        return <PlayerInjuries injuriesData={injuries} />;
      case 'rankings':
        if (!currentLeagueId) {
          return <div>리그 정보를 찾을 수 없습니다.</div>;
        }
        return <PlayerRankings 
          rankingsData={rankings} 
          currentLeague={currentLeagueId}
        />;
      default:
        return null;
    }
  };

  return (
    <div>
      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={classNames(
                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm',
                {
                  'border-blue-500 text-blue-600': activeTab === tab.id,
                  'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300':
                    activeTab !== tab.id,
                }
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="mt-6">
        {renderContent()}
      </div>
    </div>
  );
} 