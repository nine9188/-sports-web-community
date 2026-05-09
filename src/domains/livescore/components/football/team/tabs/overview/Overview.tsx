'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LoadingState, ErrorState } from '@/domains/livescore/components/common/CommonComponents';
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
import { Button, Container, ContainerHeader, ContainerTitle } from '@/shared/components/ui';
import TeamTabEmptyState from '../TeamTabEmptyState';

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

interface LeagueInfo {
  id?: number;
  name: string;
  country: string;
  logo: string;
  season: number;
}

interface FixturesInfo {
  wins: { total: number };
  draws: { total: number };
  loses: { total: number };
}

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

interface CleanSheetInfo {
  total: number;
}

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
  // 4590 storage image URLs.
  playerPhotoUrls?: Record<number, string>;
  teamLogoUrls?: Record<number, string>;
  leagueLogoUrls?: Record<number, string>;
  leagueLogoDarkUrls?: Record<number, string>;  // Dark mode league logos.
}
function OverviewSectionLoading({ title }: { title: string }) {
  return (
    <Container className="bg-white dark:bg-[#1D1D1D]">
      <ContainerHeader>
        <ContainerTitle>{title}</ContainerTitle>
      </ContainerHeader>
      <div className="px-3 py-4 text-center text-[13px] text-gray-500 dark:text-gray-400">
        불러오는 중...
      </div>
    </Container>
  );
}

function MatchSectionsLoading() {
  return (
    <div className="space-y-4">
      <MatchSectionLoading title="최근 경기" footerLabel="최근 경기 전체보기" />
      <MatchSectionLoading title="예정된 경기" footerLabel="예정된 경기 전체보기" />
    </div>
  );
}

function MatchSectionLoading({ title, footerLabel }: { title: string; footerLabel: string }) {
  return (
    <Container className="bg-white dark:bg-[#1D1D1D]">
      <ContainerHeader>
        <ContainerTitle>{title}</ContainerTitle>
      </ContainerHeader>
      <div className="px-3 py-4 text-center text-[13px] text-gray-500 dark:text-gray-400">
        불러오는 중...
      </div>
      <OverviewLoadingFooter label={footerLabel} />
    </Container>
  );
}

function RecentTransfersLoading() {
  return (
    <Container className="bg-white dark:bg-[#1D1D1D]">
      <ContainerHeader>
        <ContainerTitle>최근 이적</ContainerTitle>
      </ContainerHeader>
      <div className="grid grid-cols-1 divide-y divide-black/5 dark:divide-white/10 md:grid-cols-2 md:divide-x md:divide-y-0">
        {[
          { label: 'IN', text: '영입', className: 'text-blue-600 dark:text-blue-400' },
          { label: 'OUT', text: '방출', className: 'text-red-600 dark:text-red-400' },
        ].map((section) => (
          <div key={section.label}>
            <div className="border-b border-black/5 bg-[#F5F5F5] py-2 text-center text-[10px] font-medium text-gray-500 dark:border-white/10 dark:bg-[#262626] dark:text-gray-400">
              <span className={section.className}>{section.label}</span> {section.text}
            </div>
            <div className="flex h-12 items-center justify-center text-xs text-gray-500 dark:text-gray-400">
              불러오는 중...
            </div>
          </div>
        ))}
      </div>
      <OverviewLoadingFooter label="전체 이적 보기" />
    </Container>
  );
}

function OverviewLoadingFooter({ label }: { label: string }) {
  return (
    <Button
      variant="secondary"
      disabled
      className="w-full rounded-none border-t border-black/5 opacity-100 md:rounded-b-lg dark:border-white/10"
    >
      <div className="flex items-center justify-center gap-1">
        <span className="text-[13px] font-medium">{label}</span>
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </Button>
  );
}

