'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';
import { Container, ContainerContent, ContainerHeader, ContainerTitle, Pagination } from '@/shared/components/ui';
import { wdlDraw, wdlLose, wdlWin } from '@/shared/styles/badge';
import { FixtureData } from '@/domains/livescore/types/player';
import { useTeamLeague } from '@/shared/context/TeamLeagueContext';
import { getMatchSlug } from '@/domains/livescore/utils/slugs';
import { matchUrl } from '@/domains/livescore/utils/urls';
import { fetchPlayerFixtures } from '@/domains/livescore/actions/player/fixtures';
import PlayerTabEmptyState from './PlayerTabEmptyState';

const TEAM_PLACEHOLDER = '/images/placeholder-team.svg';
const LEAGUE_PLACEHOLDER = '/images/placeholder-league.svg';
const ITEMS_PER_PAGE = 15;

interface PlayerFixturesProps {
  playerId: number;
  fixturesData?: {
    data: FixtureData[];
    status?: string;
    message?: string;
    seasonUsed?: number;
    completeness?: {
      total: number;
      success: number;
      failed: number;
      failedFixtureIds?: number[];
    };
  };
  teamLogoUrls?: Record<number, string>;
  leagueLogoUrls?: Record<number, string>;
  leagueLogoDarkUrls?: Record<number, string>;
}

type ResultType = 'W' | 'D' | 'L';

function TeamLogo({ name, logoUrl }: { name: string; logoUrl: string }) {
  return (
    <UnifiedSportsImageClient
      src={logoUrl}
      alt={name}
      width={24}
      height={24}
      className="h-6 w-6 flex-shrink-0 object-contain"
    />
  );
}

function getResultClass(result: ResultType) {
  if (result === 'W') return wdlWin;
  if (result === 'L') return wdlLose;
  return wdlDraw;
}

function statValue(value: number | string | undefined | null) {
  return value === undefined || value === null || value === '' ? '-' : String(value);
}

