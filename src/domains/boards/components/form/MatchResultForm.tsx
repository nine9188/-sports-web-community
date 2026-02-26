'use client';

import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { useClickOutside } from '@/shared/hooks/useClickOutside';
import { ko } from 'date-fns/locale';
import { CalendarIcon, Search } from 'lucide-react';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';
import Calendar from '@/shared/components/Calendar';
import type { MatchData } from '@/domains/livescore/actions/footballApi';
import Spinner from '@/shared/components/Spinner';
import { Button } from '@/shared/components/ui';
import { useMatchesByDate } from '@/domains/boards/hooks/useMatchFormQueries';
import { DARK_MODE_LEAGUE_IDS } from '@/shared/utils/matchCard';
import { getTeamById } from '@/domains/livescore/constants/teams';
import { LEAGUE_NAMES_MAP } from '@/domains/livescore/constants/league-mappings';

// 4590 표준: placeholder 및 Storage URL
const TEAM_PLACEHOLDER = '/images/placeholder-team.svg';
const LEAGUE_PLACEHOLDER = '/images/placeholder-league.svg';
const SUPABASE_URL = 'https://vnjjfhsuzoxcljqqwwvx.supabase.co';

// 경기 데이터를 위한 인터페이스
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

interface Fixture {
  id: number | string;
  date?: string;
}

interface Goals {
  home: number | null;
  away: number | null;
}

interface Status {
  code: string;
  elapsed?: number | null;
  name?: string;
}