function OverviewSectionEmpty({ title, message }: { title: string; message: string }) {
  return (
    <Container className="bg-white dark:bg-[#1D1D1D]">
      <ContainerHeader>
        <ContainerTitle>{title}</ContainerTitle>
      </ContainerHeader>
      <div className="px-3 py-4 text-center text-[13px] text-gray-500 dark:text-gray-400">
        {message}
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
  const router = useRouter();
  const pathname = usePathname();

  const handleTabChange = React.useCallback((tab: string, subTab?: string) => {
    if (onTabChange) {
      onTabChange(tab, subTab);
      return;
    }
    const params = new URLSearchParams();
    params.set('tab', tab);
    if (subTab) params.set('subTab', subTab);
    router.push(`${pathname}?${params.toString()}`);
  }, [onTabChange, pathname, router]);

  const displayStandings = standings;
  const displayTransfers = transfers;
  const displayPlayerStats = playerStats;
  const displaySquad = squad;
  const displayMatches = matches;
  const displayPlayerKoreanNames = playerKoreanNames;
  const displayPlayerPhotoUrls = playerPhotoUrls;
  const displayTeamLogoUrls = teamLogoUrls;
  const displayLeagueLogoUrls = leagueLogoUrls;
  const displayLeagueLogoDarkUrls = leagueLogoDarkUrls;
  
  if (isLoading) {
    return <LoadingState message="팀 개요 데이터를 불러오는 중..." />;
  }

  if (error) {
    return <ErrorState message={error || ''} />;
  }

  if (!team || !team.team) {
    return <TeamTabEmptyState title="팀 정보" message="팀 정보가 없습니다." />;
  }

  // Build a safe league object for child components.
  const safeLeague = {
    name: getLeagueKoreanName(stats?.league?.name) || '',
    logo: stats?.league?.logo || ''
  };

  return (
    <div className="space-y-4">
      {/* 1. League summary and rankings */}
      {stats && (
        <StatsCards
          stats={stats}
          onTabChange={handleTabChange}
          leagueLogoUrl={stats.league?.id ? displayLeagueLogoUrls[stats.league.id] : undefined}
          leagueLogoDarkUrl={stats.league?.id ? displayLeagueLogoDarkUrls[stats.league.id] : undefined}
        />
      )}

      {/* 2. Recent and upcoming matches */}
      {displayMatches ? (
        <MatchItems
          matches={displayMatches}
          teamId={teamId}
          onTabChange={handleTabChange}
          teamLogoUrls={displayTeamLogoUrls}
          leagueLogoUrls={displayLeagueLogoUrls}
          leagueLogoDarkUrls={displayLeagueLogoDarkUrls}
          recentLoading={false}
          upcomingLoading={false}
        />
      ) : false ? (
        <MatchSectionsLoading />
      ) : false ? (
        <OverviewSectionEmpty title="경기 정보" message="경기 정보를 불러오지 못했습니다." />
      ) : null}

      {/* 3. League standings */}
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
      ) : false ? (
        <OverviewSectionLoading title="리그 순위" />
      ) : false ? (
        <OverviewSectionEmpty title="리그 순위" message="순위 정보를 불러오지 못했습니다." />
      ) : null}

      {/* 4. Season highlights */}
      {displayPlayerStats && displaySquad ? (
        <SeasonHighlights
          playerStats={displayPlayerStats}
          squad={displaySquad}
          onTabChange={handleTabChange}
          playerKoreanNames={displayPlayerKoreanNames}
          playerPhotoUrls={displayPlayerPhotoUrls}
        />
      ) : false ? (
        <OverviewSectionLoading title="시즌 하이라이트" />
      ) : null}

      {/* 5. Recent transfers */}
      {displayTransfers ? (
        <RecentTransfers
          transfers={displayTransfers}
          onTabChange={handleTabChange}
          playerKoreanNames={displayPlayerKoreanNames}
          playerPhotoUrls={displayPlayerPhotoUrls}
          teamLogoUrls={displayTeamLogoUrls}
        />
      ) : false ? (
        <RecentTransfersLoading />
      ) : false ? (
        <OverviewSectionEmpty title="최근 이적" message="이적 정보를 불러오지 못했습니다." />
      ) : null}
    </div>
  );
} 
