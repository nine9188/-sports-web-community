'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { LoadingState, ErrorState, EmptyState } from '@/domains/livescore/components/common/CommonComponents';
import StatsCards from './components/StatsCards';
import SeasonHighlights from './components/SeasonHighlights';
import StandingsPreview from './components/StandingsPreview';
import RecentTransfers from './components/RecentTransfers';
import MatchItems from './components/MatchItems';
import { Match } from './components/MatchItems';
import { StandingDisplay } from '@/domains/livescore/types/standings';
import { useTeamLeague } from '@/shared/context/TeamLeagueContext';
import { PlayerStats } from '@/domains/livescore/actions/teams/player-stats';
import { Player, Coach } from '@/domains/livescore/actions/teams/squad';
import { TeamTransfersData } from '@/domains/livescore/actions/teams/transfers';
import { PlayerKoreanNames } from '../../TeamPageClient';
import { fetchTeamOverviewMatchesData, fetchTeamOverviewStandingsData, fetchTeamOverviewTransfersData } from '@/domains/livescore/actions/teams/team';
import { teamKeys } from '@/shared/constants/queryKeys';
import { CACHE_STRATEGIES } from '@/shared/constants/cacheConfig';
import { Container, ContainerHeader, ContainerTitle } from '@/shared/components/ui';
import { convertStandingsData } from '../../../../../utils/teamDataUtils';

type OverviewMatchesData = Awaited<ReturnType<typeof fetchTeamOverviewMatchesData>>;

// 팀 정보 타입
interface Team {
  team: {
    id: number;
    name: string;
    logo: string;
  };
  venue?: {
    name: string;
    address: string;
    city: string;
    capacity: number;
    image: string;
  };
}

// 리그 정보 타입
interface LeagueInfo {
  id?: number;
  name: string;
  country: string;
  logo: string;
  season: number;
}

// 경기 결과 타입
interface FixturesInfo {
  wins: { total: number };
  draws: { total: number };
  loses: { total: number };
}

// 득점 관련 타입
interface GoalStats {
  total?: {
    home: number;
    away: number;
    total: number;
  };
  average?: {
    home: string;
    away: string;
    total: string;
  };
  minute?: Record<string, { total: number; percentage: string }>;
}

// 클린시트 타입
interface CleanSheetInfo {
  total: number;
}

// 통계 정보 타입
interface Stats {
  league?: LeagueInfo;
  fixtures?: FixturesInfo;
  goals?: {
    for: GoalStats;
    against: GoalStats;
  };
  clean_sheet?: CleanSheetInfo;
  form?: string;
}

// Overview 컴포넌트 props 타입
interface OverviewProps {
  team?: Team;
  stats?: Stats;
  matches?: Match[];
  standings?: StandingDisplay[];
  playerStats?: Record<number, PlayerStats>;
  squad?: (Player | Coach)[];
  transfers?: TeamTransfersData;
  onTabChange?: (tab: string, subTab?: string) => void;
  teamId: number;
  isLoading?: boolean;
  error?: string | null;
  playerKoreanNames?: PlayerKoreanNames;
  // 4590 표준: 이미지 Storage URL
  playerPhotoUrls?: Record<number, string>;
  teamLogoUrls?: Record<number, string>;
  leagueLogoUrls?: Record<number, string>;
  leagueLogoDarkUrls?: Record<number, string>;  // 다크모드 리그 로고
}

function OverviewSectionLoading({ title }: { title: string }) {
  return (
    <Container className="bg-white dark:bg-[#1D1D1D]">
      <div className="px-3 py-3 text-[13px] text-gray-500 dark:text-gray-400">
        {title} 불러오는 중...
      </div>
    </Container>
  );
}

