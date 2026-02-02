'use client';

import dynamic from 'next/dynamic';
import Events from './tabs/Events';
import Standings from './tabs/Standings';
import MatchPredictionClient from './sidebar/MatchPredictionClient';
import SupportCommentsSection from './sidebar/SupportCommentsSection';
import RelatedPosts from './sidebar/RelatedPosts';
import { EmptyState } from '@/domains/livescore/components/common/CommonComponents';
import { MatchFullDataResponse } from '@/domains/livescore/actions/match/matchData';
import { HeadToHeadTestData } from '@/domains/livescore/actions/match/headtohead';
import { AllPlayerStatsResponse, PlayerStatsData } from '@/domains/livescore/types/lineup';
import { MatchPlayerStatsResponse } from '@/domains/livescore/actions/match/matchPlayerStats';
import { MatchTabType, PlayerKoreanNames } from './MatchPageClient';
import type { RelatedPost } from '@/domains/livescore/actions/match/relatedPosts';
import Spinner from '@/shared/components/Spinner';

/**
 * AllPlayerStatsResponse를 Stats 컴포넌트가 사용하는 MatchPlayerStatsResponse 형식으로 변환
 */
function convertToMatchPlayerStats(
  allPlayerStats: AllPlayerStatsResponse | null | undefined,
  homeTeamId?: number,
  awayTeamId?: number
): MatchPlayerStatsResponse | undefined {
  if (!allPlayerStats?.success || !allPlayerStats.allPlayersData?.length) {
    return undefined;
  }

  // 팀별로 선수 그룹화
  const homePlayersData: PlayerStatsData[] = [];
  const awayPlayersData: PlayerStatsData[] = [];

  for (const playerData of allPlayerStats.allPlayersData) {
    const teamId = playerData.statistics?.[0]?.team?.id;
    if (teamId === homeTeamId) {
      homePlayersData.push(playerData);
    } else if (teamId === awayTeamId) {
      awayPlayersData.push(playerData);
    }
  }

  // 첫 번째 선수의 팀 정보 추출
  const homeTeamInfo = homePlayersData[0]?.statistics?.[0]?.team;
  const awayTeamInfo = awayPlayersData[0]?.statistics?.[0]?.team;

  const convertPlayer = (p: PlayerStatsData) => {
    const stats = p.statistics?.[0];
    return {
      playerId: p.player.id,
      playerName: p.player.name,
      playerNumber: p.player.number,
      position: p.player.pos,
      minutes: stats?.games?.minutes ?? 0,
      rating: stats?.games?.rating,
      goals: stats?.goals?.total ?? 0,
      assists: stats?.goals?.assists ?? 0,
      shotsTotal: stats?.shots?.total ?? 0,
      shotsOn: stats?.shots?.on ?? 0,
      passesTotal: stats?.passes?.total ?? 0,
      passesKey: stats?.passes?.key ?? 0,
      passesAccuracy: stats?.passes?.accuracy ?? '0',
      dribblesAttempts: stats?.dribbles?.attempts ?? 0,
      dribblesSuccess: stats?.dribbles?.success ?? 0,
      duelsTotal: stats?.duels?.total ?? 0,
      duelsWon: stats?.duels?.won ?? 0,
      foulsCommitted: stats?.fouls?.committed ?? 0,
      yellowCards: stats?.cards?.yellow ?? 0,
      redCards: stats?.cards?.red ?? 0,
    };
  };

  return {
    success: true,
    data: {
      homeTeam: homeTeamInfo ? {
        id: homeTeamInfo.id,
        name: homeTeamInfo.name,
        logo: homeTeamInfo.logo,
        players: homePlayersData.map(convertPlayer),
      } : null,
      awayTeam: awayTeamInfo ? {
        id: awayTeamInfo.id,
        name: awayTeamInfo.name,
        logo: awayTeamInfo.logo,
        players: awayPlayersData.map(convertPlayer),
      } : null,
    },
    message: '선수 통계를 성공적으로 변환했습니다',
  };
}

// Dynamic imports로 Framer Motion을 사용하는 컴포넌트 lazy load
const Lineups = dynamic(() => import('./tabs/lineups/Lineups'), {
  loading: () => (
    <div className="flex items-center justify-center py-12">
      <Spinner size="lg" />
    </div>
  ),
});

const Stats = dynamic(() => import('./tabs/Stats'), {
  loading: () => (
    <div className="flex items-center justify-center py-12">
      <Spinner size="lg" />
    </div>
  ),
});

const Power = dynamic(() => import('./tabs/Power'), {
  loading: () => (
    <div className="flex items-center justify-center py-12">
      <Spinner size="lg" />
    </div>
  ),
});

