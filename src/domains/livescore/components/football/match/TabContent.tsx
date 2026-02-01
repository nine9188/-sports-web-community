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
import { PlayerRatingsAndCaptains } from '@/domains/livescore/actions/match/playerStats';
import { MatchPlayerStatsResponse } from '@/domains/livescore/actions/match/matchPlayerStats';
import { MatchTabType, PlayerKoreanNames } from './MatchPageClient';
import type { RelatedPost } from '@/domains/livescore/actions/match/relatedPosts';
import Spinner from '@/shared/components/Spinner';

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
  initialPlayerRatings?: PlayerRatingsAndCaptains;
  initialMatchPlayerStats?: MatchPlayerStatsResponse;
  relatedPosts?: RelatedPost[];
  playerKoreanNames?: PlayerKoreanNames;
}

/**
 * 매치 탭 컨텐츠 컴포넌트
 *
 * 서버에서 미리 로드된 데이터(initialData)를 받아 현재 탭에 맞는 컴포넌트를 렌더링합니다.
 * Context 의존성 제거로 더 단순하고 예측 가능한 동작.
 */
export default function TabContent({ matchId, currentTab, initialData, initialPowerData, initialPlayerRatings, initialMatchPlayerStats, relatedPosts, playerKoreanNames = {} }: TabContentProps) {
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
          initialPlayerRatings={initialPlayerRatings}
          playerKoreanNames={playerKoreanNames}
        />
      );

    case 'stats':
      return stats && stats.length > 0
        ? <Stats matchData={{ stats, homeTeam: homeTeam || undefined, awayTeam: awayTeam || undefined }} initialMatchPlayerStats={initialMatchPlayerStats} playerKoreanNames={playerKoreanNames} />
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