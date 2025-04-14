'use client';

import { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import DateSelector from './DateSelector';
import CalendarButton from './CalendarButton';
import NavigationBar from './NavigationBar';
import LeagueMatchList from './LeagueMatchList';
import { Match } from '../../football/types';

interface FootballLiveScoreClientProps {
  initialMatches: Match[];
  initialDate: string;
}

export default function FootballLiveScoreClient({
  initialMatches,
  initialDate
}: FootballLiveScoreClientProps) {
  // 날짜 상태 초기화
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    return initialDate ? new Date(initialDate) : new Date();
  });
  
  // 초기 매치 데이터로 상태 초기화
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showLiveOnly, setShowLiveOnly] = useState(false);
  const [liveMatchCount, setLiveMatchCount] = useState(0);

  // 전체 경기 데이터에서 현재 진행 중인 경기 수를 계산
  const calculateLiveMatchCount = (matches: Match[]) => {
    return matches.filter(match => 
      match.status.code === 'LIVE' || 
      match.status.code === 'IN_PLAY' || 
      match.status.code === '1H' || 
      match.status.code === '2H' || 
      match.status.code === 'HT'
    ).length;
  };

  // 컴포넌트 마운트 시 실시간 경기 수 계산
  useEffect(() => {
    setLiveMatchCount(calculateLiveMatchCount(initialMatches));
  }, [initialMatches]);

  // 날짜 변경 시 API 요청
  const fetchMatches = useCallback(async (date: Date) => {
    setLoading(true);
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const response = await fetch(`/api/livescore/football?date=${formattedDate}`);
      const data = await response.json();
      
      if (data.success) {
        const allMatches = data.data;
        setMatches(allMatches);
        setLiveMatchCount(calculateLiveMatchCount(allMatches));
      }
    } catch (error) {
      console.error('경기 데이터 불러오기 오류:', error);
      setMatches([]);
      setLiveMatchCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // 날짜가 변경될 때 데이터 다시 불러오기
  useEffect(() => {
    // 초기 렌더링이 아닌 경우에만 API 호출
    if (format(selectedDate, 'yyyy-MM-dd') !== initialDate) {
      fetchMatches(selectedDate);
    }
  }, [fetchMatches, selectedDate, initialDate]);

  // 실시간 경기만 보기 토글 시 현재 날짜로 설정
  useEffect(() => {
    if (showLiveOnly) {
      fetchMatches(new Date());
    }
  }, [showLiveOnly, fetchMatches]);

  // 필터링된 매치 목록
  const filteredMatches = matches.filter(match => {
    // LIVE 필터
    if (showLiveOnly) {
      const isLive = match.status.code === 'LIVE' || 
                    match.status.code === 'IN_PLAY' || 
                    match.status.code === '1H' || 
                    match.status.code === '2H' || 
                    match.status.code === 'HT';
      if (!isLive) return false;
    }
    
    // 검색어 필터
    if (searchKeyword) {
      const searchLower = searchKeyword.toLowerCase();
      return match.league.name.toLowerCase().includes(searchLower) ||
             match.teams.home.name.toLowerCase().includes(searchLower) ||
             match.teams.away.name.toLowerCase().includes(searchLower);
    }
    return true;
  });

  // 날짜 변경 핸들러
  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
    if (showLiveOnly) {
      setShowLiveOnly(false);
    }
  };

  return (
    <div className="min-h-screen bg-white space-y-4">
      <div className="rounded-lg border border-gray-200 overflow-hidden mt-4 md:mt-0">
        <div className="flex w-full items-center h-[60px]">
          <div className="flex flex-1">
            <DateSelector selectedDate={selectedDate} onDateChange={handleDateChange} />
          </div>
          <div className="border-l border-gray-200">
            <CalendarButton onDateChange={handleDateChange} />
          </div>
        </div>
      </div>

      <div>
        <NavigationBar
          searchKeyword={searchKeyword}
          showLiveOnly={showLiveOnly}
          liveMatchCount={liveMatchCount}
          onSearchChange={setSearchKeyword}
          onLiveClick={() => {
            setShowLiveOnly(!showLiveOnly);
            if (!showLiveOnly) {
              setSelectedDate(new Date());
            }
          }}
          onDateChange={handleDateChange}
        />
      </div>
        
      <div>
        {loading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <LeagueMatchList matches={filteredMatches} />
        )}
      </div>
    </div>
  );
} 