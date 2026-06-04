'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import Events from './tabs/Events';
import Standings from './tabs/Standings';
import Power from './tabs/Power';
import Lineups from './tabs/lineups/Lineups';
import MatchPredictionClient from './sidebar/MatchPredictionClient';
import SupportCommentsSection from './sidebar/SupportCommentsSection';
import RelatedPosts from './sidebar/RelatedPosts';
import MatchAbout from './MatchAbout';
import MatchDailyBriefing from './MatchDailyBriefing';
import { EmptyState } from '@/domains/livescore/components/common/CommonComponents';
import { MatchFullDataResponse } from '@/domains/livescore/actions/match/matchData';
import { HeadToHeadTestData } from '@/domains/livescore/actions/match/headtohead';
import { AllPlayerStatsResponse, PlayerStatsData } from '@/domains/livescore/types/lineup';
import { MatchPlayerStatsResponse } from '@/domains/livescore/actions/match/matchPlayerStats';
import { MatchTabType, PlayerKoreanNames } from './MatchPageClient';
import type { HeaderGoalEvent } from './MatchHeader';
import type { SidebarData } from '@/domains/livescore/actions/match/sidebarData';
import type { RelatedPost } from '@/domains/livescore/actions/match/relatedPosts';
import type { MatchHighlight } from '@/domains/livescore/types/highlight';
import HighlightBanner from './HighlightBanner';
import { useTeamLeague } from '@/shared/context/TeamLeagueContext';

function convertToMatchPlayerStats(
  allPlayerStats: AllPlayerStatsResponse | null | undefined,
  homeTeamId?: number,
  awayTeamId?: number
): MatchPlayerStatsResponse | undefined {
  if (!allPlayerStats?.success || !allPlayerStats.allPlayersData?.length) {
    return undefined;
  }

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
    message: '선수 통계 변환이 성공적으로 완료되었습니다.',
  };
}

const Stats = dynamic(() => import('./tabs/Stats'), { ssr: false });

interface TabContentProps {
  matchId: string;
  currentTab: MatchTabType;
  initialData: MatchFullDataResponse;
  initialPowerData?: HeadToHeadTestData;
  powerMode?: 'all' | 'summary' | 'comparison' | 'recent' | 'comparisonRecent' | 'h2h' | 'topPlayers';
  allPlayerStats?: AllPlayerStatsResponse | null;
  relatedPosts?: RelatedPost[];
  sidebarData?: SidebarData | null;
  sidebarLoading?: boolean;
  highlight?: MatchHighlight | null;
  homeBoardSlug?: string | null;
  awayBoardSlug?: string | null;
  playerKoreanNames?: PlayerKoreanNames;
  lineupPlayerPhotoUrls?: Record<number, string>;
  cupRoundsData?: import('@/domains/livescore/actions/match/cupFixtures').CupRound[];
  headerGoalEvents?: HeaderGoalEvent[];
}