function MatchSectionsLoading() {
  return (
    <div className="space-y-4">
      {['최근 경기', '예정된 경기'].map((title) => (
        <Container key={title} className="bg-white dark:bg-[#1D1D1D]">
          <ContainerHeader>
            <ContainerTitle>{title}</ContainerTitle>
          </ContainerHeader>
          <div className="overflow-hidden">
            <table className="w-full table-fixed">
              <colgroup>
                <col className="w-20 md:w-28" />
                <col className="w-8 md:w-32" />
                <col />
                {title === '최근 경기' && <col className="w-12 md:w-20" />}
              </colgroup>
              <thead className="bg-[#F5F5F5] dark:bg-[#262626]">
                <tr className="h-10">
                  <th className="p-0 md:p-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">날짜</th>
                  <th className="p-0 md:p-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">리그</th>
                  <th className="p-0 md:p-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">경기</th>
                  {title === '최근 경기' && (
                    <th className="p-0 md:p-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">결과</th>
                  )}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={title === '최근 경기' ? 4 : 3} className="h-12 text-center text-xs text-gray-500 dark:text-gray-400">
                    불러오는 중...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Container>
      ))}
    </div>
  );
}

function RecentTransfersLoading() {
  return (
    <Container className="bg-white dark:bg-[#1D1D1D]">
      <ContainerHeader>
        <ContainerTitle>최근 이적</ContainerTitle>
      </ContainerHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black/5 dark:divide-white/10">
        {[
          { label: 'IN', text: '영입', className: 'text-blue-600 dark:text-blue-400' },
          { label: 'OUT', text: '방출', className: 'text-red-600 dark:text-red-400' },
        ].map((section) => (
          <div key={section.label}>
            <div className="bg-[#F5F5F5] dark:bg-[#262626] py-2 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 border-b border-black/5 dark:border-white/10">
              <span className={section.className}>{section.label}</span> {section.text}
            </div>
            <div className="h-12 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
              불러오는 중...
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}

export default function Overview({
  team,
  stats,
  matches,
  standings,
  playerStats,
  squad,
  transfers,
  onTabChange,
  teamId,
  isLoading,
  error,
  playerKoreanNames = {},
  playerPhotoUrls = {},
  teamLogoUrls = {},
  leagueLogoUrls = {},
  leagueLogoDarkUrls = {}
}: OverviewProps) {
  const { getLeagueKoreanName } = useTeamLeague();
  // 탭 변경 핸들러 (메모이제이션으로 불필요한 렌더링 방지)
  const handleTabChange = React.useCallback((tab: string, subTab?: string) => {
    if (onTabChange) {
      onTabChange(tab, subTab);
    }
  }, [onTabChange]);
  const canFetchSupplemental = !isLoading && !error && !!team?.team;
  const standingsQuery = useQuery({
    queryKey: [...teamKeys.standings(String(teamId)), 'overview'],
    queryFn: () => fetchTeamOverviewStandingsData(String(teamId)),
    enabled: canFetchSupplemental && !standings,
    ...CACHE_STRATEGIES.STABLE_DATA,
  });
  const transfersQuery = useQuery({
    queryKey: [...teamKeys.detail(String(teamId)), 'overview-transfers'],
    queryFn: () => fetchTeamOverviewTransfersData(String(teamId)),
    enabled: canFetchSupplemental && !transfers,
    ...CACHE_STRATEGIES.STATIC_DATA,
  });
  const matchesQuery = useQuery<OverviewMatchesData>({
    queryKey: [...teamKeys.matches(String(teamId)), 'overview-recent'],
    queryFn: () => fetchTeamOverviewMatchesData(String(teamId), 10),
    enabled: canFetchSupplemental && !matches,
    ...CACHE_STRATEGIES.FREQUENTLY_UPDATED,
  });
  const displayStandings = standings || convertStandingsData(standingsQuery.data?.standings);
  const displayTransfers = transfers || transfersQuery.data?.transfers;
  const displayMatches = matches || matchesQuery.data?.matches;
  const displayPlayerKoreanNames: PlayerKoreanNames = {
    ...playerKoreanNames,
    ...(transfersQuery.data?.playerKoreanNames || {}),
  };
  const displayPlayerPhotoUrls: Record<number, string> = {
    ...playerPhotoUrls,
    ...(transfersQuery.data?.playerPhotoUrls || {}),
  };
  const displayTeamLogoUrls: Record<number, string> = {
    ...teamLogoUrls,
    ...(standingsQuery.data?.teamLogoUrls || {}),
    ...(transfersQuery.data?.teamLogoUrls || {}),
    ...(matchesQuery.data?.teamLogoUrls || {}),
  };
  const displayLeagueLogoUrls: Record<number, string> = {
    ...leagueLogoUrls,
    ...(standingsQuery.data?.leagueLogoUrls || {}),
    ...(matchesQuery.data?.leagueLogoUrls || {}),
  };
  const displayLeagueLogoDarkUrls: Record<number, string> = {
    ...leagueLogoDarkUrls,
    ...(standingsQuery.data?.leagueLogoDarkUrls || {}),
    ...(matchesQuery.data?.leagueLogoDarkUrls || {}),
  };
  
  // 로딩 상태 처리
  if (isLoading) {
    return <LoadingState message="팀 개요 데이터를 불러오는 중..." />;
  }

  // 에러 상태 처리
  if (error) {
    return <ErrorState message={error || ''} />;
  }

  // 데이터가 없는 경우 처리
  if (!team || !team.team) {
    return <EmptyState title="팀 정보가 없습니다" message="현재 이 팀에 대한 정보를 제공할 수 없습니다." />;
  }

  // 안전한 리그 정보 설정
  const safeLeague = {
    name: getLeagueKoreanName(stats?.league?.name) || '',
    logo: stats?.league?.logo || ''
  };

  return (
    <div className="space-y-4">
      {/* 1. 리그 정보 + 기본 통계 */}
      {stats && (
        <StatsCards
          stats={stats}
          onTabChange={handleTabChange}
          leagueLogoUrl={stats.league?.id ? displayLeagueLogoUrls[stats.league.id] : undefined}
          leagueLogoDarkUrl={stats.league?.id ? displayLeagueLogoDarkUrls[stats.league.id] : undefined}
        />
      )}

      {/* 2. 최근 경기와 예정된 경기 */}
      {displayMatches ? (
        <MatchItems
          matches={displayMatches}
          teamId={teamId}
          onTabChange={handleTabChange}
          teamLogoUrls={displayTeamLogoUrls}
          leagueLogoUrls={displayLeagueLogoUrls}
          leagueLogoDarkUrls={displayLeagueLogoDarkUrls}
        />
      ) : matchesQuery.isLoading ? (
        <MatchSectionsLoading />
      ) : null}

      {/* 3. 리그 순위 */}
      {displayStandings ? (
        <StandingsPreview
          standings={displayStandings}
          teamId={teamId}
          safeLeague={safeLeague}
          onTabChange={handleTabChange}
          teamLogoUrls={displayTeamLogoUrls}
          leagueLogoUrls={displayLeagueLogoUrls}
          leagueLogoDarkUrls={displayLeagueLogoDarkUrls}
        />
      ) : standingsQuery.isLoading ? (
        <OverviewSectionLoading title="리그 순위" />
      ) : null}

      {/* 4. 시즌 하이라이트 (최다 득점/어시스트) */}
      {playerStats && squad && (
        <SeasonHighlights
          playerStats={playerStats}
          squad={squad}
          onTabChange={handleTabChange}
          playerKoreanNames={displayPlayerKoreanNames}
          playerPhotoUrls={displayPlayerPhotoUrls}
        />
      )}

      {/* 5. 최근 이적 */}
      {displayTransfers ? (
        <RecentTransfers
          transfers={displayTransfers}
          onTabChange={handleTabChange}
          playerKoreanNames={displayPlayerKoreanNames}
          playerPhotoUrls={displayPlayerPhotoUrls}
          teamLogoUrls={displayTeamLogoUrls}
        />
      ) : transfersQuery.isLoading ? (
        <RecentTransfersLoading />
      ) : null}
    </div>
  );
} 
