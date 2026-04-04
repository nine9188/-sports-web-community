'use client';

import { useCallback } from 'react';
import { Overview, Squad, Standings, Stats } from './tabs';
import {
  convertTeamStatsForOverview,
  convertTeamStatsForStatsComponent,
  convertStandingsData
} from '../../../utils/teamDataUtils';
import { ErrorState } from '@/domains/livescore/components/common/CommonComponents';
import SidebarRelatedPosts from '@/domains/sidebar/components/SidebarRelatedPosts';
import { Match as ApiMatch } from '@/domains/livescore/actions/teams/matches';
import { Match as UIMatch } from './tabs/overview/components/MatchItems';
import { FixturesTab } from './tabs/fixtures';
import { TransfersTab } from './tabs/transfers';
import { TeamFullDataResponse } from '@/domains/livescore/actions/teams/team';
import { PlayerKoreanNames } from './TeamPageClient';

// 탭 타입 정의
type TabType = 'overview' | 'squad' | 'standings' | 'stats' | 'fixtures' | 'transfers';

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
 */
export default function TabContent({ teamId, tab, initialData, onTabChange, playerKoreanNames = {} }: TabContentProps) {
  // 팀 ID를 숫자로 변환
  const numericTeamId = parseInt(teamId, 10);

  // 데이터 추출
  const { teamData, matches, squad, playerStats, standings, transfers, playerPhotoUrls, teamLogoUrls, coachPhotoUrls, leagueLogoUrls, leagueLogoDarkUrls } = initialData;

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

  // 탭별 컴포넌트 렌더링 — initialData가 서버에서 이미 로드됨
  const tabType = tab as TabType;

  switch (tabType) {
    case 'overview':
      return (
        <>
          <Overview
            teamId={numericTeamId}
            team={teamData?.team}
            stats={convertTeamStatsForOverview(teamData?.stats)}
            matches={convertMatchesForOverview(matches?.data)}
            standings={convertStandingsData(standings?.data)}
            playerStats={playerStats?.data}
            squad={squad?.data}
            transfers={transfers?.data}
            onTabChange={onTabChange}
            isLoading={false}
            error={null}
            playerKoreanNames={playerKoreanNames}
            playerPhotoUrls={playerPhotoUrls}
            teamLogoUrls={teamLogoUrls}
            leagueLogoUrls={leagueLogoUrls}
            leagueLogoDarkUrls={leagueLogoDarkUrls}
          />
          <div className="xl:hidden">
            <SidebarRelatedPosts />
          </div>
        </>
      );

    case 'squad':
      return (
        <Squad
          initialSquad={squad?.data}
          initialStats={playerStats?.data}
          isLoading={false}
          error={null}
          playerKoreanNames={playerKoreanNames}
          playerPhotoUrls={playerPhotoUrls}
          coachPhotoUrls={coachPhotoUrls}
        />
      );

    case 'standings':
      return (
        <Standings
          teamId={numericTeamId}
          initialStandings={standings?.data}
          isLoading={false}
          error={null}
          teamLogoUrls={teamLogoUrls}
          leagueLogoUrls={leagueLogoUrls}
          leagueLogoDarkUrls={leagueLogoDarkUrls}
        />
      );

    case 'stats':
      return (
        <Stats
          teamStats={convertTeamStatsForStatsComponent(teamData?.stats)}
          isLoading={false}
          error={null}
          leagueLogoUrls={leagueLogoUrls}
          leagueLogoDarkUrls={leagueLogoDarkUrls}
        />
      );

    case 'fixtures':
      return (
        <FixturesTab
          matches={convertMatchesForOverview(matches?.data)}
          teamId={numericTeamId}
          teamLogoUrls={teamLogoUrls}
          leagueLogoUrls={leagueLogoUrls}
          leagueLogoDarkUrls={leagueLogoDarkUrls}
        />
      );

    case 'transfers':
      return (
        <TransfersTab
          transfers={transfers?.data}
          playerKoreanNames={playerKoreanNames}
          playerPhotoUrls={playerPhotoUrls}
          teamLogoUrls={teamLogoUrls}
        />
      );

    default:
      return <ErrorState message="지원하지 않는 탭입니다." />;
  }
}