interface TabContentProps {
  matchId: string;
  currentTab: MatchTabType;
  initialData: MatchFullDataResponse;
  initialPowerData?: HeadToHeadTestData;
  // 통합된 선수 통계 데이터 (평점, 주장, 전체 통계 포함)
  allPlayerStats?: AllPlayerStatsResponse | null;
  relatedPosts?: RelatedPost[];
  playerKoreanNames?: PlayerKoreanNames;
}

/**
 * 매치 탭 컨텐츠 컴포넌트
 *
 * 서버에서 미리 로드된 데이터(initialData)를 받아 현재 탭에 맞는 컴포넌트를 렌더링합니다.
 * Context 의존성 제거로 더 단순하고 예측 가능한 동작.
 */
export default function TabContent({ matchId, currentTab, initialData, initialPowerData, allPlayerStats, relatedPosts, playerKoreanNames = {} }: TabContentProps) {
  // initialData에서 데이터 추출
  const { events, lineups, stats, standings, homeTeam, awayTeam, matchData } = initialData;

  if (!matchId) {
    return <EmptyState title="경기 정보 없음" message="경기 정보가 없습니다." />;
  }

  // 탭별 렌더링
  switch (currentTab) {
    case 'events':
      return events && events.length > 0
        ? <Events events={events} playerKoreanNames={playerKoreanNames} />
        : <EmptyState title="이벤트 없음" message="이 경기의 이벤트 데이터를 찾을 수 없습니다." />;

    case 'lineups':
      if (!lineups?.response) {
        return <EmptyState title="라인업 없음" message="이 경기의 라인업 정보를 찾을 수 없습니다." />;
      }

      const fixture = matchData && typeof matchData === 'object' && 'fixture' in matchData
        ? (matchData as { fixture?: { status?: { short?: string } } }).fixture
        : undefined;

      // lineupData의 타입을 변환 (grid: string | null -> string)
      const convertedLineups = {
        ...lineups,
        response: lineups.response ? {
          home: {
            ...lineups.response.home,
            startXI: lineups.response.home.startXI.map(item => ({
              player: { ...item.player, grid: item.player.grid || '' }
            })),
            substitutes: lineups.response.home.substitutes.map(item => ({
              player: { ...item.player, grid: item.player.grid || '' }
            }))
          },
          away: {
            ...lineups.response.away,
            startXI: lineups.response.away.startXI.map(item => ({
              player: { ...item.player, grid: item.player.grid || '' }
            })),
            substitutes: lineups.response.away.substitutes.map(item => ({
              player: { ...item.player, grid: item.player.grid || '' }
            }))
          }
        } : null
      };

      return (
        <Lineups
          matchData={{
            lineups: convertedLineups,
            homeTeam: homeTeam || undefined,
            awayTeam: awayTeam || undefined,
            events: events || undefined,
            fixture
          }}
          matchId={matchId}
          allPlayerStats={allPlayerStats}
          playerKoreanNames={playerKoreanNames}
        />
      );

    case 'stats':
      // AllPlayerStatsResponse를 Stats 컴포넌트 형식으로 변환
      const matchPlayerStats = convertToMatchPlayerStats(allPlayerStats, homeTeam?.id, awayTeam?.id);
      return stats && stats.length > 0
        ? <Stats matchData={{ stats, homeTeam: homeTeam || undefined, awayTeam: awayTeam || undefined }} initialMatchPlayerStats={matchPlayerStats} playerKoreanNames={playerKoreanNames} />
        : <EmptyState title="통계 없음" message="이 경기의 통계 데이터를 찾을 수 없습니다." />;

    case 'standings':
      return standings
        ? <Standings matchData={{ standings, homeTeam: homeTeam || undefined, awayTeam: awayTeam || undefined }} matchId={matchId} />
        : <EmptyState title="순위 없음" message="이 리그의 순위 정보를 찾을 수 없습니다." />;

    case 'power':
      return initialPowerData && homeTeam && awayTeam
        ? <Power matchId={matchId} homeTeam={homeTeam} awayTeam={awayTeam} data={{ ...initialPowerData, standings }} playerKoreanNames={playerKoreanNames} />
        : <EmptyState title="전력 분석 없음" message="이 경기의 전력 데이터를 찾을 수 없습니다." />;

    case 'support':
      return (
        <div className="space-y-4">
          <MatchPredictionClient matchData={matchData || {}} />
          <SupportCommentsSection matchData={matchData || {}} />
          <RelatedPosts posts={relatedPosts ?? []} />
        </div>
      );

    default:
      return <EmptyState title="알 수 없는 탭" message="존재하지 않는 탭입니다." />;
  }
} 