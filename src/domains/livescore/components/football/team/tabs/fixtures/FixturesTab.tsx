'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';
import { useTeamLeague } from '@/shared/context/TeamLeagueContext';
import { Container, ContainerHeader, ContainerTitle } from '@/shared/components/ui/container';
import { Pagination } from '@/shared/components/ui/pagination';
import { TabList } from '@/shared/components/ui/tabs';
import { Match } from '../overview/components/MatchItems';
import { getMatchSlug } from '@/domains/livescore/utils/slugs';
import { matchUrl } from '@/domains/livescore/utils/urls';
import { fetchTeamFixturesTabData } from '@/domains/livescore/actions/teams/team';
import { teamKeys } from '@/shared/constants/queryKeys';
import { CACHE_STRATEGIES } from '@/shared/constants/cacheConfig';
import { Match as ApiMatch } from '@/domains/livescore/actions/teams/matches';
import TeamTabEmptyState from '../TeamTabEmptyState';
import { wdlDraw, wdlLose, wdlWin } from '@/shared/styles/badge';

const TEAM_PLACEHOLDER = '/images/placeholder-team.svg';
const LEAGUE_PLACEHOLDER = '/images/placeholder-league.svg';

const ITEMS_PER_PAGE = 20;

const MATCH_TABS = [
  { id: 'recent', label: '최근 경기' },
  { id: 'upcoming', label: '예정된 경기' },
];

interface FixturesTabProps {
  matches: Match[] | undefined;
  teamId: number;
  teamLogoUrls?: Record<number, string>;
  leagueLogoUrls?: Record<number, string>;
  leagueLogoDarkUrls?: Record<number, string>;
}

type FixturesTabData = Awaited<ReturnType<typeof fetchTeamFixturesTabData>>;
type ResultType = 'W' | 'L' | 'D';

function convertMatchesForFixtures(matchesArray: ApiMatch[] | undefined | null): Match[] | undefined {
  if (!matchesArray) return undefined;

  return matchesArray.map(match => ({
    fixture: {
      id: match.fixture.id,
      date: match.fixture.date,
      status: {
        short: match.fixture.status.short,
        long: match.fixture.status.short,
      },
    },
    league: {
      id: (match.league as { id?: number; name: string; logo: string }).id || 0,
      name: match.league.name,
      logo: match.league.logo,
    },
    teams: match.teams,
    goals: match.goals,
  }));
}

