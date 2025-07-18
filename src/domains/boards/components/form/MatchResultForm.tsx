'use client';

import React, { useState, useRef, useEffect, useTransition } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarIcon, Search, X } from 'lucide-react';
import Image from 'next/image';
import DatePicker from 'react-datepicker';
import ApiSportsImage from '@/shared/components/ApiSportsImage';
import { ImageType } from '@/shared/types/image';
import "react-datepicker/dist/react-datepicker.css";
import { Button } from '@/shared/ui';
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();

  // 외부 클릭 감지 - 이벤트 리스너 수정
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
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
  }, [isOpen, onCancel]);

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
        className={`z-50 bg-white rounded-lg shadow-lg border p-4
          fixed sm:absolute
          left-1/2 top-1/2 sm:left-0 sm:top-full
          -translate-x-1/2 -translate-y-1/2 sm:translate-x-0 sm:translate-y-0
          w-[95vw] max-w-lg sm:w-[400px]
        `}
        style={{ marginTop: '0.5rem' }}
      >
        <div className="border-b mb-4">
          <div className="flex justify-between items-center pb-2">
            <div className="text-sm font-medium">경기 결과 선택</div>
            <button
              type="button"
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex space-x-2">
            {/* 날짜 선택 버튼 */}
            <div className="relative flex-1">
              <button
                type="button"
                onClick={() => setCalendar(!calendar)}
                className="w-full flex items-center px-3 py-1.5 border rounded-md bg-white text-xs"
              >
                <CalendarIcon className="mr-2 h-3 w-3 text-gray-500" />
                <span>{format(selectedDate, 'PPP (eee)', { locale: ko })}</span>
              </button>
              
              {calendar && (
                <div className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded-md border z-10">
                  <div className="p-2">
                    <DatePicker
                      selected={selectedDate}
                      onChange={handleDateChange}
                      inline
                      locale={ko}
                      minDate={new Date(2024, 0, 1)}
                      maxDate={new Date(2025, 11, 31)}
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      calendarClassName="custom-datepicker"
                    />
                  </div>
                </div>
              )}
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
                className="w-full pl-7 pr-2 py-1.5 border rounded-md text-xs"
              />
            </div>
          </div>
        </div>
        
        <div className="max-h-[300px] overflow-y-auto">
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
                      <Image
                        src={group.league.logo || '/placeholder.png'}
                        alt={group.league.name}
                        fill
                        className="object-contain"
                        sizes="20px"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.png';
                        }}
                      />
                    </div>
                    <h3 className="font-medium text-xs">{group.league.name}</h3>
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
                        className="w-full text-left border rounded-md p-2 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center flex-1 min-w-0">
                            <div className="w-6 h-6 relative mr-2 flex-shrink-0">
                              {match.teams.home.logo ? (
                                <ApiSportsImage
                                  src={match.teams.home.logo}
                                  imageId={match.teams.home.id}
                                  imageType={ImageType.Teams}
                                  alt={match.teams.home.name}
                                  width={24}
                                  height={24}
                                  className="object-contain"
                                />
                              ) : (
                                <Image
                                  src="/placeholder-team.png"
                                  alt={match.teams.home.name}
                                  fill
                                  className="object-contain"
                                  sizes="24px"
                                />
                              )}
                            </div>
                            <span className="text-xs truncate">{match.teams.home.name}</span>
                          </div>
                          
                          <div className="mx-3 px-2 py-0.5 bg-gray-100 rounded text-xs font-semibold flex-shrink-0">
                            {match.goals.home ?? '-'} - {match.goals.away ?? '-'}
                          </div>
                          
                          <div className="flex items-center flex-1 justify-end min-w-0">
                            <span className="text-xs truncate">{match.teams.away.name}</span>
                            <div className="w-6 h-6 relative ml-2 flex-shrink-0">
                              {match.teams.away.logo ? (
                                <ApiSportsImage
                                  src={match.teams.away.logo}
                                  imageId={match.teams.away.id}
                                  imageType={ImageType.Teams}
                                  alt={match.teams.away.name}
                                  width={24}
                                  height={24}
                                  className="object-contain"
                                />
                              ) : (
                                <Image
                                  src="/placeholder-team.png"
                                  alt={match.teams.away.name}
                                  fill
                                  className="object-contain"
                                  sizes="24px"
                                />
                              )}
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
        
        <div className="flex justify-end space-x-2 mt-4 border-t pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="text-xs py-1 px-2 h-6"
          >
            취소
          </Button>
        </div>
      </div>
      
      {/* DatePicker 커스텀 스타일 */}
      <style jsx>{`
        :global(.custom-datepicker) {
          font-family: inherit;
          border: none;
          box-shadow: none;
        }
        
        :global(.react-datepicker) {
          font-family: inherit;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          box-shadow: none;
        }
        
        :global(.react-datepicker__header) {
          background-color: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          border-radius: 0.5rem 0.5rem 0 0;
          padding: 0.5rem;
        }
        
        :global(.react-datepicker__current-month) {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }
        
        :global(.react-datepicker__day-names) {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.25rem;
        }
        
        :global(.react-datepicker__day-name) {
          color: #6b7280;
          font-size: 0.75rem;
          font-weight: 500;
          width: 2rem;
          line-height: 1.5rem;
          text-align: center;
        }
        
        :global(.react-datepicker__month) {
          margin: 0.5rem;
        }
        
        :global(.react-datepicker__week) {
          display: flex;
          justify-content: space-between;
        }
        
        :global(.react-datepicker__day) {
          width: 2rem;
          height: 2rem;
          line-height: 2rem;
          text-align: center;
          font-size: 0.75rem;
          color: #374151;
          cursor: pointer;
          border-radius: 0.25rem;
          margin: 0.125rem 0;
          display: inline-block;
        }
        
        :global(.react-datepicker__day:hover) {
          background-color: #f3f4f6;
        }
        
        :global(.react-datepicker__day--selected) {
          background-color: #3b82f6;
          color: white;
        }
        
        :global(.react-datepicker__day--selected:hover) {
          background-color: #2563eb;
        }
        
        :global(.react-datepicker__day--today) {
          background-color: #dbeafe;
          color: #1d4ed8;
        }
        
        :global(.react-datepicker__day--outside-month) {
          color: #d1d5db;
        }
        
        :global(.react-datepicker__navigation) {
          top: 0.75rem;
          width: 1.5rem;
          height: 1.5rem;
          border: none;
          background: none;
          cursor: pointer;
        }
        
        :global(.react-datepicker__navigation--previous) {
          left: 0.75rem;
        }
        
        :global(.react-datepicker__navigation--next) {
          right: 0.75rem;
        }
        
        :global(.react-datepicker__navigation-icon::before) {
          border-color: #6b7280;
          border-width: 2px 2px 0 0;
          width: 0.5rem;
          height: 0.5rem;
        }
        
        :global(.react-datepicker__month-dropdown),
        :global(.react-datepicker__year-dropdown) {
          background-color: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.25rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        :global(.react-datepicker__month-option),
        :global(.react-datepicker__year-option) {
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          cursor: pointer;
        }
        
        :global(.react-datepicker__month-option:hover),
        :global(.react-datepicker__year-option:hover) {
          background-color: #f3f4f6;
        }
        
        :global(.react-datepicker__month-option--selected),
        :global(.react-datepicker__year-option--selected) {
          background-color: #3b82f6;
          color: white;
        }
      `}</style>
    </>
  );
} 