export default function TabContent({
  matchId,
  currentTab,
  initialData,
  initialPowerData,
  powerMode = 'all',
  allPlayerStats,
  relatedPosts,
  sidebarData,
  sidebarLoading = false,
  highlight,
  homeBoardSlug,
  awayBoardSlug,
  playerKoreanNames = {},
  lineupPlayerPhotoUrls,
  cupRoundsData,
  headerGoalEvents = [],
}: TabContentProps) {
  const { getTeamById } = useTeamLeague();
  const activeData = initialData;
  const isTabLoading = false;
  const { events, lineups, stats, standings, homeTeam, awayTeam, matchData, teamLogoUrls, leagueLogoUrl, leagueLogoDarkUrl } = activeData;
  const fixture = matchData && typeof matchData === 'object' && 'fixture' in matchData
    ? (matchData as { fixture?: { status?: { short?: string } } }).fixture
    : undefined;
  const resolvedAllPlayerStats = allPlayerStats ?? null;
  const mergedPlayerKoreanNames = useMemo(() => ({ ...playerKoreanNames }), [playerKoreanNames]);

  if (!matchId) {
    return <EmptyState title="경기 정보 없음" message="경기 정보가 없습니다." />;
  }

  switch (currentTab) {
    case 'events':
      return <Events matchId={matchId} events={events} playerKoreanNames={mergedPlayerKoreanNames} teamLogoUrls={teamLogoUrls} />;

    case 'lineups': {
      const convertedLineups = lineups?.response ? {
        ...lineups,
        response: {
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
        }
      } : lineups ? { ...lineups, response: null } : undefined;

      return (
        <Lineups
          matchData={{
            lineups: convertedLineups,
            homeTeam: homeTeam || undefined,
            awayTeam: awayTeam || undefined,
            events: events || undefined,
            fixture,
          }}
          matchId={matchId}
          allPlayerStats={resolvedAllPlayerStats}
          playerKoreanNames={mergedPlayerKoreanNames}
          teamLogoUrls={teamLogoUrls}
          playerPhotoUrls={lineupPlayerPhotoUrls}
          isLoading={isTabLoading}
        />
      );
    }

    case 'stats': {
      const matchPlayerStats = convertToMatchPlayerStats(resolvedAllPlayerStats, homeTeam?.id, awayTeam?.id);
      return (
        <Stats
          matchId={matchId}
          matchData={{ stats, homeTeam: homeTeam || undefined, awayTeam: awayTeam || undefined }}
          initialMatchPlayerStats={matchPlayerStats}
          playerKoreanNames={mergedPlayerKoreanNames}
          teamLogoUrls={teamLogoUrls}
          teamStatsLoading={isTabLoading}
          playerStatsLoading={false}
        />
      );
    }

    case 'standings': {
      const leagueId = activeData.match?.league?.id;
      const leagueLogoUrls = leagueId && leagueLogoUrl ? { [leagueId]: leagueLogoUrl } : {};
      const leagueLogoDarkUrls = leagueId && leagueLogoDarkUrl ? { [leagueId]: leagueLogoDarkUrl } : {};

      return (
        <Standings
          matchData={{ standings: standings ?? null, homeTeam: homeTeam || undefined, awayTeam: awayTeam || undefined }}
          matchId={matchId}
          teamLogoUrls={teamLogoUrls}
          leagueLogoUrls={leagueLogoUrls}
          leagueLogoDarkUrls={leagueLogoDarkUrls}
          cupRoundsData={cupRoundsData}
          isLoading={isTabLoading}
        />
      );
    }

    case 'power':
      return homeTeam && awayTeam
        ? (
          <div className="space-y-4">
            <Power
              matchId={matchId}
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              data={initialPowerData ? { ...initialPowerData, standings } : undefined}
              playerKoreanNames={mergedPlayerKoreanNames}
              mode={powerMode}
            />
            <MatchDailyBriefing posts={relatedPosts ?? sidebarData?.relatedPosts ?? []} />
            <MatchAbout
              initialData={initialData}
              powerData={initialPowerData}
              goalEvents={headerGoalEvents}
              playerKoreanNames={mergedPlayerKoreanNames}
            />
          </div>
        )
        : <EmptyState title="전력 분석 없음" message="이 경기의 전력 데이터를 찾을 수 없습니다." />;

    case 'support':
      return (
        <div className="space-y-4">
          <HighlightBanner highlight={highlight ?? null} mode="inline" />
          <MatchPredictionClient
            matchId={matchId}
            matchData={matchData || {}}
            initialPrediction={sidebarData?.userPrediction}
            initialStats={sidebarData?.predictionStats}
            teamLogoUrls={teamLogoUrls}
          />
          <SupportCommentsSection
            matchId={matchId}
            matchData={matchData || {}}
            initialComments={sidebarData?.comments}
          />
          <RelatedPosts
            posts={relatedPosts ?? []}
            isLoading={sidebarLoading}
            teams={{
              home: homeTeam ? { id: homeTeam.id, name: getTeamById(homeTeam.id)?.name_ko || homeTeam.name, boardSlug: homeBoardSlug } : undefined,
              away: awayTeam ? { id: awayTeam.id, name: getTeamById(awayTeam.id)?.name_ko || awayTeam.name, boardSlug: awayBoardSlug } : undefined,
            }}
          />
        </div>
      );

    default:
      return <EmptyState title="알 수 없는 탭" message="존재하지 않는 탭입니다." />;
  }
}
