import { PlayerData } from '../../types/player';
import PlayerTabsClient from './PlayerTabsClient';

// 필요한 인터페이스 정의
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

// 업데이트된 Props 인터페이스
interface PlayerTabsProps {
  player: PlayerData;
  statsData: StatisticsData[];
  seasons: number[];
  playerId: number;
  currentLeagueId?: number;
  defaultSeason: number;
  baseUrl: string;
}

const tabs: Tab[] = [
  { id: 'stats', label: '통계' },
  { id: 'fixtures', label: '경기별 통계' },
  { id: 'trophies', label: '트로피' },
  { id: 'transfers', label: '이적 기록' },
  { id: 'injuries', label: '부상 기록' },
  { id: 'rankings', label: '리그 순위' },
];

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
  statsData,
  seasons, 
  playerId,
  currentLeagueId,
  defaultSeason,
  baseUrl
}: PlayerTabsProps) {
  // 기본값 설정
  const safeSeasons = seasons || [];
  const safeStatsData = statsData || [];
  
  // statsData를 PlayerStatistic 타입으로 변환
  const convertedStatsData = convertStatisticsToPlayerStatistic(safeStatsData);

  return (
    <PlayerTabsClient
      tabs={tabs}
      player={player}
      statsData={convertedStatsData}
      seasons={safeSeasons}
      playerId={playerId}
      currentLeagueId={currentLeagueId}
      defaultSeason={defaultSeason}
      baseUrl={baseUrl}
    />
  );
} 