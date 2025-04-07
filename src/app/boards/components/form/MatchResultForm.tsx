'use client';

import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarIcon, Search, X } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/app/ui/button';

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
  elapsed?: number;
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
  onMatchAdd: (matchId: string, matchData: Match) => void;
  isOpen: boolean;
}

export default function MatchResultForm({ onCancel, onMatchAdd, isOpen }: MatchResultFormProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [calendar, setCalendar] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // 모달이 열릴 때 경기 데이터 로드
  useEffect(() => {
    // 경기 데이터 가져오기 함수를 useEffect 내부로 이동
    const fetchMatches = async () => {
      if (!isOpen) return;
      
      setLoading(true);
      try {
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        const response = await fetch(`/api/livescore/football?date=${formattedDate}`);
        const data = await response.json();
        
        if (data.success) {
          setMatches(data.data || []);
        } else {
          setMatches([]);
        }
      } catch (error) {
        console.error('경기 데이터 불러오기 실패:', error);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchMatches();
    }
  }, [isOpen, selectedDate]);

  // 날짜 변경 핸들러
  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
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
    <div 
      ref={dropdownRef}
      className="absolute z-10 bg-white rounded-lg shadow-lg border w-[400px] p-4 mt-2 right-0"
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
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 14 }).map((_, i) => {
                      const date = new Date();
                      date.setDate(date.getDate() - 7 + i);
                      const isSelected = date.toDateString() === selectedDate.toDateString();
                      
                      return (
                        <button
                          key={i}
                          type="button"
                          className={`p-1.5 text-center rounded-md hover:bg-gray-100 text-xs ${
                            isSelected ? 'bg-blue-100 text-blue-600' : ''
                          }`}
                          onClick={() => handleDateChange(date)}
                        >
                          <div className="text-[10px]">{format(date, 'E', { locale: ko })}</div>
                          <div>{date.getDate()}</div>
                        </button>
                      );
                    })}
                  </div>
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
                  <div className="w-4 h-4 relative mr-1.5">
                    <Image
                      src={group.league.logo || '/placeholder.png'}
                      alt={group.league.name}
                      width={20}
                      height={20}
                      className="mr-2 object-contain"
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
                        // 전체 경기 데이터 객체 구성
                        const matchId = (match.id || match.fixture?.id)?.toString() || '';
                        const matchData: Match = {
                          id: match.id,
                          fixture: match.fixture,
                          league: match.league,
                          teams: match.teams,
                          goals: match.goals,
                          status: match.status
                        };
                        console.log("전달할 경기 데이터:", matchData);
                        onMatchAdd(matchId, matchData); // 전체 객체 전달
                        onCancel();
                      }}
                      className="w-full text-left border rounded-md p-2 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1">
                          <div className="w-4 h-4 relative mr-1.5">
                            <Image
                              src={match.teams.home.logo || '/placeholder-team.png'}
                              alt={match.teams.home.name}
                              width={16}
                              height={16}
                              className="object-contain"
                            />
                          </div>
                          <span className="text-xs">{match.teams.home.name}</span>
                        </div>
                        
                        <div className="mx-1 px-2 py-0.5 bg-gray-100 rounded text-xs font-semibold">
                          {match.goals.home ?? '-'} - {match.goals.away ?? '-'}
                        </div>
                        
                        <div className="flex items-center flex-1 justify-end">
                          <span className="text-xs">{match.teams.away.name}</span>
                          <div className="w-4 h-4 relative ml-1.5">
                            <Image
                              src={match.teams.away.logo || '/placeholder-team.png'}
                              alt={match.teams.away.name}
                              width={16}
                              height={16}
                              className="object-contain"
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
  );
} 