export default function PlayerFixtures({
  playerId,
  fixturesData: initialFixturesData = { data: [], status: 'error', message: '데이터가 없습니다' },
  teamLogoUrls = {},
  leagueLogoUrls = {},
  leagueLogoDarkUrls = {},
}: PlayerFixturesProps) {  const { getTeamById, getLeagueKoreanName } = useTeamLeague();
  const [pageFixturesData, setPageFixturesData] = useState(initialFixturesData);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setPageFixturesData(initialFixturesData);
    setCurrentPage(1);
  }, [initialFixturesData]);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkDarkMode();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkDarkMode();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (currentPage === 1) {
      setPageFixturesData(initialFixturesData);
      return;
    }

    let cancelled = false;
    setIsPageLoading(true);

    fetchPlayerFixtures(playerId, ITEMS_PER_PAGE, (currentPage - 1) * ITEMS_PER_PAGE)
      .then((response) => {
        if (!cancelled) {
          setPageFixturesData(response);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsPageLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentPage, initialFixturesData, playerId]);

  const getTeamLogo = (teamId: number, fallback?: string) => teamLogoUrls[teamId] || fallback || TEAM_PLACEHOLDER;
  const getLeagueLogo = (leagueId: number, fallback?: string) => {
    if (isDark && leagueLogoDarkUrls[leagueId]) return leagueLogoDarkUrls[leagueId];
    return leagueLogoUrls[leagueId] || fallback || LEAGUE_PLACEHOLDER;
  };
  const getTeamName = (teamId: number, fallback: string) => getTeamById(teamId)?.name_ko || fallback;

  const fixturesData = useMemo(() => {
    const isValidData =
      pageFixturesData &&
      typeof pageFixturesData === 'object' &&
      Array.isArray(pageFixturesData.data);

    const validatedData = (isValidData ? pageFixturesData.data : []).map((fixture) => ({
      ...fixture,
      fixture: {
        id: fixture.fixture?.id || 0,
        date: fixture.fixture?.date || '',
        timestamp: fixture.fixture?.timestamp || 0,
      },
      goals: {
        home: typeof fixture.goals?.home === 'string' ? fixture.goals.home : String(fixture.goals?.home || 0),
        away: typeof fixture.goals?.away === 'string' ? fixture.goals.away : String(fixture.goals?.away || 0),
      },
      statistics: fixture.statistics || {
        games: { minutes: 0, rating: '0' },
        goals: { total: 0, assists: 0 },
        shots: { total: 0, on: 0 },
        passes: { total: 0, key: 0 },
      },
    }));

    return {
      data: validatedData,
      status: pageFixturesData?.status || 'error',
      message: pageFixturesData?.message || initialFixturesData?.message || '데이터를 불러올 수 없습니다',
      seasonUsed: pageFixturesData?.seasonUsed,
      completeness: pageFixturesData?.completeness,
    };
  }, [pageFixturesData, initialFixturesData?.message]);

  const getMatchResult = (fixture: FixtureData): ResultType => {
    const playerTeamId = fixture.teams?.playerTeamId || null;
    const homeGoals = Number(fixture.goals?.home || 0);
    const awayGoals = Number(fixture.goals?.away || 0);

    if (homeGoals === awayGoals) return 'D';

    if (playerTeamId === fixture.teams?.home?.id) {
      return homeGoals > awayGoals ? 'W' : 'L';
    }

    if (playerTeamId === fixture.teams?.away?.id) {
      return awayGoals > homeGoals ? 'W' : 'L';
    }

    return homeGoals > awayGoals ? 'W' : 'L';
  };

  const { groupedFixtures, totalPages } = useMemo(() => {
    const sortedData = [...(fixturesData.data || [])].sort(
      (a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime()
    );
    const total = fixturesData.completeness?.total || sortedData.length;
    const pages = Math.ceil(total / ITEMS_PER_PAGE);
    const grouped = new Map<number, { league: { id: number; name: string; logo: string }; fixtures: FixtureData[] }>();

    sortedData.forEach((fixture) => {
      const leagueId = fixture.league.id;
      if (!grouped.has(leagueId)) {
        grouped.set(leagueId, {
          league: {
            id: fixture.league.id,
            name: fixture.league.name,
            logo: fixture.league.logo,
          },
          fixtures: [],
        });
      }
      grouped.get(leagueId)!.fixtures.push(fixture);
    });

    return {
      groupedFixtures: Array.from(grouped.values()).map((group) => ({
        ...group,
        fixtures: group.fixtures.sort(
          (a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime()
        ),
      })),
      totalPages: pages,
    };
  }, [fixturesData]);

  if (!fixturesData.data || fixturesData.data.length === 0) {
    return (
      <PlayerTabEmptyState
        title="경기별 통계"
        message={fixturesData.message || '경기 기록이 없습니다.'}
      />
    );
  }

  return (
    <div className={`space-y-4 ${isPageLoading ? 'pointer-events-none opacity-60' : ''}`}>
      {groupedFixtures.map((leagueGroup) => (
        <Container key={leagueGroup.league.id} className="mb-4 bg-white dark:bg-[#1D1D1D]">
          <ContainerHeader>
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
                <UnifiedSportsImageClient
                  src={getLeagueLogo(leagueGroup.league.id, leagueGroup.league.logo)}
                  alt={leagueGroup.league.name}
                  width={20}
                  height={20}
                  className="object-contain"
                />
              </div>
              <ContainerTitle className="truncate">
                {getLeagueKoreanName(leagueGroup.league.name) || leagueGroup.league.name}
              </ContainerTitle>
              <span className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
                ({[fixturesData.seasonUsed, `${leagueGroup.fixtures.length}경기`].filter(Boolean).join(' · ')})
              </span>
            </div>
          </ContainerHeader>

          <ContainerContent className="!p-0">
            <div className="divide-y divide-black/5 dark:divide-white/10">
              {leagueGroup.fixtures.map((fixture) => {
                const href = matchUrl(
                  fixture.fixture.id,
                  getMatchSlug(fixture.teams.home.name, fixture.teams.away.name)
                );
                const playerTeamId = fixture.teams.playerTeamId;
                const result = getMatchResult(fixture);
                const stats = fixture.statistics;
                const rating = stats?.games?.rating ? Number(stats.games.rating).toFixed(1) : '-';

                const statItems = [
                  { label: '출전', value: stats?.games?.minutes ? `${stats.games.minutes}'` : '-' },
                  { label: '평점', value: rating },
                  { label: '골', value: statValue(stats?.goals?.total) },
                  { label: '도움', value: statValue(stats?.goals?.assists) },
                  { label: '슈팅', value: statValue(stats?.shots?.total) },
                  { label: '유효', value: statValue(stats?.shots?.on) },
                  { label: '패스', value: statValue(stats?.passes?.total) },
                  { label: '키패스', value: statValue(stats?.passes?.key) },
                ];

                return (
                  <Link
                    key={fixture.fixture.id}
                    href={href}
                    className="block px-3 py-2.5 transition-colors hover:bg-[#EAEAEA] dark:hover:bg-[#333333] md:px-4 md:py-3"
                    prefetch={false}
                  >
                    <div className="mb-2 flex items-center text-[11px] text-gray-500 dark:text-gray-400 md:text-xs">
                      <span className="whitespace-nowrap">
                        {format(new Date(fixture.fixture.date), 'M월 d일 (E)', { locale: ko })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
                        <span className={`truncate text-right text-xs text-gray-900 dark:text-[#F0F0F0] md:text-[13px] ${playerTeamId === fixture.teams.home.id ? 'font-bold' : 'font-medium'}`}>
                          {getTeamName(fixture.teams.home.id, fixture.teams.home.name)}
                        </span>
                        <TeamLogo
                          name={fixture.teams.home.name}
                          logoUrl={getTeamLogo(fixture.teams.home.id, fixture.teams.home.logo)}
                        />
                      </div>

                      <span className={`inline-flex h-6 min-w-11 flex-shrink-0 items-center justify-center rounded-md px-2 text-xs font-bold md:h-7 md:min-w-12 md:text-[13px] ${getResultClass(result)}`}>
                        {fixture.goals.home ?? '-'} - {fixture.goals.away ?? '-'}
                      </span>

                      <div className="flex min-w-0 flex-1 items-center justify-start gap-1.5">
                        <TeamLogo
                          name={fixture.teams.away.name}
                          logoUrl={getTeamLogo(fixture.teams.away.id, fixture.teams.away.logo)}
                        />
                        <span className={`truncate text-left text-xs text-gray-900 dark:text-[#F0F0F0] md:text-[13px] ${playerTeamId === fixture.teams.away.id ? 'font-bold' : 'font-medium'}`}>
                          {getTeamName(fixture.teams.away.id, fixture.teams.away.name)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 grid grid-cols-4 gap-px overflow-hidden rounded-md bg-black/5 dark:bg-white/10 md:grid-cols-8">
                      {statItems.map((item) => (
                        <span
                          key={item.label}
                          className="flex min-w-0 flex-col items-center justify-center gap-0.5 bg-[#F5F5F5] px-1.5 py-1.5 text-[11px] text-gray-600 dark:bg-[#262626] dark:text-gray-300 md:text-xs"
                        >
                          <span className="truncate text-gray-500 dark:text-gray-400">{item.label}</span>
                          <span className="font-medium text-gray-900 dark:text-[#F0F0F0]">{item.value}</span>
                        </span>
                      ))}
                    </div>
                  </Link>
                );
              })}
            </div>
          </ContainerContent>
        </Container>
      ))}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        mode="button"
        maxButtons={5}
      />
    </div>
  );
}
