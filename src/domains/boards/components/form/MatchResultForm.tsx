'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { addDays, format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';
import type { MatchData } from '@/domains/livescore/actions/footballApi';
import { useMatchesByDate } from '@/domains/boards/hooks/useMatchFormQueries';
import { DARK_MODE_LEAGUE_IDS } from '@/shared/utils/matchCard';
import { useTeamLeague } from '@/shared/context/TeamLeagueContext';
import { leagueLogoUrl, normalizeDisplayImageUrl } from '@/shared/images/urls';

const TEAM_PLACEHOLDER = '/images/placeholder-team.svg';
const LEAGUE_PLACEHOLDER = '/images/placeholder-league.svg';

interface League {
  id: number | string;
  name: string;
  logo: string;
}

interface Team {
  id: number | string;
  name: string;
  logo: string;
}

interface Match {
  id?: number | string;
  fixture?: {
    id: number | string;
    date?: string;
  };
  league: League;
  teams: {
    home: Team & { winner?: boolean | null };
    away: Team & { winner?: boolean | null };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  status: {
    code: string;
    elapsed?: number | null;
    name?: string;
  };
}

interface LeagueGroup {
  league: League;
  matches: Match[];
}

interface MatchResultFormProps {
  onCancel: () => void;
  onMatchAdd: (matchId: string, matchData: MatchData) => void;
  isOpen: boolean;
}

function getStatusLabel(match: Match) {
  const code = match.status.code;

  if (code === 'FT') return '종료';
  if (code === 'NS') return '예정';
  if (code === 'LIVE' || code === '1H' || code === '2H') {
    return match.status.elapsed ? `${match.status.elapsed}'` : '진행';
  }

  return match.status.name || code;
}

export default function MatchResultForm({ onCancel, onMatchAdd, isOpen }: MatchResultFormProps) {
  const { getTeamById, getLeagueName } = useTeamLeague();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (dropdownRef.current?.contains(event.target as Node)) return;
      onCancel();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen, onCancel]);

  const formattedDate = format(selectedDate, 'yyyy-MM-dd');
  const {
    data: matches = [],
    isLoading,
    teamLogoUrls,
  } = useMatchesByDate(formattedDate, { enabled: isOpen });

  const groupedMatches = useMemo(() => {
    return matches.reduce((acc: Record<string | number, LeagueGroup>, match: Match) => {
      const leagueId = match.league.id;
      if (!acc[leagueId]) {
        acc[leagueId] = {
          league: match.league,
          matches: [],
        };
      }
      acc[leagueId].matches.push(match);
      return acc;
    }, {});
  }, [matches]);

  const getTeamLogo = (id: number | string) => {
    const numId = typeof id === 'string' ? parseInt(id, 10) : id;
    return normalizeDisplayImageUrl(teamLogoUrls[numId], { fallback: TEAM_PLACEHOLDER });
  };

  const getLeagueLogo = (id: number | string) => {
    const numId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (!numId) return LEAGUE_PLACEHOLDER;

    if (isDark && DARK_MODE_LEAGUE_IDS.includes(numId)) {
      return normalizeDisplayImageUrl(leagueLogoUrl(numId, { dark: true }), { fallback: LEAGUE_PLACEHOLDER });
    }

    return normalizeDisplayImageUrl(leagueLogoUrl(numId), { fallback: LEAGUE_PLACEHOLDER });
  };

  const handleSelectMatch = (match: Match) => {
    const matchId = (match.id || match.fixture?.id)?.toString() || '';
    const numericMatchId = Number(match.id || match.fixture?.id) || 0;
    const homeId = typeof match.teams.home.id === 'number' ? match.teams.home.id : Number(match.teams.home.id) || 0;
    const awayId = typeof match.teams.away.id === 'number' ? match.teams.away.id : Number(match.teams.away.id) || 0;
    const leagueId = typeof match.league.id === 'number' ? match.league.id : Number(match.league.id) || 0;
    const homeName = getTeamById(homeId)?.name_ko || match.teams.home.name;
    const awayName = getTeamById(awayId)?.name_ko || match.teams.away.name;
    const leagueName = getLeagueName(leagueId);

    const matchData: MatchData = {
      id: numericMatchId,
      status: {
        code: match.status.code,
        name: match.status.name ?? '',
        elapsed: match.status.elapsed ?? null,
      },
      time: {
        timestamp: 0,
        date: match.fixture?.date ?? '',
        timezone: '',
      },
      league: {
        id: leagueId,
        name: leagueName === '알 수 없는 리그' ? match.league.name : leagueName,
        country: '',
        logo: getLeagueLogo(leagueId),
        flag: '',
      },
      teams: {
        home: {
          id: homeId,
          name: homeName,
          logo: getTeamLogo(homeId),
          winner: match.teams.home.winner ?? null,
        },
        away: {
          id: awayId,
          name: awayName,
          logo: getTeamLogo(awayId),
          winner: match.teams.away.winner ?? null,
        },
      },
      goals: {
        home: match.goals.home ?? 0,
        away: match.goals.away ?? 0,
      },
    };

    onMatchAdd(matchId, matchData);
    onCancel();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="w-full overflow-hidden rounded-md border border-black/10 bg-white shadow-lg dark:border-white/10 dark:bg-[#1D1D1D]"
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex h-11 items-center gap-2 border-b border-black/7 bg-[#F5F5F5] px-2 dark:border-white/10 dark:bg-[#262626]">
        <button
          type="button"
          onClick={() => setSelectedDate((date) => addDays(date, -1))}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded text-gray-700 hover:bg-[#EAEAEA] dark:text-gray-200 dark:hover:bg-[#333333]"
          aria-label="이전 날짜"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          onClick={() => setSelectedDate(new Date())}
          className="flex h-8 min-w-0 flex-1 items-center justify-center gap-1.5 rounded px-2 text-[12px] font-semibold text-gray-900 hover:bg-[#EAEAEA] dark:text-[#F0F0F0] dark:hover:bg-[#333333]"
          aria-label="오늘"
        >
          <CalendarDays size={14} />
          <span className="truncate">{format(selectedDate, 'M월 d일 (EEE)', { locale: ko })}</span>
        </button>
        <button
          type="button"
          onClick={() => setSelectedDate((date) => addDays(date, 1))}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded text-gray-700 hover:bg-[#EAEAEA] dark:text-gray-200 dark:hover:bg-[#333333]"
          aria-label="다음 날짜"
        >
          <ChevronRight size={16} />
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded text-gray-600 hover:bg-[#EAEAEA] dark:text-gray-300 dark:hover:bg-[#333333]"
          aria-label="닫기"
        >
          <X size={16} />
        </button>
      </div>

      <div className="max-h-[360px] overflow-y-auto p-2">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-md bg-[#F5F5F5] dark:bg-[#262626]" />
            ))}
          </div>
        ) : Object.keys(groupedMatches).length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-500 dark:text-gray-400">
            해당 날짜에 경기가 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {Object.values(groupedMatches).map((group) => {
              const leagueId = typeof group.league.id === 'number' ? group.league.id : Number(group.league.id);
              const leagueName = getLeagueName(leagueId);

              return (
                <div key={group.league.id} className="space-y-1">
                  <div className="flex items-center gap-2 px-1.5 py-1">
                    <UnifiedSportsImageClient
                      src={getLeagueLogo(group.league.id)}
                      alt={group.league.name}
                      width={18}
                      height={18}
                      fallbackSrc={LEAGUE_PLACEHOLDER}
                      className="h-[18px] w-[18px] object-contain"
                    />
                    <span className="truncate text-[12px] font-semibold text-gray-900 dark:text-[#F0F0F0]">
                      {leagueName === '알 수 없는 리그' ? group.league.name : leagueName}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {group.matches.map((match) => {
                      const homeId = typeof match.teams.home.id === 'number' ? match.teams.home.id : Number(match.teams.home.id);
                      const awayId = typeof match.teams.away.id === 'number' ? match.teams.away.id : Number(match.teams.away.id);
                      const homeName = getTeamById(homeId)?.name_ko || match.teams.home.name;
                      const awayName = getTeamById(awayId)?.name_ko || match.teams.away.name;
                      const statusLabel = getStatusLabel(match);

                      return (
                        <button
                          key={match.id || match.fixture?.id}
                          type="button"
                          onClick={() => handleSelectMatch(match)}
                          className="grid w-full grid-cols-[minmax(0,1fr)_68px_minmax(0,1fr)] items-center gap-2 rounded-md border border-black/7 bg-white px-2 py-2 text-left hover:bg-[#F5F5F5] dark:border-white/10 dark:bg-[#1D1D1D] dark:hover:bg-[#262626]"
                        >
                          <span className="flex min-w-0 items-center gap-1.5">
                            <UnifiedSportsImageClient
                              src={getTeamLogo(match.teams.home.id)}
                              alt={homeName}
                              width={22}
                              height={22}
                              fallbackSrc={TEAM_PLACEHOLDER}
                              className="h-[22px] w-[22px] shrink-0 object-contain"
                            />
                            <span className="truncate text-[12px] text-gray-900 dark:text-[#F0F0F0]">{homeName}</span>
                          </span>

                          <span className="flex flex-col items-center">
                            <span className="rounded bg-[#EAEAEA] px-2 py-0.5 text-[12px] font-bold text-gray-900 dark:bg-[#333333] dark:text-[#F0F0F0]">
                              {match.goals.home ?? '-'} - {match.goals.away ?? '-'}
                            </span>
                            <span className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">{statusLabel}</span>
                          </span>

                          <span className="flex min-w-0 items-center justify-end gap-1.5">
                            <span className="truncate text-right text-[12px] text-gray-900 dark:text-[#F0F0F0]">{awayName}</span>
                            <UnifiedSportsImageClient
                              src={getTeamLogo(match.teams.away.id)}
                              alt={awayName}
                              width={22}
                              height={22}
                              fallbackSrc={TEAM_PLACEHOLDER}
                              className="h-[22px] w-[22px] shrink-0 object-contain"
                            />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
