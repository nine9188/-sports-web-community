'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';
import { useTeamLeague } from '@/shared/context/TeamLeagueContext';
import { Button, Container, ContainerHeader, ContainerTitle } from '@/shared/components/ui';
import { wdlDraw, wdlLose, wdlWin } from '@/shared/styles/badge';
import { getMatchSlug } from '@/domains/livescore/utils/slugs';
import { matchUrl } from '@/domains/livescore/utils/urls';

const TEAM_PLACEHOLDER = '/images/placeholder-team.svg';
const LEAGUE_PLACEHOLDER = '/images/placeholder-league.svg';
const DISPLAY_LIMIT = 5;

export interface Match {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      long?: string;
    };
  };
  league: {
    id: number;
    name: string;
    logo: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
    away: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

interface MatchItemsProps {
  matches: Match[] | undefined;
  teamId: number;
  onTabChange?: (tab: string, subTab?: string) => void;
  teamLogoUrls?: Record<number, string>;
  leagueLogoUrls?: Record<number, string>;
  recentLoading?: boolean;
  upcomingLoading?: boolean;
  leagueLogoDarkUrls?: Record<number, string>;
}

type ResultType = 'W' | 'L' | 'D';

export default function MatchItems({
  matches,
  teamId,
  onTabChange,
  teamLogoUrls = {},
  leagueLogoUrls = {},
  leagueLogoDarkUrls = {},
  recentLoading = false,
  upcomingLoading = false,
}: MatchItemsProps) {
  const { getLeagueKoreanName } = useTeamLeague();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDark(document.documentElement.classList.contains('dark'));
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const getTeamLogo = (id: number) => teamLogoUrls[id] || TEAM_PLACEHOLDER;
  const getLeagueLogo = (id: number) => {
    if (isDark && leagueLogoDarkUrls[id]) return leagueLogoDarkUrls[id];
    return leagueLogoUrls[id] || LEAGUE_PLACEHOLDER;
  };
  const getMatchHref = (match: Match) => matchUrl(match.fixture.id, getMatchSlug(match.teams.home.name, match.teams.away.name));

  const recentMatches = useMemo(() => {
    if (!matches) return [];
    return matches
      .filter(match =>
        match.fixture.status.short === 'FT' ||
        match.fixture.status.short === 'AET' ||
        match.fixture.status.short === 'PEN' ||
        match.fixture.status.short === 'FT_PEN' ||
        match.fixture.status.short === 'AWD' ||
        match.fixture.status.short === 'WO' ||
        match.fixture.status.short === 'CANC'
      )
      .sort((a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime())
      .slice(0, DISPLAY_LIMIT);
  }, [matches]);

  const upcomingMatches = useMemo(() => {
    if (!matches) return [];
    return matches
      .filter(match =>
        match.fixture.status.short === 'NS' ||
        match.fixture.status.short === 'TBD' ||
        match.fixture.status.short === 'SUSP' ||
        match.fixture.status.short === 'PST' ||
        match.fixture.status.short === '1H' ||
        match.fixture.status.short === '2H' ||
        match.fixture.status.short === 'HT' ||
        match.fixture.status.short === 'ET' ||
        match.fixture.status.short === 'BT' ||
        match.fixture.status.short === 'P' ||
        match.fixture.status.short === 'INT' ||
        match.fixture.status.short === 'LIVE'
      )
      .sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime())
      .slice(0, DISPLAY_LIMIT);
  }, [matches]);

  if ((!matches || matches.length === 0) && !recentLoading && !upcomingLoading) {
    return null;
  }

  const getTeamResult = (match: Match): ResultType => {
    const isHomeTeam = match.teams.home.id === teamId;
    const team = isHomeTeam ? match.teams.home : match.teams.away;
    const opponent = isHomeTeam ? match.teams.away : match.teams.home;

    if (team.winner) return 'W';
    if (opponent.winner) return 'L';
    return 'D';
  };

  const getResultClass = (result: ResultType) => {
    if (result === 'W') return wdlWin;
    if (result === 'L') return wdlLose;
    return wdlDraw;
  };

  const renderMatchRows = (
    list: Match[],
    type: 'recent' | 'upcoming',
    isLoading: boolean
  ) => {
    const isRecent = type === 'recent';

    if (list.length === 0) {
      return (
        <div className="px-3 py-4 text-center text-[13px] text-gray-500 dark:text-gray-400">
          {isLoading
            ? '불러오는 중...'
            : isRecent
              ? '최근 경기 정보가 없습니다'
              : '예정된 경기 정보가 없습니다'}
        </div>
      );
    }

    return list.map(match => {
      const href = getMatchHref(match);
      const result = getTeamResult(match);

      return (
        <Link
          key={match.fixture.id}
          href={href}
          className="block px-3 py-2.5 transition-colors hover:bg-[#EAEAEA] dark:hover:bg-[#333333] md:px-4 md:py-3"
        >
          <div className="mb-2 flex items-center justify-between gap-3 text-[11px] text-gray-500 dark:text-gray-400 md:text-xs">
            <span className="whitespace-nowrap">
              {format(new Date(match.fixture.date), isRecent ? 'M월 d일 (E)' : 'M월 d일 (E) HH:mm', { locale: ko })}
            </span>
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="truncate">{getLeagueKoreanName(match.league.name)}</span>
              <span className="h-4 w-4 flex-shrink-0 md:h-[18px] md:w-[18px]">
                <UnifiedSportsImageClient
                  src={getLeagueLogo(match.league.id)}
                  alt={match.league.name}
                  width={18}
                  height={18}
                  className="h-full w-full object-contain"
                />
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
              <span className={`truncate text-right text-xs text-gray-900 dark:text-[#F0F0F0] md:text-[13px] ${match.teams.home.id === teamId ? 'font-bold' : 'font-medium'}`}>
                {match.teams.home.name}
              </span>
              <UnifiedSportsImageClient
                src={getTeamLogo(match.teams.home.id)}
                alt={match.teams.home.name}
                width={24}
                height={24}
                className="h-6 w-6 flex-shrink-0 object-contain"
              />
            </div>

            <span className={`inline-flex h-6 min-w-11 flex-shrink-0 items-center justify-center rounded-md px-2 text-xs font-bold md:h-7 md:min-w-12 md:text-[13px] ${
              isRecent
                ? getResultClass(result)
                : 'bg-[#EAEAEA] text-gray-900 dark:bg-[#333333] dark:text-[#F0F0F0]'
            }`}>
              {isRecent ? `${match.goals.home ?? '-'} - ${match.goals.away ?? '-'}` : 'VS'}
            </span>

            <div className="flex min-w-0 flex-1 items-center justify-start gap-1.5">
              <UnifiedSportsImageClient
                src={getTeamLogo(match.teams.away.id)}
                alt={match.teams.away.name}
                width={24}
                height={24}
                className="h-6 w-6 flex-shrink-0 object-contain"
              />
              <span className={`truncate text-left text-xs text-gray-900 dark:text-[#F0F0F0] md:text-[13px] ${match.teams.away.id === teamId ? 'font-bold' : 'font-medium'}`}>
                {match.teams.away.name}
              </span>
            </div>
          </div>
        </Link>
      );
    });
  };

  const renderMoreButton = (subTab: 'recent' | 'upcoming', label: string) => {
    if (!onTabChange) return null;

    return (
      <Button
        variant="secondary"
        onClick={() => onTabChange('fixtures', subTab)}
        className="w-full rounded-none border-t border-black/5 dark:border-white/10 md:rounded-b-lg"
      >
        <div className="flex items-center justify-center gap-1">
          <span className="text-[13px] font-medium">{label}</span>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Button>
    );
  };

  return (
    <div className="space-y-4">
      <Container className="bg-white dark:bg-[#1D1D1D]">
        <ContainerHeader>
          <ContainerTitle>최근 경기</ContainerTitle>
        </ContainerHeader>
        <div className="divide-y divide-black/5 dark:divide-white/10">
          {renderMatchRows(recentMatches, 'recent', recentLoading)}
        </div>
        {renderMoreButton('recent', '최근 경기 전체보기')}
      </Container>

      <Container className="bg-white dark:bg-[#1D1D1D]">
        <ContainerHeader>
          <ContainerTitle>예정된 경기</ContainerTitle>
        </ContainerHeader>
        <div className="divide-y divide-black/5 dark:divide-white/10">
          {renderMatchRows(upcomingMatches, 'upcoming', upcomingLoading)}
        </div>
        {renderMoreButton('upcoming', '예정된 경기 전체보기')}
      </Container>
    </div>
  );
}
