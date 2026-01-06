'use client';

import React, { useState, useRef, useEffect, useTransition } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarIcon, Search } from 'lucide-react';
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';
import { ImageType } from '@/shared/types/image';
import Calendar from '@/shared/components/Calendar';
import { getMatchesByDate } from '@/domains/boards/actions/matches';
import type { MatchData } from '@/domains/livescore/actions/footballApi';

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
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [calendar, setCalendar] = useState(false);
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const calendarButtonRef = useRef<HTMLButtonElement>(null);
  const [, startTransition] = useTransition();

  // 외부 클릭 감지 - 캘린더가 열려있을 때는 무시
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // 캘린더가 열려있으면 외부 클릭 무시
      if (calendar) return;

      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onCancel();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onCancel, calendar]);

  // 서버액션으로 경기 데이터 불러오기
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    const fetchMatches = async () => {
      try {
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        const data = await getMatchesByDate(formattedDate);
        setMatches(data || []);
      } catch {
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };
    startTransition(fetchMatches);
  }, [isOpen, selectedDate]);

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
      {/* 모바일 오버레이 */}
      <div
        className="fixed inset-0 bg-black/20 z-40 sm:hidden"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        ref={dropdownRef}
        className="z-50 bg-white dark:bg-[#1D1D1D] rounded-lg shadow-lg border border-black/7 dark:border-white/10 overflow-hidden fixed sm:absolute left-1/2 top-1/2 sm:left-0 sm:top-full -translate-x-1/2 -translate-y-1/2 sm:translate-x-0 sm:translate-y-0 w-[95vw] max-w-lg sm:w-[400px]"
        style={{ marginTop: '0.5rem' }}
      >
        <div className="bg-[#F5F5F5] dark:bg-[#262626] h-12 px-4 flex items-center">
          <h3 className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">경기 결과 선택</h3>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            <div className="flex space-x-2">
              {/* 날짜 선택 버튼 */}
              <div className="relative flex-1">
                <button
                  ref={calendarButtonRef}
                  type="button"
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
                  className="w-full flex items-center px-3 py-1.5 border border-black/7 dark:border-white/10 rounded-md bg-white dark:bg-[#1D1D1D] text-xs text-gray-900 dark:text-[#F0F0F0] hover:bg-[#F5F5F5] dark:hover:bg-[#262626] transition-colors outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                >
                  <CalendarIcon className="mr-2 h-3 w-3 text-gray-500 dark:text-gray-400" />
                  <span>{format(selectedDate, 'PPP (eee)', { locale: ko })}</span>
                </button>
              </div>
              
              {/* 검색 입력 필드 */}
              <div className="relative flex-1">
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Search size={12} />
                </div>
                <input
                  type="text"
                  placeholder="리그 또는 팀 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-7 pr-2 py-1.5 border border-black/7 dark:border-white/10 rounded-md text-xs bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] placeholder:text-gray-500 dark:placeholder:text-gray-400 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:bg-[#F5F5F5] dark:focus:bg-[#262626] transition-colors"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-h-[300px] overflow-y-auto px-4">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-gray-900"></div>
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
                  <div className="flex items-center mb-1">
                    <div className="w-5 h-5 relative mr-2 flex-shrink-0">
                      <UnifiedSportsImage
                        imageId={group.league.id}
                        imageType={ImageType.Leagues}
                        alt={group.league.name}
                        width={20}
                        height={20}
                        className="object-contain"
                      />
                    </div>
                    <h3 className="font-medium text-xs text-gray-900 dark:text-[#F0F0F0]">{group.league.name}</h3>
                  </div>
                  
                  <div className="space-y-1.5">
                    {group.matches.map((match: Match) => (
                      <button
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
                        className="w-full text-left border border-black/7 dark:border-white/10 rounded-md p-2 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center flex-1 min-w-0">
                            <div className="w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">
                              <UnifiedSportsImage
                                imageId={match.teams.home.id}
                                imageType={ImageType.Teams}
                                alt={match.teams.home.name}
                                width={24}
                                height={24}
                                className="w-6 h-6 object-contain"
                              />
                            </div>
                            <span className="text-xs truncate">{match.teams.home.name}</span>
                          </div>

                          <div className="mx-3 px-2 py-0.5 bg-[#EAEAEA] dark:bg-[#333333] rounded text-xs font-semibold flex-shrink-0 text-gray-900 dark:text-[#F0F0F0]">
                            {match.goals.home ?? '-'} - {match.goals.away ?? '-'}
                          </div>

                          <div className="flex items-center flex-1 justify-end min-w-0">
                            <span className="text-xs truncate">{match.teams.away.name}</span>
                            <div className="w-6 h-6 flex items-center justify-center ml-2 flex-shrink-0">
                              <UnifiedSportsImage
                                imageId={match.teams.away.id}
                                imageType={ImageType.Teams}
                                alt={match.teams.away.name}
                                width={24}
                                height={24}
                                className="w-6 h-6 object-contain"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-[10px] text-gray-500 mt-1.5">
                          {match.status.code === 'FT' ? '경기 종료' : 
                           match.status.code === 'NS' ? '경기 예정' : 
                           match.status.code === 'LIVE' || match.status.code === '1H' || match.status.code === '2H' ? (
                            <span className="text-green-600 font-medium">진행 중 {match.status.elapsed && `(${match.status.elapsed}')`}</span>
                           ) : match.status.name || ''}
                        </div>
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
            <button
              type="button"
              onClick={onCancel}
              className="bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] px-3 py-1.5 rounded-md text-xs transition-colors outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            >
              취소
            </button>
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