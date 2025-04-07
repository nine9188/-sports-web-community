'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import DateSelector from './components/DateSelector';
import CalendarButton from './components/CalendarButton';
import NavigationBar from './components/NavigationBar';
import LeagueMatchList from './components/LeagueMatchList';
import { Match } from './types';

export default function LivescorePage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
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

  // 경기 데이터를 가져오는 함수
  const fetchMatches = useCallback(async () => {
    setLoading(true);
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const response = await fetch(`/api/livescore/football?date=${formattedDate}`);
      const data = await response.json();
      
      if (data.success) {
        const allMatches = data.data;
        setMatches(allMatches);
        setLiveMatchCount(calculateLiveMatchCount(allMatches));
      }
    } catch {
      setMatches([]);
      setLiveMatchCount(0);
    }
    setLoading(false);
  }, [selectedDate]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches, showLiveOnly]);

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

  return (
    <div className="min-h-screen bg-white">
      <div className="flex w-full items-center border-b h-[60px] px-0">
        <div className="flex flex-1">
          <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </div>
        <CalendarButton onDateChange={setSelectedDate} />
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
          onDateChange={setSelectedDate}
        />
        
        <div className="px-0 py-4">
          {loading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <LeagueMatchList matches={filteredMatches} />
          )}
        </div>
      </div>
    </div>
  );
}