export default function FixturesTab({
  matches,
  teamId,
  teamLogoUrls = {},
  leagueLogoUrls = {},
  leagueLogoDarkUrls = {},
}: FixturesTabProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getLeagueKoreanName } = useTeamLeague();

  const fixturesQuery = useQuery<FixturesTabData>({
    queryKey: [...teamKeys.matches(String(teamId)), 'fixtures-tab'],
    queryFn: () => fetchTeamFixturesTabData(String(teamId)),
    enabled: !matches,
    ...CACHE_STRATEGIES.FREQUENTLY_UPDATED,
  });

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

  const displayMatches = matches || convertMatchesForFixtures(fixturesQuery.data?.matches);
  const displayTeamLogoUrls: Record<number, string> = {
    ...teamLogoUrls,
    ...(fixturesQuery.data?.teamLogoUrls || {}),
  };
  const displayLeagueLogoUrls: Record<number, string> = {
    ...leagueLogoUrls,
    ...(fixturesQuery.data?.leagueLogoUrls || {}),
  };
  const displayLeagueLogoDarkUrls: Record<number, string> = {
    ...leagueLogoDarkUrls,
    ...(fixturesQuery.data?.leagueLogoDarkUrls || {}),
  };

  const getTeamLogo = (id: number) => displayTeamLogoUrls[id] || TEAM_PLACEHOLDER;
  const getLeagueLogo = (id: number) => {
    if (isDark && displayLeagueLogoDarkUrls[id]) return displayLeagueLogoDarkUrls[id];
    return displayLeagueLogoUrls[id] || LEAGUE_PLACEHOLDER;
  };
  const getMatchHref = (match: Match) => matchUrl(match.fixture.id, getMatchSlug(match.teams.home.name, match.teams.away.name));

  const initialTab = searchParams?.get('subTab') || 'recent';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const subTab = searchParams?.get('subTab');
    if (subTab && (subTab === 'recent' || subTab === 'upcoming')) {
      setActiveTab(subTab);
    }
  }, [searchParams]);

  const [recentPage, setRecentPage] = useState(1);
  const [upcomingPage, setUpcomingPage] = useState(1);

  const recentMatches = useMemo(() => {
    if (!displayMatches) return [];
    return displayMatches
      .filter(match =>
        match.fixture.status.short === 'FT' ||
        match.fixture.status.short === 'AET' ||
        match.fixture.status.short === 'PEN' ||
        match.fixture.status.short === 'FT_PEN' ||
        match.fixture.status.short === 'AWD' ||
        match.fixture.status.short === 'WO' ||
        match.fixture.status.short === 'CANC'
      )
      .sort((a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime());
  }, [displayMatches]);

  const upcomingMatches = useMemo(() => {
    if (!displayMatches) return [];
    return displayMatches
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
      .sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime());
  }, [displayMatches]);

  const isRecentTab = activeTab === 'recent';
  const currentMatches = isRecentTab ? recentMatches : upcomingMatches;
  const currentPage = isRecentTab ? recentPage : upcomingPage;
  const setCurrentPage = isRecentTab ? setRecentPage : setUpcomingPage;
  const totalPages = Math.ceil(currentMatches.length / ITEMS_PER_PAGE);

  const paginatedMatches = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return currentMatches.slice(start, start + ITEMS_PER_PAGE);
  }, [currentMatches, currentPage]);

  if ((!displayMatches || displayMatches.length === 0) && !fixturesQuery.isLoading) {
    return <TeamTabEmptyState title="경기 일정" message="경기 일정 데이터가 없습니다." />;
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

  return (
    <div>
      <Container className="bg-white dark:bg-[#1D1D1D]">
        <ContainerHeader>
          <ContainerTitle>경기 일정</ContainerTitle>
        </ContainerHeader>
        <TabList
          tabs={MATCH_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="contained"
          className="mb-0 [&_button]:h-12"
        />

        <div className="divide-y divide-black/5 dark:divide-white/10">
          {paginatedMatches.length > 0 ? paginatedMatches.map(match => {
            const href = getMatchHref(match);
            const result = getTeamResult(match);

            return (
              <Link
                key={match.fixture.id}
                href={href}
                className="block px-3 py-2.5 transition-colors hover:bg-[#EAEAEA] dark:hover:bg-[#333333] md:px-4 md:py-3"
                onMouseEnter={() => router.prefetch(href)}
                onFocus={() => router.prefetch(href)}
              >
                <div className="mb-2 flex items-center justify-between gap-3 text-[11px] text-gray-500 dark:text-gray-400 md:text-xs">
                  <span className="whitespace-nowrap">
                    {format(new Date(match.fixture.date), isRecentTab ? 'M월 d일 (E)' : 'M월 d일 (E) HH:mm', { locale: ko })}
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
                    isRecentTab
                      ? getResultClass(result)
                      : 'bg-[#EAEAEA] text-gray-900 dark:bg-[#333333] dark:text-[#F0F0F0]'
                  }`}>
                    {isRecentTab ? `${match.goals.home ?? '-'} - ${match.goals.away ?? '-'}` : 'VS'}
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
          }) : (
            <div className="px-3 py-4 text-center text-[13px] text-gray-500 dark:text-gray-400">
              {fixturesQuery.isLoading
                ? '불러오는 중...'
                : fixturesQuery.isError
                  ? '경기 정보를 불러오지 못했습니다.'
                  : isRecentTab
                    ? '최근 경기 정보가 없습니다'
                    : '예정된 경기 정보가 없습니다'}
            </div>
          )}
        </div>
      </Container>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          mode="button"
          className="mt-4 pt-0"
        />
      )}
    </div>
  );
}
