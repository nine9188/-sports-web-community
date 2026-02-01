'use client';

import { useCallback, Suspense } from 'react';
import { Overview, Squad, Standings, Stats } from './tabs';
import {
  convertTeamStatsForOverview,
  convertTeamStatsForStatsComponent,
  convertStandingsData
} from '../../../utils/teamDataUtils';
import { LoadingState, ErrorState } from '@/domains/livescore/components/common/CommonComponents';
import SidebarRelatedPosts from '@/domains/sidebar/components/SidebarRelatedPosts';
import { Match as ApiMatch } from '@/domains/livescore/actions/teams/matches';
import { Match as UIMatch } from './tabs/overview/components/MatchItems';
import { FixturesTab } from './tabs/fixtures';
import { TransfersTab } from './tabs/transfers';
import { TeamFullDataResponse } from '@/domains/livescore/actions/teams/team';
import { PlayerKoreanNames } from './TeamPageClient';

// 탭 타입 정의
type TabType = 'overview' | 'squad' | 'standings' | 'stats' | 'fixtures' | 'transfers';

// 탭별 로딩 메시지
const TAB_LOADING_MESSAGES: Record<TabType, string> = {
  overview: '팀 개요 정보를 불러오는 중...',
  squad: '선수단 정보를 불러오는 중...',
  standings: '순위표를 불러오는 중...',
  stats: '팀 통계를 불러오는 중...',
  fixtures: '경기 일정을 불러오는 중...',
  transfers: '이적 정보를 불러오는 중...'
};

// 탭 컨텐츠 컴포넌트 props
interface TabContentProps {
  teamId: string;
  tab: string;
  initialData: TeamFullDataResponse;
  onTabChange?: (tab: string, subTab?: string) => void;
  playerKoreanNames?: PlayerKoreanNames;
}

/**
 * 팀 탭 컨텐츠 컴포넌트
 *
 * 서버에서 미리 로드된 데이터(initialData)를 받아 현재 탭에 맞는 컴포넌트를 렌더링합니다.
 * Context 의존성 제거로 더 단순하고 예측 가능한 동작.
 *
 * ## 데이터 흐름
 *
 * 1. page.tsx (서버) → 모든 탭 데이터 로드
 * 2. TeamPageClient → initialData 전달
 * 3. TabContent → 현재 탭에 맞는 데이터 사용
 */
export default function TabContent({ teamId, tab, initialData, onTabChange, playerKoreanNames = {} }: TabContentProps) {
  // 팀 ID를 숫자로 변환
  const numericTeamId = parseInt(teamId, 10);

  // 데이터 추출
  const { teamData, matches, squad, playerStats, standings, transfers } = initialData;

  // API 매치 데이터를 UI 매치 데이터로 변환
  const convertMatchesForOverview = useCallback((matchesArray: ApiMatch[] | undefined | null): UIMatch[] | undefined => {
    if (!matchesArray) return undefined;

    return matchesArray.map(match => ({
      fixture: {
        id: match.fixture.id,
        date: match.fixture.date,
        status: {
          short: match.fixture.status.short,
          long: match.fixture.status.short
        }
      },
      league: {
        id: (match.league as { id?: number; name: string; logo: string }).id || 0,
        name: match.league.name,
        logo: match.league.logo
      },
      teams: match.teams,
      goals: match.goals
    }));
  }, []);

  // 탭별 컴포넌트 렌더링
  const tabType = tab as TabType;

  switch (tabType) {
    case 'overview':
      if (!teamData?.team || !matches?.data || !standings?.data) {
        return <LoadingState message={TAB_LOADING_MESSAGES.overview} />;
      }

      return (
        <Suspense fallback={<LoadingState message={TAB_LOADING_MESSAGES.overview} />}>
          <Overview
            teamId={numericTeamId}
            team={teamData.team}
            stats={convertTeamStatsForOverview(teamData.stats)}
            matches={convertMatchesForOverview(matches.data)}
            standings={convertStandingsData(standings.data)}
            playerStats={playerStats?.data}
            squad={squad?.data}
            transfers={transfers?.data}
            onTabChange={onTabChange}
            isLoading={false}
            error={null}
            playerKoreanNames={playerKoreanNames}
          />
          <div className="xl:hidden">
            <SidebarRelatedPosts />
          </div>
        </Suspense>
      );

    case 'squad':
      return (
        <Suspense fallback={<LoadingState message={TAB_LOADING_MESSAGES.squad} />}>
          <Squad
            initialSquad={squad?.data}
            initialStats={playerStats?.data}
            isLoading={false}
            error={null}
            playerKoreanNames={playerKoreanNames}
          />
        </Suspense>
      );

    case 'standings':
      if (!standings?.data) {
        return <LoadingState message={TAB_LOADING_MESSAGES.standings} />;
      }

      return (
        <Suspense fallback={<LoadingState message={TAB_LOADING_MESSAGES.standings} />}>
          <Standings
            teamId={numericTeamId}
            initialStandings={standings.data}
            isLoading={false}
            error={null}
          />
        </Suspense>
      );

    case 'stats':
      if (!teamData?.stats) {
        return <LoadingState message={TAB_LOADING_MESSAGES.stats} />;
      }

      return (
        <Suspense fallback={<LoadingState message={TAB_LOADING_MESSAGES.stats} />}>
          <Stats
            teamStats={convertTeamStatsForStatsComponent(teamData.stats)}
            isLoading={false}
            error={null}
          />
        </Suspense>
      );

    case 'fixtures':
      if (!matches?.data) {
        return <LoadingState message={TAB_LOADING_MESSAGES.fixtures} />;
      }

      return (
        <Suspense fallback={<LoadingState message={TAB_LOADING_MESSAGES.fixtures} />}>
          <FixturesTab
            matches={convertMatchesForOverview(matches.data)}
            teamId={numericTeamId}
          />
        </Suspense>
      );

    case 'transfers':
      return (
        <Suspense fallback={<LoadingState message={TAB_LOADING_MESSAGES.transfers} />}>
          <TransfersTab
            transfers={transfers?.data}
            playerKoreanNames={playerKoreanNames}
          />
        </Suspense>
      );

    default:
      return <ErrorState message="지원하지 않는 탭입니다." />;
  }
}