interface Match {
  id?: number | string;  // id는 선택적으로 변경
  fixture?: Fixture;
  league: League;
  teams: {
    home: Team;
    away: Team;
  };
  goals: Goals;
  status: Status;
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

export default function MatchResultForm({ onCancel, onMatchAdd, isOpen }: MatchResultFormProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [calendar, setCalendar] = useState(false);
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const calendarButtonRef = useRef<HTMLButtonElement>(null);

  // 4590 표준: 다크모드 감지
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // React Query로 경기 데이터 관리 (4590 표준: Storage URL 포함)
  const formattedDate = format(selectedDate, 'yyyy-MM-dd');
  const {
    data: matches = [],
    isLoading: loading,
    teamLogoUrls,
  } = useMatchesByDate(formattedDate, { enabled: isOpen });

  // 4590 표준: URL 헬퍼 함수 (리그는 다크모드 지원, 직접 Storage URL 생성)
  const getTeamLogo = (id: number | string) => {
    const numId = typeof id === 'string' ? parseInt(id, 10) : id;
    return teamLogoUrls[numId] || TEAM_PLACEHOLDER;
  };
  const getLeagueLogo = (id: number | string) => {
    const numId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (!numId) return LEAGUE_PLACEHOLDER;
    const hasDarkMode = DARK_MODE_LEAGUE_IDS.includes(numId);
    if (isDark && hasDarkMode) {
      return `${SUPABASE_URL}/storage/v1/object/public/leagues/${numId}-1.png`;
    }
    return `${SUPABASE_URL}/storage/v1/object/public/leagues/${numId}.png`;
  };

  // 외부 클릭 감지 - 캘린더가 열려있을 때는 무시
  useClickOutside(dropdownRef, onCancel, isOpen && !calendar);

  // 날짜 변경 핸들러
  const handleDateChange = (date: Date | null) => {
    if (!date) return;
    setSelectedDate(date);
    setCalendar(false);
  };

  // 검색 필터링 
  const filteredMatches = matches.filter(match => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      match.league?.name?.toLowerCase().includes(query) ||
      match.teams?.home?.name?.toLowerCase().includes(query) ||
      match.teams?.away?.name?.toLowerCase().includes(query)
    );
  });

  // 경기 그룹화 (리그별)
  const groupedMatches = filteredMatches.reduce((acc: Record<string | number, LeagueGroup>, match) => {
    const leagueId = match.league.id;
    if (!acc[leagueId]) {
      acc[leagueId] = {
        league: match.league,
        matches: []
      };
    }
    acc[leagueId].matches.push(match);
    return acc;
  }, {});

  if (!isOpen) return null;

  return (
    <>
      <div
        ref={dropdownRef}
        className="bg-white dark:bg-[#1D1D1D] border-x border-black/7 dark:border-white/10 overflow-hidden w-full"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="bg-[#F5F5F5] dark:bg-[#262626] h-12 px-4 flex items-center">
          <h3 className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">경기 결과 선택</h3>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            <div className="flex space-x-2">
              {/* 날짜 선택 버튼 */}
              <div className="relative flex-1">
                <Button
                  ref={calendarButtonRef}
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    if (!calendar && calendarButtonRef.current) {
                      const rect = calendarButtonRef.current.getBoundingClientRect();
                      setCalendarPosition({
                        top: rect.bottom + 4,
                        left: Math.max(8, rect.left),
                      });
                    }
                    setCalendar(!calendar);
                  }}
                  className="w-full h-9 flex items-center px-3 text-xs justify-start"
                >
                  <CalendarIcon className="mr-2 h-3 w-3 text-gray-500 dark:text-gray-400" />
                  <span>{format(selectedDate, 'PPP (eee)', { locale: ko })}</span>
                </Button>
              </div>
              
              {/* 검색 입력 필드 */}
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Search size={14} />
                </div>
                <input
                  type="text"
                  placeholder="리그 또는 팀 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-8 pr-3 border border-black/7 dark:border-white/10 rounded-md text-xs bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] placeholder:text-gray-500 dark:placeholder:text-gray-400 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:bg-[#F5F5F5] dark:focus:bg-[#262626] transition-colors"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-h-[300px] overflow-y-auto px-4">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Spinner size="md" />
            </div>
          ) : Object.keys(groupedMatches).length === 0 ? (
            <div className="text-center py-6 text-gray-500 text-xs">
              {searchQuery ? '검색 결과가 없습니다.' : '해당 날짜에 경기가 없습니다.'}
            </div>
          ) : (
            <div className="space-y-4">
              {/* 리그별로 그룹화된 경기 목록 */}
              {Object.values(groupedMatches).map((group: LeagueGroup) => (
                <div key={group.league.id} className="space-y-1.5">
                  {/* 리그 헤더 */}
                  <div className="flex items-center px-2 py-1.5 bg-[#F5F5F5] dark:bg-[#262626] border border-black/7 dark:border-white/10 rounded-md">
                    <div className="w-5 h-5 relative mr-2 flex-shrink-0">
                      <UnifiedSportsImageClient
                        src={getLeagueLogo(group.league.id)}
                        alt={group.league.name}
                        width={20}
                        height={20}
                        className="object-contain"
                      />
                    </div>
                    <h3 className="font-medium text-xs text-gray-900 dark:text-[#F0F0F0]">
                      {LEAGUE_NAMES_MAP[typeof group.league.id === 'number' ? group.league.id : Number(group.league.id)] || group.league.name}
                    </h3>
                  </div>
                  
                  <div className="space-y-1.5">
                    {group.matches.map((match: Match) => (
                      <button
                        type="button"
                        key={match.id || match.fixture?.id}
                        onClick={() => {
                          const matchId = (match.id || match.fixture?.id)?.toString() || '';
                          // MatchData 타입에 맞게 변환
                          const matchData: MatchData = {
                            id: typeof match.id === 'number' ? match.id : Number(match.id) || 0,
                            status: {
                              code: match.status.code,
                              name: match.status.name ?? '',
                              elapsed: match.status.elapsed ?? null,
                            },
                            time: {
                              timestamp: 0, // 실제 timestamp로 교체 필요 (match.fixture?.timestamp 등)
                              date: match.fixture?.date ?? '',
                              timezone: '', // 필요시 추가
                            },
                            league: {
                              id: typeof match.league.id === 'number' ? match.league.id : Number(match.league.id) || 0,
                              name: match.league.name,
                              country: '', // 필요시 추가
                              logo: match.league.logo,
                              flag: '', // 필요시 추가
                            },
                            teams: {
                              home: {
                                id: typeof match.teams.home.id === 'number' ? match.teams.home.id : Number(match.teams.home.id) || 0,
                                name: match.teams.home.name,
                                logo: match.teams.home.logo,
                                winner: 'winner' in match.teams.home ? (match.teams.home as { winner: boolean | null }).winner : null,
                              },
                              away: {
                                id: typeof match.teams.away.id === 'number' ? match.teams.away.id : Number(match.teams.away.id) || 0,
                                name: match.teams.away.name,
                                logo: match.teams.away.logo,
                                winner: 'winner' in match.teams.away ? (match.teams.away as { winner: boolean | null }).winner : null,
                              },
                            },
                            goals: {
                              home: match.goals.home ?? 0,
                              away: match.goals.away ?? 0,
                            },
                          };
                          onMatchAdd(matchId, matchData);
                          onCancel();
                        }}
                        className="w-full block bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-white/10 rounded-md p-2 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] cursor-pointer transition-colors"
                      >
                        {(() => {
                          // 팀 한국어 이름 가져오기
                          const homeTeamId = typeof match.teams.home.id === 'number' ? match.teams.home.id : Number(match.teams.home.id);
                          const awayTeamId = typeof match.teams.away.id === 'number' ? match.teams.away.id : Number(match.teams.away.id);
                          const homeTeamData = getTeamById(homeTeamId);
                          const awayTeamData = getTeamById(awayTeamId);
                          const homeTeamName = homeTeamData?.name_ko || match.teams.home.name;
                          const awayTeamName = awayTeamData?.name_ko || match.teams.away.name;

                          return (
                            <div className="flex items-center">
                              {/* 홈팀 영역 */}
                              <div className="flex-1 flex items-center min-w-0">
                                <div className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0">
                                  <UnifiedSportsImageClient
                                    src={getTeamLogo(match.teams.home.id)}
                                    alt={homeTeamName}
                                    width={24}
                                    height={24}
                                    className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
                                  />
                                </div>
                                <span className="text-[11px] sm:text-xs truncate ml-1.5">{homeTeamName}</span>
                              </div>

                              {/* 스코어 + 상태 (가운데) */}
                              <div className="flex flex-col items-center flex-shrink-0 mx-2">
                                <div className="px-2 sm:px-3 py-0.5 bg-[#EAEAEA] dark:bg-[#333333] rounded text-[11px] sm:text-xs font-semibold text-gray-900 dark:text-[#F0F0F0]">
                                  {match.goals.home ?? '-'} - {match.goals.away ?? '-'}
                                </div>
                                <div className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 whitespace-nowrap">
                                  {match.status.code === 'FT' ? '경기 종료' :
                                   match.status.code === 'NS' ? '경기 예정' :
                                   match.status.code === 'LIVE' || match.status.code === '1H' || match.status.code === '2H' ? (
                                    <span className="text-green-600 dark:text-green-400 font-medium">진행 중{match.status.elapsed && ` (${match.status.elapsed}')`}</span>
                                   ) : match.status.name || ''}
                                </div>
                              </div>

                              {/* 원정팀 영역 */}
                              <div className="flex-1 flex items-center justify-end min-w-0">
                                <span className="text-[11px] sm:text-xs truncate mr-1 text-right">{awayTeamName}</span>
                                <div className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0">
                                  <UnifiedSportsImageClient
                                    src={getTeamLogo(match.teams.away.id)}
                                    alt={awayTeamName}
                                    width={24}
                                    height={24}
                                    className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-black/7 dark:border-white/10">
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="text-xs"
            >
              취소
            </Button>
          </div>
        </div>
      </div>

      {/* 캘린더 모달 - 버튼 아래에 표시 */}
      {calendar && (
        <div
          className="fixed inset-0 z-[200]"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setCalendar(false);
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div
            className="absolute"
            style={{
              top: calendarPosition.top,
              left: calendarPosition.left,
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <Calendar
              selectedDate={selectedDate}
              onDateSelect={handleDateChange}
              onClose={() => setCalendar(false)}
              minDate={new Date(2024, 0, 1)}
              maxDate={new Date(2026, 11, 31)}
            />
          </div>
        </div>
      )}
    </>
  );
} 