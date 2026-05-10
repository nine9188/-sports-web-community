'use client';

import { useCallback } from 'react';
import { Overview, Squad, Standings, Stats } from './tabs';
import {
  convertTeamStatsForOverview,
  convertTeamStatsForStatsComponent,
  convertStandingsData
} from '../../../utils/teamDataUtils';
import { ErrorState } from '@/domains/livescore/components/common/CommonComponents';
import { Match as ApiMatch } from '@/domains/livescore/actions/teams/matches';
import { Match as UIMatch } from './tabs/overview/components/MatchItems';
import { FixturesTab } from './tabs/fixtures';
import { TransfersTab } from './tabs/transfers';
import { TeamFullDataResponse } from '@/domains/livescore/actions/teams/team';
import { PlayerKoreanNames } from './TeamPageClient';

// 팀 상세 탭 타입.
type TabType = 'overview' | 'squad' | 'standings' | 'stats' | 'fixtures' | 'transfers';

interface TabContentProps {
  teamId: string;
  tab: string;
  initialData: TeamFullDataResponse;
  playerKoreanNames?: PlayerKoreanNames;
}

/**
 * 서버 페이지가 현재 URL 탭 기준으로 준비한 initialData를 받아
 * 해당 탭 컴포넌트에 props로 전달합니다.
 */
export default function TabContent({ teamId, tab, initialData, playerKoreanNames = {} }: TabContentProps) {
  // 하위 탭 컴포넌트들은 number 팀 ID를 기대합니다.
  const numericTeamId = parseInt(teamId, 10);

  const { teamData, matches, squad, playerStats, standings, transfers, playerPhotoUrls, teamLogoUrls, coachPhotoUrls, leagueLogoUrls, leagueLogoDarkUrls } = initialData;
  const hasSeasonMatches = initialData.matchesMode === 'season';
  const hasFullTransfers = initialData.transfersMode === 'full';
  const hasFullSquad = initialData.squadMode === 'full';

  // API 매치 응답을 팀 탭 UI가 쓰는 최소 구조로 변환합니다.
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

  // 탭별 컴포넌트는 서버에서 전달된 props만 렌더링합니다.
  const tabType = tab as TabType;

  switch (tabType) {
    case 'overview':
      return (
        <Overview
          teamId={numericTeamId}
          team={teamData?.team}
          stats={convertTeamStatsForOverview(teamData?.stats)}
          matches={convertMatchesForOverview(matches?.data)}
          standings={convertStandingsData(standings?.data)}
          playerStats={playerStats?.data}
          squad={squad?.data}
          transfers={transfers?.data}
          isLoading={false}
          error={null}
          playerKoreanNames={playerKoreanNames}
          playerPhotoUrls={playerPhotoUrls}
          teamLogoUrls={teamLogoUrls}
          leagueLogoUrls={leagueLogoUrls}
          leagueLogoDarkUrls={leagueLogoDarkUrls}
        />
      );

    case 'squad':
      return (
        <Squad
          teamId={numericTeamId}
          initialSquad={hasFullSquad ? squad?.data : undefined}
          initialStats={hasFullSquad ? playerStats?.data : undefined}
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
          leagueLogoUrls={leagueLogoUrls}
          leagueLogoDarkUrls={leagueLogoDarkUrls}
        />
      );

    case 'fixtures':
      return (
        <FixturesTab
          matches={hasSeasonMatches ? convertMatchesForOverview(matches?.data) : undefined}
          teamId={numericTeamId}
          teamLogoUrls={teamLogoUrls}
          leagueLogoUrls={leagueLogoUrls}
          leagueLogoDarkUrls={leagueLogoDarkUrls}
        />
      );

    case 'transfers':
      return (
        <TransfersTab
          teamId={numericTeamId}
          transfers={hasFullTransfers ? transfers?.data : undefined}
          playerKoreanNames={playerKoreanNames}
          playerPhotoUrls={playerPhotoUrls}
          teamLogoUrls={teamLogoUrls}
        />
      );

    default:
      return <ErrorState message="지원하지 않는 탭입니다." />;
  }
}
